#!/usr/bin/env python3
import asyncio
import logging
import socket
import struct
import traceback
import math
import shared_data
import re

import nats

ANGULAR_RES=4096
RANGE_RES=512
image_map = []
packet = b''
fullRotation = False
heading = 0
indexes = range(ANGULAR_RES)
scale = struct.pack("H", int(shared_data.radar_range / 10 * math.sqrt(2)))

async def update_heading(parsed_args):
  global heading
  logger = logging.getLogger(update_heading.__name__)
  logger.info("listening for heading updates")
  nc = await nats.connect(parsed_args['nats_url'])
  while True:
    try:
      js = nc.jetstream()
      break
    except:
      await asyncio.sleep(3)

  while True:
    try:
      kv = await js.key_value(bucket='MATRIX')
      break
    except:
      traceback.print_exc()
      await asyncio.sleep(3)
  w = await kv.watch("heading")
  while True:
    try:
      e = await w.updates(timeout=10)
      if e is not None:
        val = struct.unpack("f", e.value)[0]
        heading = round(ANGULAR_RES * val / 360.0)
    except nats.errors.TimeoutError:
        pass
  
def build_packet(index, scanLineCounter, radar_range):
  global image_map
  global packet
  global heading
  scale = struct.pack("H", int(radar_range / 10 * math.sqrt(2)))
  scanLine = struct.pack("<h", index)
  packet = packet + b'\x18\x02'
  packet = packet + scanLine
  packet = packet + b'\x00\x44\x0d\x0e'
  packet = packet + scanLine
  packet = packet + b'\x34\x92'
  packet = packet + scale
  packet = packet + b'\x00\x01\x00\x44\x59\x13\x00\x40\x00\xcb'
  packet = packet + image_map[scanLineCounter]
  
async def send_radar(parsed_args):
  global image_map
  global packet
  radarAddress = ("236.6.7.8", 6678)
  logger = logging.getLogger(send_radar.__name__)
  loop = asyncio.get_running_loop()
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as radarsock:
    radarsock.setblocking(False)
    radarsock.bind(radarAddress)
    radarsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR,1)
    if 'multicast_if' in parsed_args and parsed_args['multicast_if'] is not None:
      logger.info('Set multicast if to %s', parsed_args['multicast_if'])
      radarsock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(str(parsed_args['multicast_if'])))
    # wait for the matrix to be init
    while fullRotation == False:
      logger.info("Waiting for the matrix...")
      await asyncio.sleep(3)
    
    packet_header = b'\x01\x00\x00\x00\x00\x20\x00\x02'

    k = 0
    packet = packet_header
    while True:
        for i in range(ANGULAR_RES):
            if k == 32:
                k = 0
                await loop.sock_sendto(radarsock, packet, radarAddress)
                logger.debug(f'Sent{len(packet)} bytes to{radarAddress}')
                packet = packet_header
                await asyncio.sleep(0.019)
            offset = int((i + heading) % ANGULAR_RES)
            build_packet(i, offset, shared_data.radar_range)
            k += 1

async def radar_receiver(parsed_args):
  global image_map
  global fullRotation
  logger = logging.getLogger(radar_receiver.__name__)
  logger.info(f'Connecting to NATS at %s', parsed_args['nats_url'])
  nc = await nats.connect(parsed_args['nats_url'])
  logger.info(f'Connected to NATS at %s', parsed_args['nats_url'])
  
  while True:
    try:
      js = nc.jetstream()
      break
    except:
      logger.info(f'Waiting for Stream')
      await asyncio.sleep(3)
  
  while True:
    try:
      kv = await js.key_value(bucket='MATRIX')
      for i in range(ANGULAR_RES):
        await kv.purge("line"+str(i))
      break
    except:
      traceback.print_exc()
      logger.info(f'Waiting for bucket')
      await asyncio.sleep(3)

  logger.info(f'Connected to bucket MATRIX')
  image_map = [b'\x00'*RANGE_RES] * ANGULAR_RES

  while not fullRotation:
    for i in range(ANGULAR_RES):
      try:
        key = "line" + str(i)
        entry = await kv.get(key)
        image_map[i] = entry.value
        if i == ANGULAR_RES-1:
          fullRotation = True
      except nats.js.errors.KeyNotFoundError:
        logger.warning('Key not found: %s', f'line{i}')
        await asyncio.sleep(0.1)

  logger.info('Full rotation received')
  w = await kv.watchall()
  line_n_re = re.compile(r'line(?P<n>[0-9]+)')
  while True:
    try:
      entry = await w.updates(timeout = 10)
      if entry is None: continue
      m = line_n_re.match(entry.key)
      if m is None: continue
      i = int(m.group('n'))
      image_map[i] = entry.value
    except TimeoutError:
      logger.warning('No updates')

cell_length = 1

async def update_cell_length(parsed_args):
  global cell_length
  logger = logging.getLogger(update_heading.__name__)
  logger.info("listening for cell length updates")
  
  nc = await nats.connect(parsed_args['nats_url'])
  while True:
    try:
      js = nc.jetstream()
      break
    except:
      await asyncio.sleep(3)

  while True:
    try:
      kv = await js.key_value(bucket='MATRIX')
      break
    except:
      traceback.print_exc()
      await asyncio.sleep(3)
  w = await kv.watch("cell")
  while True:
    try:
      e = await w.updates(timeout=10)
      if e is not None:
        cell_length = struct.unpack("f", e.value)[0]
        logger.info(f'New cell length {cell_length}')
    except nats.errors.TimeoutError:
        pass

async def send_asterix(parsed_args):
  global image_map
  global packet
  radarAddress = (parsed_args['asterix_address'], int(parsed_args['asterix_port']))
  logger = logging.getLogger(send_radar.__name__)
  logger.info('Will send ASTERIX to %s', radarAddress)
  loop = asyncio.get_running_loop()
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as radarsock:
    radarsock.setblocking(False)

    if 'multicast_if' in parsed_args and parsed_args['multicast_if'] is not None:
      logger.info('Set multicast if to %s', parsed_args['multicast_if'])
      radarsock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(str(parsed_args['multicast_if'])))

    # ASTERIX category
    packet_header = b'\xf0' # 240
    # ASTERIX length
    # mettere range resolution parametrica
    required_medium_video_blocks = math.ceil(RANGE_RES / 64)
    asterix_len = 1 # CAT
    asterix_len += 2 # LEN
    asterix_len += 2 # FPSPEC
    asterix_len += 2 # 240/010
    asterix_len += 1 # 240/000
    asterix_len += 8 # 240/020
    asterix_len += 4 + 4 + 8 + 8 # 240/040
    asterix_len += 2 # 240/048
    asterix_len += 4 + 5 # 240/049
    asterix_len += 1 + 64 * required_medium_video_blocks # 240/051
    asterix_len = 544
    packet_header += struct.pack('>H', asterix_len)
    # ASTERIX fpspec
    packet_header += b'\xeb\xa0' 
    # ASTERIX data source identifier
    packet_header += b'\x00\x00'
    # ASTERIX message type
    packet_header += b'\x02'
    
    AZIMUTH_DIVISOR = 360.0/65536.0

    # wait for the matrix to be init
    while fullRotation == False:
      logger.info("Waiting for the matrix...")
      await asyncio.sleep(3)
    logger.info('Got matrix')

    while True:
      for i in range(ANGULAR_RES):
        packet = packet_header
        packet += struct.pack(">I", i)
        
        # ASTERIX video header nano
        current_scan_angle = i * 360 / ANGULAR_RES
        start_azimuth = round(current_scan_angle / AZIMUTH_DIVISOR)
        packet += struct.pack(">H", start_azimuth)

        end_scan_angle = ((i+1) % ANGULAR_RES) * 360 / ANGULAR_RES
        end_azimuth = round(end_scan_angle / AZIMUTH_DIVISOR)
        packet += struct.pack(">H", end_azimuth)
        
        packet += b'\x00\x00\x00\x00'
        
        cell_duration = 2 * cell_length / 299792458.0 / (1/1000000000.0)
        packet += struct.pack(">I", int(cell_duration))
        
        # ASTERIX video resolution & data compression indicator
        packet += b'\x00\x04'

        # ASTERIX video octets & video cell counters
        # prendere la range resolution via env
        packet += struct.pack(">H", RANGE_RES)
        packet += struct.pack(">I", RANGE_RES)[1:]
        
        # ASTERIX video block medium data volume
        packet += struct.pack("B", required_medium_video_blocks)

        packet += image_map[i]
        await loop.sock_sendto(radarsock, packet, radarAddress)
        logger.debug(f'Sent {len(packet)} bytes to{radarAddress}')
        await asyncio.sleep(0.0006)
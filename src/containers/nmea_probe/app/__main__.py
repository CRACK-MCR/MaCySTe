#!/usr/bin/env python3
import asyncio
import decimal
import ipaddress
import logging
import os
import re
import socket
import struct
import traceback

from datetime import datetime

import aiohttp
import pyais
import pynmea2

from pynmea2.nmea_utils import LatLonFix

async def send_to_opensearch(queue: asyncio.Queue):
  logger = logging.getLogger(send_to_opensearch.__name__)
  url = os.getenv('OPENSEARCH_URL')
  async with aiohttp.ClientSession() as session:
    while True:
      msg_json = await queue.get()
      while True:
        t = datetime.now().strftime('%Y-%m-%d')
        try:
          r = await session.post(url + '/nmea-' + t + '/_doc', json = msg_json, auth = aiohttp.BasicAuth('admin', 'admin'), ssl = False)
          logger.debug(f'Sent to OpenSearch {msg_json}')
          break
        except:
          traceback.print_exc()
          await asyncio.sleep(1.0)

async def listen_udp(queue: asyncio.Queue):
  logger = logging.getLogger(listen_udp.__name__)
  host_ip = ipaddress.ip_address(os.getenv('NMEA_HOST'))
  host_port = int(os.getenv('NMEA_PORT'))
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP) as sock:
    sock.setblocking(False)
    if host_ip.is_multicast:
      sock.bind(('', host_port))
      mreq = struct.pack("4sl", socket.inet_aton(host_ip.exploded), socket.INADDR_ANY)
      sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)
    else:
      sock.bind((host_ip.exploded, host_port))
    loop = asyncio.get_running_loop()
    while True:
      packet, addr = await loop.sock_recvfrom(sock, 65536)
      logger.debug(f'Received {len(packet)} bytes from {addr}')
      await queue.put((datetime.now(), packet, addr))

is_float_re = re.compile(r'^[-]?[0-9]+[.][0-9]+')
is_int_re = re.compile(r'^[-]?[0-9]+')
def postprocess_field(x):
  if isinstance(x, bytes):
    return x.decode(errors = 'replace')
  elif isinstance(x, str):
    if len(x) == 0:
      return None
    elif is_float_re.match(x) is not None:
      return float(x)
    elif is_int_re.match(x) is not None:
      return int(x)
  elif isinstance(x, decimal.Decimal):
    return float(x)
  return x

def decode_ais(nmea_parts):
  msg_json = {}
  data = pyais.decode(*nmea_parts)
  data = { k : postprocess_field(v) for k,v in data.asdict().items() }
  msg_json.update(data)
  msg_json['talker'] = nmea_parts[0][1:3]
  msg_json['sentence_type'] = nmea_parts[0][3:6]
  msg_json['is_own_ship'] = nmea_parts[0][3:6] == b'VDO'
  msg_json = {
    k : postprocess_field(v)
    for k,v in msg_json.items()
  }
  return msg_json

def decode_nmea(nmea):
  msg_json = {}
  data = pynmea2.parse(nmea)
  msg_json['talker'] = data.talker
  msg_json['sentence_type'] = data.sentence_type
  msg_json['is_own_ship'] = True
  for field in data.fields:
    field_name = field[1]
    msg_json[field_name] = getattr(data, field_name)
  if isinstance(data, LatLonFix):
    msg_json['lat'] = data.latitude
    del msg_json['lat_dir']
    msg_json['lon'] = data.longitude
    del msg_json['lon_dir']
  msg_json = {
    k : postprocess_field(v)
    for k,v in msg_json.items()
  }
  return msg_json

ais_re = re.compile(r'^[!]..(VDM|VDM),(?P<n>[0-9]+),(?P<i>[0-9]+),.+')
async def dispatch_nmea(nmea_queue: asyncio.Queue, opensearch_queue: asyncio.Queue):
  logger = logging.getLogger(dispatch_nmea.__name__)
  ais_buffer = [None]
  loop = asyncio.get_running_loop()
  while True:
    t, nmea, addr = await nmea_queue.get()
    nmea = nmea.decode('ASCII').strip()
    nmea_json = {
      '@timestamp': t.isoformat(),
      'source': {
        'ip': str(addr[0]),
        'port': addr[1],
      },
    }
    if nmea.startswith('!'):
      nmea_parts = nmea.split(',')
      size = int(nmea_parts[1])
      index = int(nmea_parts[2])
      if index == 1:
        ais_buffer = [None] * size
      nmea = nmea.encode('ASCII')
      ais_buffer[index-1] = nmea
      if not any([ x is None for x in ais_buffer ]):
        try:
          data = await loop.run_in_executor(None, decode_ais, ais_buffer)
          nmea_json.update(data)
          ais_buffer = [None]
          await opensearch_queue.put(nmea_json)
          logger.debug(f'Parsed AIS {nmea_json}')
        except:
          logger.exception('Could not parse AIS')
    else:
      try:
        data = await loop.run_in_executor(None, decode_nmea, nmea)
        nmea_json.update(data)
        await opensearch_queue.put(nmea_json)
        logger.debug(f'Parsed NMEA {nmea_json}')
      except:
        logger.exception('Could not parse NMEA')

async def main():
  nmea_queue = asyncio.Queue()
  opensearch_queue = asyncio.Queue()
  await asyncio.gather(
    listen_udp(nmea_queue),
    dispatch_nmea(nmea_queue, opensearch_queue),
    send_to_opensearch(opensearch_queue),
  )

if __name__ == '__main__':
  logging.basicConfig(level = logging.DEBUG)
  asyncio.run(main())

import asyncio
import logging
import socket
import struct
import shared_data

import nats

async def updateRadarConfig(parsed_args, range = b'\xee\x02\x00\x00'):
  updateRadarConfigAddress = ("236.6.7.9", 6679)
  loop = asyncio.get_running_loop()
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as radarsock:
    radarsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR,1)
    req = struct.pack("=4s4s", socket.inet_aton("236.6.7.8"), socket.inet_aton(parsed_args['bind_interface']))
    radarsock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, req)
    radarsock.bind((parsed_args['bind_interface'], 6679))
    
    turnOnPacket = b"\x02\xc4" + range + b"\x00\x00\x01\x00\x00\x00\xad\x01\x00\x00\x00\xd3\x00\x00\x00\x00\x8e\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x06\x09\x00\x00\xbf\x00\x00\x00\x00\x00\x00\xc8\x00\x00\x00\x2c\x01\x00\x00\x00\x00\xe1\x00\x00\x00\x00\x00\x20\x03\x00\x00\x40\x06\x00\x00\x00\x00\xc2\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    await loop.sock_sendto(radarsock, turnOnPacket, updateRadarConfigAddress)
    
async def multicast_listener(parsed_args):
  logger = logging.getLogger(multicast_listener.__name__)
  loop = asyncio.get_running_loop()
  LISTEN_HOST = "236.6.7.10"
  LISTEN_PORT = 6680
  buffer_size = parsed_args['buffer_size']
  LISTEN_INTERFACE = parsed_args['bind_interface']
  nc = await nats.connect(parsed_args['nats_url'])
  waiting_time = 10

  logger.info(f'Listening on {LISTEN_HOST}:{LISTEN_PORT} on interface {LISTEN_INTERFACE}')

  with socket.socket(family=socket.AF_INET, type=socket.SOCK_DGRAM) as sock:
    req = struct.pack("=4s4s", socket.inet_aton(LISTEN_HOST), socket.inet_aton(LISTEN_INTERFACE))
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, req)
    sock.bind(('', LISTEN_PORT))
    sock.setblocking(False)
    while True:
      # wait for zoom or status packet
      try:
        recv = await asyncio.wait_for(loop.sock_recv(sock, buffer_size), waiting_time)
        if(len(recv) == 6):
          value = int(struct.unpack("i", recv[2:])[0] / 10 )
          if value >= 926 and value <= 22224:
            await updateRadarConfig(parsed_args, recv[2:])
            shared_data.radar_range = value
            await nc.publish("radar.ZOOM", str(value).encode('ascii'))
        else:
          logger.debug(f"Received {recv} which is of {len(recv)} bytes")
      except TimeoutError:
        logger.info("No signal from PPI")
        # if no packet is received, send turn on packet
        await updateRadarConfig(parsed_args, struct.pack('i', shared_data.radar_range * 10))
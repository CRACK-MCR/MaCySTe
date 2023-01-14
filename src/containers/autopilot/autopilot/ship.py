import asyncio
import logging
import os
import socket
import struct

from state import AUTOPILOT_STATE

import pynmea2
from pynmea2.types.talker import APB, HDT, VTG, XTE

async def listen_nmea():
  logger = logging.getLogger(listen_nmea.__name__)
  bind_host = os.getenv('NMEA_HOST', '0.0.0.0')
  bind_port = int(os.getenv('NMEA_PORT', 10110))
  bind_addr = (bind_host, bind_port)
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(bind_addr)
    logger.info('Listening for NMEA on %s', bind_addr)
    sock.setblocking(False)

    mreq = struct.pack("4sl", socket.inet_aton(bind_host), socket.INADDR_ANY)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_ADD_MEMBERSHIP, mreq)

    loop = asyncio.get_running_loop()
    while True:
      nmea = await loop.sock_recv(sock, 255)
      try:
        sentence = pynmea2.parse(nmea.decode(errors = 'ignore'), check = False)
        if isinstance(sentence, APB):
          AUTOPILOT_STATE.track_control_xte = float(sentence.cross_track_err_mag)
          AUTOPILOT_STATE.track_control_xte_direction_to_steer = sentence.dir_steer
          AUTOPILOT_STATE.track_control_set_heading = float(sentence.heading_to_dest)
        elif isinstance(sentence, HDT):
          AUTOPILOT_STATE.heading = float(sentence.heading)
        elif isinstance(sentence, VTG):
          if sentence.spd_over_grnd_kts is not None:
            AUTOPILOT_STATE.speed = float(sentence.spd_over_grnd_kts)
        elif isinstance(sentence, XTE):
          AUTOPILOT_STATE.track_control_xte = float(sentence.cross_track_err_dist)
          AUTOPILOT_STATE.track_control_xte_direction_to_steer = sentence.correction_dir
        else:
          logger.debug(f'Ignored {sentence}')
      except ValueError:
        logger.exception('Falied parsing NMEA')
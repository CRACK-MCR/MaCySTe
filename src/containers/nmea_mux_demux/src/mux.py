#!/usr/bin/env python3
import asyncio
import logging
import socket
import ipaddress
import re

from typing import Tuple

from address import AddressAndPort

import nats

async def mux_listen(bind_address: AddressAndPort, buffer_size: int, queue: asyncio.Queue):
  logger = logging.getLogger(mux_listen.__name__)
  loop = asyncio.get_running_loop()
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(bind_address.as_tuple)
    sock.setblocking(False)
    while True:
      recv = await loop.sock_recv(sock, buffer_size)
      print(f'\nSENTENCE: {recv}')
      for split in recv.split(b'\r\n'):
        if len(split) == 0: continue
        split += b'\r\n'
        await queue.put(split)
        logger.debug(f'Received {len(split)} bytes on socket {bind_address}')

async def mux_publish(parsed_args, queue: asyncio.Queue):
  logger = logging.getLogger(mux_publish.__name__)
  nmea_pattern = re.compile(rb'^[!$](?P<sender>..)(?P<sentence_type>...),.+')
  nc = await nats.connect(parsed_args['nats_url'])
  logger.info(f'Connected to NATS at %s', parsed_args['nats_url'])

  senderini = set([])

  while True:
    received = await queue.get()

    m = nmea_pattern.match(received)
    if m is None:
      logger.warning(f'Could not parse {received} with {len(received)} bytes')
      continue
    sender = m.group('sender').decode(errors = 'ignore')
    sentence_type = m.group('sentence_type').decode(errors = 'ignore')
    subjects = ((
      parsed_args['base_topic'] + '.sender.' + sender,
      parsed_args['base_topic'] + '.sentence.' + sentence_type,
    ))
    senderini.add(sender)
    logger.debug(f"\nSENDERINI: {senderini} \n")
    logger.debug(f'Publishing {len(received)} bytes on topics {subjects}')
    for coro in asyncio.as_completed({ nc.publish(subject, received) for subject in subjects }):
      _ = await coro
    logger.debug(f'Published {len(received)} bytes to message queue')

async def mux_main(parsed_args):
  logger = logging.getLogger(mux_main.__name__)
  # Spawn listen tasks
  receive_queue = asyncio.Queue()
  listen_tasks = []
  for address in parsed_args['bind_address']:
    task = asyncio.create_task(mux_listen(address, parsed_args['buffer_size'], receive_queue))
    listen_tasks.append(task)
    logger.info(f'Listening on {address}')
  # Spawn publish task
  publish_task = asyncio.create_task(mux_publish(parsed_args, receive_queue))
  # Await any for failure
  done, pending = await asyncio.wait([ *listen_tasks, publish_task ], return_when = asyncio.FIRST_EXCEPTION)
  for fut in done:
    fut.result()
  for fut in pending:
    fut.cancel()
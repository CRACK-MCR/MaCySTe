#!/usr/bin/env python3
import asyncio
import ipaddress
import logging
import socket
import re
from typing import List, Tuple

import nats
from nats.aio.msg import Msg
from nats.aio.subscription import Subscription

from address import AddressAndPort

async def demux_send(parsed_args, destination_address: AddressAndPort, queue: asyncio.Queue):
  logger = logging.getLogger(demux_send.__name__)
  loop = asyncio.get_running_loop()

  nmea_pattern = re.compile(rb'^[!$](?P<sender>..)(?P<sentence_type>...),.+')

  bind_interface = parsed_args['bind_address'].as_tuple
  with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
    sock.bind(bind_interface)
    sock.setblocking(False)

    if parsed_args['broadcast']:
      sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
      logger.debug('Set SO_BROADCAST to 1')

    if parsed_args['multicast_loop']:
      sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_LOOP, 1)
      logger.debug('Set IP_MULTICAST_LOOP to 1')

    if parsed_args['multicast_ttl'] != 1:
      sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, parsed_args['multicast_ttl'])
      logger.debug('Set IP_MULTICAST_TTL to ' + str(parsed_args['multicast_ttl']))

    if parsed_args['multicast_if'] is not None:
      sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(str(parsed_args['multicast_if'])))
      logger.debug('Set IP_MULTICAST_IF to ' + str(parsed_args['multicast_if']))

    while True:
      to_send = await queue.get()
      for split in to_send.split(b'\r\n'):
        if len(split) == 0: continue
        split += b'\r\n'
        m = nmea_pattern.match(split)
        if m is None:
          logger.warning(f'Could not parse {split}')
          continue
        split = re.sub(rb'(\r\n)+', b'\r\n', split)
        logger.info(split)
        await loop.sock_sendto(sock, split, destination_address.as_tuple)
        logger.debug(f'Sent {len(split)} bytes to {destination_address}')

async def demux_subscribe(parsed_args, queues: List[asyncio.Queue]):
  logger = logging.getLogger(demux_subscribe.__name__)
  nc = await nats.connect(parsed_args['nats_url'])
  logger.info(f'Connected to NATS at %s', parsed_args['nats_url'])
  async def forward_to_queue(message: Msg):
    nonlocal logger
    sub_logger = logger.getChild(forward_to_queue.__name__)
    done, completed = await asyncio.wait({ asyncio.create_task(queue.put(message.data)) for queue in queues }, return_when = asyncio.FIRST_EXCEPTION)
    for fut in done:
      _ = fut.result()
    for fut in completed:
      _ = fut.result()
    sub_logger.debug(f'Enqueued {len(message.data)} bytes')
  subscriptions: List[Subscription] = []
  if parsed_args['all']:
    subject = parsed_args['base_topic'] + '.sentence.*'
    subscriptions.append(await nc.subscribe(subject, cb = forward_to_queue))
    logger.info('Listening for every NMEA sentence')
  else:
    for sentence in parsed_args['sentence']:
      subject = parsed_args['base_topic'] + '.sentence.' + sentence
      subscriptions.append(await nc.subscribe(subject, cb = forward_to_queue))
      logger.info(f'Listening for {sentence} NMEA sentence')
    for sender in parsed_args['sender']:
      subject = parsed_args['base_topic'] + '.sender.' + sender
      subscriptions.append(await nc.subscribe(subject, cb = forward_to_queue))
      logger.info(f'Listening for {sender} NMEA sender')
  while True:
    await nc.flush()
    await asyncio.sleep(10.0)

async def demux_main(parsed_args):
  # Send tasks
  send_tasks = []
  send_queues = []
  for send_address in parsed_args['send_address']:
    send_queue = asyncio.Queue()
    send_queues.append(send_queue)
    send_task = asyncio.create_task(demux_send(parsed_args, send_address, send_queue))
    send_tasks.append(send_task)
  # Subscribe tasks
  done, pending = await asyncio.wait([ *send_tasks, asyncio.create_task(demux_subscribe(parsed_args, send_queues)) ], return_when = asyncio.FIRST_EXCEPTION)
  for fut in done:
    _ = fut.result()
  for fut in pending:
    fut.cancel()

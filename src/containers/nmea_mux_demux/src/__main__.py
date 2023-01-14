#!/usr/bin/env python3
import argparse
import asyncio
import ipaddress
import logging
import os

from address import AddressAndPort
from demux import demux_main
from mux import mux_main

async def main(parsed_args):
  subcommand = parsed_args['subcommand']
  match subcommand:
    case 'mux':
      await mux_main(parsed_args)
    case 'demux':
      await demux_main(parsed_args)
    case other:
      raise RuntimeError(f'Unexpected subcommand value {subcommand}')

if __name__ == '__main__':
  parser = argparse.ArgumentParser()
  parser.add_argument('--base-topic', default = os.environ.get('BASE_TOPIC', 'nmea'), help = 'Base topic to use for NATS')
  parser.add_argument('--nats-url', default = os.environ.get('NATS_URL', 'nats://localhost:4222'), help = 'URL for connecting to NATS')
  parser.add_argument('--verbose', default = bool(os.environ.get('VERBOSE', False)), action = 'store_true', help = 'Enable verbose logging')

  subcommand = parser.add_subparsers(dest = 'subcommand', help = 'Command', required = True)

  mux = subcommand.add_parser('mux', help = 'Multiplex streams')
  mux.add_argument('--bind-address', default = [ AddressAndPort.parse_nmea(os.environ.get('MUX_BIND_ADDRESS', [])) ] if 'MUX_BIND_ADDRESS' in os.environ else [] ,action = 'extend', nargs = '+', help = 'Where to bind the listening sockets', type = AddressAndPort.parse_nmea)
  mux.add_argument('--buffer-size', default = os.environ.get('MUX_BUFFER_SIZE', 17170), help = 'Buffer size to use', type = int)

  demux = subcommand.add_parser('demux', help = 'Demultiplex streams')
  demux.add_argument('--all', default = os.environ.get('DEMUX_ALL_STREAMS', False), action = 'store_true', help = 'Relay all sentences')
  demux.add_argument('--sentence', default = [os.environ.get('DEMUX_SENTENCE')] if 'DEMUX_SENTENCE' in os.environ and len(os.getenv('DEMUX_SENTENCE')) > 0 else [], action = 'extend', nargs = '+', help = 'Sentence to relay')
  demux.add_argument('--sender', default = [os.environ.get('DEMUX_SENDER')] if 'DEMUX_SENDER' in os.environ and len(os.getenv('DEMUX_SENDER')) > 0 else [], action = 'extend', nargs = '+', help = 'Sender to relay')

  demux.add_argument('--broadcast', default = os.environ.get('DEMUX_BROADCAST', False), action = 'store_true', help = 'Set socket in broadcast mode')
  demux.add_argument('--bind-address', default = AddressAndPort.parse_nmea(os.environ.get('DEMUX_BIND_ADDRESS', '0.0.0.0:0')), help = 'Where to bind the sockets', type = AddressAndPort.parse_nmea)
  demux.add_argument('--send-address', default = [ AddressAndPort.parse_nmea(os.environ.get('DEMUX_SEND_ADDRESS')) ] if 'DEMUX_SEND_ADDRESS' in os.environ else [], action = 'extend', nargs = '+', help = 'Where to send the data', type= AddressAndPort.parse_nmea)
  demux.add_argument('--multicast-loop', default = os.environ.get('DEMUX_MULTICAST_LOOP', False), action = 'store_true', help = 'Set socket IP_MULTICAST_LOOP option')
  demux.add_argument('--multicast-ttl', default = os.environ.get('DEMUX_MULTICAST_TTL', 1), help = 'Set socket IP_MULTICAST_TTL option')
  demux.add_argument('--multicast-if', default = os.environ.get('DEMUX_MULTICAST_IF', None) ,help = 'Set socket IP_MULTICAST_IF option', type = ipaddress.ip_address)

  parsed_args = vars(parser.parse_args())

  match parsed_args['verbose']:
    case False:
      logging.basicConfig(level = logging.INFO)
    case True:
      logging.basicConfig(level = logging.DEBUG)

  logging.debug(f'Parsed args:{parsed_args}')
  asyncio.run(main(parsed_args))

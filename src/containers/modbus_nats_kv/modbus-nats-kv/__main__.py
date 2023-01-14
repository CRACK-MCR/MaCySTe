import asyncio
import logging
import os
import sys

import nats
import nats.js
import nats.js.errors

from pymodbus.client import AsyncModbusTcpClient
from pymodbus.datastore import (
  ModbusSequentialDataBlock,
  ModbusServerContext,
  ModbusSlaveContext,
)
from pymodbus.payload import BinaryPayloadBuilder, BinaryPayloadDecoder
from pymodbus.server import StartAsyncTcpServer
from pymodbus.constants import Endian

HZ = float(os.getenv('LOOP_HZ', '5.0'))
INTERVAL = 1.0 / HZ

def env_map(var_name: str, mapper, default):
  var_value = os.getenv(var_name)
  if var_value is None or len(var_value) == 0:
    return default
  else:
    return mapper(var_value)

async def client():
  logger = logging.getLogger('client')
  host = os.getenv('MODBUS_HOST')
  port = int(os.getenv('MODBUS_PORT', '502'))
  client_port = int(os.getenv('MODBUS_CLIENT_PORT', '50200'))
  client_register = env_map('MODBUS_HOLDING_REGISTER', int, 0)

  openplc_compatible = True if os.getenv('OPENPLC_COMPATIBLE') == '1' else False
  only_on_value_change = True if os.getenv('ONLY_ON_VALUE_CHANGE') == '1' else False

  value = env_map('DEFAULT_VALUE', float, 0.0)
  value_changed = False
  multiplier = env_map('VALUE_MULTIPLIER', float, 1.0)

  async def watch_nats_kv():
    nonlocal value, value_changed
    nats_url = os.getenv('NATS_URL', 'nats://127.0.0.1:4222')
    nats_bucket = os.getenv('NATS_BUCKET', 'test')
    nats_key = os.getenv('NATS_KEY', 'test')
    nats_client = await nats.connect([ nats_url ])
    nats_js = nats_client.jetstream()
    nats_kv = None
    try:
      nats_kv = await nats_js.key_value(bucket = nats_bucket)
    except nats.js.errors.BucketNotFoundError:
      nats_kv = await nats_js.create_key_value(bucket = nats_bucket)
    watcher = await nats_kv.watch(nats_key)
    while True:
      try:
        e = await watcher.updates(timeout = 10)
        if e is None:
          continue
        value = float(e.value)
        value_changed = True
      except TimeoutError:
        logger.getChild(watch_nats_kv.__name__).debug('No updates')

  async def send_via_modbus():
    nonlocal value_changed
    while True:
      client = AsyncModbusTcpClient(host, port, source_address=('', client_port))
      if await client.connect() is None:
        logger.error('Failed to connect to PLC')
        await asyncio.sleep(INTERVAL)
        continue
      else:
        logger.info('Connected to PLC')
      while True:
        builder = BinaryPayloadBuilder(byteorder = Endian.Big, wordorder = Endian.Little)
        value_to_write = value * multiplier
        logger.debug('value * multiplier = %f', value_to_write)
        builder.add_32bit_float(value_to_write)
        registers = builder.to_registers()
        if only_on_value_change and not value_changed:
          logger.debug('Not changed')
          await asyncio.sleep(INTERVAL)
          continue
        value_changed = False
        if openplc_compatible:
          logger.debug('Writing to remote (addr = %s, val = %s)', client_register, int(registers[0]))
          await client.write_register(client_register, int(registers[0]), slave = 1)
          logger.debug('Writing to remote (addr = %s, val = %s)', client_register+1, int(registers[1]))
          await client.write_register(client_register+1, int(registers[1]), slave = 1)
        else:
          logger.debug('Writing %s to remote', registers)
          await client.write_registers(client_register, registers, slave = 1)
        await asyncio.sleep(INTERVAL)

  await asyncio.gather(
    asyncio.create_task(watch_nats_kv()),
    asyncio.create_task(send_via_modbus()),
  )

async def server():
  logger = logging.getLogger('server')
  host = os.getenv('MODBUS_HOST')
  port = int(os.getenv('MODBUS_PORT', '502'))
  addr = (host, port)

  datablock = ModbusSequentialDataBlock(1, 2*[0])
  slave = ModbusSlaveContext(
    hr = datablock,
  )
  context = ModbusServerContext(slaves=slave, single = True)

  value = env_map('DEFAULT_VALUE', float, 0.0)

  async def send_to_nats():
    nats_url = os.getenv('NATS_URL', 'nats://127.0.0.1:4222')
    nats_topic = os.getenv('NATS_TOPIC', 'test')
    nats_client = await nats.connect([ nats_url ])
    while True:
      logger.getChild(watch.__name__).debug('Publishing value %f to NATS topic %s', value, nats_topic)
      await nats_client.publish(nats_topic, str(value).encode('UTF-8'))
      await asyncio.sleep(INTERVAL)

  async def watch():
    nonlocal value
    while True:
      payload = datablock.getValues(1, 2)
      decoder = BinaryPayloadDecoder.fromRegisters(payload, byteorder = Endian.Big, wordorder = Endian.Little)
      value = decoder.decode_32bit_float()
      logger.getChild(watch.__name__).debug('Current value: %f', value)
      await asyncio.sleep(INTERVAL)

  nats_task = asyncio.create_task(send_to_nats())
  watch_task = asyncio.create_task(watch())
  server_task = asyncio.create_task(StartAsyncTcpServer(context, address = addr))

  await asyncio.gather(
    nats_task,
    watch_task,
    server_task,
  )

async def main():
  logging.basicConfig(level = logging.DEBUG)
  logging.getLogger('pymodbus').setLevel(logging.DEBUG)
  match sys.argv[1]:
    case 'client': await client()
    case 'server': await server()

if __name__ == '__main__':
  asyncio.run(main())

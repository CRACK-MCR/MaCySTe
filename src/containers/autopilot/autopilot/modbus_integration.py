import asyncio
import logging
import os

from state import AUTOPILOT_STATE

from pymodbus.client import AsyncModbusTcpClient
from pymodbus.constants import Endian
from pymodbus.payload import BinaryPayloadBuilder

async def modbus_rudder(host: str, port: int, address: int):
  logger = logging.getLogger(modbus_rudder.__name__)
  while True:
    # Connect
    client = AsyncModbusTcpClient(host, port)
    if await client.connect() is None:
      logger.error('Failed to connect to PLC')
      await asyncio.sleep(1.0)
      continue
    logger.info('Connected to PLC')
    # Send
    while True:
      await asyncio.sleep(1.0)
      if AUTOPILOT_STATE.rudder_control is None: continue
      if not (AUTOPILOT_STATE.heading_control_enabled or AUTOPILOT_STATE.track_control_enabled): continue
      builder = BinaryPayloadBuilder(byteorder = Endian.Big, wordorder = Endian.Little)
      value = AUTOPILOT_STATE.rudder_control
      value *= 35.0
      if value >  35.0: value =  35.0
      if value < -35.0: value = -35.0
      builder.add_32bit_float(value)
      registers = builder.to_registers()
      await client.write_registers(address, registers, slave = 1)
      logger.debug('Writing %s to %s:%s address %s', value, host, port, address)

async def modbus_throttle(host: str, port: int, address: int):
  logger = logging.getLogger(modbus_throttle.__name__)
  while True:
    # Connect
    client = AsyncModbusTcpClient(host, port)
    if await client.connect() is None:
      logger.error('Failed to connect to PLC')
      await asyncio.sleep(1.0)
      continue
    logger.info('Connected to PLC')
    # Send
    while True:
      await asyncio.sleep(1.0)
      if AUTOPILOT_STATE.throttle_control is None: continue
      if not AUTOPILOT_STATE.speed_control_enabled: continue
      builder = BinaryPayloadBuilder(byteorder = Endian.Big, wordorder = Endian.Little)
      value = AUTOPILOT_STATE.throttle_control
      builder.add_32bit_float(value)
      registers = builder.to_registers()
      await client.write_registers(address, registers, slave = 1)
      logger.debug('Writing %s to %s:%s address %s', value, host, port, address)

async def modbus_integration():
  rudder_host = os.getenv('RUDDER_PLC_HOST')
  rudder_port = int(os.getenv('RUDDER_PLC_PORT'))
  rudder_addr = int(os.getenv('RUDDER_PLC_ADDR'))

  throttle_l_host = os.getenv('THROTTLE_L_PLC_HOST')
  throttle_l_port = int(os.getenv('THROTTLE_L_PLC_PORT'))
  throttle_l_addr = int(os.getenv('THROTTLE_L_PLC_ADDR'))

  throttle_r_host = os.getenv('THROTTLE_R_PLC_HOST')
  throttle_r_port = int(os.getenv('THROTTLE_R_PLC_PORT'))
  throttle_r_addr = int(os.getenv('THROTTLE_R_PLC_ADDR'))

  await asyncio.gather(
    asyncio.create_task(modbus_rudder(rudder_host, rudder_port, rudder_addr)),
    asyncio.create_task(modbus_throttle(throttle_l_host, throttle_l_port, throttle_l_addr)),
    asyncio.create_task(modbus_throttle(throttle_r_host, throttle_r_port, throttle_r_addr)),
  )

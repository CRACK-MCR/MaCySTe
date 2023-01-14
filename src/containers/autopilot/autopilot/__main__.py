import asyncio
import logging

from ap import Autopilot
from modbus_integration import modbus_integration
from nats_integration import nats_integration
from ship import listen_nmea

async def main():
  ap = Autopilot()
  ap_task = asyncio.create_task(ap.run_loop())
  modbus_task = asyncio.create_task(modbus_integration())
  nats_task = asyncio.create_task(nats_integration())
  listen_nmea_task = asyncio.create_task(listen_nmea())
  await asyncio.gather(
    ap_task,
    modbus_task,
    nats_task,
    listen_nmea_task,
  )

if __name__ == '__main__':
  logging.basicConfig(level = logging.DEBUG)
  logging.getLogger('pymodbus').setLevel(logging.DEBUG)
  asyncio.run(main())
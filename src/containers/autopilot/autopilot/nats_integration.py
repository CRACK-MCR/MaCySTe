import asyncio
import logging
import os
import re

from decimal import Decimal

from state import AUTOPILOT_STATE

import nats
import nats.js.kv

def to_nats(value):
  if value is None:
    return b'NULL'
  elif isinstance(value, bool):
    if value:
      return b'BOOL_TRUE'
    else:
      return b'BOOL_FALSE'
  elif isinstance(value, float):
    num = str(value)
    return to_nats(num)
  elif isinstance(value, str):
    return value.encode('utf-8')
  elif isinstance(value, Decimal):
    return to_nats(str(value))
  else:
    raise ValueError(value)

from_nats_num_re = re.compile(rb'(-)?([0-9]+)([.][0-9]+)?')
def from_nats(value):
  match value:
    case b'NULL':
      return None
    case b'BOOL_FALSE':
      return False
    case b'BOOL_TRUE':
      return True
    case data:
      if from_nats_num_re.match(value) is not None:
        return float(data.decode('utf-8'))
      else:
        return data.decode('utf-8')

def get_setattr_callback(
  loop: asyncio.AbstractEventLoop,
  kv: nats.js.kv.KeyValue,
):
  past_values = {}
  def setattr_callback(attribute, value):
    nonlocal past_values
    if attribute in past_values and past_values[attribute] == value:
      return
    past_values[attribute] = value
    loop.create_task(kv.put(attribute, to_nats(value))).add_done_callback(lambda t : logging.getLogger(nats_integration.__name__).getChild(setattr_callback.__name__).debug(f'Published to NATS (key = {attribute}, value = {value}, err = {t.exception()})'))
  return setattr_callback

async def nats_integration():
  logger = logging.getLogger(nats_integration.__name__)
  nc = await nats.connect(os.getenv('NATS_URL', 'nats://localhost:4222'))
  logger.info('Connected to NATS')
  js = nc.jetstream()
  kv = await js.create_key_value(bucket = os.getenv('NATS_BUCKET_NAME', 'autopilot'))
  AUTOPILOT_STATE.add_callback(get_setattr_callback(asyncio.get_running_loop(), kv))
  for k,v in AUTOPILOT_STATE.__dict__.items():
    if isinstance(v, (property, list)): continue
    if '_last_updated_' in k: continue
    try:
      _ = await kv.get(k)
    except:
      logger.debug(f'Putting {k} = {v}')
      await kv.put(k, to_nats(v))
  watcher = await kv.watchall()
  while True:
    try:
      e = await watcher.updates(timeout = 10)
      if e is None:
        continue
      k = e.key
      v = from_nats(e.value)
      if hasattr(AUTOPILOT_STATE, k):
        try:
          setattr(AUTOPILOT_STATE, k, v)
          logger.debug(f'Set {k} = {v} to state')
        except AttributeError:
          logger.warning(f'Not setting {k}')
      else:
        logger.debug(f'Received {k} = {v}')
    except TimeoutError:
      logger.info('No updates')



import asyncio
import logging
import nats
import queue
from threading import Thread

nats_queue = queue.SimpleQueue()

async def nats_publish(url, topic):
  global nats_queue
  logger = logging.getLogger(nats_publish.__name__)
  loop = asyncio.get_running_loop()
  nc = await nats.connect(url)
  print(f'Connected to NATS at %s', url)

  while True:
    values = nats_queue.get()
    for coro in asyncio.as_completed({ nc.publish(subject, value) for value, subject in values }):
        _ = await coro
    logger.debug(f'Published {len(values)} messages to message queue')

class NatsExporter:
  url: str
  topic: str
  queue: asyncio.Queue

  def __init__(self, url, topic):
    self.url = url
    self.topic = topic

  def run_nats(self):
    asyncio.run(nats_publish(self.url, self.topic))

  def start_nats(self):
    Thread(target=self.run_nats, daemon=True).start()

  def put_in_queue(self, value):
    global nats_queue
    nats_queue.put(value)
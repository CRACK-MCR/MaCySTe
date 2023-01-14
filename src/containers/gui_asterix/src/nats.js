'use strict';

import { connect, StringCodec } from "nats.ws"

import { getConfig } from "./config";

const codec = new StringCodec()
let natsClient = null

async function connectNATS() {
  const natsURL = await getConfig('/config/env/NATS_WS_URL')
  natsClient = await connect({ servers: [ natsURL ] })
  console.debug('Connected to NATS')
}

async function getNATSClient() {
  if(!natsClient) {
    await connectNATS()
  }
  return natsClient
}

export async function sendToNATS(topic, content) {
  const client = await getNATSClient()
  await client.publish(topic, codec.encode(content))
  console.debug('Sent to NATS', topic, content)
}


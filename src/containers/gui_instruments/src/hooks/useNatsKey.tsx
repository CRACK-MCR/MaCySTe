import { KvEntry, QueuedIterator, StringCodec } from "nats.ws";
import { useCallback, useContext, useEffect, useState } from "react";
import NatsContext from "../contexts/NatsContext";

type NatsValue = boolean | number | string | null

function fromNats(val: Uint8Array): NatsValue {
  const sc = StringCodec()
  const stringVal = sc.decode(val)
  switch (stringVal) {
    case 'NULL': return null
    case 'BOOL_TRUE': return true
    case 'BOOL_FALSE': return false
    default:
      try {
        const numberVal = parseFloat(stringVal)
        if (!isNaN(numberVal) && isFinite(numberVal)) return numberVal
      } catch (err) {}
      return stringVal
  }
}

function toNats(val: NatsValue): Uint8Array {
  switch (val) {
    case null: return toNats('NULL')
    case true: return toNats('BOOL_TRUE')
    case false: return toNats('BOOL_FALSE')
    default:
      if (typeof val === 'number') {
        return toNats(val.toString())
      } else {
        const sc = StringCodec()
        return sc.encode(val)
      }
  }
}

export default function useNatsKey(bucket: string, key: string): [ NatsValue, (value: NatsValue) => void ] {
  const natsContext = useContext(NatsContext)
  const [ value, setValue ] = useState<NatsValue>(null)
  // Subscribe and watch for key
  useEffect(() => {
    if (!natsContext.client) {
      return
    }
    const js = natsContext.client.jetstream()
    let unsub: QueuedIterator<KvEntry> | null = null;
    const sub = async () => {
      const kv = await js.views.kv(bucket, { bindOnly: false })
      console.debug('Connected to KV', bucket)
      // Grab initial value
      const initialKey = await kv.get(key)
      if (initialKey) {
        setValue(fromNats(initialKey.value))
        console.debug('Got initial KV', bucket, key, fromNats(initialKey.value))
      }
      // Watch
      const keyIterator = await kv.watch({ key })
      unsub = keyIterator
      for await (const entry of keyIterator) {
        setValue(fromNats(entry.value))
        console.debug('Got KV update', entry.bucket, entry.key, fromNats(entry.value))
      }
    }
    sub().catch(err => console.error('KV error', err))
    return () => {
      if (unsub) unsub.stop()
    }
  }, [ natsContext.client, bucket, key ])
  // Callback for setting keys
  const setKey = useCallback((what: NatsValue) => {
    if (!natsContext.client) {
      console.warn('NATS client not yet available')
      return
    }
    const js = natsContext.client.jetstream()
    const pub = async () => {
      const kv = await js.views.kv(bucket)
      await kv.put(key, toNats(what))
      console.debug('Published KV', bucket, key, what)
    }
    pub().catch(err => console.error('Publish failed', err))
  }, [ natsContext.client, bucket, key ])
  return [ value, setKey ]
}
import { connect, ConnectionOptions, NatsConnection } from "nats.ws";
import { useEffect, useState } from "react";

export default function useNatsClient(connectOpts: ConnectionOptions): NatsConnection | null {
  const [nats, setNats] = useState<NatsConnection | null>(null);
  useEffect(() => {
    let client: NatsConnection | undefined; 
    const conn = async () => {
      client = await connect(connectOpts)
      if (client) {
        console.log('Connected to NATS')
        setNats(client)
      }
    }
    conn().catch(err => console.error('Failed connecting to NATS', err))
    return () => {
      if (client) {
        console.debug('Closing NATS connection')
        client.drain()
          .then(_ => console.log('Closed NATS connection'))
        setNats(null)
      }
    };
  }, [ connectOpts ]);
  return nats;
}
import { NatsConnection } from "nats.ws"
import React from "react"

interface INatsContext {
  client: NatsConnection | null
}

const NatsContext = React.createContext<INatsContext>({
  client: null
})

export default NatsContext
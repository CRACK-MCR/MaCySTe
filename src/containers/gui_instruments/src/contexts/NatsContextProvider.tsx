import { ConnectionOptions } from "nats.ws";
import NatsContext from "./NatsContext";
import useNatsClient from "../hooks/useNatsClient";

export default function NatsContextProvider({ connectOpts, children }: { connectOpts: ConnectionOptions, children: React.ReactNode }) {
  const client = useNatsClient(connectOpts)
  return (
    <NatsContext.Provider value={{ client }}>
      {children}
    </NatsContext.Provider>
  )
}

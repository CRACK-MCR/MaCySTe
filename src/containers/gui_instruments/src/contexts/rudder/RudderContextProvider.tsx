import { useEffect } from "react"
import DefaultConfig from "../../DefaultConfig"
import useEnvConfig from "../../hooks/useEnvConfig"
import useNatsKey from "../../hooks/useNatsKey"
import RudderContext from "./RudderContext"

export default function RudderContextProvider({ children }: { children: React.ReactNode }) {
  const rudderBucket = useEnvConfig('NATS_RUDDER_BUCKET', DefaultConfig.natsRudderBucket)
  const rudderKey = useEnvConfig('NATS_RUDDER_KEY', DefaultConfig.natsRudderKey)
  const [ rudder, setRudder ] = useNatsKey(rudderBucket as string, rudderKey as string)
  // useEffect(() => {
  //   if (!rudder) {
  //     console.debug('Centering rudder')
  //     setRudder(0.0)
  //   }
  // }, [ rudder, setRudder ])
  return (
    <RudderContext.Provider
      value={{
        position: (rudder as number) ?? 0.0,
        setPosition: (position) => setRudder(position),
      }}
    >
      {children}
    </RudderContext.Provider>
  )
}
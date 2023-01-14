import React, { useCallback, useEffect } from "react";
import DefaultConfig from "../../DefaultConfig";
import useEnvConfig from "../../hooks/useEnvConfig";
import useNatsKey from "../../hooks/useNatsKey";
import TwinThrottleContext from "./TwinThrottleContext";

export default function TwinThrottleContextProvider({ children }: { children: React.ReactNode }) {
  const throttleBucket = useEnvConfig('NATS_THROTTLE_BUCKET', DefaultConfig.natsThrottleBucket)
  const throttleLKey = useEnvConfig('NATS_L_THROTTLE_KEY', DefaultConfig.natsLThrottleKey)
  const throttleRKey = useEnvConfig('NATS_R_THROTTLE_KEY', DefaultConfig.natsRThrottleKey)
  const [ lThrottle, setLThrottle ] = useNatsKey(throttleBucket as string, throttleLKey as string)
  const [ rThrottle, setRThrottle ] = useNatsKey(throttleBucket as string, throttleRKey as string)
  // useEffect(() => {
  //   if (!lThrottle) {
  //     console.debug('Centering L throttle')
  //     setLThrottle(0.0)
  //   }
  // }, [ lThrottle, setLThrottle ])
  // useEffect(() => {
  //   if (!rThrottle) {
  //     console.debug('Centering R throttle')
  //     setRThrottle(0.0)
  //   }
  // }, [ rThrottle, setRThrottle ])
  const setLThrottleCallback = useCallback((t: number) => setLThrottle(t), [ setLThrottle ])
  const setRThrottleCallback = useCallback((t: number) => setRThrottle(t), [ setRThrottle ])
  return (
    <TwinThrottleContext.Provider value={{
      lThrottle: {
        currentThrottle: (lThrottle as number) ?? 0.0,
        setThrottle: setLThrottleCallback
      },
      rThrottle: {
        currentThrottle: (rThrottle as number) ?? 0.0,
        setThrottle: setRThrottleCallback
      },
    }}>
      {children}
    </TwinThrottleContext.Provider>
  )
}
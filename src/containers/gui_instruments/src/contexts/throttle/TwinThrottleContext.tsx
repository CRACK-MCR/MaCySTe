import React from "react"
import { IThrottleContext } from "./ThrottleContext"

export interface ITwinThrottleContext {
  lThrottle: IThrottleContext,
  rThrottle: IThrottleContext,
}

const TwinThrottleContext = React.createContext<ITwinThrottleContext>({
  lThrottle: {
    currentThrottle: 0,
    setThrottle: (t) => {}
  },
  rThrottle: {
    currentThrottle: 0,
    setThrottle: (t) => {}
  },
})

export default TwinThrottleContext
import React from "react"

export interface IThrottleContext {
  currentThrottle: number,
  setThrottle: (throttle: number) => void,
}

const ThrottleContext = React.createContext<IThrottleContext>({
  currentThrottle: 0,
  setThrottle: (throttle: number) => {}
})

export default ThrottleContext

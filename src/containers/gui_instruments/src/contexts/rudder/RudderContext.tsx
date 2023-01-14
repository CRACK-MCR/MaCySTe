import React from "react"

export interface IRudderContext {
  position: number,
  setPosition: (position: number) => void,
}

const RudderContext = React.createContext({
  position: 0,
  setPosition: (position: number) => {}
})

export default RudderContext
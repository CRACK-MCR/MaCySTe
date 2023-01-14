import { useContext } from "react"
import { useMemo } from "react"
import { AutopilotStateContext } from "../../contexts/autopilot/AutopilotStateContext"
import { ILEDPanelElement, State } from "../UI/LEDPanel/Element"
import LEDPanel from "../UI/LEDPanel/LEDPanel"

export default function StatusLeds() {
  const autopilotStateContext = useContext(AutopilotStateContext)
  // Heading control
  const headingElement: ILEDPanelElement = useMemo(() => {
    let color = '#00EC00'
    let state = autopilotStateContext.headingControlEnabled ? State.On : State.Off
    if (autopilotStateContext.headingControlEnabled && autopilotStateContext.missingHeading) {
      color = '#FF0000'
      state = State.Flashing
    }
    return { text: 'HEADING', color, state }
  }, [ autopilotStateContext.headingControlEnabled, autopilotStateContext.missingHeading ])
  // Track control
  const trackElement: ILEDPanelElement = useMemo(() => {
    let color = '#00EC00'
    let state = autopilotStateContext.trackControlEnabled ? State.On : State.Off
    if (autopilotStateContext.headingControlEnabled && autopilotStateContext.trackControlAvailable) {
      color = '#FF7700'
      state = State.Flashing
    }
    return { text: 'TRACK', color, state }
  }, [ autopilotStateContext.trackControlEnabled, autopilotStateContext.headingControlEnabled, autopilotStateContext.trackControlAvailable ])
  // Speed control
  const speedElement: ILEDPanelElement = useMemo(() => {
    let color = '#00EC00'
    let state = autopilotStateContext.speedControlEnabled ? State.On : State.Off
    if (autopilotStateContext.speedControlEnabled && autopilotStateContext.missingSpeed) {
      color = '#FF0000'
      state = State.Flashing
    }
    return { text: 'SPEED', color, state }
  }, [ autopilotStateContext.speedControlEnabled, autopilotStateContext.missingSpeed ])
  // Evaluate elements
  const elements: ILEDPanelElement[] = useMemo(() => {
    const arr = [
      { text: 'MASTER', color: '#00EC00', state: autopilotStateContext.master ? State.On : State.Off },
      headingElement,
      trackElement,
      speedElement,
    ]
    return arr as ILEDPanelElement[]
  }, [ autopilotStateContext, headingElement, trackElement, speedElement ])
  return (
    <LEDPanel elements={elements} />
  )
}
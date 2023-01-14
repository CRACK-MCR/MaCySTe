import { useMemo } from "react"
import { useCallback } from "react"
import BorderedBox from "../UI/BorderedBox"
import ThrottleButton from "./ThrottleButton"
import './ThrottleButtons.css'

export default function ThrottleButtons({
  leftEngine,
  rightEngine,
  setLeftEngine,
  setRightEngine,
}: {
  leftEngine: number,
  rightEngine: number,
  setLeftEngine: (throttle: number) => void,
  setRightEngine: (throttle: number) => void,
}) {
  /// Derived state
  const throttlesSynced = useMemo(() => leftEngine.toPrecision(2) === rightEngine.toPrecision(2), [ leftEngine, rightEngine ])
  const percentageClicked = useCallback((x: number) => {
    const percentage = x / 100
    setLeftEngine(percentage)
    setRightEngine(percentage)
  }, [ setLeftEngine, setRightEngine ])
  return (
    <BorderedBox style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      gap: '3px',
      paddingTop: '3px',
      paddingBottom: '3px',
    }}>
      <ThrottleButton kind="forwards" value={100} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="forwards" value={80} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="forwards" value={60} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="forwards" value={40} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="forwards" value={20} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <hr style={{ width: '100%' }} />
      <ThrottleButton kind="zero" value={0} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <hr style={{ width: '100%' }} />
      <ThrottleButton kind="backwards" value={-20} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="backwards" value={-40} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="backwards" value={-60} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="backwards" value={-80} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
      <ThrottleButton kind="backwards" value={-100} currentThrottle={leftEngine} throttlesSynced={throttlesSynced} percentageClickedCallback={percentageClicked}/>
    </BorderedBox>
  )
}

import { useCallback, useContext, useEffect, useState } from "react"
import { AutopilotStateContext } from "../../contexts/autopilot/AutopilotStateContext"
import DefaultConfig from "../../DefaultConfig"
import useEnvConfig from "../../hooks/useEnvConfig"
import useNatsKey from "../../hooks/useNatsKey"
import BorderedBox from "../UI/BorderedBox"
import MetalLabel from "../UI/MetalLabel"
import SevenSegmentSettableDisplay from "../UI/SevenSegmentSettableDisplay"

export default function SpeedControl() {
  const autopilotStateContext = useContext(AutopilotStateContext)
  const autopilotBucket = useEnvConfig('NATS_AUTOPILOT_BUCKET', DefaultConfig.natsAutopilotBucket)
  const autopilotSetSpeedKey = useEnvConfig('NATS_AUTOPILOT_SET_SPEED_KEY', DefaultConfig.natsAutopilotSetSpeedKey)
  const [ dialedInValue, setDialedInValue ] = useState<null | number>(null)
  const [ setValue, setSetValue ] = useState<null | number>(null)
  const [ speed, setSpeed ] = useNatsKey(autopilotBucket as string, autopilotSetSpeedKey as string)
  // Callbacks
  const onDialValue = useCallback((currentValue: number | null, increment: number) => {
    if (currentValue === null) currentValue = 0.0
    currentValue += increment
    if (currentValue < 0) currentValue = 0.0
    return currentValue
  }, [])
  const onValueSet = useCallback((value: number) => {
    setSpeed(value)
  }, [ setSpeed ])
  const onValueUnset = useCallback(() => {
    setSpeed(null)
  }, [ setSpeed ])
  // Update from outside
  useEffect(() => {
    setSetValue(speed as number)
  }, [ speed ])
  return (
    <BorderedBox>
      <MetalLabel>Speed control</MetalLabel>
      <SevenSegmentSettableDisplay
        dialedInValue={dialedInValue} setDialedInValue={(v: any) => setDialedInValue(v)}
        setValue={setValue} setSetValue={(v: any) => setSetValue(v)}
        increments={[ -1, -0.1, 0.1, 1 ]}
        onDialValue={onDialValue}
        size={3} precision={1}
        onValueSet={onValueSet}
        onValueUnset={onValueUnset}
        isPoweredOff={!autopilotStateContext.master}
      />
    </BorderedBox>
  )
}
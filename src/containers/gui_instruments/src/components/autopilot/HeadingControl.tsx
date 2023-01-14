import { useContext } from "react"
import { useEffect } from "react"
import { useCallback } from "react"
import { useState } from "react"

import useNatsKey from "../../hooks/useNatsKey"
import DefaultConfig from "../../DefaultConfig"
import { AutopilotStateContext } from "../../contexts/autopilot/AutopilotStateContext"
import BorderedBox from "../UI/BorderedBox"
import MetalLabel from "../UI/MetalLabel"
import SevenSegmentSettableDisplay from "../UI/SevenSegmentSettableDisplay"
import useEnvConfig from "../../hooks/useEnvConfig"


export default function HeadingControl() {
  const autopilotStateContext = useContext(AutopilotStateContext)
  const autopilotBucket = useEnvConfig('NATS_AUTOPILOT_BUCKET', DefaultConfig.natsAutopilotBucket)
  const autopilotSetHeadingKey = useEnvConfig('NATS_AUTOPILOT_SET_HEADING_KEY', DefaultConfig.natsAutopilotSetHeadingKey)
  const [dialedInValue, setDialedInValue] = useState<null | number>(null)
  const [setValue, setSetValue] = useState<null | number>(null)
  const [heading, setHeading] = useNatsKey(autopilotBucket as string, autopilotSetHeadingKey as string)
  // Callbacks
  const onDialValue = useCallback((currentValue: number | null, increment: number) => {
    if (currentValue === null) currentValue = 0.0
    currentValue += increment
    currentValue %= 360.0
    if (currentValue < 0) currentValue += 360.0
    return currentValue
  }, [])
  const onValueSet = useCallback((value: number) => {
    setHeading(value)
  }, [setHeading])
  const onValueUnset = useCallback(() => {
    setHeading(null)
  }, [setHeading])
  // React to changes
  useEffect(() => {
    setSetValue(heading as number)
  }, [ heading, setSetValue ])
  return (
    <BorderedBox>
      <MetalLabel>Heading control</MetalLabel>
      <SevenSegmentSettableDisplay
        dialedInValue={dialedInValue} setDialedInValue={(v: any) => setDialedInValue(v)}
        setValue={setValue} setSetValue={(v: any) => setSetValue(v)}
        increments={[-10, -1, 1, 10]}
        size={3} precision={0}
        onDialValue={onDialValue}
        onValueSet={onValueSet}
        onValueUnset={onValueUnset}
        isPoweredOff={!autopilotStateContext.master}
      />
    </BorderedBox>
  )
}
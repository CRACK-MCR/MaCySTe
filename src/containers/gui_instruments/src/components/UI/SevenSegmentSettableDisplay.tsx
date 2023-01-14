import React, { Suspense, useEffect } from "react"
import { useCallback, useMemo } from "react"

import Button from "./Button"

const SevenSegmentDisplay = React.lazy(() => import("./SevenSegmentDisplay/SevenSegmentDisplay"))

interface ISevenSegmentSettableDisplay {
  dialedInValue: null | number;
  setValue: null | number;
  setDialedInValue: (value: null | number) => void;
  setSetValue: (value: null | number) => void;
  increments: number[];
  size: number;
  precision?: number;
  onDialValue?: (currentValue: number | null, increment: number) => number;
  onValueSet?: (value: number) => void;
  onValueUnset?: () => void;
  isPoweredOff?: boolean;
}

export default function SevenSegmentSettableDisplay({
  dialedInValue,
  setValue,
  setDialedInValue,
  setSetValue,
  increments,
  size,
  precision = 2,
  onDialValue = (currentValue, increment) => (currentValue ?? 0) + increment,
  onValueSet = _ => {},
  onValueUnset = () => {},
  isPoweredOff = false
}: ISevenSegmentSettableDisplay) {
  // Style
  const dialColor = useMemo(() => setValue !== null ? '#00EC00' : '#EC0000', [ setValue ])
  const dialText = useMemo(() => {
    if (isPoweredOff) return ''
    if (dialedInValue === null) return '---'
    return (+dialedInValue.toFixed(precision)).toString()
  }, [ isPoweredOff, dialedInValue, precision ])
  const setDialText = useMemo(() => {
    if (setValue === null) return ''
    return (+setValue.toFixed(precision)).toString()
  }, [ setValue, precision ])
  // React to being powered off
  useEffect(() => {
    if (isPoweredOff) {
      setDialedInValue(null)
      setSetValue(null)
    }
  }, [ isPoweredOff, setDialedInValue, setSetValue ])
  // Callbacks
  const dialValue = useCallback((n: number) => {
    if (isPoweredOff) return
    setDialedInValue(onDialValue(dialedInValue, n))
  }, [ isPoweredOff, onDialValue, dialedInValue, setDialedInValue ])
  const setUnsetValue = useCallback(() => {
    if (isPoweredOff) return
    if (dialedInValue === setValue) {
      setDialedInValue(null)
      setSetValue(null)
      console.debug('Value unset')
      onValueUnset()
    } else if (dialedInValue !== null) {
      setSetValue(dialedInValue)
      console.debug('Value set', dialedInValue)
      onValueSet(dialedInValue)
    }
  }, [ isPoweredOff, dialedInValue, setValue, onValueSet, onValueUnset, setDialedInValue, setSetValue ])
  return (
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '3px'
      }}>
        <Suspense fallback={<p>Loading display...</p>}>
          <SevenSegmentDisplay content={setDialText} size={size} textPosition={'middle'} backgroundColor={"#000000"} onColor={dialColor} offColor={"#252525"} sizeMultiplier={3}/>
          <SevenSegmentDisplay content={dialText} size={size} textPosition={'middle'} backgroundColor={"#000000"} onColor={"#EC0000"} offColor={"#252525"} sizeMultiplier={3}/>
        </Suspense>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '3px'
          }}>
            {increments.map(inc => (
              <Button key={inc} style={{
                color: inc > 0 ? 'darkgreen' : 'darkred'
              }} onClick={() => dialValue(inc)}>{inc > 0 ? '+' : ''}{inc}</Button>
            ))}
          </div>
          <Button onClick={() => setUnsetValue()}>SET/UNSET</Button>
        </div>
      </div>
  )
}
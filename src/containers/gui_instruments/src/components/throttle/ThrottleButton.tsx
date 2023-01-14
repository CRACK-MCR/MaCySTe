import { useCallback, useMemo } from "react"
import "./ThrottleButtons.css"

export default function ThrottleButton({
  kind,
  value,
  currentThrottle,
  throttlesSynced,
  percentageClickedCallback = n => {}
}: {
  kind: 'forwards' | 'backwards' | 'zero',
  value: number,
  currentThrottle: number,
  throttlesSynced: boolean,
  percentageClickedCallback?: (x: number) => void
}) {
  const absValue = useMemo(() => Math.abs(value), [ value ])
  const onClick = useCallback((_: any) => percentageClickedCallback(value), [ value, percentageClickedCallback ])
  return (
    <button
      className={`${kind} ${value.toFixed(1) === (currentThrottle * 100).toFixed(1) && throttlesSynced ? 'active' : ''}`}
      onClick={onClick}>
        {absValue}
    </button>
  )
}
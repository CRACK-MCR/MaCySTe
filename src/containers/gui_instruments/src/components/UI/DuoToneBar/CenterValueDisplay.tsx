import { useMemo } from "react"

import { DuoToneBarSinglePercentage } from "./DuoToneBar"

const CenterValueDisplay = ({ percentage }: { percentage: DuoToneBarSinglePercentage }) => {
  const text = useMemo(() => percentage === 0 ? 'ZERO' : Math.abs(percentage).toFixed(0), [ percentage ])
  const bgColor = useMemo(() => {
    if (percentage === 0) return { r: 0, g: 0, b: 0 }
    else if (percentage > 0) return { r: 0, g: 128, b: 0 }
    else if (percentage < 0) return { r: 128, g: 0, b: 0 }
  }, [ percentage ])
  return (
    <span style={{
      position: 'absolute',
      color: 'white',
      textAlign: 'center',
      left: `calc(50% - ${(text.length / 2).toFixed(2)}ch - 3px)`,
      fontFamily: 'monospace',
      background: `rgba(${bgColor?.r}, ${bgColor?.g}, ${bgColor?.b}, 0.3)`,
      borderRadius: '10px',
      paddingLeft: '3px',
      paddingRight: '3px',
      userSelect: 'none',
      touchAction: 'none',
      transition: 'background',
      transitionDuration: '0.1s'
    }}>
      {text}
    </span>
  )
}

export default CenterValueDisplay
import { useMemo } from "react"

import CenterValueDisplay from "./CenterValueDisplay"
import { DuoToneBarSinglePercentage } from "./DuoToneBar"

const  DuoToneBarForSinglePercentage = ({ percentage, labels = [] }: { percentage: DuoToneBarSinglePercentage, labels: string[] }) => {
  // Calculate spaces
  const leftSpacerSize = useMemo(() => {
    if (percentage >= 0) return 50
    return 50 - Math.abs(percentage) / 100 * 50
  }, [ percentage ])
  const leftBarSize = useMemo(() => {
    if (percentage >= 0) return 0
    return Math.abs(percentage) / 100 * 50
  }, [ percentage ])
  const rightBarSize = useMemo(() => {
    if (percentage <= 0) return 0
    return Math.abs(percentage) / 100 * 50
  }, [ percentage ])
  const rightSpacerSize = useMemo(() => {
    if (percentage <= 0) return 50
    return 50 - Math.abs(percentage) / 100 * 50
  }, [ percentage ])
  // Draw
  return (
    <div style={{
      borderRadius: '4px',
      border: '2px grey solid',
      padding: '2px'
    }}>
      <div style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        justifyContent: 'center',
      }}>
        <div style={{
          width: `${leftSpacerSize}%`,
          borderBottom: '2px dotted darkred',
          transition: 'width',
          transitionDuration: '0.3s'
        }}></div>
        <div style={{
          background: 'darkred',
          width: `${leftBarSize}%`,
          height: '15px',
          transition: 'width',
          transitionDuration: '0.3s'
        }}></div>
        <CenterValueDisplay percentage={percentage}/>
        <div style={{
          background: 'darkgreen',
          width: `${rightBarSize}%`,
          height: '15px',
          transition: 'width',
          transitionDuration: '0.3s'
        }}></div>
        <div style={{
          width: `${rightSpacerSize}%`,
          borderBottom: '2px dotted darkgreen',
          transition: 'width',
          transitionDuration: '0.3s'
        }}></div>
      </div>
      <div style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        fontFamily: 'monospace',
        color: 'grey',
        fontSize: '10px',
        marginTop: '2px'
      }}>
        {labels.map((label, i) => (
          <span style={{
            userSelect: 'none',
            touchAction: 'none'
          }} key={i}>{label}</span>
        ))}
      </div>
    </div>
  )
}

export default DuoToneBarForSinglePercentage
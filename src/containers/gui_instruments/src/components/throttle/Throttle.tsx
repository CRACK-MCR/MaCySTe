import { useState } from 'react';
import { useCallback } from 'react';
import { useRef } from 'react';
import { useMemo } from 'react'
import BorderedBox from '../UI/BorderedBox';
import DuoToneBar from '../UI/DuoToneBar/DuoToneBar';
import MetalLabel from '../UI/MetalLabel';

type ThrottleStep = number;
type ThrottleTickSide = 'left' | 'right';

interface ThrottleTickLabelProps {
  percentage: ThrottleStep,
  side?: ThrottleTickSide,
  setEngine: Function
}

function ThrottleTickLabel({ percentage, side = 'left', setEngine }: ThrottleTickLabelProps) {
  const onClick = useCallback(() => {
    setEngine(percentage / 100)
  }, [ setEngine, percentage ])
  const absPercentage = useMemo(() => Math.abs(percentage), [ percentage ])
  const textColor = useMemo(() => {
    if (percentage > 0) return 'darkgreen'
    else if (percentage < 0) return 'darkred'
    else return ''
  }, [ percentage ])
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around'
    }}>
      <span style={{
        color: textColor,
        fontFamily: 'monospace',
        fontSize: '15px',
        minWidth: '3ch',
        order: side === 'left' ? 1 : 2
      }}
        onClick={onClick}
      >{absPercentage}</span>
      <span style={{
        borderBottom: '2px solid grey',
        paddingLeft: '5px',
        paddingRight: '5px',
        order: side === 'left' ? 2 : 1,
        marginLeft: '3px',
        marginRight: '3px',
      }}></span>
    </div>
  )
}

interface ThrottleTickLabelsProps {
  side?: ThrottleTickSide,
  setEngine: Function
}

function ThrottleTickLabels({ side = 'left', setEngine }: ThrottleTickLabelsProps) {
  const percentages = [ 100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100 ]
  return (
    <div style={{
      display: 'flex',
      flex: '1 0 auto',
      justifyContent: 'space-between',
      flexDirection: 'column',
      textAlign: side
    }}>
      {percentages.map(step => (
        <ThrottleTickLabel key={step} percentage={step} side={side} setEngine={setEngine}/>
      ))}
    </div>
  )
}

interface IThrottleCenter {
  engine: any,
  setEngine: any
}

function ThrottleCenter({engine, setEngine}: IThrottleCenter) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ dragging, setDragging ] = useState(false)
  const updatePercentageFromMouse = useCallback((e: any) => {
    // Grab reference bar
    const bar = containerRef.current
    if (!bar) return
    // Calculate percentage
    const barStyle = getComputedStyle(bar)
    const barSizeY = bar.clientHeight - parseFloat(barStyle.marginBottom)
    const barPosY = bar.getBoundingClientRect().y
    const clientY = e.clientY || e.touches[0].clientY
    if (!clientY) {
      console.debug('No Y coordinate')
      return
    }
    const positionOnBar = clientY - parseFloat(barStyle.marginTop) - barPosY
    const positionOnBarPercentage = positionOnBar / barSizeY
    const percentage = (1 - positionOnBarPercentage) * 2 - 1
    // Update percentage
    let targetPercentage = percentage
    if (targetPercentage > 1) targetPercentage = 1
    else if (targetPercentage < -1) targetPercentage = -1
    setEngine(targetPercentage)
  }, [ setEngine ])
  const updatePercentageFromMouseIfDragging = useCallback((e: any) => {
    // Stop dragging if wrong button is pressed
    if (e.buttons !== 1 && e.type === 'mousemove') {
      // console.debug('Wrong buttons pressed', e)
      setDragging(false)
    }
    if (!dragging) {
      // console.debug('Skipping event: not dragging')
      return
    }
    // Invoke the other handler
    updatePercentageFromMouse(e)
  }, [ dragging, updatePercentageFromMouse ])
  const finalize = useCallback((e: any) => {
    // Stop dragging
    setDragging(false)
  }, [ setDragging ])
  return (
    <div ref={containerRef} style={{
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      marginTop: 'calc(15px / 2)',
      marginBottom: 'calc(15px / 2)',
      minWidth: '30px'
    }}
      onClick={updatePercentageFromMouse}
      onTouchMove={updatePercentageFromMouseIfDragging}
      onMouseMove={updatePercentageFromMouseIfDragging}>
      <span style={{
        flex: '1',
        borderLeft: '2px solid grey',
        transform: 'translateX(calc(50% - 1px))',
      }}></span>
      <div style={{
        position: 'absolute',
        top: `calc(${100 - ((engine * 100 + 100) / 2)}% - 5px)`,
        left: 'calc(50% - 12.5px)',
        width: '25px',
        height: '10px',
        border: '1px grey solid',
        background: 'linear-gradient(hsl(0, 0%, 35%), hsl(0, 0%, 75%), hsl(0, 0%, 35%))',
      }}
        onTouchStart={() => setDragging(true)}
        onTouchEnd={finalize}
        onMouseDown={() => setDragging(true)}
        onMouseUp={finalize}>
      </div>
    </div>
  )
}

interface IThrottle {
  description: string,
  engine: any,
  setEngine: any
}

function Throttle({ description, engine, setEngine }: IThrottle) {
  // Render
  return (
    <BorderedBox style={{
      overflow: 'hidden',
      display: 'flex',
      flex: '1 0 auto',
      flexDirection: 'column'
    }}>
      <MetalLabel>
        {description}
      </MetalLabel>
      <div style={{
        display: 'inline-flex',
        flex: '1 0 auto',
        flexDirection: 'row',
        userSelect: 'none',
        touchAction: 'none'
      }}>
        <ThrottleTickLabels setEngine={setEngine}/>
        <ThrottleCenter engine={engine} setEngine={setEngine}/>
        <ThrottleTickLabels side="right" setEngine={setEngine}/>
      </div>
      <DuoToneBar percentage={engine * 100} labels={["BOW","ASTN"]}/>
    </BorderedBox>
  )
}

export default Throttle

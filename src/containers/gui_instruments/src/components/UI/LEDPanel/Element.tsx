import React from 'react'
import './Element.css'

export enum State {
  On,
  Off,
  Flashing,
}
function stateToClassName(state: State): string {
  switch (state) {
    case State.On: return 'on'
    case State.Off: return 'off'
    case State.Flashing: return 'flashing'
  }
}

export interface ILEDPanelElement {
  text: string,
  color: string,
  state: State,
  onClick?: (event: React.SyntheticEvent) => void,
  style?: React.CSSProperties
}

function LEDPanelElement(props: ILEDPanelElement) {
  return (
    <span
      className={stateToClassName(props.state)}
      onClick={props.onClick}
      style={{
        flex: '1 1 auto',
        border: `2px ${props.color} solid`,
        color: props.color,
        padding: '2px',
        textAlign: 'center',
        ...props.style
      }}>
      {props.text}
    </span>
  )
}

export default LEDPanelElement
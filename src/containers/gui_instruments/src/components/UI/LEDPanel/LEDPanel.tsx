import LEDPanelElement, { ILEDPanelElement } from "./Element"

interface ILEDPanel {
  elements: ILEDPanelElement[]
}

function LEDPanel({ elements }: ILEDPanel) {
  return (
    <div style={{
      display: 'flex',
      background: 'black',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
      color: 'white',
      borderRadius: '2px',
      border: '2px black solid',
      gap: '2px'
    }}>
      {elements.map((el, i) => (
        <LEDPanelElement key={i} {...el}/>
      ))}
    </div>
  )
}

export default LEDPanel
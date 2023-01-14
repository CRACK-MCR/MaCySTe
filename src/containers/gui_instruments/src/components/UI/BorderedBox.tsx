import React from "react"

function BorderedBox({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div style={{
      display: 'inline-block',
      borderRadius: '10px',
      paddingBottom: '5px',
      paddingLeft: '5px',
      paddingRight: '5px',
      border: '4px grey solid',
      ...style
    }}>
      {children}
    </div>
  )
}

export default BorderedBox
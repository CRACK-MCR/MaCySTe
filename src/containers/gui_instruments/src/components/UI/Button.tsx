import React from "react"

function Button({
  children,
  style = {},
  onClick
}: {
  children: React.ReactNode,
  style?: React.CSSProperties,
  onClick?: (event: React.SyntheticEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'monospace',
        padding: '5px 5px',
        borderRadius: '3px',
        border: '2px gray solid',
        color: 'black',
        background: 'radial-gradient(hsl(0,0%,90%), hsl(0,0%, 70%))',
        ...style
      }}>
      {children}
    </button>
  )
}

export default Button
interface IMetalLabel {
    children: React.ReactNode,
    style?: React.CSSProperties
  }
  
  const MetalLabel: React.FC<IMetalLabel> = ({ children, style = {} }) => {
    return (
      <p style={{
        fontFamily: 'sans-serif',
        textAlign: 'center',
        border: '2px grey solid',
        marginTop: '5px',
        marginBottom: '10px',
        borderRadius: '3px',
        background: 'linear-gradient(hsl(0,0%,100%), hsl(0,0%,90%))',
        paddingLeft: '3px',
        paddingRight: '3px',
        ...style
      }}>
        {children}
      </p>
    )
  }
  
  export default MetalLabel
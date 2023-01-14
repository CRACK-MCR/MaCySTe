import Autopilot from './components/autopilot/Autopilot';
import Rudder from './components/rudder/Rudder';
import TwinEngineThrottles from './components/throttle/TwinEngineThrottles';
import NatsContextProvider from './contexts/NatsContextProvider';
import RudderContextProvider from './contexts/rudder/RudderContextProvider';
import TwinThrottleContextProvider from './contexts/throttle/TwinThrottleContextProvider';
import DefaultConfig from './DefaultConfig';
import useEnvConfig from './hooks/useEnvConfig';

function App() {
  const natsURL = useEnvConfig('NATS_URL', DefaultConfig.natsURL)
  return (
    <NatsContextProvider
      connectOpts={{ servers: [ natsURL as string ] }}
    >
      <div style={{
        display: 'grid',
        columnGap: '10px',
        rowGap: '10px',
        placeItems: 'center',
        justifyContent: 'center',
        gridAutoFlow: 'row dense',
        maxWidth: '100%'
      }}>
        <Autopilot/>
        <div style={{
          display: 'flex',
          gap: '10px',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}>
          <RudderContextProvider>
            <Rudder maxRudderAngle={35} divisions={3}/>
          </RudderContextProvider>
          <TwinThrottleContextProvider>
            <TwinEngineThrottles/>
          </TwinThrottleContextProvider>
        </div>
      </div>
    </NatsContextProvider>
  )
}

export default App;

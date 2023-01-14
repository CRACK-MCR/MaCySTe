import { useMemo } from "react";
import DefaultConfig from "../../DefaultConfig";
import useEnvConfig from "../../hooks/useEnvConfig";
import useNatsKey from "../../hooks/useNatsKey";
import { AutopilotStateContext, autopilotStateFromStateAndErrorStrings } from "./AutopilotStateContext";

export default function AutopilotStateContextProvider({ children }: { children: React.ReactNode }) {
  const autopilotBucket = useEnvConfig('NATS_AP_BUCKET', DefaultConfig.natsAutopilotBucket)
  const autopilotStateKey = useEnvConfig('NATS_AP_STATE_KEY', DefaultConfig.natsAutopilotStateKey)
  const autopilotErrorKey = useEnvConfig('NATS_AP_ERROR_KEY', DefaultConfig.natsAutopilotErrorKey)
  const [ state, ] = useNatsKey(autopilotBucket as string, autopilotStateKey as string)
  const [ error, ] = useNatsKey(autopilotBucket as string, autopilotErrorKey as string)
  const apState = useMemo(() => autopilotStateFromStateAndErrorStrings(state as string, error as string), [ state, error ])
  return (
    <AutopilotStateContext.Provider value={apState}>
      {children}
    </AutopilotStateContext.Provider>
  )
}
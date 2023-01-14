import React, { useCallback } from "react";
import DefaultConfig from "../../DefaultConfig";
import useEnvConfig from "../../hooks/useEnvConfig";
import useNatsKey from "../../hooks/useNatsKey";
import Button from "../UI/Button";

export default function MasterToggle() {
  const autopilotBucket = useEnvConfig('NATS_AUTOPILOT_BUCKET', DefaultConfig.natsAutopilotBucket);
  const autopilotMasterKey = useEnvConfig('NATS_AUTOPILOT_MASTER_KEY', DefaultConfig.natsAutopilotMasterKey);
  const [master, setMaster] = useNatsKey(autopilotBucket as string, autopilotMasterKey as string);
  const toggleMaster = useCallback(() => {
    if (master) {
      setMaster(false);
    } else {
      setMaster(true);
    }
  }, [master, setMaster]);
  return (
    <Button
      onClick={toggleMaster}
      style={{
        flex: "1",
        textTransform: "uppercase",
      }}
    >
      Master
    </Button>
  );
}

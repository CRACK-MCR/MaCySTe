import React, { Suspense, useContext } from "react";
import TwinThrottleContext from "../../contexts/throttle/TwinThrottleContext";
import BorderedBox from "../UI/BorderedBox";
import MetalLabel from "../UI/MetalLabel";
import ThrottleButtons from "./ThrottleButtons";

const Throttle = React.lazy(() => import("./Throttle"));

const  TwinEngineThrottles = () => {
  const twinThrottleContext = useContext(TwinThrottleContext);
  return (
    <BorderedBox>
      <MetalLabel>Throttles</MetalLabel>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          resize: "both",
          overflow: "hidden",
          justifyContent: "center",
          gap: "3px",
        }}
      >
        <Suspense fallback={<p>Loading throttles</p>}>
          <Throttle description={"Engine L"} engine={twinThrottleContext.lThrottle.currentThrottle} setEngine={twinThrottleContext.lThrottle.setThrottle} />
          <ThrottleButtons
            leftEngine={twinThrottleContext.lThrottle.currentThrottle} setLeftEngine={twinThrottleContext.lThrottle.setThrottle}
            rightEngine={twinThrottleContext.rThrottle.currentThrottle} setRightEngine={twinThrottleContext.rThrottle.setThrottle}
          />
          <Throttle description={"Engine R"} engine={twinThrottleContext.rThrottle.currentThrottle} setEngine={twinThrottleContext.rThrottle.setThrottle} />
        </Suspense>
      </div>
    </BorderedBox>
  );
}

export default TwinEngineThrottles
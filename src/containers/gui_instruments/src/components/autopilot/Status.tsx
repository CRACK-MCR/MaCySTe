import React, { Suspense } from "react";
import BorderedBox from "../UI/BorderedBox";
import MetalLabel from "../UI/MetalLabel";

const MasterToggle = React.lazy(() => import('./MasterToggle'))
const StatusLeds = React.lazy(() => import("./StatusLeds"));

export default function Status() {
  return (
    <>
      <MetalLabel
        style={{
          marginBottom: "2px",
        }}
      >
        Autopilot
      </MetalLabel>
      <BorderedBox
        style={{
          display: "flex",
          flexDirection: "row",
          padding: "3px",
          justifyContent: "space-around",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Suspense fallback={<p>Loading...</p>}>
          <MasterToggle/>
          <StatusLeds />
        </Suspense>
      </BorderedBox>
    </>
  );
};

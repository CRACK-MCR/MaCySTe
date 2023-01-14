import AutopilotStateContextProvider from "../../contexts/autopilot/AutopilotStateContextProvider";
import BorderedBox from "../UI/BorderedBox";
import HeadingControl from "./HeadingControl";
import SpeedControl from "./SpeedControl";
import Status from "./Status";

const Autopilot = () => {
  return (
    <AutopilotStateContextProvider>
      <BorderedBox
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "3px",
          padding: "3px",
          alignContent: "stretch"
        }}
      >
        <Status />
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-around",
            gap: "5px",
          }}
        >
          <HeadingControl />
          <SpeedControl />
        </div>
      </BorderedBox>
    </AutopilotStateContextProvider>
  );
};

export default Autopilot;

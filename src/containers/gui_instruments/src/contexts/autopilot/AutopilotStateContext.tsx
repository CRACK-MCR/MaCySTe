import React from "react";

export interface IAutopilotStateContext {
  master: boolean,
  trackControlAvailable: boolean,
  headingControlEnabled: boolean,
  trackControlEnabled: boolean,
  speedControlEnabled: boolean,
  missingHeading: boolean,
  missingSpeed: boolean,
  noRudderOutput: boolean,
  noThrottleControl: boolean,
}

export function autopilotStateFromStateAndErrorStrings(stateString: string | null, errorString: string | null): IAutopilotStateContext {
  // State
  const master = (stateString !== null) ? stateString.includes('M') : false
  const trackControlAvailable = (stateString !== null) ? stateString.includes('A') : false
  const headingControlEnabled = (stateString !== null) ? stateString.includes('H') : false
  const trackControlEnabled = (stateString !== null) ? stateString.includes('T') : false
  const speedControlEnabled = (stateString !== null) ? stateString.includes('S') : false
  // Errors
  const missingHeading = (errorString !== null) ? errorString.includes('H') : true
  const missingSpeed = (errorString !== null) ? errorString.includes('S') : true
  const noRudderOutput = (errorString !== null) ? errorString.includes('R') : true
  const noThrottleControl = (errorString !== null) ? errorString.includes('T') : true
  // Assemble object
  return {
    master,
    trackControlAvailable,
    headingControlEnabled,
    trackControlEnabled,
    speedControlEnabled,
    missingHeading,
    missingSpeed,
    noRudderOutput,
    noThrottleControl,
  }
}


export const AutopilotStateContext = React.createContext<IAutopilotStateContext>(autopilotStateFromStateAndErrorStrings(null, null))
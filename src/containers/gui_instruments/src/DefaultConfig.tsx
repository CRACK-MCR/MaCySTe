const DefaultConfig = {
  // NATS
  natsURL: 'ws://192.168.249.2',

  // Autopilot
  natsAutopilotBucket: 'autopilot',
  natsAutopilotMasterKey: 'master_switch',
  natsAutopilotStateKey: 'autopilot_state_string',
  natsAutopilotErrorKey: 'autopilot_errors_string',
  natsAutopilotSetHeadingKey: 'heading_control_set_heading',
  natsAutopilotSetSpeedKey: 'speed_control_set_speed',

  // Rudder
  natsRudderBucket: 'ship_controls',
  natsRudderKey: 'rudder',

  // Throttle
  natsThrottleBucket: 'ship_controls',
  natsLThrottleKey: 'l_engine',
  natsRThrottleKey: 'r_engine',
}

export default DefaultConfig
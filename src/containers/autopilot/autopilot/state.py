import inspect
import logging
import os
import time

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, List, Literal, Optional

@dataclass
class AutopilotState:
  # Autopilot
  master_switch: bool = True
  heading_control_set_heading: Optional[float] = None
  track_control_set_heading: Optional[float] = None
  track_control_xte: Optional[float] = None
  track_control_xte_direction_to_steer: Optional[Literal['L'] | Literal['R']] = None
  speed_control_set_speed: Optional[float] = None

  # Boat
  heading: Optional[float] = None
  speed: Optional[float] = None

  # Control
  rudder_control: Optional[float] = None
  throttle_control: Optional[float] = None

  # Callbacks
  setattr_callbacks: List[Callable[[str, Any],None]] = field(default_factory = list)

  def add_callback(self, callback: Callable[[str, Any],None]):
    self.setattr_callbacks.append(callback)

  def __setattr__(self, __name: str, __value: Any) -> None:
    super().__setattr__(__name, __value)
    if hasattr(self, 'setattr_callbacks'):
      if __value is not None:
        super().__setattr__(__name + '_last_updated_datetime', datetime.now())
        super().__setattr__(__name + '_last_updated_monotonic', time.monotonic())
      for callback in self.setattr_callbacks:
        callback(__name, __value)
      for member in inspect.getmembers(self.__class__):
        member_name, member_value = member
        if isinstance(member_value, property):
          for callback in self.setattr_callbacks:
            callback(member_name, getattr(self, member_name))
      logging.getLogger(self.__class__.__name__).debug(f'{__name} = {__value}')

  @property
  def heading_control_enabled(self) -> bool:
    return self.master_switch and self.heading_control_set_heading is not None

  @property
  def track_control_available(self) -> bool:
    elapsed = self.track_control_last_command_elapsed_time
    if elapsed is None:
      return False
    threshold = float(os.getenv('TRACK_CONTROL_TIMEOUT', '30'))
    return elapsed < threshold

  @property
  def track_control_enabled(self) -> bool:
    return self.master_switch and self.track_control_available and (not self.heading_control_enabled)

  @property
  def track_control_last_command_elapsed_time(self) -> Optional[float]:
    if not hasattr(self, 'track_control_set_heading_last_updated_monotonic'):
      return None
    elif self.track_control_set_heading_last_updated_monotonic is None:
      return None
    else:
      return time.monotonic() - self.track_control_set_heading_last_updated_monotonic

  @property
  def speed_control_enabled(self) -> bool:
    return self.master_switch and self.speed_control_set_speed is not None

  @property
  def autopilot_state_string(self):
    s = ''
    if self.master_switch: s += 'M'
    if self.track_control_available: s += 'A'
    if self.heading_control_enabled: s += 'H'
    if self.track_control_enabled: s += 'T'
    if self.speed_control_enabled: s += 'S'
    return s

  @property
  def autopilot_errors_string(self):
    s = ''
    if self.heading is None: s += 'H'
    if self.speed is None: s += 'S'
    if self.rudder_control is None: s += 'R'
    if self.throttle_control is None: s += 'T'
    return s

AUTOPILOT_STATE = AutopilotState()

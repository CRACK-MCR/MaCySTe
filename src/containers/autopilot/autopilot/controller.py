import time
import logging

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional

class Controller(ABC):
  @abstractmethod
  def update(self, error: float) -> float:
    pass

  def reset(self):
    pass

@dataclass
class PController(Controller):
  Kp: float

  logger = logging.getLogger('PController')

  def update(self, error: float) -> float:
    control = error * self.Kp
    self.logger.debug('error * Kp = %f', control)
    return control

@dataclass
class IController(Controller):
  Ki: float
  integral: float = 0.0
  last_t: Optional[float] = None
  antiwindup_activation_range: Optional[float] = None
  antiwindup_reset_on_overshoot: bool = False

  logger = logging.getLogger('IController')

  def update(self, error: float) -> float:
    # Get current time
    now = time.monotonic()
    # Calculate delta t
    delta_t = 0.0
    if self.last_t is not None:
      delta_t = now - self.last_t
    self.last_t = now
    # Calculate integral
    self.integral += error * delta_t
    self.logger.debug('Integral = %f', self.integral)
    # Anti windup: enable integral only if inside controllable region
    if self.antiwindup_activation_range is not None:
      if abs(error) > self.antiwindup_activation_range:
        self.logger.debug('Integral reset (outside activation range)')
        self.integral = 0.0
    # Anti windup: zero integral on overshoot
    if self.antiwindup_reset_on_overshoot:
      if (error * self.integral) < 0.0:
        self.logger.debug('Integral reset (overshoot)')
        self.integral = 0.0
    # Calculate control
    control = self.integral * self.Ki
    self.logger.debug('error * Ki = %f', control)
    return control

  def reset(self):
    self.integral = 0.0

@dataclass
class DController(Controller):
  Kd: float
  last_x: Optional[float] = None
  last_t: Optional[float] = None

  logger = logging.getLogger('DController')

  def update(self, error: float) -> float:
    # Get current time
    now = time.monotonic()
    # Calculate delta t
    delta_t = 0.0
    if self.last_t is not None:
      delta_t = now - self.last_t
    self.last_t = now
    # Save values
    prev_x = self.last_x
    self.last_x = error
    # Calculate derivative
    if delta_t == 0.0: return 0.0
    delta_x = error - prev_x
    derivative = delta_x / delta_t
    control = derivative * control
    self.logger.debug('derivative * Kd = %f', control)
    return control

  def reset(self):
    self.integral = 0.0

@dataclass
class PIController(Controller):
  p_controller: PController
  i_controller: IController

  logger = logging.getLogger('PIController')

  def update(self, error: float) -> float:
    control = self.p_controller.update(error) + self.i_controller.update(error)
    self.logger.debug('P + I = %f', control)
    return control

  def reset(self):
    self.p_controller.reset()
    self.i_controller.reset()

@dataclass
class PIDController(Controller):
  p_controller: PController
  i_controller: IController
  d_controller: DController

  logger = logging.getLogger('PIDController')

  def update(self, error: float) -> float:
    control = self.p_controller.update(error) + self.i_controller.update(error) + self.d_controller.update(error)
    self.logger.debug('P + I + D = %f', control)
    return control

  def reset(self):
    self.p_controller.reset()
    self.i_controller.reset()
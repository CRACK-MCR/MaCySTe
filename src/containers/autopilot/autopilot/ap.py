import asyncio
import logging

from controller import IController, PController, PIController
from state import AUTOPILOT_STATE

class Autopilot:

  def __init__(self) -> None:
    self.logger = logging.getLogger(self.__class__.__name__)
    self.h_controller = PIController(
      PController(1.0 / 180.0),
      IController(
        0.001,
        antiwindup_activation_range = 5.0,
        antiwindup_reset_on_overshoot = True,
      )
    )
    self.s_controller = PIController(
      PController(1.0 / 18.0 * 0.75),
      IController(
        0.001,
        antiwindup_reset_on_overshoot = True,
      )
    )

  async def run_loop(self, hz: float = 1.0):
    loop_interval = 1.0 / hz
    while True:
      self.logger.debug('Running autopilot loop')
      await asyncio.sleep(loop_interval)
      await self.run_loop_iteration()

  async def run_loop_iteration(self):
    await asyncio.gather(self.run_heading_based_controllers(), self.run_speed_based_controllers())

  async def run_heading_based_controllers(self):
    if 'H' in AUTOPILOT_STATE.autopilot_errors_string:
      self.logger.warning('No heading available, heading and track control disabled')
    else:
      run_h_controller = False
      if AUTOPILOT_STATE.heading_control_enabled:
        await self.run_heading_control()
        run_h_controller = True
      if AUTOPILOT_STATE.track_control_enabled:
        await self.run_track_control()
        run_h_controller = True
      if not run_h_controller:
        self.h_controller.reset()

  async def run_speed_based_controllers(self):
    if 'S' in AUTOPILOT_STATE.autopilot_errors_string:
      self.logger.warning('No speed available, speed control disabled')
    else:
      if AUTOPILOT_STATE.speed_control_enabled:
        await self.run_speed_control()
      else:
        self.s_controller.reset()

  async def run_heading_control(self):
    logger = logging.getLogger(self.run_heading_control.__name__)
    error = AUTOPILOT_STATE.heading_control_set_heading - AUTOPILOT_STATE.heading
    logger.error('Heading error: %f', error)
    if   error < -180.0: error += 360.0
    elif error >  180.0: error -= 360.0
    logger.error('Heading wrapped error: %f', error)

    control = self.h_controller.update(error)
    if control >    1.0: control =  1.0
    elif control < -1.0: control = -1.0

    AUTOPILOT_STATE.rudder_control = control

  async def run_track_control(self):
    logger = logging.getLogger(self.run_track_control.__name__)
    error = AUTOPILOT_STATE.track_control_set_heading - AUTOPILOT_STATE.heading
    logger.error('Heading error: %f', error)
    if   error < -180.0: error += 360.0
    elif error >  180.0: error -= 360.0
    logger.error('Heading wrapped error: %f', error)

    control = self.h_controller.update(error)
    if control >    1.0: control =  1.0
    elif control < -1.0: control = -1.0

    AUTOPILOT_STATE.rudder_control = control

  async def run_speed_control(self):
    error = AUTOPILOT_STATE.speed_control_set_speed - AUTOPILOT_STATE.speed

    control = self.s_controller.update(error)
    if control > 1.0: control = 1.0
    if control < 0.0: control = 0.0

    AUTOPILOT_STATE.throttle_control = control

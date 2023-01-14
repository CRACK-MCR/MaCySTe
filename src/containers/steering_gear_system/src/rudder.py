import random
from dataclasses import dataclass


@dataclass
class Rudder:

    sleep_time: float

    current_deg_position: float = 0.0
    min_deg_position: float = -35.0
    max_deg_position: float = 35.0
    max_time: int = 24
    max_pressure: float = 60.0

    def __init__(self, sleep_time):
        self.sleep_time = sleep_time

    def rotate(self, desired_position: float, pressure: float, is_neg: bool):
        if is_neg:
            sign = -1.0
            delta_position = self.current_deg_position - desired_position
        else:
            sign = 1.0
            delta_position = desired_position - self.current_deg_position

        if delta_position < (1.35 * self.sleep_time):
            self.current_deg_position = desired_position
        elif delta_position > 0.0:
            self.current_deg_position += sign * (1.35 * pressure / self.max_pressure) * self.sleep_time
        else:
            self.current_deg_position -= sign * (1.35 * pressure / self.max_pressure) * self.sleep_time

        if abs(delta_position) < (3.0 * pressure * self.sleep_time) / self.max_pressure:
            self.current_deg_position += random.normalvariate(0.0, (pressure / self.max_pressure) / 7)

        if delta_position < 1 and (
                desired_position == self.max_deg_position or desired_position == self.min_deg_position):
            self.current_deg_position = desired_position

    def turn_back(self):
        if abs(self.current_deg_position) < (self.sleep_time * 1.35):
            self.current_deg_position = 0.0
        else:
            sign = 1
            if self.current_deg_position > 0:
                sign = -1

            self.current_deg_position += sign * 1.35 * self.sleep_time

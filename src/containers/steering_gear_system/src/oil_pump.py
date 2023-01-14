import math
import random
import time

from dataclasses import dataclass


@dataclass
class OilPump:
    max_liters_per_second: float = 60.0
    max_rpm: float = 3000.0

    rpm: float = 0.0
    l_per_second: float = 0.0

    governor: float = 0.0
    governor_std: float = 1.0

    time_constant_up: float = 5.0
    time_constant_dn: float = 2.0

    pressure: float = 34.5
    min_pressure: float = 34.5
    max_pressure: float = 75.0

    pressure_valve_open: bool = False
    pressure_valve_flow: float = 0.0

    temperature: float = 20.0
    ambient: float = 20.0

    Kc = 0.0001
    Kp = 0.184

    def run(self):
        self.evolve()
        # print(self)

    def evolve(self):
        target_rpm = self.max_rpm * self.governor
        delta_rpm = target_rpm - self.rpm
        if delta_rpm > 0:
            self.rpm += delta_rpm * (1.0 / self.time_constant_up)
        else:
            self.rpm += delta_rpm * (1.0 / self.time_constant_dn)
        if target_rpm == 0.0 and self.rpm < 1.0:
            self.rpm = 0.0
        elif target_rpm != 0.0 and abs(delta_rpm) < 3 * self.governor_std:
            self.rpm += random.normalvariate(0.0, self.governor_std)

        self.l_per_second = (self.rpm / self.max_rpm) * self.max_liters_per_second - self.pressure_valve_flow

        self.pressure = self.min_pressure + (self.l_per_second / self.max_liters_per_second) * \
                        (self.max_pressure - self.min_pressure) \
                        + random.normalvariate(0.0, 0.5) * self.governor

        if(self.l_per_second > 0.0 ):
            self.temperature += (self.pressure / self.max_pressure) * self.Kp - (
                        (self.temperature - self.ambient) ** 2) * self.Kc
        elif(self.temperature > (self.ambient + 15) ):
            self.temperature += 0.001 * self.Kp - (
                        (self.temperature - self.ambient) ** 2) * self.Kc
        elif(self.governor == 0.0):
            self.temperature -= (self.temperature - self.ambient) * self.Kc
        else:
            self.temperature = self.ambient + 10 + random.normalvariate(0.0, 3)

        if self.pressure_valve_open:
            self.pressure_valve_flow = 0.5
        else:
            self.pressure_valve_flow = 0

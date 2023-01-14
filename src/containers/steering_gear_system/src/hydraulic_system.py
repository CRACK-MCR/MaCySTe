import time
from dataclasses import dataclass
from threading import Thread

from oil_pump import OilPump
from oil_tank import ExpansionTank


# in idle sta tra 10/15 bar
# olio esce e rientra
@dataclass
class HydraulicSystem:
    pump: OilPump
    expansion_tank: ExpansionTank

    sleep_time: float

    return_line_oil_filter: float = 0.0
    oil_tank: float = 100.0
    max_oil_tank: float = 100.0

    def __init__(self, tank: ExpansionTank, sleep_time):
        self.pump = OilPump()
        self.expansion_tank = tank
        self.sleep_time = sleep_time

    def start_simulator(self):
        while True:
            self.pump.run()
            # self.oil_tank = self.max_oil_tank - self.pump.l_per_second
            self.return_line_oil_filter = self.pump.pressure_valve_flow

            time.sleep(self.sleep_time)

    def start_system(self):
        Thread(target=self.start_simulator, daemon=True).start()
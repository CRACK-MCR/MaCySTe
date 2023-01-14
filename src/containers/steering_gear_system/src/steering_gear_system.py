import time
from threading import Thread
from hydraulic_system import HydraulicSystem
from rudder import Rudder
from oil_tank import ExpansionTank


class SteeringGearSystem:
    hydraulic_sys1: HydraulicSystem
    hydraulic_sys2: HydraulicSystem
    oil_tank: ExpansionTank
    rudder: Rudder
    desired_rudder_position: float
    sleep_time: float

    def __init__(self, sleep_time):
        self.oil_tank = ExpansionTank()
        self.hydraulic_sys1 = HydraulicSystem(self.oil_tank, sleep_time)
        self.hydraulic_sys1.pump.governor = 0.0
        self.hydraulic_sys2 = HydraulicSystem(self.oil_tank, sleep_time)
        self.hydraulic_sys2.pump.governor = 0.0
        self.rudder = Rudder(sleep_time)
        self.desired_rudder_position = 0.0
        self.sleep_time = sleep_time

    def start_simulator(self):
        while True:
            shut_down = (self.hydraulic_sys1.pump.governor == 0 and self.hydraulic_sys2.pump.governor == 0)
            if self.desired_rudder_position != 0.0 and not(shut_down):
                is_neg = self.desired_rudder_position < 0.0
                lps1 = self.hydraulic_sys1.pump.l_per_second
                lps2 = self.hydraulic_sys2.pump.l_per_second
                self.rudder.rotate(self.desired_rudder_position, lps1 + lps2, is_neg)
            else:
                self.hydraulic_sys1.return_line_oil_filter = self.hydraulic_sys1.pump.l_per_second
                self.hydraulic_sys2.return_line_oil_filter = self.hydraulic_sys2.pump.l_per_second
                self.rudder.turn_back()

            delta1 = self.hydraulic_sys1.max_oil_tank - self.hydraulic_sys1.oil_tank
            delta2 = self.hydraulic_sys2.max_oil_tank - self.hydraulic_sys2.oil_tank

            if (delta1 + delta2 > 0.0) and self.oil_tank.level > 0.0:
                refill1, refill2 = self.oil_tank.change_level(delta1, delta2)
                self.hydraulic_sys1.oil_tank += refill1
                self.hydraulic_sys2.oil_tank += refill2

            time.sleep(self.sleep_time)

    def start(self):
        self.hydraulic_sys1.start_system()
        self.hydraulic_sys2.start_system()
        Thread(target=self.start_simulator, daemon=True).start()

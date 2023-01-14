from dataclasses import dataclass


@dataclass
class ExpansionTank:
    level: float
    max_level: float = 100.0
    level_indication: float = 100.0
    level1: float = 15.0
    level2: float = 15.0

    def __init__(self):
        self.level = 100.0

    def get_level(self):
        return self.level

    # TODO oil loss logic
    def change_level(self, delta1: float, delta2: float):
        if self.level > 30.0:
            delta = self.level - delta1 - delta2
            if delta >= 30.0:
                self.level -= delta1 + delta2
                retval1 = delta1
                retval2 = delta2
            else:
                delta_to_limit = self.level - 30.0
                common_increment = min(delta1, delta2, (delta_to_limit/2.0))

                delta1 -= common_increment
                delta2 -= common_increment
                delta_to_limit -= 2.0 * common_increment
                retval1 = common_increment
                retval2 = common_increment

                if delta_to_limit > 0.0:
                    if delta1 > 0.0:
                        retval1 += delta_to_limit
                        delta1 -= delta_to_limit
                    elif delta2 > 0.0:
                        retval2 += delta_to_limit
                        delta2 -= delta_to_limit

                if delta1 > 0.0:
                    self.level1 -= delta1
                    retval1 += delta1
                if delta2 > 0.0:
                    self.level2 -= delta2
                    retval2 += delta2
                self.level = self.level1 + self.level2

            return retval1, retval2

        else:
            if self.level1 - delta1 >= 0.0:
                self.level1 -= delta1
                retval1 = delta1
            else:
                retval1 = self.level1
                self.level1 = 0.0

            if self.level2 - delta2 >= 0.0:
                self.level2 -= delta2
                retval2 = delta2
            else:
                retval2 = self.level2
                self.level2 = 0

            self.level = self.level1 + self.level2
            return retval1, retval2
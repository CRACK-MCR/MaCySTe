import time
from threading import Thread

from pymodbus.server.asynchronous import StartTcpServer, StopServer
from pymodbus.datastore import ModbusSequentialDataBlock
from pymodbus.datastore import ModbusSlaveContext, ModbusServerContext
from pymodbus.constants import Endian
from pymodbus.payload import BinaryPayloadBuilder, BinaryPayloadDecoder

byte_order = Endian.Big
word_order = Endian.Little


class ModbusExporter:
    def __init__(self):
        # data structure for input registers
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)

        for i in range(16):
            builder.add_32bit_float(0.0)

        # print(len(builder.to_registers()), builder.to_registers())
        ir_block = ModbusSequentialDataBlock(0, builder.to_registers())
        # data structure for holding registers
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(0.0)
        builder.add_32bit_float(0.0)
        builder.add_32bit_float(0.0)
        for i in range(12):
            builder.add_16bit_uint(0)

        # print(len(builder.to_registers()), builder.to_registers())
        hr_block = ModbusSequentialDataBlock(0, builder.to_registers())

        self.modbus_store = ModbusSlaveContext(
            # Coils (RW, 1bit)
            # co=ModbusSequentialDataBlock(0, [0] * 8),
            # Input registers (RO, 16bit)
            ir=ir_block,
            # Holding registers (RW, 16bit)
            hr=hr_block,
            zeromode=True
        )
        self.context = ModbusServerContext(self.modbus_store, True)

    def start_server(self, address, port):
        def start_server_inner():
            StartTcpServer(self.context, address=(address, port))

        Thread(target=start_server_inner, daemon=True).start()

    def stop_server(self):
        StopServer()

    # Holding Registers set and get functions

    def set_governor(self, governor: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(governor[0]))
        builder.add_32bit_float(float(governor[1]))
        self.context[0x00].setValues(3, 0, builder.to_registers())

    def get_governor(self):
        regs = [self.context[0x00].getValues(3, 0)[0],
                self.context[0x00].getValues(3, 1)[0],
                self.context[0x00].getValues(3, 2)[0],
                self.context[0x00].getValues(3, 3)[0]]
        gov1 = BinaryPayloadDecoder.fromRegisters([regs[0], regs[1]], byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        gov2 = BinaryPayloadDecoder.fromRegisters([regs[2], regs[3]], byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [gov1, gov2]

    def set_rudder_desired_pos(self, desired_pos):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(desired_pos))

        self.context[0x00].setValues(3, 4, builder.to_registers())

    def get_rudder_desired_pos(self):
        reg1 = self.context[0x00].getValues(3, 4)
        reg2 = self.context[0x00].getValues(3, 5)
        reg = [reg1[0], reg2[0]]
        return BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()

    def set_pressure_valve_open(self, is_open):
        self.context[0x00].setValues(3, 6, [int(is_open[0])])
        self.context[0x00].setValues(3, 9, [int(is_open[1])])

    def get_pressure_valve_open(self):
        res1 = bool(self.context[0x00].getValues(3, 6)[0])
        res2 = bool(self.context[0x00].getValues(3, 9)[0])
        return [res1, res2]

    # [low_level_stop_pump_1, low_level_stop_pump_2,
    #  oil_filter_high_differential_pressure_alarm_1,
    #  oil_filter_high_differential_pressure_alarm_2,
    #  high_oil_temp_alarm_1, high_oil_temp_alarm_2,
    #  low_level_exp_tank_alarm]

    def set_alarms(self, alarm):
        self.context[0x00].setValues(3, 7, [int(alarm[2]), int(alarm[4])])
        self.context[0x00].setValues(3, 10, [int(alarm[3]), int(alarm[5])])
        self.context[0x00].setValues(3, 12, [int(alarm[0]), int(alarm[1])])
        self.context[0x00].setValues(3, 14, [int(alarm[6])])

    def get_alarms(self):
        res = [bool(self.context[0x00].getValues(3, 12)[0]), bool(self.context[0x00].getValues(3, 13)[0]),
               bool(self.context[0x00].getValues(3, 7)[0]), bool(self.context[0x00].getValues(3, 10)[0]),
               bool(self.context[0x00].getValues(3, 8)[0]), bool(self.context[0x00].getValues(3, 11)[0]),
               bool(self.context[0x00].getValues(3, 14)[0])]
        return res

    def set_governor_switch(self, switch: []):
        self.context[0x00].setValues(3, 15, [int(switch[0]), int(switch[1])])

    def get_governor_switch(self):
        result = [bool(self.context[0x00].getValues(3, 15)[0]),
                  bool(self.context[0x00].getValues(3, 16)[0])]
        return result

    # Input Registers set and get functions
    def set_rpm(self, rpm: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(rpm[0]))
        self.context[0x00].setValues(4, 0, builder.to_registers())
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(rpm[1]))
        self.context[0x00].setValues(4, 10, builder.to_registers())

    def get_rpm(self):
        reg1 = self.context[0x00].getValues(4, 0)
        reg2 = self.context[0x00].getValues(4, 1)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 10)
        reg2 = self.context[0x00].getValues(4, 11)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_l_per_second(self, lps: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(lps[0]))
        self.context[0x00].setValues(4, 2, builder.to_registers())
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(lps[1]))
        self.context[0x00].setValues(4, 12, builder.to_registers())

    def get_l_per_second(self):
        reg1 = self.context[0x00].getValues(4, 2)
        reg2 = self.context[0x00].getValues(4, 3)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 12)
        reg2 = self.context[0x00].getValues(4, 13)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_pressure_valve_flow(self, flow: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(flow[0]))
        self.context[0x00].setValues(4, 4, builder.to_registers())
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(flow[1]))
        self.context[0x00].setValues(4, 14, builder.to_registers())

    def get_pressure_valve_flow(self):
        reg1 = self.context[0x00].getValues(4, 4)
        reg2 = self.context[0x00].getValues(4, 5)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 14)
        reg2 = self.context[0x00].getValues(4, 15)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_pressure(self, pressure: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(pressure[0]))
        self.context[0x00].setValues(4, 6, builder.to_registers())
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(pressure[1]))
        self.context[0x00].setValues(4, 16, builder.to_registers())

    def get_pressure(self):
        reg1 = self.context[0x00].getValues(4, 6)
        reg2 = self.context[0x00].getValues(4, 7)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 16)
        reg2 = self.context[0x00].getValues(4, 17)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_temperature(self, temperature: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(temperature[0]))
        self.context[0x00].setValues(4, 8, builder.to_registers())
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(temperature[1]))
        self.context[0x00].setValues(4, 18, builder.to_registers())

    def get_temperature(self):
        reg1 = self.context[0x00].getValues(4, 8)
        reg2 = self.context[0x00].getValues(4, 9)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 18)
        reg2 = self.context[0x00].getValues(4, 19)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_oil_level(self, oil_level: []):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(oil_level[0]))
        builder.add_32bit_float(float(oil_level[1]))
        self.context[0x00].setValues(4, 20, builder.to_registers())

    def get_oil_level(self):
        reg1 = self.context[0x00].getValues(4, 20)
        reg2 = self.context[0x00].getValues(4, 21)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 22)
        reg2 = self.context[0x00].getValues(4, 23)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2]

    def set_expansion_oil_level(self, oil_levels):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(oil_levels[0]))
        builder.add_32bit_float(float(oil_levels[1]))
        builder.add_32bit_float(float(oil_levels[2]))
        self.context[0x00].setValues(4, 24, builder.to_registers())

    def get_expansion_oil_level(self):
        reg1 = self.context[0x00].getValues(4, 24)
        reg2 = self.context[0x00].getValues(4, 25)
        reg = [reg1[0], reg2[0]]
        var1 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 26)
        reg2 = self.context[0x00].getValues(4, 27)
        reg = [reg1[0], reg2[0]]
        var2 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        reg1 = self.context[0x00].getValues(4, 28)
        reg2 = self.context[0x00].getValues(4, 29)
        reg = [reg1[0], reg2[0]]
        var3 = BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()
        return [var1, var2, var3]

    def set_current_deg_pos(self, current_pos):
        builder = BinaryPayloadBuilder(byteorder=byte_order, wordorder=word_order)
        builder.add_32bit_float(float(current_pos))
        self.context[0x00].setValues(4, 30, builder.to_registers())

    def get_current_deg_pos(self):
        reg1 = self.context[0x00].getValues(4, 30)
        reg2 = self.context[0x00].getValues(4, 31)
        reg = [reg1[0], reg2[0]]
        return BinaryPayloadDecoder.fromRegisters(reg, byteorder=byte_order,
                                                  wordorder=word_order).decode_32bit_float()

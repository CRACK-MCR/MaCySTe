import argparse
import time
import sys
import traceback
import os
import queue
import asyncio
from modBusServer import ModbusExporter
from steering_gear_system import SteeringGearSystem
from natsExporter import NatsExporter

if __name__ == '__main__':
    parser = argparse.ArgumentParser()

    parser.add_argument('--address', type=str, dest='address', required=False, help="Specify listen address")
    parser.add_argument('--port', type=int, dest='port', required=False, help="Specify listen port")
    parser.add_argument('--verbose', dest='verbose', action='store_true', help="Enable verbose output")
    parser.add_argument('-r', type=float, dest="refresh", required=False, help="Refresh time (seconds)")
    parser.add_argument('--nats_url', type=str, dest='nats_url', required=False, help="Nats URL")
    parser.add_argument('--nats_topic', type=str, dest='nats_topic', required=False, help="Nats topic")
    parser.set_defaults(address=os.environ.get("LISTEN_ADDRESS","0.0.0.0"))
    parser.set_defaults(port=os.environ.get("MODBUS_PORT", 502))
    parser.set_defaults(refresh=os.environ.get("REFRESH_TIME", 0.2))
    parser.set_defaults(verbose=os.environ.get("VERBOSE", False))
    parser.set_defaults(nats_url=os.environ.get("NATS_URL", "nats://127.0.0.1"))
    parser.set_defaults(nats_topic=os.environ.get("NATS_TOPIC", "PHYSICS"))

    args = parser.parse_args()
    print("[address: ", args.address, "] [port: ", args.port, "] [verbose: ", args.verbose, "], [refresh: ", args.refresh, " sec] [nats url: ", args.nats_url, "] [nats topic", args.nats_topic, "]")
    print("Start server...")
    server = ModbusExporter()
    server.start_server(args.address, args.port)
    print("Server started...")

    s_g_sys = SteeringGearSystem(args.refresh)
    print("Start Steering Gear System...")
    s_g_sys.start()
    print("Steering gear System started...")

    if not args.verbose:
        print("For a complete log, run the program with option --verbose")

    s_g_sys.desired_rudder_position = 0.0
    server.set_rudder_desired_pos(0.0)

    print("Starting nats exporter")
    nats_exporter = NatsExporter(args.nats_url, args.nats_topic)
    nats_exporter.start_nats()
    print("Nats Exporter started")
    i = 0.0
    while True:
        try:
            rpm1 = s_g_sys.hydraulic_sys1.pump.rpm
            rpm2 = s_g_sys.hydraulic_sys2.pump.rpm
            lps1 = s_g_sys.hydraulic_sys1.pump.l_per_second
            lps2 = s_g_sys.hydraulic_sys2.pump.l_per_second
            pressure1 = s_g_sys.hydraulic_sys1.pump.pressure
            pressure2 = s_g_sys.hydraulic_sys2.pump.pressure
            temperature1 = s_g_sys.hydraulic_sys1.pump.temperature
            temperature2 = s_g_sys.hydraulic_sys2.pump.temperature
            level1 = s_g_sys.hydraulic_sys1.oil_tank
            level2 = s_g_sys.hydraulic_sys2.oil_tank
            exp_tank_oil = s_g_sys.oil_tank.level
            exp_tank_oil1 = s_g_sys.oil_tank.level1
            exp_tank_oil2 = s_g_sys.oil_tank.level2
            current_position = s_g_sys.rudder.current_deg_position

            server.set_rpm([rpm1, rpm2])
            server.set_l_per_second([lps1, lps2])
            server.set_pressure([pressure1, pressure2])
            server.set_temperature([temperature1, temperature2])
            server.set_oil_level([level1, level2])
            server.set_expansion_oil_level([exp_tank_oil, exp_tank_oil1, exp_tank_oil2])
            server.set_current_deg_pos(current_position)

            desired_rudder_position = server.get_rudder_desired_pos()
            s_g_sys.desired_rudder_position = desired_rudder_position
            governor = server.get_governor()
            s_g_sys.hydraulic_sys1.pump.governor = governor[0]
            s_g_sys.hydraulic_sys2.pump.governor = governor[1]
            pressure_valve_open = server.get_pressure_valve_open()
            s_g_sys.hydraulic_sys1.pump.pressure_valve_open = pressure_valve_open[0]
            s_g_sys.hydraulic_sys1.pump.pressure_valve_open = pressure_valve_open[1]
            flow1 = s_g_sys.hydraulic_sys1.pump.pressure_valve_flow
            flow2 = s_g_sys.hydraulic_sys2.pump.pressure_valve_flow
            server.set_pressure_valve_flow([flow1, flow2])

            # [low_level_stop_pump_1, low_level_stop_pump_2,
            #  oil_filter_high_differential_pressure_alarm_1,
            #  oil_filter_high_differential_pressure_alarm_2,
            #  high_oil_temp_alarm_1, high_oil_temp_alarm_2,
            #  low_level_exp_tank_alarm]
            alarms = server.get_alarms()
            low_level_oil = alarms[:2]
            oil_filter_high_pressure = alarms[2:4]
            high_temp_alarm = alarms[4:6]
            low_level_exp_tank = alarms[6]

            pump_switch = server.get_governor_switch()

            nats_values = [
                #(struct.pack("f", current_position), (args.nats_topic + ".RUDDER")),
                #(struct.pack("?", pump_switch[0]), (args.nats_topic + ".PUMP1")),
                #(struct.pack("?", pump_switch[1]), (args.nats_topic + ".PUMP2"))
                (str.encode(str(current_position)), (args.nats_topic + ".RUDDER")),
                (str.encode(str(pump_switch[0])), (args.nats_topic + ".PUMP1")),
                (str.encode(str(pump_switch[1])), (args.nats_topic + ".PUMP2"))
            ]
            nats_exporter.put_in_queue(nats_values)
            
            i += 1.0
            if args.verbose and ((i*args.refresh)%5.0 == 0):
                print('Modbus status:')
                print('Expansion Tank = {}'.format(exp_tank_oil))
                if low_level_exp_tank:
                    print('ALARM: low level expansion tank - TANK DIVIDED')
                    print('EXPANSION TANK PUMP 1 = {}'. format(exp_tank_oil1))
                    print('EXPANSION TANK PUMP 2 = {}'.format(exp_tank_oil2))

                print('Rudder position = {}° -- Desired position = {}°'.format(current_position,
                                                                               desired_rudder_position))
                print('--------------')
                print('Hydraulic System 1:')
                if pressure_valve_open[0]:
                    print('WARNING: pressure too high, valve open')

                if oil_filter_high_pressure[0]:
                    print('ALARM: high pressure in oil filter')

                if high_temp_alarm[0]:
                    print('ALARM: high oil temperature')

                if low_level_oil[0]:
                    print('ALARM: low oil level')

                print('Pump: [rpm={}, lps={}, pressure={}, flow={}, temperature={}], [governor={}]'
                      .format(rpm1, lps1, pressure1, flow1, temperature1, governor[0]))
                print('Oil Tank: [level={} l]'.format(level1))
                print('--------------')
                print('Hydraulic System 2:')
                if pressure_valve_open[1]:
                    print('WARNING: pressure too high, valve open')

                if oil_filter_high_pressure[1]:
                    print('ALARM: high pressure in oil filter')

                if high_temp_alarm[1]:
                    print('ALARM: high oil temperature')

                if low_level_oil[1]:
                    print('ALARM: low oil level')
                print('Pump: [rpm={}, lps={}, pressure={}, flow={}, temperature={}], [governor={}]'
                      .format(rpm2, lps2, pressure2, flow2, temperature2, governor[1]))
                print('Oil Tank: [level={} l]'.format(level2))
                print('--------------')
                print('--------------')
                print('--------------')

            sys.stdout.flush()
            time.sleep(args.refresh)
        except Exception as e:
            traceback.print_exc()

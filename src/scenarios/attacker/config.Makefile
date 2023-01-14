# Modules definition
# 	they are used in order so if a module depends on the outputs (e.g. IPs) of another it should be put as successor
MODULES += nets_base # Basic networking
MODULES += nats # NATS message broker
MODULES += rtu_ai rtu_gp rtu_he rtu_ii rtu_ra rtu_sd rtu_ti # RTUs
MODULES += engine_sim_plc_l engine_sim_plc_r # Engine fictitious PLCs
MODULES += engine_telegraph_l engine_telegraph_r # Engine telegraphs
MODULES += steering_gear_physics sgs_pump_1 sgs_pump_2 sgs_oil_1 sgs_oil_2 sgs_oil_tank sgs_master sgs_hmi # SGS simulator
MODULES += helm # Rudder actuator
MODULES += autopilot # Autopilot system
MODULES += gui_instruments # GUI for autopilot, helm and engine telegraphs
MODULES += ecdis_opencpn # ECDIS (OpenCPN)
MODULES += radar_converter_asterix ppi_asterix # ASTERIX radar
MODULES += radar_converter_navico ppi_navico   # NAVICO radar
MODULES += nets_attacker satellite_router websocket_to_websocket malware_ship_side gui_attack # Attacker
MODULES += gui_home # GUI for MaCySTe (leave it near the end if you are leveraging the dynamic GUI functionality)

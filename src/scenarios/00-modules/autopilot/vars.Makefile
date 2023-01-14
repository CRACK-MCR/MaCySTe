autopilot_pod_autopilot_extra_vars += \
	nmea_host \
	nmea_port \
	rudder_plc_host \
	rudder_plc_port \
	rudder_plc_addr \
	telegraph_l_plc_host \
	telegraph_l_plc_port \
	telegraph_l_plc_addr \
	telegraph_r_plc_host \
	telegraph_r_plc_port \
	telegraph_r_plc_addr

autopilot_pod_autopilot_extra_var_nmea_host = $(nmea_multicast_ip)
autopilot_pod_autopilot_extra_var_nmea_port = $(nmea_multicast_port)

autopilot_pod_autopilot_extra_var_rudder_plc_host = $(sgs_master_pod_openplc_eth1_ip)
autopilot_pod_autopilot_extra_var_rudder_plc_port = 502
autopilot_pod_autopilot_extra_var_rudder_plc_addr = 1130

autopilot_pod_autopilot_extra_var_telegraph_l_plc_host = $(engine_sim_plc_l_pod_modbus_nats_kv_server_eth0_ip)
autopilot_pod_autopilot_extra_var_telegraph_l_plc_port = 502
autopilot_pod_autopilot_extra_var_telegraph_l_plc_addr = 0

autopilot_pod_autopilot_extra_var_telegraph_r_plc_host = $(engine_sim_plc_r_pod_modbus_nats_kv_server_eth0_ip)
autopilot_pod_autopilot_extra_var_telegraph_r_plc_port = 502
autopilot_pod_autopilot_extra_var_telegraph_r_plc_addr = 0
engine_sim_plc_r_pod_modbus_nats_kv_server_extra_vars += \
	pod_name \
	nats_topic \
	modbus_host

engine_sim_plc_r_pod_modbus_nats_kv_server_extra_var_pod_name = engine-r
engine_sim_plc_r_pod_modbus_nats_kv_server_extra_var_nats_topic = physics.THROTTLE.R
engine_sim_plc_r_pod_modbus_nats_kv_server_extra_var_modbus_host = $(engine_sim_plc_r_pod_modbus_nats_kv_server_eth0_ip)

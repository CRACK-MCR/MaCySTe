rtu_gp_pod_nmea_demux_extra_vars += \
	demux_multicast_if \
	demux_name \
	demux_sender \
	demux_send_address

rtu_gp_pod_nmea_demux_extra_var_demux_multicast_if = $(rtu_gp_pod_nmea_demux_eth0_ip)
rtu_gp_pod_nmea_demux_extra_var_demux_name = gp
rtu_gp_pod_nmea_demux_extra_var_demux_sender = GP
rtu_gp_pod_nmea_demux_extra_var_demux_send_address = $(nmea_multicast_ip):$(nmea_multicast_port)

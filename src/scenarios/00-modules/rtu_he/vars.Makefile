rtu_he_pod_nmea_demux_extra_vars += \
	demux_multicast_if \
	demux_name \
	demux_sender \
	demux_send_address

rtu_he_pod_nmea_demux_extra_var_demux_multicast_if = $(rtu_he_pod_nmea_demux_eth0_ip)
rtu_he_pod_nmea_demux_extra_var_demux_name = he
rtu_he_pod_nmea_demux_extra_var_demux_sender = HE
rtu_he_pod_nmea_demux_extra_var_demux_send_address = $(nmea_multicast_ip):$(nmea_multicast_port)

nmea_probe_pod_nmea_probe_extra_vars += \
	nmea_host \
	nmea_port \
	opensearch_url

nmea_probe_pod_nmea_probe_extra_var_nmea_host = $(nmea_multicast_ip)
nmea_probe_pod_nmea_probe_extra_var_nmea_port = $(nmea_multicast_port)
nmea_probe_pod_nmea_probe_extra_var_opensearch_url = https://$(siem_opensearch_pod_opensearch_eth0_ip):9200

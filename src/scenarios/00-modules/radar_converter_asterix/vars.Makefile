radar_converter_asterix_pod_radar_converter_extra_vars += \
	radar_converter_name \
	buffer_size \
	bind_interface \
	protocol \
	asterix_address \
	asterix_port \
	image_multicast_if

radar_converter_asterix_pod_radar_converter_extra_var_radar_converter_name = asterix
radar_converter_asterix_pod_radar_converter_extra_var_buffer_size = 30
radar_converter_asterix_pod_radar_converter_extra_var_bind_interface = $(radar_converter_asterix_pod_radar_converter_eth0_ip)
radar_converter_asterix_pod_radar_converter_extra_var_protocol = ASTERIX
radar_converter_asterix_pod_radar_converter_extra_var_asterix_address = $(asterix_multicast_ip)
radar_converter_asterix_pod_radar_converter_extra_var_asterix_port = $(asterix_multicast_port)
radar_converter_asterix_pod_radar_converter_extra_var_image_multicast_if = $(radar_converter_asterix_pod_radar_converter_eth0_ip)

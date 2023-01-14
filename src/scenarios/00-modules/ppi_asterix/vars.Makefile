ppi_asterix_pod_gui_asterix_extra_vars += \
	proxies_multicast_interface \
	asterix_ws_url \
	asterix_address \
	asterix_port

ppi_asterix_pod_gui_asterix_extra_var_proxies_multicast_interface = $(ppi_asterix_pod_gui_asterix_eth0_ip)
ppi_asterix_pod_gui_asterix_extra_var_asterix_ws_url = ws://$(ppi_asterix_pod_gui_asterix_mgmt0_ip):9090/ASTERIX/BINARY
ppi_asterix_pod_gui_asterix_extra_var_asterix_address = $(asterix_multicast_ip)
ppi_asterix_pod_gui_asterix_extra_var_asterix_port = $(asterix_multicast_port)

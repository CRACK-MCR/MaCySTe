ppi_navico_pods += opencpn

ppi_navico_pod_opencpn_network_interfaces += eth0 mgmt0
ppi_navico_pod_opencpn_eth0_network = BRIDGE
ppi_navico_pod_opencpn_mgmt0_network = MANAGEMENT

gui_home_pod_gui_home_manifest_extensions += $(SCENARIO_DIR)/ppi_navico/gui_home.yaml

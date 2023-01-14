ecdis_opencpn_pods += opencpn

ecdis_opencpn_pod_opencpn_network_interfaces += eth0 mgmt0
ecdis_opencpn_pod_opencpn_eth0_network = BRIDGE
ecdis_opencpn_pod_opencpn_mgmt0_network = MANAGEMENT

gui_home_pod_gui_home_manifest_extensions += $(SCENARIO_DIR)/ecdis_opencpn/gui_home.yaml

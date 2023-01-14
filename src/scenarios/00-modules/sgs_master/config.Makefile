sgs_master_pods += openplc

sgs_master_pod_openplc_network_interfaces += eth0 eth1 mgmt0
sgs_master_pod_openplc_eth0_network = SERIAL
sgs_master_pod_openplc_eth1_network = CONTROL
sgs_master_pod_openplc_mgmt0_network = MANAGEMENT

sgs_master_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/sgs_master/pod.yaml

gui_home_pod_gui_home_manifest_extensions += $(SCENARIO_DIR)/sgs_master/gui_home.yaml

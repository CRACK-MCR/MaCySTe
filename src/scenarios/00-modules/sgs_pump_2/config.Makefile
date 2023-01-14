sgs_pump_2_pods += openplc

sgs_pump_2_pod_openplc_network_interfaces += eth0
sgs_pump_2_pod_openplc_eth0_network = SERIAL

sgs_pump_2_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/sgs_pump_2/pod.yaml

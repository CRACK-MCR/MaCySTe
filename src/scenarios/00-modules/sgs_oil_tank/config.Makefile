sgs_oil_tank_pods += openplc

sgs_oil_tank_pod_openplc_network_interfaces += eth0
sgs_oil_tank_pod_openplc_eth0_network = SERIAL

sgs_oil_tank_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/sgs_oil_tank/pod.yaml

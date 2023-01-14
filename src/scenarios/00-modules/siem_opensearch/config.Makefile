siem_opensearch_pods += opensearch

siem_opensearch_pod_opensearch_network_interfaces += eth0 mgmt0
siem_opensearch_pod_opensearch_eth0_network = SIEM
siem_opensearch_pod_opensearch_mgmt0_network = MANAGEMENT

gui_home_pod_gui_home_manifest_extensions += $(SCENARIO_DIR)/siem_opensearch/gui_home.yaml
siem_opensearch_pod_opensearch_manifest_extensions += $(SCENARIO_DIR)/siem_opensearch/index_patterns.yaml

siem_opensearch_pod_opensearch_state_dirs += opensearch

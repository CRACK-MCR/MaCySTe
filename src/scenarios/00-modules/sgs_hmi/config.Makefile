sgs_hmi_pods += fuxa

sgs_hmi_pod_fuxa_network_interfaces += eth0 mgmt0
sgs_hmi_pod_fuxa_eth0_network = CONTROL
sgs_hmi_pod_fuxa_mgmt0_network = MANAGEMENT

sgs_hmi_pod_fuxa_state_dirs += fuxa/sgs/appdata
sgs_hmi_pod_fuxa_state_dirs += fuxa/sgs/db

gui_home_pod_gui_home_manifest_extensions += $(SCENARIO_DIR)/sgs_hmi/gui_home.yaml

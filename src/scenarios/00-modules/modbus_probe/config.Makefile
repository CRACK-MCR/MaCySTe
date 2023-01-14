sgs_master_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_master_pod_openplc_network_interfaces += siem0
sgs_master_pod_openplc_siem0_network = SIEM

sgs_pump_1_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_pump_1_pod_openplc_network_interfaces += siem0
sgs_pump_1_pod_openplc_siem0_network = SIEM

sgs_pump_2_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_pump_2_pod_openplc_network_interfaces += siem0
sgs_pump_2_pod_openplc_siem0_network = SIEM

sgs_oil_1_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_oil_1_pod_openplc_network_interfaces += siem0
sgs_oil_1_pod_openplc_siem0_network = SIEM

sgs_oil_2_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_oil_2_pod_openplc_network_interfaces += siem0
sgs_oil_2_pod_openplc_siem0_network = SIEM

sgs_oil_tank_pod_openplc_manifest_extensions += $(SCENARIO_DIR)/modbus_probe/exporter.yaml
sgs_oil_tank_pod_openplc_network_interfaces += siem0
sgs_oil_tank_pod_openplc_siem0_network = SIEM

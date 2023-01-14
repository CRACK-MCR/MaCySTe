nats_pod_nats_extra_vars += \
	nats_config_file \
	nats_js_store_dir

nats_pod_nats_extra_var_nats_config_file = $(CONFIG_DIR)/nats/nats.conf
nats_pod_nats_extra_var_nats_js_store_dir = $(nats_pod_nats_state_dir_nats)

nats_management_url ?= nats://$(nats_pod_nats_mgmt0_ip):4222
nats_url ?= nats://$(nats_pod_nats_eth0_ip):4222
nats_ws_url ?= ws://$(nats_pod_nats_mgmt0_ip):80

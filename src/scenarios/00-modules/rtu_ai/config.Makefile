rtu_ai_pods += nmea_demux

rtu_ai_pod_nmea_demux_network_interfaces += eth0 nats0
rtu_ai_pod_nmea_demux_eth0_network = BRIDGE
rtu_ai_pod_nmea_demux_nats0_network = NATS

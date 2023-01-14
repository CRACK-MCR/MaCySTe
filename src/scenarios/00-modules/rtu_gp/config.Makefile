rtu_gp_pods += nmea_demux

rtu_gp_pod_nmea_demux_network_interfaces += eth0 nats0
rtu_gp_pod_nmea_demux_eth0_network = BRIDGE
rtu_gp_pod_nmea_demux_nats0_network = NATS

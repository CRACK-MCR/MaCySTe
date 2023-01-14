rtu_sd_pods += nmea_demux

rtu_sd_pod_nmea_demux_network_interfaces += eth0 nats0
rtu_sd_pod_nmea_demux_eth0_network = BRIDGE
rtu_sd_pod_nmea_demux_nats0_network = NATS

rtu_ra_pods += nmea_demux

rtu_ra_pod_nmea_demux_network_interfaces += eth0 nats0
rtu_ra_pod_nmea_demux_eth0_network = BRIDGE
rtu_ra_pod_nmea_demux_nats0_network = NATS

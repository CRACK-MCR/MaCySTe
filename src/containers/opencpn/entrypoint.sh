#!/bin/sh
# if [ -n "$NMEA_MULTICAST_IP" ]; then
#   ip addr add $NMEA_MULTICAST_IP dev eth0 autojoin
# fi
# ip addr add 236.6.7.8 dev eth0 autojoin
exec /usr/bin/supervisord -c /etc/supervisord.conf
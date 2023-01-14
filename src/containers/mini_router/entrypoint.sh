#!/bin/sh
loop_forever() {
    while true; do
        sleep 600
    done
}

if [ "$1" = "router" ]; then
    for forward_interface in $FORWARD_INTERFACES; do
        echo "Will SNAT traffic entering from $forward_interface"
        iptables -A FORWARD -i "$forward_interface" -j ACCEPT
    done
    echo "Will SNAT traffic exiting from $SNAT_INTERFACE"
    iptables -t nat -A POSTROUTING -o "$SNAT_INTERFACE" -j MASQUERADE
    if [ -n "$GATEWAY_IP" ]; then
        echo "Setting gateway IP to $GATEWAY_IP"
        ip route add default via "$GATEWAY_IP"
    fi
    loop_forever
elif [ "$1" = "init-container" ]; then
    ip route flush default || true
    ip route add default via "$GATEWAY_IP"
else
    echo "Command unknown"
    exit 1
fi

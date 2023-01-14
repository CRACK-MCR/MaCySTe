# Network

MaCySTe simulates the networks onboard of the ship with two technologies:

- MACVLAN networks attached to dummies which are not reachable by the host and act as completely isolated L2 domains
- Bridge networks reachable by the host

## MACVLAN networks

These MACVLAN networks act as virtual cables, completely segregated from the host and allowing a pristine network environment.

- **Bridge** (`10.1.5.0/24`), the network containing the ship Integrated Navigation System
- **Control** (`10.1.3.0/24`), the network containing the ship control systems and engineering workstation
- **Serial** (`10.1.2.0/24`), a network emulating direct connections (_this is a non-scenario network with unrepresentative traffic_)
- **NATS** (`10.1.4.0/24`), a network allowing communication with the message queue (_this is a non-scenario network with unrepresentative traffic_)

## Bridge networks

These networks are host-reachable and are used for interacting with the scenario components

- **Management** (`192.168.249.0/24`), the network allowing the host to reach tools such as the [GUI](./gui-home.md) (_this is a non-scenario network with unrepresentative traffic_)

## Attacker addon

These additional networks will be deployed as part of the [attacker addon](./addon-attacker.md)

- **Simulated internet** (MACVLAN `198.51.0.0/16`), a network simulating a public internet

## SIEM addon

These additional networks will be deployed as part of the [SIEM addon](./addon-siem.md)

- **SIEM** (MACVLAN `10.1.6.0/24`), a network joining the probes and the SIEM

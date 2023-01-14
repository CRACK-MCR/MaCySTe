# Summary

[Introduction](./introduction.md)

# Running MaCySTe

- [Prerequisites](./running/prerequisites.md)
- [Running](./running/running.md)

# Using MaCySTe

- [As a dataset generator](./using/dataset.md)
  - [NMEA sentences](./using/dataset-nmea.md)
  - [RADAR data](./using/dataset-radar.md)
    - [ASTERIX protocol](./using/dataset-radar-asterix.md)
    - [NAVICO protocol](./using/dataset-radar-navico.md)
  - [Industrial Control System data](./using/dataset-modbus.md)
- [As a target for attacks](./using/attacks.md)
  - [to the INS](./using/attacks-ins.md)
  - [to the radar](./using/attacks-radar.md)

# MaCySTe components reference

- [Ship elements](./reference/ship.md)
  - [Network](./reference/network.md)
  - [Scenarios](./reference/scenario.md)
    - [Genova harbor](./reference/scenario-genova.md)
  - [Simulator](./reference/bridgecommand.md)
  - [Autopilot](./reference/autopilot.md)
  - [ECDIS](./reference/ecdis.md)
  - [GUI home](./reference/gui-home.md)
  - [GUI instruments](./reference/instruments.md)
    - [Autopilot](./reference/instruments-autopilot.md)
    - [Rudder](./reference/instruments-rudder.md)
    - [Telegraphs](./reference/instruments-telegraphs.md)
  - [Propulsion System](./reference/propulsion-system.md)
  - [Steering Gear System](./reference/steering-gear-system.md)
  - [RADAR Plan Position Indicators](./reference/ppi.md)
    - [ASTERIX PPI](./reference/ppi-asterix.md)
    - [OpenCPN PPI](./reference/ppi-opencpn.md)
- [Toolkit elements](./reference/toolkit.md)
  - [Message queue](./reference/nats.md)
  - [ModBus to message queue bridge](./reference/nats-modbus.md)
  - [INS data multiplexers and demultiplexers](./reference/mux-demux.md)
  - [RADAR signal generator](./reference/radar-converter.md)
  - [Single page application hoster](./reference/spa-hoster.md)
  - [Software PLCs](./reference/openplc.md)
  - [UDP to websocket connector](./reference/udp-to-websocket.md)
- [Attacker addon](./reference/addon-attacker.md)
  - [Attack GUI](./reference/attack-gui.md)
  - [Malware](./reference/malware.md)
  - [Mini router](./reference/mini-router.md)
  - [Websocket to Websocket proxy](./reference/websocket-to-websocket.md)
- [SIEM addon](./reference/addon-siem.md)
  - [ModBus probe](./reference/modbus-probe.md)
  - [NMEA probe](./reference/nmea-probe.md)
  - [OpenSearch](./reference/opensearch.md)

# Extending MaCySTe

- [Contributing](./extending/contributing.md)
- [Repository structure](./extending/repo.md)
- [Licensing and giving credit](./extending/licensing.md)

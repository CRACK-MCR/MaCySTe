# Radar converter

This service is responsible for receiving the raw radar data matrix from BridgeCommand (via a NATS Key Value store) and converting it into either:

- Navico BR24 protocol compatible with the radar_pi OpenCPN plugin
- ASTERIX CAT240 compatible with our own viewer

The emulated antenna produces 4096 spokes consisting of 512 individual cells.

## Usage

### Navico BR24

Since Navico BR24 leverages IP multicast, the only setting needed for operation is setting the `BIND_INTERFACE` to the IP address of the desired interface with Layer2 proximity with the radar.

### ASTERIX CAT240

ASTERIX requires more settings:

- `PROTOCOL` which must be `ASTERIX`
- `BIND_INTERFACE` to the IP address of the desired interface
- `ASTERIX_ADDRESS` and `ASTERIX_PORT` to the destination IP and port for sending ASTERIX

### Help

```
usage:  [-h] [--base-topic BASE_TOPIC] [--nats-url NATS_URL] [--verbose] [--broadcast] [--multicast-loop]
        [--multicast-ttl MULTICAST_TTL] [--multicast-if MULTICAST_IF] [--bind-interface BIND_INTERFACE]
        [--buffer-size BUFFER_SIZE] [--protocol PROTOCOL] [--asterix-port ASTERIX_PORT]
        [--asterix-address ASTERIX_ADDRESS]

options:
  -h, --help            show this help message and exit
  --base-topic BASE_TOPIC
                        Base topic to use for NATS
  --nats-url NATS_URL   URL for connecting to NATS
  --verbose             Enable verbose logging
  --broadcast           Set socket in broadcast mode
  --multicast-loop      Set socket IP_MULTICAST_LOOP option
  --multicast-ttl MULTICAST_TTL
                        Set socket IP_MULTICAST_TTL option
  --multicast-if MULTICAST_IF
                        Set socket IP_MULTICAST_IF option
  --bind-interface BIND_INTERFACE
                        IP where receiving multicast
  --buffer-size BUFFER_SIZE
                        Buffer size to use
  --protocol PROTOCOL   Protocol: ASTERIX or NAVICO
  --asterix-port ASTERIX_PORT
                        ASTERIX destination port
  --asterix-address ASTERIX_ADDRESS
                        ASTERIX destination address
```

## NATS topic reference

This transducer will look for data inside of a key-value bucket called `MATRIX`.

The key `heading` should contain the boat current heading as a float (see [nats_image.py](./src/nats_image.py) at line 46 for details).

The keys `lineXXX` where `xxx` is $\in [0, 4096)$ each contain 512 bytes corresponding to the echo cells relative to the `xxx` spoke. Conversion between `xxx` and angular range can be seen in [nats_image.py](./src/nats_image.py) at lines 212-215.

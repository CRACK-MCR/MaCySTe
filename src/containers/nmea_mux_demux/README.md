# NMEA Muxer and Demuxer

The role of this container is to either:

- `DEMUX`: Receive NMEA from a simulator, spreading the sentences onto multiple NATS topics depending on their kind and talker
- `MUX`: Receive NMEA sentences from one or more NATS topics and send them to the network

## Usage

One demux should be put close to the simulator, multiple muxes should be placed to simulate the sensors belonging to the simulator.

For a typical NMEA talker sentence we allow demuxers to dispatch NMEA selecting a talker, a sentence type of a combination of the two. Such choice is an OR.

For instance, a demux set to dispatch `GP` talkers would send `GPGGA`, `GPGLL` but not `IIGLL`.
Similarly, a demux set to dispatch `HDT` sentences would send `HEHDT`, `RAHDT` but not `HEHDM`.

```
$RATTM,...
   ^^^
 ^^ |
  | L-- Sentence
  L---- Talker
```

## Help

```
usage: [-h] [--base-topic BASE_TOPIC] [--nats-url NATS_URL] [--verbose] {mux,demux} ...

positional arguments:
  {mux,demux}           Command
    mux                 Multiplex streams
    demux               Demultiplex streams

options:
  -h, --help            show this help message and exit
  --base-topic BASE_TOPIC
                        Base topic to use for NATS
  --nats-url NATS_URL   URL for connecting to NATS
  --verbose             Enable verbose logging
```

### Demux help

```
usage:  demux [-h] [--all] [--sentence SENTENCE [SENTENCE ...]] [--sender SENDER [SENDER ...]] [--broadcast]
              [--bind-address BIND_ADDRESS] [--send-address SEND_ADDRESS [SEND_ADDRESS ...]] [--multicast-loop]
              [--multicast-ttl MULTICAST_TTL] [--multicast-if MULTICAST_IF]

options:
  -h, --help            show this help message and exit
  --all                 Relay all sentences
  --sentence SENTENCE [SENTENCE ...]
                        Sentence to relay
  --sender SENDER [SENDER ...]
                        Sender to relay
  --broadcast           Set socket in broadcast mode
  --bind-address BIND_ADDRESS
                        Where to bind the sockets
  --send-address SEND_ADDRESS [SEND_ADDRESS ...]
                        Where to send the data
  --multicast-loop      Set socket IP_MULTICAST_LOOP option
  --multicast-ttl MULTICAST_TTL
                        Set socket IP_MULTICAST_TTL option
  --multicast-if MULTICAST_IF
                        Set socket IP_MULTICAST_IF option
```

### Mux help

```
usage:  mux [-h] [--bind-address BIND_ADDRESS [BIND_ADDRESS ...]] [--buffer-size BUFFER_SIZE]

options:
  -h, --help            show this help message and exit
  --bind-address BIND_ADDRESS [BIND_ADDRESS ...]
                        Where to bind the listening sockets
  --buffer-size BUFFER_SIZE
                        Buffer size to use
```
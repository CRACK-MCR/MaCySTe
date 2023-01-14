# INS data multiplexers and demultiplexers

The simulator outputs a stream of NMEA packets with a single network identity (i.e. IP address and source port pairing).

This situation does not accurately represent the situation on the INS network where multiple device interact together each broadcasting and receiving a specific piece of information.

To reproduce this effect in MaCySTe, we introduce some demultiplexers which spread the incoming NMEA data flow across multiple devices, simulating a distributed bridge.

They are not spread out at random, instead, each demultiplexer takes the role of a specific sensor, forwarding only messages coherent with its identity.

For instance, a gyrocompass will only forward sentences indicating `HE` as the talker.

Also included (but not used) in MaCySTe, we provide the reverse multiplexer system, allowing to receive NMEA data from a single endpoint and spread it to multiple demultiplexers.

Such a structure is achieved by forwarding the NMEA sentences over to the [message queue](./nats.md) and leveraging its topics system for distributing the messages to the correct demultiplexers.

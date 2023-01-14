# Message queue

MaCySTe leverages [NATS](https://nats.io) as the connecting glue for all publish subscribe traffic.

In addition, NATS is also used as a persistent Key-Value store to exchange variables and setpoints between programs.

All of the traffic to and from the message queue flows inside of a [dedicated network](./network.md) in order not to contaminate with framework-specific data the simulated IT/OT systems' networks.

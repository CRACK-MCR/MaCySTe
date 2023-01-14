# ModBus to message queue bridge

To implement some components such as the [helm](./steering-gear-system.md) and the [engine telegraphs](./propulsion-system.md) a system for interfacing the [message queue](./nats.md) with the ModBus slaves is necessary and vice-versa.

To that purpose, MaCySTe implements two systems:

- A client which receives data from a message queue and subsequently writes the received setpoint to a connected ModBus slave
- A server which acts as a ModBus slave where every register write corresponds to a publication on the message queue

These two systems allow to introduce the simulator connecting glue (the message queue) commands as realistic industrial control system traffic.

In this way the client allows commands sent via the message queue to be reflected as ModBus holding register writes.

Similarly, the server allows ModBus commands to be reflected in the message queue.

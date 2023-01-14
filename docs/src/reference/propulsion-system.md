# Propulsion System

In MaCySTe, the propulsion system is simulated by [Bridge Command](./bridgecommand.md).

Still, the engines appear inside of the [control network](./network.md) by leveraging the [ModBus to message queue component](./nats-modbus.md).

On the control network, engine telegraphs, following the motions of the [GUI telegraph](./instruments-telegraphs.md) sets via ModBus the engine desired power values to two ModBus slaves emulating the Master PLCs of the respective engines.

The commanded power output setpoint is then propagated via the NATS network to Bridge Command which runs the power plant simulation.

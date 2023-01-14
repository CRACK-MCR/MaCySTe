# UDP to websocket connector

This component has the task of reading traffic from an UDP socket and transferring it to a WebSocket.

Usage:
- Set in environment `PROXIES` to a space separated list of `path:host:port` places to listen on.
- Optionally specify `BIND_PORT` (default is `9090`)

The connector will then send traffic received on `host:port` to either `ws://<own_address>/<path>/BINARY` or `ws://<own_address>/<path>/TEXT` dependending on the type of data.  
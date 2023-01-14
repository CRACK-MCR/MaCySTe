# UDP to WebSocket proxy

Usage:

- Optionally customize `BIND_PORT` with the server port
- Set in environment `PROXIES` to a space separated list of `path:host:port` places to listen on
- Connect with clients
  - `:9090/<path>/BINARY` is the received data as blobs
  - `:9090/<path>/TEXT` is the received data as strings

## Example

```sh
PROXIES='w1:127.0.0.1:9000 w2:127.0.0.1:9001' cargo run
```

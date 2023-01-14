# Websocket to Websocket proxy

Websocket to Websocket proxy acts as the rendezvous server for the attacker and the malware, its usage is simple: each client can open a WebSocket by connecting to the server at a given path `/<path>`.

Every client connected to the same `<path>` will receive every message sent for the same `<path>`.

Every client connected to the same `<path>` can also send a message to everyone else subscribed to the same `<path>` simply by sending the message to the websocket to websocket proxy.

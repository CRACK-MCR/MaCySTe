# Attacker addon

**This addon is available only in the attacker and attacker_siem scenarios**

MaCySTe allows to experiment with the cyber attacks against the ship INS.

To that purpose we introduce the attacker addon bundling some components to allow for this kind of trials.

In particular, we introduce a scenario in which an attacker has installed a malware inside of the INS network.

Since the ship firewall would probably not allow any connection from the outside, the installed malware tries to reach outside on its own. This technique is called _reverse shell_. The endpoint which has to be reached is a command and control (C&C) server located on a simulated internet (which has as its CIDR the IANA reserved block for documentation and examples `198.51.0.0/16`)

The malware leverages the WebSocket protocol in order to:
- Keep a long lived connection open to the server
- Appear as a connection to the normal HTTP port to external observers
- Allow real-time streaming of data

Once connected to the C&C server, the attacker can then connect his control panel to the malware by using the C&C as reverse proxy to the malware.

This addon is comprised of the following components:

- An [attacker graphical user interface](./attack-gui.md) to launch and coordinate attacks
- A [persistent malware](./malware.md) installed on the bridge
- A [satellite router](./mini-router.md) allowing the ship to reach external resources within a simulated internet
- A [command and control server](./websocket-to-websocket.md) that allows the attacker to rendezvous with the malware

# Mini router

Mini router implements one of two functionalities:

- In `router` mode it sets up a source network address translation (SNAT) allowing traffic coming from one network to reach out by reusing the router IP (as in the case of most satellite internet terminals used by boats)
- In `init-container` mode it allows to customize a container default gateway, overriding the preset default

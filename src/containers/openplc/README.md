# openplc

This container wraps an [OpenPLC](https://github.com/thiagoralves/OpenPLC_v3.git) installation, allowing automatic configuration.

## Configuration

A structured text program can be automatically executed by putting it into `/data/main.st`

A custom mbconfig.cfg defining slave devices can be put in `/data/mbconfig.cfg`.

If environment variables expansion is desired for the `mbconfig.cfg` file, put it at `/data/mbconfig.cfg.tmpl`.

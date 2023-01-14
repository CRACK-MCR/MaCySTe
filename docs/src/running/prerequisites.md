# Prerequisites

Before trying to run MaCySTe, please ensure the machine you are running on meets the following prerequisites.

## Operating system

Any reasonably recent (2022+) Linux distribution should suffice.

For instance, MaCySTe initial development was done on Ubuntu 22.04 LTS and Fedora 37.

## Programs

MaCySTe requires the following programs to function:

- `cat`
- `envsubst`
- `flatpak-builder`
  - A repository configured to provide `org.freedesktop.Sdk` and `org.freedesktop.Platform` (for instance, FlatHub)
- `flatpak`
- `ip`
- `make`, in particular its GNU implementation
- `podman` version `4.3+`
- `python` version `3.11+`
- `sysctl`
- `tee`
- `xdg-open`

### Automatically checking prerequisites

All of these prerequisites can be checked by running `make check` from the repository root

```
$ make check
Found command cat
Found command envsubst
Found command flatpak-builder
Found command flatpak
Found command ip
Found command podman
Found command python3
Found command sysctl
Found command tee
Found command xdg-open
Podman version 4.3.1 is ok
Python version 3.11.1 (main, Dec  7 2022, 00:00:00) [GCC 12.2.1 20221121 (Red Hat 12.2.1-4)] is ok
```

## Requirements

### Core scenario

With `SCENARIO_NAME=core` [see here](./running.md#changing-options)

- CPU: at least 4 cores
- RAM: at least 10GB
- GPU: OpenGL API or software rendering with `BC_HEADLESS=1`
- Storage: 50GB available

### Attacker + SIEM scenario

With `SCENARIO_NAME=attacker_siem` [see here](./running.md#changing-options)

- CPU: at least 8 cores
- RAM: at least 12GB
- GPU: OpenGL API or software rendering with `BC_HEADLESS=1`
- Storage: 50GB available

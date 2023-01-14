# Running

MaCySTe allows you to leverage every feature provided by the framework by issuing `make` commands.

## Quickstart

Run `make check pull up run-bc`

## Checking is your machine meets prerequisites

Run `make check`

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

## Starting

After you [built the images and flatpaks](#building)

Run `make up` and then [start the simulator](#starting-the-simulator)

## Starting the simulator

Run `make run-bc`

## Opening the GUI

Run `make open-home`

## Stopping

Run `make down`

## Restart a single service

Run `make restart-service SERVICE=<service_name>` where `<service_name>` is the name of the folder inside of the scenarios base directory.

## Building

### Everything

Run `make build`

Equivalent to building [containers](#containers) and [flatpaks](#flatpaks).

### Containers

Run `make build-containers`

### Flatpaks

Run `make build-flatpaks`

## Pulling pre-made images

If you want to use our pre-made images run `make pull`, to use pre-made flatpak, the file `src/flatpaks/bridgecommand/it.csec.Bridgecommand.flatpak`

## Available scenarios

MaCySTe by default shipping with the `core` scenario but it also bundles 3 additional scenarios which can be selected by altering the [`SCENARIO_NAME`](#changing-options) variable.

|Name|Description|
|---|---|
|`core`|The base scenario|
|`attacker`|The base scenario, augmented with the [attacker addon](../reference/addon-attacker.md)|
|`siem`|The base scenario, augmented with the [SIEM addon](../reference/addon-siem.md)|
|`attacker_siem`|The base scenario, augmented with the [attacker addon](../reference/addon-attacker.md) and [SIEM addon](../reference/addon-siem.md)|

## Changing options

The options file can be found in `src/settings.Makefile` settings can be either changed in the file or overriden during the make invocation like so: `<make command> <setting key>=<setting value>`

### Available settings

|Name|Description|Default|
|----|-----------|-------|
|`SCENARIO_NAME`|Scenario to instantiate|`base`|
|`BC_HEADLESS`|Whenever to enable the render-less mode for BridgeCommand|_empty_|
|`BC_SCENARIO`|Scenario to load in BridgeCommand|`Genoa`|

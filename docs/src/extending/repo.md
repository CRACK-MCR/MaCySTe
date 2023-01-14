# Repository structure

MaCySTe follows a specific repository structure.

At the root level there are two directories `docs` and `src` where docs contains this reference manual and src the components.

## docs

The documentation folder, leverages [mdbook](https://rust-lang.github.io/mdBook) which must be installed.

Documentation can be either be read in its markdown format inside of the `src` subdirectory or seen in the browser by running `make open` (be aware that either `mdbook` or the Rust package manager `cargo` should be available in the repository)

## src

Inside of the source code folder `src`, you will find the elements of MaCySTe.

In general, each top level folder indicates a related set of elements and the elements appear as direct childs of the folders.

### configs

Each subdirectory of `configs` allows to store configuration files to be subsequentely mounted inside of containers and so on.

### containers

Each subdirectory of `containers` will automatically be built as a container called `macyste_<subdir-name>`, to do so, ensure that a `Containerfile` is present inside.

Each container can leverage the following build args to make updating base images easier:

|name|description|
|---|---|
|`FEDORA_IMAGE`|A base Fedora image|
|`JAVASCRIPT_IMAGE`|A base Node.js image|
|`PYTHON_IMAGE`|A base Python image|
|`RUST_IMAGE`|A base Rust image|

### flatpaks

Each subdirectory of `flatpaks` contains a custom Makefile with subtarget that can be invoked, this ad-hoc implementation is motivated by the fact that MaCySTe bundles only a single Flatpak [Bridge Command](../reference/bridgecommand.md)

### pods

Each subdirectory of `pods` contains a pod template which can be instantiated

#### pods/x/pod.yaml

The `pod.yaml` file is a mandatory file which should be present in every pod, it must be a file that once passed through an `envsubst` execution will yield an output compatible with the command `podman play kube`

#### pods/x/config.Makefile

Whenever some default parameters are required inside of a pod template, they can be included by specifying a `config.Makefile` file containing the variables to be defaulted in the following format:

```makefile
variable_name ?= variable_value
```

### scenarios

The scenarios directory includes the components of MaCySTe and different preset list of components. Each of these presets can be [selected from the settings file](../running/running.md#available-scenarios).

#### scenarios/00-base

Each directory inside of the `00-base` represents an instantiation of a component which can be the instantiation of one or more pods and/or a network definition.

Please be advised that being a scenario the minimal unit of deploy in MaCySTe, you should always create minimal scenario pieces to maximize their reusability.

##### scenarios/00-base/x/config.Makefile

The config makefile allows to define a scenario deployment information, it can include multiple directives depending on the desired usage.

Directives that appear inside of this file must be prefixed by the `x` path component to ensure uniqueness.

In order to deploy a pod, a comprehensive makefile looks like so:

```makefile
# This indicates that this component will instantiate a pod contained in src/pods/<pod_name_inside_of_pods_directory>
<x>_pods += <pod_name_inside_of_pods_directory>

# Each entry in this variable represent the name of a network interface card, if undecided, use `eth0`
#   MaCySTe supports multi-nic, to do so simply add more than one interface
<x>_pod_<pod_name_inside_of_pods_directory>_network_interfaces += <if_name>
# MaCySTe will automatically allocate the IP to the pod
<x>_pod_<pod_name_inside_of_pods_directory>_<if_name>_network = <network_name>

# Whenever some persistent state is required you can ask MaCySTe to create these directories for you
<x>_pod_<pod_name_inside_of_pods_directory>_state_dirs += <state_dir>

# You can even augment other scenario elements' pod.yaml files with your own additions
#   the variable $(SCENARIO_DIR) will be automatically be replaced by MaCySTe with the path of src/scenarios/00-base
<y>_pod_<other_pod_name>_manifest_extensions += $(SCENARIO_DIR)/00-base/x/my-snippet.yaml
```

For each network interface you define, MaCySTe will allocate an IP address which can be referenced from the [vars.Makefile](#scenarios00-basexvarsmakefile) file by putting `$(<x>_pod_<pod_name_inside_of_pods_directory>_<if_name>_ip)`.

Similarly each state dir path will be available at `$(<x>_pod_<pod_name_inside_of_pods_directory>_state_dir_<state_dir>)`

##### scenarios/00-base/x/ipam.Makefile

This IPAM file allows to define new networks to be automatically allocated by MaCySTe.

To define a new network write:

```makefile
NETWORK_NAMES += <uppercase_network_unique_name>

<uppercase_network_unique_name>_NAME = macyste_<network_name>
<uppercase_network_unique_name>_CIDR = <ip cidr>
<uppercase_network_unique_name>_DRIVER = <bridge / macvlan>
```

so if we wanted to create an isolated (macvlan) network with IPs from the `10.1.42.0/24` range called `mynet` you would write:

```makefile
NETWORK_NAMES += MYNET

MYNET_NAME = macyste_mynet
MYNET_CIDR = 10.1.42.0/24
MYNET_DRIVER = macvlan
```

See the [network](../reference/network.md) page to see the difference between the different drivers.

Multiple network declarations can be bundled together if it makes logical sense to do it

##### scenarios/00-base/x/vars.Makefile

The vars file allow you to define additional substitutions to be performed inside of the pod.yaml file

To do so write a file like so:

```makefile
<x>_pod_<pod_name_inside_of_pods_directory> += <var_name>

#   the variable $(CONFIG_DIR) will be automatically be replaced by MaCySTe with the path of src/configs
#   the variable $(SCENARIO_DIR) will be automatically be replaced by MaCySTe with the path of src/scenarios/00-base
<x>_pod_<pod_name_inside_of_pods_directory>_<var_name> = <var_value>

# If you want to define a default for a variable do like so
<var_name> ?= <var_value>
```

You can also passthrough variables that will be created as a result of the [config.Makefile](#scenarios00-basexconfigmakefile) instantiation.

#### scenarios/x

Every other scenario not called `00-base` contains a specification for a selectable scenario

#### scenarios/x/alloc.Makefile

The alloc.Makefile file contains an automatically generated IP allocation for every component belonging to the scenario. We advise you not to modify this file manually and let MaCySTe generate it.

If you wish to alter an IP allocation:
- Run your scenario with `make up SCENARIO_NAME=<name>`
- Stop running with `make down SCENARIO_NAME=<name>`
- Modify the `alloc.Makefile` file

MaCySTe will not modify your manually set values

#### scenarios/x/config.Makefile

This file allows you to specify which elements of `00-base` belong to a scenario

Define them like so

```makefile
MODULES += <module_1_name>
MODULES += <module_2_name>
MODULES += <module_n_name>
```

__Remember that they are used in order so please ensure that all dependencies are correct__ _for instance, a network should appear before modules using it for their pods_

### scripts

The `scripts` directory contains scripts which are used by the makefile to perform functions not available inside of the restricted GNU Make language.

In MaCySTe, the principal script is `allocate_ip.py` a script that takes a space separated list of `alloc_file_name cidr allocation_name` from its standard input and will generate automatically an allocation file

### state

`state` acts as a mutable counterpart to the [config](#configs) directory, allowing to store mutable data for containers such as database contents and so on.

Leveraging the state directory correctly allows to restore a MaCySTe instance from a backup more easily.

### settings.Makefile

Please see the [dedicated page](../running/running.md#changing-options)

### Makefile

Please see the [dedicated page](../running/running.md)

Its internal structure is not for the faint of heart and requires deep knowledge of Makefile syntax. It leverages meta-programming to easily integrate the various modules into a comprehensive and cohesive experience.

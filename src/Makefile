include settings.Makefile

#
# Defines
#
define reverse
$(if $(1),$(call reverse,$(wordlist 2,$(words $(1)),$(1)))) $(firstword $(1))
endef

# Defaults
PODMAN ?= sudo podman

CONTAINER_IMAGE_TAG ?= latest
CONTAINER_IMAGE_PREFIX ?= macyste

ifndef CI
CONTAINER_BUILD_ARGS += --pull=newer
endif

CONTAINER_BUILD_ARGS += --build-arg FEDORA_IMAGE=registry.fedoraproject.org/fedora:38
CONTAINER_BUILD_ARGS += --build-arg JAVASCRIPT_IMAGE=docker.io/library/node:20.3.0
CONTAINER_BUILD_ARGS += --build-arg PYTHON_IMAGE=docker.io/library/python:3.11.4
CONTAINER_BUILD_ARGS += --build-arg RUST_IMAGE=docker.io/library/rust:1.70

CONTAINER_IMAGE_LABELS += \
	it.unige.project=MaCySTe \
	it.unige.laboratory=CSEC \
	org.opencontainers.image.authors="giacomo.longo@dibris.unige.it,enrico.russo@dibris.unige.it,alessandro.orlich@dibris.unige.it" \
	org.opencontainers.image.licenses="AGPL-3.0-or-later" \
	org.opencontainers.image.vendor="University-of-Genova" \
	org.opencontainers.image.source="https://github.com/CRACK-MCR/MaCySTe"
CONTAINER_BUILD_ARGS += $(foreach label,$(sort $(CONTAINER_IMAGE_LABELS)),--label=$(label))

# Available containers
CONTAINERS = $(sort $(notdir $(realpath $(dir $(wildcard ./containers/*/Containerfile)))))

# Available flatpaks
FLATPAKS = $(sort $(notdir $(realpath $(dir $(wildcard ./flatpaks/*/Makefile)))))

# Additional variables
CONFIG_DIR       := $(CURDIR)/configs
STATE_DIR        := $(CURDIR)/state
PODS_DIR         := $(CURDIR)/pods
SCENARIO_DIR 	 := $(CURDIR)/scenarios/00-modules
ALLOCATIONS_FILE := $(CURDIR)/scenarios/$(SCENARIO_NAME)/alloc.Makefile

# Load modules list
ifndef SCENARIO_NAME
$(error SCENARIO_NAME is not defined)
else
$(eval $(file < $(CURDIR)/scenarios/$(SCENARIO_NAME)/config.Makefile))
endif
$(if $(MODULES),,$(error Scenario $(SCENARIO_NAME) does not define any module, aborting))

# Load config from modules
$(foreach module,$(MODULES),$(eval $(file < $(SCENARIO_DIR)/$(module)/config.Makefile)))

# Load IPAM from modules
$(foreach module,$(MODULES),$(eval $(file < $(SCENARIO_DIR)/$(module)/ipam.Makefile)))

# Load variables from pods
$(foreach module,$(MODULES), \
	$(foreach pod,$($(module)_pods), \
		$(eval $(file < $(PODS_DIR)/$(pod)/config.Makefile)) \
	) \
)

#
# Aggregates
#

.PHONY: check up down restart-service build run-bc open-home

define has_command
@if [ -x "$$(command -v $(1))" ]; then \
	echo 'Found command $(1)'; \
else \
	echo 'Command $(1) is required to run MaCySTe'; \
	exit 1; \
fi
endef

check:
	$(call has_command,cat)
	$(call has_command,envsubst)
	$(call has_command,flatpak-builder)
	$(call has_command,flatpak)
	$(call has_command,ip)
	$(call has_command,podman)
	$(call has_command,python3)
	$(call has_command,sysctl)
	$(call has_command,tee)
	$(call has_command,xdg-open)
	@podman version --format '{{ .Client.Version }}' | python3 -c 'ver = input(""); cmp = ver.split(".", 3); assert (int(cmp[0]) > 4) or (int(cmp[0]) == 4 and int(cmp[1]) >= 3), "Podman version " + ver + " is too old for MaCySTe (4.3+ is required)"; print("Podman version " + ver + " is ok")'
	@python3 -c 'import sys; assert sys.version_info.major >= 3 and sys.version_info.minor >= 11, "Python version " + sys.version + " is too old for MaCySTe (3.11+ is required)"; print("Python version " + sys.version + " is ok")'

up:
# Dirty fix for SELinux messing up volumes
	@sudo setenforce 0 2>&1 > /dev/null || true
# OpenSearch
	@sudo sysctl vm.max_map_count=262144
# Deploy
	$(MAKE) up-nets
	$(MAKE) allocate-scenario-ips
	$(MAKE) up-scenario

down:
	$(MAKE) down-scenario
	$(MAKE) down-nets

restart-service:
ifndef SERVICE
	$(error set the SERVICE variable)
else
	$(MAKE) down-scenario-$(SERVICE)
	$(MAKE) up-scenario-$(SERVICE)
endif

build: build-containers build-flatpaks

run-bc:
	$(eval $(file < $(ALLOCATIONS_FILE)))
	$(eval $(file < $(SCENARIO_DIR)/nats/vars.Makefile))
	$(MAKE) -C flatpaks/bridgecommand run nats_url=$(nats_management_url) bc_scenario=$(BC_SCENARIO) bc_headless=$(BC_HEADLESS)

open-home:
	$(eval $(file < $(ALLOCATIONS_FILE)))
	$(if $(gui_home_pod_gui_home_mgmt0_ip), \
		xdg-open http://$(gui_home_pod_gui_home_mgmt0_ip):3000, \
		$(error GUI module is not deployed (add it to MODULES in settings.Makefile) or no IP has been allocated to it (run make allocate-scenario-ips after it has been added to modules)) \
	)

#
# Containers
#

.PHONY: build-containers build-container-%

build-containers: $(foreach container,$(sort $(CONTAINERS)),build-container-$(container) )
build-container-%:
# Dirty fix for SELinux messing up volumes
	@sudo setenforce 0 2>&1 > /dev/null || true
# Calculate variables
	$(eval NAME = $(subst build-container-,,$@))
	$(eval IMAGE_NAME = $(CONTAINER_IMAGE_PREFIX)_$(NAME):$(CONTAINER_IMAGE_TAG))
	$(info Building container image $(IMAGE_NAME) for target $@)
# Build prerequisites
	$(foreach prereq,$(file < containers/$(NAME)/prerequisites.Makefile), $(MAKE) build-container-$(prereq))
# Build image
	$(PODMAN) build $(CONTAINER_BUILD_ARGS) -t $(IMAGE_NAME) containers/$(NAME)

REGISTRY_ARGS :=
ifdef REGISTRY_USER
ifdef REGISTRY_PASS
REGISTRY_ARGS += --creds=$(REGISTRY_USER):$(REGISTRY_PASS)
endif
endif
ifdef REGISTRY_NO_VERIFY
REGISTRY_ARGS += --tls-verify=false
endif

.PHONY: pull pull-containers pull-container-% pull-extra-images

pull: pull-containers pull-extra-images 

pull-containers: $(foreach container,$(sort $(CONTAINERS)),pull-container-$(container) )
pull-container-%:
	$(eval NAME = $(subst pull-container-,,$@))
	$(eval IMAGE_NAME = $(CONTAINER_IMAGE_PREFIX)_$(NAME):$(CONTAINER_IMAGE_TAG))
ifndef REGISTRY
	$(info No REGISTRY is defined)
	$(MAKE) build-container-$(NAME)
else
	if $(PODMAN) image pull $(REGISTRY_ARGS) docker://$(REGISTRY)/$(IMAGE_NAME); then \
		$(PODMAN) image tag $(REGISTRY)/$(IMAGE_NAME) $(IMAGE_NAME); \
	else \
		$(MAKE) build-container-$(NAME); \
	fi
endif

pull-extra-images:
	$(foreach image,$(EXTRA_IMAGES), $(PODMAN) image list -n --format '{{.Repository}}:{{.Tag}}' | grep -q '$(image)' || $(PODMAN) pull $(image);)

.PHONY: push push-container-%

push: $(foreach container,$(sort $(CONTAINERS)),push-container-$(container) )

push-container-%:
	$(eval NAME = $(subst push-container-,,$@))
	$(eval IMAGE_NAME = $(CONTAINER_IMAGE_PREFIX)_$(NAME):$(CONTAINER_IMAGE_TAG))
ifndef REGISTRY
	$(error No REGISTRY is defined)
endif
	$(PODMAN) image push $(REGISTRY_ARGS) $(IMAGE_NAME) docker://$(REGISTRY)/$(IMAGE_NAME)


#
# Flatpaks
#

.PHONY: build-flatpaks build-flatpak-%

build-flatpaks: $(foreach flatpak,$(sort $(FLATPAKS)),build-flatpak-$(flatpak) )
build-flatpak-%:
# Dirty fix for SELinux messing up volumes
	@sudo setenforce 0 2>&1 > /dev/null || true
# Delegate
	$(eval NAME = $(subst build-flatpak-,,$@))
	$(MAKE) -C flatpaks/$(NAME) install

#
# Networks
#

.PHONY: down-nets up-nets
down-nets: $(foreach net,$(call reverse,$(NETWORK_NAMES)),down-net-$(net) )
up-nets: $(foreach net,$(NETWORK_NAMES),up-net-$(net) )

.PHONY: up-dummy down-dummy
up-dummy:
	sudo ip link add dummy0 type dummy || true
	sudo ip link set dev dummy0 up
down-dummy:
	sudo ip link del dev dummy0 || true

.PHONY: up-net-% down-net-%
up-net-%: up-dummy
	$(eval NAME := $(subst up-net-,,$@))
	$(if $($(NAME)_NET_NAME),,$(error network $(NAME) has no name))
	$(if $($(NAME)_NET_CIDR),,$(error network $(NAME) has no cidr))
	$(if $($(NAME)_NET_DRIVER),,$(error network $(NAME) has no driver))
	$(PODMAN) network create \
		--driver $($(NAME)_NET_DRIVER) \
		$(if $(filter macvlan,$($(NAME)_NET_DRIVER)),--opt parent=dummy0) \
		$(if $($(NAME)_NET_INTERNAL),--internal) \
		--subnet $($(NAME)_NET_CIDR) \
		$($(NAME)_NET_NAME)

down-net-%: down-dummy
	$(eval NAME := $(subst down-net-,,$@))
	$(if $($(NAME)_NET_NAME),,$(error network $(NAME) has no name))
	$(PODMAN) network rm -f $($(NAME)_NET_NAME) || true

#
# Scenarios
#

.PHONY: allocate-scenario-ips up-scenario down-scenario
allocate-scenario-ips: $(foreach module,$(MODULES), allocate-scenario-ip-$(module))
up-scenario: $(foreach module,$(MODULES), up-scenario-$(module))
down-scenario: $(foreach module,$(MODULES), down-scenario-$(module))

.PHONY: allocate-scenario-ip-% up-% down-%
allocate-scenario-ip-% up-scenario-% down-scenario-%:
	$(eval NAME := $(subst allocate-scenario-ip-,,$(subst down-scenario-,,$(subst up-scenario-,,$@))))
	$(eval MODE := $(subst -$(NAME),,$@))
	$(eval IS_UP := $(filter up-scenario,$(MODE)))
	$(eval IS_DOWN := $(filter down-scenario,$(MODE)))
	$(if $(IS_UP),$(info Bringing up module $(NAME)))
	$(if $(IS_DOWN),$(info Bringing down module $(NAME)))
# Initialize variables
	$(eval ENVSUBST_ARGS :=)
# Calculate network arguments
	$(foreach pod,$($(NAME)_pods), \
		$(eval $(NAME)_pod_$(pod)_network_args :=) \
		$(foreach if,$($(NAME)_pod_$(pod)_network_interfaces), \
			$(eval NETWORK_NAME := $($(NAME)_pod_$(pod)_$(if)_network)) \
			$(eval NETWORK_PODMAN_NAME := $($(NETWORK_NAME)_NET_NAME)) \
			$(eval NETWORK_CIDR := $($(NETWORK_NAME)_NET_CIDR)) \
			$(eval NETWORK_IP := $(shell echo '$(ALLOCATIONS_FILE) $(NETWORK_CIDR) $(NAME)_pod_$(pod)_$(if)_ip' | python3 scripts/allocate_ip.py)) \
			$(eval $(NAME)_pod_$(pod)_network_args += --network=$(NETWORK_PODMAN_NAME):ip=$(NETWORK_IP),interface_name=$(if)) \
			$(info Module $(NAME) pod $(pod) if $(if) has ip $(NETWORK_IP)) \
		) \
	)
# State directories
	$(foreach pod,$($(NAME)_pods), \
		$(eval STATE_DIRS :=) \
		$(foreach state_dir,$($(NAME)_pod_$(pod)_state_dirs), \
			$(eval pod_state_dir := $(STATE_DIR)/$(state_dir)) \
			$(eval $(NAME)_pod_$(pod)_state_dir_$(subst /,_,$(state_dir)) := $(pod_state_dir)) \
			$(info Module $(NAME) pod $(pod) state dir $(state_dir) is at $(pod_state_dir)) \
			$(eval STATE_DIRS += $(pod_state_dir)) \
		) \
		$(if $(STATE_DIRS), \
			$(if $(IS_UP), sudo mkdir -p $(STATE_DIRS)) \
			$(if $(IS_DOWN), sudo rm -rf $(STATE_DIRS)) \
		) \
	)
# Load variables
	$(eval $(file < $(ALLOCATIONS_FILE)))
	$(foreach module,$(MODULES),$(eval $(file < $(SCENARIO_DIR)/$(module)/vars.Makefile)))
	$(foreach pod,$($(NAME)_pods), \
		$(foreach var,$($(NAME)_pod_$(pod)_extra_vars), \
			$(eval ENVSUBST_ARGS += $(var)='$($(NAME)_pod_$(pod)_extra_var_$(var))') \
		) \
		$(eval $(NAME)_pod_$(pod)_manifests := $(PODS_DIR)/$(pod)/pod.yaml) \
		$(foreach extension,$($(NAME)_pod_$(pod)_manifest_extensions), \
			$(eval $(NAME)_pod_$(pod)_manifests += $(extension)) \
		) \
	)
# Filter out variables to include in envsubst
	$(eval ENVSUBST_ARGS += CONFIG_DIR=$(CONFIG_DIR))
	$(eval ENVSUBST_ARGS += STATE_DIR=$(STATE_DIR))
	$(foreach container,$(sort $(CONTAINERS)),$(eval ENVSUBST_ARGS += $(subst -,_,$(container))_image='$(CONTAINER_IMAGE_PREFIX)_$(subst -,_,$(container)):$(CONTAINER_IMAGE_TAG)'))
	$(foreach module,$(MODULES), \
		$(foreach var,$(filter $(module)%,$(.VARIABLES)),$(eval ENVSUBST_ARGS += $(var)='$($(var))')) \
	)
	$(foreach pod,$($(NAME)_pods), \
		$(foreach var,$(filter $(pod)_%,$(.VARIABLES)),$(eval ENVSUBST_ARGS += $(var)='$($(var))')) \
	)
	$(foreach network,$(NETWORK_NAMES), \
		$(foreach var,$(filter $(network)_NET_%,$(.VARIABLES)),$(eval ENVSUBST_ARGS += $(var)='$($(var))')) \
	)
# Execution
	$(if $(IS_UP), \
		$(foreach pod,$($(NAME)_pods), \
			@cat $(foreach manifest,$($(NAME)_pod_$(pod)_manifests),$(manifest) ) \
			| $(ENVSUBST_ARGS) envsubst \
			| tee /dev/stderr \
			| $(PODMAN) kube play --replace - $($(NAME)_pod_$(pod)_network_args) \
		) \
	)
	$(if $(IS_DOWN), \
		$(foreach pod,$($(NAME)_pods), \
			@cat $(foreach manifest,$($(NAME)_pod_$(pod)_manifests),$(manifest) ) \
			| $(ENVSUBST_ARGS) envsubst \
			| tee /dev/stderr \
			| $(PODMAN) kube down - || true \
		) \
	)

#
# Utilities
#

.PHONY: print-ipam
print-ipam:
	cat $(ALLOCATIONS_FILE) | sort

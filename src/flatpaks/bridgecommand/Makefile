include ../../settings.Makefile

BC_FLATPAK_EXTRA_ARGS :=

ifeq ($(bc_headless),1)
BC_FLATPAK_EXTRA_ARGS += --env=HEADLESS=true
endif

ifdef bc_scenario
BC_FLATPAK_EXTRA_ARGS += --env=SCENARIO_NAME=$(bc_scenario)
endif

.PHONY: dev build build-bundle install run

dev:
	git clone https://github.com/bridgecommand/bc.git bc
	cd bc && git checkout $(shell grep -1 '/bc' it.csec.Bridgecommand.yaml | grep 'commit' | awk '{ print $$2 }')
	$(info Run git am ../bc-patches/* from the bridgecommand directory)

run:
	flatpak run \
		--env=NATS_RADAR_TOPIC=radar \
		--env=NATS_RUDDER_SENDER=physics \
		--env=NATS_THROTTLE_SENDER=physics \
		--env=NATS_URL=$(nats_url) \
		--env=NMEA_TO_NATS=true \
		--env=RADAR_ANGULAR_RESOLUTION=4096 \
		--env=RADAR_RANGE_RESOLUTION=512 \
		--env=SKIP_MENU=true \
		--env=SKIP_PAUSE=true \
		$(BC_FLATPAK_EXTRA_ARGS) \
		it.csec.Bridgecommand

build:
# Add repo
	if ! sudo flatpak remotes | grep -Fwq 'flathub'; then \
		sudo flatpak remote-add --system --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo; \
	fi
# Install runtimes
	sudo flatpak install --system -y org.freedesktop.Platform/x86_64/22.08
	sudo flatpak install --system -y org.freedesktop.Sdk/x86_64/22.08
# Allow Git local urls for NATS
	sudo git config --global protocol.file.allow always
# Build
	sudo flatpak-builder \
		--repo=.flatpak-repo \
		--system -y --force-clean \
		.flatpak-build-dir it.csec.Bridgecommand.yaml
# Install
	sudo flatpak install --reinstall --system -y ./.flatpak-repo it.csec.Bridgecommand

build-bundle:
	sudo flatpak build-bundle .flatpak-repo it.csec.Bridgecommand.flatpak it.csec.Bridgecommand --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo

install:
	if ! [ -f it.csec.Bridgecommand.flatpak ] && curl -IL -sf $(FLATPAK_REGISTRY)/it.csec.Bridgecommand.flatpak; then \
		wget $(FLATPAK_REGISTRY)/it.csec.Bridgecommand.flatpak; \
	fi
	if [ -f it.csec.Bridgecommand.flatpak ]; then \
		sudo flatpak install -y it.csec.Bridgecommand.flatpak; \
	else \
		$(MAKE) build; \
	fi

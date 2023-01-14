nats_version ?= 2.9.10
nats_image ?= docker.io/library/nats:${nats_version}

EXTRA_IMAGES += $(nats_image)

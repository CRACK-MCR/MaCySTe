opensearch_version ?= 2.4.1

opensearch_image ?= public.ecr.aws/opensearchproject/opensearch:$(opensearch_version)
opensearch_dashboards_image ?= public.ecr.aws/opensearchproject/opensearch-dashboards:$(opensearch_version)

EXTRA_IMAGES += $(opensearch_image)
EXTRA_IMAGES += $(opensearch_dashboards_image)

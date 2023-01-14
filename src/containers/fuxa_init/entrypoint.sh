#!/bin/sh

# Settings
CONFIG_PATH=${CONFIG_PATH:-/etc/fuxa-project.json}
FUXA_URL=${FUXA_URL:-http://127.0.0.1:1881}

# Wait until FUXA is alive
printf 'Waiting until FUXA is alive...'
until [ "$(curl -s -o /dev/null -w '%{http_code}' $FUXA_URL)" = "200" ]; do
  printf '.'
  sleep 1
done
echo 'OK'

# Check config
if ! [ -f "${CONFIG_PATH}" ]; then
  echo "No configuration found at ${CONFIG_PATH}" > /dev/stderr
  exit 1
fi

# Push config
curl -v \
  -X POST \
  -H 'Content-Type: application/json' \
  --data-binary "@${CONFIG_PATH}" \
  "${FUXA_URL}/api/project"

# Terminate or loop
echo 'Initialization done'
while true; do
  if [ "$CLOSE_ON_FINISH" = "1" ]; then break; fi
  sleep 60
done

#!/bin/sh
alt=0
i=0
tshark -i any -Y 'modbus' -T ek -J 'modbus mbtcp tcp ip sll' | while read -r line; do
  if [ "0" = "$alt" ]; then
    alt=1
    continue
  else
    alt=0
  fi
  file=$(mktemp)
  echo "$line" | python3 process_line.py > "$file"
  curl \
    -X POST \
    -u admin:admin \
    -k \
    -H 'Content-Type: application/x-ndjson' \
    --data-binary "@${file}" \
    "${OPENSEARCH_URL}/modbus-$(date '+%F')/_doc"
  rm -f "$file"
  i=$(( i + 1 ))
done
#!/bin/sh
i=1
for index_pattern in $INDEX_PATTERNS; do
  pattern=$(echo $index_pattern | cut -d':' -f1)
  time_field=$(echo $index_pattern | cut -d':' -f2)
  [ -n "$time_field" ] || time_field='@timestamp'
  until curl -k -v -f -X POST "${OPENSEARCH_URL}/api/saved_objects/index-pattern/preseed-${i}?overwrite=true" \
    -H 'Content-Type: application/json' \
    -H 'osd-xsrf: true' \
    -d"{\"attributes\":{\"title\":\"${pattern}\",\"timeFieldName\":\"${time_field}\"}}" \
    -u admin:admin
  do
    sleep 1
  done
  echo "Preseeding done"
  i=$(( i+1 ))
done
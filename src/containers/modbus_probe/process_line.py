import json
import sys

from datetime import datetime

x = json.load(sys.stdin)

del x['layers']['frame']

x['@timestamp'] = datetime.now().isoformat()
del x['timestamp']

print(json.dumps(x))
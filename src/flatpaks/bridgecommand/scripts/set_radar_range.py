#!/usr/bin/env python3
import sys

from pathlib import Path

BC5_PATH = Path(sys.argv[1])

SHIPS_PATH = BC5_PATH / 'bin' / 'Models' / 'Ownship'

for ship in SHIPS_PATH.iterdir():
  if not ship.is_dir(): continue
  RADAR_CONFIG = ship / 'radar.ini'
  if not RADAR_CONFIG.exists(): continue

  config_lines = []
  for line in RADAR_CONFIG.read_text().splitlines(False):
    if line.startswith('NumberOfRadarRanges'): continue
    elif line.startswith('RadarRange('): continue
    elif line.startswith('RADAR_RangeRes'): continue
    elif line.startswith('RADAR_AngularRes'): continue
    config_lines.append(line)

  config_lines += [
    'NumberOfRadarRanges=10',
    'RadarRange(1)=12',
    'RadarRange(2)=8',
    'RadarRange(3)=6',
    'RadarRange(4)=4',
    'RadarRange(5)=3',
    'RadarRange(6)=2',
    'RadarRange(7)=1.5',
    'RadarRange(8)=1',
    'RadarRange(9)=0.75',
    'RadarRange(10)=0.5',
    'RADAR_RangeRes=512',
    'RADAR_RangeRes_Max=512',
    'RADAR_AngularRes=4096',
    'RADAR_AngularRes_Max=4096',
  ]

  config = '\n'.join(config_lines)
  RADAR_CONFIG.write_text(config)

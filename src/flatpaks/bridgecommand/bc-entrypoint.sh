#!/bin/sh
cd /app/bin

bc5_ini_dir="$HOME/.Bridge Command/5.8"
mkdir -p "$bc5_ini_dir"
bc5_ini="$bc5_ini_dir/bc5.ini"
if ! [ -f "$bc5_ini" ]; then
    cp bc5.ini  "$bc5_ini"
fi

runSed() {
    tmp=$(mktemp)
    sed -e "$1" "$bc5_ini" > "$tmp"
    mv "$tmp" "$bc5_ini"
}

runSed 's/graphics_mode=3/graphics_mode=2/'
runSed 's/water_segments=32/water_segments=2/'
runSed 's/disable_shaders=0/disable_shaders=1/'

if [ -n "$RADAR_ANGULAR_RESOLUTION" ]; then
    runSed "s/RADAR_AngularRes=.*/RADAR_AngularRes=${RADAR_ANGULAR_RESOLUTION}/"
    runSed "s/RADAR_AngularRes_Max=.*/RADAR_AngularRes_Max=${RADAR_ANGULAR_RESOLUTION}/"
fi

if [ -n "$RADAR_RANGE_RESOLUTION" ]; then
    runSed "s/RADAR_RangeRes=.*/RADAR_RangeRes=${RADAR_RANGE_RESOLUTION}/"
    runSed "s/RADAR_RangeRes_Max=.*/RADAR_RangeRes_Max=${RADAR_RANGE_RESOLUTION}/"
fi

[ -n "$DISPLAY_X" ] || DISPLAY_X=1280
[ -n "$DISPLAY_Y" ] || DISPLAY_Y=720

runSed "s/graphics_width=.*/graphics_width=${DISPLAY_X}/"
runSed "s/graphics_height=.*/graphics_height=${DISPLAY_Y}/"

cat "$bc5_ini"

exec ./bridgecommand

#!/usr/bin/env bash
# Fetch the AWS Terrain Tiles (zoom 13) that cover the San Juan core into a directory.
#   bash tools/geo/fetch-tiles.sh <tiles_dir>
set -euo pipefail
D=${1:-/tmp/terrain-tiles}; mkdir -p "$D"
for x in $(seq 1291 1306); do for y in $(seq 2823 2835); do
  f="$D/${x}_${y}.tif"; [ -s "$f" ] || curl -sS -m 90 -o "$f" "https://s3.amazonaws.com/elevation-tiles-prod/geotiff/13/$x/$y.tif" &
done; wait; done
ls "$D" | wc -l

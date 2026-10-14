#!/bin/bash
# Cut the NASA "Perpetual Ocean" clips (public domain, NASA/Goddard Space Flight Center Scientific Visualization
# Studio, ECCO2 model data, svs.gsfc.nasa.gov/3827) used in the 洋流 film. Usage: media/nasa_clips.sh [po1080.mp4]
set -e
cd "$(dirname "$0")/.."
SRC=${1:-/tmp/perpetual_ocean_1080p30.mp4}
[ -f "$SRC" ] || curl -sS -o "$SRC" https://svs.gsfc.nasa.gov/vis/a000000/a003800/a003827/perpetual_ocean_1080p30.mp4
cut() {  # name start length crop(w:h:x:y): crop away the date stamp, scale back to 1080p, 30 fps, no audio
  ffmpeg -y -loglevel error -ss $2 -i "$SRC" -t $3 -an -vf "crop=$4,scale=1920:1080:flags=lanczos,fps=30" \
    -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -movflags +faststart public/media/oc_po_$1.mp4
}
cut gulf 9.5 6.5 1600:900:40:120      # the Gulf Stream leaves Florida and meanders past Cape Hatteras
cut kuro 78 6.5 1600:900:40:120       # the Kuroshio runs past Taiwan and Japan
cut acc 128.5 6.5 1600:900:160:150    # the Antarctic Circumpolar Current
ls -la public/media/oc_po_*.mp4

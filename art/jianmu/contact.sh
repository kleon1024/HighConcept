#!/bin/bash
# Contact sheets: release/contact_sheet.jpg (one frame per second) and release/contact_transitions.jpg (±2 frames at every cut)
set -e; cd "$(dirname "$0")"; mkdir -p release
L=""; for s in $(seq 0 29); do f=$(printf %04d $((s * 30 + 15))); L="$L -label ${s}.5s frames/$f.jpg"; done
montage -pointsize 18 -fill white -background '#111' $L -geometry 216x384+3+3 -tile 10x release/contact_sheet.jpg
# cuts (frame numbers): 3.0 6.0 9.0 12.0 13.5 15.42 18.0 21.0 24.0
L=""; for c in 90 180 270 360 405 463 540 630 720; do for d in -2 -1 0 1 2; do f=$(printf %04d $((c + d))); L="$L -label $(python3 -c "print('%.2fs' % ($((10#$f)) / 30))") frames/$f.jpg"; done; done
montage -pointsize 16 -fill white -background '#111' $L -geometry 162x288+2+2 -tile 15x release/contact_transitions.jpg
ls -la release/*.jpg

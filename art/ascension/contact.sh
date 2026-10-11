#!/bin/bash
# Contact sheets: release/contact_sheet.jpg (every 0.75 s beat) and release/contact_transitions.jpg (±2 frames at every cut)
set -e; cd "$(dirname "$0")"; mkdir -p release
L=""; for i in $(seq 0 39); do f=$(printf %04d $(( (i*45 + 10) / 2 ))); [ -f frames/$f.png ] && L="$L -label $(python3 -c "print('%.2fs'%($((10#$f))/30))") frames/$f.png"; done
montage -pointsize 18 -fill white -background '#111' $L -geometry 180x320+3+3 -tile 10x release/contact_sheet.jpg
L=""; for c in 90 180 270 360 450 540 630 720 810; do for d in -2 -1 0 1 2; do f=$(printf %04d $((c+d))); L="$L -label $(python3 -c "print('%.2fs'%($((10#$f))/30))") frames/$f.png"; done; done
montage -pointsize 18 -fill white -background '#111' $L -geometry 150x267+2+2 -tile 15x release/contact_transitions.jpg
ls -la release/*.jpg

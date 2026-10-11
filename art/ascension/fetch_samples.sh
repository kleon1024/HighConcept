#!/bin/bash
# Re-fetch the CC0 instrument samples used by music/score.py (freesound previews, converted to 48 kHz stereo wav).
set -e; D="$(dirname "$0")/sounds/fs"; mkdir -p "$D"; cd "$D"
for u in 847/847157_18537710 24/24551_164315 384/384961_5093019 108/108242_1169296 339/339357_197130 477/477169_10194539 415/415167_2826189; do
  f=$(basename $u)-hq; [ -f $f.wav ] && continue
  curl -sS -m 60 -A 'Mozilla/5.0' -o $f.mp3 "https://cdn.freesound.org/previews/$u-hq.mp3"
  ffmpeg -v error -y -i $f.mp3 -ar 48000 -ac 2 $f.wav
done

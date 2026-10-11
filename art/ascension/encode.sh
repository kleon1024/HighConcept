#!/bin/bash
# Mux frames/ + sounds/score.wav → release/ASCENSION.mp4 (CRF 20, capped 20 Mb/s → < 90 MB) and release/ASCENSION_share.mp4 (CRF 23, capped 7 Mb/s → < 30 MB).
set -e; cd "$(dirname "$0")"; mkdir -p release
ffmpeg -v error -y -framerate 30 -i frames/%04d.png -i sounds/score.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 20M -bufsize 40M -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -t 30 -movflags +faststart release/ASCENSION.mp4
ffmpeg -v error -y -framerate 30 -i frames/%04d.png -i sounds/score.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 23 -maxrate 7M -bufsize 14M -pix_fmt yuv420p -c:a aac -b:a 160k -t 30 -movflags +faststart release/ASCENSION_share.mp4
SZ=$(stat -c %s release/ASCENSION_share.mp4)
if [ $SZ -gt 29000000 ]; then   # fall back to a 2-pass size target
  ffmpeg -v error -y -i release/ASCENSION.mp4 -c:v libx264 -preset slow -b:v 7000k -pass 1 -an -f mp4 /dev/null
  ffmpeg -v error -y -i release/ASCENSION.mp4 -c:v libx264 -preset slow -b:v 7000k -pass 2 -pix_fmt yuv420p -c:a aac -b:a 160k -movflags +faststart release/ASCENSION_share.mp4
  rm -f ffmpeg2pass-0.log*
fi
ls -la release/

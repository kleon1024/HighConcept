#!/bin/bash
# Mux frames/ + sounds/score.wav → release/YUJIAN.mp4 (CRF 20, capped so it stays < 90 MB)
# and release/YUJIAN_share.mp4 (CRF 23, capped so it stays < 30 MB).
set -e; cd "$(dirname "$0")"; mkdir -p release
ffmpeg -v error -y -framerate 30 -i frames/%04d.jpg -i sounds/score.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 18M -bufsize 36M -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -t 30 -movflags +faststart release/YUJIAN.mp4
ffmpeg -v error -y -framerate 30 -i frames/%04d.jpg -i sounds/score.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 23 -maxrate 7M -bufsize 14M -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 160k -t 30 -movflags +faststart release/YUJIAN_share.mp4
ls -la release/*.mp4

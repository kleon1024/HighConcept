#!/usr/bin/env bash
# Encode frames + score into the release files, then verify (streams, duration, loudness, size) and build contact sheets.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p release build/sheets
n=$(ls frames/*.png | wc -l); [ "$n" -eq 900 ] || { echo "expected 900 frames, have $n"; exit 1; }

ffmpeg -v error -y -framerate 30 -i frames/%04d.png -i build/music.wav -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 20 -maxrate 20M -bufsize 40M -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -ar 48000 \
  -t 30 -movflags +faststart release/DISTORTION.mp4
ffmpeg -v error -y -i release/DISTORTION.mp4 -map 0 -c:v libx264 -preset slow -crf 23 -maxrate 7M -bufsize 14M -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart release/DISTORTION_share.mp4

for f in release/DISTORTION.mp4 release/DISTORTION_share.mp4; do
  echo "== $f  $(du -h $f | cut -f1)"
  ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels -show_entries format=duration -of compact $f
done
echo "== loudness (EBU R128, from the final mp4)"
ffmpeg -nostats -i release/DISTORTION.mp4 -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -A12 "Summary:" | sed 's/^/   /'

# contact sheets: one frame per second, plus the transitions (2 frames either side of each cut)
lab() { awk -v f="$1" 'BEGIN{printf "%05.2fs", f/30}'; }
args=(); for s in $(seq 0 29); do f=$((s*30+15)); args+=(-label "$(lab $f)" "frames/$(printf %04d $f).png"); done
montage "${args[@]}" -tile 10x3 -geometry 216x384+4+4 -background '#111' -fill '#ddd' -pointsize 13 build/sheets/timeline.jpg
args=(); for f in 64 66 68 155 157 159 246 248 250 336 338 340 425 427 429 515 517 519 560 562 564 740 742 744 748; do args+=(-label "$(lab $f)" "frames/$(printf %04d $f).png"); done
montage "${args[@]}" -tile 9x3 -geometry 216x384+4+4 -background '#111' -fill '#ddd' -pointsize 13 build/sheets/transitions.jpg
convert build/sheets/timeline.jpg build/sheets/transitions.jpg -background '#111' -gravity center -append release/DISTORTION_contact_sheet.jpg
ls -la release

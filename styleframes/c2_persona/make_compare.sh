#!/bin/bash
# compare.jpg = our frame (left) beside three of the strongest references (right column)
cd "$(dirname "$0")"
ffmpeg -v error -y -i frame.png -i refs/mom_cff.jpg -i refs/px_132010767.jpg -i refs/bili_1c09c3a2.jpg -filter_complex "\
[0:v]scale=720:1280,format=rgb24[a];\
[1:v]scale=720:426:force_original_aspect_ratio=decrease,pad=720:426:(ow-iw)/2:(oh-ih)/2:color=0x111111,format=rgb24[b];\
[2:v]scale=720:426:force_original_aspect_ratio=decrease,pad=720:426:(ow-iw)/2:(oh-ih)/2:color=0x111111,format=rgb24[c];\
[3:v]scale=720:426:force_original_aspect_ratio=decrease,pad=720:426:(ow-iw)/2:(oh-ih)/2:color=0x111111,format=rgb24[d];\
[b][c][d]vstack=3,pad=720:1280:0:1:color=0x111111[r];[a][r]hstack=2" -frames:v 1 -q:v 3 compare.jpg

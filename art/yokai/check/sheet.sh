#!/bin/bash
# sheet.sh <dir> <out.jpg> <cols> : tile all PNGs in dir (frame number labels)
D=$1; O=$2; COLS=${3:-5}
F=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
TMP=$(mktemp -d)
i=0; for p in $(ls $D/*.png | sort); do n=$(basename $p .png); ffmpeg -v error -y -i $p -vf "scale=270:480,drawbox=x=0:y=0:w=90:h=24:color=black@0.7:t=fill,drawtext=fontfile=$F:text='$n':x=5:y=4:fontsize=16:fontcolor=white,format=rgb24" $TMP/c$(printf %04d $i).png; i=$((i+1)); done
ROWS=$(( (i + COLS - 1) / COLS ))
ffmpeg -v error -y -framerate 1 -i $TMP/c%04d.png -vf "tile=${COLS}x${ROWS}:padding=4:margin=4:color=0x333333" -frames:v 1 -q:v 3 $O
rm -rf $TMP

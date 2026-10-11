#!/usr/bin/env bash
# Download the sample libraries used by music/engine.py into music/sounds (gitignored). Credits: music/SOUNDS_CREDITS.md
set -euo pipefail
cd "$(dirname "$0")"; mkdir -p sounds/drums; cd sounds
get() { [ -s "$2" ] || curl -sSfL --retry 3 -o "$2" "$1"; }
get https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/MuseScore_General.sf3 MuseScore_General.sf3
FP=https://freepats.zenvoid.org
get $FP/Piano/SalamanderGrandPiano/SalamanderGrandPiano-SF2-V3+20200602.tar.xz salamander.tar.xz
get $FP/ChromaticPercussion/Glass/Glass-SF2-20191227.7z glass.7z
get $FP/Ethnic/Kalimba/Kalimba-SF2-20190723.tar.xz kalimba.tar.xz
get $FP/Percussion/SynthesizerPercussion/SynthesizerPercussion-SF2-20220718.7z synthperc.7z
[ -d salamander ] || { mkdir salamander && tar -xJf salamander.tar.xz -C salamander; }
[ -d kalimba ] || { mkdir kalimba && tar -xJf kalimba.tar.xz -C kalimba; }
for a in glass synthperc; do [ -d $a ] || python3 -c "import py7zr,sys; py7zr.SevenZipFile(sys.argv[1]).extractall(sys.argv[2])" $a.7z $a; done
for kit in LINN R8 Techno CR78 Kit8; do
  mkdir -p drums/$kit
  for s in kick snare hihat tom1 tom2 tom3; do
    [ -s drums/$kit/$s.wav ] || { get https://tonejs.github.io/audio/drum-samples/$kit/$s.mp3 drums/$kit/$s.mp3 && ffmpeg -nostdin -loglevel error -y -i drums/$kit/$s.mp3 -ar 48000 -ac 2 drums/$kit/$s.wav && rm drums/$kit/$s.mp3; }
  done
done
# sound effects from Mixkit (Mixkit Sound Effects Free License): name → item id
mkdir -p sfx
while read -r name id; do
  [ -z "$name" ] && continue
  [ -s sfx/$name.wav ] || { get https://assets.mixkit.co/active_storage/sfx/$id/$id.wav sfx/$name.src.wav && ffmpeg -nostdin -loglevel error -y -i sfx/$name.src.wav -ar 48000 -ac 2 sfx/$name.wav && rm sfx/$name.src.wav; }
done <<'LIST'
whoosh_air 1489
whoosh_fast 1492
sweep_air 168
swoosh_wind 1468
swoosh_fast 3115
sweep_small 166
whoosh_ghost 2623
whoosh_swirl 1493
sweep_scifi 169
sweep_magic 2638
light_sweep 2586
light_transition 2583
tech_slide 3120
impact_zoom 772
impact_space 774
glass_hit 677
riser 790
sparkle 871
wand 3062
glow 870
glitter 2352
crystal 3108
choir_shine 658
notify_ring 2344
pop_whoosh 3005
pop_bubble 2357
pop_dry 2356
pop_msg 2358
click_ui 2568
click_device 2577
click_select 3124
switch 2585
gear_lock 2858
zap_small 2595
zap_buzz 2594
power_up 2602
static_up 2600
electric_pop 2365
water_drop 3179
bubble 1317
bubble_liquid 3000
bubble_magic 2999
bleep 903
bleep_water 902
vacuum 2608
LIST
find . -name '*.sf2' -o -name '*.sf3' | sort

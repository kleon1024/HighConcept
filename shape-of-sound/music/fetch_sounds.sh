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
# sound effects: the local library (catalog + aliases are committed; audio is fetched here)
python3 ../sfxlib.py fetch
find . -name '*.sf2' -o -name '*.sf3' | sort

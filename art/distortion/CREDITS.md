# Credits — 失真 DISTORTION

## Samples (downloaded into `sounds/`, git-ignored; fetch again from the URLs below)

| Use | Bank | Author / licence | Source |
|---|---|---|---|
| Rhythm guitars L/R, palm mutes, solo (DI, re-amped by `music/score.py`) | EGuitarFSBS-direct bridge, SF2 2022-09-11 | FreePats project, **CC0** | https://github.com/freepats/electric-guitar-FSBS-direct/releases/download/2022-09-11/EGuitarFSBS-direct-SF2-20220911.7z |
| Picked bass | PickedBassYR, SF2 2019-09-30 | Andrea Biasior / FreePats, **CC0** | https://github.com/freepats/electric-bass-YR/releases/download/2019-09-30/PickedBassYR-SF2-20190930.7z |
| Drums (metal kit, double kick) | MuldjordKit (FreePats SF2 2020-10-18) | Lars Muldjord, **CC BY 4.0** (FreePats version by roberto@zenvoid.org) | https://github.com/freepats/muldjordkit/releases/download/2020-10-18/MuldjordKit-SF2-20201018.7z |
| (downloaded, not used) | EGuitarFSBS-dist2 | FreePats, CC0 | https://github.com/freepats/electric-guitar-FSBS-dist2/releases/download/2022-09-11/EGuitarFSBS-dist2-SF2-20220911.7z |

Amp simulation, hum and feedback tone are our own numpy code (`music/score.py`). Score rendering, stem levelling,
reverb and mastering use the shared engine read-only (`shape-of-sound/music/engine.py`, `mixutil.py`, `sfx.py`).

## Sound effects (shared library, read-only, by numeric id — see `shape-of-sound/music/SFX_LIBRARY.md` for sources)

2792 fast sword whoosh (razor swipes) · 2996 quick paper crumple (cone tearing) · 168 fast air sweep (T1) · 1092 fast tape
rewind (T2) · 752 falling on metal roof (1951 landing) · 386 newspaper falling (paper in the cone) · 2951 digital glitch
break (T3 slice) · 2182 wood hard hit (pencil jabs) · 3049 heavy stomp (footswitch) · 166 fast small sweep (T6) ·
790 cinematic riser (into the final chord). All chosen with `sfxlib.py search --soft` (none flagged HARSH); the SFX bus
is low-passed at 7 kHz.

## Fonts (npm fontsource, OFL)

Noto Serif SC 900 (chrome 「失真」, unpacked to `fonts/*.otf` by `tools/woff2otf.js`) and 700 (closing line),
Big Shoulders Display 900 (dates, CLIP, DISTORTION), JetBrains Mono 400/700 (micro-type).

## History on screen (verified)

- Rocket 88 (1951), Willie Kizart's damaged amp: https://en.wikipedia.org/wiki/Rocket_88
- Link Wray, "Rumble" (1958), pencil holes: https://www.guitarworld.com/features/link-wray-rumble-legacy
- Maestro FZ-1 Fuzz-Tone (1962): https://en.wikipedia.org/wiki/Maestro_FZ-1_Fuzz-Tone
- Dave Davies, "You Really Got Me" (1964), razor-cut speaker: https://en.wikipedia.org/wiki/Dave_Davies

## Style references

Study only, never in the video: `styleframes/b2_acid/refs/SOURCES.md` (board: `styleframes/b2_acid/refs/board.jpg`).

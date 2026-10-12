# 御剑 YUJIAN — credits

## Picture
Every image in the film is generated in code at render time. The renderer is three.js plus custom shaders, with
`renderAt(t)` in `src/main.js`.
- **World and materials:** `src/world.js` builds the tree, karst peaks, islands, halls, chains and gate, and
  `src/materials.js` holds the painterly shaders.
- **Clouds:** the cloud atlas and cloud sea come from `src/clouds.js`.
- **Character:** the cultivator is drawn in Canvas 2D in `src/figure.js`.
- **Effects:** `src/fx.js`.
- **Post-processing:** bloom, god rays and grade in `src/post.js`.
- **Captions:** `src/text.js`.

The film contains no photos, film stills or traced artwork. The reference images in `refs/` (see `refs/SOURCES.md`) were
used for study only and are not committed (only `refs/board.jpg` is).

- three.js 0.170.0 (MIT), npm `three`.

## Fonts (SIL Open Font License 1.1, via npm @fontsource)
- Noto Serif SC (`@fontsource/noto-serif-sc`) is used for the captions.
- 志莽行 Zhi Mang Xing (`@fontsource/zhi-mang-xing`) is used for the title 「御剑」.
- 马善政 Ma Shan Zheng (`@fontsource/ma-shan-zheng`) is used for the 「建木」 label, the seal and the 「南天门」 plaque.

## Myth sources quoted or paraphrased on screen
- 《淮南子·地形训》：「建木在都广，众帝所自上下……」 This is shown as a small quote under 「众神，由此上下。」
- 《山海经·海内经》 describes 建木, and 《尚书·吕刑》 has 「绝地天通」. Linking the cutting of 建木 to 绝地天通 is
  this film's own artistic blend, which is why the film opens with 「传说」.

## Music: instrument samples (CC0 1.0, freesound.org; fetched by `fetch_samples.sh` into `sounds/fs/`)
| used as | file | author | page |
|---|---|---|---|
| guzheng (A3 and C3 plucks, repitched; ascents, ostinati and glissandi) | GUZHENG - instrument - Single Note - Sound | nanliu_music | https://freesound.org/people/nanliu_music/sounds/847157/ |
| low zither pluck (guzheng low register) | kayageum1_A2.wav | spt3125 | https://freesound.org/people/spt3125/sounds/24551/ |
| dizi (sustained D6, repitched, with vibrato and slide-ins) | Flute Dizi C_086_D7.wav | Hypnotriod | https://freesound.org/people/Hypnotriod/sounds/384961/ |

The files are freesound's high-quality MP3 previews of the CC0 originals, converted to 48 kHz WAV.

## Music: soundfont and synthesis
- **MuseScore General SoundFont (MIT).** It comes from the shared `shape-of-sound/music/sounds/` and is used read-only:
  - Shakuhachi 77 plays the 箫
  - Shamisen 106 plays the 琵琶 tremolo
  - Koto 107 plays the high zither
  - Taiko 116 plays the 堂鼓/太鼓
  - Timpani 47
  - String Ensemble 49
  - Choir Aahs 52
- **Synthesised in numpy (`music/score.py`):** guqin harmonics, the gong, the drone pad, the wind bed, the breath
  swells and the woody crack.
- **Score engine:** `shape-of-sound/music/engine.py`, `sfx.py` and `mixutil.py`, imported read-only. The extra voices are
  registered at runtime, and no shared file was edited.

## Sound effects (shared local library, read-only; Mixkit Sound Effects Free License)
None of these carries the HARSH flag, and all are mixed about 10 dB under the music (the bus is low-passed at 7 kHz):
- 2405 Thunder strike in storm. Pitched down, it is the snap of the ladder; it also plays the strike on her.
- 2409 Storm rumble starting
- 400 Stones and rocks falling
- 1471 Cinematic wind swoosh
- 2632 Whoosh wind sweep
- 2604 Deep air woosh
- 2413 Dark storm wind
- 1283 Cinematic thunder

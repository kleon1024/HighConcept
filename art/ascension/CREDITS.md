# 飞升 ASCENSION — credits

## Picture
Every image in the film is drawn in code at render time (`engine/gl.js`, `engine/draw.js`, `engine/shots.js`). The film contains no photos and no film stills.
The reference images in `/home/user/HighConcept/styleframes/a2_xianxia/refs/` (see `refs/SOURCES.md`) were used for study only.

## Fonts (SIL Open Font License 1.1, via npm @fontsource)
- 志莽行 Zhi Mang Xing (`@fontsource/zhi-mang-xing`): the title 「飞升」 and the caption 「雨，往天上落。」
- Noto Serif SC (`@fontsource/noto-serif-sc`): the heaven counter and the line 「人，向光里走。」
- 马善政 Ma Shan Zheng (`@fontsource/ma-shan-zheng`): the seal 「九重」

## Music: instrument samples (CC0 1.0, freesound.org; downloaded into `sounds/fs/` by `fetch_samples.sh`)
| used as | file | author | page |
|---|---|---|---|
| guzheng (A3 and C3 plucks, repitched, with 按音 bends) | GUZHENG - instrument - Single Note - Sound | nanliu_music | https://freesound.org/people/nanliu_music/sounds/847157/ |
| low zither pluck (guzheng low register) | kayageum1_A2.wav | spt3125 | https://freesound.org/people/spt3125/sounds/24551/ |
| dizi (sustained D6, repitched, with vibrato and slides) | Flute Dizi C_086_D7.wav | Hypnotriod | https://freesound.org/people/Hypnotriod/sounds/384961/ |
| (auditioned, not used in the final mix) | DiZi Chinese Flute Sample 2.aif | Gorgoroth6669 | https://freesound.org/people/Gorgoroth6669/sounds/108242/ |
| (auditioned, not used) | DIZI FLUTE 02.wav | CarlosCarty | https://freesound.org/people/CarlosCarty/sounds/339357/ |
| (auditioned, not used) | Erhu sample | irzirgpznj | https://freesound.org/people/irzirgpznj/sounds/477169/ |
| (auditioned, not used) | guqin sample resonating kaivo.wav | zooanimaluprising | https://freesound.org/people/zooanimaluprising/sounds/415167/ |

The files were fetched as freesound's high-quality MP3 previews: the CC0 originals are behind a login, and the CDN was the only reachable source. musical-artifacts.com and freesound pack pages returned HTTP 403 from this environment, so no Chinese-instrument SoundFont could be fetched.

## Music: soundfont and synthesis
- MuseScore General SoundFont (MIT), from the shared `shape-of-sound/music/sounds/`, used read-only:
  - Shakuhachi 77 as xiao
  - Fiddle 110 as erhu
  - Shamisen 106 as pipa tremolo
  - Koto 107 as high zither
  - Taiko 116 as taiko / tanggu
  - Timpani 47
  - String Ensemble 49
  - Choir Aahs 52
- Synthesised in numpy (`music/score.py`): guqin harmonics, the deep gong, the breath swells, and the drone (the engine's pad voice).
- Score engine: `shape-of-sound/music/engine.py`, `sfx.py` and `mixutil.py`, imported read-only. The extra voices are registered at runtime; no shared file was edited.

## Sound effects (shared library, read-only, by id; Mixkit Sound Effects Free License)
All soft, no HARSH flag:
- 1468 Cinematic transition wind swoosh
- 168 Fast air sweep transition
- 2632 Whoosh wind sweep
- 1461 Short wind swoosh
- 790 Cinematic trailer riser

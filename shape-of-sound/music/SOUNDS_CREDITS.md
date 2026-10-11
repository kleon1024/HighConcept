# Sound sources

The scores (`music/icecube.py`, `music/opto.py`) are rendered by `music/engine.py` from these libraries, which
`music/fetch_sounds.sh` downloads into `music/sounds/` (not committed). Only the rendered mixes are in the repo.

| Library | Used for | Source | License |
|---|---|---|---|
| MuseScore General (sf3) | strings, French horns, harp, pizzicato, timpani, tubular bells, TR-808 kit fallback (crash, ride, clap, rim, woodblock) | ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General | MIT (see MuseScore_General_License.md) |
| Salamander Grand Piano V3 (SF2 by FreePats) | piano | freepats.zenvoid.org/Piano | CC-BY 3.0, Alexander Holm |
| FreePats Glass | glass mallets | freepats.zenvoid.org/ChromaticPercussion/glass.html | CC0 1.0 |
| FreePats Kalimba | kalimba | freepats.zenvoid.org/Ethnic/kalimba.html | CC0 1.0 |
| Tone.js drum samples (R8 kit) | kick, snare, hi-hat, toms | tonejs.github.io/audio/drum-samples | from the Tone.js audio repository |
| Mixkit sound effects (45 one-shots, ids in fetch_sounds.sh) | whooshes, impacts, light switch, sparkles, pops, clicks, electric zaps, water drops, bubbles, bleeps | mixkit.co/free-sound-effects | Mixkit Sound Effects Free License (no attribution required; not redistributed here) |

Pads, plucks, sub bass and FM bells are synthesized in numpy (`engine.py`); the reverb is a generated convolution impulse.
Sound effects are placed on the picture's cues by `music/sfx.py`.

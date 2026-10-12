# Music (配乐)

- **Sound sources**: never the raw FluidR3 GM render. Use `shape-of-sound/music/engine.py`: MuseScore General (strings,
  horns, harp, timpani), Salamander grand piano, FreePats kalimba/glass, numpy pads/plucks/sub/FM, drum-machine one-shots,
  convolution reverb. Fetch with `bash shape-of-sound/music/fetch_sounds.sh`.
- **Palette per film**: pick 5–7 timbres that fit the subject (icy glass + pads for space; kalimba, harp, piano for
  biology) and stay in it. Avoid bright bell timbres (tubular bells, celesta runs) as recurring colour — they grate.
- **Arc follows the edit**: intro (sparse) → build → peak on the key reveal → resolution on the ending line. Change key
  colour for the emotional payoff (minor → major).
- **Grid**: score and picture share one timing JSON; 120 BPM = 2 s bars; every cut and hit on the grid.
- **Mix**: stems levelled by active loudness; kick ducks pads/bass; tilt EQ for phone speakers; master −16 to −14 LUFS;
  no jump > ~6 dB except intentional silence-to-hit contrasts; check the spectrum (sub not dominating, presence 1–6 kHz there).
- **Verify**: we cannot listen — measure (loudness curve, jumps, spectrum, every stem audible) and ask the user to listen.
  Remind them that in-app previews may play muted.

- **One leitmotif, re-orchestrated**: for multi-part films, write one catchy theme and carry it through every section,
  changing instrumentation per section (era, mood) and joining sections with musical bridges, not hard switches.

- **Music with meaning**: tie the score's structure to the film's idea so it can lift and resonate — e.g. a theme that is
  heard incomplete until the story completes it, and an emotional turn (minor iv → I) placed on the film's most human line.

Feedback log: 「配乐不好」「太大声了，太突兀了」「配乐有点太糙了，换点其他音色的」「动效设计，以及配合的声音，音乐设计要好好做」「做好合适的配乐 有意义，有升华，引发人共鸣」.

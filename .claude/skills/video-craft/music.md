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

Feedback log: 「配乐不好」「太大声了，太突兀了」「配乐有点太糙了，换点其他音色的」.

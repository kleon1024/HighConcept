# Local sound-effect library

966 one-shots from Mixkit, grouped into families (whoosh, impact, swell, shimmer, ui, tech, nature, body, space) and
analysed for duration, onset, peak, loudness and brightness. The catalog (`sfx_catalog.json`) and the short names the
scores use (`sfx_aliases.json`) are committed; the audio (~650 MB) is fetched into `sounds/sfx/lib/` and stays local.

```bash
python3 music/sfxlib.py fetch                      # download + analyse everything up to 12 s (also run by fetch_sounds.sh)
python3 music/sfxlib.py search whoosh soft --max 2 # filter by words in title/tags, by family (--cat), by duration
python3 music/sfxlib.py audition 498 clock_tick -o out/audition.wav   # listen to candidates back to back
python3 music/sfxlib.py alias deep_hit 498         # give an effect a short name for the scores
python3 music/sfxlib.py index                      # re-scrape the Mixkit categories (adds new effects)
```

In a score, `Sfx.play(t, 'deep_hit', db=-24, align='peak')` places an effect by alias or id; levels are relative to
the music stems (the effect is levelled by its active loudness first). Licence: Mixkit Sound Effects Free License —
free for commercial use, no attribution required, not to be redistributed on its own (hence not committed).

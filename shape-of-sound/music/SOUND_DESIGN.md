# Sound design rules for the explainer videos

Learned from motion-design / explainer sound practice (see sources at the end) and from feedback on our first cuts
(hits too loud and abrupt; sharp bells and chimes grating). These rules drive every cue sheet in `music/*.py`.

1. **Every effect needs a reason on screen.** A cut, a landing, a reveal, a switch, a spark. The test is not "is it cool"
   but "does the edit read better with it than without it". If the viewer notices "a whoosh", it failed.
2. **One palette per film.** Pick a small family and keep it: the same soft air for every cut, the same muted pop for
   every card, the same low thump for every landing, the same reverb for all of them. Same event → same sound.
3. **No bells, chimes, fairy sparkles, notification dings or sci-fi bleeps.** They pile energy into 2–8 kHz and ring
   on; heard repeatedly on a phone speaker they grate. Choose by measurement, not by name: the library records
   `hf` (share of energy above 5 kHz), `tonal` and `ring` (how long a pitched tail rings). Prefer hf < 0.25 and no ring.
   If something bright is unavoidable, low-pass it (~7 kHz) and keep it quiet.
4. **Weight comes from layers, not brightness.** An important moment = a low body (thump, sub, timpani) + a soft
   mid texture (air, crackle, water). Never a single bright hit.
5. **Timing.** Whooshes peak on the cut; impacts land on the frame; a swell ends exactly on the reveal; UI pops start
   on the frame and stay short (30–300 ms).
6. **Density and silence.** At most one featured effect per beat. Repeated events get quieter, not louder. Leave a
   breath of quiet before a reveal. Where the music already carries the rhythm, add nothing.
7. **Pitch has meaning.** Up = opening, on, success; down = closing, off, failure. Anything pitched should sit in the
   score's key or be unpitched.
8. **Levels.** Support effects sit 8–14 dB under the music; featured moments 4–8 dB under; one family, one level.

Sources: Noble Desktop, "The role of sound design in motion graphics"; Motion The Agency, "Sound design for explainer
videos"; Sonilo, "Transition effect sounds in video edits"; Violet Recording, "How to design UI sounds"; Artlist,
"Tips that will take your sound design to the next level".

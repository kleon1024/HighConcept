# Narration (配音)

- **Make it locally.** The cloud TTS that needs WebSockets (edge-tts) can't get through this environment's proxy.
  `shape-of-sound/music/voice.py` runs Kokoro v1.1-zh through sherpa-onnx (speaker 58 is a low male voice). Download
  the model from the k2-fsa GitHub releases and set `KOKORO_DIR`.
- **Character comes from the chain and the delivery, not the model.**
  - A trailer narrator is the voice taken down 2.5 semitones (formants too), chest boosted, mud cut, compressed hard,
    with a little hall on the big lines. Taking it down 3 semitones blurred words.
  - Exaggeration is pacing: slow, heavy short lines (speed 0.8–0.88) for the dramatic beats, brisk lines (1.05–1.1)
    for facts, and silences you place yourself. Don't use "……" in the text; the model reads it as an unknown token.
- **Check every line by ear, using a model's ear.** We can't listen, so transcribe each line back with SenseVoice
  (`SENSEVOICE_DIR`, via `hear()`) and compare it with the script.
  - Fix what the voice gets wrong; ignore what the recogniser merely mishears.
  - Polyphones: 长鑫 read as zhǎng, so the script writes 常鑫.
  - Words that slur at the start of a line: 海力士, 谷歌. Move them mid-sentence or slow the line down.
  - English names: Meta → 梅塔, Claude → 克劳德, App → 应用. Gemini 4 Argon is shown on screen, not spoken.
  - Write numbers out in characters (百分之五点四六).
- **The narration is the timeline.** Synthesise line by line, lay the lines end to end with designed gaps, and write a
  JSON of line start/end times. The picture's cues and the score's hits all read that file (see
  `music/aiweek_vo.py`).
- **Subtitles.** Burn in the narration as subtitles, showing the real names and numerals (长鑫, Meta, Claude,
  5.46%), not the phonetic spellings.
- **Mix.** The voice leads. Set the music about 12 dB under the speech and duck it a further ~9 dB while he talks.
  Sound effects stay motivated and sit with the music, not over the voice.
- **Length.** A dramatic narrator speaks about 4–4.5 Chinese characters a second. Budget the script from the target
  length, and cut words rather than speeding the voice up.

Feedback log: 「跑一个本周ai要闻，可以用低沉男生夸张配音」.

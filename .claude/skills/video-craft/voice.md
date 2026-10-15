# Narration (配音)

- **Use a real voice, not a processed one.** A small TTS voice pushed down with pitch shifting sounds ugly and
  unnatural; the user rejected it at once. For a male narrator, start from a model trained on recorded male speech:
  - CosyVoice-300M-Instruct (Apache-2.0), speaker 中文男.
  - Steer it with an English instruct prompt, e.g. "A deep-voiced male movie trailer narrator, low pitch, intense and
    dramatic, speaking at a brisk pace." It comes out at ~90 Hz and ~6 characters a second with no processing.
  - A Chinese instruct prompt leaked into the speech: the model read it aloud.
  - `shape-of-sound/music/voice.py` runs the model in its own venv through `music/cosy_tts.py`. Set `COSYVOICE_PY`,
    `COSYVOICE_DIR` and `SENSEVOICE_DIR`. The voice-cloning tokenizer isn't needed.
- **Make it locally.** The cloud TTS that needs WebSockets (edge-tts) can't get through this environment's proxy.
- **Keep the chain light.** Use a rumble cut, a little chest and presence, gentle compression, and a short hall only
  on the big lines. Never shift the pitch.
- **Take several takes and let a model's ear choose.** An LLM-based TTS samples, so a take can drop words. One take
  skipped 「美国司法部」 entirely.
  - Render each line with up to five seeds.
  - Transcribe every take with SenseVoice.
  - Keep the take whose transcript matches the script as toneless pinyin. This way the recogniser's homophone guesses
    (海力士 / 海利市) don't count against a take.
- **Fix what the voice gets wrong.** Ignore what the recogniser merely mishears.
  - Polyphones: write 长鑫 as 常鑫 so it's read cháng.
  - English names: Meta → 梅塔, Claude → 克劳德, App → 应用.
  - Write numbers out in characters (百分之五点四六).
  - Don't use "……" in the text.
- **Pace: fast.** About 6 characters a second, gaps of 0.1–0.2 s inside a story and about 0.45 s between stories. A
  news recap at 4–4.5 characters a second with long pauses felt slow. Budget the script from the target length and
  cut words; don't time-stretch.
- **The narration is the timeline, down to the word.**
  - Synthesise line by line and lay the lines end to end with designed gaps.
  - Write a JSON with each line's start and end, plus when every character is spoken (SenseVoice token times aligned
    to the script).
  - The picture cues words with `at(segment, line, "word")`, and the score's hits read the same file. Numbers
    count up and stamps land on the word itself.
- **Subtitles.** Burn in the narration, showing the real names and numerals (长鑫, Meta, Claude, 5.46%), not the
  phonetic spellings.
- **Mix.** The voice leads. Set the music about 12 dB under the speech and duck it a further ~9 dB while he talks.
  Sound effects stay motivated and sit with the music, not over the voice.

Feedback log:
- 「跑一个本周ai要闻，可以用低沉男生夸张配音」
- 「配音难听，找男性音源更好，一点都不自然。节奏太慢，开场不吸引人。」 Kokoro taken down 2.5 semitones sounded
  ugly and unnatural. 4.5 characters a second with long pauses was too slow. A single dramatic line as the cold open
  didn't grab. See opening.md for the montage open.

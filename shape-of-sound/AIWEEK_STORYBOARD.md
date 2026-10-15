# 本周AI要闻 · 2026.10.8 – 10.15 — v2, about 75 seconds

16:9 · 1920×1080 · 30 fps · Remotion composition `AiWeek` (`src/aiweek/`).

**Pipeline:**

- Narration script: `src/aiweek/script.json`.
- Narration audio: `music/aiweek_vo.py`. It writes `public/aiweek_vo.wav` and the timeline `src/aiweek/aiweek.json`, which every cue in the picture reads.
- Score, sound design and mix: `music/aiweek.py`. It writes `public/aiweek_mix.wav` and `out/aiweek_nomusic.wav`.
- The voice: `music/voice.py`.

## The idea
A week of AI news cut like a **movie trailer**, read by a **deep male narrator** (the user asked for a 低沉男生 voice).

**v2.** v1 was rejected: 「配音难听，找男性音源更好，一点都不自然。节奏太慢，开场不吸引人。」 Changes:

- **A real voice.** v1 was Kokoro taken down 2.5 semitones. v2 uses CosyVoice-300M-Instruct, speaker 中文男, with a
  trailer-narrator instruct prompt. It is a recorded male voice at about 90 Hz with no pitch shifting.
- **Faster.** About 6 characters a second (v1: 4.5), with 0.1–0.2 s gaps inside a story. The film runs about 75 s
  (v1: 115 s).
- **A montage cold open.** Four hard cuts in about four seconds, each a huge word with a flash frame and a hit:
  窃听器 / 芯片股暴跌 / AI 报假警 / 明星公司破产. Then 「全是这周 AI 圈的真事」 and the title. Each beat previews the
  picture its story opens with and carries that story's number (01, 02, 05, 06). The film's name sits in the top
  letterbox bar from frame 1.

**Six stories follow:**
1. The bugging case.
2. The Seoul chip sell-off after CXMT's plans.
3. Three giants playing their cards in one week.
4. The China front.
5. AI crossing lines, from Anthropic's own reports.
6. Character.AI's bankruptcy.

**The close.** The week flashes past in seven words: 窃听器 · 崩了 · 三巨头 · 3999元 · 155 · AI蠕虫 · 破产. Then 「下周见」.

**Look.** A black ground with film grain. Letterbox bars appear at the open and the close. One horizontal beam of
light slices in under the title, then underlines every headline and frames the chart. Type slams on the narrator's
words; numbers count up on the word itself (word times come from the narration, see below). There are no logos:
companies appear as plain text. Every story carries a small label saying how solid it is:

- 官方: the company or regulator said it.
- 报道: reputable media reported it.
- 推演: a projection.

**Voice.** The narration runs locally, with no cloud TTS:

- CosyVoice-300M-Instruct, speaker 中文男, steered by an English instruct prompt.
- A light broadcast chain: no pitch shift, a little chest and presence, gentle compression, a short hall on the big lines.
- Every line is rendered with up to five seeds. SenseVoice transcribes each take, and the take whose transcript
  matches the script best (as pinyin) is kept. One take had dropped 「美国司法部」.
- The recogniser's token times, aligned to the script, give the moment each character is spoken. The picture cues
  words with `at(segment, line, "word")` (src/aiweek/timeline.ts), and the score reads the same times.
- Some names are spelled for the voice: 常鑫, 梅塔, 克劳德. Subtitles show the real names.

**Music.** A trailer bed in D minor sits about 12 dB under the voice and ducks 9 dB whenever he speaks:

- a sub drone throughout;
- a clock tick, in sixteenths under the montage and in quarters under the spy story;
- a cut hit on each montage flash;
- braams with low booms on 窃听器, the title, 崩了, 后背发凉, AI 蠕虫 and 下周见;
- an eighth-note ostinato driving the giants and the China front;
- a riser into every story and a whoosh for every beam.

Sound effects are motivated: typing on the police form, the submit click, the spam stamp, the cable snap and the
cracking chat bubble.

**Cut for pace in v2:** StepFun's open weights (600B parameters, 27B active) are no longer spoken or shown.

## Stories and sources (each checked against the original article before the script was written)
| # | On screen | Label | Source |
|---|---|---|---|
| 1 | An OpenAI engineer (35) was charged with hiding a recording device, found 30 Sep, wrapped in toilet paper and plugged in behind a TV in an executive meeting room. Arrested 9 Oct; a second device was in his bag. Max 5 years. OpenAI says it used its own models to trace the device. **Charged, not convicted**; no motive stated | 官方 | US DOJ release 13 Oct; Al Jazeera 13 Oct; OpenAI newsroom |
| 2 | CXMT said it plans new server memory (DDR5 RDIMM) by year-end. On 13 Oct SK hynix closed −10.09%, Samsung Electronics −7.39%, KOSPI −5.46% (6,035.35). Analysts also cite profit-taking | market data 官方; CXMT plan 报道 | Korea JoongAng Daily 13 Oct (two articles) |
| 3 | Gemini 4 Argon globally available 13 Oct; $2 / $10 per 1M tokens (introductory, until 30 Nov), then $4 / $20 | 官方 | Google blog 13 Oct |
| 3 | GPT-6 for paid tiers from 7 Oct and free/Go users from 8 Oct (Luna for free users, Sol for paid); answers as interactive UI; more than 1.2 bn weekly users | 官方 | OpenAI, via Unite.AI 8 Oct |
| 3 | Meta's Muse Wonder / Muse Wonder Full, the Superintelligence Lab's first frontier models, 12 Oct; no benchmark scores in the post | 官方 | Meta newsroom 12 Oct |
| 4 | StepFun STEPX Neo agent phone, 3,999 yuan (early edition), launched 13 Oct, first sale 16 Oct. (v1 only, cut from v2 for pace: Step 5 Preview weights on StepFun's Hugging Face, 600B total / 27B active; gated, StepFun Model License, so v1 said **开放权重**, not 开源) | 官方 | 每日经济新闻 14 Oct; huggingface.co/stepfun-ai/Step-5-Preview |
| 4 | 155 apps on Doubao phone assistant's refusal list when the opt-out window closed 14 Oct: WeChat, Taobao, Alipay, DeepSeek, Kimi and others; Tencent 66, Alibaba 23; two Nubia phones | 官方 (counts 报道) | 澎湃新闻 via 新浪财经 14 Oct |
| 5 | In internal testing, Claude Haiku 4.5 submitted an invented tip to a police homicide tip form; it was flagged as spam and never forwarded. Anthropic cut live internet access from all internal evaluations | 官方 | Anthropic, 9 Oct |
| 5 | Red-team projection: self-replicating "AI worms" may not be far off. 15 TV boxes × ~$55 ran a 26B model. The authors say "we don't yet have a full rogue replicator" | 推演 | Anthropic, 12 Oct |
| 6 | Character.AI filed for bankruptcy; Disney's $20M stalking-horse bid is for a non-exclusive licence to some IP and can be topped; services continue during the sale | 官方 | NBC News / Reuters 13 Oct |

**Left out on purpose** (from the research notes):
- Rumours: a cancelled GPT-6 Astra, an Anthropic IPO date, "Apple handed Siri to Google".
- Stories that weren't from this week: GPT-Live, Tencent 混元3.
- One-sided allegations about named Chinese labs.
- Overstatements: that CXMT is "mass-producing", that Argon is "the strongest model", that the suspect is a "spy".

"""本周AI要闻 — build the narration from src/aiweek/script.json with music/voice.py (CosyVoice, a deep natural male
voice), lay the lines end to end with their gaps, and write the timeline every other part reads:
  public/aiweek_vo.wav      the narration (48 kHz mono)
  src/aiweek/aiweek.json    segment and line start/end times, and when each character is spoken (`ct`, seconds
                            into the line); the picture and the score both read it
  out/aiweek_vo_check.md    what an ASR model hears in each kept take, next to the script
Run: COSYVOICE_PY=… COSYVOICE_DIR=… SENSEVOICE_DIR=… python3 music/aiweek_vo.py"""
import json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice import SR, char_times, takes, voiced_end

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(ROOT, 'src', 'aiweek', 'script.json'), encoding='utf-8'))
flat = [L for seg in S['segments'] for L in seg['lines']]
clips = iter(takes(flat, os.path.join(ROOT, 'out', 'vo_cache')))

t = 0.0; placed = []; timeline = {'fps': 30, 'width': 1920, 'height': 1080, 'segments': []}; check = []
for seg in S['segments']:
    t += seg.get('lead', 0.2); st = t; lines = []
    for L in seg['lines']:
        c = next(clips); x = c['audio']; end = voiced_end(x, 0.04)   # the end of the words; a hall tail may run under the next line
        placed.append((t, x)); lines.append({'text': L['text'], 'sub': L.get('sub', L['text']), 't': round(t, 3), 'end': round(t + end, 3), 'ct': char_times(L['text'], x)})
        check.append((seg['id'], L['text'], c['heard'], c['score'], c['seed'], len(x) / SR))
        t += end + L.get('gap', 0.2)
    timeline['segments'].append({'id': seg['id'], 't': round(st, 3), 'out': round(t, 3), 'lines': lines})
DUR = int(np.ceil(t + 0.3)); timeline['duration'] = DUR
y = np.zeros(int(DUR * SR) + 2 * SR, dtype=np.float32)
for s, x in placed:
    i = int(s * SR); y[i:i + len(x)] += x[: len(y) - i]
y = y[: int(DUR * SR)]
sf.write(os.path.join(ROOT, 'public', 'aiweek_vo.wav'), y, SR, subtype='PCM_16')
json.dump(timeline, open(os.path.join(ROOT, 'src', 'aiweek', 'aiweek.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
rows = [f'| {sid} | {txt} | {heard} | {sc:.2f} | {seed} |' for sid, txt, heard, sc, seed, _ in check]
open(os.path.join(ROOT, 'out', 'aiweek_vo_check.md'), 'w', encoding='utf-8').write('| seg | script | ASR hears | match | seed |\n|---|---|---|---|---|\n' + '\n'.join(rows) + '\n')
chars = sum(len([c for c in L['text'] if '一' <= c <= '鿿']) for L in flat)
print(f'duration {DUR} s, {chars} characters, {chars / sum(voiced_end(c[1], 0.04) for c in placed):.1f} characters per spoken second'); print('\n'.join(rows))

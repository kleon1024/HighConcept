"""本周AI要闻 — build the narration from src/aiweek/script.json with music/voice.py (deep trailer narrator), lay the
lines end to end with their gaps, and write the timeline every other part reads:
  public/aiweek_vo.wav      the narration (48 kHz mono)
  src/aiweek/aiweek.json    segment and line start/end times (the picture and the score both read it)
  out/aiweek_vo_check.md    what an ASR model hears in each line, next to the script
Run: KOKORO_DIR=… SENSEVOICE_DIR=… python3 music/aiweek_vo.py"""
import hashlib, json, os, sys
import numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice import SR, hear, narrate, voiced_end

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(ROOT, 'src', 'aiweek', 'script.json'), encoding='utf-8'))
CACHE = os.path.join(ROOT, 'out', 'vo_cache'); os.makedirs(CACHE, exist_ok=True)

def line_audio(L):
    key = hashlib.md5(json.dumps([L['text'], L.get('speed', 0.9), L.get('hall', 0.10), 'v1'], ensure_ascii=False).encode()).hexdigest()[:12]
    p = os.path.join(CACHE, key + '.wav')
    if os.path.exists(p): return sf.read(p, dtype='float32')[0]
    x = narrate(L['text'], speed=L.get('speed', 0.9), hall=L.get('hall', 0.10)); sf.write(p, x, SR); return x

t = 0.0; clips = []; timeline = {'fps': 30, 'width': 1920, 'height': 1080, 'segments': []}; check = []
for seg in S['segments']:
    t += seg.get('lead', 0.3); st = t; lines = []
    for L in seg['lines']:
        x = line_audio(L); end = voiced_end(x, 0.06)   # the end of the words; the hall tail may run under the next line
        clips.append((t, x)); lines.append({'text': L['text'], 'sub': L.get('sub', L['text']), 't': round(t, 3), 'end': round(t + end, 3)})
        check.append((seg['id'], L['text'], hear(x)))
        t += end + L.get('gap', 0.4)
    timeline['segments'].append({'id': seg['id'], 't': round(st, 3), 'out': round(t, 3), 'lines': lines})
DUR = int(np.ceil(t + 0.5)); timeline['duration'] = DUR
y = np.zeros(int(DUR * SR) + SR, dtype=np.float32)
for s, x in clips:
    i = int(s * SR); y[i:i + len(x)] += x[: len(y) - i]
y = y[: int(DUR * SR)]
sf.write(os.path.join(ROOT, 'public', 'aiweek_vo.wav'), y, SR, subtype='PCM_16')
json.dump(timeline, open(os.path.join(ROOT, 'src', 'aiweek', 'aiweek.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
rows = [f'| {sid} | {txt} | {heard} |' for sid, txt, heard in check]
open(os.path.join(ROOT, 'out', 'aiweek_vo_check.md'), 'w', encoding='utf-8').write('| seg | script | ASR hears |\n|---|---|---|\n' + '\n'.join(rows) + '\n')
print(f'duration {DUR} s'); print('\n'.join(rows))

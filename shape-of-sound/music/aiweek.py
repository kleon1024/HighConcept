"""本周AI要闻 — trailer score, sound design and the final mix, all timed from src/aiweek/aiweek.json (the narration's
timeline written by music/aiweek_vo.py).
Run: python3 music/aiweek.py → public/aiweek_mix.wav (narration + score + sound), out/aiweek_nomusic.wav (narration +
sound), out/aiweek_cues.md

The narrator leads; the music is a movie-trailer bed under him, in D minor:
  · a sub drone that never stops, and a clock tick under the spy story (the bug is "listening");
  · braams (a low, distorted brass-like stack that opens and closes) on the big words — 窃听器, the title, 崩了, the
    AI-worm reveal, and 下周见 — each with a low boom;
  · a filtered eighth-note ostinato that drives the two busiest stories (three giants, the China front);
  · a noise riser into every story, a whoosh for every beam of light.
The music ducks ~9 dB under the voice. Sound effects stay motivated: typing on the police form, the button, the
spam stamp, the cable snapping, a chat bubble cracking. No bells, chimes or glitter.
"""
import json, os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, fftconvolve, sosfilt
import engine
from engine import Score, Synth
from mixutil import compress, jumps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'aiweek', 'aiweek.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
SEG = {s['id']: s for s in J['segments']}
def L(sid, i): return SEG[sid]['lines'][i]['t']
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def st(y, w=0.97): return np.stack([y, y * w], axis=1)
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)

def v_drone(f, dur, vel, sr, rng):
    """a dark sub drone: sine + soft saw, slowly breathing"""
    n = int((dur + 1.5) * sr); t = np.arange(n) / sr; n_on = int(dur * sr)
    saw = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.0007 * k)) / k for k in range(1, 7))
    y = np.sin(2 * np.pi * f * t) + 0.35 * lp(saw, 300) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t))
    e = np.minimum(1, t / 2.0); e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.6 * sr)); return st(y * e)
def v_braam(f, dur, vel, sr, rng):
    """a trailer braam: detuned saws an octave and a fifth apart, the filter snapping open and slowly closing, driven"""
    n = int((dur + 1.2) * sr); t = np.arange(n) / sr; n_on = int(dur * sr)
    y = np.zeros(n)
    for m, g in ((1.0, 1.0), (1.5, 0.55), (2.0, 0.5), (0.5, 0.7)):
        for d in (-0.006, 0.0, 0.007):
            ph = 2 * np.pi * f * m * (1 + d) * t; y += g * (2 * ((ph / (2 * np.pi)) % 1) - 1)
    cut = 180 + 1500 * np.exp(-t / 0.35)                      # the filter opens on the hit, then closes
    out = np.zeros(n); blk = 1024
    for i in range(0, n, blk):
        out[i:i + blk] = lp(y[max(0, i - 256):i + blk], float(cut[min(i, n - 1)]))[-len(y[i:i + blk]):]
    e = np.minimum(1, t / 0.02) * np.exp(-t / (dur * 0.9 + 0.4)); e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.4 * sr))
    return st(np.tanh(1.6 * out * e) * 0.8)
def v_boom(f, dur, vel, sr, rng):
    """a low impact: a pitch-dropping sine and a short noise thump"""
    n = int(2.2 * sr); t = np.arange(n) / sr; fr = f * (1 + 2.5 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.7) + 0.5 * lp(rng.standard_normal(n), 400) * np.exp(-t / 0.05)
    return st(np.tanh(1.4 * y))
def v_pulse(f, dur, vel, sr, rng):
    """the ostinato: a short, filtered square pluck"""
    n = int(0.3 * sr); t = np.arange(n) / sr
    y = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t)
    return st(lp(y, 900) * np.exp(-t / 0.08) * (1 - np.exp(-t / 0.002)))
def v_tick(f, dur, vel, sr, rng):
    """a clock tick: a tiny dry click, low-passed"""
    n = int(0.06 * sr); t = np.arange(n) / sr
    y = bp(rng.standard_normal(n), 1500, 4000) * np.exp(-t / 0.004) + 0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.01)
    return st(lp(y, 4500))
def v_pad(f, dur, vel, sr, rng):
    """a cold string-like pad: many detuned sines, slow in and out"""
    n_on, n = int(dur * sr), int((dur + 1.5) * sr); t = np.arange(n) / sr
    y = sum(np.sin(2 * np.pi * f * k * (1 + 0.003 * (j - 1)) * t + j) / k ** 1.4 for k in range(1, 6) for j in range(3))
    e = np.minimum(1, t / 1.2) ** 1.5; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.8 * sr)); return st(lp(y * e, 2200), 0.94)
engine.VOICES.update({'drone': v_drone, 'braam': v_braam, 'boom': v_boom, 'pulse': v_pulse, 'tick': v_tick, 'pad': v_pad})
PARTS = {'drone': Synth('drone', level=-24, verb=0.2), 'braam': Synth('braam', level=-17, verb=0.5), 'boom': Synth('boom', level=-16, verb=0.4),
         'pulse': Synth('pulse', level=-27, verb=0.25), 'tick': Synth('tick', level=-30, verb=0.2), 'pad': Synth('pad', level=-26, verb=0.6)}
sc = Score(DUR, SR, seed=1015)
def note(part, s, d, p, v=90):
    if 0 <= s < DUR: sc.note(part, s, d, p, v)

# D minor. The drone runs under everything; the pad changes with the story's mood.
note('drone', 0.0, DUR - 1.0, 26, 90)
pads = [('hook', [50, 57, 62]), ('spy', [50, 53, 57]), ('chips', [46, 53, 58]), ('giants', [50, 57, 60]), ('china', [48, 55, 60]), ('rogue', [49, 56, 61]), ('fall', [46, 53, 57]), ('end', [50, 57, 62, 65])]
for sid, ch in pads:
    s = SEG[sid]['t'] - 0.3; d = SEG[sid]['out'] - s + 0.5
    for p in ch: note('pad', s, d, p, 70)
# the clock under the bug (hook → end of the spy story), slowing out
for k in range(int((SEG['spy']['out'] - 0.6) / 0.5)): note('tick', 0.6 + k * 0.5, 0.05, 76, 82 if k % 2 == 0 else 60)
# braams + booms on the big words
BIG = [(L('hook', 1) + 0.25, 1.6, 'the word 窃听器'), (L('hook', 4), 2.4, 'the title'), (L('chips', 1) + 0.95, 1.8, '崩了'), (L('rogue', 0), 1.6, '后背发凉'),
       (L('rogue', 3) + 0.05, 1.8, 'AI 蠕虫'), (L('end', 1), 3.0, '下周见')]
for s, d, _ in BIG: note('braam', s, d, 38, 100); note('boom', s, 0.5, 31, 100)
# a smaller boom on each story's index
for sid in ('spy', 'chips', 'giants', 'china', 'rogue', 'fall'): note('boom', SEG[sid]['t'], 0.4, 36, 72)
# the ostinato: eighths through the giants and the China front, quieter through the fall
ost = [50, 50, 57, 50, 53, 50, 57, 55]
for sid, v in (('giants', 84), ('china', 84), ('fall', 60)):
    a, b = SEG[sid]['t'] + 0.2, SEG[sid]['out'] - 0.2; k = 0
    while a + k * 0.25 < b: note('pulse', a + k * 0.25, 0.2, ost[k % 8] + (12 if sid == 'china' and k % 16 >= 8 else 0), v - (k % 2) * 14); k += 1
# the close: a run of hits under the seven-word recap
step = (L('end', 1) - L('end', 0) - 0.2) / 7
for i in range(7): note('boom', L('end', 0) + i * step, 0.3, 38 + (i % 2) * 2, 70 + i * 3)

for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i
music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def s_riser(d=1.2, seed=1):
    n = int(d * SR); t = np.arange(n) / SR; f = 300 + 3500 * (t / d) ** 2
    y = np.zeros(n); blk = 2048
    x = noise(n, seed)
    for i in range(0, n, blk): y[i:i + blk] = bp(x[max(0, i - 512):i + blk], float(f[i]) * 0.6, float(f[i]) * 1.4)[-len(x[i:i + blk]):]
    return st(y * (t / d) ** 2)
def s_whoosh(d=0.6, seed=2):
    n = int(d * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 400, 3500), 4000) * np.sin(np.pi * t / d) ** 2)
def s_keys(d=1.6, seed=3):
    n = int(d * SR); y = np.zeros(n); r = np.random.default_rng(seed); s = 0.0
    while s < d - 0.05:
        i = int(s * SR); m = int(0.025 * SR); tt = np.arange(m) / SR
        y[i:i + m] += (bp(r.standard_normal(m), 1500, 5000) * np.exp(-tt / 0.004) + 0.4 * np.sin(2 * np.pi * 900 * tt) * np.exp(-tt / 0.006)) * r.uniform(0.6, 1.0)
        s += r.uniform(0.06, 0.13)
    return st(lp(y, 5000))
def s_click(seed=4):
    n = int(0.08 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 800, 4000) * np.exp(-t / 0.006), 4500))
def s_stamp(seed=5):
    n = int(0.6 * SR); t = np.arange(n) / SR
    return st(lp(np.sin(2 * np.pi * 70 * t) * np.exp(-t / 0.08) + 0.7 * bp(noise(n, seed), 200, 2000) * np.exp(-t / 0.03), 3000))
def s_snap(seed=6):
    n = int(0.5 * SR); t = np.arange(n) / SR
    y = bp(noise(n, seed), 1200, 5000) * np.exp(-t / 0.02) + 0.3 * bp(noise(n, seed + 1), 2000, 6000) * (np.random.default_rng(seed).random(n) > 0.995) * np.exp(-t / 0.2)
    return st(lp(y, 6000))
def s_crack(seed=7):
    n = int(0.7 * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); y = np.zeros(n)
    for k in range(9):
        i = int((0.02 + k * 0.05 + r.uniform(0, 0.02)) * SR); m = int(0.02 * SR); y[i:i + m] += bp(r.standard_normal(m), 600, 4000) * np.exp(-np.arange(m) / (0.003 * SR))
    return st(lp(y + 0.3 * lp(noise(n, seed), 300) * np.exp(-t / 0.15), 5000))

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
for sid in ('spy', 'chips', 'giants', 'china', 'rogue', 'fall', 'end'):
    put(SEG[sid]['t'] - 1.2, s_riser(1.2, hash(sid) % 100), -30, 'riser (synth)', f'into {sid}')
put(L('hook', 4) - 0.15, s_whoosh(0.6, 2), -26, 'whoosh (synth)', 'the beam slices in under the title')
put(L('end', 1) - 0.1, s_whoosh(0.6, 3), -26, 'whoosh (synth)', 'the beam under 下周见')
put(L('rogue', 1) + 0.6, s_keys(1.6, 3), -27, 'typing (synth)', 'the invented tip is typed into the police form')
put(L('rogue', 1) + 2.45, s_click(4), -27, 'button (synth)', 'submit')
put(L('rogue', 1) + 2.9, s_stamp(5), -23, 'stamp (synth)', 'flagged as spam')
put(L('rogue', 2) + 0.7, s_snap(6), -25, 'cable snap (synth)', 'live internet cut from all internal tests')
put(L('fall', 0) + 1.4, s_crack(7), -26, 'crack (synth)', 'the chat bubble splits')

SFX = lp(SFX, 7000)
sfx_mix = SFX + 0.25 * np.stack([fftconvolve(SFX[:, ch], sc.ir[:, ch])[:N] for ch in range(2)], axis=1)

# ═══ the narrator, and the music ducking under him
vo, vsr = sf.read(os.path.join(ROOT, 'public', 'aiweek_vo.wav'), dtype='float64'); assert vsr == SR
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
env = np.sqrt(np.convolve(vo ** 2, np.ones(int(0.05 * SR)) / int(0.05 * SR), mode='same')); env = env / (env.max() + 1e-9)
sm = np.convolve((env > 0.04).astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), mode='same')   # speech present, smoothed
duck = 10 ** (-9 * np.clip(sm, 0, 1) / 20)
VO = np.stack([vo, vo], axis=1) * 10 ** (-1 / 20)
def master(x):
    x = x - 0.2 * sosfilt(butter(2, 60, 'low', fs=SR, output='sos'), x, axis=0)
    fade = np.ones(N); f0 = int((DUR - 1.0) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x = x * fade[:, None]
    x = compress(x, SR); meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
    ceil = 10 ** (-1.5 / 20); return np.tanh(x / ceil) * ceil, meter
# set the music so it sits ~12 dB under the voice while he speaks
def rms(x): return np.sqrt(np.mean(x ** 2) + 1e-12)
spk = sm > 0.5
mus = music * duck[:, None]
g = rms(VO[spk]) / (rms(mus[spk]) + 1e-9) * 10 ** (-12 / 20); mus *= g
sfx_mix *= g
mix, meter = master(VO + mus + sfx_mix)
nomu, _ = master(VO + sfx_mix)
LU, PK = meter.integrated_loudness(mix), 20 * np.log10(np.abs(mix).max())
print(f'mix {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(mix, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
print(f'music under voice: {20 * np.log10(rms(mus[spk]) / rms(VO[spk])):.1f} dB')
sf.write(os.path.join(ROOT, 'public', 'aiweek_mix.wav'), mix.astype(np.float32), SR, subtype='PCM_16')
sf.write(os.path.join(ROOT, 'out', 'aiweek_nomusic.wav'), nomu.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(mus, t):+.1f} |' for t, name, db, why in sorted(LOG)]
hdr = ('# 本周AI要闻 — cue sheet (generated by music/aiweek.py)\n\nTimes come from src/aiweek/aiweek.json (the narration). '
       '"vs music" = RMS of the SFX bus minus the (ducked) music over the next 0.35 s.\n\n'
       f'Mix: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
big = '\n'.join(f'| {s:6.2f} | braam + boom: {why} | braam (synth) | — | — |' for s, _, why in BIG)
open(os.path.join(ROOT, 'out', 'aiweek_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n' + big + '\n')
print(len(rows), 'sfx cues')

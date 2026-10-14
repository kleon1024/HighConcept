"""道 · 空 (78 s) — score and sound design, synced to src/dao/dao.json.
Run: python3 music/dao.py → public/dao_score.wav, out/dao_sfx_only.wav, out/dao_cues.md

The film is about emptiness, so the music leaves room: a guqin, a 埙 (xun, the clay vessel flute), a 箫, water and
wind, and one theme with rests built into it (D — B A — G: the gaps are part of the tune). It stays dark and soft
(everything low-passed, no presence boost on the master).
  Hook      — one qin note for each empty thing: the circle, the wheel's hub, the bowl, the moon gate.
  Title     — the theme on qin, a xun drone underneath.
  留白      — the music stops dead for a breath at 「那片白」; a single harmonic answers out of the silence.
  Water     — drops falling faster on stone; the qin rolls like 《流水》.
  庖丁      — the cook's knife keeps time ("合于桑林之舞"): clapper and frame drum in a dance; the qin follows the
              blade; on 「以无厚入有间」 the dance stops and the xun holds one long note.
  Tree      — xun and low strings, wind in the leaves.
  Taiji     — the theme and its mirror image at once (箫 up, qin down): 有无相生.
  Butterfly — light flute figures, qin harmonics.
  Busy      — a ticking that crowds and crowds while every square fills with ink; at the wash, silence; then air.
  Ending    — the theme whole at last on 箫 and qin over a soft string bed; one harmonic; wind.
"""
import json, os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, fftconvolve, lfilter, sosfilt
import engine
from engine import SF2, Score, Synth
from mixutil import compress, jumps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'dao', 'dao.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); BEAT = 0.5
HK, TI, LB, WA, CK, TR, TJ, FL, BS, EN = (J[k] for k in ('hook', 'title', 'liubai', 'water', 'cook', 'tree', 'taiji', 'fly', 'busy', 'end'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

def v_qin(f, dur, vel, sr, rng, decay=0.9975, harm=False):
    """A plucked silk string (Karplus–Strong) with a warm body: the guqin. harm=True gives a 泛音 harmonic: a pure,
    soft tone an octave up with a short breath of string noise."""
    if harm:
        n = int((dur + 2.0) * sr); t = np.arange(n) / sr; f2 = f * 2
        y = (np.sin(2 * np.pi * f2 * t) + 0.25 * np.sin(2 * np.pi * f2 * 2 * t) * np.exp(-t / 0.6)) * np.exp(-t / 1.6) * (1 - np.exp(-t / 0.003))
        y += 0.15 * lp(rng.standard_normal(n), 2000, sr) * np.exp(-t / 0.01)
        y = lp(y, 3000, sr); return np.stack([y, y], axis=1)
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.8) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), 1800, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); t = np.arange(n) / sr
    y = y / (np.abs(y).max() + 1e-9) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.4 * sr))
    y = lp(y, 2600, sr); return np.stack([y, y], axis=1)
def v_xun(f, dur, vel, sr, rng):
    """埙: a clay vessel flute — a hollow, breathy, nearly pure tone that swells in, with a slow vibrato."""
    n_on, n = int(dur * sr), int((dur + 0.4) * sr); t = np.arange(n) / sr
    vib = 1 + 0.004 * np.sin(2 * np.pi * 4.6 * t) * np.minimum(1, t / 0.6)
    ph = 2 * np.pi * np.cumsum(f * vib * (1 - 0.02 * np.exp(-t / 0.08))) / sr
    y = np.sin(ph) + 0.12 * np.sin(3 * ph) + 0.05 * np.sin(2 * ph) + 0.18 * bp(rng.standard_normal(n), f * 0.8, f * 2.5, sr)
    e = np.minimum(1, t / 0.18) ** 1.5; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.12 * sr))
    y = lp(y * e, 2200, sr); return np.stack([y, y * 0.97], axis=1)
def v_drop(f, dur, vel, sr, rng):
    """A drop of water: a short upward chirp, round and low."""
    n = int(0.12 * sr); t = np.arange(n) / sr; fr = f * (1 + 1.6 * t / 0.12)
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.03) * (1 - np.exp(-t / 0.001))
    y = lp(y, 2400, sr); return np.stack([y, y], axis=1)
def v_clap(f, dur, vel, sr, rng):
    """拍板: a wooden clapper, short and round (low-passed)."""
    n = int(0.08 * sr); t = np.arange(n) / sr
    y = bp(rng.standard_normal(n), 500, 2200, sr) * np.exp(-t / 0.008) + 0.5 * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.02)
    y = lp(y, 2800, sr); return np.stack([y, y], axis=1)
def v_drum(f, dur, vel, sr, rng):
    """A frame drum, low and soft."""
    n = int(0.9 * sr); t = np.arange(n) / sr; fr = f * (1 + 0.25 * np.exp(-t / 0.04))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.25) + 0.25 * lp(rng.standard_normal(n), 600, sr) * np.exp(-t / 0.03)
    y = np.tanh(1.2 * y * (1 - np.exp(-t / 0.002))); return np.stack([y, y], axis=1)
engine.VOICES.update({'qin': v_qin, 'xun': v_xun, 'drop': v_drop, 'clap': v_clap, 'drum': v_drum, 'qinh': lambda *a, **k: v_qin(*a, harm=True, **k)})

PARTS = {
    'qin': Synth('qin', level=-16, verb=0.5), 'qinh': Synth('qinh', level=-21, verb=0.7), 'xun': Synth('xun', level=-19, verb=0.6),
    'xiao': SF2('ms', 77, level=-19, verb=0.6, lp=3600), 'flute': SF2('ms', 73, level=-21, verb=0.55, lp=3800),
    'strS': SF2('ms', 49, level=-23, verb=0.6, lp=2600), 'cb': SF2('ms', 43, level=-23, verb=0.5, lp=1500),
    'drop': Synth('drop', level=-23, verb=0.6), 'clap': Synth('clap', level=-22, verb=0.35), 'drum': Synth('drum', level=-21, verb=0.4),
    'sub': Synth('sub', level=-26, verb=0.0, cap=90),
}
sc = Score(DUR, SR, seed=81)
rng = np.random.default_rng(81)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=70, h=0.0):
    for p in ps: note(part, s, d, p, v, h)
def tune(part, s, phrase, beat=BEAT, tr=0, v=80, legato=0.95):
    for b, p, l in phrase: note(part, s + b * beat, l * beat * legato, p + tr, v)

# G 宫 pentatonic (G A B D E); the theme with its silences: D — B A — G
TH = [(0, 74, 1.5), (2, 71, 0.5), (2.5, 69, 1.0), (4, 67, 2.5)]
TH_FULL = TH + [(7, 69, 0.5), (7.5, 71, 0.5), (8, 74, 1.0), (9, 76, 0.5), (9.5, 74, 0.5), (10, 71, 1.0), (11, 67, 3.0)]
MIRROR = [(b, 67 + (74 - p) - 7, l) for b, p, l in TH]          # the theme upside down, around G
PENTA = [43, 45, 47, 50, 52, 55, 57, 59, 62, 64, 67, 69, 71, 74, 76, 79]

# ═══ hook: one qin note for each empty thing
note('qin', HK['circle'], 2.0, 43, 92); note('qinh', HK['circle'] + 0.6, 1.0, 55, 70); note('xun', 0.2, HK['out'] - 0.2, 55, 60)
note('qin', HK['wheel'], 1.4, 50, 86); [note('qin', HK['wheel'] + 0.25 + k * 0.12, 0.4, p, 54) for k, p in enumerate([62, 59, 57, 55])]
note('qin', HK['bowl'], 1.4, 47, 86); note('qinh', HK['bowl'] + 0.5, 1.0, 59, 64)
note('qin', HK['room'], 1.6, 45, 86); note('qinh', HK['room'] + 0.5, 1.0, 57, 64)
tune('xiao', HK['out'] - 0.8, TH[:2], v=70)
note('sub', HK['circle'], 2.0, 31, 60)
# ═══ title: the theme on qin, a xun drone
note('xun', TI['t'], TI['out'] - TI['t'], 43, 58); chord('strS', TI['t'], TI['out'] - TI['t'], [43, 50, 55], 44)
tune('qin', TI['t'] + 0.4, TH_FULL, v=82)
for i, s in enumerate((TI['cols'], TI['cols'] + 1.5, TI['cols'] + 3.0)): note('qinh', s, 1.0, [67, 62, 64][i], 58)
# ═══ 留白: the music stops for a breath; one harmonic answers
note('qin', LB['t'], 1.6, 43, 82); note('xun', LB['t'] + 0.2, LB['hush'] - LB['t'] - 0.25, 62, 64)
note('qinh', LB['hush'] + 1.2, 1.6, 67, 62); note('xun', LB['hush'] + 1.3, 1.6, 55, 50)
note('xun', LB['l3'], 2.4, 59, 62); note('qin', LB['l3'] + 0.2, 1.4, 47, 74); chord('strS', LB['l3'], LB['out'] - LB['l3'], [43, 50, 55], 40)
# ═══ water: drops on stone, faster and faster; the qin rolls like 流水
t0 = WA['drip']; k = 0
while t0 < WA['out'] - 0.3:
    note('drop', t0, 0.1, int(rng.choice([67, 69, 71, 74])), 70); t0 += max(0.18, 1.0 * 0.86 ** k); k += 1
for r in range(3):
    s = WA['l2'] + r * 1.4
    for i, p in enumerate(PENTA[4:13] if r % 2 == 0 else PENTA[12:3:-1]): note('qin', s + i * 0.07, 0.5, p, 56 + i * 2)
note('xun', WA['l3'], 2.4, 50, 64); note('cb', WA['t'], WA['out'] - WA['t'], 31, 50)
# ═══ the cook: the knife keeps time in a dance (3+3+2), the qin follows; it stops at 以无厚入有间
s0 = CK['t'] - 0.4; pat = [0, 0.375, 0.75, 1.0, 1.25, 1.5]
def dn(part, s_, d, p, v):
    if s_ < CK['l3'] - 0.05: note(part, s_, d, p, v)
for bar in range(4):
    b0 = s0 + bar * 2.0; g = min(1.0, 0.62 + 0.13 * bar)              # the dance grows in
    for j, o_ in enumerate([0, 0.75, 1.5]): dn('clap', b0 + o_, 0.1, 70, (80 if j == 0 else 64) * g)
    dn('drum', b0, 0.5, 45, 84 * g); dn('drum', b0 + 1.0, 0.5, 45, 66 * g)
    for j, o_ in enumerate(pat): dn('qin', b0 + o_, 0.35, [55, 59, 62, 59, 57, 55][(j + bar) % 6], 64 * g)
chord('strS', CK['t'] - 0.4, CK['l3'] - CK['t'] + 0.6, [43, 50], 40)
note('xun', CK['l3'], CK['out'] - CK['l3'], 55, 72); note('qinh', CK['l3'] + 0.1, 1.6, 67, 70)
note('qin', CK['l4'], 1.6, 43, 80); tune('xiao', CK['l4'] + 0.4, TH, v=66)
# ═══ the useless tree: xun and low strings
chord('strS', TR['t'], TR['out'] - TR['t'], [31, 43, 50], 48); note('cb', TR['t'], TR['out'] - TR['t'], 31, 56)
note('xun', TR['l1'], 2.0, 50, 66); note('xun', TR['l2'], 2.0, 52, 66); note('xun', TR['l3'], 2.6, 55, 70)
for s, p in ((TR['t'] + 0.2, 31), (TR['l2'], 36), (TR['l3'], 43)): note('qin', s, 2.0, p, 78)
# ═══ taiji: the theme and its mirror at once
tune('xiao', TJ['l1'], TH, v=60); tune('qin', TJ['l1'], MIRROR, tr=-12, v=64)
tune('xiao', TJ['l2'], TH, v=72, tr=2); tune('qin', TJ['l2'], MIRROR, tr=-10, v=76)
tune('xiao', TJ['l3'], TH, v=74); tune('qin', TJ['l3'], MIRROR, tr=-12, v=78)
note('xun', TJ['t'] - 0.6, TJ['out'] - TJ['t'] + 0.6, 43, 56)
# ═══ the butterfly: light flute figures, qin harmonics
for r in range(4):
    s = FL['t'] + 0.3 + r * 1.3
    for i, p in enumerate([79, 81, 83, 81, 79, 76]): note('flute', s + i * 0.09, 0.14, p - 12, 54)
for i, s in enumerate((FL['l1'], FL['l1'] + 1.2, FL['l2'], FL['l2'] + 1.3)): note('qinh', s, 1.2, [62, 64, 67, 69][i], 64)
chord('strS', FL['t'], FL['out'] - FL['t'], [55, 62, 67], 38)
# ═══ busy: a ticking that crowds and crowds; at the wash, silence; then air
s = BS['t'] + 0.2; k = 0
while s < BS['clear']:
    note('clap', s, 0.06, 72, 52 + min(28, k)); s += max(0.07, 0.5 * 0.93 ** k); k += 1
for i in range(int((BS['clear'] - BS['fill']) / 0.25)):
    if rng.random() < 0.25 + 0.6 * i / ((BS['clear'] - BS['fill']) / 0.25): note('qin', BS['fill'] + i * 0.25, 0.3, int(rng.choice(PENTA[5:])), 50)
chord('strS', BS['fill'], BS['clear'] - BS['fill'] - 0.05, [43, 50, 56, 61], 40)
note('qinh', BS['clear'] + 0.6, 1.8, 67, 64); note('xiao', BS['l3'] + 0.3, 1.6, 74, 56)
# ═══ the ending: the theme whole on 箫 and qin over a soft bed; a harmonic; wind
chord('strS', EN['t'], EN['out'] - EN['t'] - 0.6, [31, 43, 50, 55, 59], 52); note('cb', EN['t'], EN['out'] - EN['t'] - 0.6, 31, 54)
tune('xiao', EN['l1'], TH_FULL, v=78); tune('qin', EN['l1'], TH_FULL, tr=-12, v=74)
note('qin', EN['seal'], 2.4, 43, 84); note('qinh', EN['title'], 2.6, 67, 76); note('xun', EN['title'], 3.6, 55, 62)

# a held note and a new one on the same pitch: end the old one first
for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0_, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0_ - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0_ - a[0] - 0.012), a[2], a[3])
        last[p] = i
music, stems = sc.render(PARTS, kick_part=None)
# 留白: real silence in the music for a breath, with a soft fade either side
def hush(a, b, f=0.25):
    g = np.ones(N); i0, i1 = int(a * SR), int(b * SR); fl = int(f * SR)
    g[i0 - fl:i0] = np.cos(np.linspace(0, np.pi / 2, fl)) ** 2; g[i0:i1] = 0; g[i1:i1 + fl] = np.sin(np.linspace(0, np.pi / 2, fl)) ** 2
    return g
music *= (hush(LB['hush'], LB['hush'] + 1.1) * hush(BS['clear'] + 0.05, BS['clear'] + 0.55, 0.06))[:, None]

# ═══ sound design: water, wind, leaves, the knife, ink
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_brush(dur=1.0, seed=1):                    # a brush dragged across paper
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 500, 3000), 3200) * np.sin(np.pi * t / dur) ** 0.8 * (1 - 0.6 * t / dur))
def s_wind(dur=3.0, seed=3):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.stack([lp(bp(noise(n, seed + c), 200, 1200), 1300) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t + c)) * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 1.0) for c in range(2)], axis=1)
def s_leaves(dur=2.5, seed=5):
    n = int(dur * SR); t = np.arange(n) / SR; g = lp((np.random.default_rng(seed).random(n) < 0.004) * 1.0, 80) * 40
    return st(lp(bp(noise(n, seed), 1200, 3500), 3600) * (0.2 + g) * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.7))
def s_pour(dur=1.4, seed=7):                     # tea poured into a bowl
    n = int(dur * SR); t = np.arange(n) / SR; f = 500 + 500 * t / dur
    x = bp(noise(n, seed), 300, 2400) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR)); return st(lp(x, 2600) * np.sin(np.pi * t / dur) ** 0.6)
def s_knife(seed=9):                             # the blade gliding through a gap: a soft hiss
    n = int(0.35 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 1500, 4000), 4200) * np.sin(np.pi * t / 0.35) ** 2)
def s_ink(dur=1.0, seed=11):                     # ink washing away in water
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 150, 900), 1000) * np.sin(np.pi * t / dur))

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
put(HK['circle'], s_brush(1.1, 1), -27, 'brush on paper (synth)', 'frame 1: the circle is drawn')
put(HK['bowl'] + 0.3, s_pour(1.3, 7), -30, 'tea poured (synth)', 'the bowl fills')
put(HK['room'], s_wind(2.2, 3), -32, 'air through the gate (synth)', 'the moon gate')
put(LB['t'], s_wind(LB['out'] - LB['t'], 13), -30, 'river wind (synth)', 'Ma Yuan\'s cold river')
put(TR['t'], s_leaves(TR['out'] - TR['t'], 5), -31, 'leaves (synth)', 'the great tree')
for i, s in enumerate(np.arange(CK['knife'], CK['l3'], 2.0)): put(s + 0.55, s_knife(20 + i), -29, 'blade through a gap (synth)', 'the knife finds the gaps' if i == 0 else '')
put(TJ['t'] - 0.2, s_brush(1.0, 15), -30, 'brush on paper (synth)', 'the circle again')
put(BS['clear'], s_ink(1.2, 11), -26, 'ink washing away (synth)', 'the squares wash clean')
put(EN['t'], s_wind(EN['out'] - EN['t'], 17), -31, 'river wind (synth)', 'back on the cold river')
put(EN['moon'], s_brush(1.3, 19), -30, 'brush on paper (synth)', 'the moon is drawn')

SFX = lp(SFX, 5000)
ir = sc.ir
sfx_mix = SFX + 0.35 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 70, 'low', fs=SR, output='sos'), x, axis=0)
x = lp(x, 9000)                                   # dark and soft: no presence boost
fade = np.ones(N); f0 = int((DUR - 1.4) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m2 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m2)) ** 2; fr = np.fft.rfftfreq(len(m2), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'dao_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'dao_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 道 · 空 — cue sheet (generated by music/dao.py)\n\nEvery time comes from src/dao/dao.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s (the music is silent on purpose at the 留白).\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'dao_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))

"""NIHIL · 虚无 (60 s) — score and sound design, synced to src/nihil/nihil.json.
Run: python3 music/nihil.py → public/nihil_score.wav, out/nihil_sfx_only.wav, out/nihil_cues.md

The music falls, then learns to rise. A three-note motif falls through C minor (G → E♭ → C, and a B left hanging);
「上帝死了」 lands on an organ; when the thread snaps the floor goes out of the music and a Shepard–Risset glissando falls
for six seconds without ever arriving (「我们不是一直在坠落吗？」). The hammer is a hollow knock. The abyss is a low
cluster and a heartbeat. The eternal return is one bar of piano that repeats exactly, like a stuck record, gathering
layers — until 「我从没听过比这更神圣的话」 turns it to A♭ and E♭ major. The dancing star is a C-major tutti in triple
time; the last line inverts the motif upward (C E G C) and the film ends in C major.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'nihil', 'nihil.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); B = 0.5
HK, LN, GD, TW, AB, LP, AM, EN = (J[k] for k in ('hook', 'line', 'god', 'two', 'abyss', 'loop', 'amor', 'end'))

PARTS = {
    'piano': SF2('piano', level=-15, verb=0.45), 'cello': SF2('ms', 42, level=-18, verb=0.5), 'strS': SF2('ms', 49, level=-18, verb=0.6),
    'trem': SF2('ms', 44, level=-21, verb=0.5), 'cb': SF2('ms', 43, level=-19, verb=0.45), 'choir': SF2('ms', 52, level=-19, verb=0.7),
    'organ': SF2('ms', 19, level=-19, verb=0.7), 'horn': SF2('ms', 60, level=-19, verb=0.55, cap=112), 'tbn': SF2('ms', 57, level=-21, verb=0.45),
    'timp': SF2('ms', 47, level=-18, verb=0.5), 'harp': SF2('ms', 46, level=-19, verb=0.55), 'pizz': SF2('ms', 45, level=-20, verb=0.4),
    'sub': Synth('sub', level=-20, verb=0.0, duck=0.2, cap=100), 'pad': Synth('pad', level=-24, verb=0.6, duck=0.1, cutoff=1300, attack=0.8),
    'bed': Synth('pad', level=-28, verb=0.6, duck=0.05, cutoff=900, attack=1.0),
    'kit': Drums({}, fallback_kit=0, level=-22, verb=0.35),
}
sc = Score(DUR, SR, seed=1882)
rng = np.random.default_rng(1882)
def note(part, s, d, p, v=80, h=0.003):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.003, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
FALL = [67, 63, 60, 59]           # G E♭ C … B: the motif falls and is left hanging
RISE = [60, 64, 67, 72]           # C E G C: the same shape, turned upward, in major
CH = {'Cm': (36, [60, 63, 67, 72]), 'Cm9': (36, [62, 63, 67, 70]), 'Ab': (32, [60, 63, 68, 72]), 'Eb': (39, [58, 63, 67, 70]), 'Fm': (41, [60, 65, 68, 72]),
      'G7': (43, [59, 62, 65, 67]), 'C': (36, [60, 64, 67, 72]), 'Cadd9': (36, [62, 64, 67, 72]), 'F': (41, [60, 65, 69, 72]), 'G': (43, [59, 62, 67, 71]), 'Am': (45, [57, 60, 64, 69])}

# ═══ the opening: one lonely note; as the word blows away the motif falls; a drone; the title
note('piano', HK['word'], 1.2, 79, 70); note('piano', HK['word'], 1.2, 67, 54)
for i, p in enumerate([79, 75, 72, 71, 67, 63, 60, 59]): note('piano', HK['dust'] + i * 0.16, 0.5, p, 66 - i * 3)
note('cb', HK['q1'], 2.0, 36, 56); chord('bed', HK['q1'], 2.0, [48, 55, 63], 44, h=0)
note('piano', HK['q2'], 1.0, 48, 60); note('piano', HK['q2'] + 0.5, 0.5, 47, 50)
note('timp', HK['title'], 1.0, 36, 108); note('sub', HK['title'], 1.6, 24, 100); chord('strS', HK['title'], 1.6, [36, 48, 55, 63], 92, h=0)
chord('choir', HK['title'], 1.6, [48, 55, 63], 66); chord('horn', HK['title'], 1.0, [48, 55, 60], 76)

# ═══ the word's history: a slow walk — one deep note per date, strings underneath, a cello for Nietzsche
for i, (s, p) in enumerate(zip([LN['y1799'], LN['y1862'], LN['y1880'], LN['y1882']], [48, 51, 55, 47])):
    note('piano', s, 0.9, p, 76); note('piano', s, 0.9, p + 12, 56); note('pizz', s, 0.3, p - 12, 70)
chord('strS', LN['t'], 4.0, [36, 48, 55], 56, h=0); chord('pad', LN['t'], 4.0, CH['Cm9'][1], 40, h=0)
chord('trem', LN['y1880'] + 0.3, 0.75, [43, 50, 55], 60)                                              # a tremolo leaning into 1882
note('cello', LN['y1882'], 1.0, 55, 82); note('cello', LN['y1882'] + 0.5, 0.5, 51, 76)

# ═══ God is dead: the hanging values on harp harmonics; the organ; the snap — and then the floor is gone
for k in range(8): note('harp', GD['hang'] + k * 0.125, 0.8, [72, 75, 79, 84, 79, 75, 72, 67][k], 56)
chord('organ', GD['dead'], 1.0, [36, 48, 55, 60, 63, 67], 88); note('timp', GD['dead'], 0.8, 36, 100); note('sub', GD['dead'], 1.0, 24, 92)
chord('choir', GD['dead'], 1.0, [55, 60, 63], 70)
# after the snap only a high, thin string line and a low drone remain; the falling is the Shepard glissando (sound design)
chord('trem', GD['snap'] + 0.3, GD['out'] - GD['snap'] - 0.3, [72, 79], 46); note('cb', GD['snap'] + 0.3, GD['out'] - GD['snap'] - 0.3, 24 + 12, 46)
for i, p in enumerate(FALL): note('piano', GD['q'] + i * 0.5, 0.45, p - 12, 62)
for i, p in enumerate(FALL): note('piano', GD['q'] + 2.0 + i * 0.5, 0.45, p - 24, 58)
chord('strS', GD['flip'], 1.5, [48, 55, 59, 65], 60, h=0)                      # 「还有上和下吗？」: an unresolved G7 (no root)

# ═══ two nihilisms: the passive side sinks (a pad that loses its voice); the active side knocks, breaks, rebuilds
chord('pad', TW['passive'], 3.0, CH['Cm'][1], 50, h=0)
for i, p in enumerate([67, 66, 65, 64, 63]): note('cello', TW['passive'] + i * 0.4, 0.45, p - 12, 64 - i * 4)
for h in TW['tap']: note('kit', h, 0.3, 45, 90); note('pizz', h, 0.3, 43, 70)
note('timp', TW['smash'], 0.8, 36, 112); note('sub', TW['smash'], 0.8, 24, 100); chord('strS', TW['smash'], 0.9, [36, 48, 55, 63, 67], 96, h=0)
chord('horn', TW['smash'], 0.6, [48, 55, 60], 92); chord('tbn', TW['smash'], 0.6, [36, 43], 88)
for i, p in enumerate(RISE[:3]): note('horn', TW['rebuild'] + i * 0.35, 0.4, p - 12, 82)                    # build: C E G …
chord('strS', TW['rebuild'] + 1.05, 0.4, [48, 55, 60, 64], 66, h=0)
chord('strS', TW['smash'] + 0.8, 2.6, [36, 43, 48], 60, h=0); note('cb', TW['smash'] + 0.8, 2.6, 36, 58)          # the ground after the smash

# ═══ the abyss: a low cluster and a heartbeat; the eye; a lone cello for the monk by the sea
chord('cb', AB['ring'], 4.0, [24 + 12, 25 + 12], 60); chord('choir', AB['ring'], 4.0, [48, 49, 51], 46)
chord('piano', AB['eye'], 1.2, [36, 37, 39, 42], 74)                                                        # a dark cluster as the eye opens
note('sub', AB['eye'], 1.5, 24, 92)
for i, p in enumerate([67, 65, 63, 62, 60]): note('cello', AB['monk'] + i * 0.4, 0.45, p - 12, 72)
chord('strS', AB['monk'], 3.3, [36, 48, 55, 63], 54, h=0)
chord('choir', LP['demon'], 1.0, [48, 55], 54)                                                              # the demon's voice

# ═══ the eternal return: one bar of piano, five times, exactly the same — gathering strings and choir
BAR = [(0, 48), (0.25, 55), (0.5, 63), (0.75, 55), (1.0, 67), (1.25, 63), (1.5, 55), (1.75, 59)]
for rep in range(5):
    s0 = LP['line'] + rep * 1.8
    if s0 >= LP['divine']: break
    for d, p in BAR: note('piano', s0 + d * 0.9, 0.22, p, 64 + rep * 4, h=0)
    if rep >= 1: chord('strS', s0, 1.8, [48, 55, 63], 46 + rep * 6, h=0)
    if rep >= 2: chord('choir', s0, 1.8, [55, 60, 63], 44 + rep * 6)
    if rep >= 3: note('timp', s0, 0.3, 36, 70 + rep * 6)
chord('tbn', LP['curse'], 1.4, [36, 37, 42], 84); chord('trem', LP['curse'], 1.4, [48, 49, 54], 66)          # the curse: a grinding cluster
# 「我从没听过比这更神圣的话」: the harmony opens to A♭ and E♭
chord('strS', LP['divine'], 1.0, [44, 56, 60, 63, 68], 82, h=0); chord('choir', LP['divine'], 1.0, [60, 63, 68], 70)
chord('strS', LP['divine'] + 1.0, 1.0, [39, 51, 58, 63, 67], 84, h=0); chord('choir', LP['divine'] + 1.0, 1.0, [58, 63, 67], 72)
chord('harp', LP['divine'], 1.6, [56, 60, 63, 68, 72, 75], 62, roll=0.06)

# ═══ amor fati: the point; the love; the chaos whirling; the dancing star in triple time; become who you are
chord('pad', AM['point'], 3.0, CH['Ab'][1], 48, h=0); note('piano', AM['latin'], 1.2, 72, 70); note('piano', AM['latin'] + 0.4, 1.0, 75, 64); note('piano', AM['latin'] + 0.8, 1.2, 80, 66)
chord('strS', AM['love'], 1.5, [44, 56, 60, 63], 64, h=0)
chord('trem', AM['chaos'], 2.0, [55, 56, 60, 61, 63], 62); note('timp', AM['chaos'] + 1.5, 0.5, 43, 70)
for k in range(8): note('timp', AM['star'] - 0.5 + k * 0.0625, 0.08, 43, 50 + k * 7)
chord('strS', AM['star'], 1.0, [36, 48, 55, 60, 64, 67], 100, h=0); chord('choir', AM['star'], 1.5, [60, 64, 67, 72], 80); note('timp', AM['star'], 0.8, 36, 110)
chord('horn', AM['star'], 0.8, [48, 55, 60, 64], 92); note('sub', AM['star'], 1.0, 24, 96)
# the dance: a waltz (one-two-three) across two bars
for k in range(6):
    s = AM['star'] + 0.6 + k * 0.33; nm = ['C', 'C', 'C', 'G', 'G', 'G'][k]; root, vo = CH[nm]
    if k % 3 == 0: note('cb', s, 0.3, root, 82); note('timp', s, 0.2, root if root < 48 else root - 12, 70)
    else: chord('pizz', s, 0.2, vo[:3], 66)
for i, p in enumerate([72, 76, 79, 84, 79, 76]): note('harp', AM['star'] + 0.6 + i * 0.33, 0.4, p, 70)
for i, p in enumerate(RISE): note('horn', AM['become'] + i * 0.3, 0.6 if i < 3 else 1.6, p - 12, 92)        # become who you are: C E G C
chord('strS', AM['become'], 2.4, [36, 48, 55, 60, 64], 84, h=0); chord('choir', AM['become'] + 0.9, 1.5, [60, 64, 67, 72], 74)

# ═══ the ending: the gold dust gathers; the motif rises in major; the dark; one heartbeat; the canvas
for k in range(10): note('harp', EN['gather'] + k * 0.11, 0.6, [48, 52, 55, 60, 64, 67, 72, 76, 79, 84][k], 60 + k * 2)
chord('piano', EN['word'], 1.5, [48, 60, 64, 67], 72); chord('strS', EN['word'], 3.5, [48, 55, 60, 64], 60, h=0)
for i, p in enumerate(RISE): note('piano', EN['l1'] + 0.5 + i * 0.5, 0.45, p + 12, 70)
chord('strS', EN['l2'], 2.0, [41, 53, 57, 60, 65], 66, h=0); chord('choir', EN['l2'], 2.0, [57, 60, 65], 60)    # F …
chord('strS', EN['l2'] + 1.0, 1.0, [43, 55, 59, 62, 67], 64, h=0)                                              # G …
note('cb', EN['dark'], 3.0, 36, 50); chord('bed', EN['dark'], 2.0, CH['C'][1], 40, h=0)
note('piano', EN['c1'], 0.8, 67, 66); note('piano', EN['c1'] + 0.5, 0.8, 64, 62)
chord('strS', EN['c2'], 3.0, [36, 48, 55, 60, 64, 67], 86, h=0); chord('choir', EN['c2'], 3.0, [60, 64, 67, 72], 70)  # C major: the canvas
chord('piano', EN['c2'], 2.5, [36, 48, 55, 64, 67, 72], 78, roll=0.04); note('timp', EN['c2'], 0.8, 36, 90); note('sub', EN['c2'], 1.5, 24, 84)
chord('horn', EN['c2'] + 0.2, 2.0, [48, 55, 64], 66)
# a quiet bed underneath (dark and low), so the film never drops to digital silence
for s0 in np.arange(5.0, 56.0, 2.0): chord('bed', float(s0), 2.05, [48, 55, 63] if s0 < 40 else [48, 55, 64], 34, h=0)

music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design
def lib(i):
    p = os.path.join(LIB, f'{i}.wav')
    if not os.path.exists(p): fetch_one({'id': i, 'url': f'https://assets.mixkit.co/active_storage/sfx/{i}/{i}.wav'})
    x, r = sf.read(p, always_2d=True)
    if r != SR: x = resample_poly(x, SR, r, axis=0)
    if x.shape[1] == 1: x = np.repeat(x, 2, axis=1)
    return x
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def trim(x, thr=0.02):
    m = np.abs(x).max(1); i = int(np.argmax(m > thr * m.max())); return x[max(0, i - int(0.003 * SR)):]
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x, axis=0)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12, rev=False, lo=300, hi=3000):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(bp(noise(n, seed), lo, hi), 4000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_crack(seed=1):                         # a dry crack and a creak
    n = int(0.35 * SR); t = np.arange(n) / SR
    x = bp(noise(n, seed), 1200, 6000) * env(n, 0.0003, 0.012) + 0.5 * np.sin(2 * np.pi * (180 - 120 * t) * t) * env(n, 0.002, 0.08)
    return st(lp(x, 7000))
def s_dust(dur=1.8, seed=2, pan=0.4):        # sand blown away: dense grains, drifting right
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 400, int(dur * 900)): x[i:i + 300] += r.uniform(-1, 1) * np.exp(-np.arange(300) / 40)
    x = bp(x, 1500, 9000) * np.sin(np.pi * np.arange(n) / n) ** 0.7
    return np.stack([x * np.sqrt(1 - pan), x * np.sqrt(1 + pan) * np.linspace(0.7, 1.3, n)], axis=1)
def s_snap():                                # a string snapping: a bright twang that drops
    n = int(0.5 * SR); t = np.arange(n) / SR; f = 900 * np.exp(-t / 0.05) + 140
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.0005, 0.09) + 0.6 * bp(noise(n, 5), 2000, 8000) * env(n, 0.0002, 0.006))
def s_shepard(dur, down=True, seed=0):       # Shepard–Risset glissando: falls (or rises) forever without arriving
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    rate = (-1 if down else 1) * 0.35                                      # octaves per second
    for k in range(9):
        pos = (k + rate * t) % 9                                            # position in octaves, 0..9
        f = 27.5 * 2 ** pos
        a = np.exp(-((pos - 4.5) ** 2) / (2 * 1.6 ** 2))                    # loudest in the middle register
        x += a * np.sin(2 * np.pi * np.cumsum(f) / SR + k)
    x *= np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.6)
    return st(lp(x, 5000))
def s_knock(f=170, seed=0, dur=0.6):         # a hollow knock: a short hit and a tube-like ring
    n = int(dur * SR); t = np.arange(n) / SR
    body = sum(np.sin(2 * np.pi * f * m * t) * a for m, a in ((1, 1), (2.76, 0.35), (5.4, 0.12))) * env(n, 0.001, 0.12)
    return st(body + 0.5 * bp(noise(n, seed), 500, 3000) * env(n, 0.0005, 0.01))
def s_shatter(seed=9):
    n = int(1.2 * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, int(0.6 * SR), 70): m = int(r.uniform(0.01, 0.05) * SR); x[i:i + m] += bp(noise(m, int(i)), 800, 7000) * np.exp(-np.arange(m) / (m / 4)) * r.uniform(0.3, 1)
    return st(x + 1.2 * s_thump(80, 40, 0.5)[:n, 0] if False else x) + 0.9 * np.pad(s_thump(80, 40, 0.5), ((0, n - int(0.5 * SR)), (0, 0)))
def s_heart():
    return np.concatenate([s_thump(60, 38, 0.2), np.zeros((int(0.14 * SR), 2)), 0.7 * s_thump(60, 38, 0.2)])
def s_sea(dur=2.2, seed=31):                 # surf and wind
    n = int(dur * SR); t = np.arange(n) / SR
    surf = lp(noise(n, seed), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.45 * t - 1.2) ** 2)
    wind = bp(noise(n, seed + 1), 300, 1400) * (0.5 + 0.3 * np.sin(2 * np.pi * 0.8 * t))
    return st((surf + 0.5 * wind) * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.5))
def s_skip(seed=3):                          # a stuck record: the needle clicks back
    n = int(0.06 * SR); return st(bp(noise(n, seed), 600, 5000) * env(n, 0.0003, 0.008) + 0.4 * s_thump(120, 80, 0.06)[:, 0])
def s_growl(dur=1.4, seed=7):
    n = int(dur * SR); t = np.arange(n) / SR
    return st(lp(np.tanh(3 * (np.sin(2 * np.pi * 55 * t) + 0.6 * bp(noise(n, seed), 40, 300))), 900) * np.sin(np.pi * t / dur))
def s_whirl(dur=2.0, seed=11):
    n = int(dur * SR); t = np.arange(n) / SR; x = bp(noise(n, seed), 400, 2500) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t ** 1.4))
    return st(x * (t / dur) ** 1.5)

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why, align='onset', pan=0.0, maxlen=None, rate=1.0):
    if rate != 1.0: x = resample_poly(x, 1000, int(round(1000 * rate)), axis=0)
    x = norm(x)
    if maxlen and len(x) > maxlen * SR: x = x[:int(maxlen * SR)].copy(); f = int(0.06 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    off = int(np.argmax(np.convolve(np.abs(x).max(1), np.ones(480) / 480, 'same'))) if align == 'peak' else 0
    if pan: x = x * np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)])
    i0 = int(t * SR) - off; a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
L = {k: trim(lib(k)) for k in (1489, 2605, 1120, 498, 774)}

put(HK['crack'], s_crack(), -27, 'crack and creak (synth)', 'the word cracks')
put(HK['dust'], s_dust(1.9), -26, 'blown sand (synth)', 'the word blows away')
put(HK['q2'] + 0.4, s_heart(), -30, 'heartbeat (synth)', '你还会起床吗？')
put(HK['title'], L[774], -24, 'impact_space (774)', 'NIHIL'); put(HK['title'], s_swell(0.5, 4, rev=True), -32, 'reverse swell (synth)', '')
for s in (LN['y1799'], LN['y1862'], LN['y1880'], LN['y1882']): put(s, s_knock(900, int(s), 0.15), -34, 'tick (synth)', 'a date on the line' if s == LN['y1799'] else '')
put(GD['dead'] - 0.4, s_swell(0.4, 8), -31, 'air swell (synth)', '上帝死了')
put(GD['snap'], s_snap(), -24, 'string snap (synth)', 'the thread snaps')
put(GD['fall'] + 0.1, s_shepard(GD['out'] - GD['fall'] - 0.2, True), -27, 'Shepard–Risset glissando, falling (synth)', 'falling, in all directions, forever')
put(GD['flip'], L[1489], -29, 'whoosh_air (1489)', 'the world turns upside down', align='peak', rate=0.8)
put(TW['split'], L[2605], -32, 'air_quick (2605)', 'the screen splits', align='peak')
put(TW['passive'], s_swell(2.5, 14, rev=True, lo=100, hi=800), -33, 'sinking air (synth)', 'the passive side deflates')
for i, h in enumerate(TW['tap']): put(h, s_knock(170 + i * 6, i), -24, 'hollow knock (synth)', 'tapping the idol: hollow' if i == 0 else '')
put(TW['smash'], s_shatter(), -23, 'shatter (synth)', 'the idol breaks')
put(AB['ring'], s_swell(1.5, 20, lo=40, hi=250), -27, 'low swell (synth)', 'the abyss opens')
put(AB['eye'] - 0.2, L[498], -27, 'deep_hit (498)', 'the eye opens'); put(AB['eye'] + 0.3, s_heart(), -28, 'heartbeat (synth)', '')
put(AB['monk'] - 0.2, s_sea(2.4), -28, 'surf and wind (synth)', 'the monk by the sea')
put(LP['curl'], L[2605], -31, 'air_quick (2605)', 'the life curls into a ring', align='peak')
for rep in range(1, 5): put(LP['line'] + rep * 1.8, s_skip(rep), -30, 'record skip (synth)', 'again (the needle jumps back)' if rep == 1 else '')
put(LP['curse'], s_growl(1.4), -29, 'growl (synth)', 'the curse')
put(LP['divine'], s_swell(0.8, 33, lo=800, hi=5000), -31, 'bright swell (synth)', 'the most divine words')
put(AM['point'], L[1120], -31, 'pop_soft (1120)', 'the rings collapse to one point')
put(AM['chaos'], s_whirl(2.0), -29, 'whirl (synth)', 'chaos')
put(AM['chaos'] + 0.3, s_shepard(1.7, False, 1), -31, 'Shepard–Risset glissando, rising (synth)', 'the chaos rises')
put(AM['star'], L[774], -24, 'impact_space (774)', 'a dancing star is born')
put(EN['gather'], s_dust(1.2, 40, -0.3)[::-1].copy(), -28, 'sand gathering (reversed, synth)', 'the dust comes back as gold')
for k in range(3): put(EN['dark'] + k * 1.0, s_heart(), -31, 'heartbeat (synth)', 'one point, beating' if k == 0 else '')
put(EN['c2'], s_swell(0.6, 50, lo=500, hi=4000), -31, 'bright swell (synth)', '是画布')

SFX = lp(SFX, 9500) * 10 ** (2 / 20)
ir = sc.ir
sfx_mix = SFX + 0.2 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x + 0.35 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 1.0) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'nihil_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'nihil_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# NIHIL · 虚无 — cue sheet (generated by music/nihil.py)\n\nEvery time comes from src/nihil/nihil.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'nihil_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))
for i in sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()}):
    if harsh(analyse(os.path.join(LIB, f'{i}.wav'))): print(f'sfx {i}: harsh raw file — CHECK')

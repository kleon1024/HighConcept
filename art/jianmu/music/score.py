"""御剑 YUJIAN — score (80 BPM: beat 0.75 s, bar 3 s), written to the beat sheet in ../CONCEPT.md.
D宫 / B羽 pentatonic (D E F# A B): the gods' procession and the flight are centred on D (宫, bright); the break,
the cliff and the storm are centred on B (羽, minor); the finale returns to D with the widest chord.

Uses the shared engine READ-ONLY (shape-of-sound/music/engine.py, sfx.py, mixutil.py); extra voices are registered at
runtime. Sampled voices come from CC0 recordings in ../sounds/fs (see ../CREDITS.md): guzheng plucks, a kayageum low
pluck, a sustained dizi note. Soundfont voices (MuseScore General): shakuhachi as 箫, shamisen as 琵琶 tremolo, koto as
high zither, taiko as 堂鼓/太鼓, timpani, strings, choir. Guqin harmonics, the gong, the drone, the wind bed, the breath
swells and the woody crack are synthesised in numpy.
Run: python3 score.py  →  ../sounds/score.wav (+ stems in ../sounds/stems)
"""
import os, sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, '/home/user/HighConcept/shape-of-sound/music')
import engine
from engine import Score, SF2, Synth
from sfx import Sfx
import mixutil

SR = 48000
DUR = 30.0
B = 0.75                         # one beat
FS = os.path.join(ROOT, 'sounds', 'fs')

# ───────────────────────── sampled & synthesised voices (adapted from art/ascension/music/score.py)
def _load(name, t0=0.0, t1=None):
    x, r = sf.read(os.path.join(FS, name), always_2d=True)
    assert r == SR
    x = x[int(t0 * SR): int(t1 * SR) if t1 else None]
    return x / (np.abs(x).max() + 1e-9)
SRC = {
    'kay': (_load('24551_164315-hq.wav'), 110.0),                  # kayageum A2 (zither pluck, close to guzheng)
    'gz_c3': (_load('847157_18537710-hq.wav', 7.24, 12.5), 130.0),  # guzheng C3 pluck
    'gz_a3': (_load('847157_18537710-hq.wav', 0.0, 7.2), 218.6),    # guzheng A3 pluck
    'dizi': (_load('384961_5093019-hq.wav', 0.0, 8.9), 1178.5),     # dizi D6 sustained
}

def _varispeed(x, rate):
    """Read x with a time-varying playback rate (array per output sample)."""
    pos = np.concatenate([[0.0], np.cumsum(rate[:-1])])
    pos = pos[pos < len(x) - 2]
    out = np.zeros((len(pos), 2))
    for ch in range(2): out[:, ch] = np.interp(pos, np.arange(len(x)), x[:, ch])
    return out

def v_guzheng(f, dur, vel, sr, rng, bend=0.0, bend_at=0.25, ring=1.6):
    """Guzheng pluck from the nearest CC0 source, repitched; optional 按音 bend (semitones) after the attack."""
    key = min(('kay', 'gz_c3', 'gz_a3'), key=lambda k: abs(np.log(f / SRC[k][1])))
    x, f0 = SRC[key]
    n = int((dur + ring) * sr)
    r0 = f / f0
    rate = np.full(n, r0)
    if bend:
        t = np.arange(n) / sr; b = np.clip((t - bend_at) / 0.18, 0, 1); b = b * b * (3 - 2 * b)
        rate = r0 * 2 ** (bend * b / 12)
    y = _varispeed(x, rate)
    y = y[:n]
    m = int(dur * sr)
    if m + int(0.2 * sr) < len(y):                                 # damp after the note's length + ring
        tail = np.exp(-np.arange(len(y) - m) / (ring * sr / 4)); y[m:] *= tail[:, None]
    a = int(0.002 * sr); y[:a] *= np.linspace(0, 1, a)[:, None]
    return y * 0.9

def v_dizi(f, dur, vel, sr, rng, slide=0.0, vib=1.0):
    """Dizi from the sustained CC0 D6; optional 滑音 slide-in (semitones below), delayed vibrato."""
    x, f0 = SRC['dizi']
    n = int((dur + 0.25) * sr); t = np.arange(n) / sr
    semi = np.zeros(n)
    if slide: semi -= slide * np.clip(1 - t / 0.09, 0, 1) ** 2
    semi += vib * 0.16 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    y = _varispeed(x[int(0.35 * sr):], (f / f0) * 2 ** (semi / 12))[:n]
    env = np.ones(len(y)); a = int(0.035 * sr); env[:a] = np.linspace(0, 1, a) ** 1.5
    rel = int(0.22 * sr); k = int(dur * sr)
    if k < len(y): env[k:] = np.linspace(1, 0, len(y) - k) ** 2
    return y * env[:, None] * 0.8

def v_guqin(f, dur, vel, sr, rng, decay=1.8):
    """Guqin 泛音 (harmonic): mellow sine partials with a soft finger transient."""
    n = int((dur + decay * 2.5) * sr); t = np.arange(n) / sr
    s = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 2 * f * t + 0.3) * np.exp(-t / 0.6) + 0.06 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.3)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / decay)
    tr = rng.standard_normal(n) * np.exp(-t / 0.006) * 0.08
    y = s * env + sosfilt(butter(2, 2500, 'low', fs=sr, output='sos'), tr)
    return np.stack([y * 0.95, y], 1) * 0.5

def v_gong(f, dur, vel, sr, rng, bloom=0.25, decay=5.0):
    """Deep gong (tam-tam / 风锣): inharmonic partials that bloom after a soft mallet, low-passed and mellow."""
    n = int((dur + decay * 1.6) * sr); t = np.arange(n) / sr
    ratios = [1.0, 1.52, 2.02, 2.44, 2.98, 3.61, 4.27, 5.13]
    y = np.zeros(n)
    for i, r in enumerate(ratios):
        a = 1.0 / (1 + i * 0.6); dec = decay * (1.0 - 0.07 * i); bl = bloom * (0.3 + 0.25 * i)
        env = (1 - np.exp(-t / max(0.01, bl))) * np.exp(-t / dec)
        y += a * env * np.sin(2 * np.pi * f * r * t * (1 - 0.004 * np.exp(-t / 1.5)) + rng.uniform(0, 6.28))
    strike = sosfilt(butter(2, 300, 'low', fs=sr, output='sos'), rng.standard_normal(n)) * np.exp(-t / 0.05) * 1.2
    y = sosfilt(butter(2, 3200, 'low', fs=sr, output='sos'), y + strike)
    l = y; rr = np.roll(y, int(0.007 * sr))
    return np.stack([l, rr], 1) * 0.45

def v_swell(f, dur, vel, sr, rng, curve=3.0):
    """Breath-in swell: band-passed noise rising to the end of the note, then cut (a reversed-cymbal shape without the fizz)."""
    n = int(dur * sr); t = np.arange(n) / sr
    w = rng.standard_normal((n, 2))
    lo = sosfilt(butter(2, [200, 1800], 'band', fs=sr, output='sos'), w, axis=0)
    hi = sosfilt(butter(2, [1800, 5000], 'band', fs=sr, output='sos'), w, axis=0)
    e = (t / dur) ** curve
    y = lo * e[:, None] + 0.35 * hi * (e ** 1.6)[:, None]
    y[-int(0.012 * sr):] *= np.linspace(1, 0, int(0.012 * sr))[:, None]
    return y * 0.6

def v_wind(f, dur, vel, sr, rng, lo=180, hi=900):
    """Soft wind bed: band-passed noise with slow gusts."""
    n = int(dur * sr); t = np.arange(n) / sr
    w = sosfilt(butter(2, [lo, hi], 'band', fs=sr, output='sos'), rng.standard_normal((n, 2)), axis=0)
    g = 0.6 + 0.4 * np.sin(2 * np.pi * 0.23 * t + 1.0) * np.sin(2 * np.pi * 0.07 * t)
    a = int(0.8 * sr); env = np.ones(n); env[:a] = np.linspace(0, 1, a); env[-a:] = np.linspace(1, 0, a)
    return w * (g * env)[:, None] * 0.8

def v_crack(f, dur, vel, sr, rng):
    """A colossal woody crack: a splintering burst of filtered noise ticks over a deep thump that rumbles off."""
    n = int(3.5 * sr); t = np.arange(n) / sr
    y = np.zeros(n)
    for k in range(40):
        t0 = 0.004 * k + 0.03 * rng.random() * (k / 40) ** 2; i0 = int(t0 * sr)
        m = int(0.03 * sr); burst = rng.standard_normal(m) * np.exp(-np.arange(m) / (0.004 * sr))
        y[i0:i0 + m] += burst * (1 - k / 45)
    y = sosfilt(butter(2, [250, 3200], 'band', fs=sr, output='sos'), y) * 0.8
    thump = np.sin(2 * np.pi * (42 * t + 10 * t * np.exp(-t / 0.3))) * np.exp(-t / 0.7)
    rumble = sosfilt(butter(2, 90, 'low', fs=sr, output='sos'), rng.standard_normal(n)) * np.exp(-t / 1.4) * 3.0
    out = y + thump * 1.1 + rumble
    return np.stack([out, np.roll(out, int(0.006 * sr))], 1) * 0.5

engine.VOICES.update({'guzheng': v_guzheng, 'dizi': v_dizi, 'guqin': v_guqin, 'gong': v_gong, 'swell': v_swell, 'wind': v_wind, 'crack': v_crack})

# ───────────────────────── parts
P = {
    'taiko':   SF2('ms', 116, level=-14.5, pan=0.0, verb=0.25, cap=124, hp=40),
    'tanggu':  SF2('ms', 116, level=-19.0, pan=0.15, verb=0.2, cap=110, hp=70),
    'timp':    SF2('ms', 47, level=-20.0, pan=-0.1, verb=0.3),
    'gong':    Synth('gong', level=-17.5, verb=0.35),
    'guzheng': Synth('guzheng', level=-16.5, pan=-0.2, verb=0.3),
    'koto':    SF2('ms', 107, level=-20.0, pan=0.25, verb=0.3, cap=100),
    'dizi':    Synth('dizi', level=-15.5, pan=0.1, verb=0.38, hp=300),
    'xiao':    SF2('ms', 77, level=-15.5, pan=0.05, verb=0.42),
    'pipa':    SF2('ms', 106, level=-21.0, pan=-0.3, verb=0.25, cap=100),
    'strings': SF2('ms', 49, level=-18.5, verb=0.4),
    'choir':   SF2('ms', 52, level=-18.0, verb=0.45),
    'guqin':   Synth('guqin', level=-19.5, pan=-0.15, verb=0.45),
    'drone':   Synth('pad', level=-24.0, verb=0.3, cutoff=520, attack=1.2, release=2.0, lp=1200),
    'swell':   Synth('swell', level=-23.0, verb=0.2),
    'wind':    Synth('wind', level=-27.0, verb=0.1),
    'crack':   Synth('crack', level=-17.0, verb=0.35),
    'gongS':   Synth('gong', level=-17.5, verb=0.3, decay=1.4),
}
S = Score(DUR, sr=SR, seed=11)
n = S.note
def ch(part, t, d, ps, v): [n(part, t, d, p, v) for p in ps]

B1, Fs1, A1 = 35, 30, 33
D2, E2, Fs2, A2, B2 = 38, 40, 42, 45, 47
D3, E3, Fs3, A3, B3 = 50, 52, 54, 57, 59
D4, E4, Fs4, A4, B4 = 62, 64, 66, 69, 71
D5, E5, Fs5, A5, B5 = 74, 76, 78, 81, 83
D6, E6, Fs6 = 86, 88, 90
PENT = [D3, E3, Fs3, A3, B3, D4, E4, Fs4, A4, B4, D5, E5, Fs5, A5, B5, D6]

# wind bed under everything except the storm (which has its own)
n('wind', 0.0, 6.2, 60, 100); n('wind', 6.0, 6.2, 60, 62); n('wind', 12.0, 9.2, 60, 100); n('wind', 24.0, 6.0, 60, 70)

# ── bar 1 (0–3) S1 hook: low hit on frame 0, drone, a slow guzheng ascent following the tilt-up, guqin harmonics
n('taiko', 0.0, 1.5, D2, 116); n('gong', 0.0, 3.0, B1, 92); n('timp', 0.0, 1.2, D2, 88)
ch('drone', 0.0, 3.2, [D2, A2], 72)
for j, p in enumerate(PENT[:13]): n('guzheng', 0.35 + j * 0.19, 1.0, p, 66 + j * 2)
n('guqin', 0.4, 1.2, A5, 76); n('guqin', 1.9, 1.0, D6, 70)
n('swell', 1.9, 1.1, 60, 96)

# ── bar 2 (3–6) S2 众神: guzheng ostinato, ceremonial dizi line, strings and a soft choir; stops dead before the crack
n('taiko', 3.0, 1.2, D2, 112); n('timp', 3.0, 1.0, D2, 90)
for k in range(8):
    t = 3.0 + k * B / 2
    n('guzheng', t, 0.5, [D3, A3, D4, E4, Fs4, E4, D4, A3][k % 8], 88 if k % 4 == 0 else 74)
for k in range(4): n('tanggu', 3.0 + k * B, 0.35, A2 if k % 2 else D3, 80 + 3 * k)
ch('strings', 3.0, 2.9, [D3, A3, D4, Fs4], 68); ch('choir', 4.5, 1.4, [A3, D4, Fs4], 56)
for t, p, d in [(3.375, A5, 0.6), (4.125, B5, 0.35), (4.5, D6, 0.7), (5.25, E6, 0.35), (5.6, D6, 0.3)]: n('dizi', t, d, p, 94)
n('swell', 5.2, 0.8, 60, 104)

# ── bar 3 (6–9) S3 天梯断了: the crack on the downbeat, then near-silence: low drone, wind, two guqin harmonics
n('crack', 6.0, 3.0, 40, 127); n('taiko', 6.0, 1.5, D2, 126); n('gongS', 6.0, 1.0, B1, 120); n('timp', 6.0, 1.2, B1 + 12, 106)
ch('drone', 6.4, 5.6, [B1, Fs2], 48)
n('guqin', 7.5, 1.2, B5, 50); n('guqin', 8.55, 1.0, Fs5, 44)

# ── bar 4 (9–12) S4 凡人: a lone 箫 in B羽, sparse guzheng, a faint string pad
for t, p, d in [(9.0, B4, 1.3), (10.4, A4, 0.35), (10.75, Fs4, 0.7), (11.5, E4, 0.45), (11.95, Fs4, 0.5)]: n('xiao', t, d, p, 88)
n('guzheng', 9.0, 1.5, B2, 70); n('guzheng', 10.5, 1.2, Fs3, 62)
ch('strings', 9.0, 3.0, [B2, Fs3, D4], 52)

# ── bar 5 (12–15) S5: she steps (pipa tremolo rising, heartbeat drums), she falls, one held breath, the catch at 15.0
for k, root in enumerate([B3, D4, E4, Fs4]):
    t = 12.0 + k * 0.375
    for j in range(6): n('pipa', t + j * 0.0625, 0.0625, root, 66 + 6 * k)
for t in (12.0, 12.75, 13.5): n('tanggu', t, 0.4, B2, 74 + int((t - 12) * 10))
ch('strings', 12.0, 2.2, [B2, Fs3, B3, D4], 62)
n('swell', 13.4, 0.85, 60, 100)
n('guqin', 14.25, 0.9, B5, 58)
n('swell', 14.35, 0.65, 60, 112)

# ── bars 6–7 (15–21) S6 御剑: everything comes in; driving drums, guzheng 16ths, the dizi theme in D宫; choir at 18
n('taiko', 15.0, 1.5, D2, 127); n('gong', 15.0, 3.0, D2, 118); n('timp', 15.0, 1.2, D2, 110)
ch('choir', 15.0, 1.5, [D3, A3, D4, Fs4], 92); ch('strings', 15.0, 3.0, [D2, A2, D3, Fs3, A3], 92)
for j, p in enumerate(PENT): n('guzheng' if p < 76 else 'koto', 15.0 + j * 0.035, 0.9, p, 80 + j)
for k in range(16):
    t = 15.0 + k * B / 2
    n('taiko', t, 0.4, D2 if k % 2 == 0 else A2, 112 if k % 4 == 0 else 86)
    if k % 2 == 1: n('tanggu', t, 0.3, D3, 80)
for k in range(48):
    t = 15.0 + k * B / 4
    n('guzheng', t, 0.25, [D4, A4, Fs4, A4, E4, A4, Fs4, D5][k % 8] + (0 if k < 24 else 2 if k % 8 in (1, 3, 5) else 0), 70 + (8 if k % 4 == 0 else 0))
for t, p, d in [(15.0, D6, 0.7), (15.75, B5, 0.35), (16.125, D6, 0.35), (16.5, E6, 0.7), (17.25, D6, 0.35), (17.625, B5, 0.35)]: n('dizi', t, d, p, 100)
ch('strings', 18.0, 3.0, [D2, A2, D3, A3, D4], 96); ch('choir', 18.0, 3.0, [D3, A3, D4, Fs4], 96)
n('gong', 18.0, 2.0, D2, 96)
for k in range(16):
    t = 18.0 + k * B / 2
    n('taiko', t, 0.4, D2 if k % 2 == 0 else A2, 118 if k % 4 == 0 else 92)
    n('tanggu', t + B / 4, 0.25, A2, 72)
for t, p, d in [(18.0, Fs6, 0.7), (18.75, E6, 0.35), (19.125, D6, 0.35), (19.5, E6, 0.7), (20.25, B5, 0.7)]: n('dizi', t, d, p, 104)
for k in range(12): n('timp', 20.25 + k * B / 16, B / 16, D2 + 12, 60 + 5 * k)

# ── bar 8 (21–24) S7 雷劫: B羽 storm; heavy drums, pipa tremolo, low strings and choir; strikes on the beat
ch('strings', 21.0, 3.0, [B1 + 12, Fs2, B2, D3], 98); ch('choir', 21.0, 3.0, [B2, Fs3, B3], 88)
for j in range(48): n('pipa', 21.0 + j * B / 16, B / 16, [B3, Fs4, D4, Fs4][(j // 8) % 4], 72 + (12 if j % 8 == 0 else 0))
for k in range(8):
    t = 21.0 + k * B / 2
    n('taiko', t, 0.5, B1 + 12 if k % 2 == 0 else Fs2, 122 if k % 2 == 0 else 90)
for t in (21.75, 22.5, 22.95): n('gong', t, 1.2, B1, 90); n('timp', t, 0.6, B1 + 12, 104)
n('taiko', 23.25, 0.8, D2, 127); n('gong', 23.25, 0.75, B1, 112)
for k in range(12): n('taiko', 23.4 + k * 0.05, 0.05, A2, 74 + 4 * k)
for k in range(10): n('timp', 23.25 + k * 0.075, 0.075, D2 + 12, 70 + 5 * k)
n('swell', 23.2, 0.8, 60, 118)

# ── bars 9–10 (24–30) S8 破云 → 题: the widest chord, the dizi soaring, the title at 27.75, then a breath
n('gong', 24.0, 4.0, D2, 127); n('taiko', 24.0, 1.5, D2, 127); n('timp', 24.0, 1.5, D2, 112)
ch('choir', 24.0, 3.6, [D3, A3, D4, Fs4, A4], 104); ch('strings', 24.0, 3.6, [D2, A2, D3, Fs3, A3, D4], 104)
ch('drone', 24.0, 6.0, [D2, A2], 74)
for j, p in enumerate(PENT): n('guzheng' if p < 76 else 'koto', 24.0 + j * 0.04, 1.4, p, 84 + j)
for k in range(8): n('guzheng', 24.75 + k * B / 2, 0.6, [D4, A4, Fs4, A4, D5, A4, Fs4, E4][k], 72)
for t, p, d in [(24.75, A5, 0.7), (25.5, D6, 1.1), (26.625, E6, 0.35), (27.0, Fs6, 0.7), (27.75, D6, 1.8)]: n('dizi', t, d, p, 102)
n('gong', 27.75, 2.2, D2, 96); ch('choir', 27.75, 2.2, [D3, A3, D4, Fs4], 84); ch('strings', 27.75, 2.2, [D2, A2, D3, Fs3, A3], 84)
n('koto', 27.75, 1.2, D5, 70); n('koto', 27.9, 1.2, A5, 64)
n('guqin', 28.6, 1.0, D6, 64)

# dizi slide-ins on the long notes (second dizi part with slide)
P['dizi_slide'] = Synth('dizi', level=-15.5, pan=0.1, verb=0.38, hp=300, slide=2.0)
for ev in [e for e in S.ev['dizi'] if round(e[0], 3) in (4.5, 15.0, 16.5, 18.0, 25.5, 27.75)]:
    S.ev['dizi'].remove(ev); S.ev['dizi_slide'].append(ev)

if __name__ == '__main__':
    os.environ.setdefault('STEM_DIR', os.path.join(ROOT, 'sounds', 'stems'))
    mix, stems = S.render(P, verb_return=0.32)
    # sound effects (shared library, read-only): one soft air family, deep low impacts, soft thunder; ~10 dB under the music
    fx = Sfx(DUR, SR)
    fx.play(6.0, '2405', db=-26, align='onset', rate=0.62)          # the break: a giant crack (thunder strike pitched down)
    fx.play(6.1, '2409', db=-31, align='onset')                      # rumble
    fx.play(6.6, '400', db=-34, align='onset', rate=0.8)             # stones and debris falling
    fx.play(15.32, '1471', db=-22, align='peak')                     # she shoots past the lens
    fx.play(18.0, '2632', db=-25, align='peak')                      # cut to the wide shot
    fx.play(21.0, '2413', db=-27, align='onset')                     # storm wind
    fx.play(21.75, '1283', db=-26, align='onset'); fx.play(22.5, '1283', db=-27, align='onset', rate=0.9)
    fx.play(23.25, '2405', db=-25, align='onset', rate=0.85)         # the strike on her
    fx.play(24.0, '2604', db=-24, align='peak')                      # bursting through the cloud top
    sfxbus = fx.mix(S.ir, verb=0.18, lp=7000)
    full = mix + sfxbus
    k = int(0.35 * SR); full[-k:] *= np.linspace(1, 0.0, k)[:, None] ** 0.6
    out, lufs, peak = mixutil.master(full, SR, lufs=-16.0)
    os.makedirs(os.path.join(ROOT, 'sounds'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'sounds', 'score.wav'), out.astype(np.float32), SR)
    med, mx, jumps = mixutil.jumps(out, SR)
    print('LUFS %.2f  peak %.2f dBFS  median %.1f  max %.1f' % (lufs, peak, med, mx)); print('jumps', jumps)
    for nme, x in stems.items(): print('%-10s active %.1f dB' % (nme, Score._active_db(x, SR)))
    print('sfx log', fx.log)

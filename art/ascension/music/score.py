"""飞升 ASCENSION — score (80 BPM, D宫 / B羽 pentatonic), locked to ../timing.json.

Uses the shared engine READ-ONLY: extra voices are registered at runtime in engine.VOICES (the module file is untouched).
Sampled voices come from CC0 recordings in ../sounds/fs (see ../CREDITS.md): guzheng (two plucks), kayageum (low
zither pluck), dizi (sustained D6). Soundfont voices come from MuseScore General: shakuhachi (xiao), fiddle (erhu),
shamisen (pipa tremolo), koto (high zither), taiko, timpani, strings, choir. Guqin harmonics, the deep gong, the drone
and the breath swells are synthesised in numpy.
Run: python3 score.py  →  ../sounds/score.wav (+ stems in ../sounds/stems)
"""
import os, sys, json
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, '/home/user/HighConcept/shape-of-sound/music')
import engine
from engine import Score, SF2, Synth
from sfx import Sfx
import mixutil

SR = 48000
T = json.load(open(os.path.join(ROOT, 'timing.json')))
DUR = T['duration'] + 0.0
B = T['beat']                     # 0.75 s
FS = os.path.join(ROOT, 'sounds', 'fs')

# ───────────────────────── sampled & synthesised voices
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

engine.VOICES.update({'guzheng': v_guzheng, 'dizi': v_dizi, 'guqin': v_guqin, 'gong': v_gong, 'swell': v_swell})

# ───────────────────────── parts
P = {
    'taiko':   SF2('ms', 116, level=-14.0, pan=0.0, verb=0.25, cap=124, hp=40),
    'tanggu':  SF2('ms', 116, level=-19.0, pan=0.15, verb=0.2, cap=110, hp=70),
    'timp':    SF2('ms', 47, level=-20.0, pan=-0.1, verb=0.3),
    'gong':    Synth('gong', level=-17.0, verb=0.35),
    'guzheng': Synth('guzheng', level=-16.5, pan=-0.2, verb=0.3),
    'koto':    SF2('ms', 107, level=-19.0, pan=0.25, verb=0.3, cap=100),
    'dizi':    Synth('dizi', level=-15.5, pan=0.1, verb=0.38, hp=300),
    'xiao':    SF2('ms', 77, level=-16.5, pan=0.05, verb=0.42),
    'erhu':    SF2('ms', 110, level=-17.5, pan=0.15, verb=0.35, cap=105),
    'pipa':    SF2('ms', 106, level=-21.0, pan=-0.3, verb=0.25, cap=100),
    'strings': SF2('ms', 49, level=-18.5, verb=0.4),
    'choir':   SF2('ms', 52, level=-17.5, verb=0.45),
    'guqin':   Synth('guqin', level=-20.0, pan=-0.15, verb=0.45),
    'drone':   Synth('pad', level=-24.0, verb=0.3, cutoff=520, attack=1.2, release=2.0, lp=1200),
    'swell':   Synth('swell', level=-22.0, verb=0.2),
}
S = Score(DUR, sr=SR, seed=7)
n = S.note
def ch(part, t, d, ps, v): [n(part, t, d, p, v) for p in ps]

# pitches (D宫 / B羽 pentatonic)
D2, E2, Fs2, A2, B2 = 38, 40, 42, 45, 47
D3, E3, Fs3, A3, B3 = 50, 52, 54, 57, 59
D4, E4, Fs4, A4, B4 = 62, 64, 66, 69, 71
D5, E5, Fs5, A5, B5 = 74, 76, 78, 81, 83
D6, E6, Fs6 = 86, 88, 90
B1, Fs1 = 35, 30

# ── bar 1 (0–3) S1 hook: low hit on frame 1, drone, guqin harmonics, breath-in swell to the cut
n('taiko', 0.0, 1.5, D2, 112); n('gong', 0.0, 3.0, B1, 90); n('timp', 0.0, 1.2, B1, 90)
ch('drone', 0.0, 3.0, [B1, Fs2], 70)
n('guqin', 0.35, 1.0, B5, 80); n('guqin', 1.5, 1.0, Fs5, 70); n('guqin', 2.25, 0.7, D6, 64)
n('swell', 0.6, 2.4, 60, 100)

# ── bars 2–3 (3–9) S2/S3: guzheng ostinato, dizi theme, strings; tanggu on every lit step
for k in range(16):
    t = 3.0 + k * B / 2
    pat = [D3, A3, D4, E4, Fs4, E4, D4, A3] if t < 6.0 else [B2, Fs3, B3, D4, E4, D4, B3, Fs3]
    n('guzheng', t, 0.6, pat[k % 8], 92 if k % 4 == 0 else 78)
n('taiko', 3.0, 1.5, D2, 120); n('timp', 3.0, 1.0, D2, 96); n('taiko', 4.5, 0.8, A2, 84)
ch('strings', 3.0, 3.0, [D3, A3, D4], 70); ch('strings', 6.0, 3.0, [B2, Fs3, D4], 76)
ch('drone', 3.0, 6.0, [D2, A2], 60)
for t, p, d, sl in [(3.75, A5, 0.7, 0), (4.5, B5, 0.35, 0), (4.875, D6, 1.05, 2), (6.0, E6, 0.7, 0), (6.75, D6, 0.35, 0), (7.125, B5, 0.35, 0), (7.5, A5, 1.2, 2)]:
    S.note('dizi', t, d, p, 95)
for k in range(8):                                          # one drum per lit step
    n('tanggu', 3.0 + k * B, 0.4, A2 if k % 2 else D3, 88 + 3 * k)
n('swell', 8.25, 0.75, 60, 105)

# ── bar 4 (9–12) S4: a taiko pass per beat (crescendo), pipa tremolo climbing, guzheng 16th runs
for k, (t, root) in enumerate(zip([9.0, 9.75, 10.5, 11.25], [B3, D4, E4, Fs4])):
    n('taiko', t, 0.9, D2, 104 + 7 * k); n('timp', t, 0.6, D2 if k % 2 == 0 else A2, 86 + 6 * k)
    for j in range(8): n('pipa', t + j * B / 8, B / 8, root + (12 if j % 2 else 0) * 0, 70 + 4 * k + (8 if j == 0 else 0))
    run = [D3, E3, Fs3, A3, B3, D4, E4, Fs4, A4, B4][k:k + 6]
    for j, p in enumerate(run): n('guzheng', t + j * B / 6, 0.3, p, 72 + 4 * j)
ch('strings', 9.0, 2.6, [D3, A3, E4], 82); ch('choir', 9.75, 1.9, [A3, D4], 58)
n('koto', 11.25, 0.5, A5, 80); n('koto', 11.5, 0.5, D6, 70)

# ── bar 5 (12–15) S5: breathing space — xiao solo over a D pad, sparse guzheng
ch('strings', 12.0, 3.0, [D3, Fs3, A3, D4], 62); ch('drone', 12.0, 3.0, [D2], 58)
for t, p, d in [(12.0, D5, 1.4), (13.5, E5, 0.35), (13.875, Fs5, 1.0), (14.625, A5, 0.375)]: n('xiao', t, d, p, 92)
for t, p in [(12.0, D3), (12.75, A3), (13.5, Fs4), (14.25, A4)]: n('guzheng', t, 1.2, p, 74)

# ── bar 6 (15–18) S6: guqin harmonics, erhu enters, strings swell into the match cut
for t, p in [(15.0, A5), (15.75, D6), (16.5, Fs5)]: n('guqin', t, 0.9, p, 80)
for t, p, d in [(16.5, B4, 0.7), (17.25, A4, 0.35), (17.625, B4, 0.375)]: n('erhu', t, d, p, 92)
for k in range(4): ch('strings', 15.0 + k * B, B, [B2, Fs3, B3, D4], 60 + 8 * k)
for k in range(8): n('timp', 17.25 + k * B / 8, B / 8, B1 + 12, 50 + 6 * k)
n('swell', 17.1, 0.9, 60, 105)

# ── bar 7 (18–21) S7 劫: full drums, pipa tremolo, erhu high line, choir low, guzheng gliss into the eye
for k in range(8):
    t = 18.0 + k * B / 2
    n('taiko', t, 0.5, D2 if k % 2 == 0 else A2, 122 if k % 2 == 0 else 84)
    if k % 2 == 0: n('timp', t, 0.5, B1 + 12, 96)
for j in range(32): n('pipa', 18.0 + j * B / 8, B / 8, [B3, Fs4][j // 8 % 2], 74 + (10 if j % 8 == 0 else 0))
for t, p, d in [(18.0, Fs5, 0.7), (18.75, E5, 0.35), (19.125, D5, 0.35), (19.5, E5, 0.7), (20.25, A5, 0.7)]: n('erhu', t, d, p, 104)
ch('strings', 18.0, 3.0, [B2, D3, Fs3, B3], 92); ch('choir', 18.0, 3.0, [B2, Fs3], 70)
for j, p in enumerate([B2, D3, E3, Fs3, A3, B3, D4, E4, Fs4, A4, B4, D5]): n('guzheng', 20.25 + j * 0.05, 0.5, p, 80 + j)
for j in range(12): n('taiko', 20.25 + j * B / 16, B / 16, A2, 70 + 4 * j)
n('swell', 20.2, 0.8, 60, 110)

# ── bar 8 (21–24) S8 天井: choir + strings in D, soaring dizi, upward guzheng sweeps, timpani roll
ch('choir', 21.0, 3.0, [D3, A3, D4, Fs4], 92); ch('strings', 21.0, 3.0, [D2, A2, D3, Fs3, A3], 90)
n('taiko', 21.0, 1.2, D2, 124); n('gong', 21.0, 2.0, D2, 70); n('taiko', 22.5, 0.8, A2, 98)
for t, p, d, sl in [(21.0, D6, 1.4, 2), (22.5, E6, 0.7, 0), (23.25, Fs6, 0.75, 1)]: S.note('dizi', t, d, p, 100)
for k in range(4):
    for j, p in enumerate([D4, E4, Fs4, A4, B4, D5]): n('guzheng', 21.0 + k * B + j * B / 6, 0.3, p + (0 if k < 2 else 2 if p in (D4, A4) else 0), 70 + 3 * j)
for k in range(12): n('timp', 23.25 + k * B / 16, B / 16, D2 + 12, 60 + 5 * k)

# ── bar 9 (24–27) S9 光核: hit, swell to the white-out at 25.0, a beat of near silence, one harmonic, breath in
n('taiko', 24.0, 1.0, D2, 120); n('timp', 24.0, 1.0, D2, 100)
for k in range(4): ch('choir', 24.0 + k * 0.25, 0.25, [D4, Fs4, A4], 80 + 10 * k); ch('strings', 24.0 + k * 0.25, 0.25, [D3, A3, D4, Fs4], 84 + 10 * k)
n('swell', 24.1, 0.9, 60, 115)
n('guqin', 25.5, 1.2, D6, 72); ch('choir', 25.2, 1.8, [D4, A4], 52); ch('drone', 25.0, 2.0, [D2, A2], 50)
n('swell', 25.7, 1.3, 60, 118)

# ── bar 10 (27–30) 飞升: the biggest chord, gong + choir + guzheng gliss, final dizi line, long tail
n('gong', 27.0, 3.0, D2, 120); n('taiko', 27.0, 1.5, D2, 127); n('timp', 27.0, 1.5, D2, 110)
ch('choir', 27.0, 3.0, [D3, A3, D4, Fs4, A4], 100); ch('strings', 27.0, 3.0, [D2, A2, D3, Fs3, A3, D4], 100)
ch('drone', 27.0, 3.0, [D2, A2], 70)
for j, p in enumerate([D3, E3, Fs3, A3, B3, D4, E4, Fs4, A4, B4, D5, E5, Fs5, A5, B5, D6]): n('guzheng' if p < 76 else 'koto', 27.0 + j * 0.03, 1.2, p, 84 + j)
S.note('dizi', 27.75, 0.7, A5, 96); S.note('dizi', 28.5, 1.4, D6, 100)
n('guqin', 29.2, 0.8, A5, 60)

# dizi slides: re-render with slides by replacing events (engine passes only opts per part; emulate with a second dizi part)
# (kept simple: vibrato on every note; the slide-ins are handled by the 'dizi_slide' part below)
P['dizi_slide'] = Synth('dizi', level=-15.5, pan=0.1, verb=0.38, hp=300, slide=2.0)
for ev in [e for e in S.ev['dizi'] if round(e[0], 3) in (4.875, 7.5, 21.0, 23.25, 28.5)]:
    S.ev['dizi'].remove(ev); S.ev['dizi_slide'].append(ev)

if __name__ == '__main__':
    os.environ.setdefault('STEM_DIR', os.path.join(ROOT, 'sounds', 'stems'))
    mix, stems = S.render(P, verb_return=0.32)
    # sound effects (shared library, read-only, soft family: air sweeps only)
    fx = Sfx(DUR, SR)
    fx.play(9.0, '1468', db=-20, align='peak')                   # S3 → S4 into the gate
    for t in (9.75, 10.5, 11.25): fx.play(t, '168', db=-24, align='peak')
    fx.play(12.0, '2632', db=-21, align='peak')                  # petals across the lens
    fx.play(18.0, '1461', db=-21, align='peak')                  # bagua → sky array
    fx.play(21.0, '1468', db=-20, align='peak')                  # into the eye of the vortex
    fx.play(25.0, '790', db=-21, align='peak')                   # into the light core
    sfxbus = fx.mix(S.ir, verb=0.18, lp=9000)
    full = mix + sfxbus
    # gentle tail fade in the last 0.25 s
    k = int(0.25 * SR); full[-k:] *= np.linspace(1, 0.0, k)[:, None] ** 0.5
    out, lufs, peak = mixutil.master(full, SR, lufs=-15.0)
    sf.write(os.path.join(ROOT, 'sounds', 'score.wav'), out.astype(np.float32), SR)
    med, mx, jumps = mixutil.jumps(out, SR)
    print('LUFS %.2f  peak %.2f dBFS  median %.1f  max %.1f' % (lufs, peak, med, mx)); print('jumps', jumps)
    for nme, x in stems.items(): print('%-10s active %.1f dB' % (nme, Score._active_db(x, SR)))
    print('sfx log', fx.log)

"""THE SHAPE OF SOUND — soundtrack. Every demo is placed from src/timeline.json (shared with the picture).
Pure sines for physics (so intervals are exact), FluidSynth + FluidR3 GM for instruments and genre snippets.
Run: python3 music/compose.py  → public/score.wav
"""
import json, os, subprocess
import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, 'src', 'timeline.json')))
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
SR, DUR = 48000, T['duration']
N = int(DUR * SR)
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
rng = np.random.default_rng(5)

# ───────────────────────── MIDI (fixed 120 BPM grid: 1 s = 960 ticks)
TPB = 480
tk = lambda s: int(round(s * 2 * TPB))
ev = []
def msg(s, o, m): ev.append((tk(s), o, m))
def prog(ch, p, s=0): msg(s, 0, mido.Message('program_change', channel=ch, program=p))
def cc(ch, s, c, v): msg(s, 1, mido.Message('control_change', channel=ch, control=c, value=int(max(0, min(127, v)))))
def note(ch, s, d, p, v=90):
    v = int(max(1, min(127, v + rng.integers(-3, 4))))
    msg(s, 2, mido.Message('note_on', channel=ch, note=int(p), velocity=v)); msg(s + max(0.03, d) - 0.003, 0, mido.Message('note_off', channel=ch, note=int(p), velocity=0))
def chord(ch, s, d, ps, v=85):
    for p in ps: note(ch, s, d, p, v)
DR = 9  # GM drums
KICK, SNARE, CLAP, HAT, OHAT, RIDE, CRASH, LTOM, HTOM, CLAVE, WOOD, CONGA_H, CONGA_L, COWBELL, SHAKER = 36, 38, 39, 42, 46, 51, 49, 45, 50, 75, 76, 62, 64, 56, 70
PNO, STR, BASS, PAD, GTR, EP, LEAD, ABASS, HARP, BRASS, CHOIR, ORG = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12
for ch, p in [(PNO, 0), (STR, 48), (BASS, 38), (PAD, 89), (GTR, 30), (EP, 4), (LEAD, 81), (ABASS, 32), (HARP, 46), (BRASS, 61), (CHOIR, 52), (ORG, 16)]:
    prog(ch, p)
for ch in range(16):
    cc(ch, 0, 7, 100); cc(ch, 0, 91, 55)
cc(GTR, 0, 91, 25); cc(DR, 0, 91, 30)

def groove(s0, s1, bpm=120, kick=True, hat=True, snare=False, vel=1.0):
    b = 60 / bpm; t = s0
    i = 0
    while t < s1 - 1e-6:
        if kick and i % 2 == 0: note(DR, t, 0.1, KICK, int(100 * vel))
        if snare and i % 4 == 2: note(DR, t, 0.1, SNARE, int(95 * vel))
        if hat: note(DR, t + b / 2, 0.05, HAT, int(60 * vel))
        t += b / 2 * 1; i += 1

O, C1, C2, C3, C4, C5, C6, F = T['open'], T['c1'], T['c2'], T['c3'], T['c4'], T['c5'], T['c6'], T['finale']
C = 60  # C4

# OPEN: title drop at 4.0
groove(O['kick'], O['title'], kick=True, hat=False, vel=0.7)
note(DR, O['title'], 1.5, CRASH, 110)
chord(PAD, O['title'], 2.0, [C - 12, C - 5, C, C + 4, C + 7], 90)
chord(BRASS, O['title'], 0.4, [C - 12, C, C + 7], 100)
for i, s in enumerate(np.arange(O['title'], C1['start'], 0.25)):
    note(DR, s, 0.08, KICK if i % 4 == 0 else HAT, 100 if i % 4 == 0 else 55)
note(BASS, O['title'], 1.9, C - 24, 110)

# C3: twelve notes — chromatic, then the circle of fifths
for i in range(12):
    note(PNO, C3['chromatic'] + i * C3['chromaticStep'], 0.35, C + i, 95)
chord(PAD, C3['keys'], 2.0, [C - 12, C, C + 7], 55)
fifths = [(i * 7) % 12 for i in range(12)]
for i, n in enumerate(fifths):
    note(PNO, C3['fifths'] + i * C3['fifthStep'], 0.45, C + n, 100)
    note(HARP, C3['fifths'] + i * C3['fifthStep'], 0.6, C + n + 12, 60)
groove(C3['chromatic'], C3['end'], kick=False, hat=True, vel=0.5)

# C4: scale, major vs minor, I–V–vi–IV
for i, n in enumerate([0, 2, 4, 5, 7, 9, 11, 12]):
    note(PNO, C4['scale'] + i * C4['scaleStep'], 0.45, C + n, 100)
chord(PNO, C4['major'], 1.35, [C, C + 4, C + 7], 105); chord(STR, C4['major'], 1.35, [C - 12, C + 4, C + 7], 75)
chord(PNO, C4['minor'], 1.35, [C, C + 3, C + 7], 105); chord(STR, C4['minor'], 1.35, [C - 12, C + 3, C + 7], 75)
progression = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]  # C G Am F
for i, ch_ in enumerate(progression):
    s = C4['prog'] + i * C4['progStep']
    chord(PNO, s, C4['progStep'] - 0.05, [C + n for n in ch_], 100)
    chord(STR, s, C4['progStep'] - 0.05, [C - 12 + ch_[0]] + [C + n for n in ch_[1:]], 70)
    note(BASS, s, C4['progStep'] - 0.05, C - 24 + ch_[0], 105)
groove(C4['prog'], C4['end'], kick=True, hat=True, snare=True, vel=0.8)

# C5: rhythm demos
b = 0.5; s = C5['meter']; i = 0
while s < C5['poly'] - 1e-6:
    note(DR, s, 0.1, KICK if i % 2 == 0 else SNARE, 110 if i % 4 == 0 else 95); note(DR, s, 0.05, HAT, 50)
    s += b; i += 1
for cyc in range(2):
    s0 = C5['poly'] + cyc * C5['polyCycle']
    for k in range(3): note(DR, s0 + k * C5['polyCycle'] / 3, 0.1, LTOM, 110)
    for k in range(4): note(DR, s0 + k * C5['polyCycle'] / 4, 0.1, CLAVE, 105)
def euclid(k, n):
    return [i for i in range(n) if (i * k) % n < k]   # Bresenham-style even spacing (rotation of Bjorklund)
for (start, end, k) in [(C5['e38'], C5['e58'], 3), (C5['e58'], C5['end'], 5)]:
    pat = [0, 3, 6] if k == 3 else [0, 2, 3, 5, 6]   # tresillo / cinquillo
    s = start; step = 0
    while s < end - 1e-6:
        if step % 8 in pat: note(DR, s, 0.1, CONGA_L if step % 8 == 0 else CONGA_H, 110); note(DR, s, 0.1, KICK, 70 if step % 8 == 0 else 0)
        note(DR, s, 0.04, SHAKER, 45)
        s += C5['euclidStep']; step += 1

# C6: six genre snippets
def genre(g, s0, L):
    e = s0 + L
    gid = g['id']
    if gid == 'classical':                       # 72 BPM, 3/4 waltz: bass on 1, chords on 2–3, harp arpeggio
        bt = 60 / 72
        for k, t in enumerate(np.arange(s0, e - 0.05, bt)):
            if k % 3 == 0: note(STR, t, bt * 0.95, C - 12, 90)
            else: chord(STR, t, bt * 0.9, [C + 4, C + 7], 75)
        for k, t in enumerate(np.arange(s0, e - 0.05, bt / 2)):
            note(HARP, t, 0.6, [C, C + 4, C + 7, C + 12, C + 16, C + 12][k % 6] + 12, 80)
    elif gid == 'jazz':                          # 140 swing: ride, walking bass, Dm7–G7 comps
        bt = 60 / 140
        walk = [C - 22, C - 19, C - 17, C - 15, C - 17, C - 21, C - 19, C - 24]
        for k, t in enumerate(np.arange(s0, e - 0.05, bt)):
            note(ABASS, t, bt * 0.9, walk[k % 8], 100)
            note(DR, t, 0.1, RIDE, 85); note(DR, t + bt * 2 / 3, 0.05, RIDE, 60) if k % 2 == 1 else None
            if k % 2 == 1: note(DR, t, 0.05, HAT, 70)
        chord(EP, s0 + bt * 2 / 3, bt * 2, [C + 2, C + 5, C + 9, C + 12], 85)
        chord(EP, s0 + bt * 4 + bt * 2 / 3, bt * 2, [C - 1, C + 5, C + 7, C + 11], 85)
    elif gid == 'rock':                          # 120: kick 1&3, snare 2&4, power chords in eighths
        bt = 0.5
        for k, t in enumerate(np.arange(s0, e - 0.05, bt / 2)):
            root = C - 20 if k < 8 else C - 17
            chord(GTR, t, bt / 2 * 0.9, [root, root + 7, root + 12], 105)
            note(BASS, t, bt / 2 * 0.9, root - 12, 105)
            if k % 4 == 0: note(DR, t, 0.1, KICK, 115)
            if k % 4 == 2: note(DR, t, 0.1, SNARE, 115)
            note(DR, t, 0.05, HAT, 70)
        note(DR, s0, 1.0, CRASH, 110)
    elif gid == 'hiphop':                        # 90 boom-bap, swung 16th hats, Rhodes Cm9
        bt = 60 / 90
        for bar_t in np.arange(s0, e - 0.05, bt * 4):
            for pos, d in [(0, KICK), (1.75, KICK), (2.5, KICK), (1, SNARE), (3, SNARE)]:
                if bar_t + pos * bt < e: note(DR, bar_t + pos * bt, 0.1, d, 115)
        for k, t in enumerate(np.arange(s0, e - 0.05, bt / 4)):
            sw = (bt / 4) * 0.33 if k % 2 == 1 else 0
            note(DR, t + sw, 0.04, HAT, 55 + (k % 2 == 0) * 20)
        chord(EP, s0, bt * 2, [C - 12, C + 3, C + 7, C + 10, C + 14], 85)
        chord(EP, s0 + bt * 2.5, bt * 1.5, [C - 7, C + 3, C + 5, C + 10], 80)
        note(BASS, s0, bt * 1.5, C - 24, 110); note(BASS, s0 + bt * 2.5, bt, C - 19, 105)
    elif gid == 'house':                         # 124 four-on-the-floor, offbeat open hats, clap 2&4, pumping stabs
        bt = 60 / 124
        for k, t in enumerate(np.arange(s0, e - 0.05, bt)):
            note(DR, t, 0.1, KICK, 120); note(DR, t + bt / 2, 0.1, OHAT, 80)
            if k % 2 == 1: note(DR, t, 0.1, CLAP, 100)
            chord(LEAD, t + bt / 2, bt * 0.4, [C - 3, C + 4, C + 7], 85)
            note(BASS, t + bt / 2, bt * 0.4, C - 27, 105)
    elif gid == 'latin':                         # son clave 3-2 (euclidean), congas, montuno
        bt = 60 / 100; step = bt / 4
        clave = [0, 3, 6, 10, 12]                # 3-2 son clave over 16 sixteenths
        for k, t in enumerate(np.arange(s0, e - 0.05, step)):
            if k % 16 in clave: note(DR, t, 0.1, CLAVE, 115)
            if k % 4 == 2: note(DR, t, 0.1, CONGA_H, 95)
            if k % 8 == 7: note(DR, t, 0.1, CONGA_L, 100)
            mont = [C, C + 4, C + 7, C + 4, C + 12, C + 7, C + 4, C + 7]
            if k % 2 == 0: note(PNO, t, step * 1.8, mont[(k // 2) % 8], 90)
            if k % 8 == 0: note(BASS, t + step * 3, bt * 1.4, C - 24 + (0 if (k // 8) % 2 == 0 else 7), 105)
for i, g in enumerate(C6['genres']):
    genre(g, C6['cards'] + i * C6['cardLen'] + 0.05, C6['cardLen'] - 0.1)

# FINALE: everything together, then the collapse
s0 = F['text']
for i, ch_ in enumerate([[5, 9, 12], [7, 11, 14], [0, 4, 7, 12]]):
    s = s0 + i * 1.0
    d = 1.0 if i < 2 else 2.0
    chord(STR, s, d, [C - 12 + ch_[0]] + [C + n for n in ch_], 100); chord(BRASS, s, d, [C - 12 + ch_[0], C + ch_[1]], 95)
    chord(CHOIR, s, d, [C + n for n in ch_], 85); note(BASS, s, d, C - 24 + ch_[0], 110)
    chord(PNO, s, d, [C + 12 + n for n in ch_], 90)
note(DR, s0, 1.5, CRASH, 115); note(DR, s0 + 2, 2.0, CRASH, 110)
groove(F['start'], F['collapse'], kick=True, hat=True, snare=True, vel=1.0)
for k in range(8): note(PNO, F['text'] + 2 + k * 0.125, 0.5, C + [0, 4, 7, 12, 16, 19, 24, 28][k], 85)

mid = mido.MidiFile(ticks_per_beat=TPB); trk = mido.MidiTrack(); mid.tracks.append(trk)
trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
last = 0
for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
    trk.append(m.copy(time=t - last)); last = t
trk.append(mido.MetaMessage('end_of_track', time=tk(DUR + 2) - last))
mid.save(os.path.join(OUT, 'score.mid'))
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.55', '-r', str(SR), '-R', '1', '-C', '0', '-o', 'synth.reverb.room-size=0.6',
                '-o', 'synth.reverb.level=0.5', '-F', os.path.join(OUT, 'orchestra.wav'), SF2, os.path.join(OUT, 'score.mid')], check=True)
orch, _ = sf.read(os.path.join(OUT, 'orchestra.wav'), always_2d=True)
orch = np.pad(orch, ((0, max(0, N - len(orch))), (0, 0)))[:N]

# ───────────────────────── pure-tone physics layer
syn = np.zeros((N, 2))
def put(s, sig, g=1.0, pan=0.0):
    i0 = int(s * SR); n = min(len(sig), N - i0)
    if n <= 0: return
    syn[i0:i0 + n, 0] += sig[:n] * g * np.cos((pan + 1) * np.pi / 4); syn[i0:i0 + n, 1] += sig[:n] * g * np.sin((pan + 1) * np.pi / 4)
def env(n, a=0.02, r=0.08):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR)
    e[:ai] = np.linspace(0, 1, ai); e[n - ri:] = np.linspace(1, 0, ri); return e
def sine(f0, d, f1=None, a=0.02, r=0.1):
    n = int(d * SR); f = np.full(n, f0) if f1 is None else f0 * (f1 / f0) ** (np.arange(n) / n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, a, r)
def ping(f=440, d=1.4):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.2 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt * 6)) * np.exp(-tt * 2.6) * np.minimum(1, tt / 0.003)
def pluck(f, d=1.2):
    L = max(2, int(SR / f)); buf = rng.uniform(-1, 1, L); out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % L]; buf[i % L] = 0.996 * 0.5 * (buf[i % L] + buf[(i + 1) % L])
    return out * env(len(out), 0.001, 0.2)
def noise_whoosh(d=0.45):
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 1024):
        fc = 300 * (6000 / 300) ** (i / n)
        out[i:i + 1024] = sosfilt(butter(2, [fc * 0.6, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos'), x[i:i + 1024])
    return out * np.sin(np.pi * np.arange(n) / n) ** 2

put(O['ping'], ping(), 0.5)
put(O['wave'], sine(440, O['harmonics'] - O['wave'] + 1.5, a=0.3, r=0.4), 0.22)
for k, h in enumerate([2, 3, 4, 5]):
    put(O['harmonics'] + k * 0.3, sine(440 * h, O['title'] - O['harmonics'] - k * 0.3 + 0.2, a=0.1, r=0.2), 0.12 / h ** 0.5)
put(C1['circle'], sine(220, C1['speedup'] - C1['circle'], a=0.2), 0.3)
put(C1['speedup'], sine(220, C1['octave'] - C1['speedup'], f1=880, a=0.02), 0.28)
put(C1['octave'], sine(220, C1['end'] - C1['octave'] - 0.1, a=0.05, r=0.4), 0.25, -0.3)
put(C1['octave'] + 0.4, sine(440, C1['end'] - C1['octave'] - 0.5, a=0.05, r=0.4), 0.2, 0.3)
put(C2['string'], pluck(220), 0.5)
put(C2['halve'], pluck(440), 0.5)
for s, (p, q) in zip(C2['liss'], C2['ratios']):
    f0 = 220.0
    put(s, sine(f0, 1.15, a=0.05, r=0.15), 0.22, -0.4); put(s, sine(f0 * p / q, 1.15, a=0.05, r=0.15), 0.22, 0.4)
for s in [C1['start'], C2['start'], C3['start'], C4['start'], C5['start'], C6['start']]:
    put(s - 0.05, noise_whoosh(), 0.25)
for i in range(6):
    put(C6['cards'] + i * C6['cardLen'] - 0.12, noise_whoosh(0.25), 0.18)
put(F['collapse'], sine(880, 2.0, f1=110, a=0.05, r=0.3), 0.12)
put(F['ping'], ping(440, 1.0), 0.5)

mix = orch * 1.6 + syn * 0.45
meter = pyln.Meter(SR)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
ceil = 10 ** (-1.2 / 20); mix = np.tanh(mix / ceil) * ceil
print(f'integrated {meter.integrated_loudness(mix):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
os.makedirs(os.path.join(ROOT, 'public'), exist_ok=True)
sf.write(os.path.join(ROOT, 'public', 'score.wav'), mix.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/score.wav')

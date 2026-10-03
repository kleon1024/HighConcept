"""FIRST LIGHT — score. Sampled orchestra (FluidSynth + FluidR3 GM) + synthesized sound design.
Every rhythmic event comes from src/plan.js (the accelerating tempo map shared with the picture).
Run: python3 music/compose.py  → out/score.wav, out/score.mid
"""
import json, os, subprocess
import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
P = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'src', 'plan.js')]))
DUR, BEATS, PULSES, DIV = P['DURATION'], P['BEATS'], P['PULSES'], P['DIVISIONS']
IGN, CLIMAX, SIL, EYE = P['IGNITE'], P['CLIMAX'], P['SILENCE'], P['EYE_OPEN']
SR = 48000
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
rng = np.random.default_rng(3)

# MIDI on a fixed 120 BPM grid so seconds map exactly: 1 s = 2 beats = 960 ticks
TPB = 480
tk = lambda s: int(round(s * 2 * TPB))
ev = []
def msg(s, order, m): ev.append((tk(s), order, m))
def prog(ch, p): msg(0, 0, mido.Message('program_change', channel=ch, program=p))
def cc(ch, s, c, v): msg(s, 1, mido.Message('control_change', channel=ch, control=c, value=int(max(0, min(127, v)))))
def ramp(ch, s0, s1, v0, v1, c=11, n=24):
    for i in range(n + 1): cc(ch, s0 + (s1 - s0) * i / n, c, v0 + (v1 - v0) * i / n)
def note(ch, s, d, p, v=90):
    v = int(max(1, min(127, v + rng.integers(-3, 4))))
    msg(s, 2, mido.Message('note_on', channel=ch, note=int(p), velocity=v))
    msg(s + d - 0.002, 0, mido.Message('note_off', channel=ch, note=int(p), velocity=0))
def chord(ch, s, d, ps, v=80):
    for p in ps: note(ch, s, d, p, v)

STR, LOW, PNO, CEL, CHO, HRN, TIM, HRP, MAR, DRM, TAI, GLK, BEL, PIZ, TRM, HIT = range(16)
for ch, p in [(STR, 49), (LOW, 43), (PNO, 0), (CEL, 8), (CHO, 52), (HRN, 60), (TIM, 47), (HRP, 46), (MAR, 12),
              (TAI, 116), (GLK, 9), (BEL, 14), (PIZ, 45), (TRM, 44), (HIT, 48)]:
    prog(ch, p)
for ch in range(16):
    cc(ch, 0, 7, 100); cc(ch, 0, 11, 100); cc(ch, 0, 91, 80)

C = 48
# ─── VOID (0–5): a low pedal, a breath of choir, virtual particles blinking (sparse high notes); the first light
note(LOW, 0, 4.9, C - 12, 60); ramp(LOW, 0, 4.8, 20, 80)
chord(CHO, 0.4, 4.4, [C + 12, C + 19], 45); ramp(CHO, 0.4, 4.6, 10, 70)
spark = [84, 86, 91, 93, 96, 98, 103]
for s in np.sort(rng.uniform(0.3, 4.2, 14)):
    note(GLK if rng.random() < 0.5 else CEL, float(s), 0.5, int(rng.choice(spark)), int(rng.integers(25, 45)))
note(CEL, IGN, 3.0, 84, 105); note(HRP, IGN, 3.0, 72, 70); note(BEL, IGN, 3.0, 84, 45)   # the first light: C6
chord(TRM, 2.7, 2.25, [C + 24, C + 31, C + 36], 50); ramp(TRM, 2.7, 4.95, 15, 110)           # vibrating strings
for i in range(8):
    note(TIM, 4.0 + i * 0.12, 0.1, C - 12, 40 + i * 9)

# ─── MATTER (5–10): the light pours out — harp flows, strings bloom, a slow heartbeat
prog_m = [(5.0, [C, C + 3, C + 7, C + 14]), (6.25, [C - 4, C, C + 3, C + 11]), (7.5, [C + 3, C + 7, C + 10, C + 14]), (8.75, [C - 2, C + 2, C + 5, C + 9])]
for s, ch_ in prog_m:
    chord(STR, s, 1.3, [ch_[0] - 12] + ch_, 85)
    note(LOW, s, 1.3, ch_[0] - 24, 90)
    chord(CHO, s, 1.3, [p + 12 for p in ch_[1:3]], 60)
ramp(STR, 5, 9.9, 60, 110)
chord(HRN, 5.0, 2.2, [C, C + 7], 70)
for i in range(40):  # continuous rising/falling harp arpeggio
    s = 5.0 + i * 0.125
    base = [p for t0, p in prog_m if t0 <= s][-1]
    note(HRP, s, 0.6, base[i % 4] + 12 * (1 + (i // 4) % 2), 70 + (i % 4 == 0) * 15)
for b in [x for x in BEATS if 5 <= x < 10]:
    note(TIM, b, 0.5, C - 12, 85); note(TIM, b + 0.18, 0.3, C - 12, 55)   # lub-dub
note(DRM, 9.2, 1.0, 49, 40)  # cymbal swell into the dive

# ─── LIFE (10–17): plucks on every beat, horns sing the motif, divisions bloom
life = [(10, [C + 5, C + 8, C + 12]), (11.8, [C - 4, C, C + 3]), (13.6, [C + 3, C + 7, C + 10]), (15.4, [C - 2, C + 2, C + 5])]
for i, (s, ch_) in enumerate(life):
    e = life[i + 1][0] if i + 1 < len(life) else 17.2
    chord(STR, s, e - s, [ch_[0] - 12] + ch_, 80); note(LOW, s, e - s, ch_[0] - 24, 85)
    chord(CHO, s, e - s, [p + 12 for p in ch_], 55)
ramp(STR, 10, 17, 55, 100)
lb = [x for x in BEATS if 10 <= x < 17]
for j, b in enumerate(lb):
    ch_ = [c for s, c in life if s <= b][-1]
    note(MAR, b, 0.3, ch_[j % 3] + 24, 95); note(PIZ, b, 0.3, ch_[0], 80)
    note(TIM, b, 0.35, C - 12, 70 + j * 2)
for i, p in enumerate([67, 72, 75, 74, 72, 79, 77, 75]):   # horn motif
    note(HRN, 10.6 + i * 0.8, 0.95, p - 12, 82)
for i, d in enumerate(DIV):   # 1 → 2 → 4 → 8 → 16
    for k in range(6): note(HRP, d + k * 0.04, 0.8, [60, 64, 67, 72, 76, 79][k] + 12 * (i % 2), 90)
    chord(CEL, d, 0.8, [84 + i * 2, 91 + i * 2], 95); chord(HIT, d, 0.5, [C + 12, C + 19], 70 + i * 8)

# ─── MIND (17–24.6): staccato pulses on every signal, drums on every beat, harmony climbs, tutti at the climax
mind = [(17.0, 0), (19.0, 2), (20.8, 4), (22.3, 6), (23.5, 8)]
for i, (s, tr) in enumerate(mind):
    e = mind[i + 1][0] if i + 1 < len(mind) else CLIMAX
    tri = [C + tr, C + tr + 3, C + tr + 7]
    chord(STR, s, e - s, [tri[0] - 12] + tri + [tri[0] + 12], 90 + i * 6)
    chord(HRN, s, e - s, [tri[0], tri[2]], 75 + i * 10)
    chord(CHO, s, e - s, [p + 12 for p in tri], 70 + i * 10)
    note(LOW, s, e - s, tri[0] - 24, 100)
for j, pt in enumerate(PULSES):
    tr = [x for s, x in mind if s <= pt][-1]
    tri = [C + tr, C + tr + 3, C + tr + 7, C + tr + 12]
    note(PIZ, pt, 0.15, tri[j % 4] + 12, 90 + (j % 2) * 15)
    note(PNO, pt, 0.15, tri[(j * 3) % 4] + 24, 70 + (j % 4 == 0) * 25)
for b in [x for x in BEATS if 17 <= x < CLIMAX]:
    note(TAI, b, 0.3, 48, 110); note(TIM, b, 0.3, C - 12, 100); note(DRM, b, 0.2, 36, 110)
ramp(STR, 17, CLIMAX, 70, 127); ramp(CHO, 17, CLIMAX, 60, 127); ramp(HRN, 17, CLIMAX, 60, 127)
for i in range(12):
    note(TIM, CLIMAX - 0.6 + i * 0.05, 0.05, C - 12, 60 + i * 5)
chord(STR, CLIMAX, 0.24, [C - 4, C, C + 3, C + 8, C + 12, C + 15], 127)    # A♭ — unresolved, cut by silence
chord(HRN, CLIMAX, 0.24, [C - 4, C + 3, C + 8], 127); chord(CHO, CLIMAX, 0.24, [C + 8, C + 12, C + 15], 127)
chord(HIT, CLIMAX, 0.24, [C - 4, C + 8], 127); note(DRM, CLIMAX, 0.24, 49, 127); note(TAI, CLIMAX, 0.24, 48, 127); note(LOW, CLIMAX, 0.24, C - 16, 127)

# ─── SEEING (25.35–30): silence breaks into a single breath; C major opens with the eye; the first light again
for i, p in enumerate([72, 76, 79, 84]):
    note(CEL, 25.6 + i * 0.35, 1.6, p, 60)
chord(STR, 26.0, 3.9, [C - 12, C, C + 4, C + 7, C + 12, C + 16], 80); ramp(STR, 26.0, EYE, 20, 105); ramp(STR, 28.4, 29.5, 105, 10)
chord(CHO, 26.2, 3.6, [C + 12, C + 16, C + 19], 75); ramp(CHO, 26.2, EYE, 15, 100); ramp(CHO, 28.4, 29.5, 100, 5)
note(LOW, 26.0, 3.6, C - 12, 75)
for i, p in enumerate([60, 64, 67, 72, 76, 79, 84, 88]):
    note(HRP, EYE + i * 0.09, 2.2, p, 78)
note(BEL, EYE, 2.5, 72, 70)
note(CEL, 29.6, 0.4, 84, 100)   # the same C6 as the first light — the loop closes

mid = mido.MidiFile(ticks_per_beat=TPB); trk = mido.MidiTrack(); mid.tracks.append(trk)
trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
last = 0
for t, _, m in sorted(ev, key=lambda e: (e[0], e[1])):
    trk.append(m.copy(time=t - last)); last = t
trk.append(mido.MetaMessage('end_of_track', time=tk(DUR + 3) - last))
mid.save(os.path.join(OUT, 'score.mid'))
orch_path = os.path.join(OUT, 'orchestra.wav')
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.5', '-r', str(SR), '-R', '1', '-C', '1', '-o', 'synth.reverb.room-size=0.85',
                '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.75', '-F', orch_path, SF2, os.path.join(OUT, 'score.mid')], check=True)
orch, sr = sf.read(orch_path, always_2d=True)
N = int(DUR * SR)
orch = np.pad(orch, ((0, max(0, N - len(orch))), (0, 0)))[:N]

# ─── sound design
sfx = np.zeros((N, 2))
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def add(s, sig, g=1.0, pan=0.0):
    i0 = int(s * SR); n = min(len(sig), N - i0)
    if n <= 0: return
    sfx[i0:i0 + n, 0] += sig[:n] * g * np.cos((pan + 1) * np.pi / 4); sfx[i0:i0 + n, 1] += sig[:n] * g * np.sin((pan + 1) * np.pi / 4)
def boom(d=2.5, f0=60, f1=24):
    tt = np.arange(int(d * SR)) / SR; f = f1 + (f0 - f1) * np.exp(-tt / 0.3)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.8) * np.minimum(1, tt / 0.004)
def riser(d, f0, f1):
    n = int(d * SR); x = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 2048):
        fc = f0 * (f1 / f0) ** (i / n); out[i:i + 2048] = bp(x[i:i + 2048], fc * 0.7, min(fc * 1.4, SR / 2 - 200))
    return out * np.linspace(0, 1, n) ** 2.5
def breath(d):
    n = int(d * SR); return lp(bp(rng.standard_normal(n), 500, 2500), 3000) * np.sin(np.pi * np.arange(n) / n) ** 0.8
def hum(d, f=32.7):
    tt = np.arange(int(d * SR)) / SR; return (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2 * tt)) * np.minimum(1, tt / 1.5) * np.minimum(1, (d - tt) / 0.3)
add(0, hum(4.95), 0.18)
add(4.0, riser(1.0, 300, 7000), 0.35)
add(5.0, boom(3, 55, 22), 0.9)
add(9.2, riser(0.8, 200, 6000), 0.3)
add(10.0, boom(2, 70, 30), 0.5)
add(17.0, boom(2, 70, 30), 0.6)
add(22.4, riser(CLIMAX - 22.4, 200, 9000), 0.4)
add(CLIMAX, boom(1.0, 80, 30), 1.0)
add(25.4, breath(0.7), 0.4)
mix = orch + sfx * 0.8
g = np.ones(N); i0, i1 = int(SIL[0] * SR), int(SIL[1] * SR); r = int(0.004 * SR)
g[i0:i1] = 0; g[i0 - r:i0] = np.linspace(1, 0, r); g[i1:i1 + r] = np.linspace(0, 1, r)
mix *= g[:, None]
fade = np.ones(N); fn = int(0.25 * SR); fade[-fn:] = np.linspace(1, 0.6, fn)
mix *= fade[:, None]
meter = pyln.Meter(SR)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
ceil = 10 ** (-1.2 / 20); mix = np.tanh(mix / ceil) * ceil
print(f'integrated {meter.integrated_loudness(mix):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('wrote out/score.wav')

"""Score for DESCENT (30 s): sampled orchestra (FluidSynth + FluidR3 GM) + synthesized sound design.

Pipeline: timeline.js -> MIDI (mido) -> FluidSynth render -> numpy SFX layer -> mix/master to -14 LUFS.
Run: python3 music/compose.py   (writes out/score.wav, out/score.mid)
"""
import json
import os
import subprocess

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'out')
os.makedirs(OUT, exist_ok=True)
TL = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'src', 'timeline.js')]))
BPM, TOTAL = TL['BPM'], TL['TOTAL_BEATS']
SR = 48000
BEAT = 60 / BPM
DUR = TOTAL * BEAT
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
TPB = 480
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- MIDI
events = []  # (tick, order, channel, msg)


def tk(beat):
    return int(round(beat * TPB))


def prog(ch, p):
    events.append((0, 0, ch, mido.Message('program_change', channel=ch, program=p)))


def cc(ch, beat, ctl, val):
    events.append((tk(beat), 1, ch, mido.Message('control_change', channel=ch, control=ctl, value=int(max(0, min(127, val))))))


def ramp(ch, b0, b1, v0, v1, ctl=11, steps=24):
    for i in range(steps + 1):
        cc(ch, b0 + (b1 - b0) * i / steps, ctl, v0 + (v1 - v0) * i / steps)


def bend(ch, beat, val):  # val in [-8192, 8191]
    events.append((tk(beat), 1, ch, mido.Message('pitchwheel', channel=ch, pitch=int(max(-8192, min(8191, val))))))


def note(ch, beat, dur, pitch, vel=90):
    v = int(max(1, min(127, vel + rng.integers(-4, 5))))
    events.append((tk(beat), 2, ch, mido.Message('note_on', channel=ch, note=int(pitch), velocity=v)))
    events.append((tk(beat + dur) - 1, 0, ch, mido.Message('note_off', channel=ch, note=int(pitch), velocity=0)))


def chord(ch, beat, dur, pitches, vel=80):
    for p in pitches:
        note(ch, beat, dur, p, vel)


# channels / GM programs
STR, LOW, PNO, CEL, CHO, HRN, TIM, HRP, ORG, DRM, TAI, GLK, BEL, PIZ, TRM, HIT = range(16)
for ch, p in [(STR, 48), (LOW, 43), (PNO, 0), (CEL, 8), (CHO, 52), (HRN, 60), (TIM, 47), (HRP, 46), (ORG, 19),
              (TAI, 116), (GLK, 9), (BEL, 14), (PIZ, 45), (TRM, 44), (HIT, 55)]:
    prog(ch, p)
for ch in range(16):
    cc(ch, 0, 7, 100)
    cc(ch, 0, 11, 100)
    cc(ch, 0, 91, 70)  # reverb send
# pitch-bend range 12 semitones on the string channels (for the black hole pull)
for ch in (STR, CHO, ORG, TRM):
    for c, v in ((101, 0), (100, 0), (6, 12), (38, 0)):
        cc(ch, 0, c, v)

C = 48  # C3
Cm = [C, C + 3, C + 7]
Ab = [C - 4, C, C + 3]
Eb = [C + 3, C + 7, C + 10]
Bb = [C - 2, C + 2, C + 5]
Fm = [C + 5, C + 8, C + 12]
G = [C - 5, C - 1, C + 2]


def voicing(tri, lo=0):
    return [tri[0] - 12 + lo, tri[0] + lo, tri[1] + lo, tri[2] + lo, tri[0] + 12 + lo]


# ---- 序 · 卵 (0–4): celesta seed motif over a low string pedal and a breath of choir
note(LOW, 0, 4, C - 12, 55); ramp(LOW, 0, 3.8, 30, 90)
chord(CHO, 0.5, 3.5, [C + 12, C + 19], 45); ramp(CHO, 0.5, 3.8, 20, 85)
for b, p in [(0.5, 79), (1, 84), (1.5, 87), (2.5, 86), (3, 84)]:
    note(CEL, b, 1.2, p, 80)
note(DRM, 3.0, 1, 49, 40)  # soft crash swell start

# ---- I 振 (4–12): strings Cm → Ab, piano motif, harp, celesta orbitals, tremolo build to the meteor
def hit(beat, big=True):
    note(TIM, beat, 1.5, C - 12, 120 if big else 95)
    note(DRM, beat, 2, 49, 115 if big else 90)
    note(DRM, beat, 1, 36, 120)
    if big:
        chord(HIT, beat, 0.5, [C, C + 7, C + 12], 100)
        note(TAI, beat, 1, 48, 120)


hit(4)
chord(STR, 4, 4, voicing(Cm), 80); ramp(STR, 4, 8, 70, 100)
chord(STR, 8, 3.75, voicing(Ab), 85)
note(LOW, 4, 4, C - 12, 95); note(LOW, 8, 3.75, C - 16, 95)
for i, p in enumerate([67, 72, 75, 74]):
    note(PNO, 4.5 + i * 0.5, 0.9, p, 82)
note(PNO, 6.5, 1.5, 72, 80)
for i in range(8):  # solids: rising harp arpeggio
    note(HRP, 6 + i * 0.25, 1, [48, 55, 60, 63, 67, 72, 75, 79][i], 85)
for b, p in [(8, 84), (8.667, 91), (9.333, 96)]:  # 2s, 4p, 6d
    note(CEL, b, 0.8, p, 95); note(GLK, b, 0.5, p, 70)
chord(CHO, 8, 2, [C + 12, C + 15, C + 19], 70); ramp(CHO, 8, 10, 40, 100)
chord(TRM, 10, 1.75, [C - 4, C, C + 3, C + 8], 90); ramp(TRM, 10, 11.75, 30, 127)
for i in range(14):
    note(TIM, 10 + i * 0.125, 0.12, C - 12, 50 + i * 5)

# ---- II 冻 (12–20): Eb → Bb, pizzicato ice, glockenspiel, choir; the snake bites at 17
hit(12, big=False)
chord(CHO, 12, 4, [C + 15, C + 19, C + 22], 65)
chord(STR, 12, 4, voicing(Eb, -12)[1:], 60)
chord(STR, 16, 3.75, voicing(Bb, -12)[1:], 65); ramp(STR, 16, 19.75, 70, 110)
note(LOW, 12, 4, C - 9, 80); note(LOW, 16, 3.75, C - 14, 85)
ice = [75, 79, 82, 87, 82, 79]  # six-note benzene ring
for i in range(30):
    b = 12 + i * 0.25
    if b >= 19.75:
        break
    note(PIZ, b, 0.25, ice[i % 6] - 12, 70 + (20 if abs(b - 17) < 1e-6 else 0))
note(GLK, 14, 1, 88, 95); note(GLK, 14.5, 1, 91, 90)  # H-O-H
for i, p in enumerate([84, 86, 87, 91]):
    note(CEL, 15 + i * 0.25, 0.5, p, 75)
note(DRM, 17, 2, 49, 110); note(TIM, 17, 1, C - 9, 110); chord(HIT, 17, 0.5, [C + 3, C + 10, C + 15], 95)
for i in range(14):  # DNA: harp climbs
    note(HRP, 18 + i * 0.125, 0.6, [58, 62, 65, 70, 74, 77, 82][i % 7] + 12 * (i // 7), 80)
for i, p in enumerate([70, 74, 77, 79]):
    note(PNO, 18 + i * 0.5, 0.6, p, 75)

# ---- III 生 (20–28): Cm → Fm, staccato 16th pulse, heartbeat timpani; freeze at 24 (first eye); lightning at 26.5
hit(20)
for i in range(16):
    b = 20 + i * 0.25
    tri = Cm if b < 22 else Fm
    note(STR, b, 0.2, tri[i % 3] + 12, 70 + (i % 4 == 0) * 20)
for b in np.arange(20, 24, 1.0):
    note(TIM, b, 0.3, C - 12, 100); note(TIM, b + 0.2, 0.3, C - 12, 70)
note(LOW, 20, 2, C - 12, 90); note(LOW, 22, 2, C - 7, 90)
for i, b in enumerate([20, 20.5, 21, 21.5]):  # 1 → 2 → 4 → 8 cells
    note(HRP, b, 0.8, 60 + 12 * (i % 3) + [0, 7, 3, 10][i], 95)
for i in range(6):
    note(CEL, 22 + i * 0.125, 0.3, [96, 91, 99, 94, 103, 98][i], 70)  # synapse sparks
chord(CHO, 23, 1, [C + 8, C + 12, C + 17], 80)  # Eden
note(CEL, 24, 2.5, 100, 90); note(GLK, 24, 2, 100, 50)  # first light — everything else drops out
chord(CHO, 24, 2, [C + 24], 30)
chord(TRM, 26, 0.5, [C - 11, C - 4, C + 1], 60); ramp(TRM, 26, 26.5, 40, 120)
for i in range(4):
    note(TIM, 26 + i * 0.125, 0.12, C - 11, 70 + i * 12)
note(TIM, 26.5, 1.5, C - 12, 127); note(DRM, 26.5, 2, 49, 127); note(DRM, 26.5, 2, 57, 110); chord(HIT, 26.5, 0.5, [C - 11, C - 4, C + 1], 110)

# ---- IV 盗 (28–36): taiko drive, horns state the fate motif on the flame test, ding, oracle cracks
hit(28)
for b, v in [(28, 120), (28.75, 90), (29, 110), (29.5, 95), (30, 120), (31.5, 120), (32, 100), (32.75, 90), (33, 120), (34, 110), (35, 120), (35.5, 100)]:
    note(TAI, b, 0.5, 48, v)
for b in (29, 31, 33, 35):
    note(DRM, b, 0.3, 38, 90)
chord(STR, 28, 2, voicing(Cm), 85)
chord(HRN, 28, 2, [C, C + 7], 70)
note(LOW, 28, 2, C - 12, 100)
for i, b in enumerate([30, 30.5, 31]):  # G G G
    chord(HRN, b, 0.4, [C + 7, C - 5], 115); chord(HIT, b, 0.3, [C - 5, C + 2, C + 7], 105)
    note(TIM, b, 0.4, C - 5, 115); note(LOW, b, 0.4, C - 17, 110)
chord(HRN, 31.5, 1.5, [C + 3, C - 9, C + 10], 120); chord(STR, 31.5, 1.5, voicing(Eb, -12), 100)  # E♭
chord(CHO, 31.5, 1.5, [C + 15, C + 19, C + 22], 90); note(LOW, 31.5, 1.5, C - 21, 110); note(DRM, 31.5, 2, 49, 115)
note(BEL, 33, 2, C + 12, 110); note(BEL, 33, 2, C, 90); note(TIM, 33, 1, C - 16, 120)
chord(STR, 33, 1, voicing(Ab), 85); note(LOW, 33, 1, C - 16, 100)
chord(TRM, 34, 1.75, [C - 12, C - 5, C, C + 3], 70); ramp(TRM, 34, 35.75, 50, 127)
for b in (34, 34.25, 34.5, 34.75):
    note(TIM, b, 0.2, C - 10 + int((b - 34) * 8), 100)
note(TAI, 35, 0.5, 48, 127); note(DRM, 35, 1, 49, 120)

# ---- V 繁 (36–48): organ + choir + brass climb a whole tone every two beats; stutter; black-hole pull
hit(36)
for k, (b0, tr) in enumerate([(36, 0), (38, 2), (40, 4), (42, 6)]):
    l = 2 if b0 < 42 else 1
    tri = [C + tr, C + tr + 3, C + tr + 7]
    chord(ORG, b0, l, voicing(tri), 90 + k * 8)
    chord(CHO, b0, l, [tri[0] + 12, tri[1] + 12, tri[2] + 12], 85 + k * 8)
    chord(HRN, b0, l, [tri[0], tri[2]], 90 + k * 8)
    note(LOW, b0, l, tri[0] - 12, 105)
    for i in range(int(l * 4)):
        note(STR, b0 + i * 0.25, 0.22, tri[i % 3] + 24, 80 + (i % 4 == 0) * 25)
    for i in range(int(l)):
        note(DRM, b0 + i, 0.3, 36, 120); note(DRM, b0 + i + 0.5, 0.3, 42, 80)
    note(DRM, b0 + 1, 0.3, 38, 110)
    note(TAI, b0, 0.5, 48, 115)
for i in range(16):  # flash-montage stutter (43–45)
    b = 43 + i * 0.125
    if i % 4 == 3:
        continue
    chord(HIT, b, 0.1, [C + 6, C + 13, C + 18], 90 + (i % 4 == 0) * 30)
    note(DRM, b, 0.1, 38 if i % 2 else 36, 100)
# 45–47.5: everything is pulled down in pitch (12-semitone bend) and swallowed
chord(ORG, 45, 2.5, [C - 18, C - 6, C - 3, C + 1], 110)
chord(STR, 45, 2.5, [C - 6, C + 1, C + 6, C + 9], 100)
chord(CHO, 45, 2.5, [C + 6, C + 9, C + 13], 100)
note(LOW, 45, 2.5, C - 18, 115)
for ch in (STR, CHO, ORG):
    for i in range(21):
        b = 45 + 2.4 * i / 20
        bend(ch, b, -8192 * (i / 20) ** 2)
    bend(ch, 47.6, 0)
note(TIM, 45, 1, C - 12, 127); note(DRM, 45, 2, 49, 120)

# ---- VI 降 (48–56): piano descends like an optimizer, settles; network choir rhyme; music-box sheep (fate)
note(TIM, 48, 1, C - 12, 90)
chord(STR, 48, 7.5, [C - 12, C, C + 3, C + 7], 55); ramp(STR, 48, 55.5, 70, 40)
note(LOW, 48, 7.5, C - 24, 70)
descent = [84, 82, 86, 80, 79, 82, 77, 75, 79, 74, 72, 75, 72, 71, 72]
b = 48.0
for i, p in enumerate(descent):
    d = 0.125 if i < 8 else 0.25 if i < 12 else 0.5
    note(PNO, b, d * 1.6, p, 88 - i * 2)
    b += d
chord(CHO, 50, 1.2, [C + 12, C + 15, C + 19], 85)  # same voicing as the cosmic web at beat 8
for i, p in enumerate([72, 75, 79, 75, 74, 72, 70, 72]):
    note(CEL, 51 + i * 0.125, 0.4, p + 12, 75)
for b in (52, 52.5, 53):
    note(CEL, b, 0.45, 91, 105); note(PIZ, b, 0.4, 67, 90); note(GLK, b, 0.3, 91, 70)
note(CEL, 53.5, 1.5, 87, 110); note(PIZ, 53.5, 1, 63, 95); chord(CHO, 53.5, 2, [C + 15, C + 19], 70)
for i in range(6):
    note(CEL, 54 + i * 0.25, 0.3, 87 + [0, 3, 7, 12, 7, 3][i], 60 - i * 6)
note(PNO, 55, 0.5, 60, 80)

# ---- VII 觉 (56–60): breath, C major opens (strings, choir, harp, celesta), bell, decay into the loop
chord(STR, 56.8, 3.2, [C - 12, C, C + 4, C + 7, C + 12, C + 16], 85); ramp(STR, 56.8, 58, 40, 110); ramp(STR, 58.5, 59.9, 110, 20)
chord(CHO, 56.8, 3.1, [C + 12, C + 16, C + 19], 80); ramp(CHO, 56.8, 58, 30, 105); ramp(CHO, 58.5, 59.9, 105, 15)
note(LOW, 56.8, 3.1, C - 12, 80)
for i, p in enumerate([60, 64, 67, 72, 76, 79, 84]):
    note(HRP, 56.8 + i * 0.125, 2, p, 80)
for i, p in enumerate([79, 84, 87, 86]):  # the seed motif again, now resolved
    note(CEL, 57.5 + i * 0.25, 1, p if p != 87 else 88, 70)
note(BEL, 58, 2, 72, 110); note(BEL, 58, 2, 60, 90); note(PNO, 58, 2, 36, 70)

mid = mido.MidiFile(ticks_per_beat=TPB)
tr = mido.MidiTrack()
mid.tracks.append(tr)
tr.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM), time=0))
last = 0
for t, _, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
    tr.append(msg.copy(time=t - last))
    last = t
tr.append(mido.MetaMessage('end_of_track', time=tk(TOTAL + 4) - last))
mid_path = os.path.join(OUT, 'score.mid')
mid.save(mid_path)

# ---------------------------------------------------------------- render orchestra
orch_path = os.path.join(OUT, 'orchestra.wav')
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.5', '-r', str(SR), '-R', '1', '-C', '1',
                '-o', 'synth.reverb.room-size=0.8', '-o', 'synth.reverb.width=1.0', '-o', 'synth.reverb.level=0.7',
                '-F', orch_path, SF2, mid_path], check=True)
orch, sr = sf.read(orch_path, always_2d=True)
assert sr == SR
N = int(DUR * SR)
orch = np.pad(orch, ((0, max(0, N - len(orch))), (0, 0)))[:N]

# ---------------------------------------------------------------- sound design (numpy)
t = np.arange(N) / SR
sfx = np.zeros((N, 2))


def b2i(b):
    return int(b * BEAT * SR)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, f0, f1):
    return sosfilt(butter(2, [f0, f1], 'band', fs=SR, output='sos'), x)


def add(start_beat, sig, gain=1.0, pan=0.0):
    i0 = b2i(start_beat)
    n = min(len(sig), N - i0)
    if n <= 0:
        return
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    sfx[i0:i0 + n, 0] += sig[:n] * gain * l
    sfx[i0:i0 + n, 1] += sig[:n] * gain * r


def boom(dur=2.0, f0=60, f1=28):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-tt / 0.25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt / 0.6) * np.minimum(1, tt / 0.003)


def riser(dur, f0=200, f1=6000):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    seg = 2048
    for i in range(0, n, seg):
        fc = f0 * (f1 / f0) ** (i / n)
        out[i:i + seg] = bp(x[i:i + seg], fc * 0.7, min(fc * 1.4, SR / 2 - 100))
    return out * np.linspace(0, 1, n) ** 2.5


def thunder(dur=3.0):
    n = int(dur * SR)
    x = np.cumsum(rng.standard_normal(n)) * 0.02
    x = hp(lp(x, 300), 25)
    tt = np.arange(n) / SR
    crack = hp(rng.standard_normal(n), 1500) * np.exp(-tt / 0.03)
    rumble = 1 + 0.6 * np.sin(2 * np.pi * 6 * tt) * np.sin(2 * np.pi * 1.7 * tt)
    return x * np.exp(-tt / 0.9) * rumble / (np.abs(x).max() + 1e-9) + crack * 0.6


def crackle(dur, density=0.03):
    n = int(dur * SR)
    out = np.zeros(n)
    for i in np.nonzero(rng.random(n // 64) < density)[0]:
        k = i * 64
        m = min(200, n - k)
        out[k:k + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / 30) * rng.uniform(0.3, 1)
    return hp(out, 800)


def shepard(dur, rate=0.4):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(8):
        pos = (k - rate * tt) % 8
        f = 30 * 2 ** pos
        ph = 2 * np.pi * np.cumsum(f) / SR
        out += np.sin(ph) * np.exp(-0.5 * ((pos - 4) / 1.4) ** 2)
    return out * np.minimum(1, tt / 0.5) * np.minimum(1, (dur - tt) / 0.1)


def breath(dur):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    env = np.sin(np.pi * np.arange(n) / n) ** 0.8
    return lp(bp(x, 500, 2500), 3000) * env


for b in (4, 12, 20, 28, 36):
    add(b, boom(), 0.9)
add(48, boom(3, 50, 22), 0.7)
add(45, boom(3, 70, 18), 1.0)
add(10, riser(1.75 * BEAT), 0.35)
add(26, riser(0.5 * BEAT, 400, 8000), 0.3)
add(26.5, thunder(), 0.55)
add(34, crackle(1.8 * BEAT, 0.06), 0.4)
for b in (34, 34.25, 34.5, 34.75):
    add(b, hp(rng.standard_normal(1500), 2000) * np.exp(-np.arange(1500) / 300), 0.5, rng.uniform(-0.5, 0.5))
add(28, crackle(1.75 * BEAT, 0.02), 0.25)  # torch
add(45, riser(2.5 * BEAT, 300, 9000), 0.4)
add(48, shepard(7.5 * BEAT), 0.06)
add(56, breath(0.65), 0.35)
for b in (43, 43.5, 44, 44.5):
    add(b, hp(rng.standard_normal(4000), 3000) * np.linspace(1, 0, 4000) ** 2, 0.25, rng.uniform(-0.6, 0.6))
add(58.6, np.sin(2 * np.pi * np.cumsum(np.linspace(32.7, 20, int(1.4 * BEAT * SR))) / SR) * np.linspace(0, 1, int(1.4 * BEAT * SR)) ** 0.5, 0.25)

# ---------------------------------------------------------------- mix & master
mix = orch * 1.0 + sfx * 0.8
# glue compressor (simple RMS, slow)
env = np.sqrt(lp(np.mean(mix ** 2, axis=1), 8) + 1e-9)
thr = np.percentile(env, 70)
gain = np.where(env > thr, (thr / env) ** 0.35, 1.0)
mix *= gain[:, None]
# shared silences: absolute, with 4 ms ramps
g = np.ones(N)
ramp_n = int(0.004 * SR)
for a, b in TL['SILENCES']:
    i0, i1 = b2i(a), b2i(b)
    g[i0:i1] = 0
    g[max(0, i0 - ramp_n):i0] = np.minimum(g[max(0, i0 - ramp_n):i0], np.linspace(1, 0, i0 - max(0, i0 - ramp_n)))
    g[i1:i1 + ramp_n] = np.minimum(g[i1:i1 + ramp_n], np.linspace(0, 1, len(g[i1:i1 + ramp_n])))
mix *= g[:, None]
# loudness to -14 LUFS, then a soft limiter with -1 dBTP ceiling
meter = pyln.Meter(SR)
mix = pyln.normalize.loudness(mix, meter.integrated_loudness(mix), -14.0)
ceil = 10 ** (-1.2 / 20)
mix = np.tanh(mix / ceil) * ceil
print(f'integrated {meter.integrated_loudness(mix):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS')
sf.write(os.path.join(OUT, 'score.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('wrote out/score.wav', f'{DUR:.2f}s')

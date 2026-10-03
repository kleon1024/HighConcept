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


def hit(beat, big=True):
    note(TIM, beat, 1.5, C - 12, 120 if big else 95)
    note(DRM, beat, 2, 49, 115 if big else 85)
    note(DRM, beat, 1, 36, 120)
    if big:
        chord(HIT, beat, 0.5, [C, C + 7, C + 12], 100)
        note(TAI, beat, 1, 48, 120)


def cut_hit(beat, i, pitch_set=(0, 7, 12, 15), vel=100):
    """a percussive accent on a fast cut: taiko/timpani + a short orchestral stab"""
    note(TAI, beat, 0.3, 48, vel + 10)
    note(TIM, beat, 0.3, C - 12 + (i % 2) * 7, vel)
    chord(HIT, beat, 0.2, [C + pitch_set[i % len(pitch_set)], C + 12 + pitch_set[i % len(pitch_set)]], vel - 15)


fast_cuts = lambda a, b: [s['s'] for s in TL['SHOTS'] if a <= s['s'] < b]

# ======== SLOW · seed (0–8): almost nothing — celesta seed motif, a low pedal, a breath of choir
note(LOW, 0, 7.75, C - 12, 50); ramp(LOW, 0, 7.5, 25, 85)
chord(CHO, 1.5, 6.25, [C + 12, C + 19], 45); ramp(CHO, 1.5, 7.5, 15, 90)
for b, p in [(1, 79), (2, 84), (3, 87), (4.5, 86), (5, 84), (6, 79), (6.5, 91)]:
    note(CEL, b, 1.8, p, 78)
chord(STR, 4, 3.75, [C - 12, C, C + 3, C + 7], 50); ramp(STR, 4, 7.6, 20, 95)
note(DRM, 5.5, 2.2, 49, 35)  # cymbal swell into the crack

# ======== FAST · cosmos burst (8–10): every cut hits
hit(8)
for i, b in enumerate(fast_cuts(8, 10)):
    cut_hit(b, i)
for i in range(8):
    note(STR, 8 + i * 0.25, 0.2, [C + 12, C + 15, C + 19, C + 24][i % 4], 95)
for b, p in [(9.5, 96), (9.667, 101), (9.833, 103)]:  # 2s, 4p, 6d
    note(CEL, b, 0.5, p, 100); note(GLK, b, 0.3, p, 80)
note(LOW, 8, 2, C - 12, 110)

# ======== SLOW · the fall (10–16): meteor rumble swells; plunge at 12.5; underwater stillness
chord(TRM, 10, 2.5, [C - 4, C, C + 3, C + 8], 80); ramp(TRM, 10, 12.4, 25, 125)
for i in range(18):
    note(TIM, 10 + i * 0.125, 0.12, C - 12, 40 + i * 4)
note(LOW, 10, 2.5, C - 16, 90)
note(TIM, 12.5, 2, C - 12, 127); note(DRM, 12.5, 2, 49, 100)
chord(CHO, 12.5, 3.5, [C + 3, C + 10, C + 15], 60); ramp(CHO, 12.5, 15.8, 70, 40)   # E♭, muffled under water
chord(STR, 12.5, 3.5, [C - 9, C + 3, C + 7], 55)
note(LOW, 12.5, 3.5, C - 21, 75)
for b, p in [(13.5, 87), (14.25, 91), (15, 94), (15.5, 99)]:
    note(CEL, b, 1.5, p, 55)

# ======== FAST · chemistry (16–20): pizzicato 16ths, a hit on each cut, the bite on 17
for i in range(15):
    note(PIZ, 16 + i * 0.25, 0.22, [75, 79, 82, 87, 82, 79][i % 6] - 12, 85 + (i % 2) * 10)
for i, b in enumerate(fast_cuts(16, 20)):
    cut_hit(b, i, (3, 10, 15, 7), 95)
hit(17, big=True)
note(GLK, 16, 0.6, 88, 95); note(GLK, 16.25, 0.6, 91, 90)        # H–O–H
for i in range(6):
    note(HRP, 17.75 + i * 0.125, 0.5, [58, 62, 65, 70, 74, 77][i] + 12, 85)
for i, b in enumerate([18.5, 18.625, 18.75, 18.875]):                # cells 1 → 2 → 4 → 8
    note(HRP, b, 0.4, 72 + 5 * i, 100)
for i in range(4):
    note(CEL, 19 + i * 0.125, 0.3, [96, 91, 99, 103][i], 80)          # synapse
chord(CHO, 19.5, 0.375, [C + 8, C + 12, C + 17], 85)                 # Eden
chord(STR, 16, 3.875, [C - 9, C + 3, C + 10], 70); ramp(STR, 16, 19.8, 70, 115)
note(LOW, 16, 3.875, C - 9, 95)

# ======== SLOW · the first eye (20–25): a slow pulse under water; at 22.5 everything stops — one note of light
for b in (20, 21, 22):
    note(TIM, b, 0.6, C - 12, 70); note(TIM, b + 0.25, 0.4, C - 12, 45)
chord(STR, 20, 2.5, [C - 12, C, C + 3, C + 7], 50); ramp(STR, 20, 22.4, 60, 30)
chord(CHO, 20, 2.5, [C + 12, C + 15], 40)
note(LOW, 20, 2.5, C - 24, 70)
note(CEL, 22.5, 2.5, 100, 95); note(GLK, 22.5, 2, 100, 45)          # first light
chord(CHO, 22.5, 1.5, [C + 24], 30)
chord(TRM, 23.75, 0.5, [C - 11, C - 4, C + 1], 60); ramp(TRM, 23.75, 24.25, 40, 125)
note(TIM, 24.25, 1.5, C - 12, 127); note(DRM, 24.25, 2, 49, 127); note(DRM, 24.25, 2, 57, 110); chord(HIT, 24.25, 0.5, [C - 11, C - 4, C + 1], 110)

# ======== MEDIUM · fire (25–29): taiko and horns; the fate motif on the flame test
for b, v in [(25, 110), (25.75, 85), (26, 100), (26.5, 120), (27, 120), (27.5, 120), (28, 125), (28.5, 95)]:
    note(TAI, b, 0.5, 48, v)
chord(STR, 25, 1.5, [C - 12, C, C + 3, C + 7], 75)
chord(HRN, 25, 1.5, [C, C + 7], 65)
note(LOW, 25, 1.5, C - 12, 95)
for b in (26.5, 27, 27.5):                                           # G G G
    chord(HRN, b, 0.45, [C + 7, C - 5], 118); chord(HIT, b, 0.3, [C - 5, C + 2, C + 7], 108)
    note(TIM, b, 0.45, C - 5, 118); note(LOW, b, 0.45, C - 17, 112)
chord(HRN, 28, 1, [C + 3, C - 9, C + 10], 122); chord(STR, 28, 1, [C - 9, C + 3, C + 7, C + 10, C + 15], 105)  # E♭
chord(CHO, 28, 1, [C + 15, C + 19, C + 22], 95); note(LOW, 28, 1, C - 21, 112); note(DRM, 28, 1.5, 49, 115)

# ======== FASTEST · civilization (29–37): cuts accelerate, organ/choir/brass climb a whole tone per bar-half
hit(29)
for i, b in enumerate(fast_cuts(29, 37)):
    cut_hit(b, i, (0, 7, 12, 3), 105)
for k, (b0, tr) in enumerate([(29, 0), (31, 2), (33, 4), (35, 6)]):
    tri = [C + tr, C + tr + 3, C + tr + 7]
    chord(ORG, b0, 2, [tri[0] - 12] + tri + [tri[0] + 12], 85 + k * 10)
    chord(CHO, b0, 2, [t + 12 for t in tri], 80 + k * 10)
    chord(HRN, b0, 2, [tri[0], tri[2]], 85 + k * 10)
    note(LOW, b0, 2, tri[0] - 12, 105)
    for i in range(8):
        note(STR, b0 + i * 0.25, 0.22, tri[i % 3] + 24, 80 + (i % 4 == 0) * 25)
    for i in range(4):
        note(DRM, b0 + i * 0.5, 0.25, 36, 120); note(DRM, b0 + i * 0.5 + 0.25, 0.2, 42, 80)
    note(DRM, b0 + 1, 0.3, 38, 110)
for i, b in enumerate((30, 30.208, 30.417, 30.625)):                 # oracle cracks
    note(TIM, b, 0.2, C - 10 + i * 2, 105)
for i in range(8):                                                    # the reprise: 32nd stutter
    b = 36 + i * 0.125
    chord(HIT, b, 0.1, [C + 6, C + 13, C + 18], 95 + (i % 2) * 25)
    note(DRM, b, 0.1, 38 if i % 2 else 36, 110)

# ======== SLOW · black hole (37–43): one long chord pulled down in pitch, then silence
hit(37)
chord(ORG, 37, 5.4, [C - 18, C - 6, C - 3, C + 1], 105)
chord(STR, 37, 5.4, [C - 6, C + 1, C + 6, C + 9], 90)
chord(CHO, 37, 5.4, [C + 6, C + 9, C + 13], 90)
note(LOW, 37, 5.4, C - 18, 110)
for ch in (STR, CHO, ORG):
    ramp(ch, 37, 42.4, 110, 60)
    for i in range(41):
        bend(ch, 38 + 4.4 * i / 40, -8192 * (i / 40) ** 2)
    bend(ch, 42.6, 0)

# ======== MEDIUM · descent and dream (43–51.5): piano optimizer, music-box lullaby, sheep fate motif
chord(STR, 43, 8.2, [C - 12, C, C + 3, C + 7], 55); ramp(STR, 43, 51, 65, 35)
note(LOW, 43, 8.2, C - 24, 65)
descent = [84, 82, 86, 80, 79, 82, 77, 75, 79, 74, 72, 75, 72, 71, 72]
b = 43.0
for i, p in enumerate(descent):
    d = 0.125 if i < 8 else 0.25 if i < 12 else 0.333
    note(PNO, b, d * 1.6, p, 88 - i * 2)
    b += d
chord(CHO, 45, 0.75, [C + 12, C + 15, C + 19], 85)
for i, p in enumerate([72, 75, 79, 75, 74, 72, 70, 72, 67, 72]):
    note(CEL, 45.75 + i * 0.15, 0.5, p + 12, 70)
for b in (47.25, 47.75, 48.25):                                       # G G G
    note(CEL, b, 0.45, 91, 108); note(PIZ, b, 0.4, 67, 95); note(GLK, b, 0.3, 91, 75); note(TIM, b, 0.3, C - 5, 80)
note(CEL, 48.75, 1.75, 87, 112); note(PIZ, 48.75, 1, 63, 95); chord(CHO, 48.75, 1.75, [C + 15, C + 19], 70)   # E♭
for i in range(6):
    note(CEL, 49.25 + i * 0.2, 0.3, 87 + [0, 3, 7, 12, 7, 3][i], 60 - i * 6)
note(PNO, 50.5, 0.75, 60, 80)

# ======== SLOW · awake (51.5–60): breath, the eye opens into C major, the bell, the loop
chord(STR, 53.3, 6.6, [C - 12, C, C + 4, C + 7, C + 12, C + 16], 85); ramp(STR, 53.3, 55, 30, 110); ramp(STR, 57.5, 59.9, 110, 15)
chord(CHO, 53.3, 6.5, [C + 12, C + 16, C + 19], 80); ramp(CHO, 53.3, 55, 25, 105); ramp(CHO, 57.5, 59.9, 105, 10)
note(LOW, 53.3, 6.5, C - 12, 80)
for i, p in enumerate([60, 64, 67, 72, 76, 79, 84]):
    note(HRP, 53.3 + i * 0.125, 2, p, 80)
for i, p in enumerate([79, 84, 88, 86, 84]):                          # the seed motif, now in major
    note(CEL, 54.5 + i * 0.5, 1.2, p, 72)
note(BEL, 56, 3, 72, 110); note(BEL, 56, 3, 60, 90); note(PNO, 56, 3, 36, 70)

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


for b in (8, 29, 37):
    add(b, boom(), 0.9)
add(17, boom(1.5, 70, 35), 0.6)
add(10, riser(2.4 * BEAT, 150, 7000), 0.4)          # meteor entry
add(12.5, boom(3, 55, 20), 1.0)                      # plunge
add(12.5, hp(rng.standard_normal(int(1.2 * SR)), 300) * np.exp(-np.arange(int(1.2 * SR)) / (0.25 * SR)), 0.35)  # splash
add(23.75, riser(0.5 * BEAT, 400, 8000), 0.3)
add(24.25, thunder(), 0.55)
add(25, crackle(4 * BEAT, 0.02), 0.25)               # torch
for b in (30, 30.208, 30.417, 30.625):
    add(b, hp(rng.standard_normal(1500), 2000) * np.exp(-np.arange(1500) / 300), 0.5, rng.uniform(-0.5, 0.5))
for s in TL['SHOTS']:                                # a whoosh into every zoom-through
    if s.get('tr') == 'zoom':
        add(s['s'] - 0.3, riser(0.3 * BEAT, 500, 9000), 0.22)
add(37, boom(3.5, 70, 16), 1.0)
add(39, riser(3.4 * BEAT, 300, 9000), 0.35)
add(43, shepard(8.2 * BEAT), 0.06)
add(51.5, breath(0.7), 0.4)
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

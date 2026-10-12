"""一次看懂元素周期表 — score and sound design, synced to src/elements/elements.json and table.json.
Run: python3 music/elements_data.py && python3 music/elements.py → public/elements_score.wav, out/elements_cues.md
(STEM_DIR=out/stems_el writes the levelled stems.)

120 BPM, 2-s bars, C major / A minor. One curious 4-bar leitmotif — a skip up to the octave and back, "question" ending on
the dominant, "answer" ending on the tonic — re-orchestrated per chapter:
  cold open: A-minor pizzicato ostinato + clock, building to the 5.9 slam (the answer chord) ·
  title: theme on marimba with the band · history: discovery groove; every tile that drops in plays a note ·
  Newlands: a do-re-mi octave that the room laughs at · Mendeleev: parlour piano + clarinet theme with three notes missing,
  played in when gallium, scandium and germanium are found · map: protons count up a scale, electrons fill a harp ·
  roll call: all 118 elements as notes, pitch = column, so every row is a rising run that starts over (the period) ·
  neighbourhoods: the band, a colour per district · cosmos: pads, strings, choir, a real inspiral chirp · ending: piano.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'elements', 'elements.json'), encoding='utf-8'))
TB = json.load(open(os.path.join(ROOT, 'src', 'elements', 'table.json'), encoding='utf-8'))
E = TB['elements']; EZ = {e['z']: e for e in E}
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
CU, HI, CO = J['cues'], J['hist'], J['cosmos']
sc = Score(DUR, SR, seed=118); rng = np.random.default_rng(118)
BEAT = 0.5
q16 = lambda t: round(t / 0.125) * 0.125
def note(part, s, d, p, v=80, h=0.005):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, v)
def chord(part, s, d, ps, v=76, h=0.005, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)

PNO, BASS, MAR, PIZ, STR, TRM, CHO, HRP, FL, CL, BSN, BRS, TBN, CEL, PLK, SUB, PAD, DR, VIB = (
    'piano', 'bass', 'marimba', 'pizz', 'strings', 'tremolo', 'choir', 'harp', 'flute', 'clarinet', 'bassoon', 'brass',
    'trombone', 'cello', 'pluck', 'sub', 'pad', 'drums', 'vibes')
PARTS = {
    PNO: SF2('piano', level=-17, verb=0.3), BASS: SF2('ms', 33, level=-19, verb=0.1), MAR: SF2('ms', 12, level=-18, verb=0.22),
    PIZ: SF2('ms', 45, level=-21, verb=0.3), STR: SF2('ms', 49, level=-22, verb=0.45), TRM: SF2('ms', 44, level=-24, verb=0.4),
    CHO: SF2('ms', 52, level=-22, verb=0.55), HRP: SF2('ms', 46, level=-20, verb=0.4), FL: SF2('ms', 73, level=-19, verb=0.35),
    CL: SF2('ms', 71, level=-19, verb=0.3), BSN: SF2('ms', 70, level=-21, verb=0.25), BRS: SF2('ms', 61, level=-21, verb=0.3, cap=104),
    TBN: SF2('ms', 57, level=-23, verb=0.25), CEL: SF2('ms', 42, level=-21, verb=0.35), VIB: SF2('ms', 11, level=-22, verb=0.35),
    PLK: Synth('pluck', level=-22, verb=0.25, bright=1.4, decay=3.2, length=0.4, lp=7000),
    SUB: Synth('sub', level=-23, verb=0.0, duck=0.4, cap=100), PAD: Synth('pad', level=-26, verb=0.45, duck=0.2, cutoff=1700, attack=0.6),
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, fallback_kit=0, level=-23, verb=0.12),
    'bed': Synth('pad', level=-28, verb=0.5, duck=0.15, cutoff=1300, attack=0.8),
}
# ── harmony (voicings around middle C) and the leitmotif
CH = {'C': (36, [60, 64, 67, 71]), 'Am': (45, [57, 60, 64, 67]), 'F': (41, [57, 60, 65, 69]), 'G': (43, [55, 59, 62, 65]),
      'Dm': (38, [57, 60, 62, 65]), 'Em': (40, [55, 59, 64, 67]), 'E7': (40, [56, 59, 62, 64]), 'Bb': (46, [58, 62, 65, 69])}
Q = [(0, .5, 76), (.5, .5, 79), (1, 1, 84), (2, .5, 83), (2.5, .5, 79), (3, 1, 76),
     (4, .5, 81), (4.5, .5, 79), (5, .5, 76), (5.5, .5, 74), (6, 2, 76),
     (8, .5, 77), (8.5, .5, 81), (9, 1, 84), (10, .5, 86), (10.5, .5, 84), (11, 1, 81)]
QUESTION = Q + [(12, 1, 83), (13, 1, 86), (14, 2, 79)]
ANSWER = Q + [(12, 1, 83), (13, .5, 86), (13.5, .5, 83), (14, 2, 84)]
H_Q = [(0, 'C'), (4, 'Am'), (8, 'F'), (12, 'G')]
H_A = [(0, 'C'), (4, 'Am'), (8, 'F'), (12, 'G'), (14, 'C')]
def harm(hs, b): return [n for x, n in hs if x <= b + 1e-6][-1]
def theme(part, t0, mel=ANSWER, v=80, tr=0, beats=(0, 16), skip=(), legato=0.95):
    for b, d, p in mel:
        if not beats[0] <= b < beats[1] or b in skip: continue
        note(part, t0 + (b - beats[0]) * BEAT, d * BEAT * legato, p + tr, v + (6 if b % 4 == 0 else 0))
def band(t0, beats, hs=H_A, v=0, drums=True, comp=PNO, bass=True, hat16=False, pad=True):
    """Bass on 1 and 3, comp stabs on the offbeats, kick/snare/hat — the groove under the theme."""
    for k in range(beats):
        s = t0 + k * BEAT; root, vo = CH[harm(hs, k % 16)]
        if bass and k % 2 == 0: note(BASS, s, 0.45, root + (7 if k % 4 == 2 else 0), 84 + v)
        if comp and k % 2 == 1: chord(comp, s + 0.25, 0.2, vo, 52 + v)
        if pad and k % 4 == 0: chord(PAD, s, 2.0, vo, 44 + v, h=0)
        if drums:
            if k % 2 == 0: note(DR, s, 0.2, 36, 92 + v)
            if k % 4 == 2: note(DR, s, 0.2, 38, 76 + v)
            note(DR, s + 0.25, 0.1, 42, 50 + v)
            if hat16: note(DR, s, 0.1, 42, 40 + v); note(DR, s + 0.125, 0.1, 42, 32 + v); note(DR, s + 0.375, 0.1, 42, 32 + v)
def hit(s, name='C', v=100, big=True):
    root, vo = CH[name]
    chord(PNO, s, 1.4, [p + 12 for p in vo[:3]] + [root + 12], v - 10); chord(STR, s, 2.2, vo, v - 20, h=0)
    note(BASS, s, 1.2, root, v - 6); note(SUB, s, 1.0, root - 12, v - 10); note(DR, s, 0.3, 36, v)
    if big: chord(BRS, s, 0.9, vo[:3], v - 22)
SCALE = [0, 2, 4, 5, 7, 9, 11]
def deg(i, base=60): return base + 12 * (i // 7) + SCALE[i % 7]

# ═══ S0 cold open (0–14): A-minor pizzicato ostinato + clock, a building line, the slam on 5.9
for k in range(int(9.9 / 0.25)):
    s = k * 0.25
    if s < 8.0: note(PIZ, s, 0.2, [45, 52, 57, 52][k % 4], 58 + int(10 * s / 8))
    else: note(PIZ, s, 0.12, [45, 52, 57, 60][k % 4], 72 + int(16 * (s - 8) / 2))
note(PNO, 0.0, 6.0, 33, 60); note(PNO, 6.0, 4.0, 33, 64)
chord(PNO, CU['density_show'], 1.6, [57, 60, 64, 71], 62)                       # 4.7: an A-minor add-9 question
chord(TRM, 6.0, 4.0, [45, 52, 57], 60); chord(STR, 8.0, 2.0, [57, 60, 64, 69], 70)
for k in range(16): note(DR, 8.0 + k * 0.125, 0.1, 38, 34 + k * 3)              # soft snare roll into the slam
hit(CU['slam'], 'C', 112)                                                        # 5.9 — the answer
chord(CHO, CU['slam'], 2.0, [60, 64, 67], 70)
theme(PNO, 12.0, QUESTION, 64, beats=(0, 4))                                    # 他是怎么知道的？ (one bar, a question)
# ═══ title (14–18): the theme with the band
theme(MAR, 14.0, ANSWER, 92, beats=(0, 8)); theme(PNO, 14.0, ANSWER, 70, tr=-12, beats=(0, 8))
band(14.0, 8, v=-2)
# ═══ S1 history (18–56)
band(18.0, 26, v=-6, comp=PNO)                                                    # 18–31: groove (question, answer…)
theme(CL, 18.0, QUESTION, 72, beats=(0, 16)); theme(FL, 26.0, ANSWER, 66, beats=(0, 10))
# every tile that drops in plays a marimba note from the chord of the moment
for e in E:
    a = e['appear']
    if 18.6 <= a < 36.8 or 50.6 <= a < 56:
        b = int((a - 18.0) / BEAT) % 16; root, vo = CH[harm(H_A, b)]
        p = vo[(e['z'] * 3) % len(vo)] + 12 + (12 if a > 50 else 0)
        note(PLK if a > 50 else MAR, a, 0.18, p, 70 if a < 25 else 62)
note(VIB, HI['p'], 1.8, 88, 70); chord(PAD, HI['p'], 2.4, [72, 76, 79], 50)          # 1669: phosphorus glows
for k in range(8): note(PIZ, 29.0 + k * 0.5, 0.3, [57, 60, 64, 62, 59, 62, 55, 59][k], 62)   # 没人说得清: thin out
# Newlands: drums stop; a do-re-mi octave on the keys; Li and Na are the same note; the room laughs; a sad trombone
for i, p in enumerate([60, 62, 64, 65, 67, 69, 71, 72]): note(PNO, CU['octave'] + i * 0.25, 0.3, p, 78)
chord(PNO, CU['octave'] + 2.0, 1.0, [60, 72], 84); chord(VIB, CU['octave'] + 2.0, 1.0, [60, 72], 70)
for i, (p, d) in enumerate([(58, .45), (57, .45), (56, .45), (55, 1.1)]): note(TBN, CU['laugh'] + 0.3 + i * 0.5, d, p, 56)
# Mendeleev (36.8–45.4): parlour piano + clarinet theme with the three "unknown" notes left out
for k in range(int((45.5 - 36.8) / BEAT)):
    s = 36.8 + k * BEAT
    root, vo = CH[harm(H_Q, (k + 2) % 16)]
    if k % 2 == 0: note(PNO, s, 0.4, root + 12, 64)
    else: chord(PNO, s, 0.3, vo, 48)
GAP_BEATS = (9, 10, 13)                                                       # C6, D6 and D6 — the three gaps
theme(CL, 38.0, QUESTION, 76, beats=(0, 16), skip=GAP_BEATS)
theme(PIZ, 38.0, QUESTION, 58, tr=-12, beats=(0, 16), skip=GAP_BEATS)
for i, (z, p) in enumerate([(31, 84), (21, 86), (32, 86)]):                    # found! each gap gets its note back
    t = HI['fill'][str(z)]
    note(MAR, t, 0.8, p, 100); note(PLK, t, 0.6, p + 12, 80); chord(STR, t, 1.0, [60, 64, 67] if i < 2 else [62, 67, 71], 70); note(DR, t, 0.2, 36, 80)
chord(CL, 48.6, 0.25, [72], 80); theme(CL, 48.75, ANSWER, 70, beats=(12, 16))   # 名字，都是国名 (a cheeky tag)
# 50.6–56: the modern rush: hats in sixteenths, choir for the noble gases, the arrival hit
band(50.0, 12, v=-4, hat16=True, comp=PLK)
chord(CHO, HI['ng'][0], 2.0, [64, 67, 71, 76], 64)
hit(55.5, 'C', 108)

# ═══ S2 the map (56–104)
for k in range(16):                                                          # 56–64: calm arpeggio, pad
    s = 56.0 + k * BEAT; root, vo = CH[['C', 'Am', 'F', 'G'][k // 4]]
    note(HRP, s, 0.9, vo[k % 4] + 12, 60); note(HRP, s + 0.25, 0.6, vo[(k + 2) % 4] + 12, 50)
    if k % 4 == 0: chord(PAD, s, 2.0, vo, 46, h=0); note(BASS, s, 1.8, root, 70)
for z in range(1, 9): note(MAR, 59.4 + (z - 1) * 0.5, 0.4, deg(z - 1, 72), 88)  # one proton, one note up the scale
for k in range(24): note(PLK, 61.8 + k * 0.075, 0.12, deg(7 + k, 72), 72)         # … all the way to 118
for k in range(16):                                                          # 64–72: electrons fill shells (harp)
    s = 64.0 + k * BEAT; root, vo = CH[['C', 'F', 'Am', 'G'][(k // 4) % 4]]
    if k % 4 == 0: chord(PAD, s, 2.0, vo, 44, h=0); note(BASS, s, 1.8, root, 70); note(DR, s, 0.2, 36, 70)
for i in range(18):                                                          # each electron arriving = a harp note
    s = 64.6 + (68.8 - 64.6) * i / 17; shell = 0 if i < 2 else 1 if i < 10 else 2
    note(HRP, q16(s), 0.5, [72, 76, 79][shell] + (i % 3) * 2, 70)
for r in range(7): chord(MAR, 67.2 + r * 0.3, 0.3, [deg(r, 60), deg(r + 2, 60)], 76)   # each row: a step up
for i, base in enumerate([48, 60, 72]):                                      # Li, Na, K: the same little motif, three octaves
    s = 69.8 + i * 0.5
    for j, d in enumerate([0, 4, 7]): note(VIB, s + j * 0.125, 0.3, base + d, 80)
for k in range(8): note(BASS, 70.0 + k * 0.5, 0.4, [36, 43][k % 2], 70); note(DR, 70.0 + k * 0.5, 0.2, 36 if k % 2 == 0 else 42, 60)
for k in range(12): note(HRP, 75.4 + k * 0.15, 0.4, deg(k, 55), 70)               # unfold: harp up
for k in range(12): note(HRP, 79.4 + k * 0.1, 0.3, deg(11 - k, 55), 62)            # fold back: harp down
note(TBN, 77.2, 1.4, 43, 60); note(TBN, 77.2, 1.4, 31, 54)                          # 太宽了 (a low brass groan)
for i, p in enumerate([60, 67, 64, 72]): note(MAR, 80.4 + i * 0.12, 0.5, p, 80)     # s · d · p · f
for k in range(4): note(DR, 82.5 + k * 0.125, 0.1, 38, 50 + k * 8)                  # pickup into the roll call
# ROLL CALL (83–103.5): each element is a note; pitch follows its column in the long table → every row rises and starts over
ROW_CH = {1: 'C', 2: 'Am', 3: 'F', 4: 'G', 5: 'C', 6: 'Am', 7: 'G'}
for e in E:
    t = e['roll']; step = 0.25 if e['period'] <= 3 else 0.125
    i = int(round(e['lx'] / 31 * 20))
    p = deg(i, 60)
    if e['f'] is not None: p = 66 + e['f']                                       # f-block: a chromatic flurry
    note(MAR, t, step * 1.6, p, 86 if e['fam'] != 'ng' else 104)
    note(PLK, t, step, p + 12, 66)
    if e['fam'] == 'ng' or e['z'] == 118:                                       # every row lands on a noble gas
        name = ROW_CH[e['period']]; root, vo = CH[name]
        chord(STR, t, 0.6, vo, 76); chord(PNO, t, 0.5, [x + 12 for x in vo[:3]], 74); note(DR, t, 0.2, 36, 96)
roll_rows = {}
for e in E: roll_rows.setdefault(e['period'], []).append(e['roll'])
for r, ts in roll_rows.items():                                             # under each row: bass, kick, hats
    a, b = min(ts), max(ts); root, vo = CH[ROW_CH[r]]
    k = 0; s = a
    while s < b + 0.01:
        note(BASS, s, 0.22, root + (12 if k % 2 else 0), 80); note(DR, s, 0.1, 42, 44);
        if k % 2 == 0: note(DR, s, 0.2, 36, 80)
        if k % 4 == 0: chord(PAD, s, 1.0, vo, 44, h=0)
        s += 0.25; k += 1
hit(TB['roll_end'], 'C', 110)

# ═══ S3 neighbourhoods (104–158): the band, a colour per district
band(104.0, 108, v=-4, comp=PNO)
mel = {'h': (FL, 0), 'alk': (BRS, -12), 'ae': (MAR, 0), 'tm': (MAR, 0), 'ln': (PLK, 0), 'nm': (PNO, 12), 'hal': (BSN, -24), 'ng': (CHO, 0), 'an': (CEL, -24)}
t = 106.0
while t < 158.0 - 1e-6:                                                      # the theme keeps going, re-voiced per district
    d = next(x for x in J['hood'] if x['t'] - 0.3 <= t + 0.01 < x['out'] + 0.3) if any(x['t'] - 0.3 <= t + 0.01 < x['out'] + 0.3 for x in J['hood']) else J['hood'][0]
    part, tr = mel[d['id']]
    b0 = int(round((t - 106.0) / BEAT)) % 16
    for b, du, p in (QUESTION if (int((t - 106.0) / 8) % 2 == 0) else ANSWER):
        if b == b0: note(part, t, du * BEAT * 0.95, p + tr, 76 if part not in (CHO, CEL) else 64)
    t += 0.25
note(DR, CU['na_drop'] + 0.45, 0.2, 36, 100); chord(BRS, CU['na_drop'] + 0.5, 0.4, [60, 64, 67], 92)   # 砰！
for k in range(8): note(PLK, 113.5 + k * 0.125, 0.15, deg(k * 2, 72), 70)            # Li: charging up
for i, t0 in enumerate(CU['fireworks']): note(PLK, t0 - 0.4, 0.4, 84 + i * 3, 50)     # a little rise before each burst
for tool in J['tools']: note(MAR, tool['t'], 0.4, 84, 90); note(DR, tool['t'], 0.2, 38, 70)
for k in range(6): note(PLK, 133.5 + k * 0.33, 0.25, 48, 60)                         # phone buzz pulses
for k in range(4): note(PIZ, 142.6 + k * 0.25, 0.15, [45, 48, 51, 52][k], 80)         # sneaky thief
chord(CHO, 147.4, 2.0, [64, 69, 71, 76], 60); chord(PAD, 149.4, 2.6, [60, 64, 67, 72], 50)
chord(CEL, 152.4, 3.5, [36, 43], 70); chord(TRM, 152.4, 5.5, [48, 55, 58], 58)
# ═══ S4 cosmos (158–178): drums out; pads, strings, choir; the Big Bang, stars, the chirp, the merger
chord(PAD, 158.0, 2.4, [57, 60, 64, 67], 50); chord(STR, 158.0, 2.4, [45, 52, 57], 56)
note(SUB, CO['bb'], 2.5, 24, 110); chord(STR, CO['bb'], 2.6, [36, 43, 48, 55, 60, 64], 84); chord(CHO, CO['bb'] + 0.1, 2.5, [60, 64, 67], 70)
for k in range(10):                                                          # stars: strings climbing
    s = CO['stars'] + k * 0.5; root, vo = CH[['C', 'Em', 'F', 'G', 'Am'][k // 2]]
    note(STR, s, 0.6, vo[k % 4] + 12, 66); note(HRP, s + 0.25, 0.4, vo[(k + 1) % 4] + 12, 56)
    if k % 2 == 0: note(BASS, s, 1.0, root, 70); chord(PAD, s, 1.0, vo, 46, h=0)
note(DR, 165.8, 0.3, 36, 92); chord(BRS, 165.8, 0.8, [55, 60, 64], 80)               # supernova
chord(PAD, CO['chirp'][0], 2.6, [57, 60, 64], 40)                                     # the chirp gets the floor
hit(CO['ns'], 'C', 108); chord(CHO, CO['ns'], 3.0, [60, 64, 67, 72], 76)
for k, nm in enumerate(['F', 'G', 'Am', 'F', 'C', 'G', 'C']):                    # 171–178: warm progression; "older than the Earth"
    s = 172.0 + k * 1.0; root, vo = CH[nm]
    chord(STR, s, 1.0, vo, 64, h=0); note(BASS, s, 0.9, root, 70)
theme(STR, 176.0, ANSWER, 66, tr=-12, beats=(12, 16))
# ═══ S5 ending (178–192): piano alone; the gap; the end card
theme(PNO, 178.0, QUESTION, 64, beats=(0, 8)); chord(PAD, 178.0, 4.0, [60, 64, 67], 40)
for i, p in enumerate([79, 84]): note(VIB, CU['q119'] + i * 0.25, 0.4, p, 70)          # 119? 120?
theme(PNO, 184.0, QUESTION, 62, beats=(8, 16), skip=(13,))                            # the gap, still there
chord(PNO, 186.5, 1.5, [60, 64, 67, 72], 60)
theme(MAR, 188.5, ANSWER, 82, beats=(8, 16)); theme(PNO, 188.5, ANSWER, 64, tr=-12, beats=(8, 16))
band(188.5, 3, v=-10, drums=False)
hit(190.0 + 0.5, 'C', 92, big=False)

# a soft continuous bed under everything (C Am F G every 8 s), so no stretch of the film falls into silence
for bar in range(int(DUR // 2)):
    s0 = bar * 2.0
    if s0 < 2.0 or s0 > 190: continue
    nm = ['C', 'Am', 'F', 'G'][bar % 4] if not (0 <= s0 < 10) else 'Am'
    chord('bed', s0, 2.05, CH[nm][1], 50, h=0)
# quiet stretches get a light piano comp too (map explanations, the fold, the ending's question)
for a, b in [(72.0, 75.0), (76.5, 79.5), (181.5, 184.0), (186.5, 188.5)]:
    k = 0; s0 = a
    while s0 < b - 1e-6:
        root, vo = CH[['C', 'Am', 'F', 'G'][int(s0 // 2) % 4]]
        note(PNO, s0, 0.45, vo[k % 4], 46); note(BASS, s0, 0.9, root, 58) if k % 4 == 0 else None
        s0 += 0.5; k += 1
music_dry, stems = sc.render(PARTS, kick_part=DR)
music = music_dry

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
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_tile(seed=0, f=1500):                    # a ceramic tile set down: a short knock with a pitched body
    n = int(0.09 * SR); t = np.arange(n) / SR
    k = sosfilt(butter(2, [f * 0.6, f * 2.2], 'band', fs=SR, output='sos'), noise(n, seed)) * env(n, 0.0005, 0.012)
    body = np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.025)
    return st(k + 0.5 * body)
def s_drop():                                  # a falling pluck (in key), softer than a library water drop
    n = int(0.16 * SR); t = np.arange(n) / SR; f = 1046 - (1046 - 700) * (1 - np.exp(-t / 0.02))
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05))
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12):
    n = int(dur * SR); t = np.arange(n) / SR
    return st(lp(sosfilt(butter(2, [300, 3000], 'band', fs=SR, output='sos'), noise(n, seed)), 4000) * (t / dur) ** 2.2)
def s_chirp(t0, t1):
    """A gravitational-wave style inspiral: frequency rises as (tc - t)^(-3/8), amplitude as f^(2/3); shifted up to be heard."""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; tc = (t1 - t0) + 0.004
    f = 38 * ((tc) / (tc - t)) ** (3 / 8); f = np.minimum(f, 900)
    a = (f / f[0]) ** (2 / 3); a /= a.max()
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * a
    x = x + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * a
    fo = int(0.02 * SR); x[-fo:] *= np.linspace(1, 0, fo)
    return st(x)
def s_buzz(dur=2.2):                           # a phone on vibrate
    n = int(dur * SR); t = np.arange(n) / SR
    g = (np.sin(2 * np.pi * 1.5 * t) > 0).astype(float); g = np.convolve(g, np.ones(480) / 480, 'same')
    return st(lp(np.sign(np.sin(2 * np.pi * 150 * t)) * 0.4 + np.sin(2 * np.pi * 150 * t), 1200) * g)
def s_neon(dur=1.8):                           # a neon tube's soft hum
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t) + 0.15 * sosfilt(butter(2, [1500, 3000], 'band', fs=SR, output='sos'), noise(n, 4))
    return st(x * np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.3))

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
L = {k: trim(lib(k)) for k in (1063, 1530, 2369, 2001, 2002, 1101, 1489, 2605, 1120, 424, 754, 1694, 2989, 2365, 498, 2299, 774, 163, 790, 168, 2856, 1317)}

# cold open
for k in range(int(9.9 / 0.5)): put(k * 0.5, L[1063][:int(0.12 * SR)], -36 + (k * 0.2), 'clock tick (1063)', 'the lab clock' if k == 0 else '')
put(1.0, L[1120], -32, 'pop_soft (1120)', 'the metal sample appears')
put(CU['density_show'], L[2856], -31, 'gear lock (2856)', 'the density meter clicks to 4.7')
put(CU['letter_in'], L[1530], -26, 'paper slide (1530)', 'the letter slides in')
put(6.2, L[2369], -31, 'pencil scribble (2369)', 'the letter writes itself', maxlen=0.8); put(7.0, L[2369], -31, 'pencil scribble (2369)', '…应该是 5.9', maxlen=0.8)
put(8.6, L[790], -31, 'riser (790)', 'remeasure: rising into the slam', maxlen=1.4)
put(CU['slam'], L[498], -22, 'deep_hit (498)', 'SLAM: 5.9'); put(CU['slam'], s_thump(110, 55, 0.3), -24, 'low thump (synth)', 'the needle lands')
put(CU['to_grid'][0], s_swell(1.0), -30, 'air swell (synth)', 'the letter becomes the grid')
put(CU['title'], L[2605], -28, 'air_quick (2605)', 'title tiles drop', align='peak')
for i in range(5): put(14.1 + i * 0.09 + 0.18, s_tile(i, 900 + i * 80), -27, 'tile knock (synth)', 'title tile lands')
# history: every tile drops with a knock; Mendeleev's cards; the room laughs at Newlands
for e in E:
    a = e['appear']
    if 18.6 <= a < 56: put(a + 0.12, s_tile(e['z'], 1200 + (e['z'] * 37) % 900), -31 if a < 50 else -33, 'tile knock (synth)', f"{e['s']} drops in" if e['z'] in (6, 15, 31, 21, 32, 2, 118) else '')
put(HI['p'], L[1317], -30, 'bubble (1317)', '1669: phosphorus, from urine')
put(CU['laugh'], lp(L[424], 6000), -29, 'crowd laugh (424)', 'Newlands is laughed at', maxlen=2.2)
put(36.8, L[1101], -29, 'book paging (1101)', 'the table lifts into a deck of cards', maxlen=0.9)
lays = sorted(e['lay'] for e in E if e['lay'])
for i, t0 in enumerate(lays[::3]): put(t0, L[2001], -33 - (i % 3), 'card placement (2001)', 'Mendeleev lays a card' if i == 0 else '', pan=((i % 5) - 2) * 0.15)
for i in range(3): put(41.6 + i * 0.25, L[1120], -32, 'pop_soft (1120)', 'a gap lights up with "?"' if i == 0 else '')
for i in range(3): put(CU['predict'] + i * 0.25, L[2002], -32, 'card flick (2002)', 'prediction card' if i == 0 else '')
for z in ('31', '21', '32'): put(HI['fill'][z], s_thump(120, 70, 0.2), -26, 'tile thump (synth)', f'gap filled: {EZ[int(z)]["s"]}')
for z in ('31', '21', '32'): put(HI['fill'][z] + 0.15, L[2001], -31, 'card placement (2001)', 'name chip lands')
put(55.5, L[2299], -26, 'bass_hit (2299)', '118 — all present')
# map
for z in range(1, 9): put(59.4 + (z - 1) * 0.5, L[1120], -33, 'pop_soft (1120)', 'a proton pops in' if z == 1 else '')
put(61.8, L[790], -33, 'riser (790)', 'counting up to 118', maxlen=1.8)
put(75.4, L[1489], -27, 'whoosh_air (1489)', 'the table unfolds to 32 columns', align='peak'); put(79.6, L[1489], -29, 'whoosh_air (1489)', 'folds back', align='peak', rate=1.2)
for i in range(4): put(80.4 + i * 0.12, L[2001], -32, 'card placement (2001)', 's/d/p/f labels' if i == 0 else '')
# roll call: the music *is* the sound; a soft tile tick doubles each element
for e in E: put(e['roll'], s_tile(e['z'] + 300, 1700), -38, 'tile tick (synth)', 'roll call: each element' if e['z'] == 1 else '')
# neighbourhoods
for d in J['hood']: put(d['t'], L[1489], -31, 'whoosh_air (1489)', f"camera flies to {d['name']}", align='peak', rate=1.1)
put(CU['na_drop'], s_drop(), -30, 'drop pluck (synth)', 'sodium falls'); put(CU['na_drop'] + 0.45, L[754], -27, 'splash (754)', 'into the water')
put(CU['na_drop'] + 0.5, lp(L[1694], 5000), -25, 'short explosion, low-passed (1694)', '砰！')
put(113.5, L[2365], -33, 'electric_pop (2365)', 'Li battery charges')
for i, t0 in enumerate(CU['fireworks']): put(t0, lp(L[2989], 6000), -28 - i, 'fireworks bang (2989)', 'firework: Sr red / Ba green' if i < 2 else 'both', maxlen=1.6)
for tool in J['tools']: put(tool['t'], s_tile(tool['z'], 800), -29, 'tile knock, low (synth)', f"tool: {tool['label']}"); put(tool['t'], L[2001], -33, 'card (2001)', '')
put(133.4, s_buzz(2.2), -33, 'phone vibrate (synth)', 'Nd magnet: phone buzzes')
put(143.0, L[2605], -32, 'air_quick (2605)', 'the electron is snatched', align='peak')
put(147.6, s_neon(1.8), -34, 'neon hum (synth)', 'NEON sign')
put(150.2, L[2856], -33, 'gear lock (2856)', 'the yellow line appears')
put(154.4, L[1120], -32, 'pop_soft (1120)', 'smoke detector')
# cosmos
put(158.0, s_swell(1.6, 20), -29, 'air swell (synth)', 'into the night')
put(CO['bb'], L[774], -24, 'impact_space (774)', 'the Big Bang')
put(CO['stars'], L[168], -30, 'sweep_air (168)', 'stars ignite', align='onset')
put(165.8, L[2299], -26, 'bass_hit (2299)', 'a star explodes')
put(CO['chirp'][0], s_chirp(*CO['chirp']), -26, 'inspiral chirp (synth, f ∝ (tc−t)^−3/8)', 'two neutron stars spiral in')
put(CO['ns'], L[774], -21, 'impact_space (774)', 'they collide: gold'); put(CO['ns'], L[498], -25, 'deep_hit (498)', 'merger body')
put(CO['hm'], L[2365], -32, 'electric_pop (2365)', 'human-made: the lab')
# ending
put(CO['back'][0], s_swell(1.4, 30), -31, 'air swell (synth)', 'back to the paper')
for i in range(18): put(CU['ghost_row'] + i * 0.05, s_tile(i + 500, 2000), -38, 'tile tick (synth)', 'row 8 appears' if i == 0 else '')
put(CU['q119'], L[1120], -31, 'pop_soft (1120)', '119? 120?')
put(CU['endcard'], L[2605], -29, 'air_quick (2605)', 'end card', align='peak')
for i in range(5): put(CU['endcard'] + 0.1 + i * 0.08 + 0.2, s_tile(i + 40, 900 + i * 80), -29, 'tile knock (synth)', 'title tile lands' if i == 0 else '')

SFX = lp(SFX, 9500)
ir = sc.ir
sfx_mix = SFX + 0.15 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)

# the chirp gets the floor: the band dips under it; the music fades to silence at the end
dk = np.ones(N)
a, b = int(CO['chirp'][0] * SR), int(CO['ns'] * SR); dk[a:b] = 10 ** (-6 / 20)
dk = np.convolve(dk, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same'); music = music * dk[:, None]
if os.environ.get('STEM_DIR'):
    os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
    for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_music.wav'), music.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_sfx.wav'), sfx_mix.astype(np.float32), SR)
x = music + sfx_mix
x = x + 0.4 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 0.8) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'elements_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
# a sound-effects-only version for posting with a platform track
y = sfx_mix * 10 ** ((LU - LU) / 20); y = y / (np.abs(y).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'elements_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')

def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {int(t // 2) + 1}.{(t % 2) / BEAT + 1:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
hdr = ('# 元素周期表 — cue sheet (generated by music/elements.py)\n\nEvery time comes from src/elements/elements.json and table.json, '
       'the same files the picture reads. Bars are 2 s (120 BPM). "vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}.\n\n'
       '| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'elements_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav')); print(f'sfx {i}: hf {an["hf"]:.3f} tonal {an["tonal"]:.2f} ring {an["ring"]} harsh={harsh(an)}')
print('wrote public/elements_score.wav, out/elements_sfx_only.wav and out/elements_cues.md')

"""元素周期表 = 宇宙的配料表 (60 s) — score and sound design, synced to src/elements60/e60.json and t60.json.
Run: python3 music/elements60_data.py && python3 music/elements60.py
  → public/elements60_score.wav, out/elements60_sfx_only.wav, out/elements60_cues.md

The music: the same 8-bar theme as the long film (C major, I – V⁶ – vi – IV | ii⁷ – iii⁷ – IV – iv – I), at 120 BPM.
  · the opening label: each ingredient row plays the next note of the theme (E G C B A G); the reveal is a brass "ta-da";
    the three quick labels are stabs (Am, F, G); 118 tiles land as one rising glissando; the title plays the theme's head
  · 怎么读: protons count up the scale; electron shells climb on the harp; each row of the table, played in order, is a
    rising run that lands on a noble-gas accent — seven runs on seven beats: the period, audible
  · 反常识: the band and the theme's first phrase; each surprise gets its own gesture (gases bloop up, liquids slide
    down, towers swell, years tick, gaps go silent and are filled by the theme's missing notes)
  · 产地: the drums drop out; strings, horns and choir on the theme; a gravitational-wave chirp; the merger lands on F
  · ending: the second phrase; F → F minor on 「你体内的氢，和宇宙一样老」, home to C; then the theme's head with its
    top note still missing, and a last chord that keeps one note open (C add 9): 未完待续
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import Score
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh
from elements_score import (PARTS, BEAT, CH, THEME, harm, PNO, BASS, CB, MAR, PIZ, STR, STRF, TRM, CHO, HRP, FL, CL, BSN, HRN,
                            TBN, TIMP, PLK, SUB, PAD, BED, DR, VIB)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'elements60', 'e60.json'), encoding='utf-8'))
TD = json.load(open(os.path.join(ROOT, 'src', 'elements60', 't60.json'), encoding='utf-8'))
E = TD['elements']; EZ = {e['z']: e for e in E}
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
HK, RD, ST, ML, YR, GP, AB, RA, YT, HE, MD, CO, EN = (J[k] for k in ('hook', 'read', 'state', 'melt', 'years', 'gaps', 'abund', 'rare', 'ytterby', 'helium', 'made', 'cosmos', 'end'))
LENS = {l['id']: l for l in J['lens']}

sc = Score(DUR, SR, seed=60)
rng = np.random.default_rng(60)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.004, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
def theme(part, t0, beats=(0, 32), v=80, tr=0, skip=(), legato=0.95, swell=0):
    """Play the theme with beat b at t0 + b·BEAT (so t0 is where beat 0 would fall)."""
    for b, d, p in THEME:
        if not beats[0] <= b < beats[1] or b in skip: continue
        vv = v + (6 if b % 4 == 0 else 0) + swell * (b - beats[0]) / max(1, beats[1] - beats[0])
        note(part, t0 + b * BEAT, d * BEAT * legato, p + tr, vv)
def hit(s, name='C', v=104, brass=True, timp=True, choir=False):
    root, vo = CH[name]
    chord(PNO, s, 1.4, [p + 12 for p in vo[:3]] + [root + 12], v - 14); chord(STR, s, 1.6, vo, v - 18, h=0)
    note(CB, s, 1.4, root, v - 10); note(SUB, s, 1.0, root - 12, v - 10)
    if timp: note(TIMP, s, 0.8, root if root < 48 else root - 12, v)
    if brass: chord(HRN, s, 0.9, vo[:3], v - 22)
    if choir: chord(CHO, s, 1.8, vo, v - 36)
def stab(s, name, v=92, d=0.35):
    root, vo = CH[name]
    chord(STRF, s, d, vo, v - 10, h=0); chord(HRN, s, d, vo[:3], v - 20); chord(PNO, s, d, [p + 12 for p in vo[:3]], v - 16)
    note(BASS, s, d + 0.1, root, v - 12); note(DR, s, 0.2, 36, v)
def groove(t0, t1, v=0, hat16=True, snare=True, kick='four'):
    k = 0; s = t0
    while s < t1 - 1e-6:
        if kick == 'four' or (kick == 'two' and k % 2 == 0): note(DR, s, 0.2, 36, 88 + v)
        if snare and k % 2 == 1: note(DR, s, 0.2, 38, 70 + v)
        note(DR, s + 0.25, 0.1, 42, 46 + v)
        if hat16: note(DR, s + 0.125, 0.08, 42, 28 + v); note(DR, s + 0.375, 0.08, 42, 30 + v)
        k += 1; s = t0 + k * BEAT
def bassline(t0, t1, name_at, v=0):
    """Eighth-note bass on the chord root with an octave pop on the off-beats."""
    k = 0
    while t0 + k * 0.25 < t1 - 1e-6:
        s = t0 + k * 0.25; root = CH[name_at(s)][0]
        note(BASS, s, 0.22, root + (12 if k % 4 == 3 else 0), 70 + v - (8 if k % 2 else 0)); k += 1
def pad(s, d, name, v=46): chord(PAD, s, d, CH[name][1], v, h=0)
def ladder(name, lo=60, octs=3): return sorted({p + 12 * o for o in range(octs) for p in CH[name][1] if lo - 1 <= p + 12 * o <= lo + 12 * octs})

# ═══ the opening (0–8): the label's rows play the theme's first notes; the reveal; three stabs; the rain; the title
hit(0.0, 'C', 108, brass=True, timp=True)
for tr, p, nm in zip(HK['rows'], [76, 79, 84, 83, 81, 79], ['C', 'C', 'C', 'G/B', 'G/B', 'G/B']):
    note(MAR, tr, 0.4, p, 98); note(PLK, tr, 0.3, p + 12, 62); note(PNO, tr, 0.4, p, 70)
pad(0.0, 1.0, 'C', 44); pad(1.0, 1.0, 'G/B', 44)
bassline(0.0, 2.0, lambda s: 'C' if s < 1.0 else 'G/B', v=-6)
for k in range(4): note(DR, k * 0.5, 0.2, 36, 80 if k else 100); note(DR, k * 0.5 + 0.25, 0.08, 42, 40)
# the reveal: a brass "ta-da" (G → C)
chord(HRN, HK['reveal'] - 0.12, 0.12, [55, 59, 62], 84); chord(TBN, HK['reveal'] - 0.12, 0.12, [43, 47], 74)
hit(HK['reveal'], 'C', 104, brass=True, timp=False); chord(HRN, HK['reveal'], 0.8, [60, 64, 67], 92); chord(TBN, HK['reveal'], 0.8, [48, 52], 80)
note(DR, HK['reveal'], 0.2, 38, 90)
groove(HK['reveal'] + 0.5, HK['merge'], v=-4)
bassline(HK['reveal'] + 0.5, HK['merge'], lambda s: 'C' if s < 3.0 else 'Am' if s < 3.75 else 'F' if s < 4.5 else 'G')
for s0, nm in zip(HK['labels'], ['Am', 'F', 'G']): stab(s0, nm, 96); pad(s0, 0.75, nm, 46)
# the rain: 118 tiles land as one rising glissando over a G pedal; a snare roll into the hit
pent = [p + 12 * o for o in range(4) for p in (60, 62, 64, 67, 69)][:19]
for i, e in enumerate(sorted(E, key=lambda e: e['rain'])):
    p = pent[min(len(pent) - 1, int(i / 118 * len(pent)))]
    note(HRP, e['rain'], 0.3, p, 52 + i // 6); note(PLK, e['rain'], 0.12, p + 12, 30 + i // 8)
chord(STR, HK['merge'], 1.5, [43, 55, 62, 67], 58, h=0); note(CB, HK['merge'], 1.5, 31, 66); pad(HK['merge'], 1.5, 'G', 44)
for k in range(12): note(DR, HK['rain'][0] + 0.25 + k * 0.0833, 0.06, 38, 34 + k * 5)
hit(HK['n118'], 'C', 112, choir=True)
# the title: the theme's head on brass and strings; its C lands on the first beat of chapter 01
for b, p in ((0, 76), (1, 79)): t0 = HK['title'] + b * 0.5; note(HRN, t0, 0.45, p - 12, 86); note(STR, t0, 0.5, p, 80); note(PNO, t0, 0.45, p, 78); note(MAR, t0, 0.4, p, 82)
for k in range(2): note(DR, HK['title'] + k * 0.5, 0.2, 36, 86); note(DR, HK['title'] + k * 0.5 + 0.25, 0.1, 42, 44)
for k in range(4): note(DR, HK['title'] + 1.0 + k * 0.0 - 0.25 + k * 0.0625, 0.06, 38, 50 + k * 8)
pad(HK['title'], 1.0, 'G', 48); note(BASS, HK['title'], 0.9, 43, 80)

# ═══ 01 how to read it (8–18)
A1 = lambda s: 'C' if s < 10 else 'G/B' if s < 12 else 'Am' if s < 14 else 'F' if s < 15 else 'G' if s < 16 else 'Am' if s < 17 else 'G'
hit(RD['start'], 'C', 100, brass=True); note(HRN, RD['start'], 0.9, 72, 88); note(STR, RD['start'], 0.9, 84, 82); note(MAR, RD['start'], 0.6, 84, 92)
groove(RD['start'], RD['end'], v=-6); bassline(RD['start'], RD['end'], A1, v=-4)
for s0 in np.arange(RD['start'], RD['end'], 2.0): pad(s0, 2.0, A1(s0), 42)
for p, tp in zip([72, 76, 79], RD['protons']): note(MAR, tp, 0.45, p, 96); note(PLK, tp, 0.3, p + 12, 58)
for k in range(20): note(PLK, RD['count'][0] + k * 0.025, 0.1, 72 + [0, 2, 4, 7, 9][k % 5] + 12 * (k // 10), 50 + k)
for i in range(7):
    s0 = RD['rings'] + i * RD['ringStep']; vo = ladder('G/B', 67)
    note(HRP, s0, 0.6, vo[min(len(vo) - 1, i + 1)], 72); note(VIB, s0, 0.5, vo[min(len(vo) - 1, i + 1)], 48)
hit(RD['col1'], 'Am', 96, brass=False); chord(TBN, RD['col1'], 0.8, [45, 52, 57], 84); note(TIMP, RD['col1'], 0.6, 45, 96)
chord(CHO, RD['col18'], 1.0, [64, 69, 72, 76], 70); chord(STR, RD['col18'], 1.0, [69, 72, 76], 58, h=0)
# the glissandi: every element a note; pitch = position in the long table (each row rises and starts over)
ROWCH = ['F', 'F', 'G', 'G', 'Am', 'Am', 'G']
for e in E:
    nm = ROWCH[e['period'] - 1]; L = ladder(nm, 57, 3)
    p = L[int(round(e['lx'] / 31 * (len(L) - 1)))]
    v = 64 if e['period'] <= 3 else 52
    note(MAR, e['gl'], 0.18, p, v + (24 if e['fam'] == 'ng' else 0)); note(PLK, e['gl'], 0.1, p + 12, 34)
    if e['fam'] == 'ng':
        chord(STRF, e['gl'], 0.3, [x + 12 for x in CH[nm][1][:3]], 70, h=0); note(VIB, e['gl'], 0.4, p + 12, 66)
for s0, nm in zip(RD['rows'], ROWCH): note(CB, s0, 0.45, CH[nm][0], 70)
stab(RD['period'], 'G', 98); chord(HRN, RD['period'], 0.45, [55, 59, 62, 65], 86)
for k in range(8): note(DR, RD['period'] + 0.0625 * k, 0.05, 38, 50 + k * 6)

# ═══ 02 nine surprises (18–41): the theme's first phrase twice, a build to the cosmos
A2 = lambda s: {0: 'C', 1: 'G/B', 2: 'Am', 3: 'F'}[int(((s - 18.0) % 8) // 2)] if s < 26 or 30 <= s < 38 else (
    'Am' if s < 27.5 else 'C' if s < 28 else 'Am' if s < 28.5 else 'F' if s < 29 else 'C' if s < 30 else 'Dm7' if s < 39 else 'G')
hit(18.0, 'C', 104, choir=True)
groove(18.0, 26.0, v=-4); bassline(18.0, 26.0, A2)
groove(29.0, 38.0, v=-4); bassline(29.0, 38.0, A2)
theme(FL, 18.0, (0, 16), 80); theme(VIB, 18.0, (0, 16), 56, tr=12); theme(STR, 18.0, (0, 16), 50, tr=-12, legato=1.0)
for s0 in np.arange(18.0, 26.0, 2.0): pad(s0, 2.0, A2(s0), 44)
theme(STR, 30.0, (0, 16), 72, legato=1.0, swell=10); theme(PNO, 30.0, (0, 16), 70, tr=12); theme(HRN, 30.0, (0, 16), 56, tr=-12, legato=1.0)
for k in range(16): s0 = 30.0 + k * 0.5; note(PIZ, s0 + 0.25, 0.2, CH[A2(s0)][1][k % 4], 56)
for s0 in np.arange(30.0, 38.0, 2.0): pad(s0, 2.0, A2(s0), 44)
# lens downbeats
for l in J['lens'][1:]:
    if l['id'] not in ('gaps', 'abund'): note(DR, l['t'], 0.2, 36, 96); chord(STRF, l['t'], 0.25, [x + 12 for x in CH[A2(l['t'])][1][:3]], 76, h=0)
# 1 · states: gases bloop up, liquids slide down
for i, e in enumerate([e for e in E if e['st'] == 'g']): note(HRP, ST['float'] + i * 0.06, 0.3, 79 + [0, 2, 4, 7, 9, 12][i % 6] + (12 if i > 5 else 0), 62)
for i, p in enumerate([84, 81, 79, 76, 74, 72]): note(MAR, ST['melt'] + i * 0.06, 0.2, p, 76)
note(VIB, ST['ga'], 0.6, 88, 52); note(VIB, ST['ga'] + 0.18, 0.6, 86, 46)
# 2 · towers rise: a brass swell; tungsten tops out
chord(HRN, ML['rise'][0], 1.0, [53, 57, 60], 60); chord(STR, ML['rise'][0], 1.1, [65, 69, 72, 77], 56, h=0)
for k in range(10): note(PLK, ML['rise'][0] + k * 0.1, 0.12, 65 + [0, 4, 7][k % 3] + 12 * (k // 3) // 1 % 24, 44 + k * 3)
note(MAR, ML['w'], 0.5, 89, 96); chord(HRN, ML['w'], 0.5, [65, 69, 72], 82)
# 3 · discovery years: every tile that lands plays a chord tone, like an abacus
for e in E:
    if YR['ancient'] <= e['yr'] < GP['q']:
        vo = CH[A2(e['yr'])][1]; note(MAR, e['yr'], 0.15, vo[(e['z'] * 3) % 4] + 12, 58)
note(VIB, YR['p'], 0.8, 88, 60); note(PNO, YR['n63'], 0.5, 84, 70)
# 4 · the gaps: the theme's head with its peak missing; the found elements play the missing notes back
groove(GP['q'], GP['fill']['31'], v=-18, hat16=False, snare=False, kick='two')
chord(TRM, GP['q'], 1.5, [57, 60, 64], 54); note(CB, GP['q'], 1.5, 45, 64)
note(CL, GP['q'], 0.45, 76, 84); note(CL, GP['q'] + 0.5, 0.45, 79, 84)                     # E, G … (no C)
for k in range(6): note(PIZ, GP['predict'] + k * 0.0833, 0.08, [69, 72, 76][k % 3], 50)
for (z, nm, p) in (('31', 'C', 84), ('21', 'Am', 88), ('32', 'F', 84)):
    s0 = GP['fill'][z]; note(MAR, s0, 0.5, p, 108); note(PNO, s0, 0.5, p, 92); note(PLK, s0, 0.3, p + 12, 70)
    chord(STRF, s0, 0.45, CH[nm][1], 76, h=0); note(BASS, s0, 0.45, CH[nm][0], 82); note(DR, s0, 0.2, 36, 96)
hit(GP['hit'], 'C', 112, choir=True); theme(HRN, GP['hit'] - 0 * 0.5, (0, 3), 90, tr=-12); theme(STR, GP['hit'], (0, 3), 84)
for e in E:
    if YR['rush'][0] <= e['yr'] <= YR['rush'][1] + 0.01:
        L = ladder('C', 72, 2); note(PLK, e['yr'], 0.1, L[int((e['yr'] - YR['rush'][0]) / 0.76 * (len(L) - 1))], 46)
# 5 · the universe is mostly hydrogen: the band thins to a swelling C under one huge tile
note(SUB, AB['grow'], 1.4, 24, 100); chord(BED, AB['grow'], 1.6, [48, 55, 60, 64], 56, h=0)
hit(AB['n92'], 'C', 98, brass=True, timp=True)
# 6 · rare earths: two equal notes
note(MAR, RA['bars'], 0.4, 81, 90); note(MAR, RA['bars'] + 0.25, 0.4, 81, 90); chord(VIB, RA['eq'], 0.8, [76, 81], 64)
# 7 · Ytterby: four plucks, one per element
for i, s0 in enumerate(YT['tiles']): note(MAR, s0, 0.3, [79, 81, 83, 84][i], 96); note(PLK, s0, 0.2, [79, 81, 83, 84][i] + 12, 60)
chord(HRN, YT['n4'], 0.5, [60, 64, 67], 82)
# 8 · helium: a held high note for the line in the spectrum; the flight; it lands
note(STR, HE['line'], 1.2, 91, 60); note(VIB, HE['line'], 1.0, 91, 62)
for k in range(8): note(HRP, HE['drop'] + k * 0.06, 0.3, 72 + [0, 4, 7, 12, 16, 19, 24, 28][k], 64)
note(MAR, HE['drop'] + 0.5, 0.4, 88, 96)
# 9 · made by people: synthetic plucks, one per element
for i, z in enumerate(range(93, 119)):
    s0 = MD['zap'][0] + (MD['zap'][1] - MD['zap'][0]) * i / 25
    note(PLK, s0, 0.1, 74 + [0, 3, 7, 10, 12, 15][i % 6] + (12 if i > 12 else 0), 52 + i)
# the build to the cosmos: Dm7 → G, a snare roll and a sweep; then everything stops for the lights going out
groove(38.0, 40.0, v=-2); bassline(38.0, 41.0, A2)
pad(38.0, 1.0, 'Dm7', 48); pad(39.0, 2.0, 'G', 50)
chord(STR, 38.0, 1.0, CH['Dm7'][1], 66, h=0); chord(STR, 39.0, 2.0, CH['G'][1], 70, h=0)
for k in range(16): note(DR, 40.0 + k * 0.0625, 0.05, 38, 44 + k * 3)
for k in range(8): note(TIMP, 40.0 + k * 0.125, 0.12, 43, 50 + k * 5)

# ═══ 03 where it was made (41–50): no drums; strings, horns and choir on the theme's first phrase
chord(TRM, CO['off'], 0.6, [45, 52, 57], 56); note(CB, CO['off'], 0.6, 33, 60); chord(BED, CO['off'], 0.6, CH['Am'][1], 46, h=0)
note(SUB, CO['bb'], 2.4, 24, 112); chord(STR, CO['bb'], 1.6, [36, 43, 48, 55, 60, 64], 90); note(TIMP, CO['bb'], 1.0, 36, 110); chord(CHO, CO['bb'], 1.4, [60, 64, 67], 72)
theme(STR, 42.0, (0, 16), 80, legato=1.0, swell=12); theme(CHO, 42.0, (0, 16), 58, tr=-12, legato=1.0); theme(HRN, 42.0, (4, 16), 62, tr=-12, legato=1.0)
for k in range(16):
    s0 = 42.0 + k * BEAT; root, vo = CH[harm(k)]
    note(HRP, s0, 0.6, vo[k % 4] + 12, 60); note(HRP, s0 + 0.25, 0.5, vo[(k + 2) % 4] + 24, 50)
    if k % 4 == 0: note(CB, s0, 2.0, root, 68); chord(PAD, s0, 2.0, vo, 46, h=0)
note(TIMP, CO['sn'], 0.8, 45, 100); chord(HRN, CO['sn'], 0.8, [57, 60, 64], 80); note(SUB, CO['sn'], 0.8, 33, 96)
hit(CO['ns'], 'F', 104, brass=True, choir=True)
note(VIB, CO['lab'], 0.4, 84, 56); note(VIB, CO['lab'] + 0.25, 0.4, 88, 52)

# ═══ the ending (50–60): the second phrase (Dm7 Em7 F Fm C); the line lands on F → F minor; home; the open chord
T2 = 50.0 - 16 * BEAT
theme(STR, T2, (16, 28), 86, legato=1.0, swell=14); theme(HRN, T2, (16, 28), 70, tr=-12, legato=1.0); theme(PNO, T2, (16, 28), 70, tr=12)
theme(CHO, T2, (20, 28), 56, tr=-12, legato=1.0)
for k in range(12):
    s0 = 50.0 + k * BEAT; b = 16 + k; root, vo = CH[harm(b)]
    note(HRP, s0, 0.6, vo[k % 4] + 12, 60); note(HRP, s0 + 0.25, 0.5, vo[(k + 1) % 4] + 24, 50)
    if b % 2 == 0: note(CB, s0, 1.0, root, 72); chord(PAD, s0, 1.0, vo, 48, h=0)
    if s0 >= 51.5: note(DR, s0, 0.2, 36, 60 + k * 3)
    if s0 >= 52.0: note(DR, s0 + 0.25, 0.08, 42, 30 + k * 2)
for k in range(14): note(HRP, EN['morph'][0] + k * 0.05, 0.4, 60 + [0, 2, 4, 7, 9][k % 5] + 12 * (k // 5), 66)
note(TIMP, EN['stamp'], 0.4, 43, 92); note(DR, EN['stamp'], 0.2, 38, 84)
for k in range(8): note(TIMP, 54.0 + k * 0.125, 0.12, 41, 46 + k * 5)
chord(STR, 55.0, 1.0, CH['Fm'][1], 88, h=0); note(HRN, 55.0, 1.0, 68, 80); chord(CHO, 55.0, 1.0, [56, 60, 65], 66)   # the tear
hit(56.0, 'C', 110, brass=True, timp=True, choir=True); theme(STR, T2, (28, 32), 84, legato=1.0)
# the breath: solo piano, the theme's head with its peak still missing
chord(BED, 56.4, 1.8, CH['C'][1], 42, h=0)
note(PNO, 57.0, 0.45, 76, 70); note(PNO, 57.5, 0.45, 79, 70); note(PNO, 57.0, 1.2, 48, 50)
note(VIB, EN['q'], 0.4, 91, 50); note(VIB, EN['q'] + 0.2, 0.4, 91, 44)
# the end card: C add 9 — home, with one note left open; the marimba answers E, G … D
root, vo = CH['Cadd9']
chord(PNO, EN['card'], 1.8, [48, 55, 64, 67, 74], 80, roll=0.03); chord(STR, EN['card'], 1.8, vo, 70, h=0); note(CB, EN['card'], 1.8, 36, 70)
chord(CHO, EN['card'], 1.6, [60, 64, 67, 74], 54); note(DR, EN['card'], 0.2, 36, 96); note(SUB, EN['card'], 1.0, 24, 90)
for i, p in enumerate([76, 79, 86]): note(MAR, EN['card'] + 0.2 + i * 0.25, 0.6, p, 84 - i * 4)
for k in range(10): note(HRP, EN['card'] + k * 0.04, 0.8, 60 + [0, 4, 7, 14, 16][k % 5] + 12 * (k // 5), 60)
# a soft bed under everything, so nothing falls silent
for s0 in np.arange(0, 58, 2.0):
    nm = A1(s0) if 8 <= s0 < 18 else A2(s0) if 18 <= s0 < 41 else harm(int((s0 - 42) / 0.5)) if 42 <= s0 < 50 else harm(16 + int((s0 - 50) / 0.5)) if 50 <= s0 < 56 else 'C'
    chord(BED, s0, 2.05, CH[nm][1], 40, h=0)

music, stems = sc.render(PARTS, kick_part='drums')

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
def s_tile(seed=0, f=1500):
    n = int(0.09 * SR); t = np.arange(n) / SR
    k = sosfilt(butter(2, [f * 0.6, f * 2.2], 'band', fs=SR, output='sos'), noise(n, seed)) * env(n, 0.0005, 0.012)
    return st(k + 0.5 * np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.025))
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12, rev=False):
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(sosfilt(butter(2, [300, 3000], 'band', fs=SR, output='sos'), noise(n, seed)), 4000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_glide(f0, f1, dur, vib=0.02):
    n = int(dur * SR); t = np.arange(n) / SR; f = f0 * (f1 / f0) ** (t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f * (1 + vib * np.sin(2 * np.pi * 5 * t))) / SR)
    return st(lp(x * np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.12), 3000))
def s_bloop(f0=300, f1=900, dur=0.14): return s_glide(f0, f1, dur, 0)
def s_chirp(t0, t1):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; tc = (t1 - t0) + 0.004
    f = np.minimum(38 * (tc / (tc - t)) ** (3 / 8), 900); a = (f / f[0]) ** (2 / 3); a /= a.max()
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * a + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * a
    fo = int(0.02 * SR); x[-fo:] *= np.linspace(1, 0, fo)
    return st(x)
def s_zap(seed=0, f=1800):                     # a soft synthetic "made" blip
    n = int(0.08 * SR); t = np.arange(n) / SR; ff = f * np.exp(-t / 0.03) + 300
    return st(np.sin(2 * np.pi * np.cumsum(ff) / SR) * env(n, 0.001, 0.025))
def s_stamp():
    n = int(0.25 * SR)
    x = sosfilt(butter(2, [150, 1200], 'band', fs=SR, output='sos'), noise(n, 77)) * env(n, 0.001, 0.03)
    return st(x) + 0.8 * s_thump(130, 60, 0.25)[:n]

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
L = {k: trim(lib(k)) for k in (1530, 2369, 2001, 2002, 1489, 2605, 1120, 754, 1694, 2365, 498, 2299, 774, 790, 168, 2856, 1317, 1063)}

# opening
put(0.0, L[2001], -24, 'card placement (2001)', 'the label slaps onto the screen'); put(0.0, s_thump(110, 55, 0.25), -25, 'low thump (synth)', 'slam body')
for i, tr in enumerate(HK['rows'][1:]): put(tr, s_tile(i, 1700), -33, 'tile tick (synth)', 'an ingredient row ticks in' if i == 0 else '')
put(HK['reveal'] - 0.05, L[1489], -27, 'whoosh_air (1489)', 'the camera pulls back: it\'s a person', align='peak')
put(HK['you'] + 0.45, L[2001], -30, 'card placement (2001)', 'sticker: 你 65% 是氧')
for i, s0 in enumerate(HK['labels']):
    put(s0, L[2605], -26, 'air_quick (2605)', ['label whips in: air', 'label: the Sun', 'label: the ground'][i], align='peak')
    put(s0 + 0.05, L[1530], -32, 'paper slide (1530)', '', maxlen=0.4)
put(HK['merge'], L[1489], -28, 'whoosh_air (1489)', 'into the dark: the table', align='peak')
put(HK['rain'][0], L[790], -31, 'riser (790)', 'the tiles rain down', maxlen=1.4)
for e in sorted(E, key=lambda e: e['rain'])[::3]: put(e['rain'], s_tile(e['z'], 1200 + (e['z'] * 37) % 900), -37, 'tile knock (synth)', 'tiles land (every third)' if e['z'] == 1 else '')
put(HK['n118'], L[498], -24, 'deep_hit (498)', '只有 118 种')
put(HK['title'], L[2605], -28, 'air_quick (2605)', 'title tiles drop', align='peak')
for i in range(5): put(HK['title'] + 0.2 + i * 0.05, s_tile(i + 40, 900 + i * 80), -29, 'tile knock (synth)', 'title tile lands' if i == 0 else '')
put(HK['out'] - 0.3, L[1489], -28, 'whoosh_air (1489)', 'zoom through the title', align='peak', rate=1.2)
# 01
for i, tp in enumerate(RD['protons']): put(tp, L[1120], -30, 'pop_soft (1120)', 'a proton' if i == 0 else '')
put(RD['count'][0], L[790], -33, 'riser (790)', 'counting to 118', maxlen=0.6)
put(RD['rings'], L[1489], -31, 'whoosh_air (1489)', 'shells appear', align='peak', rate=1.3)
put(RD['col1'], L[754], -31, 'splash (754)', 'column 1: reacts with water', maxlen=0.8); put(RD['col1'], s_thump(100, 60), -29, 'low thump (synth)', 'towers rise')
put(RD['col18'], L[2856], -34, 'gear lock (2856)', 'column 18: full, calm')
for e in E:
    if e['fam'] == 'ng' and e['z'] != 2 or e['z'] == 1: put(e['gl'], L[1120], -35, 'pop_soft (1120)', 'a row ends on a noble gas' if e['z'] == 10 else '')
put(RD['period'], L[2001], -29, 'card placement (2001)', 'sticker: 这就是「周期」')
# 02
for l in J['lens']: put(l['t'] - 0.15, L[2605], -29, 'air_quick (2605)', f"colour sweep: lens {l['id']}", align='peak')
for e in sorted(E, key=lambda e: e['x'] + e['y'])[::6]: put(ST['flip'] + (e['x'] + e['y']) * 0.022, L[2002], -38, 'card flick (2002)', 'the tiles flip like a card stunt' if e['z'] == 1 else '', maxlen=0.2)
for i, e in enumerate([e for e in E if e['st'] == 'g'][::2]): put(ST['float'] + i * 0.1, s_bloop(300 + i * 60, 900 + i * 80), -35, 'bloop up (synth)', 'gases float up' if i == 0 else '')
put(ST['melt'], s_glide(700, 180, 0.6), -31, 'melting glide (synth)', 'the two liquids melt')
put(ST['ga'], L[1317], -34, 'bubble (1317)', 'gallium: melts in your hand')
put(ML['rise'][0], s_swell(1.0, 30), -30, 'air swell (synth)', 'melting-point towers rise')
put(ML['w'], L[2856], -30, 'gear lock (2856)', 'tungsten tops out: 3422°C')
put(YR['ancient'] - 0.2, L[1489], -31, 'whoosh_air (1489)', 'the tiles lift away', align='peak', rate=1.2)
put(YR['ancient'], s_thump(120, 70, 0.2), -28, 'tile thump (synth)', 'the ancient nine')
put(YR['p'], L[1317], -32, 'bubble (1317)', '1669: phosphorus, from urine')
for e in E:
    if YR['y1700'] <= e['yr'] < GP['q']: put(e['yr'] + 0.1, s_tile(e['z'], 1300 + (e['z'] * 37) % 800), -35, 'tile knock (synth)', 'tiles drop in by year' if e['z'] == 1 else '')
put(YR['n63'], L[2001], -31, 'card placement (2001)', 'sticker: 1869, 63')
for i in range(3): put(GP['q'] + 0.05 + i * 0.12, L[1120], -32, 'pop_soft (1120)', 'three gaps show "?"' if i == 0 else '')
for k in range(3): put(GP['q'] + 0.5 * (k + 2), L[1063][:int(0.1 * SR)], -36, 'clock tick (1063)', 'waiting' if k == 0 else '')
put(GP['predict'], L[2369], -32, 'pencil scribble (2369)', 'the predictions', maxlen=0.6)
for z in ('31', '21', '32'): put(GP['fill'][z], s_thump(120, 70, 0.2), -26, 'tile thump (synth)', f'gap filled: {EZ[int(z)]["s"]}'); put(GP['fill'][z] + 0.1, L[2001], -32, 'card placement (2001)', '')
put(GP['hit'], L[2299], -25, 'bass_hit (2299)', '全中！')
for e in E:
    if YR['rush'][0] <= e['yr'] <= YR['rush'][1] + 0.01 and e['z'] % 3 == 0: put(e['yr'], s_tile(e['z'] + 200, 1800), -38, 'tile tick (synth)', 'the rest rush in' if e['z'] == 33 else '')
put(AB['grow'], s_swell(0.6, 41), -30, 'air swell (synth)', 'hydrogen swells')
put(AB['n92'], L[498], -26, 'deep_hit (498)', '92%')
put(RA['lift'], L[1489], -31, 'whoosh_air (1489)', 'the rare earths rise', align='peak', rate=1.2)
for i in range(2): put(RA['bars'] + i * 0.25, L[1120], -31, 'pop_soft (1120)', 'Ce and Cu labelled' if i == 0 else '')
put(RA['eq'], L[2369], -34, 'pencil scribble (2369)', 'dashed line: equal', maxlen=0.4)
for i in range(7): put(YT['word'] + i * 0.04 + 0.1, s_tile(i + 60, 1000 + i * 60), -33, 'tile knock (synth)', 'YTTERBY letters drop' if i == 0 else '')
for i, s0 in enumerate(YT['tiles']): put(s0, L[1120], -32, 'pop_soft (1120)', 'a name lights up' if i == 0 else '')
put(YT['n4'], L[2001], -30, 'card placement (2001)', 'sticker: 4 elements')
put(HE['sun'], s_swell(0.5, 51), -32, 'air swell (synth)', 'the Sun')
put(HE['line'], s_glide(880, 1320, 0.25, 0), -36, 'sine rise (synth)', 'the yellow line')
put(HE['drop'], L[1489], -29, 'whoosh_air (1489)', 'helium flies from the Sun to its square', align='peak')
put(HE['drop'] + 0.5, s_thump(120, 70, 0.2), -28, 'tile thump (synth)', 'it lands')
put(HE['earth'], L[2001], -31, 'card placement (2001)', 'sticker: 27 years later')
for i in range(0, 26, 2): put(MD['zap'][0] + (MD['zap'][1] - MD['zap'][0]) * i / 25, s_zap(i, 1500 + i * 40), -36, 'zap (synth)', 'a made element lights' if i == 0 else '')
put(MD['zap'][0], L[2365], -33, 'electric_pop (2365)', 'the accelerator starts')
put(40.0, L[790], -30, 'riser (790)', 'build to the cosmos', maxlen=1.0)
# 03
put(CO['off'], s_swell(0.6, 61, rev=True), -29, 'reverse swell (synth)', 'lights out')
put(CO['bb'], L[774], -23, 'impact_space (774)', 'the Big Bang')
put(CO['stars'], L[168], -30, 'sweep_air (168)', 'stars ignite')
put(CO['sn'], L[2299], -26, 'bass_hit (2299)', 'a star explodes'); put(CO['sn'] + 0.1, lp(L[1694], 4000), -29, 'short explosion, low-passed (1694)', '')
put(CO['chirp'][0], s_chirp(*CO['chirp']), -26, 'inspiral chirp (synth, f ∝ (tc−t)^−3/8)', 'two neutron stars spiral in')
put(CO['ns'], L[774], -22, 'impact_space (774)', 'they merge: gold'); put(CO['ns'], L[498], -26, 'deep_hit (498)', '')
put(CO['lab'], L[2365], -32, 'electric_pop (2365)', 'the lab')
# ending
put(EN['morph'][0], L[1489], -27, 'whoosh_air (1489)', 'the tiles fly into a body', align='peak')
put(EN['morph'][0] + 0.4, s_swell(1.0, 71), -31, 'air swell (synth)', '')
put(EN['label'], L[2001], -28, 'card placement (2001)', 'the label returns')
for i, s0 in enumerate(EN['tags']): put(s0, L[1120], -31, 'pop_soft (1120)', 'origin tags' if i == 0 else '')
put(EN['stamp'], s_stamp(), -24, 'rubber stamp (synth)', '生产日期：早于地球')
put(EN['zoom'][0], L[1489], -28, 'whoosh_air (1489)', 'pull out to the stars', align='peak', rate=0.8)
put(EN['back'][0], L[2605], -29, 'air_quick (2605)', 'back to the table', align='peak')
for e in E[::4]: put(EN['back'][0] + 0.3 + (e['z'] % 20) * 0.02, s_tile(e['z'] + 400, 1500), -38, 'tile tick (synth)', 'tiles settle' if e['z'] == 1 else '')
for i in range(18): put(EN['row8'] + i * 0.03, s_tile(i + 500, 2000), -39, 'tile tick (synth)', 'row 8 appears' if i == 0 else '')
put(EN['q'], L[1120], -31, 'pop_soft (1120)', '119? 120?')
put(EN['card'] - 0.2, L[2605], -28, 'air_quick (2605)', 'end card sweeps in', align='peak'); put(EN['card'], L[2001], -27, 'card placement (2001)', 'the end card')

SFX = lp(SFX, 9500) * 10 ** (4 / 20)          # the sound design sits ~13 dB under the music (median)
ir = sc.ir
sfx_mix = SFX + 0.15 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
dk = np.ones(N); a, b = int(CO['chirp'][0] * SR), int(CO['ns'] * SR); dk[a:b] = 10 ** (-6 / 20)
dk = np.convolve(dk, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same'); music = music * dk[:, None]
if os.environ.get('STEM_DIR'):
    os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
    for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), SR)
x = music + sfx_mix
x = x + 0.4 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 0.6) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'elements60_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'elements60_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')

def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {int(t // 2) + 1}.{(t % 2) / BEAT + 1:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 元素周期表 · 60 s — cue sheet (generated by music/elements60.py)\n\nEvery time comes from src/elements60/e60.json and t60.json, '
       'the same files the picture reads. Bars are 2 s (120 BPM). "vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'elements60_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav')); print(f'sfx {i}: harsh={harsh(an)}')

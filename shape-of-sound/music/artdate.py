"""看不懂也能装：美术馆约会腔调指南 — the score and sound design, synced to src/artdate/artdate.json.
Run: python3 music/artdate.py  → public/artdate_score.wav + out/artdate_cues.md   (STEM_DIR=out/stems_ad writes stems)

120 BPM, 2-s bars, F major family. One chic 4-bar leitmotif (Fmaj9 | Dm9 | Gm9 C13 | Fmaj9) — a minor-sixth leap then a
turn — re-orchestrated per hall: lounge trio → Gothic organum → harpsichord & strings counterpoint → flute, harp and
piano 9ths with whole-tone colour → jazz trio / cabaret / cool jazz / pop → marimba-and-synth minimalism → full lounge.
Each hall has its own convolution reverb (stone palace, iron-and-glass station, dry white cube, crisp design hall);
sound effects share that room. The panic is a tape-stop into silence; the glasses clink on the final downbeat.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'artdate', 'artdate.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
UI = J['ui']; ui = lambda typ: [u for u in UI if u['type'] == typ]
STY = J['styles']; ARC = J['arch']
sc = Score(DUR, SR, seed=21); rng = np.random.default_rng(9)
BEAT = 0.5
def note(part, s, d, p, v=80, h=0.006):
    if s < 0: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, v)
def chord(part, s, d, ps, v=76, h=0.006, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)

PNO, BASS, BR, VIB, HPS, VLN, VC, STR, STRF, PIZ, CHO, HRP, FL, CL, ACC, TUB, HTK, BRS, MAR, PLK, SUB, DR, JK, PAD = (
    'piano', 'bass', 'brush', 'vibes', 'harpsichord', 'violin', 'cello', 'strings', 'tremolo', 'pizz', 'choir', 'harp', 'flute',
    'clarinet', 'accordion', 'tuba', 'honkytonk', 'brass', 'marimba', 'pluck', 'sub', 'drums', 'jazzkit', 'pad')
PARTS = {
    PNO: SF2('piano', level=-17, verb=0.32), BASS: SF2('ms', 32, level=-19, verb=0.12), BR: SF2('ms', 40, drum=True, level=-25, verb=0.2),
    VIB: SF2('ms', 11, level=-22, verb=0.35), HPS: SF2('ms', 6, level=-18, verb=0.3), VLN: SF2('ms', 40, level=-22, verb=0.4),
    VC: SF2('ms', 42, level=-21, verb=0.35), STR: SF2('ms', 49, level=-22, verb=0.45), STRF: SF2('ms', 48, level=-23, verb=0.4),
    PIZ: SF2('ms', 45, level=-22, verb=0.3), CHO: SF2('ms', 52, level=-21, verb=0.55), HRP: SF2('ms', 46, level=-20, verb=0.42),
    FL: SF2('ms', 73, level=-19, verb=0.38), CL: SF2('ms', 71, level=-20, verb=0.3), ACC: SF2('ms', 21, level=-23, verb=0.25),
    TUB: SF2('ms', 58, level=-21, verb=0.2), HTK: SF2('ms', 3, level=-23, verb=0.25), BRS: SF2('ms', 61, level=-21, verb=0.3, cap=104),
    MAR: SF2('ms', 12, level=-20, verb=0.22), PLK: Synth('pluck', level=-22, verb=0.25, bright=1.4, decay=3.5, length=0.4, lp=7000),
    SUB: Synth('sub', level=-22, verb=0.0, duck=0.4, cap=100), PAD: Synth('pad', level=-27, verb=0.4, duck=0.2, cutoff=1800, attack=0.5),
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, fallback_kit=25, level=-24, verb=0.12), JK: SF2('ms', 32, drum=True, level=-26, verb=0.25),
}
# ── harmony (rootless voicings around middle C) and the leitmotif
CH = {
    'F9': (41, [57, 60, 64, 67]), 'Dm9': (38, [53, 57, 60, 64]), 'Gm9': (43, [58, 62, 65, 69]), 'C13': (36, [58, 62, 64, 69]),
    'C7b9': (36, [58, 61, 64, 67]), 'F69': (41, [57, 62, 67, 72]), 'Dm': (38, [57, 62, 65]), 'A7': (45, [55, 61, 64, 67]),
    'Gm7': (43, [58, 62, 65]), 'C7': (36, [58, 64, 67]), 'C9#5': (36, [58, 62, 64, 68]), 'Bbmaj7': (46, [57, 62, 65, 69]),
    'F': (41, [57, 60, 65]), 'Bb': (46, [58, 62, 65]), 'Dm11': (38, [55, 60, 65, 69]), 'Fmaj7#11': (41, [57, 64, 71, 76]),
}
THEME = [(-0.5, 0.5, 69), (0, 1.5, 77), (1.5, 0.5, 76), (2, 1, 72), (3, 0.5, 69), (3.5, 0.5, 72),
         (4, 1.5, 74), (5.5, 0.5, 72), (6, 1, 69), (7, 0.5, 65), (7.5, 0.5, 69),
         (8, 1, 70), (9, 0.5, 74), (9.5, 1, 77), (10.5, 0.5, 76), (11, 1, 79),
         (12, 2, 77), (14, 0.5, 72), (14.5, 0.5, 69), (15, 1, 72)]
THEME_H = [(0, 'F9'), (4, 'Dm9'), (8, 'Gm9'), (10, 'C13'), (12, 'F9'), (14, 'C7b9')]
def swing(t, t0):
    b = (t - t0) / BEAT; f = b - np.floor(b)
    return t + (BEAT / 6 if abs(f - 0.5) < 1e-6 else 0)
def theme(part, t0, beats=(0, 16), v=80, tr=0, sw=False, legato=1.0, pickup=True, stop=None):
    for b, d, p in THEME:
        if not (beats[0] - (0.5 if pickup else 0) <= b < beats[1]): continue
        if not pickup and b < beats[0]: continue
        s = t0 + (b - beats[0]) * BEAT
        if sw: s = swing(s, t0)
        if stop is not None and s >= stop: continue
        note(part, s, d * BEAT * legato, p + tr, v + (6 if b % 4 == 0 else 0))
def harm_at(beat):
    return [n for b, n in THEME_H if b <= beat + 1e-6][-1]

# ── per-style accompaniment over a span of the theme
def lounge(t0, beats, v=0, stop=None):            # piano comp (Charleston), upright bass 2-feel/walk, brushes swing
    for k in range(beats[0], beats[1]):
        s = t0 + (k - beats[0]) * BEAT
        if stop is not None and s >= stop: break
        name = harm_at(k); root, vo = CH[name]
        if k % 4 == 0: note(BASS, s, 0.9, root, 84 + v); chord(PAD, s, 2.0, vo, 46 + v, h=0)
        if k % 4 == 2: note(BASS, s, 0.9, root + 7 if root + 7 < 50 else root - 5, 78 + v)
        if k % 4 == 1: chord(PNO, swing(s + 0.5 * BEAT, s), 0.35, vo, 54 + v)
        if k % 4 == 3: chord(PNO, s, 0.3, vo, 50 + v)
        note(BR, s, 0.2, 51 if k % 2 == 0 else 59, 52 + v)                              # ride / brush
        if k % 2 == 1: note(BR, s, 0.2, 38, 46 + v); note(BR, swing(s + 0.5 * BEAT, s), 0.1, 51, 40 + v)
        if k % 4 == 0: note(BR, s, 0.2, 36, 54 + v)

def walking(t0, t1, prog, v=0):                     # jazz walking bass on quarters with chromatic approaches
    k = 0; t = t0
    while t < t1 - 1e-6:
        name = prog(t); root, vo = CH[name]; nxt = CH[prog(t + BEAT)][0] if t + BEAT < t1 else root
        beat = k % 4
        p = root if beat == 0 else (root + [0, 4, 7, 9][beat] if beat < 3 else nxt + (1 if rng.random() < 0.5 else -1))
        while p > 50: p -= 12
        while p < 33: p += 12
        note(BASS, t, BEAT * 0.9, p, 82 + v + (6 if beat == 0 else 0)); t += BEAT; k += 1

# ════════════════ HOOK 0–8: lounge → panic (tape-stop) → 别慌 restart
lounge(0.0, (0, 8), v=-2, stop=3.3)
theme(PNO, 0.0, (0, 6), v=78, sw=True, pickup=False, stop=3.3)
chord(VIB, 0.0, 1.8, [72, 76, 79], 50)
chord(PNO, 2.0, 0.6, [50, 57, 60, 64, 69], 82); chord(VIB, 2.0, 0.8, [69, 72, 76], 60)        # the punch-in stab
note(PNO, 3.75, 0.3, 69, 76)                                                                    # 别慌: the pickup
lounge(4.0, (0, 8), v=4); theme(PNO, 4.0, (0, 8), v=84, sw=True, pickup=False); theme(VIB, 4.0, (0, 8), v=56, sw=True, pickup=False)
chord(STR, 4.0, 4.0, [53, 60, 64, 69], 50)
for k in range(8): note(HPS, 7.5 + k * 0.0625, 0.12, [65, 67, 69, 70, 72, 74, 76, 77][k], 70 + k * 2)   # whip: harpsichord run

# ════════════════ 古典 8–20: Gothic organum → harpsichord & strings counterpoint → Baroque drama → 踩雷
chord(CHO, 8.0, 1.0, [43, 50, 55, 62], 74); chord(STR, 8.0, 1.0, [31, 43], 60)                 # G–D organum on the landing
chord(CHO, 9.0, 1.0, [36, 43, 48, 55], 70); chord(STR, 9.0, 1.0, [36, 48], 58)
for k in range(12): note(HPS, 9.4 + k * 0.05, 0.15, [53, 57, 60, 65, 69, 72, 77, 81, 84, 81, 77, 72][k], 66 + k)   # the rebuild flourish
theme(HPS, 10.0, (0, 12), v=82, pickup=False)
for k in range(12):                                                          # continuo: broken chords in 8ths + cello quarters
    s = 10.0 + k * BEAT / 1; beat = k
    root, vo = CH[harm_at(beat)]
    for j in range(2): note(HPS, s + j * 0.25, 0.22, [root + 12, vo[0] - 12, vo[1] - 12, vo[0] - 12][(beat * 2 + j) % 4], 58)
    note(VC, s, 0.45, [root, root + 7, root + 12, root + 7][beat % 4] if beat % 4 != 3 else root + 4, 70)
for s, p, d in [(10.0, 72, 1.0), (11.0, 69, 1.0), (12.0, 65, 1.0), (13.0, 67, 1.0), (14.0, 74, 1.0), (15.0, 72, 1.0)]: note(VLN, s, d, p, 66)   # countermelody
for k in range(4): note(PIZ, 12.25 + k * 0.25, 0.2, [72, 74, 76, 77][k], 70)                 # the perspective lines
chord(HPS, 13.25, 0.6, [84, 89], 74)                                                            # the vanishing point
note(VLN, 14.8, 0.6, 79, 70); note(VLN, 15.1, 0.6, 81, 66)                                       # her reaction
chord(STR, 10.0, 6.0, [53, 60, 65], 46)
# Baroque: D minor, harpsichord 16ths, string tremolo, a cello pedal
for k in range(32):
    s = 16.0 + k * 0.0625; nm = 'Dm' if k < 16 else 'A7'; root, vo = CH[nm]
    note(HPS, s, 0.08, [vo[0], vo[1], vo[2], vo[1] + 12][k % 4] + (12 if k % 8 >= 4 else 0), 62)
for k in range(16): chord(STRF, 16.0 + k * 0.125, 0.12, [57, 62, 65] if k < 8 else [57, 61, 64], 70 - (k % 2) * 8, h=0)
note(VC, 16.0, 2.0, 38, 82); note(VLN, 16.5, 0.75, 74, 76); note(VLN, 17.25, 0.25, 73, 72); note(VLN, 17.5, 0.5, 74, 74)
# 踩雷: a delighted trill, then the dud
for k in range(6): note(HPS, 17.95 + k * 0.06, 0.06, [77, 79][k % 2], 70)
chord(PIZ, 17.95, 0.2, [53, 60, 65], 66)
chord(HPS, 18.4, 0.5, [37, 38, 41, 44], 80, h=0); note(VC, 18.4, 0.25, 38, 78); note(VC, 18.65, 0.5, 37, 70)
for k in range(10): note(HRP, 19.5 + k * 0.05, 0.6, [53, 57, 60, 64, 65, 69, 72, 76, 77, 81][k], 60 + k * 2)   # gliss into the station

# ════════════════ 印象派 20–32: flute, harp, piano 9ths, whole-tone colour
chord(PNO, 20.0, 2.0, [41, 53, 57, 64, 67, 71], 66, roll=0.06); note(FL, 20.0, 1.5, 81, 60); note(FL, 21.5, 0.5, 79, 56)
chord(STR, 20.0, 6.0, [41, 53, 60], 44)
def harp_arps(t0, t1, prog, v=56, step=0.125):
    k = 0; t = t0
    while t < t1 - 1e-6:
        root, vo = CH[prog(t)]; lad = sorted(vo) + [x + 12 for x in sorted(vo)]
        note(HRP, t, 0.6, lad[[0, 1, 2, 3, 4, 3, 2, 1][k % 8]], v + (8 if k % 8 == 0 else 0)); t += step; k += 1
theme(FL, 22.0, (0, 8), v=78, legato=1.05)
harp_arps(22.0, 26.0, lambda t: 'F9' if t < 24 else 'Dm9')
for s, nm in [(22.0, 'F9'), (24.0, 'Dm9')]: chord(PNO, s, 1.8, [CH[nm][0]] + CH[nm][1], 58, roll=0.04)
# the squint: a whole-tone wash, then it opens out
for k in range(16): note(HRP, 26.0 + k * 0.08, 0.9, [48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78][k], 58 + k)
chord(PNO, 26.0, 1.6, [36, 58, 62, 64, 68], 56); chord(STR, 26.0, 1.75, [36, 52, 58], 50)
chord(PNO, 27.75, 0.9, [41, 57, 64, 67, 72], 62, roll=0.03)
# dots (pizzicato 16ths), then swirls (harp + piano sextuplets)
for k in range(14): note(PIZ, 28.0 + k * 0.0625, 0.08, [62, 65, 69, 72, 69, 65][k % 6] + (12 if k > 7 else 0), 62)
for k in range(13):
    s = 28.9 + k * (1 / 12); lad = [62, 65, 69, 72, 74, 77, 74, 72, 69, 65, 62, 65, 69]
    note(HRP, s, 0.5, lad[k], 62); note(PNO, s + 1 / 24, 0.3, lad[k] - 12, 46)
chord(STR, 28.9, 1.1, [50, 57, 65], 54); note(FL, 29.0, 0.9, 81, 66)
# 踩雷: the theme with the wrong note (Monet → Manet)
note(PNO, 29.95, 0.2, 69, 74); note(PNO, 30.1, 0.3, 77, 78); note(PNO, 30.4, 0.6, 75, 82); chord(PNO, 30.4, 0.6, [52, 59], 70, h=0)
note(FL, 30.45, 0.15, 75, 60); note(FL, 30.6, 0.15, 74, 56); note(FL, 30.75, 0.3, 73, 50)
for k, (s, p) in enumerate([(31.5, 38), (31.625, 38), (31.75, 38), (31.875, 40)]): note(BR, s, 0.1, p, 60 + k * 6)   # brush fill

# ════════════════ 现代与抽象 32–48: jazz trio, hemiola quick-fire, cool vibes, cabaret, colour field, pop, stop
prog_m = lambda t: 'F9' if (t // 2) % 2 == 0 else 'Dm9'
walking(32.0, 37.0, prog_m)
for k in range(10):
    s = 32.0 + k * BEAT
    note(BR, s, 0.2, 51, 50); (k % 2 == 1) and note(BR, s, 0.2, 38, 44)
    if k % 2 == 1: chord(PNO, swing(s + 0.25, s), 0.3, CH[prog_m(s)][1], 52)
chord(BRS, 34.0, 0.35, [53, 60, 65, 69, 71], 92); chord(PNO, 34.0, 0.4, [41, 57, 64, 71], 80)          # Fauve: a wild stab (#11)
chord(PNO, 35.5, 0.3, [47, 48, 53, 54, 59, 60], 82, h=0); note(JK, 35.5, 0.1, 37, 80); note(JK, 35.75, 0.1, 37, 60)   # Cubism: a cluster
note(BASS, 37.0, 1.4, 29, 86); note(VIB, 37.0, 1.4, 77, 58)                                      # Abstraction: almost nothing
note(BASS, 38.5, 0.9, 41, 76); note(BASS, 39.5, 0.9, 38, 74); note(BASS, 40.5, 0.4, 36, 72)
theme(VIB, 38.5, (0, 5), v=70, sw=True, pickup=False)                                           # the X-ray: cool vibes theme
for k in range(5): note(BR, 38.5 + k * BEAT, 0.2, 51, 40)
note(VIB, 39.95, 0.8, 84, 58)
# Dada: three beats of cabaret oom-pah
note(TUB, 41.0, 0.45, 41, 86); chord(ACC, 41.5, 0.4, [57, 60, 65], 74); chord(ACC, 42.0, 0.4, [57, 60, 65], 70)
for k in range(5): note(HTK, 41.0 + k * 0.1, 0.1, [72, 76, 72, 76, 79][k], 64)
# the colour field: free, cool, enveloping
chord(VIB, 42.5, 1.6, [62, 65, 69, 72], 58, roll=0.12); chord(PNO, 42.6, 1.4, [38, 55, 60, 65, 69], 50, roll=0.08)
for k in range(7): chord(STR, 42.5 + k * 0.25, 0.3, [50, 57, 62, 65, 69], 40 + k * 7, h=0)
note(CL, 42.8, 1.4, 81, 52)
# Pop: bright stabs, claps, a bouncy bass
for s in (44.5, 45.0, 45.25, 45.75):
    chord(BRS, s, 0.18, [65, 69, 72, 74], 90 if s == 44.5 else 76)
for s in (45.0, 46.0): note(DR, s, 0.1, 39, 82)
for k, s in enumerate([44.5, 44.75, 45.0, 45.5, 45.75]): note(BASS, s, 0.2, [41, 53, 41, 48, 50][k], 84)
note(DR, 44.5, 0.1, 36, 92); note(DR, 45.5, 0.1, 36, 80)
# 踩雷: everything stops for 「这我也能画」, then the dud
note(PNO, 46.4, 0.8, 29, 88); note(BASS, 46.4, 0.2, 41, 80); note(BASS, 46.6, 0.25, 40, 74); note(BASS, 46.85, 0.4, 36, 70)
for k in range(4): note(PLK, 47.5 + k * 0.125, 0.1, [72, 77, 81, 84][k], 64 + k * 4)            # synth blips into design

# ════════════════ 设计 48–62: marimba & synth minimalism, card blips, Deco button, less / more
def minimal(t0, t1, v=0, kick=True):
    k = 0; t = t0
    while t < t1 - 1e-6:
        nm = 'F9' if (t // 2) % 2 == 0 else 'Dm9'; root, vo = CH[nm]; lad = sorted(vo)
        note(MAR, t, 0.2, lad[[0, 2, 1, 3, 2, 0, 3, 1][k % 8]] + 12, 60 + v + (8 if k % 4 == 0 else 0))
        note(MAR, t + 0.125, 0.15, lad[[3, 1, 2, 0][k % 4]] + 12, 46 + v)
        if k % 2 == 0: note(SUB, t, 0.4, root, 80 + v)
        if kick and k % 4 == 0: note(DR, t, 0.1, 36, 76 + v)
        note(DR, t + 0.25, 0.05, 42, 44 + v)
        if k % 4 == 2: note(DR, t, 0.08, 38, 40 + v)
        t += BEAT; k += 1
for s, n in [(48.05 + i * 0.1, i) for i in range(8)]: note(PLK, s, 0.06, 84 - n, 38)              # the panels lock in
minimal(48.0, 58.3)
for k in range(8): note(HRP, 50.0 + k * 0.06, 0.5, [65, 69, 72, 77, 81, 77, 72, 69][k], 62)      # Nouveau: a curl
note(FL, 50.15, 0.6, 84, 54)
chord(BRS, 51.5, 0.3, [57, 60, 64, 67, 70], 92); note(JK, 51.5, 0.6, 51, 84); note(JK, 51.5, 0.1, 49, 70)   # Deco: the swing button
theme(VIB, 54.5, (0, 8), v=72, pickup=True)                                                      # the Sullivan line
for i, s in enumerate([50.0, 51.5, 53.0, 54.5, 57.0, 58.75]): note(PLK, s, 0.08, [84, 88, 91, 84, 88, 79][i], 70)   # card blips
for k in range(8): note(PLK, 57.2 + k * 0.125, 0.05, [72, 76, 79, 84, 79, 84, 88, 91][k], 56)     # the grid lines
note(PNO, 58.75, 0.7, 29, 84); note(SUB, 58.75, 0.3, 41, 70); note(SUB, 59.0, 0.4, 36, 66)           # dud
chord(VIB, 59.05, 0.95, [62, 65, 69, 72], 44, roll=0.05); chord(PAD, 59.0, 1.0, [53, 57, 60, 64], 40, h=0)
note(MAR, 60.0, 0.5, 77, 76)                                                                       # less is more: one note
chord(BRS, 60.4, 0.5, [53, 60, 64, 67, 70, 74], 84); chord(PNO, 60.4, 0.4, [41, 53, 60, 64, 67, 70], 74)   # less is a bore
note(DR, 60.4, 0.1, 36, 84); note(DR, 60.4, 0.1, 49, 70); note(JK, 60.4, 0.8, 49, 66)
minimal(60.65, 61.6, v=2)
for k in range(6): note(DR, 61.4 + k * 0.0625, 0.05, 38, 60 + k * 5)
for k in range(8): note(HRP, 60.5 + k * 0.05, 0.4, [65, 69, 72, 76, 79, 81, 84, 88][k], 66)
note(PNO, 61.75, 0.3, 69, 72)                                                                       # lounge pickup

# ════════════════ ENDING 62–73: lounge, stop-time, the swell, the clink on the final downbeat, the hold
lounge(62.0, (0, 7), v=2, stop=66.6)
theme(PNO, 62.0, (0, 8), v=80, sw=True, pickup=False, stop=66.0)
theme(VIB, 64.0, (4, 8), v=60, sw=True, pickup=False)
chord(VIB, 65.0, 0.8, [72, 76, 81], 56)   # her 「哇。」
walking(65.5, 66.6, lambda t: 'Gm9')
chord(PNO, 66.85, 0.45, [36, 58, 61, 64, 67], 86); note(BR, 66.85, 0.2, 38, 70); note(BASS, 66.85, 0.4, 36, 84)   # 「但你没有。」
for k in range(7): chord(STR, 67.3 + k * 0.1, 0.12, [48, 55, 60, 64, 70], 40 + k * 8, h=0)
for k in range(10): note(HRP, 67.5 + k * 0.05, 0.6, [53, 57, 60, 64, 65, 69, 72, 76, 77, 81][k], 54 + k * 3)
END = DUR - 0.4
chord(PNO, 68.0, END - 68.0, [29, 41, 57, 62, 67, 72, 76, 81], 84, h=0)                          # the final chord, F6/9
chord(STR, 68.0, END - 68.0, [41, 53, 57, 62, 65, 69, 72], 76, h=0); chord(VIB, 68.0, 3.0, [72, 76, 81], 60)
note(BASS, 68.0, END - 68.0, 29, 86); note(BR, 68.0, 0.4, 49, 46)
for k in range(8): note(HRP, 68.0 + k * 0.08, 1.5, [53, 57, 60, 64, 65, 69, 72, 77][k], 58)
chord(PAD, 68.0, END - 68.0, [57, 62, 67, 72], 50, h=0)
for s, p in [(69.5, 77), (70.5, 72), (70.75, 69), (71.0, 65)]: note(PNO, s, 1.2, p, 60)          # the theme's tag under the last line

# ════════════════ render, per-hall rooms, tape-stop
music_dry, stems = sc.render(PARTS, verb_return=0.0, kick_part=DR)
send = sum(stems[n] * PARTS[n].verb for n in stems)

def make_ir(rt, rt_hi, pre=0.02, er=(), sr=SR, seed=0):
    r = np.random.default_rng(seed); n = int(rt * 1.3 * sr); t = np.arange(n) / sr
    ir = np.zeros((n + int(pre * sr), 2))
    for ch in range(2):
        w = r.standard_normal(n)
        lo = sosfilt(butter(2, 1800, 'low', fs=sr, output='sos'), w) * np.exp(-6.9 * t / rt)
        hi = sosfilt(butter(2, 1800, 'high', fs=sr, output='sos'), w) * np.exp(-6.9 * t / rt_hi)
        ir[int(pre * sr):, ch] = sosfilt(butter(1, 150, 'high', fs=sr, output='sos'), lo + 0.7 * hi)
        for d, g in er: i = int((pre + d + ch * 0.0017) * sr); ir[i, ch] += g * (1 if r.random() > 0.5 else -1)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)
ROOMS = {   # stone palace: long and warm; station: airy, bright, a metallic flutter; white cube: dry; design: crisp and short
    'palace': (make_ir(3.4, 1.3, 0.035, [(0.011, 0.5), (0.023, 0.35), (0.041, 0.3)], seed=1), 0.42),
    'station': (make_ir(2.7, 2.1, 0.025, [(0.013 * k, 0.4 * 0.8 ** k) for k in range(1, 12)], seed=2), 0.38),
    'cube': (make_ir(0.85, 0.6, 0.008, [(0.006, 0.4), (0.014, 0.25)], seed=3), 0.3),
    'design': (make_ir(1.15, 1.0, 0.012, [(0.009, 0.45), (0.019, 0.3)], seed=4), 0.3),
    'bloom': (make_ir(4.5, 2.5, 0.03, [], seed=5), 0.5),
}
SPANS = [(0, 8, 'cube'), (8, 20, 'palace'), (20, 32, 'station'), (32, 42.4, 'cube'), (42.4, 44.4, 'bloom'), (44.4, 48, 'cube'), (48, 62, 'design'), (62, 73, 'cube')]
def room_env(name, xf=0.35):
    e = np.zeros(N); tt = np.arange(N) / SR
    for a, b, r in SPANS:
        if r != name: continue
        e = np.maximum(e, np.clip((tt - a + xf / 2) / xf, 0, 1) * np.clip((b + xf / 2 - tt) / xf, 0, 1))
    return e
def rooms(x):
    out = np.zeros_like(x)
    for name, (ir, ret) in ROOMS.items():
        env = room_env(name)
        if env.max() == 0: continue
        wet = np.stack([fftconvolve(x[:, ch] * env, ir[:, ch])[:N] for ch in range(2)], axis=1)
        out += ret * wet
    return out
music = music_dry + rooms(send)

def tape_stop(x, t0, t1, resume):
    """The panic: the whole mix slows to a halt (pitch and speed fall together), then silence until the pickup."""
    i0, i1, i2 = int(t0 * SR), int(t1 * SR), int(resume * SR)
    L = i1 - i0; u = np.arange(L) / L; rate = (1 - u) ** 1.6
    pos = i0 + np.cumsum(rate); seg = np.stack([np.interp(pos, np.arange(len(x)), x[:, ch]) for ch in range(2)], axis=1)
    seg *= (1 - u ** 3)[:, None]
    seg = sosfilt(butter(2, 2500, 'low', fs=SR, output='sos'), seg, axis=0) * 0.6 + seg * 0.4 * (1 - u)[:, None]
    y = x.copy(); y[i0:i1] = seg; y[i1:i2] = 0
    f = int(0.01 * SR); y[i2:i2 + f] *= np.linspace(0, 1, f)[:, None]
    return y
music = tape_stop(music, 2.85, 3.3, 3.72)
# the stop-time before 「但你没有。」: a breath of silence in the band
i0, i1 = int(66.6 * SR), int(66.84 * SR); g = np.ones(N); g[i0:i1] = 0.08; g = np.convolve(g, np.ones(480) / 480, 'same'); music *= g[:, None]

# ════════════════ sound design: one soft palette, in the hall's room
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
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x, axis=0)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)

# designed sounds (numpy)
def s_drop():                                  # a water-drop pluck, rising into C6 (in key)
    n = int(0.16 * SR); t = np.arange(n) / SR; f = 700 + (1046 - 700) * (1 - np.exp(-t / 0.012))
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.045))
def s_brush(seed=0, dur=0.32):                 # a loaded brush sweeping across canvas
    n = int(dur * SR); t = np.arange(n) / SR
    x = sosfilt(butter(2, [700, 4200], 'band', fs=SR, output='sos'), noise(n, seed))
    am = 0.6 + 0.4 * np.abs(sosfilt(butter(1, 45, 'low', fs=SR, output='sos'), noise(n, seed + 1))) * 6
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return st(lp(x * am * e, 6500))
def s_roller():                                # a paint roller: soft rolling nap
    n = int(1.0 * SR); t = np.arange(n) / SR
    x = sosfilt(butter(2, [250, 1800], 'band', fs=SR, output='sos'), noise(n, 7)) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t))
    return st(x * np.sin(np.pi * t / 1.0) ** 0.8)
def s_thump(f0=90, f1=52, dur=0.22):           # a soft low body (stamps, duds, blocks)
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_dud():                                   # the 踩雷: a muted low "bonk" that sags in pitch
    n = int(0.42 * SR); t = np.arange(n) / SR; f = 150 * np.exp(-t / 0.5)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, 0.12)
    knock = sosfilt(butter(2, [200, 700], 'band', fs=SR, output='sos'), noise(n, 3)) * env(n, 0.001, 0.02)
    return st(body + 0.4 * knock)
def s_tear():                                  # paper tearing: a crackle of tiny bursts
    n = int(0.36 * SR); t = np.arange(n) / SR; r = np.random.default_rng(5)
    crack = (r.random(n) > 0.985) * r.standard_normal(n) * 3
    x = sosfilt(butter(2, [900, 5200], 'band', fs=SR, output='sos'), crack + 0.25 * noise(n, 6))
    return st(x * np.sin(np.pi * t / 0.36) ** 0.6)
def s_hum():                                   # the X-ray scanner: a soft low hum with a filtered sweep
    n = int(1.15 * SR); t = np.arange(n) / SR
    x = 0.5 * np.sin(2 * np.pi * 110 * t) + 0.3 * np.sin(2 * np.pi * 220 * t)
    sw = sosfilt(butter(2, [400, 1200], 'band', fs=SR, output='sos'), noise(n, 9)) * (0.5 + 0.5 * np.sin(np.pi * t / 1.15))
    return st((x * 0.6 + sw) * np.sin(np.pi * np.clip(t / 1.15, 0, 1)) ** 0.5)
def s_swell(dur=0.8):                          # a soft reverse-air swell into a reveal
    n = int(dur * SR); t = np.arange(n) / SR
    return st(lp(sosfilt(butter(2, [300, 3000], 'band', fs=SR, output='sos'), noise(n, 12)), 4000) * (t / dur) ** 2.2)

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why, align='onset', pan=0.0, maxlen=None):
    x = norm(x)
    if maxlen and len(x) > maxlen * SR: x = x[:int(maxlen * SR)].copy(); f = int(0.06 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    off = int(np.argmax(np.convolve(np.abs(x).max(1), np.ones(480) / 480, 'same'))) if align == 'peak' else 0
    if pan: x = x * np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)])
    i0 = int(t * SR) - off; a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
L = {k: trim(lib(k)) for k in (2001, 2002, 1530, 2369, 2376, 1528, 1534, 2857, 2856, 3117, 2936, 1489, 2605, 1120, 2585, 163)}
# footsteps: cut single steps out of the heel recording by onset
heel = lib(542); m = np.convolve(np.abs(heel).max(1), np.ones(240) / 240, 'same'); on = np.nonzero((m[1:] > 0.25 * m.max()) & (m[:-1] <= 0.25 * m.max()))[0]
STEPS = [trim(heel[o - 200:o + int(0.28 * SR)]) for o in on[:6] if o > 200]
def steps(t0, t1, db=-31, why='walk', every=BEAT):
    k = 0; t = t0
    while t < t1 - 1e-6:
        put(t, lp(STEPS[k % len(STEPS)], 7000), db - (k % 2) * 1.5, 'footstep (heels, 542)', why, pan=(-0.15 if k % 2 else 0.15)); t += every; k += 1

# ── the cue list (motion event → sound); levels are dB of the effect's active loudness, music sits near -16 LUFS
steps(0.1, 0.6, -34, 'a heel step in the room')
for u in ui('bubble'):
    put(u['t'], L[1120], -33 if u.get('small') else -31, 'pop_soft (1120)', f"bubble: {u['lines'][0]}")
put(2.0, L[2605], -31, 'air_quick (2605)', 'punch-in', align='peak'); put(2.25, s_drop(), -27, 'water-drop pluck (synth, C6)', 'sweat drop')
put(4.0, L[2001], -24, 'card placement (2001)', 'guide card slams in'); put(4.0, s_thump(), -29, 'low thump (synth)', 'guide card weight')
for t, why in [(7.75, 'whip-pan → Gothic (cut hidden in the blur)'), (20.0, 'whip-pan → station hall'), (32.0, 'whip-pan → white cube'), (48.0, 'whip-pan → design hall'), (62.0, 'whip-pan → black square')]: put(t, L[1489], -25 if t in (7.75, 62.2) else -27, 'whoosh_air (1489)', why, align='peak')
put(61.75, L[1489], -30, 'whoosh_air (1489)', 'whip begins', align='peak')
for u in ui('stamp'):
    put(u['t'], s_thump(110, 60, 0.18), -24 - 0.6 * (u['n'] - 1), 'stamp body (synth)', f"stamp №{u['n']}"); put(u['t'], L[2001], -30 - 0.6 * (u['n'] - 1), 'paper (2001)', f"stamp №{u['n']}")
for u in [x for x in UI if x['type'] in ('id', 'line', 'move', 'mine')]:
    put(u['t'], L[1530], -31, 'paper slide (1530)', f"{u['type']} card lands")
for u in ui('mine'): put(u['t'], s_dud(), -24, 'dud (synth)', '踩雷')
for t in (18.0, 30.0, 46.0, 58.3): put(t, L[2605], -32, 'air_quick (2605)', 'punch-in on the blunder', align='peak')
# architecture morphs, each in its own material
put(8.85, L[1528], -28, 'stone slide (1528)', 'Gothic → palace: stone grinding', maxlen=1.6)
for k in range(3): put(8.9 + k * 0.25, s_brush(k), -32, 'brush swish (synth)', 'oil strokes sweep in')
put(16.0, s_brush(4, 0.4), -31, 'brush swish (synth)', 'Baroque glaze sweeps in')
put(20.1, lp(L[1534], 2500), -31, 'metal slide, low-passed (1534)', 'iron ribs settle', maxlen=1.4)
for k in range(4): put(20.05 + k * 0.22, s_brush(10 + k, 0.22), -34, 'brush dab (synth)', 'dabs bloom')
put(28.9, s_brush(20, 0.45), -32, 'brush swish (synth)', 'dots stretch into swirls')
put(32.0, s_roller(), -29, 'paint roller (synth)', 'station → white cube')
for k in range(4): put(32.6 + k * 0.125, L[2585], -36 - k, 'switch (2585)', 'track lights click on')
put(33.8, s_brush(30, 0.3), -30, 'brush swish (synth)', 'Fauve splash')
for k in range(3): put(35.3 + k * 0.08, L[2856], -34, 'gear lock (2856)', 'facets lock together')
for k in range(3): put(36.8 + k * 0.1, s_thump(80, 50, 0.15), -32, 'block thud (synth)', 'Suprematist blocks drop')
put(38.6, s_hum(), -33, 'scanner hum (synth)', 'X-ray scan')
put(40.8, s_tear(), -29, 'paper tear (synth)', 'Dada collage tears in')
put(42.3, s_swell(0.9), -32, 'air swell (synth)', 'colour bleeds in', align='onset')
for k in range(3): put(44.3 + k * 0.08, L[1120], -33, 'pop_soft (1120)', 'Ben-Day dot wipe')
for k in range(8): put(48.05 + k * 0.1, L[2857], -34 - k * 0.4, 'gear fast lock tap (2857)', 'curtain-wall panels click in')
put(49.8, s_brush(40, 0.3), -32, 'brush swish (synth)', 'Nouveau whiplash'); put(51.3, s_brush(41, 0.3), -33, 'brush swish (synth)', 'Deco sunburst')
for k in range(4): put(52.8 + k * 0.08, L[2857], -35, 'gear fast lock tap (2857)', 'Bauhaus grid')
for k in range(8): put(57.2 + k * 0.125, L[2376][:int(0.12 * SR)], -35, 'pencil tick (2376)', 'grid line drawn')
for k in range(4): put(12.25 + k * 0.25, L[2369], -31, 'pencil scribble (2369)', 'perspective line drawn', maxlen=0.35)
put(60.4, L[2001], -24, 'card slap (2001)', '少即是无聊 sticker'); put(60.45, lp(L[3117], 3000), -31, 'mechanical (3117)', 'pipes burst out', maxlen=0.8); put(60.0, L[2856], -33, 'gear lock (2856)', '少即是多 appears')
put(31.1, L[2002], -32, 'card flick (2002)', 'MONET → MANET letter flip')
put(26.9, L[2605], -35, 'air_quick (2605)', 'squint closes', align='peak')
# walks and steps on the beat
for a, b in [(8.3, 10.5), (15.9, 16.6), (20.8, 22.4), (27.9, 28.5), (33.5, 34.0), (35.3, 35.7), (36.8, 37.2), (40.8, 41.2), (42.3, 42.8), (44.7, 45.0), (48.8, 50.0), (51.3, 51.7), (52.8, 53.2)]:
    steps(np.ceil(a / BEAT) * BEAT, b, -33)
for t in (26.0, 26.5, 27.0): put(t, lp(STEPS[int(t * 2) % len(STEPS)], 7000), -30, 'footstep (542)', 'three steps back')
for t in (43.75, 44.0): put(t, lp(STEPS[1], 7000), -32, 'footstep (542)', 'steps into the colour')
put(64.0, lp(STEPS[2], 7000), -31, 'footstep (542)', 'he steps closer, calm')
steps(65.4, 67.4, -30, 'passer-by crosses the foreground', every=0.5)
put(67.6, s_swell(0.4), -31, 'air swell (synth)', 'push into the black square', align='onset')
put(68.0, lp(L[2936], 9000), -19, 'wine-glass clink (2936)', 'CLINK — final downbeat')
# room tones per hall (hushed murmur), cut by the freeze, dipped by the stop-time
def bed(i, a, b, db, why):
    x = lib(i); n = int((b - a) * SR) + 1
    while len(x) < n: x = np.concatenate([x, x])
    x = norm(x[:n]); f = int(0.4 * SR); x[:f] *= np.linspace(0, 1, f)[:, None]; x[-f:] *= np.linspace(1, 0, f)[:, None]
    i0 = int(a * SR); SFX[i0:i0 + len(x)] += x[:N - i0] * 10 ** (db / 20); LOG.append((a, f'room tone ({i})', db, why))
bed(2981, 0.0, 3.05, -36, 'white cube murmur'); bed(2981, 4.0, 8.2, -37, 'white cube murmur')
bed(350, 7.9, 20.3, -33, 'palace: hushed church murmur'); bed(365, 19.8, 32.3, -35, 'station: lobby murmur + steps')
bed(2981, 31.8, 48.3, -37, 'white cube murmur'); bed(2981, 47.8, 62.3, -39, 'design hall murmur'); bed(2981, 62.0, 72.6, -37, 'white cube murmur')
d = np.ones(N); d[int(66.6 * SR):int(66.85 * SR)] = 0.25; d = np.convolve(d, np.ones(960) / 960, 'same'); SFX *= d[:, None]
SFX = lp(SFX, 9500)
sfx_mix = SFX + 0.6 * rooms(SFX * 0.5)

if os.environ.get('STEM_DIR'):
    os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
    for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_music.wav'), music.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_sfx.wav'), sfx_mix.astype(np.float32), SR)

# duck the band ~3 dB under each 装逼 line card so the line gets the floor (the 踩雷 cards and 「但你没有。」 already
# get a full stop in the arrangement; the X-ray line at 38.5 is already down to bass + vibes)
dk = np.ones(N)
for u in J['ui']:
    if u.get('type') == 'line' and u['t'] not in (38.5,):
        a, b = int((u['t'] - 0.05) * SR), int((u['t'] + 1.3) * SR); dk[a:b] = 10 ** (-3 / 20)
dk = np.convolve(dk, np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); music = music * dk[:, None]
x = music + sfx_mix
x = x + 0.45 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)       # presence for phone speakers
fade = np.ones(N); f0 = int((DUR - 0.5) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'artdate_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')

# ── cue sheet: every effect with its bar.beat and its level against the music around it
gain = 10 ** ((LU - LU) / 20)
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = []
for t, name, db, why in sorted(LOG):
    if not why or name.startswith('silence'): continue
    bar, beat = int(t // 2) + 1, (t % 2) / BEAT + 1
    rows.append(f'| {t:6.2f} | {bar}.{beat:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |')
hdr = ('# Art date — cue sheet (generated by music/artdate.py)\n\nTimes come from src/artdate/artdate.json, the same file the picture '
       'reads, so every sound is placed on the exact frame of its visual event (±0 frames; whooshes are peak-aligned to the cut).\n'
       'Bars are 2 s (120 BPM); "bar.beat" counts from 1. "vs music" = RMS of the SFX bus minus RMS of the music over the next 0.35 s '
       '(negative = under the music). Room tones are listed once per hall.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}.\n\n'
       '| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'artdate_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
# harshness check of every library effect used
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav')); print(f'sfx {i}: hf {an["hf"]:.3f} tonal {an["tonal"]:.2f} ring {an["ring"]} harsh={harsh(an)}')
print('wrote public/artdate_score.wav and out/artdate_cues.md')

"""Optogenetics v2 vertical video (58 s) — soundtrack synced to src/opto/opto.json and OPTO_V2_CUES.md.
Run: python3 music/opto.py → public/opto_score.wav   (STEM_DIR=out/stems_op2 also writes every stem and the SFX bus)

120 BPM, 2 s bars. A minor; the payoffs turn to A major (the pond's gate opening, "看见", the ending).
Palette, warm organic + electric and no bells: Salamander piano, MuseScore harp / slow strings / French horns (soft
swells only), kalimba, a numpy pad, a numpy sub, a filtered numpy pluck for the electric parts, R8 drum machine.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfx import Sfx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'opto', 'opto.json')))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
S = {s['id']: s for s in J['sections']}; Q = J['cues']
st = lambda k: S[k]['start']
bar = lambda t: 2.0 * round(t / 2.0)                    # the nearest bar line
sc = Score(DUR, SR, seed=11)
note, chord = sc.note, sc.chord
DR = 'drums'; KICK, SNARE, HAT = 36, 38, 42           # R8 one-shots only: no crash, no GM fallback kit
PNO, HARP, KAL, STR, HORN, PAD, BASS, PLK = 'piano', 'harp', 'kalimba', 'strings', 'horns', 'pad', 'bass', 'pluck'
PARTS = {
    PNO: SF2('piano', level=-15, verb=0.35),                     # Salamander grand
    HARP: SF2('ms', 46, level=-17, verb=0.4),                    # MuseScore harp
    KAL: SF2('kalimba', level=-19, verb=0.3),
    STR: SF2('ms', 49, level=-15, verb=0.4),                     # slow strings
    HORN: SF2('ms', 60, level=-19, verb=0.5, cap=82),            # French horns: soft swells only
    PAD: Synth('pad', level=-19, verb=0.35, duck=0.35, cutoff=2000, attack=0.6),
    BASS: Synth('sub', level=-17, verb=0.0, duck=0.45, cap=104),
    PLK: Synth('pluck', level=-18, verb=0.3, bright=1.1, decay=3.0, length=0.5, lp=6000),   # the electric pluck
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, level=-16, verb=0.12),
}

# ── harmony: one map that every part follows (bass in octave 2, voicings around A3)
A1 = 33
CH = {
    'Am': (45, [57, 60, 64]), 'Am9': (45, [57, 60, 64, 71]), 'F': (41, [57, 60, 65]), 'Fmaj7': (41, [53, 57, 60, 64]),
    'G': (43, [55, 59, 62]), 'C': (48, [55, 60, 64]), 'Dm': (38, [57, 62, 65]), 'Dm9': (38, [53, 57, 62, 64]),
    'Esus': (40, [57, 59, 64]), 'E': (40, [56, 59, 64]), 'A': (45, [57, 61, 64]), 'Aadd9': (45, [57, 61, 64, 71]),
    'D': (38, [57, 62, 66]), 'F#m': (42, [57, 61, 66]),
}
c, ti, pr, ne, po, tr, sw, si, nb = (Q[k] for k in ('cold', 'title', 'problem', 'neuron', 'pond', 'transplant', 'switch', 'sight', 'nobel'))
TITLE, PROB, NEU, POND, TRANS, SWI, SIGHT, NOBEL = (st(k) for k in ('title', 'problem', 'neuron', 'pond', 'transplant', 'switch', 'sight', 'nobel'))
REVEAL = bar(c['light'])                       # "是一束光"
P_OPEN = POND + po['open']                     # the gate opens: first lift, A major
MS = TRANS + tr['ms']                          # "精确到毫秒"
SEE = SIGHT + si['see']                        # "他看见了": biggest warm lift
ASK, FIN = NOBEL + nb['q'], NOBEL + nb['a']    # the last question, then the final line
H = sorted([
    (0, 'Am'), (REVEAL, 'Fmaj7'), (REVEAL + 2, 'G'), (TITLE - 1, 'Esus'), (TITLE - 0.5, 'E'),
    (TITLE, 'Am'), (PROB + 2, 'F'), (PROB + 4, 'Dm'), (PROB + 5, 'E'),
    (NEU, 'Am'), (NEU + 2, 'C'), (NEU + 4, 'Dm9'), (NEU + 5, 'Esus'),
    (POND, 'Am9'), (POND + 2, 'Fmaj7'), (POND + 4, 'Dm9'), (P_OPEN - 1, 'Esus'), (P_OPEN - 0.5, 'E'),
    (P_OPEN, 'A'), (P_OPEN + 1, 'D'),
    (TRANS, 'Am'), (TRANS + 2, 'F'), (TRANS + 3, 'G'), (MS, 'Am'), (TRANS + 7, 'G'),
    (SWI, 'Fmaj7'), (SWI + 2, 'Am'),
    (SIGHT, 'Am'), (SIGHT + 2, 'F'), (SIGHT + 4, 'Dm'), (SEE - 0.6, 'Esus'), (SEE - 0.3, 'E'),
    (SEE, 'A'), (NOBEL - 1, 'D'), (NOBEL - 0.5, 'E'),
    (NOBEL, 'A'), (NOBEL + 1, 'D'), (NOBEL + 2, 'F#m'), (ASK, 'Esus'), (FIN - 0.25, 'E'), (FIN, 'Aadd9'),
])
def harm(t):
    return [n for s, n in H if s <= t + 1e-6][-1]
def nxt(t):
    return next((s for s, _ in H if s > t + 1e-6), DUR)

GROOVES = {                    # 16 steps of 0.125 s per 2 s bar
    'groove': {KICK: 'x.....x.x.......', SNARE: '....x.......x...', HAT: 'x.x.x.x.x.x.x.x.'},
    'dark':   {KICK: 'x.........x.....', SNARE: '........x.......', HAT: '..x...x...x...x.'},
    'light':  {KICK: 'x.......x.......', SNARE: '............x...', HAT: '..x...x...x...x.'},
    'heart':  {KICK: 'x.x.............'},
}
DRV = {KICK: 90, SNARE: 66, HAT: 58}
def bars(s0, s1, drums=None, bass='pulse', pad=PAD, pv=52, arp=None, av=48, kal=0, harp=0, v=0):
    """The groove from s0 to s1 on the 16th grid, following the harmony map. `v` shifts every velocity."""
    for i in range(int(round(s0 / 0.125)), int(round(s1 / 0.125))):
        t = i * 0.125; s = i % 16; nm = harm(t); root, tones = CH[nm]
        new = abs(t - s0) < 1e-6 or harm(t - 0.125) != nm
        lad = sorted(tones); lad = lad + [x + 12 for x in lad] + [x + 24 for x in lad]
        if pad and new: chord(pad, t, min(nxt(t), s1) - t, tones, pv + v)
        if drums:
            for p, pat in GROOVES[drums].items():
                if pat[s] == 'x': note(DR, t, 0.1, p, DRV[p] + v - (0 if s % 4 == 0 else 8))
        if bass == 'pulse' and s % 2 == 0: note(BASS, t, 0.22, root, (94 if s % 4 == 0 else 78) + v)
        elif bass == 'beat' and s % 4 == 0: note(BASS, t, 0.45, root, (92 if s % 8 == 0 else 82) + v)
        elif bass == 'long' and new: note(BASS, t, min(nxt(t), s1) - t, root, 84 + v)
        if arp:                                    # the electric pluck, 16ths over the chord
            sh = {'low': 0, 'mid': 12, 'high': 12}[arp]
            note(PLK, t, 0.1, lad[[0, 1, 2, 3, 1, 2, 3, 4][s % 8] + (2 if arp == 'high' else 0)] + sh - 12 * (arp == 'low'), av + v + (8 if s % 4 == 0 else 0))
        if kal and s % 2 == 0:                     # kalimba ostinato in 8ths
            note(KAL, t, 0.3, lad[[0, 2, 1, 3, 2, 4, 3, 1][(s // 2) % 8]] + 12, kal + v + (8 if s % 4 == 0 else 0))
        if harp and s % 2 == 0:                    # harp: an 8th-note arpeggio rising from A4
            note(HARP, t, 0.9, lad[[0, 1, 2, 3, 4, 5, 6, 5][(s // 2) % 8]] + 12, harp + v + (6 if s % 8 == 0 else 0))

def light_on(a, b, k, v=0):
    """A light switching on: low weight on the frame, then a short electric groove until it goes off."""
    note(DR, a, 0.1, KICK, 94 + v); note(BASS, a, b - a + 0.1, A1, 96 + v)
    lad = [45, 57, 60, 64, 69, 72, 76, 81][k:k + 5]     # the ostinato climbs with each shot
    j, t = 0, a
    while t < b - 0.06:
        note(PLK, t, 0.1, lad[[1, 2, 3, 4, 3, 2, 3, 4][j % 8]], 70 + v + (8 if j % 4 == 0 else 0))
        note(DR, t, 0.05, HAT, (60 if j % 2 == 0 else 46) + v)
        if j and j % 4 == 0: note(DR, t, 0.1, KICK, 80 + v)
        if j % 2 == 0: note(BASS, t, 0.2, 45, 80 + v)
        t += 0.125; j += 1

# ── 1 cold open: the question over a low bed; three lights, each bigger; "是一束光"; the alga; the prize
shots = c['shots']
chord(STR, 0.0, REVEAL, [45, 52], 52)                                    # a low A–E bed under the whole question
chord(PAD, 0.0, REVEAL, [45, 52, 57, 60], 46)
note(BASS, 0.0, shots[0]['start'], A1, 74)
note(PNO, c['q'], 1.2, A1, 70); note(PNO, c['q'], 1.2, 45, 58)          # a low piano A under "能遥控大脑吗？"
for k, sh in enumerate(shots):
    light_on(sh['on'], sh['end'], k, v=[0, 3, 7][k])
    if k >= 1: chord(STR, sh['on'], sh['end'] - sh['on'] + 0.2, [57, 60, 64] + ([69] if k == 2 else []), 70 + 6 * k)
    if k == 2: chord(PAD, sh['on'], 0.9, [57, 60, 64, 69], 64); note(DR, sh['on'] + 0.5, 0.1, SNARE, 70)
# "是一束光": a warm Fmaj7 opening up, the piano's rising fifth (the light motif)
chord(STR, REVEAL - 0.9, 0.9, [53, 57, 60], 58)                          # swell into the reveal
chord(STR, REVEAL, 2.0, [41, 53, 57, 64], 74); chord(PAD, REVEAL, 2.0, CH['Fmaj7'][1], 60); note(BASS, REVEAL, 2.0, 41, 80)
chord(PNO, REVEAL, 1.5, [41, 64], 72); note(PNO, REVEAL + 0.5, 1.0, 69, 66); note(PNO, REVEAL + 1.0, 1.4, 76, 70)
for k in range(8): note(HARP, bar(c['alga']) + 1 + k * 0.125, 0.8, [53, 57, 60, 64, 65, 69, 72, 76][k], 62 + k * 2)   # the alga appears
chord(HORN, REVEAL + 2, 2.0, [43, 50, 55], 62)                           # a soft swell under the prize
bars(REVEAL + 2, TITLE, drums='heart', bass='long', pad=PAD, pv=56)
chord(STR, REVEAL + 2, 1.0, CH['G'][1], 62); chord(STR, TITLE - 1, 0.5, CH['Esus'][1], 70)
for k in range(8): note(PLK, TITLE - 1 + k * 0.125, 0.1, [57, 59, 64, 69, 64, 69, 71, 76][k], 52 + 3 * k)   # the blue spreads
chord(STR, TITLE - 0.5, 0.5, [52, 56, 59, 64], 80)

# ── 2 title: the downbeat (low + strings), a soft horn swell; the toggle sets the electric pulse going
chord(STR, TITLE, 2.0, [45, 52, 57, 60, 64, 69, 72], 90); chord(HORN, TITLE, 1.9, [45, 52, 57], 70)
chord(PNO, TITLE, 1.6, [45, 57, 64, 69, 76], 84); note(BASS, TITLE, 1.0, A1, 102); note(DR, TITLE, 0.1, KICK, 98)
chord(PAD, TITLE, 2.0, [57, 60, 64, 69], 62)
bars(TITLE + 1, PROB, drums='light', bass='pulse', pad=None, arp='mid', av=50)

# ── 3 the problem: a dark groove; the count climbs; electrode; the drug's slow slide; the one dot
bars(PROB, PROB + pr['end'] - 0.5, drums='dark', bass='pulse', arp='low', av=52, pv=56)
for k in range(9):                                                        # 0 → 860 亿: the pluck climbs
    note(PLK, PROB + pr['count'][0] + k * (pr['count'][1] - pr['count'][0]) / 9, 0.12, [57, 60, 64, 67, 69, 72, 76, 79, 81][k], 56 + 3 * k)
rng = np.random.default_rng(3)
for k in range(6): note(KAL, PROB + pr['net'] + 0.25 * k + 0.125 * rng.integers(0, 2), 0.3, int(rng.choice([69, 72, 74, 76, 79])), 50)   # the network flickers
chord(PNO, PROB + pr['electrode'] + 0.4, 0.8, [A1, 45, 46], 74)          # the electrode zaps a whole patch
for k in range(8): note(STR, PROB + pr['drug'] + 0.3 + 0.2 * k, 0.3, 69 - k, 66 - 2 * k)   # the drug: a slow slide down
chord(STR, PROB + 5, 1.0, [52, 56, 59, 64], 70)                           # E: a held breath before the dot zooms in

# ── 4 how a neuron fires: a light kalimba/harp groove; the gate opens; two spikes; the wish rises
bars(NEU, NEU + ne['wish'] - 0.3, drums='light', bass='beat', kal=64, pv=48)
for k in range(10): note(HARP, NEU + ne['open'] + 0.05 * k, 0.6, [57, 60, 64, 67, 69, 72, 76, 79, 81, 84][k], 60 + 3 * k)   # ions rush in
note(BASS, NEU + ne['open'], 0.6, 36, 84)
for k, s in enumerate((ne['spike'], ne['spike'] + 1.0)):                  # each spike runs down the axon
    for j, p in enumerate([69, 76, 81]): note(PLK, NEU + s + 0.06 * j, 0.1, p, 78 - 4 * k)
# "要是有一道光控闸门……": the strings rise on a suspension into the pond
chord(STR, NEU + ne['wish'], NEU + 5.2 - (NEU + ne['wish']), CH['Dm9'][1], 64)
chord(STR, NEU + 5, 1.0, [52, 57, 59, 64, 69], 78); note(BASS, NEU + 4, 1.0, 38, 70); note(BASS, NEU + 5, 1.0, 40, 74)
chord(PAD, NEU + ne['wish'], POND - NEU - ne['wish'], [57, 62, 64, 69], 56)
for k in range(8): note(HARP, NEU + 5 + k * 0.125, 0.8, [57, 59, 64, 69, 71, 76, 81, 83][k], 56 + 2 * k)

# ── 5 the pond: harp arpeggios over a pad, a drop, the alga, two scientists, the eyespot … the gate opens in A major
bars(POND, P_OPEN - 0.5, bass='long', pad=PAD, pv=54, harp=62, v=0)
chord(STR, POND, P_OPEN - 1 - POND, [45, 52, 57], 50)
note(KAL, POND + po['drop'], 0.6, 76, 70)                                 # a drop of pond water
chord(HORN, POND + po['sci'], 1.5, [45, 52, 57], 58)                      # two scientists: a warm, human colour
chord(STR, P_OPEN - 1, 0.5, [52, 57, 59, 64, 69], 74); chord(STR, P_OPEN - 0.5, 0.5, [40, 56, 59, 64, 68, 71], 86)
for k in range(4): note(HARP, P_OPEN - 0.5 + 0.125 * k, 0.6, [64, 68, 71, 76][k], 60 + 3 * k)   # the swell ends on the reveal
# the first big lift: low weight, strings and horns in A major, harp spilling upward, then the groove
note(DR, P_OPEN, 0.1, KICK, 92); note(BASS, P_OPEN, 1.0, A1, 100)
chord(STR, P_OPEN, 2.0, [45, 52, 57, 61, 64, 69, 73, 76], 94); chord(HORN, P_OPEN, 1.9, [45, 52, 57, 61], 76)
chord(PNO, P_OPEN, 1.4, [45, 57, 61, 64, 69, 76], 80); chord(PAD, P_OPEN, 1.0, [57, 61, 64, 69], 66)
for k in range(8): note(HARP, P_OPEN + 0.0625 * k, 0.9, [57, 61, 64, 69, 73, 76, 81, 85][k], 70 + 2 * k)
bars(P_OPEN + 0.5, TRANS, drums='groove', bass='pulse', pad=None, arp='mid', av=50, v=-2)
chord(STR, P_OPEN + 1, 1.0, [50, 57, 62, 66], 84)                         # "梦寐以求的光控闸门"

# ── 6 the transplant: the groove; three steps; the blue pulses ARE the beat; a heavy downbeat on "精确到毫秒"
p0 = TRANS + tr['pulse0']; pulses = [p0 + k * tr['pulseStep'] for k in range(tr['pulses'])]
bars(TRANS, bar(p0) - 1, drums='groove', bass='pulse', arp='mid', av=48, pv=50)
bars(bar(p0) - 1, MS, bass='long', pad=PAD, pv=54)                        # the band steps back; only the pulses drive
for k, s in enumerate(tr['steps']): note(HARP, TRANS + s, 0.8, [69, 72, 76][k], 76)
chord(STR, bar(p0) - 1, MS - bar(p0) + 1, [43, 55, 62, 67], 60)
for k, s in enumerate(pulses):                                            # one pluck per flash, one soft kick per spike
    note(PLK, s, 0.12, [69, 72, 74, 76, 79, 81][k], 84); note(DR, s, 0.1, KICK, 70 + 2 * k)
note(DR, MS, 0.1, KICK, 98); note(BASS, MS, 0.9, A1, 104)
chord(STR, MS, 1.4, [45, 52, 57, 60, 64, 69], 92); chord(PNO, MS, 1.0, [45, 57, 60, 64, 69], 86)
bars(bar(MS), SWI, drums='groove', bass='pulse', arp='high', av=50, pv=52)

# ── 7 on & off: bright plucks for the blue side, a low hush for the amber side; then the mouse spins again
chord(PAD, SWI, 2.4, CH['Fmaj7'][1], 60); chord(STR, SWI, 2.4, [41, 48, 57], 66)   # the amber side: a low, quiet hold
chord(PNO, SWI, 1.5, [41, 53, 57, 60, 64], 70); note(DR, SWI, 0.1, KICK, 78); note(BASS, SWI, 2.0, 41, 70)
for k in range(sw['fires']): note(PLK, SWI + sw['fire0'] + k * sw['fireStep'], 0.1, [72, 76, 79, 81, 84, 81, 79, 76][k % 8], 76)
for s in sw['spont']: note(HARP, SWI + s, 0.5, 45, 66)                    # the amber neuron, firing on its own
chord(PAD, SWI + 2, 2.0, [45, 52, 57, 60], 58); note(BASS, SWI + 2, sw['spin'] - 2, A1, 66)
light_on(SWI + sw['spin'], SWI + sw['spin'] + 0.8, 0, v=-6)                # the same light as the cold open
chord(STR, SWI + sw['spin'] + 0.8, SIGHT - SWI - sw['spin'] - 0.8, [45, 52, 57, 60], 56)

# ── 8 sight: piano and strings, held back; the swell lands on "看见" in A major
mot = [(0, 69), (0.5, 76), (1, 74), (1.5, 72), (2, 72), (2.5, 69), (3, 67), (3.5, 65), (4, 65), (4.5, 69), (5, 71), (5.3, 68)]
for s, p in mot: note(PNO, SIGHT + s, 0.9, p, 76)
for s in (0, 2, 4):                                                       # left hand: a slow broken chord
    r = CH[harm(SIGHT + s)][0]
    for j, d in enumerate([0, 7, 12, 15 if harm(SIGHT + s) != 'F' else 16, 19, 12, 7, 12][:8 if s < 4 else 4]): note(PNO, SIGHT + s + 0.25 * j, 0.6, r + d, 60 - 4 * (j % 2))
chord(PNO, SEE - 0.6, 0.6, [40, 47], 60)
chord(STR, SIGHT, 2.0, [45, 57, 60, 64], 66); chord(STR, SIGHT + 2, 2.0, [41, 57, 60, 65], 68); chord(STR, SIGHT + 4, SEE - SIGHT - 4.6, [38, 57, 62, 65], 72)
chord(STR, SEE - 0.6, 0.3, [40, 57, 59, 64, 71], 80); chord(STR, SEE - 0.3, 0.3, [40, 56, 59, 64, 71], 86)
note(PAD, SIGHT, SEE - 0.3 - SIGHT, 45, 52)
for k, s in enumerate((si['inject'] + 0.3, si['goggles'])): note(HARP, SIGHT + s, 0.6, [64, 69][k], 58)
# "他看见了": the biggest warm lift — the chord blooms rather than hits
note(DR, SEE, 0.1, KICK, 80); note(BASS, SEE, 2.2, A1, 96)
chord(STR, SEE, 2.4, [45, 52, 57, 61, 64, 69, 73, 76], 100); chord(HORN, SEE, 2.4, [45, 52, 57, 61], 80)
chord(PNO, SEE, 2.0, [45, 52, 61, 64, 69, 73, 76], 88); chord(PAD, SEE, 2.4, [57, 61, 64, 69], 68)
for k in range(8): note(HARP, SEE + 0.125 * k, 1.0, [57, 61, 64, 69, 73, 76, 81, 85][k], 66 + 2 * k)
for s, p in [(si['count'] - si['see'], 76), (NOBEL - 1 - SEE, 74), (NOBEL - 0.5 - SEE, 73)]: note(PNO, SEE + s, 0.9, p, 72)
chord(STR, NOBEL - 1, 1.0, [50, 57, 62, 66], 76); bars(NOBEL - 1, NOBEL, drums='heart', bass='beat', pad=None, v=-6)

# ── 9 the prize: warm A major, the piano motif, strings and horns; pull back on the question; land the final line
bars(NOBEL, ASK, drums='light', bass='beat', pv=56, harp=58, v=-2)
for s, p in [(0, 69), (0.5, 76), (1, 74), (1.5, 73), (2, 73)]: note(PNO, NOBEL + s, 0.9, p, 72)
chord(STR, NOBEL, ASK - NOBEL, [45, 57, 61, 64], 72); chord(HORN, NOBEL + 1, 1.5, [50, 57, 62], 60)
chord(STR, ASK, FIN - ASK, [40, 57, 59, 64], 74); chord(PAD, ASK, FIN - ASK, [57, 59, 64], 56); note(BASS, ASK, FIN - ASK, 40, 76)
note(PNO, ASK, 0.6, 71, 62)
# the final line lands on the widest chord of the film, rings, and leaves ~1 s of breath
END = DUR - 1.2
note(DR, FIN, 0.1, KICK, 92); note(BASS, FIN, END - FIN, A1, 98)
chord(STR, FIN, END - FIN, [33, 45, 52, 57, 61, 64, 69, 71, 73, 76], 100); chord(HORN, FIN, END - FIN, [45, 52, 57, 61, 64], 80)
chord(PNO, FIN, END - FIN, [A1, 45, 57, 61, 64, 69, 76], 90); chord(PAD, FIN, END - FIN, CH['Aadd9'][1] + [69], 66)
for k in range(8): note(HARP, FIN + 0.125 * k, 1.4, [57, 61, 64, 69, 71, 73, 76, 81][k], 64 + 2 * k)
note(PNO, NOBEL + nb['src'], 1.2, 81, 56)                                 # one last high A under the closing line

x, stems = sc.render(PARTS, kick_part=DR)
x = x + 0.6 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)   # a gentle presence lift (≤ +4 dB, 1.2–5 kHz) for phone speakers
fade = np.ones(N); i0, i1 = int((DUR - 1.0) * SR), N
fade[i0:i1] = np.cos(np.linspace(0, np.pi / 2, i1 - i0)) ** 2; fade[:int(0.005 * SR)] = np.linspace(0, 1, int(0.005 * SR))
x *= fade[:, None]

# ── sound effects: one soft palette (air for cuts, the real switch for lights, low thumps for weight, water, muted pops)
fx = Sfx(DUR, SR)
# every cut: an air whoosh peaking on the section start (the 0.45 s iris that grows out of the last scene); later cuts quieter
for sec, name, db in [('title', 'whoosh_air', -24), ('problem', 'whoosh_air', -26), ('neuron', 'swoosh_vacuum', -26),
                      ('pond', 'swell_slow', -27), ('transplant', 'whoosh_air', -27), ('sight', 'whoosh_air', -30), ('nobel', 'whoosh_air', -28)]:
    fx.play(st(sec), name, db, align='peak')
fx.play(SWI, 'sweep_air', -30, align='peak', pan=-0.6); fx.play(SWI + 0.04, 'sweep_air', -31, align='peak', pan=0.6)   # blue from the left, amber from the right
# 1 cold open
fx.play(c['ask'], 'deep_hit', -29, rate=1.53)                             # a low heartbeat under the question (tuned to A)
fx.play(c['q'] + 0.45, 'heartbeat', -28); fx.play(c['q'] + 1.0, 'heartbeat', -31)
for k, sh in enumerate(shots):
    fx.play(sh['on'], 'switch', -21 - 0.5 * k); fx.play(sh['on'], 'bass_hit', -25, rate=1.59)   # click + low body
    fx.play(sh['end'], 'switch', -22 - 0.5 * k, rate=0.92)                # off: the same switch, a touch lower
for k in range(2): fx.play(c['nots'] + 0.4 + 0.3 * k, 'air_quick', -31 - 2 * k, align='peak', maxlen=0.7)   # two red strike-throughs
fx.play(c['light'], 'deep_air', -27, align='peak')                        # "是一束光": a warm sweep
fx.play(c['alga'], 'bubble', -27)
fx.play(c['prize'], 'pop_soft', -24)
fx.play(TITLE, 'riser', -30, align='peak')                                # the blue spreading into the title
# 2 title
fx.play(TITLE, 'bass_hit', -24, rate=1.59); fx.play(TITLE + ti['toggle'], 'switch', -18)
# 3 the problem
fx.play(PROB + pr['electrode'] + 0.4, 'electric_pop', -26, rate=0.8); fx.play(PROB + pr['electrode'] + 0.4, 'bass_hit', -29, rate=1.59)
fx.play(PROB + pr['drug'] + 0.3, 'deep_air', -27, rate=0.75, maxlen=1.3)              # the drug's slow slide
# 4 neuron
fx.play(NEU + ne['open'] + 0.1, 'vacuum', -26, align='peak'); fx.play(NEU + ne['open'] + 0.15, 'bubble', -26)
for k, s in enumerate((ne['spike'], ne['spike'] + 1.0)): fx.play(NEU + s, 'electric_pop', -23 - 2 * k)
# 5 pond
fx.play(POND + po['drop'], 'bubble_liquid', -28)
fx.play(POND + po['zoom'] + 0.35, 'sweep_air', -30, align='peak')
for k in range(2): fx.play(POND + po['sci'] + 0.4 + 0.25 * k, 'pop_soft', -25 - k)
fx.play(POND + po['eyespot'] + 0.4, 'vacuum', -28, align='peak')          # into the eyespot
fx.play(P_OPEN, 'bass_hit', -22, rate=1.59); fx.play(P_OPEN + 0.1, 'bubble_liquid', -26)   # the gate opens: low body + water
# 6 transplant
for k, s in enumerate(tr['steps']): fx.play(TRANS + s, 'pop_soft', -23 - k)
fx.play(MS, 'bass_hit', -22, rate=1.59)
# 7 on & off
fx.play(SWI + sw['spin'], 'switch', -20); fx.play(SWI + sw['spin'] + 0.25, 'air_quick', -29, align='peak', pan=-0.3)
# 8 sight
fx.play(SIGHT + si['inject'] + 0.45, 'vacuum', -29, align='peak')         # the injection: soft air pressure
fx.play(SIGHT + si['goggles'] + 0.15, 'lock_quick', -26)                  # the goggles click into place
fx.play(SEE, 'swell_slow', -24, align='peak')                             # a warm air swell into "看见"
# 9 the prize
for k, s in enumerate(nb['people']): fx.play(NOBEL + s, 'pop_soft', -24 - k)
fx.play(FIN, 'bass_hit', -23, rate=1.59); fx.play(FIN, 'air_quick', -29, align='peak')   # the black bar wipes in
bus = fx.mix(sc.ir, 0.15, lp=9000)
if os.environ.get('STEM_DIR'):                  # for the level check: the music and the SFX bus before mastering
    sf.write(os.path.join(os.environ['STEM_DIR'], '_music.wav'), x.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_sfxbus.wav'), bus.astype(np.float32), SR)
    json.dump(fx.log, open(os.path.join(os.environ['STEM_DIR'], '_sfx_log.json'), 'w'))
x = x + bus
x, L, P = master(x, SR)
print(f'integrated {L:.1f} LUFS, peak {P:.1f} dBFS')
med, mx, jj = jumps(x, SR)
print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'opto_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/opto_score.wav')

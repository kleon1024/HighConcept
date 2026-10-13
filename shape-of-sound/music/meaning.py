"""意义，从哪来？(60 s) — score and sound design, synced to src/meaning/meaning.json.
Run: python3 music/meaning.py → public/meaning_score.wav, out/meaning_sfx_only.wav, out/meaning_cues.md

The question has a four-note motif (D F A … G — rising, then left hanging) and every era asks it in its own music:
lyre and aulos (Plato) · pizzicato and bassoon (Diogenes) · Roman brass over war drums (Marcus Aurelius) · plainchant over
an organ pedal (Augustine) · lute and recorder (the Renaissance) · a harpsichord fugue (Descartes) · a string quartet,
D minor for Kant and F major for Bentham · Wagner's Tristan chord and a ticking piano (Schopenhauer) · an iron march
(Marx) · a sunrise fanfare whose major turns minor (Nietzsche) · Left Bank jazz (Sartre, Camus) · Reich-like marimba,
then real silence (Wittgenstein: 「必须保持沉默」) · techno (Foucault) · chopped vaporwave (postmodernism) · lo-fi
(modern cynicism). The ending answers the question: the motif finally climbs to the high D, and D minor turns D major.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'meaning', 'meaning.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); B = 0.5
SEG = {s['id']: s for s in J['seg']}; CU = J['cue']; HK = J['hook']

PARTS = {
    'harp': SF2('ms', 46, level=-17, verb=0.45), 'harpL': SF2('ms', 46, level=-19, verb=0.4, pan=-0.6), 'oboe': SF2('ms', 68, level=-19, verb=0.4),
    'pizz': SF2('ms', 45, level=-19, verb=0.3), 'bsn': SF2('ms', 70, level=-20, verb=0.3), 'tpt': SF2('ms', 56, level=-19, verb=0.45),
    'horn': SF2('ms', 60, level=-19, verb=0.5, cap=112), 'tbn': SF2('ms', 57, level=-21, verb=0.35), 'tuba': SF2('ms', 58, level=-21, verb=0.3),
    'taiko': SF2('ms', 116, level=-19, verb=0.35), 'choir': SF2('ms', 52, level=-18, verb=0.7), 'organ': SF2('ms', 19, level=-19, verb=0.65),
    'lute': SF2('ms', 24, level=-18, verb=0.35), 'rec': SF2('ms', 74, level=-20, verb=0.4), 'viol': SF2('ms', 42, level=-20, verb=0.4),
    'hpsi': SF2('ms', 6, level=-18, verb=0.3), 'str': SF2('ms', 48, level=-18, verb=0.45), 'strS': SF2('ms', 49, level=-18, verb=0.55),
    'trem': SF2('ms', 44, level=-22, verb=0.45), 'piano': SF2('piano', level=-16, verb=0.35), 'keysLo': SF2('piano', level=-19, verb=0.25, lp=2200, pan=0.55),
    'timp': SF2('ms', 47, level=-18, verb=0.45), 'abass': SF2('ms', 32, level=-18, verb=0.2), 'mute': SF2('ms', 59, level=-19, verb=0.35),
    'cb': SF2('ms', 43, level=-20, verb=0.35), 'mar': SF2('ms', 12, level=-18, verb=0.3),
    'pluck': Synth('pluck', level=-20, verb=0.3, bright=1.5, decay=3.0, length=0.3, lp=6500), 'lead': Synth('pluck', level=-20, verb=0.35, bright=1.1, decay=1.4, length=0.6, lp=5000),
    'sub': Synth('sub', level=-20, verb=0.0, duck=0.35, cap=100), 'pad': Synth('pad', level=-24, verb=0.5, duck=0.25, cutoff=1500, attack=0.4),
    'vapor': Synth('pad', level=-21, verb=0.6, duck=0.1, cutoff=1100, attack=0.15, detune=(-28, -12, 0, 13, 27)),
    'bed': Synth('pad', level=-29, verb=0.55, duck=0.1, cutoff=1000, attack=0.9),
    'drums': Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, fallback_kit=0, level=-20, verb=0.12),
    'kit': Drums({}, fallback_kit=0, level=-21, verb=0.3), 'brush': Drums({}, fallback_kit=40, level=-22, verb=0.25),
}
sc = Score(DUR, SR, seed=2500)
rng = np.random.default_rng(2500)
MUTE = CU['witt']['mute']
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR or (MUTE[0] - 0.02 <= s < MUTE[1]): return
    if s < MUTE[0] and s + d > MUTE[0]: d = MUTE[0] - s - 0.01            # nothing rings into the silence
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.004, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
# the question: D F A … G (rising, then left hanging)
Q = [(0, 0.5, 74), (0.5, 0.5, 77), (1, 0.5, 81), (1.5, 1.5, 79)]
def ask(part, t0, v=80, tr=0, step=B, legato=0.95, swing=0.0, stac=False):
    for b, d, p in Q:
        s = t0 + b * step + (swing * step if (b * 2) % 2 == 1 else 0)
        note(part, s, 0.16 if stac else d * step * legato, p + tr, v + (6 if b == 0 else 0))
CH = {'Dm': (38, [62, 65, 69, 74]), 'C': (36, [60, 64, 67, 72]), 'Am': (45, [57, 60, 64, 69]), 'Bb': (34, [58, 62, 65, 70]), 'F': (41, [60, 65, 69, 72]),
      'G': (43, [59, 62, 67, 71]), 'Gm': (43, [58, 62, 67, 70]), 'A': (45, [57, 61, 64, 69]), 'D': (38, [62, 66, 69, 74]), 'Dm7': (38, [60, 65, 69, 72]),
      'G7': (43, [59, 65, 67, 71]), 'Cmaj7': (36, [59, 64, 67, 71]), 'A7': (45, [61, 64, 67, 69]), 'Dm9': (38, [64, 65, 69, 72]), 'Fmaj7': (41, [64, 65, 69, 72]),
      'Em7': (40, [62, 64, 67, 71]), 'Bbmaj7': (34, [62, 65, 69, 70])}
def pad(s, d, nm, v=46): chord('pad', s, d, CH[nm][1], v, h=0)
def hit(s, nm='Dm', v=104, choir=True):
    root, vo = CH[nm]
    chord('strS', s, 1.2, [root, root + 12] + vo[:3], v - 12, h=0); note('timp', s, 0.8, root, v); note('sub', s, 1.0, root - 12, v - 6); note('taiko', s, 0.6, 40, v - 6)
    chord('horn', s, 0.8, vo[:3], v - 22)
    if choir: chord('choir', s, 1.4, vo, v - 34)
def S(i): return SEG[i]['t']

# ═══ the opening: the compass, the slam, two seconds of every era, the question
chord('trem', 0.0, 0.5, [38, 50, 57], 50); note('trem', 0.0, 0.5, 62, 50)
hit(HK['slam'], 'Dm', 112)
TIMBRES = ['harp', 'organ', 'tpt', 'lute', 'hpsi', 'str', 'piano', 'tbn', 'mute', 'mar', 'pluck', 'keysLo', 'harp', 'organ', 'tpt', 'lead']
for i in range(16):
    s = HK['flash'][0] + i * 0.125; b, d, p = Q[i % 4]
    note(TIMBRES[i], s, 0.14, p + (0 if i < 8 else 12), 88)
    if i % 4 == 0: note('drums', s, 0.2, 36, 96); note('taiko', s, 0.3, 40, 70)
    if i % 4 == 2: note('drums', s, 0.2, 38, 78)
    note('drums', s + 0.0625, 0.05, 42, 36)
note('cb', HK['ask'], 1.0, 38, 60); chord('bed', HK['ask'], 1.0, CH['Dm'][1], 46, h=0); note('piano', HK['ask'], 0.9, 62, 66)
hit(HK['title'], 'Dm', 106); ask('horn', HK['title'] + 0.25, 84, tr=-12, step=0.5); ask('strS', HK['title'] + 0.25, 74, step=0.5, legato=1.0)
chord('choir', HK['title'], 2.5, [62, 65, 69, 76], 66); note('cb', HK['title'], 2.5, 38, 66)
for k in range(8): note('timp', 5.5 + k * 0.0625, 0.08, 38, 50 + k * 6)

# ═══ 01 Plato: lyre and aulos, D Dorian; the perfect circle is a pure, wide chord
t0 = S('plato')
for k in range(14):
    s = t0 + k * 0.25; nm = 'Dm' if s < t0 + 1.5 else 'C' if s < t0 + 2.5 else 'Dm'; vo = CH[nm][1]
    note('harp', s, 0.4, vo[[0, 2, 1, 3][k % 4]] - 12 + (12 if k % 8 >= 4 else 0), 60 if k % 2 else 68)
for e in (0, 0.75, 1.0, 1.5, 2.0, 2.75, 3.0): note('kit', t0 + e, 0.3, 45 if e % 1 == 0 else 41, 70)
ask('oboe', t0 + 0.25, 86); note('cb', t0, 3.5, 38, 58); pad(t0, 3.5, 'Dm', 40)
chord('strS', CU['plato']['form'], 1.0, [50, 57, 62, 66, 69, 74], 66, h=0); chord('choir', CU['plato']['form'], 1.0, [62, 66, 69], 56)

# ═══ 02 Diogenes: pizzicato and a bassoon, cheeky; an eclipse, and one deadpan note
t0 = S('kynic')
for k in range(7):
    s = t0 + k * 0.25; vo = CH['Dm' if k < 4 else 'G'][1]
    note('pizz', s, 0.16, vo[k % 4] - (12 if k % 2 == 0 else 0), 70)
    if k % 2 == 0: note('kit', s, 0.2, 37, 52)
ask('bsn', t0, 80, tr=-24, stac=True)
note('bsn', CU['kynic']['lamp'], 0.2, 50, 84); note('bsn', CU['kynic']['lamp'] + 0.25, 0.3, 45, 84)
note('timp', CU['kynic']['sun'], 0.6, 38, 96); note('sub', CU['kynic']['sun'], 0.6, 26, 90)
note('harp', CU['kynic']['sun'] + 0.3, 1.2, 74, 80)                                                        # 「别挡住我的阳光」
for k in range(4): note('pizz', CU['kynic']['sun'] + 0.75 + k * 0.25, 0.15, [62, 65, 69, 74][k], 66)
pad(t0, 3.0, 'Dm', 36)

# ═══ 03 Marcus Aurelius: a Roman march — war drums, brass in fifths, a tuba
t0 = S('stoic')
for k in range(12):
    s = t0 + k * 0.25
    note('taiko', s, 0.3, 40, 92 if k % 4 == 0 else 62); note('kit', s, 0.15, 38, 56 if k % 2 else 40)
    if k % 2 == 0: note('tuba', s, 0.22, [38, 45][(k // 2) % 2], 80)
ask('tpt', t0, 92); ask('horn', t0, 80, tr=-12)
chord('tpt', CU['stoic']['inner'], 0.4, [62, 69], 84); chord('tpt', CU['stoic']['outer'], 0.4, [57, 64], 84)
for k in range(8): note('mar', CU['stoic']['inner'] + k * 0.0625, 0.08, 86 + (k % 4) * 2, 58)              # tiles click into place
for k in range(8): note('mar', CU['stoic']['outer'] + k * 0.0625, 0.08, 74 + (k % 4) * 2, 54)
hit(CU['stoic']['line'], 'Dm', 92, choir=False)

# ═══ 04 Augustine: plainchant in parallel fifths over an organ pedal
t0 = S('god')
note('organ', t0, 3.5, 26, 70); note('organ', t0, 3.5, 38, 64); note('organ', t0, 3.5, 45, 56)
for b, d, p in Q: note('choir', t0 + 0.3 + b * 0.75, d * 0.75 * 1.05, p - 12, 82); note('choir', t0 + 0.3 + b * 0.75, d * 0.75 * 1.05, p - 19, 72)
chord('choir', CU['god']['line'], 1.25, [57, 62, 69], 70); chord('strS', t0, 3.5, [50, 57, 62], 44, h=0)

# ═══ 05 the Renaissance: lute and recorder, a galliard
t0 = S('renais')
for k in range(12):
    s = t0 + k * 0.25; vo = CH[['Dm', 'C', 'F', 'A'][(k // 3) % 4]][1]
    note('lute', s, 0.3, vo[k % 3] - 12, 70 if k % 3 == 0 else 58)
ask('rec', t0 + 0.25, 82, tr=12); note('viol', t0, 1.5, 38, 66); note('viol', t0 + 1.5, 1.5, 45, 66)
for k in (0, 1.5, 2.25): note('kit', t0 + k, 0.2, 54, 50)                                                  # tambourine
chord('lute', CU['renais']['line'], 0.6, [50, 57, 62, 65], 72, roll=0.03)

# ═══ 06 Descartes: a harpsichord fugue on the question
t0 = S('cogito')
ask('hpsi', t0, 84); ask('hpsi', t0 + 0.75, 78, tr=-5); ask('hpsi', t0 + 1.5, 76, tr=-12)
for k in range(12): note('hpsi', t0 + k * 0.25, 0.2, [38, 45, 41, 45][k % 4], 60)
note('cb', t0, 3.0, 38, 54); chord('str', t0 + 1.5, 1.5, [50, 57, 62], 50, h=0)
note('hpsi', CU['cogito']['point'], 0.5, 86, 92); chord('strS', CU['cogito']['point'], 1.0, [50, 57, 62, 65, 69], 62, h=0)

# ═══ 07 Kant (D minor) vs Bentham (F major): a string quartet and a fortepiano
t0 = S('ethics')
for k in range(16):
    s = t0 + k * 0.125; note('str', s, 0.12, [50, 57, 53, 57][k % 4], 58)
ask('str', t0 + 0.25, 84, tr=12); note('cb', t0, 2.0, 38, 62)
t1 = CU['ethics']['bentham']
for k in range(10):
    s = t1 + k * 0.125; note('piano', s, 0.12, [53, 60, 57, 60][k % 4], 60)
ask('piano', t1 + 0.1, 84, tr=3); chord('str', t1, 1.2, [53, 60, 65, 69], 56, h=0); note('cb', t1, 1.2, 41, 62)
for k, nm in enumerate(['Dm', 'F', 'Dm', 'F']): chord('strS', CU['ethics']['vs'] + k * 0.18, 0.16, CH[nm][1], 82, h=0)
hit(CU['ethics']['vs'] + 0.75, 'Dm', 88, choir=False)
chord('strS', CU['ethics']['vs'], 0.8, [50, 57, 62, 65], 70, h=0); note('cb', CU['ethics']['vs'], 0.8, 38, 70); note('timp', CU['ethics']['vs'] + 0.5, 0.25, 38, 70)

# ═══ 08 Schopenhauer: Tristan's chord; a cello's yearning; a piano that ticks like a pendulum
t0 = S('will')
chord('strS', t0, 1.25, [53, 59, 63, 68], 86, h=0); chord('piano', t0, 1.25, [53, 59, 63, 68], 78)
note('cb', t0, 1.25, 29, 66); note('trem', t0, 3.0, 41, 40)
chord('strS', t0 + 1.0, 0.25, [52, 56, 62, 71], 72, h=0)
for k in range(9):
    s = CU['will']['pend'] + k * 0.25; note('piano', s, 0.24, 38 if k % 2 == 0 else 45, 74)
    if k % 2 == 0: chord('piano', s + 0.125, 0.12, [62, 65, 69], 46)
ask('piano', CU['will']['pend'], 76, tr=12); ask('viol', CU['will']['pend'], 66, tr=-12, legato=1.0)
chord('strS', CU['will']['line'], 1.25, [46, 58, 62, 65], 64, h=0)

# ═══ 09 Marx: an iron march — brass in octaves, snare, tuba ostinato; a punch
t0 = S('marx')
for k in range(12):
    s = t0 + k * 0.25
    note('drums', s, 0.15, 38, 84 if k % 2 == 1 else 54); note('tuba', s, 0.2, [38, 38, 45, 38][k % 4], 82 if k % 2 == 0 else 64)
    if k % 2 == 0: note('drums', s, 0.2, 36, 92)
ask('tpt', t0 + 0.5, 96); ask('tbn', t0 + 0.5, 86, tr=-24); ask('horn', t0 + 0.5, 84, tr=-12)
hit(CU['marx']['punch'], 'Dm', 108, choir=True)

# ═══ 10 Nietzsche: tremolo and timpani; a sunrise fanfare whose major turns minor; the values shatter; make your own
t0 = S('nietz')
chord('trem', t0, 0.5, [38, 45, 50], 60)
for k in range(8): note('timp', t0 + k * 0.0625, 0.08, 38, 40 + k * 7)
C = CU['nietz']
note('tpt', C['dead'], 0.25, 62, 106); note('tpt', C['dead'] + 0.25, 0.25, 69, 106); note('tpt', C['dead'] + 0.5, 0.5, 74, 110)
chord('horn', C['dead'] + 0.75, 0.5, [62, 66, 69], 98); chord('strS', C['dead'] + 0.75, 0.5, [50, 62, 66, 69, 74], 94, h=0)     # major …
chord('organ', C['dead'] + 0.75, 0.75, [38, 50, 62, 66, 69], 82)
for k in range(6): note('timp', C['dead'] + 0.25 + k * 0.25, 0.2, 38 if k % 2 == 0 else 45, 100 - k * 4)
chord('horn', C['swirl'] + 0.75, 0.5, [62, 65, 69], 98); chord('strS', C['swirl'] + 0.75, 0.5, [50, 62, 65, 69, 74], 94, h=0)    # … minor
chord('organ', C['fall'], 0.75, [38, 49, 50, 56, 57, 63], 76); note('sub', C['fall'], 0.8, 26, 96)
for i in range(4): note('tbn', C['fall'] + i * 0.12, 0.3, [50, 46, 43, 38][i], 86)
for i, p in enumerate([62, 65, 69, 74]): note('tpt', C['make'] + i * 0.15, 0.3, p, 86 + i * 4)               # D F A → D: almost an answer
chord('horn', C['make'] + 0.6, 0.4, [62, 65, 69], 90)

# ═══ 11 Sartre, Camus: Left Bank jazz; Sisyphus climbs and falls in the bass
t0 = S('exist'); SW = 0.5 * 2 / 3
JZ = ['Dm7', 'Dm7', 'G7', 'G7', 'Cmaj7', 'Cmaj7', 'A7']
for k in range(7):
    s = t0 + k * 0.5; nm = JZ[k]; root, vo = CH[nm]
    note('brush', s, 0.2, 51, 72 if k % 2 == 0 else 58); note('brush', s + SW, 0.15, 51, 52)
    if k % 2 == 1: note('brush', s, 0.2, 38, 54)
    if s < CU['exist']['sisy']: note('abass', s, 0.45, root + (0 if k % 2 == 0 else 7), 84)
    if k % 2 == 0: chord('piano', s + SW, 0.3, [vo[1], vo[3]], 58)
ask('mute', t0 + 0.25, 86, swing=1 / 3, legato=0.85); note('mute', t0 + 1.9, 0.3, 80, 72)              # a blue note
for cyc in range(2):
    s0 = CU['exist']['sisy'] - 0.25 + cyc * 1.5
    for i in range(5): note('abass', s0 + i * 0.22, 0.2, 38 + i * 2, 82 + i * 2)
    for i in range(5): note('abass', s0 + 1.1 + i * 0.07, 0.07, 46 - i * 2, 72)
chord('piano', CU['exist']['sisy'] + 0.9, 0.6, [62, 66, 69, 73], 70, roll=0.02)                             # imagine him happy

# ═══ 12 Wittgenstein: Reich-like marimba; then the music stops for real
t0 = S('witt')
PAT = [74, 77, 81, 79, 77, 74, 81, 77]
for k in range(16):
    s = t0 + k * 0.125
    note('mar', s, 0.12, PAT[k % 8], 76); note('mar', s + 0.0625, 0.08, PAT[(k + 3) % 8] - 12, 52)
for k in range(4): note('drums', t0 + k * 0.5, 0.2, 36, 76)
pad(t0, 1.75, 'Dm9', 44)
note('piano', CU['witt']['silent'], 0.45, 74, 64); note('piano', CU['witt']['silent'] + 0.25, 0.25, 69, 56)
# (silence from mute[0] to mute[1]: note() refuses anything there)

# ═══ 13 Foucault: techno — four on the floor, an arpeggio, a scanning lead
t0 = S('fouc')
for k in range(6):
    s = t0 + k * 0.5; note('drums', s, 0.2, 36, 100); note('drums', s + 0.25, 0.05, 42, 60); note('sub', s, 0.4, 26, 86)
    if k % 2 == 1: note('drums', s, 0.15, 38, 70)
for k in range(24): note('pluck', t0 + k * 0.125, 0.1, [62, 65, 69, 72, 74, 72, 69, 65][k % 8] + 12, 64)
ask('lead', t0 + 0.5, 86, tr=12); pad(t0, 3.0, 'Dm9', 50)

# ═══ 14 postmodern: vaporwave — a slowed, detuned chord; the question chopped into stutters
t0 = S('post')
chord('vapor', t0, 1.25, CH['Fmaj7'][1], 70, h=0); chord('vapor', t0 + 1.25, 1.25, CH['Em7'][1], 70, h=0)
note('sub', t0, 1.25, 29, 80); note('sub', t0 + 1.25, 1.25, 28, 80)
for k in range(4): note('drums', t0 + k * 0.5, 0.2, 36 if k % 2 == 0 else 38, 84)
for k in range(8): note('lead', t0 + 0.5 + k * 0.0625, 0.06, 74, 70)                                     # stutter
ask('keysLo', t0 + 1.0, 80, tr=-1)
for k in range(12): note('lead', CU['post']['glitch'] + k * 0.04, 0.04, [74, 77, 81, 79][k % 4] + (12 if k % 3 == 0 else 0), 66)

# ═══ 15 modern cynicism: lo-fi; at the split, the lyre (left) and the lo-fi (right) at once
t0 = S('cynic')
for k in range(6):
    s = t0 + k * 0.5
    if k % 4 == 0: note('drums', s, 0.2, 36, 100)
    if k % 4 == 2: note('drums', s + 0.03, 0.2, 38, 90)
    note('drums', s + 0.25, 0.05, 42, 52); note('drums', s, 0.05, 42, 40)
    if k % 2 == 0: note('sub', s, 0.45, 26, 86)
for k, nm in enumerate(['Dm7', 'Bbmaj7', 'Dm7']): chord('keysLo', t0 + k * 1.0 + 0.04, 0.95, CH[nm][1], 72, roll=0.02)
ask('keysLo', t0 + 0.04, 84, swing=0.2, legato=0.7)
ask('harpL', CU['cynic']['split'], 86); chord('harpL', CU['cynic']['split'], 1.0, [50, 57, 62], 60, roll=0.04)

# ═══ the ending: everyone on the question; then it is answered — up to the high D, and D minor becomes D major
E = CU['end']
for k in range(16):
    s = E['wheel'] + k * 0.125; nm = 'Dm' if s < 55.5 else 'Bb' if s < 56.0 else 'C'
    note('str', s, 0.12, CH[nm][1][k % 4] - 12, 72); note('harp', s, 0.2, CH[nm][1][(k + 2) % 4], 60)
    if k % 4 == 0: note('taiko', s, 0.3, 40, 86); note('timp', s, 0.3, CH[nm][0], 84)
ask('horn', E['wheel'], 92, tr=-12); ask('tpt', E['wheel'], 86); ask('choir', E['wheel'], 70, tr=-12, legato=1.0)
for s0, nm in ((E['wheel'], 'Dm'), (55.5, 'Bb'), (56.0, 'C')): note('cb', s0, 0.5 if nm != 'Dm' else 1.0, CH[nm][0], 74); pad(s0, 0.5 if nm != 'Dm' else 1.0, nm, 50)
# the brush circle: a held breath, harp alone climbing D F A …
note('cb', E['brush'], 1.25, 38, 52); chord('bed', E['brush'], 1.25, CH['Bb'][1], 46, h=0)
for i, p in enumerate([62, 65, 69, 74]): note('harp', E['brush'] + i * 0.2, 0.8, p, 70 + i * 4)
ask('oboe', E['l1'], 78)                                                                                   # the question, once more …
# … and the answer: D major
chord('strS', E['l2'], 2.2, [38, 50, 57, 62, 66, 69, 74], 92, h=0); chord('choir', E['l2'], 2.2, [62, 66, 69, 74], 76); chord('horn', E['l2'], 1.6, [50, 57, 62, 66], 84)
note('tpt', E['l2'], 1.4, 86, 90); note('timp', E['l2'], 0.8, 38, 104); note('sub', E['l2'], 1.4, 26, 92); note('taiko', E['l2'], 0.5, 40, 92)
for k in range(12): note('harp', E['l2'] + k * 0.04, 1.0, [50, 54, 57, 62, 66, 69][k % 6] + 12 * (k // 6), 70)
chord('strS', E['title'], 1.25, [50, 57, 62, 66, 69], 70, h=0)
# a soft bed so no stretch falls silent (except the one that should)
for s0 in np.arange(6.0, 54.5, 1.5): chord('bed', float(s0), 1.55, CH['Dm'][1], 36, h=0)

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
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12, rev=False, lo=300, hi=3000):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(bp(noise(n, seed), lo, hi), 4000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_knock(f=180, seed=0, dur=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    return st(np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.05) + 0.4 * bp(noise(n, seed), f, f * 4) * env(n, 0.0005, 0.01))
def s_tile(seed=0, f=1500):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return st(bp(noise(n, seed), f * 0.6, f * 2.2) * env(n, 0.0005, 0.012) + 0.5 * np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.025))
def s_clink(seed=0, f=2200):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return st((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * env(n, 0.0005, 0.02) + 0.3 * bp(noise(n, seed), 2000, 6000) * env(n, 0.0003, 0.006))
def s_anvil(seed=0):                            # a short, dull iron strike (noisy, quickly damped: not a bell)
    n = int(0.22 * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) * a for f, a in ((420, 1), (1130, 0.5), (1790, 0.3))) * env(n, 0.0005, 0.03)
    return st(lp(x + 0.8 * bp(noise(n, seed), 600, 4000) * env(n, 0.0005, 0.02), 5000))
def s_steam(dur=0.6, seed=3):
    n = int(dur * SR); t = np.arange(n) / SR; return st(bp(noise(n, seed), 2500, 7000) * np.minimum(1, t / 0.03) * np.exp(-t / (dur / 3)))
def s_brush(dur=0.9, seed=8):                     # a wide brush stroke
    n = int(dur * SR); t = np.arange(n) / SR
    return st(bp(noise(n, seed), 400, 2600) * np.sin(np.pi * t / dur) ** 1.5 * (1 + 0.3 * np.sin(2 * np.pi * 7 * t)))
def s_tapestop(dur=0.5):                          # a tape stop: a falling, slowing tone
    n = int(dur * SR); t = np.arange(n) / SR; f = 300 * (1 - t / dur) ** 2 + 30
    return st(lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 * (1 - t / dur), 1500))
def s_sweep(dur=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = 900 + 700 * np.sin(np.pi * t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(n, 71), 800, 2400) * 0.6
    return st(lp(x, 3000) * np.sin(np.pi * t / dur) ** 2)
def s_crackle(dur, seed=9):
    n = int(dur * SR); r = np.random.default_rng(seed); x = 0.008 * bp(noise(n, seed), 800, 6000)
    for i in r.integers(0, n - 200, int(dur * 30)): x[i:i + 60] += r.uniform(-1, 1) * np.exp(-np.arange(60) / 8)
    return st(lp(x, 7000))
def s_wind(dur=2.5, seed=21):
    n = int(dur * SR); t = np.arange(n) / SR
    return st(bp(noise(n, seed), 200, 1200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)) * np.sin(np.pi * t / dur))

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why, align='onset', pan=0.0, maxlen=None, rate=1.0):
    if MUTE[0] - 0.05 <= t < MUTE[1]: return
    if rate != 1.0: x = resample_poly(x, 1000, int(round(1000 * rate)), axis=0)
    x = norm(x)
    if maxlen and len(x) > maxlen * SR: x = x[:int(maxlen * SR)].copy(); f = int(0.06 * SR); x[-f:] *= np.linspace(1, 0, f)[:, None]
    off = int(np.argmax(np.convolve(np.abs(x).max(1), np.ones(480) / 480, 'same'))) if align == 'peak' else 0
    if pan: x = x * np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)])
    i0 = int(t * SR) - off; a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
SOFTEN = {1125, 1133, 1365, 1044}
L = {k: (lp(trim(lib(k)), 5000) if k in SOFTEN else trim(lib(k))) for k in (3194, 2369, 1489, 2605, 1120, 2001, 498, 774, 790, 1328, 1279, 1125, 1365, 1133, 1088, 1044, 2579)}

# the opening
put(HK['draw'], L[3194], -30, 'pencil (3194)', 'the compass draws the circle', maxlen=0.5)
put(HK['slam'], L[498], -22, 'deep_hit (498)', 'SLAM'); put(HK['slam'], s_clink(1, 1800), -30, 'metal click (synth)', 'the compass lifts')
for i in range(16): put(HK['flash'][0] + i * 0.125, L[1125], -36, 'soft click (1125)', 'the circle flickers through the eras' if i == 0 else '', pan=((i % 3) - 1) * 0.3)
put(HK['ask'] - 0.1, L[1489], -30, 'whoosh_air (1489)', 'drop to black', align='peak')
put(HK['title'], L[774], -24, 'impact_space (774)', 'title: 意义，从哪来？')
put(5.0, L[790], -30, 'riser (790)', 'into Plato', maxlen=1.0)
# every cut: a transition sound in the colour of its effect
CUTS = [(6.0, 'flash'), (9.5, 'wipe'), (12.5, 'pixel'), (15.5, 'shutter'), (19.0, 'wipe'), (22.0, 'iris'), (25.0, 'slats'), (29.0, 'flash'), (32.5, 'slats'),
        (35.5, 'shutter'), (39.5, 'wipe'), (43.0, 'pixel'), (46.0, 'iris'), (49.0, 'glitch'), (51.5, 'glitch'), (54.5, 'iris')]
for t0, kind in CUTS:
    if kind in ('wipe', 'slats', 'shutter'): put(t0, L[2605], -28, 'air_quick (2605)', f'cut: {kind}', align='peak')
    elif kind == 'flash': put(t0 - 0.2, s_swell(0.25, int(t0), lo=1500, hi=7000), -28, 'bright swell (synth)', f'cut: {kind}')
    elif kind == 'pixel': [put(t0 - 0.15 + k * 0.03, s_tile(int(t0) + k, 1800 + k * 120), -36, 'tile tick (synth)', f'cut: {kind}' if k == 0 else '') for k in range(8)]
    elif kind == 'iris': put(t0 - 0.2, s_swell(0.25, int(t0) + 5, lo=200, hi=2000), -28, 'iris swell (synth)', f'cut: {kind}')
    else: put(t0 - 0.05, L[1044], -32, 'glitch crackles (1044)', f'cut: {kind}', maxlen=0.35)
# per era
C = CU['plato']; put(C['up'], s_knock(1400, 2, 0.12), -32, 'chisel tap (synth)', 'Plato points up'); put(C['down'], s_knock(900, 3, 0.12), -32, 'chisel tap (synth)', 'Aristotle points down')
put(C['form'], L[3194], -31, 'pencil (3194)', 'the ideal circle is drawn', maxlen=0.6)
C = CU['kynic']; put(C['lamp'], L[1328], -31, 'fire swoosh (1328)', 'the lamp', maxlen=0.7); put(C['sun'], s_thump(70, 40, 0.4), -26, 'eclipse thump (synth)', 'Alexander blocks the sun')
C = CU['stoic']
for k in range(10): put(C['inner'] + k * 0.05, s_tile(k, 1500 + (k % 4) * 150), -35, 'tile click (synth)', 'mosaic tiles: the inner circle' if k == 0 else '')
for k in range(10): put(C['outer'] + k * 0.05, s_tile(k + 20, 900 + (k % 4) * 100), -35, 'tile click (synth)', 'the outer ring' if k == 0 else '')
for k in range(6): put(S('stoic') + k * 0.5, s_thump(80, 50, 0.2), -33, 'march step (synth)', 'legion steps' if k == 0 else '')
C = CU['god']; put(S('god'), s_swell(1.6, 31, lo=100, hi=900), -30, 'cathedral air (synth)', 'the nave'); put(C['quote'], s_knock(120, 4, 0.5), -33, 'stone step (synth)', 'a step in the nave')
C = CU['renais']; put(C['circle'], L[2369], -31, 'quill scribble (2369)', 'the circle drawn', maxlen=0.5); put(C['square'], L[2369], -31, 'quill scribble (2369)', 'the square drawn', maxlen=0.4)
C = CU['cogito']; put(S('cogito'), L[1328], -32, 'candle flame (1328)', 'a candle', maxlen=0.6); put(C['axes'], L[2605], -32, 'air_quick (2605)', 'the axes draw', align='peak'); put(C['point'], L[1120], -29, 'pop_soft (1120)', '我 (0,0)')
C = CU['ethics']; put(C['kant'], s_knock(260, 5, 0.25), -29, 'gavel knock (synth)', 'Kant: duty'); put(C['bentham'], L[1365], -31, 'typewriter hit (1365)', 'Bentham: the sum')
for k in range(6): put(C['bentham'] + 0.2 + k * 0.08, L[1125], -37, 'soft click (1125)', '')
put(C['vs'], L[2001], -30, 'card placement (2001)', 'VS')
C = CU['will']; put(S('will'), s_wind(3.0), -30, 'fog wind (synth)', 'the sea of fog')
C = CU['marx']
for k in range(3): put(S('marx') + 0.5 + k * 1.0, s_anvil(k), -30, 'iron strike (synth)', 'the forge' if k == 0 else '')
put(C['quote'], s_steam(0.6), -33, 'steam hiss (synth)', 'steam'); put(C['punch'], L[498], -25, 'deep_hit (498)', 'CHANGE THE WORLD')
C = CU['nietz']; put(C['dead'], L[1279], -26, 'thunder impact (1279)', '上帝死了', maxlen=2.0)
for k in range(8): put(C['fall'] + k * 0.04, s_clink(k + 40, 2600 + k * 200), -34, 'shatter (synth)', 'the sun shatters' if k == 0 else '')
put(C['make'], L[1489], -30, 'whoosh_air (1489)', 'make your own', align='peak')
C = CU['exist']
for k in range(8): put(C['drip'] + k * 0.5, s_brush(0.3, k + 50), -33, 'brush stroke (synth)', 'paint lands on the beat' if k == 0 else '')
put(C['line'], s_clink(61, 2400), -33, 'café cup (synth)', 'a café on the Left Bank')
for cyc in range(2): put(C['sisy'] - 0.25 + cyc * 1.5 + 1.1, s_thump(60, 35, 0.4), -31, 'stone falls (synth)', 'the stone rolls back' if cyc == 0 else '')
C = CU['witt']
for k in range(9): put(C['grid'] + k * 0.06, s_tile(k + 70, 1200 + k * 60), -34, 'tile tick (synth)', 'De Stijl grid builds' if k == 0 else '')
put(C['limit'], L[2369], -33, 'chalk/quill (2369)', 'the word written', maxlen=0.5)
put(C['mute'][0] - 0.25, L[2579], -29, 'switch (2579)', 'everything stops: silence')
put(C['mute'][1], s_thump(90, 50, 0.2), -30, 'thump (synth)', 'back from the silence')
C = CU['fouc']; put(C['beam'], s_sweep(1.2), -31, 'scanner sweep (synth)', 'the tower beam')
for k in range(4): put(C['grid'] + 0.1 + k * 0.2, L[1133], -34, 'camera shutter (1133)', 'cells become screens' if k == 0 else '')
C = CU['post']; put(C['pop'], L[1088], -32, 'tape rewind (1088)', 'VHS rewind into pop', maxlen=0.8); put(C['glitch'], L[1044], -30, 'glitch crackles (1044)', 'glitch', maxlen=0.8)
put(S('cynic') - 0.3, s_tapestop(0.4), -30, 'tape stop (synth)', 'tape stop')
C = CU['cynic']; put(S('cynic'), s_crackle(3.0), -31, 'vinyl crackle (synth)', 'lo-fi')
for k in range(5): put(S('cynic') + 0.2 + k * 0.32, L[1120], -36, 'pop_soft (1120)', 'notifications' if k == 0 else '', pan=0.4)
put(C['split'], L[1489], -29, 'whoosh_air (1489)', 'the split screen', align='peak'); put(C['split'] + 0.1, L[1328], -32, 'fire swoosh (1328)', 'Diogenes\' lamp', maxlen=0.6, pan=-0.5)
E = CU['end']; put(E['wheel'], L[1489], -28, 'whoosh_air (1489)', 'the wheel of answers', align='peak')
put(E['brush'], s_brush(0.9, 99), -27, 'brush stroke (synth)', 'the open circle is drawn'); put(E['l2'], L[774], -25, 'impact_space (774)', '是你活出来的')

SFX = lp(SFX, 9500) * 10 ** (3 / 20)
ir = sc.ir
sfx_mix = SFX + 0.15 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
# the silence is real: everything (reverb tails included) is faded out across it
gate = np.ones(N); a, b = int(MUTE[0] * SR), int(MUTE[1] * SR); fo = int(0.05 * SR)
gate[a - fo:a] = np.linspace(1, 0, fo); gate[a:b] = 0; gate[b:b + int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR))
music = music * gate[:, None]; sfx_mix = sfx_mix * gate[:, None]
x = music + sfx_mix
x = x + 0.4 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 0.8) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
x = x * gate[:, None]
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'meaning_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'meaning_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {int(t // 2) + 1}.{(t % 2) / B + 1:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why and not (MUTE[0] - 0.3 <= t < MUTE[1] + 0.1)]
hdr = ('# 意义，从哪来？ — cue sheet (generated by music/meaning.py)\n\nEvery time comes from src/meaning/meaning.json, the file the picture reads. '
       'Bars are 2 s (120 BPM). "vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj} (the return after the Wittgenstein silence is intended). '
       f'Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'meaning_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav'))
    if harsh(an): print(f'sfx {i}: harsh raw file' + (' — softened (low-pass 5 kHz)' if i in SOFTEN else ' — CHECK'))

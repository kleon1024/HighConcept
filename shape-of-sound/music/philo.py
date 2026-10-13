"""提灯的人 (60 s) — score and sound design, synced to src/philo/philo.json.
Run: python3 music/philo.py → public/philo_score.wav, out/philo_sfx_only.wav, out/philo_cues.md

One lamp motif (D Dorian: A D E F E D C A) carried through 2400 years of music, so the score changes era with the film:
  · the hook and I 古典: a lyre (harp) and an aulos (oboe) over a frame drum; Aristotle's mean is heard as notes from the
    two extremes converging on the middle
  · II 古典犬儒: pizzicato and a bassoon, cheeky; Alexander gets a pompous brass fanfare, Diogenes a deadpan single note
  · III 功利: the classical era (1789): harpsichord Alberti bass and strings
  · IV 叔本华: Romantic piano and cellos; it opens on Wagner's Tristan chord (Wagner was Schopenhauer's great admirer);
    the pendulum is a left hand ticking between two notes
  · V 虚无: church organ for the madman's search; 「上帝死了」 lands on a sunrise fanfare (root, fifth, octave — a nod to
    Strauss's *Also sprach Zarathustra*), whose major chord turns minor
  · VI 存在: a Left Bank jazz trio with a muted trumpet (Paris, 1945); Sisyphus is a walking bass climbing and falling
  · VII 福柯: cold synths — a pulse, an arpeggio, a scanner; when the lecture of 1984 turns to Diogenes, the lyre returns
  · VIII 现代犬儒: lo-fi half-time; at the split screen the lyre plays on the left, the lo-fi keys on the right
  · the ending: the whole orchestra on the motif, a hush, and the last chord turns D minor into D major: the lamp is lit
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'philo', 'philo.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); B = 0.5
H, C1, K, U, Q, NI, X, F, CY, E = (J[k] for k in ('hook', 'classic', 'kynic', 'util', 'schop', 'nihil', 'exist', 'foucault', 'cynic', 'end'))

PARTS = {
    'lyre': SF2('ms', 46, level=-17, verb=0.45, pan=-0.1), 'lyreL': SF2('ms', 46, level=-19, verb=0.4, pan=-0.65),
    'aulos': SF2('ms', 68, level=-19, verb=0.4), 'flute': SF2('ms', 73, level=-21, verb=0.4),
    'pizz': SF2('ms', 45, level=-19, verb=0.3), 'bassoon': SF2('ms', 70, level=-20, verb=0.3),
    'hpsi': SF2('ms', 6, level=-19, verb=0.3), 'str': SF2('ms', 48, level=-19, verb=0.45), 'strS': SF2('ms', 49, level=-18, verb=0.55),
    'cello': SF2('ms', 42, level=-19, verb=0.45), 'trem': SF2('ms', 44, level=-23, verb=0.45),
    'piano': SF2('piano', level=-16, verb=0.35), 'keysLo': SF2('piano', level=-20, verb=0.25, lp=2200, pan=0.6),
    'organ': SF2('ms', 19, level=-19, verb=0.6), 'tpt': SF2('ms', 56, level=-20, verb=0.45), 'horn': SF2('ms', 60, level=-20, verb=0.5, cap=110),
    'tbn': SF2('ms', 57, level=-22, verb=0.35), 'timp': SF2('ms', 47, level=-19, verb=0.45), 'choir': SF2('ms', 52, level=-21, verb=0.6),
    'abass': SF2('ms', 32, level=-18, verb=0.2), 'mute': SF2('ms', 59, level=-19, verb=0.35), 'cb': SF2('ms', 43, level=-21, verb=0.35),
    'pluck': Synth('pluck', level=-21, verb=0.3, bright=1.4, decay=3.0, length=0.35, lp=6000),
    'sub': Synth('sub', level=-21, verb=0.0, duck=0.35, cap=100),
    'pad': Synth('pad', level=-25, verb=0.5, duck=0.2, cutoff=1400, attack=0.6), 'bed': Synth('pad', level=-29, verb=0.55, duck=0.1, cutoff=1100, attack=0.9),
    'drums': Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, fallback_kit=0, level=-22, verb=0.12),
    'frame': Drums({}, fallback_kit=0, level=-22, verb=0.3), 'brush': Drums({}, fallback_kit=40, level=-23, verb=0.25),
}
sc = Score(DUR, SR, seed=2400)
rng = np.random.default_rng(2400)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.004, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
# the lamp motif in beats: A D E F E D C A (searching, rising, falling back)
MOTIF = [(0, 1, 69), (1, 1, 74), (2, 0.5, 76), (2.5, 0.5, 77), (3, 1, 76), (4, 1, 74), (5, 1, 72), (6, 2, 69)]
def motif(part, t0, v=80, tr=0, beats=(0, 8), legato=0.95, swing=0.0, stac=False, step=B):
    for b, d, p in MOTIF:
        if not beats[0] <= b < beats[1]: continue
        s = t0 + (b - beats[0]) * step + (swing * step if (b * 2) % 2 == 1 else 0)
        note(part, s, (0.18 if stac else d * step * legato), p + tr, v + (6 if b in (0, 4) else 0))
CH = {'Dm': (38, [62, 65, 69, 74]), 'C': (36, [60, 64, 67, 72]), 'Am': (45, [57, 60, 64, 69]), 'G': (43, [59, 62, 67, 71]), 'Bb': (34, [58, 62, 65, 70]),
      'F': (41, [60, 65, 69, 72]), 'Gm': (43, [58, 62, 67, 70]), 'A': (45, [57, 61, 64, 69]), 'D': (38, [62, 66, 69, 74]), 'Dm7': (38, [60, 65, 69, 72]),
      'G7': (43, [59, 65, 67, 71]), 'Cmaj7': (36, [59, 64, 67, 71]), 'A7': (45, [61, 64, 67, 69]), 'Dm9': (38, [64, 65, 69, 72]), 'Fmaj7': (41, [64, 65, 69, 72]),
      'Dmaj7': (38, [61, 66, 69, 74])}
def pad(s, d, nm, v=46): chord('pad', s, d, CH[nm][1], v, h=0)
def bed(s, d, nm, v=40): chord('bed', s, d, CH[nm][1], v, h=0)

# ═══ hook (0–6): a drone; the lyre plays the motif as he walks; the dive into the flame; the title
note('cb', 0.0, 6.0, 38, 54); bed(0.0, 3.0, 'Dm', 40); bed(3.0, 3.0, 'Dm', 44)
motif('lyre', H['noon'], 86)
for k in range(8): note('lyre', H['noon'] + k * 0.5 + 0.25, 0.4, [50, 57, 62, 57][k % 4], 52)
note('frame', H['ans'], 0.3, 41, 84); note('frame', H['name'], 0.3, 45, 74); note('frame', H['name'] + 0.25, 0.3, 45, 60)
motif('aulos', H['name'], 66, beats=(0, 3))
for k in range(8): note('timp', 5.0 + k * 0.0625, 0.08, 38, 40 + k * 7)
# the title: D minor swells, a harp sweep, the motif's head on horn
chord('strS', 6.0, 2.0, [38, 50, 57, 62, 65], 86, h=0); chord('choir', 6.0, 2.0, [62, 65, 69], 64); note('timp', 6.0, 0.8, 38, 104); note('sub', 6.0, 1.2, 26, 96)
for k in range(12): note('lyre', 6.0 + k * 0.04, 0.6, [50, 53, 57, 62, 65, 69][k % 6] + 12 * (k // 6), 64)
motif('horn', 6.5, 76, tr=-12, beats=(0, 3))

# ═══ I 古典 (8–14): lyre arpeggios, frame drum, the aulos sings the motif; Aristotle's mean converges on the middle
I_CH = lambda s: 'Dm' if s < 10 else 'C' if s < 11 else 'Dm' if s < 12 else 'Am' if s < 13 else 'Dm'
for k in range(24):
    s = 8.0 + k * 0.25; root, vo = CH[I_CH(s)]
    note('lyre', s, 0.4, vo[[0, 2, 1, 3][k % 4]] - 12 + (12 if k % 8 >= 4 else 0), 54 if k % 2 else 62)
for bar in range(3):
    s0 = 8.0 + bar * 2.0
    for e, v in ((0, 80), (3, 60), (4, 72), (6, 64)): note('frame', s0 + e * 0.25, 0.3, 45 if e != 4 else 41, v)
    note('cb', s0, 2.0, CH[I_CH(s0)][0], 58); pad(s0, 2.0, I_CH(s0), 38)
motif('aulos', 8.0, 84)
chord('trem', C1['cave'], 1.2, [38, 45, 50], 50); note('lyre', C1['turn'], 0.4, 74, 70); note('lyre', C1['turn'] + 0.12, 0.4, 78, 70)
chord('strS', C1['out'], 0.8, [62, 66, 69, 74], 72, h=0); chord('choir', C1['out'], 0.8, [66, 69, 74], 58)          # the Good: a flash of D major
for i, (lo, hi) in enumerate([(57, 81), (60, 79), (62, 77), (64, 76)]):                                                  # the mean: extremes converge
    note('lyre', C1['mean'] + i * 0.125, 0.2, lo, 70); note('lyre', C1['mean'] + i * 0.125 + 0.0625, 0.2, hi, 70)
note('lyre', C1['settle'], 0.8, 74, 92); note('aulos', C1['settle'], 0.8, 74, 76); chord('strS', C1['settle'], 1.0, [50, 57, 62, 65], 60, h=0)
motif('aulos', 12.5, 76, beats=(4, 8)); chord('lyre', C1['sum'], 1.0, [50, 57, 62, 65, 69], 70, roll=0.03)
for k in range(8): note('frame', 13.5 + k * 0.0625, 0.06, 45, 40 + k * 6)

# ═══ II 古典犬儒 (14–20): pizzicato and bassoon; a fanfare for Alexander; a deadpan reply
II_CH = lambda s: 'Dm' if (s - 14) % 2 < 1 else 'G'
for k in range(16):
    s = 14.0 + k * 0.25
    if s >= K['alex']: break
    root, vo = CH[II_CH(s)]
    note('pizz', s, 0.18, vo[k % 4] - 12 if k % 2 == 0 else vo[(k + 1) % 4], 64 if k % 2 == 0 else 50)
    if k % 4 == 0: note('pizz', s, 0.2, root - 12, 70)
    if k % 2 == 0: note('frame', s, 0.2, 45 if k % 4 == 0 else 37, 64 if k % 4 == 0 else 46)
motif('bassoon', 14.0, 76, tr=-24, stac=True, beats=(0, 6))
note('bassoon', K['dog'], 0.2, 50, 92); note('bassoon', K['dog'] + 0.25, 0.3, 45, 92)                                   # "woof"
note('pizz', K['jar'], 0.4, 38, 92); note('cb', K['jar'], 0.6, 38, 70)
for k in range(5): note('pizz', K['bowl'] + k * 0.08, 0.15, 74 + k * 3, 66)
# Alexander: a pompous fanfare
chord('tpt', K['alex'], 0.25, [62, 66, 69], 92); chord('tpt', K['alex'] + 0.25, 0.25, [62, 66, 69], 92); chord('tpt', K['alex'] + 0.5, 0.25, [66, 69, 74], 96)
chord('horn', K['alex'], 0.75, [50, 57, 62], 84); note('timp', K['alex'], 0.4, 38, 100); note('timp', K['alex'] + 0.5, 0.4, 45, 96)
for k in range(4): note('timp', K['alex'] + 0.5 + k * 0.0625, 0.08, 38, 60 + k * 8)
note('lyre', K['sun'], 1.2, 74, 74)                                                                                       # 「别挡住我的阳光」: one note
note('bassoon', K['aside'], 0.3, 45, 80); note('bassoon', K['aside'] + 0.25, 0.3, 50, 80)
for k in range(6): s = K['aside'] + 0.5 + k * 0.25; note('pizz', s, 0.18, [62, 65, 69, 74, 69, 65][k], 62)
chord('lyre', K['sum'], 1.0, [50, 57, 62, 65, 69], 72, roll=0.03); chord('pizz', K['sum'], 0.3, [50, 57, 62], 76)
bed(14.0, 3.0, 'Dm', 38); bed(17.0, 3.0, 'Dm', 40)

# ═══ III 功利 (20–26): the classical era — harpsichord Alberti bass, strings, a minuet that turns sinister
III_CH = lambda s: 'Dm' if s < 21 else 'A' if s < 22 else 'F' if s < 23 else 'C' if s < 24 else 'Dm' if s < 25 else 'A'
for k in range(48):
    s = 20.0 + k * 0.125; root, vo = CH[III_CH(s)]
    alb = [vo[0] - 12, vo[2] - 12, vo[1] - 12, vo[2] - 12][k % 4]
    if k % 2 == 0: note('hpsi', s, 0.12, alb, 60)
    if k % 8 == 0: note('hpsi', s, 0.4, root, 66); note('cb', s, 1.0, root, 56)
motif('str', 20.0, 78, tr=12); chord('strS', 20.0, 2.0, [50, 57, 62], 50, h=0)
for k in range(8): note('hpsi', U['sum'] + k * 0.125, 0.08, 86 + (k % 2) * 5, 58)                                         # the sum adds up
chord('strS', U['mill'], 1.0, [53, 60, 65, 69], 64, h=0); motif('flute', U['mill'], 72, tr=12, beats=(0, 4))
note('tbn', U['tip'], 0.6, 46, 70); note('tbn', U['tip'] + 0.3, 0.6, 41, 64)                                              # the pig's side rises
chord('horn', U['tip'] + 0.25, 0.8, [57, 60, 64], 74)                                                                     # Socrates' side sinks
chord('hpsi', U['icon'], 0.3, [50, 57, 62, 65], 70); chord('hpsi', U['icon'] + 0.75, 0.3, [49, 57, 61, 64], 66)
for k in range(8): note('str', U['pan'] + k * 0.125, 0.12, [38, 45, 38, 44, 38, 45, 38, 46][k], 70)                        # the plan: an ominous ostinato
chord('trem', U['pan'], 1.0, [50, 56, 62], 56)

# ═══ IV 叔本华 (26–32): Romantic piano and cellos; Tristan's chord; the pendulum ticks between two notes
chord('strS', Q['will'], 1.6, [53, 59, 63, 68], 82, h=0); chord('piano', Q['will'], 1.6, [53, 59, 63, 68], 76)            # F B D# G#
note('cello', Q['will'] - 0.5, 0.5, 57, 70); note('cello', Q['will'], 1.4, 65, 80)                                         # A → F (the yearning sixth)
chord('strS', Q['will'] + 1.5, 0.5, [52, 56, 62, 71], 72, h=0)                                                            # → E7
note('cb', Q['will'], 2.0, 29, 64); note('timp', Q['push'], 0.6, 38, 70)
for k in range(8):
    s = Q['pend'] + k * 0.5; note('piano', s, 0.45, 38 if k % 2 == 0 else 45, 72)                                          # tick … tock
    chord('piano', s + 0.25, 0.2, [62, 65, 69] if k % 2 == 0 else [58, 62, 67], 48)
motif('piano', Q['pend'], 78, tr=12); motif('cello', Q['pend'], 62, tr=-12)
chord('strS', Q['pend'], 4.0, [50, 57, 62], 46, h=0)
note('piano', Q['hegel'], 0.3, 86, 56); note('piano', Q['hegel'] + 0.5, 0.3, 85, 50)                                      # an empty lecture hall
chord('strS', Q['cure'], 1.25, [46, 58, 62, 65], 70, h=0); chord('piano', Q['cure'], 1.0, [58, 62, 65, 70], 64)           # art consoles: B♭
for k in range(4): note('timp', 31.5 + k * 0.125, 0.12, 38, 46 + k * 10)

# ═══ V 虚无 (32–38): the organ searches; the sunrise fanfare turns minor; the values fall
note('organ', NI['book'], 1.0, 26, 60); chord('organ', NI['book'], 1.0, [50, 57, 62], 54)
motif('organ', NI['mad'], 82)
chord('organ', NI['mad'], 1.25, [38, 50, 57], 60)
note('timp', NI['dead'] - 0.5, 0.3, 38, 70)
note('tpt', NI['dead'], 0.5, 62, 104); note('tpt', NI['dead'] + 0.25, 0.25, 69, 104); note('tpt', NI['dead'] + 0.5, 0.5, 74, 108)  # root, fifth, octave
chord('horn', NI['dead'] + 0.75, 0.5, [62, 66, 69], 98); chord('strS', NI['dead'] + 0.75, 0.5, [50, 62, 66, 69, 74], 92, h=0)     # major …
chord('horn', NI['dead'] + 1.25, 1.0, [62, 65, 69], 98); chord('strS', NI['dead'] + 1.25, 1.0, [50, 62, 65, 69, 74], 94, h=0)     # … turns minor
chord('organ', NI['dead'] + 0.75, 1.5, [38, 50, 62, 66, 69], 80)
for k in range(6): note('timp', NI['dead'] + 0.75 + k * 0.25, 0.2, 38 if k % 2 == 0 else 45, 96 - k * 4)
note('sub', NI['dead'], 1.5, 26, 100)
chord('organ', NI['tower'], 1.0, [38, 49, 50, 56, 57, 63], 70)                                                              # a dissonant cluster
for i in range(4): note('tbn', NI['fall'] + i * 0.12, 0.3, [50, 46, 43, 38][i], 84); note('timp', NI['fall'] + i * 0.12 + 0.3, 0.2, [45, 41, 38, 33][i], 86)
for i, p in enumerate([57, 62, 65, 69, 74]): note('tpt', NI['make'] + i * 0.15, 0.3, p, 82 + i * 3)                        # make your own
chord('horn', NI['make'] + 0.75, 0.25, [57, 62, 65], 88)

# ═══ VI 存在 (38–44): Left Bank jazz, swung; Sisyphus is a walking bass that climbs and falls back
SW = 0.5 * 2 / 3                                                                                                            # swung off-beat
JZ = ['Dm7', 'Dm7', 'G7', 'G7', 'Cmaj7', 'Cmaj7', 'A7', 'A7', 'Dm7', 'Dm7', 'G7', 'G7']
for k in range(12):
    s = 38.0 + k * 0.5; nm = JZ[k]; root, vo = CH[nm]
    note('brush', s, 0.2, 51, 70 if k % 2 == 0 else 56); note('brush', s + SW, 0.15, 51, 50)                                # ride
    if k % 2 == 1: note('brush', s, 0.2, 38, 52)
    if s < X['sisy']:
        note('abass', s, 0.45, root + (0 if k % 2 == 0 else 7) - 12 + 12, 82)
        if k % 2 == 0: chord('piano', s + SW, 0.3, [vo[1], vo[3]], 58)
motif('mute', 38.0, 84, swing=1 / 3, legato=0.85)
note('mute', 39.75, 0.4, 68, 70)                                                                                          # a blue note
# Sisyphus (one climb per 2 s): the bass walks up chromatically, then tumbles down
for cyc in range(2):
    s0 = X['sisy'] - 0.5 + cyc * 2.0
    for i in range(6): note('abass', s0 + i * 0.25, 0.22, 38 + i * 2, 80 + i * 2)
    for i in range(6): note('abass', s0 + 1.5 + i * 0.07, 0.07, 48 - i * 2, 70)
    chord('piano', s0, 0.4, CH['Dm7'][1], 56); chord('piano', s0 + 1.0, 0.4, CH['G7'][1], 56)
chord('piano', X['happy'], 1.4, [62, 66, 69, 73, 76], 72, roll=0.03); chord('mute', X['happy'], 1.0, [69, 73], 74)        # imagine him happy: D major 7
note('abass', X['happy'], 1.2, 38, 80)

# ═══ VII 福柯 (44–50): cold synths; the tower goes dark; then the lyre comes back for Diogenes
for k in range(16):
    s = 44.0 + k * 0.125
    note('pluck', s, 0.1, [62, 65, 69, 72, 74, 72, 69, 65][k % 8] + 12, 60)
for k in range(8):
    s = 44.0 + k * 0.25; note('sub', s, 0.2, 26, 84); note('drums', s, 0.2, 36, 80) if k % 2 == 0 else None
pad(44.0, 2.0, 'Dm9', 50); motif('pluck', 44.0, 82, tr=12, beats=(0, 4))
for k in range(4): note('sub', 46.0 + k * 0.5, 0.4, 26, 84); note('drums', 46.0 + k * 0.5 + 0.25, 0.05, 42, 50)            # only the pulse is left
chord('trem', 46.0, 1.8, [50, 57, 62], 60); pad(46.0, 0.75, 'Dm9', 52)
for k in range(10):
    s = F['grid'] + k * 0.125; note('pluck', s, 0.1, [62, 65, 69, 72, 76][k % 5] + 12, 54)
pad(F['grid'], 1.25, 'Dm9', 46); note('drums', F['grid'], 0.2, 36, 78)
pad(F['y1984'], 0.8, 'Dm', 56); chord('trem', F['y1984'], 0.8, [50, 57, 62, 65], 62); note('cb', F['y1984'], 0.8, 38, 64)
motif('lyre', F['lamp'], 82, beats=(0, 3)); chord('lyre', F['lamp'], 1.2, [50, 57, 62], 58, roll=0.04)                       # the lyre returns
chord('strS', F['lamp'], 1.2, [50, 57, 62, 65], 56, h=0)

# ═══ VIII 现代犬儒 (50–54): lo-fi half-time; at the split, the lyre on the left and the lo-fi keys on the right
for k in range(8):
    s = 50.0 + k * 0.5
    if k % 4 == 0: note('drums', s, 0.2, 36, 104)
    if k % 4 == 2: note('drums', s + 0.03, 0.2, 38, 94)
    note('drums', s + 0.25, 0.05, 42, 54); note('drums', s, 0.05, 42, 42)
    if k % 2 == 0: note('sub', s, 0.45, 26 if k < 4 else 22, 90)
for k, nm in enumerate(['Dm7', 'Dm7', 'Bb', 'Bb', 'Dm7', 'Dm7', 'Bb', 'Bb']):
    if k % 2 == 0: chord('keysLo', 50.0 + k * 0.5 + 0.05, 0.9, CH[nm][1], 74, roll=0.02)
    if k % 2 == 0: chord('pad', 50.0 + k * 0.5, 1.0, CH[nm][1], 50, h=0)
motif('keysLo', 50.05, 86, swing=0.2, legato=0.7)
motif('lyreL', CY['split'], 80, beats=(0, 4)); chord('lyreL', CY['split'], 1.0, [50, 57, 62], 60, roll=0.04)
note('keysLo', CY['right'], 1.0, 68, 66)                                                                                      # a flat, shrugging note

# ═══ the ending (54–60): everything on the motif; the hush; the question; D minor → D major
motif('strS', 54.0, 92, tr=0, legato=1.0); motif('horn', 54.0, 80, tr=-12, legato=1.0); motif('choir', 54.0, 64, tr=-12, legato=1.0)
for k in range(8):
    s = 54.0 + k * 0.25; nm = 'Dm' if s < 55 else 'Bb' if s < 55.5 else 'C'
    note('lyre', s, 0.4, CH[nm][1][k % 4], 64)
    if k % 2 == 0: note('timp', s, 0.3, CH[nm][0], 70 + k * 3)
for s0, nm in ((54.0, 'Dm'), (55.0, 'Bb'), (55.5, 'C')): note('cb', s0, 0.9, CH[nm][0], 70); pad(s0, 1.0 if nm == 'Dm' else 0.5, nm, 48)
for k in range(4): note('frame', 55.5 + k * 0.125, 0.1, 45, 60 + k * 8)
# the hush: the lyre, alone, and the aulos asks the motif's question
note('cb', 56.0, 2.6, 38, 50); bed(56.0, 1.3, 'Dm', 40)
motif('aulos', E['line'], 72, beats=(0, 4))
chord('strS', E['q'], 0.9, [46, 58, 62, 65], 56, h=0); chord('strS', E['q'] + 0.9, 0.7, [48, 60, 64, 67], 60, h=0)     # B♭ … C …
note('lyre', E['q'] + 0.45, 0.5, 70, 64); note('lyre', E['q'] + 0.75, 0.5, 72, 64)
# … D major: the lamp is lit
root, vo = CH['D']
chord('strS', E['title'], 1.4, [38, 50, 57, 62, 66, 69], 84, h=0); chord('choir', E['title'], 1.4, [62, 66, 69, 74], 66); chord('horn', E['title'], 1.2, [50, 57, 62, 66], 70)
for k in range(12): note('lyre', E['title'] + k * 0.04, 0.9, [50, 54, 57, 62, 66, 69][k % 6] + 12 * (k // 6), 66)
note('timp', E['title'], 0.8, 38, 90); note('sub', E['title'], 1.2, 26, 86)
# a soft bed throughout so nothing falls silent
for s0 in np.arange(8.0, 54.0, 2.0): bed(float(s0), 2.05, 'Dm' if s0 < 44 or s0 >= 50 else 'Dm9', 36)

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
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(bp(noise(n, seed), lo, hi), 4000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_knock(f=180, seed=0, dur=0.25):           # a hollow knock (the jar), a wooden clunk
    n = int(dur * SR); t = np.arange(n) / SR
    return st(np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.05) + 0.4 * bp(noise(n, seed), f, f * 4) * env(n, 0.0005, 0.01))
def s_clink(seed=0, f=2200):                     # a small ceramic clink
    n = int(0.12 * SR); t = np.arange(n) / SR
    return st((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t)) * env(n, 0.0005, 0.02) + 0.3 * bp(noise(n, seed), 2000, 6000) * env(n, 0.0003, 0.006))
def s_murmur(dur, seed=5):                        # a market murmur: many small voices of filtered noise
    n = int(dur * SR); x = np.zeros(n)
    r = np.random.default_rng(seed)
    for i in range(40):
        a = int(r.uniform(0, dur - 0.3) * SR); m = int(r.uniform(0.15, 0.45) * SR); f = r.uniform(250, 900)
        seg = bp(noise(m, seed + i), f, f * 2.2) * np.sin(np.linspace(0, np.pi, m)) * (1 + 0.6 * np.sin(np.linspace(0, r.uniform(8, 20), m)))
        x[a:a + m] += seg[:max(0, min(m, n - a))]
    fo = int(0.3 * SR); x[:fo] *= np.linspace(0, 1, fo); x[-fo:] *= np.linspace(1, 0, fo)
    return st(lp(x, 2500))
def s_crackle(dur, seed=9):                        # vinyl crackle
    n = int(dur * SR); r = np.random.default_rng(seed); x = 0.15 * bp(noise(n, seed), 800, 6000) * 0.05
    for i in r.integers(0, n - 200, int(dur * 30)): x[i:i + 60] += r.uniform(-1, 1) * np.exp(-np.arange(60) / 8)
    return st(lp(x, 7000))
def s_heart():
    return np.concatenate([s_thump(70, 45, 0.18), np.zeros((int(0.12 * SR), 2)), 0.7 * s_thump(70, 45, 0.18)])

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
SOFTEN = {2590, 1104, 1125, 1365, 1053, 1133}                       # transient-heavy: low-passed at 5 kHz
L = {k: (lp(trim(lib(k)), 5000) if k in SOFTEN else trim(lib(k))) for k in (2590, 1328, 1331, 1489, 2605, 1120, 2001, 1530, 498, 774, 1104, 1125, 1365, 3194, 2369, 1053, 1279, 400, 1528, 2579, 1133)}
def s_rumble(dur=1.4, seed=70): n = int(dur * SR); t = np.arange(n) / SR; return st(bp(noise(n, seed), 35, 180) * np.minimum(1, t / 0.2) * np.minimum(1, (dur - t) / 0.3))
def s_sweep(dur=1.2):                              # a soft scanner: a band of noise sweeping up and down
    n = int(dur * SR); t = np.arange(n) / SR; f = 900 + 700 * np.sin(np.pi * t / dur)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + bp(noise(n, 71), 800, 2400) * 0.6
    return st(lp(x, 3000) * np.sin(np.pi * t / dur) ** 2)

# hook
put(0.0, L[2590], -24, 'match lighting (2590)', 'a match strikes: the lamp is lit', maxlen=1.2)
put(0.15, L[1328], -30, 'fire swoosh (1328)', 'the flame catches', maxlen=1.0)
put(H['noon'], s_swell(0.6, 3, lo=600, hi=5000), -29, 'bright air swell (synth)', 'noon floods in')
put(H['noon'] + 0.2, s_murmur(H['ans'] - H['noon'] - 0.1), -31, 'market murmur (synth)', 'the market')
put(H['ask'], L[1120], -31, 'pop_soft (1120)', '「你在找什么？」')
put(H['name'], L[1530], -31, 'paper slide (1530)', 'name tag', maxlen=0.4)
put(5.55, L[1489], -26, 'whoosh_air (1489)', 'the camera dives into the flame', align='peak'); put(5.4, s_swell(0.6, 7, rev=False), -30, 'air swell (synth)', '')
put(6.0, L[498], -25, 'deep_hit (498)', 'title'); put(6.0, L[1328], -31, 'fire swoosh (1328)', 'the title lamp', maxlen=0.8)
# the iris transitions: a breath of light on each
for I in J['iris']:
    put(I['t'] - I['dur'], s_swell(I['dur'], int(I['t'] * 7), lo=500, hi=4000), -30, 'light swell (synth)', f"iris into {I['t']:.0f} s")
    put(I['t'], L[2605], -30, 'air_quick (2605)', '', align='peak')
# I
put(C1['cup'], L[1120], -33, 'pop_soft (1120)', 'tag: the hemlock')
put(C1['cave'], s_swell(1.0, 21, lo=80, hi=600), -29, 'low cave air (synth)', 'into the cave')
put(C1['out'], s_swell(0.5, 22, lo=1500, hi=7000), -31, 'bright swell (synth)', 'out into the sun')
for k in range(4): put(C1['mean'] + k * 0.125, s_knock(900 + k * 60, k, 0.08), -35, 'wood tick (synth)', 'the marker swings' if k == 0 else '')
put(C1['sum'], L[2001], -31, 'card placement (2001)', 'the classical answer')
# II
put(K['tree'], L[3194], -33, 'pencil (3194)', 'the lineage draws', maxlen=0.8)
put(K['jar'], s_knock(140, 3, 0.35), -27, 'hollow knock (synth)', 'the jar')
put(K['bowl'], L[1489], -32, 'whoosh_air (1489)', 'the bowl is thrown', align='peak', rate=1.4); put(K['bowl'] + 0.7, s_clink(4), -29, 'ceramic clink (synth)', 'it lands')
for k in range(4): put(K['alex'] + k * 0.25, s_thump(80, 50, 0.2), -31, 'footstep (synth)', 'Alexander strides in' if k == 0 else '')
put(K['alex'] + 0.3, s_swell(0.5, 31, lo=80, hi=400), -30, 'shadow swell (synth)', 'his shadow covers the sun')
put(K['aside'], L[1489], -30, 'whoosh_air (1489)', 'he steps aside; the light returns', align='peak')
put(K['sum'], L[2001], -31, 'card placement (2001)', 'the Cynic answer')
# III
for k in range(12): put(U['dots'] + 0.1 + k * 0.05, L[1125], -36, 'typewriter soft click (1125)', 'the happiness is counted' if k == 0 else '')
put(U['sum'], L[1365], -31, 'typewriter hit (1365)', 'the sum')
put(U['tip'], s_knock(200, 9, 0.3), -29, 'wooden clunk (synth)', 'the scale tips')
put(U['icon'], s_clink(11, 3200), -32, 'glass tap (synth)', 'the glass case')
put(U['pan'], L[3194], -31, 'pencil (3194)', 'the Panopticon is drawn', maxlen=1.0)
# IV
put(Q['will'], s_heart(), -27, 'heartbeat (synth)', 'the will stirs'); put(Q['push'], s_heart(), -29, 'heartbeat (synth)', '')
put(Q['will'], s_rumble(1.6), -31, 'low rumble (synth)', '')
for k in range(8): put(Q['pend'] + k * 0.5, L[1053][:int(0.12 * SR)], -33, 'clock tick (1053)', 'the pendulum' if k == 0 else '')
put(Q['hegel'], L[2001], -31, 'card placement (2001)', 'the Hegel sticker')
# V
put(NI['book'], L[1104], -28, 'page turn (1104)', 'the book in the shop')
put(NI['mad'], s_murmur(1.2, 41), -31, 'market murmur (synth)', 'the morning market'); put(NI['mad'], L[1328], -32, 'fire swoosh (1328)', 'his lantern', maxlen=0.8)
put(NI['dead'], L[1279], -27, 'thunder impact (1279)', '上帝死了', maxlen=2.0)
put(NI['unchain'], s_swell(1.0, 51, lo=60, hi=500), -30, 'drift swell (synth)', 'the earth comes loose')
for i in range(4): put(NI['fall'] + i * 0.12 + 0.6, s_thump(110 - i * 10, 50, 0.25), -28, 'block lands (synth)', 'the values fall' if i == 0 else '')
put(NI['fall'] + 0.3, L[400], -31, 'stones falling (400)', '', maxlen=1.2)
# VI
for k in range(6): put(X['knife'] + 0.1 + k * 0.11, L[1125], -35, 'typewriter soft click (1125)', 'Sartre types' if k == 0 else '')
put(X['human'], L[1120], -31, 'pop_soft (1120)', 'a person exists first'); put(X['human'] + 0.35, L[2369], -33, 'pencil scribble (2369)', '…then draws their own outline', maxlen=0.7)
for cyc in range(2):
    s0 = X['sisy'] - 0.5 + cyc * 2.0
    put(s0, s_rumble(1.4, 72 + cyc), -32, 'low rumble (synth)', 'the stone pushed up' if cyc == 0 else '')
    put(s0 + 1.5, L[1528], -30, 'stone slide (1528)', 'it rolls back down' if cyc == 0 else '', maxlen=0.6)
# VII
put(F['beam'], s_sweep(1.4), -32, 'scanner sweep (synth)', 'the tower beam sweeps')
put(F['dark'], L[2579], -27, 'light switch (2579)', 'the tower light goes off')
for k in range(3): put(F['grid'] + 0.3 + k * 0.3, L[1133], -34, 'camera shutter (1133)', 'cells become screens' if k == 0 else '')
put(F['lamp'], L[2590], -26, 'match lighting (2590)', 'the lamp is lit again: Diogenes', maxlen=1.0)
# VIII
put(CY['sofa'], s_crackle(4.0), -30, 'vinyl crackle (synth)', 'lo-fi'); put(CY['sofa'], s_thump(70, 45, 0.3), -31, 'sofa flop (synth)', 'on the sofa')
put(CY['split'], L[1489], -29, 'whoosh_air (1489)', 'the split screen', align='peak'); put(CY['split'] + 0.1, L[1328], -32, 'fire swoosh (1328)', 'the left lamp burns', maxlen=0.6, pan=-0.5)
put(CY['right'], L[2579], -29, 'light switch (2579)', 'the right lamp: off', pan=0.5)
# ending
for i in range(9): put(E['map'] + 0.25 + i * 0.16, s_clink(60 + i, 1400 + i * 90), -38, 'soft clink (synth)', 'influence arcs light' if i == 0 else '')
put(E['lamp'], s_murmur(1.2, 61), -33, 'market murmur (synth)', 'back to the street')
put(E['q'], L[1331], -33, 'fire burning (1331)', 'the lamp close to us', maxlen=1.3)
put(E['title'], L[1328], -30, 'fire swoosh (1328)', 'the last flame', maxlen=1.0)

SFX = lp(SFX, 9500) * 10 ** (3 / 20)            # ~13 dB under the music (median)
ir = sc.ir
sfx_mix = SFX + 0.15 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
if os.environ.get('STEM_DIR'):
    os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
    for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), SR)
x = music + sfx_mix
x = x + 0.4 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 0.7) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'philo_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'philo_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')

def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {int(t // 2) + 1}.{(t % 2) / B + 1:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 提灯的人 — cue sheet (generated by music/philo.py)\n\nEvery time comes from src/philo/philo.json, the file the picture reads. '
       'Bars are 2 s (120 BPM). "vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'philo_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav'))
    if harsh(an): print(f'sfx {i}: harsh raw file' + (' — softened (low-pass 5 kHz)' if i in SOFTEN else ' — CHECK'))

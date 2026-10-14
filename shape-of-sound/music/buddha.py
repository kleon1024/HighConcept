"""佛 · 第二支箭 (90 s) — score and sound design, synced to src/buddha/buddha.json.
Run: python3 music/buddha.py → public/buddha_score.wav, out/buddha_sfx_only.wav, out/buddha_cues.md

The music travels the way the teaching travelled. The Buddha's own words (the arrows, the diagnosis, impermanence,
no-self) sound Indian: a tanpura-like drone on D and A, sitar, a bansuri flute, low drums. The Chinese sutras
(dependent origination, the Heart Sutra, the Diamond Sutra) bring guzheng-like koto and the dizi, and under the Heart
Sutra a 木鱼 keeps the pulse the way it does in Chinese temples. Chan is almost empty: a shakuhachi, two clapper
strokes, a brush, room to breathe. The ending gathers everyone; the choir sings the syllable rhythm of the mantra
(揭谛 揭谛 波罗揭谛 波罗僧揭谛 菩提萨婆诃) on a line that climbs to D major.
Leitmotif: A–D–C–A (the arrow: up a fourth, down again), answered at the end by A–D–E–F♯–A–D.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import SF2, Score, Synth
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'buddha', 'buddha.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
HK, TI, DO, FX, SE, NT, HT, DM, SX, AB, CN, EN = (J[k] for k in ('hook', 'title', 'doctor', 'flux', 'self', 'net', 'heart', 'diamond', 'six', 'abide', 'chan', 'end'))

PARTS = {
    'sitar': SF2('ms', 104, level=-17, verb=0.45), 'flute': SF2('ms', 73, level=-18, verb=0.55), 'shaku': SF2('ms', 77, level=-17, verb=0.65),
    'koto': SF2('ms', 107, level=-17, verb=0.5), 'harp': SF2('ms', 46, level=-19, verb=0.55), 'strS': SF2('ms', 49, level=-18, verb=0.6),
    'trem': SF2('ms', 44, level=-21, verb=0.5), 'cello': SF2('ms', 42, level=-18, verb=0.5), 'cb': SF2('ms', 43, level=-19, verb=0.45),
    'choir': SF2('ms', 52, level=-17, verb=0.7), 'oohs': SF2('ms', 53, level=-20, verb=0.7), 'horn': SF2('ms', 60, level=-20, verb=0.55, cap=110),
    'timp': SF2('ms', 47, level=-18, verb=0.5), 'taiko': SF2('ms', 116, level=-19, verb=0.45), 'pizz': SF2('ms', 45, level=-20, verb=0.4),
    'sub': Synth('sub', level=-21, verb=0.0, duck=0.2, cap=100), 'pad': Synth('pad', level=-24, verb=0.6, duck=0.1, cutoff=1100, attack=0.8),
    'drone': Synth('pad', level=-25, verb=0.5, duck=0.0, cutoff=650, attack=1.2),
}
sc = Score(DUR, SR, seed=470)
rng = np.random.default_rng(470)
def note(part, s, d, p, v=80, h=0.003):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.003, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
def line(part, s, ps, step, d=None, v=76):
    for i, p in enumerate(ps):
        if p is not None: note(part, s + i * step, d or step * 0.95, p, v)
MOTIF = [69, 74, 72, 69]               # A D C A — the arrow: up a fourth, falling back
ANSWER = [69, 74, 76, 78, 81, 86]      # A D E F♯ A D — the same leap, now climbing on

# ═══ hook: a drone from frame 1; the first arrow lands; the thoughts swarm; the second arrow, heavier
chord('drone', 0.0, 7.2, [38, 45, 50], 70, h=0); note('sub', HK['hit1'], 1.2, 26, 92)
note('timp', HK['hit1'], 0.8, 38, 104); note('taiko', HK['hit1'], 0.5, 48, 90)
note('sitar', HK['t1'], 1.2, 74, 78); note('sitar', HK['t1'] + 0.6, 0.8, 72, 66)
chord('trem', HK['swarm'], HK['hit2'] - HK['swarm'], [62, 63, 68], 54)                                   # the thoughts: a nervous cluster
for k in range(6): note('pizz', HK['swarm'] + k * 0.15, 0.12, [63, 68, 62, 69, 63, 70][k], 60 + k * 4)
note('timp', HK['hit2'], 1.0, 38, 118); note('taiko', HK['hit2'], 0.6, 45, 104); note('sub', HK['hit2'], 1.4, 26, 100)
chord('horn', HK['hit2'], 0.8, [38, 44, 50], 92); chord('cb', HK['hit2'], 1.4, [26, 38], 80)
line('sitar', HK['quote'], MOTIF, 0.35, v=82); note('sitar', HK['quote'] + 1.4, 1.0, 62, 70)
note('flute', HK['decode'], 1.4, 74, 70); note('flute', HK['decode'] + 0.75, 0.7, 72, 62)
chord('pad', HK['quote'], 2.6, [62, 65, 69, 74], 46, h=0)
# ═══ title: 佛 — everyone, once
note('timp', TI['t'], 1.0, 38, 112); note('sub', TI['t'], 1.6, 26, 98); chord('choir', TI['t'], 2.0, [50, 57, 62, 69], 80)
chord('strS', TI['t'], 2.0, [38, 50, 57, 62, 66, 69], 84, h=0); chord('horn', TI['t'], 1.2, [50, 57, 62], 84)
for k, p in enumerate([62, 66, 69, 74, 78, 81]): note('sitar', TI['t'] + 0.15 + k * 0.1, 0.5, p, 72)
chord('drone', TI['t'], 8.5, [38, 45, 50], 66, h=0)
# ═══ the physician: four stamps on the grid, a sitar line; the eight sufferings tumble in; a minor chord
for i, s in enumerate(DO['rows']): note('taiko', s, 0.3, 45 + (i % 2) * 3, 86); note('pizz', s, 0.2, [50, 53, 55, 57][i], 74); note('sitar', s + 0.1, 0.45, [69, 72, 74, 76][i], 74)
chord('strS', DO['t'], 4.0, [38, 50, 57, 62], 52, h=0)
note('flute', DO['blow'], 0.5, 81, 50)
note('cello', DO['decode'], 1.0, 50, 70); note('cello', DO['decode'] + 0.5, 0.5, 53, 64)
for k in range(8): note('harp', DO['eight'] + k * 0.11, 0.4, [62, 65, 67, 69, 72, 74, 77, 79][k], 64 + k * 2)
chord('strS', DO['bitter'], 1.5, [38, 50, 53, 57, 64], 70, h=0); chord('oohs', DO['bitter'], 1.5, [57, 62, 65], 58)
# ═══ impermanence: one falling figure per phase (生 住 异 灭); grasping: the pulse tightens; the wheel: low voices, three drums
for i, (s, ch) in enumerate(zip(FX['phases'], ([62, 69, 74], [62, 69, 72], [58, 65, 70], [57, 64, 69]))):
    line('sitar', s, [ch[2] + 12, ch[1] + 12, ch[0] + 12], 0.18, v=70); chord('strS', s, 0.75, [ch[0] - 24, ch[0] - 12] + ch, 56 + i * 4, h=0)
for k in range(int((FX['wheel'] - FX['grasp']) / 0.25)): note('taiko', FX['grasp'] + k * 0.25, 0.15, 45, 50 + k * 4)           # quickening grip
chord('trem', FX['grasp'], FX['wheel'] - FX['grasp'], [57, 58, 62], 52)
note('timp', FX['wheel'], 1.0, 38, 108); note('sub', FX['wheel'], 1.6, 26, 96); chord('choir', FX['wheel'], 2.4, [38, 45, 50], 78)      # low, Tibetan-ish
chord('cb', FX['wheel'], 2.6, [26, 33], 70)
for i, s in enumerate(FX['poisons']): note('taiko', s, 0.4, [41, 43, 38][i], 96)
chord('strS', FX['who'], 0.8, [45, 52, 57, 62, 64], 66, h=0)                                                                  # A sus — a question
# ═══ no-self: the character is written; five plucks, one per aggregate; the chariot clatters and comes apart; it resolves
note('timp', SE['t'], 0.8, 38, 98); chord('strS', SE['t'], 2.2, [38, 50, 57, 62], 62, h=0); chord('drone', SE['t'], 8.0, [38, 45, 50], 60, h=0)
for i, s in enumerate(SE['heaps']): note('harp', s, 0.5, [62, 65, 67, 69, 72][i], 72); note('sitar', s, 0.3, [74, 77, 79, 81, 84][i], 60)
chord('strS', SE['which'], 1.0, [45, 57, 60, 64], 60, h=0)
for k in range(6): note('pizz', SE['cart'] + k * 0.15, 0.12, [50, 57, 50, 57, 50, 57][k], 70)
for k in range(8): note('harp', SE['apart'] + k * 0.06, 0.3, [86, 81, 79, 74, 72, 69, 67, 62][k], 66)
chord('strS', SE['name'], 1.2, [41, 53, 57, 60, 65], 70, h=0); chord('oohs', SE['name'], 1.2, [60, 65, 69], 56)
line('flute', SE['decode'], MOTIF, 0.4, v=72); chord('pad', SE['decode'], 2.0, [62, 65, 69, 74], 46, h=0)
chord('strS', SE['out'] - 0.6, 0.8, [43, 55, 62, 67], 58, h=0)
# ═══ dependent origination: the koto arrives; each node one pentatonic note; the net, a bright chord; the cloud pulled; 空
chord('koto', NT['quote'], 1.0, [50, 57, 62], 74, roll=0.08)
for i in range(8): note('koto', NT['nodes'] + i * 0.17, 0.6, [62, 64, 67, 69, 71, 74, 76, 79][i], 72)
chord('strS', NT['web'], 1.4, [43, 55, 59, 62, 66, 71], 64, h=0)
for k, p in enumerate([79, 76, 74, 71, 74, 76, 79, 83]): note('harp', NT['web'] + k * 0.15, 0.4, p, 56)
note('koto', NT['pull'], 0.5, 71, 70); note('koto', NT['pull'] + 0.25, 0.8, 70, 60)
chord('strS', NT['gone'], 1.5, [45, 57, 60, 63], 58, h=0)
note('timp', NT['kong'], 0.8, 38, 100); note('sub', NT['kong'], 1.4, 26, 92); chord('choir', NT['kong'], 2.4, [38, 45, 50, 57], 74)
chord('strS', NT['kong'], 2.4, [38, 50, 57, 62, 69], 70, h=0)
line('flute', NT['decode'] + 0.3, MOTIF, 0.4, v=70)
# ═══ the Heart Sutra: the wave swells and falls; the 260 characters over a temple pulse; 无苦集灭道 opens; the raft
chord('cello', HT['rise'] - 0.3, 2.0, [38, 45], 62); chord('strS', HT['rise'], 1.6, [50, 57, 62, 66], 66, h=0)
chord('strS', HT['fall'], 1.6, [43, 55, 59, 62], 62, h=0)
for k in range(6): note('koto', HT['fall'] + k * 0.12, 0.4, [86, 83, 79, 76, 74, 71][k], 60)
chord('choir', HT['field'], HT['raft'] - HT['field'], [38, 45, 50], 70); chord('cb', HT['field'], HT['raft'] - HT['field'], [26], 62)   # a chanting drone
for k in range(4): note('koto', HT['field'] + k * 0.5, 0.4, [62, 69, 67, 62][k], 60)
for k in range(7): note('koto', HT['wu'] + k * 0.09, 0.3, 74 + (k % 2) * 3, 62)
chord('strS', HT['sz'], 1.3, [43, 55, 62, 66, 71], 74, h=0); chord('oohs', HT['sz'], 1.3, [62, 66, 71], 60)
note('flute', HT['sz'] + 0.3, 0.9, 81, 64)
for k in range(14): note('koto', HT['raft'] + k * 0.13, 0.25, [62, 64, 67, 69, 71, 74, 71, 69, 67, 69, 71, 74, 76, 79][k], 62)
chord('pad', HT['raft'], 2.2, [62, 67, 71, 74], 42, h=0)
for k in range(5): note('koto', HT['leave'] + k * 0.07, 0.4, [74, 76, 79, 81, 86][k], 66)
line('flute', HT['rdecode'], MOTIF, 0.35, v=70); chord('strS', HT['rdecode'], 1.4, [50, 57, 62, 66], 56, h=0)
# ═══ the Diamond Sutra: a stately low line under the scroll; the stamps; the peel; the six likenesses, one colour each
chord('strS', DM['t'], 2.5, [38, 50, 57, 62], 62, h=0); note('timp', DM['t'], 0.6, 38, 84)
line('koto', DM['fact'], [62, 64, 67, 69, 74], 0.25, v=70)
chord('choir', DM['quote'], 2.0, [50, 57, 62, 66], 66); chord('cello', DM['quote'], 2.0, [38, 45], 62)
note('shaku', DM['sengai'], 1.2, 74, 70); note('shaku', DM['sengai'] + 0.6, 0.6, 72, 62)
for s in DM['labels']: note('taiko', s, 0.25, 50, 80)
for k in range(8): note('harp', DM['peel'] + k * 0.05, 0.3, [62, 66, 69, 74, 78, 81, 86, 90][k], 62)
chord('strS', DM['decode2'], 1.4, [38, 50, 57, 62, 66], 66, h=0)
for k in range(9): note('pizz', SX['t'] + k * 0.5, 0.15, [50, 57][k % 2], 60)                                                  # a quiet pulse under the six
for i, s in enumerate(SX['items']):
    if i == 0: chord('harp', s, 0.5, [74, 78, 81], 56, roll=0.04)
    if i == 1: note('koto', s, 0.5, 86, 60)
    if i == 2: note('pizz', s + 0.4, 0.1, 86, 70)
    if i == 3: note('cello', s, 0.5, 45, 64)
    if i == 4: note('harp', s, 0.4, 93, 52)
    if i == 5: note('timp', s, 0.6, 38, 96); chord('horn', s, 0.4, [50, 57, 62], 74)
chord('strS', SX['decode'], 1.2, [43, 55, 62, 67, 71], 64, h=0)
# ═══ 应无所住: calm water, a shakuhachi, a few koto notes; the light grows into white paper
chord('pad', AB['t'], 4.2, [57, 62, 66, 69], 46, h=0); chord('cb', AB['t'], 4.0, [38], 54)
line('shaku', AB['quote'], [69, None, 74, 72, 69], 0.5, d=0.9, v=70)
for k, p in enumerate([74, 81, 79]): note('koto', AB['goose'] + 0.4 + k * 0.6, 0.6, p, 58)
chord('strS', AB['huineng'], 1.4, [50, 57, 62, 66, 69], 62, h=0); chord('oohs', AB['huineng'], 1.4, [62, 66, 69], 54)
for k in range(8): note('harp', AB['huineng'] + 0.2 + k * 0.1, 0.4, [62, 66, 69, 74, 78, 81, 86, 90][k], 54)
# ═══ Chan: almost nothing — a shakuhachi, the two verses, the mirror gone, the empty circle, the moon
chord('drone', CN['t'], 13.0, [38, 45], 44, h=0)
line('shaku', CN['who'], [74, 72, 69], 0.45, d=0.8, v=64)
note('koto', CN['shen'], 1.0, 50, 66); note('koto', CN['shen'] + 0.5, 0.6, 57, 58)
for s in CN['wipes']: note('cello', s, 0.4, 38, 50)
note('koto', CN['neng'], 1.2, 62, 70); note('koto', CN['neng'] + 0.35, 0.8, 69, 62); note('koto', CN['neng'] + 0.7, 0.8, 74, 60)
chord('strS', CN['dissolve'], 1.4, [38, 50, 57, 64], 50, h=0)
chord('koto', CN['decode'], 1.2, [50, 57, 62, 66], 64, roll=0.07)
chord('strS', CN['moon'], 3.0, [38, 50, 57, 62, 64, 69], 62, h=0); chord('harp', CN['moon'], 1.0, [62, 66, 69, 74], 58, roll=0.06)
line('shaku', CN['focus'], MOTIF, 0.45, v=70)
# ═══ the ending: the first arrow, softer; the thoughts dissolve upward; the mantra climbs to D major
chord('drone', EN['t'] - 0.2, 11.0, [38, 45, 50], 62, h=0)
note('timp', EN['hit'], 0.7, 38, 96); note('sub', EN['hit'], 1.0, 26, 86); note('sitar', EN['l1'], 1.0, 74, 70)
chord('trem', EN['swarm'], EN['dissolve'] - EN['swarm'], [62, 63, 68], 46)
for k in range(10): note('harp', EN['dissolve'] + k * 0.07, 0.4, [62, 66, 69, 74, 78, 81, 86, 90, 93, 98][k], 58)
chord('strS', EN['l2'], 1.5, [38, 50, 57, 62, 66, 69], 72, h=0); line('flute', EN['l2'] + 0.2, MOTIF[:2] + [76, 78], 0.3, v=70)
SYL = [[0.0, 0.25], [0.0, 0.25], [0.0, 0.19, 0.38, 0.56], [0.0, 0.15, 0.3, 0.45, 0.6], [0.0, 0.25, 0.5, 0.75, 1.0]]
MEL = [[62, 62], [64, 64], [66, 66, 69, 69], [69, 71, 69, 66, 69], [74, 73, 71, 69, 74]]
for i, (s, offs, mel) in enumerate(zip(EN['mantra'], SYL, MEL)):
    for j, (o, p) in enumerate(zip(offs, mel)):
        last = i == 4 and j == len(offs) - 1
        d = 2.6 if last else (offs[j + 1] - o if j + 1 < len(offs) else 0.45) * 0.95
        note('choir', s + o, d, p, 76 + i * 4); note('choir', s + o, d, p - 12, 66 + i * 4); note('oohs', s + o, d, p + 7 if last else p - 5, 54)
    note('timp', s, 0.4, 38, 74 + i * 6); chord('strS', s, 0.5 if i < 4 else 3.0, [38, 50, 57] + ([62, 66, 69] if i >= 2 else [62]), 58 + i * 6, h=0)
note('sub', EN['chord'], 2.0, 26, 92); chord('horn', EN['chord'], 2.5, [50, 57, 62, 66], 88); note('timp', EN['chord'], 1.0, 38, 112)
line('horn', EN['chord'] + 0.2, ANSWER[:4], 0.3, v=86)
chord('strS', EN['card'], 2.6, [38, 50, 57, 62, 66, 69, 74], 72, h=0); chord('choir', EN['card'], 2.4, [62, 66, 69, 74], 66)
note('sitar', EN['card'] + 0.3, 1.5, 74, 64); note('koto', EN['card'] + 0.6, 1.5, 81, 60); note('shaku', EN['card'] + 0.9, 1.4, 86, 54)

# ═══ bridges: hold the floor where a section hands over, so the level never drops into a hole
chord('cello', 0.0, 1.4, [38], 72); note('cb', 0.0, 1.4, 26, 70)
note('cello', DO['out'] - 0.3, 1.2, 45, 62)
chord('strS', FX['phases'][3] + 0.6, 1.0, [38, 45, 50, 57], 56, h=0)
chord('strS', NT['t'] - 0.1, 2.9, [38, 50, 57, 62], 54, h=0)
chord('strS', NT['kong'] - 1.5, 1.6, [45, 57, 60, 64], 56, h=0)
chord('strS', HT['t'] - 0.2, 0.9, [38, 50, 57], 56, h=0)
chord('strS', DM['t'] + 2.4, 1.0, [38, 50, 57, 62], 56, h=0)
chord('choir', DM['quote'] + 1.9, 1.7, [50, 57, 62], 60); note('cello', DM['quote'] + 1.9, 1.7, 38, 60)
chord('pad', SX['t'] - 0.2, 3.6, [50, 57, 62, 66], 46, h=0); chord('strS', SX['t'] - 0.2, 1.2, [38, 50, 57], 52, h=0)
chord('strS', CN['shen'] - 0.6, 3.6, [38, 45, 50, 57], 50, h=0); line('shaku', CN['shen'] + 0.8, [69, 67, 62], 0.8, d=1.2, v=58)
chord('strS', CN['decode'] + 0.6, 3.0, [38, 50, 57], 48, h=0); note('shaku', CN['ox'] - 0.6, 2.2, 74, 56); note('koto', CN['ox'], 1.0, 62, 56)
chord('strS', EN['t'] - 0.4, 1.2, [38, 50, 57, 62], 54, h=0); chord('trem', EN['swarm'] + 0.4, 0.8, [62, 63, 68], 54)

# a held note and a new note on the same pitch: end the old one just before the new one starts (otherwise the old
# note-off would silence the new note)
for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i

music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design (all synthesized unless a library number is given)
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
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x, axis=0)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def pad_to(x, n): return np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12, rev=False, lo=300, hi=3000):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(bp(noise(n, seed), lo, hi), 4000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_arrow(dur=0.7, seed=1):                 # an arrow in flight: a narrow air band that rises and passes, then the shaft hits wood
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k in range(0, n, 2400):                # sweep the band upward in short blocks
        f = 500 + 2200 * (k / n) ** 2; m = min(2400, n - k); x[k:k + m] = bp(noise(m, seed + k), f, f * 1.8)
    x = lp(x, 6000) * (t / dur) ** 2.5
    hit = s_thunk()[:, 0]
    return st(np.concatenate([x, hit]))
def s_thunk(f=180, seed=3):                    # the arrowhead in wood: a dry knock and a short low body
    n = int(0.35 * SR); t = np.arange(n) / SR
    body = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.3 * t)) * env(n, 0.0008, 0.05)
    return st(body + 0.6 * bp(noise(n, seed), 800, 4000) * env(n, 0.0003, 0.008) + 0.9 * pad_to(s_thump(90, 48, 0.3), n)[:, 0])
def s_stamp(seed=5):                           # a seal pressed onto paper: a soft thud and a paper crackle
    n = int(0.3 * SR); return st(0.9 * pad_to(s_thump(110, 60, 0.18), n)[:, 0] + 0.35 * bp(noise(n, seed), 1500, 6000) * env(n, 0.001, 0.02))
def s_brush(dur=0.55, seed=7):                 # a loaded brush on paper: bristle noise, swelling and dying
    n = int(dur * SR); t = np.arange(n) / SR
    x = bp(noise(n, seed), 700, 5000) * np.sin(np.pi * t / dur) ** 1.5 * (1 + 0.3 * np.sin(2 * np.pi * 23 * t))
    return st(lp(x, 6500))
def s_breath(dur=0.45, seed=9):                # blowing out a flame
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 300, 2500), 3000) * np.sin(np.pi * t / dur) ** 0.8)
def s_flick(seed=11):                          # a card flipping
    n = int(0.08 * SR); return st(bp(noise(n, seed), 1200, 5000) * env(n, 0.0005, 0.015))
def s_sand(dur=2.0, seed=13, density=700):     # running sand: many tiny grains
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 300, int(dur * density)): x[i:i + 200] += r.uniform(-1, 1) * np.exp(-np.arange(200) / 30)
    return st(lp(bp(x, 1200, 8000), 7000) * np.minimum(1, np.arange(n) / (0.2 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.3 * SR)))
def s_wood(f=420, seed=15, dur=0.18):          # a wooden knock (木鱼, cart parts): hollow, short, no ring
    n = int(dur * SR); t = np.arange(n) / SR
    return st((np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.48 * t)) * env(n, 0.0006, 0.035) + 0.3 * bp(noise(n, seed), 600, 3000) * env(n, 0.0003, 0.006))
def s_clap(seed=17):                           # 拍子木: two hardwood clappers
    n = int(0.25 * SR); t = np.arange(n) / SR
    return st(lp((np.sin(2 * np.pi * 1450 * t) * 0.6 + bp(noise(n, seed), 1000, 5000)) * env(n, 0.0003, 0.012), 6500))
def s_water(dur=2.0, seed=19, swell=True):     # water: a wave rising and breaking, or lapping
    n = int(dur * SR); t = np.arange(n) / SR
    x = lp(noise(n, seed), 1200) * (np.sin(np.pi * t / dur) ** 2 if swell else 0.5 + 0.5 * np.sin(2 * np.pi * 1.3 * t) ** 2)
    return st(x + 0.3 * bp(noise(n, seed + 1), 1500, 5000) * (t / dur) ** 3 * swell)
def s_pop(seed=21):                            # a bubble: a quick upward chirp and a click
    n = int(0.12 * SR); t = np.arange(n) / SR; f = 600 + 2500 * t / 0.12
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.03) * 0.6 + 0.4 * bp(noise(n, seed), 2000, 6000) * env(n, 0.0002, 0.004))
def s_drip(seed=23):                           # a drop of dew
    n = int(0.2 * SR); t = np.arange(n) / SR; f = 900 + 1400 * np.exp(-t / 0.02)
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.04))
def s_thunder(seed=25):                        # lightning: a crack and a rolling rumble
    n = int(1.8 * SR); t = np.arange(n) / SR
    crack = bp(noise(n, seed), 800, 6000) * env(n, 0.0005, 0.03)
    roll = lp(noise(n, seed + 1), 180) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * t)) * env(n, 0.05, 0.6) * 3
    return st(lp(crack + roll, 6000))
def s_flap(seed=27):                           # a wing beat
    n = int(0.16 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 200, 1600), 2000) * np.sin(np.pi * t / 0.16) ** 2)
def s_tear(seed=29, dur=0.4):                  # paper tearing / peeling
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 200, int(dur * 500)): x[i:i + 120] += r.uniform(-1, 1) * np.exp(-np.arange(120) / 15)
    return st(lp(bp(x, 900, 7000), 6500) * np.sin(np.pi * np.arange(n) / n) ** 0.5)
def s_murmur(dur=0.9, seed=31):                # anxious murmur: formant-filtered noise bursts
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, (a, b) in enumerate([(300, 900), (500, 1500), (700, 2200)]): x += bp(noise(n, seed + k), a, b) * (0.5 + 0.5 * np.sin(2 * np.pi * (5 + 2 * k) * t + k))
    return st(lp(x, 3000) * np.sin(np.pi * t / dur) ** 0.7)
def s_dust(dur=1.6, seed=33):                  # dust lifting away
    return s_sand(dur, seed, 900) * np.linspace(1, 0.3, int(dur * SR))[:, None]

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
L = {k: trim(lib(k)) for k in (2605, 1120, 498, 774)}
ARROW = 0.7
def arrow_at(hit, db, why, seed=1):           # the whoosh ends exactly on the hit
    put(hit - ARROW, s_arrow(ARROW, seed), db, 'arrow flight + thunk (synth)', why)

arrow_at(HK['hit1'], -24, 'the first arrow lands')
put(HK['swarm'], s_murmur(0.9), -32, 'anxious murmur (synth)', 'the thoughts swarm')
arrow_at(HK['hit2'], -22, 'the second arrow lands, harder', seed=2)
for s in (HK['t1'] + 0.5, HK['t2'] + 0.9): put(s, s_stamp(), -31, 'seal stamp (synth)', 'seal: 身受 / 心受' if s < 2 else '')
put(TI['t'], s_brush(0.6), -29, 'brush stroke (synth)', '佛 is written'); put(TI['seal'], s_stamp(6), -30, 'seal stamp (synth)', '觉者')
for i, s in enumerate(DO['rows']): put(s + 0.15, s_stamp(10 + i), -30, 'seal stamp (synth)', 'the diagnosis, row by row' if i == 0 else '')
put(DO['blow'], s_breath(), -30, 'breath (synth)', 'nirvana: the flame is blown out')
for k in range(8): put(DO['eight'] + k * 0.11, s_flick(40 + k), -34, 'card flick (synth)', 'the eight sufferings flip in' if k == 0 else '')
put(FX['phases'][0] - 0.3, s_sand(1.0, 50, 500), -33, 'sand gathering (synth)', '生: the form gathers')
put(FX['phases'][3], s_dust(1.2, 51), -32, 'dust scattering (synth)', '灭: it scatters')
put(FX['grasp'], s_sand(FX['wheel'] - FX['grasp'] + 0.2, 52, 900), -30, 'running sand (synth)', 'the tighter the grip, the faster it runs')
put(FX['glabel'], s_brush(0.5, 53), -31, 'brush stroke (synth)', '执着')
put(FX['wheel'], L[2605], -32, 'air_quick (2605)', 'into the wheel of life', align='peak')
put(SE['t'], s_brush(0.7, 60), -28, 'brush stroke (synth)', '我 is written')
put(SE['split'], s_swell(0.25, 61, lo=1500, hi=6000), -32, 'slice (synth)', '我 is cut into five')
for k in range(4): put(SE['cart'] + k * 0.15, s_wood(300 + k * 40, 62 + k), -32, 'wooden knock (synth)', 'the chariot is assembled' if k == 0 else '')
for k in range(4): put(SE['apart'] + k * 0.07, s_wood(240 + k * 50, 66 + k, 0.25), -31, 'wooden knock (synth)', 'and taken apart' if k == 0 else '')
for i in range(8): put(NT['nodes'] + i * 0.17, L[1120], -35, 'pop_soft (1120)', 'a thread to each thing in the paper' if i == 0 else '')
put(NT['pull'] + 0.1, s_tear(70, 0.5), -30, 'paper tear (synth)', 'the cloud is pulled out; the paper goes')
put(NT['kong'] - 0.6, s_swell(0.6, 71, rev=False, lo=200, hi=2000), -32, 'swell (synth)', ''); put(NT['kong'], L[498], -26, 'deep_hit (498)', '空')
put(HT['rise'] - 0.2, s_water(2.6, 80), -29, 'wave rising and falling (synth)', 'the wave rises from the water and falls back')
put(HT['field'], s_tear(81, 0.6), -33, 'paper sweep (synth)', 'the 260 characters')
for k in range(int((HT['raft'] - HT['field']) / 0.5)): put(HT['field'] + k * 0.5, s_wood(380, 82 + k, 0.2), -31 - (k % 2) * 2, '木鱼 (synth wood)', 'a temple pulse under the Heart Sutra' if k == 0 else '')
put(HT['raft'], s_water(HT['leave'] - HT['raft'] + 0.5, 83, swell=False), -33, 'lapping water (synth)', 'the raft crosses')
put(HT['leave'], s_wood(200, 84, 0.2), -32, 'step on the bank (synth)', 'the raft is left behind')
put(DM['t'] - 0.1, s_tear(90, 0.8), -33, 'scroll unrolling (synth)', 'the Diamond Sutra of 868')
for i, s in enumerate(DM['labels']): put(s, s_stamp(91 + i), -28, 'label slapped on (synth)', 'labels: 我的 / 失败 / 完美' if i == 0 else '')
for i in range(3): put(DM['peel'] + i * 0.1, s_tear(95 + i, 0.3), -32, 'label peeled (synth)', 'peeled off' if i == 0 else '')
put(SX['items'][0], s_swell(0.5, 100, rev=True, lo=300, hi=2000), -33, 'reverse swell (synth)', '梦')
put(SX['items'][1], L[2605], -34, 'air_quick (2605)', '幻', align='peak')
put(SX['items'][2] + 0.9, s_pop(), -31, 'bubble pop (synth)', '泡')
put(SX['items'][3], s_swell(0.5, 101, lo=200, hi=1200), -34, 'soft air (synth)', '影')
put(SX['items'][4] + 0.2, s_drip(), -32, 'drip (synth)', '露')
put(SX['items'][5], s_thunder(), -26, 'thunder (synth)', '电')
for k in range(6): put(AB['goose'] + 0.2 + k * 0.33, s_flap(110 + k), -34, 'wing beat (synth)', 'the goose crosses' if k == 0 else '')
put(AB['out'] - 0.8, s_swell(0.9, 111, lo=500, hi=4000), -31, 'bright swell (synth)', 'the light becomes white paper')
put(CN['shen'] - 0.05, s_clap(120), -29, '拍子木 clappers (synth)', 'Shenxiu\'s verse'); put(CN['neng'] - 0.05, s_clap(121), -29, '拍子木 clappers (synth)', 'Huineng\'s verse')
for i, s in enumerate(CN['wipes']): put(s - 0.05, s_brush(0.35, 122 + i), -30, 'dry brush wipe (synth)', 'the mirror wiped clean' if i == 0 else '')
put(CN['dissolve'], s_swell(0.8, 125, rev=True, lo=200, hi=1500), -31, 'ink dispersing (synth)', 'the mirror is not there')
put(CN['fall'], s_sand(1.2, 126, 400), -34, 'dust falling (synth)', 'the dust falls through')
put(CN['moon'] - 0.3, s_swell(0.6, 127, lo=300, hi=2500), -33, 'soft swell (synth)', 'the empty circle becomes the moon')
arrow_at(EN['hit'], -26, 'the first arrow still comes', seed=3)
put(EN['swarm'], s_murmur(1.0, 130), -34, 'anxious murmur (synth)', 'the thoughts come again')
put(EN['dissolve'], s_dust(1.6, 131), -30, 'dust lifting (synth)', 'they dissolve before they become an arrow')
put(EN['shore'], s_water(2.0, 132), -33, 'water (synth)', 'the far shore')
put(EN['chord'], L[774], -26, 'impact_space (774)', '菩提萨婆诃')
put(EN['card'], s_brush(0.7, 133), -30, 'brush stroke (synth)', '佛')

SFX = lp(SFX, 9500) * 10 ** (2 / 20)
ir = sc.ir
sfx_mix = SFX + 0.2 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x + 0.35 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 1.2) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'buddha_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'buddha_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 佛 · 第二支箭 — cue sheet (generated by music/buddha.py)\n\nEvery time comes from src/buddha/buddha.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'buddha_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))
for i in sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()}):
    if harsh(analyse(os.path.join(LIB, f'{i}.wav'))): print(f'sfx {i}: harsh raw file — CHECK')

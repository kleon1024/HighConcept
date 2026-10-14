"""什么是爱 (98 s) — score and sound design, synced to src/love/love.json.
Run: python3 music/love.py → public/love_score.wav, out/love_sfx_only.wav, out/love_cues.md

A play in five acts, scored like one: a single waltz theme (the "four o'clock waltz", F major, 3/4, a beat every
half second) changes costume in every act.
  Overture   — a timpani roll behind the curtain; it opens on a harp glissando and the whole orchestra; the theme begins.
  I  寻找    — Plato on a lyre (harp) and an aulos (flute) in D Dorian; a lightning strike splits the circle; two flutes
               seek each other in canon. Romeo: romantic strings, a cello sings, the horn rises on 「越给越多」.
  II 驯服    — the Little Prince: a storybook waltz (flute, pizzicato); it stops dead at the five thousand roses.
               The fox: a Paris musette — the theme on accordion with guitar and bass. Four o'clock: a ticking pulse and a
               heartbeat that quickens while the strings climb. The wheat: the theme on full orchestra — joy at its height.
  III 告别   — the parting: a solo cello in A minor; 「麦子的颜色」 opens into F major. The secret: the theme alone on piano.
               The curtain falls on a soft drum roll.
  IV 失去    — night: 箫 and 古琴 over a low drone; the drum where the goose is killed; the qin falls; the poem.
               The loquat tree: qin and piano turn towards consolation.
  V  成为    — Rembrandt: a four-part chorale in the strings. Fromm: a minimalist piano ostinato (practice, repetition).
               The cascade climbs chord by chord into Klimt: Vienna 1907 — harp and lush strings, the theme high on violin.
  尾声       — each answer recalls an instrument from earlier (accordion, flute, horn); the question hangs; the theme
               rises and resolves.
  谢幕       — the waltz returns on full orchestra while the audience applauds; the final chord as the curtain closes.
"""
import json, os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, fftconvolve, lfilter, sosfilt
import engine
from engine import SF2, Score, Synth
from mixutil import compress, jumps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'love', 'love.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); BEAT = 0.5
CU, HK, PL, RO, PR, FO, CL, WH, PA, SE, GE, LQ, RI, FR, MO, KI, EN, CA = (J[k] for k in ('curtain', 'hook', 'plato', 'romeo', 'prince', 'fox', 'clock', 'wheat', 'part', 'secret', 'geese', 'loquat', 'rilke', 'fromm', 'montage', 'kiss', 'end', 'call'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

def v_qin(f, dur, vel, sr, rng, decay=0.9975):
    """A low plucked silk string (Karplus–Strong through a soft loop filter) with a warm body."""
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.6) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), 1800, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); t = np.arange(n) / sr
    y = y / (np.abs(y).max() + 1e-9) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.35 * sr))
    y = lp(y, 2600, sr); return np.stack([y, y], axis=1)
engine.VOICES['qin'] = v_qin

PARTS = {
    'piano': SF2('piano', level=-16, verb=0.5), 'strS': SF2('ms', 49, level=-17, verb=0.6, lp=6500), 'vln': SF2('ms', 40, level=-18, verb=0.6, lp=6500),
    'cello': SF2('ms', 42, level=-17, verb=0.5), 'cb': SF2('ms', 43, level=-19, verb=0.45), 'trem': SF2('ms', 44, level=-21, verb=0.5, lp=5000),
    'harp': SF2('ms', 46, level=-18, verb=0.55), 'flute': SF2('ms', 73, level=-18, verb=0.55, lp=6000), 'oboe': SF2('ms', 68, level=-18, verb=0.5, lp=5500),
    'horn': SF2('ms', 60, level=-19, verb=0.55, cap=112), 'timp': SF2('ms', 47, level=-18, verb=0.5), 'accord': SF2('ms', 21, level=-17, verb=0.4, lp=5000),
    'pizz': SF2('ms', 45, level=-19, verb=0.4), 'guitar': SF2('ms', 24, level=-20, verb=0.4), 'choir': SF2('ms', 52, level=-19, verb=0.7),
    'oohs': SF2('ms', 53, level=-20, verb=0.7), 'xiao': SF2('ms', 75, level=-19, verb=0.6, lp=5000), 'qin': Synth('qin', level=-17, verb=0.45),
    'sub': Synth('sub', level=-23, verb=0.0, cap=100), 'pad': Synth('pad', level=-25, verb=0.6, cutoff=1400, attack=0.8),
}
sc = Score(DUR, SR, seed=1943)
rng = np.random.default_rng(1943)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.004, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
def line(part, s, ps, step, d=None, v=76):
    for i, p in enumerate(ps):
        if p is not None: note(part, s + i * step, d or step * 0.95, p, v)
def tune(part, s, phrase, beat=BEAT, tr=0, v=80, legato=0.95):
    for b, p, l in phrase: note(part, s + b * beat, l * beat * legato, p + tr, v)
def roll(part, s, e, p, v0, v1, step=0.06):
    k = 0; n = max(1, int((e - s) / step))
    while s + k * step < e: note(part, s + k * step, step * 1.2, p, int(v0 + (v1 - v0) * k / n), h=0.002); k += 1
def gliss(part, s, ps, step=0.04, v=70):
    for i, p in enumerate(ps): note(part, s + i * step, 0.5, p, v)
def waltz(s, bars, chords, beat=BEAT, bass='cb', comp='pizz', v=64, bassv=72):
    """Oom-pah-pah: the root on beat one, the chord on two and three."""
    for i in range(bars):
        root, tones = chords[i % len(chords)]
        b0 = s + i * 3 * beat
        note(bass, b0, beat * 0.9, root, bassv)
        for k in (1, 2): chord(comp, b0 + k * beat, beat * 0.6, tones, v)
F_ = (41, [57, 60, 65]); Bb = (46, [58, 62, 65]); C7 = (36, [58, 60, 64]); C_ = (36, [55, 60, 64]); Dm = (38, [57, 62, 65]); Am = (45, [57, 60, 64]); Gm = (43, [58, 62, 67])
SCALE_F = [53, 55, 57, 58, 60, 62, 64, 65, 67, 69, 70, 72, 74, 76, 77, 79, 81]
A = [(0, 72, 2), (2, 69, 1), (3, 77, 1), (4, 76, 1), (5, 74, 1), (6, 72, 2), (8, 69, 1), (9, 70, 1), (10, 69, 1), (11, 67, 1)]   # the theme, first phrase
A2 = [(0, 72, 2), (2, 69, 1), (3, 77, 1), (4, 79, 1), (5, 81, 2), (7, 79, 1), (8, 76, 1), (9, 77, 3)]                          # the theme, soaring
MOT = A[:5]

# ═══ overture: a drum roll behind the curtain; it opens on the harp and the orchestra; the theme begins
roll('timp', 0.0, CU['open1'][0], 41, 40, 104); chord('trem', 0.0, CU['open1'][0] + 0.2, [53, 60, 65], 58)
o = CU['open1'][0]
gliss('harp', o, SCALE_F, 0.035, 74); note('timp', o + 0.6, 0.8, 41, 110); note('sub', o + 0.6, 1.6, 29, 96)
chord('strS', o + 0.6, 3.6, [41, 53, 60, 65, 69], 78, h=0); chord('choir', o + 0.6, 3.2, [65, 69, 72], 70); chord('horn', o + 0.6, 1.6, [53, 60, 65], 80)
tune('vln', o + 0.9, MOT, v=86); tune('flute', o + 0.9, MOT, v=70)
waltz(o + 0.6, 3, [F_, Bb, F_], bass='cb', comp='harp', v=54)
note('vln', o + 0.9 + 6 * BEAT, 1.2, 72, 80)
chord('strS', HK['title'], 1.8, [41, 53, 57, 60, 65, 67], 80, h=0); chord('choir', HK['title'], 1.8, [60, 65, 69], 72); note('timp', HK['title'], 0.6, 41, 90)
# ═══ Act I — Plato: lyre and aulos in D Dorian; lightning; two flutes seek each other
for k in range(int((PL['split'] - PL['t']) / 0.25)): note('harp', PL['t'] + k * 0.25, 0.3, [50, 57, 62, 65, 64, 60][k % 6], 64)
line('flute', PL['round'], [74, 76, 77, 76, 74], 0.5, v=70)
note('timp', PL['split'], 1.0, 38, 110); note('sub', PL['split'], 1.2, 26, 92); gliss('harp', PL['split'], [86, 84, 81, 79, 77, 74, 72, 69, 67, 65, 62], 0.04, 70); chord('cb', PL['split'], 2.2, [26, 38], 66)
chord('pad', PL['split'], 4.0, [50, 57, 60, 65], 46, h=0)
seek = [74, 76, 77, 79, 77, 76]
line('flute', PL['l2'], seek, 0.45, v=66); line('oboe', PL['l2'] + 0.45, [p - 5 for p in seek], 0.45, v=62)
for k in range(8): note('harp', PL['l3'] + k * 0.33, 0.4, [50, 57, 62, 64][k % 4], 56)
# ═══ Romeo: romantic strings, a singing cello, the horn rising
for i, (r, tones) in enumerate([Am, F_, C_, (43, [55, 59, 62])]):
    s = RO['t'] + i * 1.45
    chord('strS', s, 1.5, [r, r + 12] + tones, 66 + i * 4, h=0)
    for k, p in enumerate([r + 12] + tones + [tones[-1] + 12]): note('harp', s + k * 0.1, 0.6, p, 56)
tune('cello', RO['l1'], [(0, 64, 2), (2, 65, 1), (3, 69, 2.2), (5.2, 72, 2), (7.2, 71, 1), (8.2, 67, 2.6)], beat=0.5, v=88)
line('horn', RO['decode'], [60, 64, 67, 72], 0.4, d=0.9, v=86); chord('strS', RO['decode'] + 1.2, 1.6, [48, 60, 64, 67, 72], 80, h=0); roll('timp', RO['decode'] + 0.6, RO['decode'] + 1.2, 36, 40, 80)
# ═══ Act II — the Little Prince: a storybook waltz that stops at the five thousand roses
waltz(PR['t'], 2, [F_, Bb], v=56, bassv=62)
tune('flute', PR['l1'], A[:7], v=76)
for k in range(5): note('harp', PR['t'] + 0.4 + k * 0.6, 0.4, [84, 89, 86, 91, 88][k], 40)
note('cello', PR['earth'], 2.4, 45, 80); chord('piano', PR['earth'] + 0.1, 2.2, [45, 57, 60, 64], 62); line('oboe', PR['earth'] + 0.6, [69, 67, 65, 64], 0.45, d=0.6, v=70)
# the fox: a Paris musette
waltz(FO['t'], 4, [F_, Bb, C7, F_], bass='cb', comp='guitar', v=60, bassv=74)
tune('accord', FO['t'] + 0.2, A, v=84)
waltz(FO['dots'], 2, [Dm, Bb], bass='cb', comp='pizz', v=46, bassv=56)
line('accord', FO['dots'] + 0.2, [69, 70, 72, 74], 0.5, v=66)
chord('strS', FO['l4'], 2.0, [41, 53, 57, 60, 65], 70, h=0); gliss('harp', FO['l4'], [65, 69, 72, 77, 81], 0.06, 60); line('accord', FO['l4'] + 0.2, [72, 77, 76, 74, 72], 0.4, v=74)
# four o'clock: the tick, the climb, the arrival
chord('strS', CL['t'] - 0.2, 1.4, [41, 53, 57, 60], 60, h=0); chord('pad', CL['t'] - 0.2, 3.2, [53, 57, 60, 65], 48, h=0); note('accord', CL['t'], 0.9, 72, 56)
for k in range(int((CL['out'] - CL['t']) / 0.5)): note('pizz', CL['t'] + k * 0.5, 0.1, 84, 52 + k * 2)
for i, (s, tones) in enumerate(zip([CL['sweep'], CL['sweep'] + 0.5, CL['sweep'] + 1.0, CL['sweep'] + 1.5], ([48, 55, 64], [49, 55, 64], [50, 57, 65], [51, 57, 66]))):
    chord('strS', s, 0.5, tones, 60 + i * 6, h=0); chord('trem', s, 0.5, [t_ + 12 for t_ in tones], 50 + i * 6)
roll('timp', CL['out'] - 0.8, CL['out'], 41, 50, 100)
# the wheat: joy — the theme on full orchestra
w0 = WH['t']
tune('vln', w0, A2[:6], v=96); tune('flute', w0, A2[:6], tr=12, v=74); tune('horn', w0, A2[:6], tr=-12, v=82)
waltz(w0, 3, [F_, Bb, F_], bass='cb', comp='harp', v=62, bassv=86)
chord('strS', w0, 1.5, [41, 53, 60, 65, 69], 84, h=0); chord('strS', w0 + 1.5, 1.5, [46, 58, 62, 65, 70], 84, h=0); chord('strS', w0 + 3.0, 1.4, [48, 60, 65, 69, 72], 86, h=0)
chord('choir', w0, 3.6, [65, 69, 72], 76); note('timp', w0, 0.8, 41, 112); note('sub', w0, 1.4, 29, 96)
# ═══ Act III — the parting: a solo cello; 「麦子的颜色」 opens into F major
chord('pad', PA['t'], 2.3, [45, 52, 57, 60], 44, h=0)
tune('cello', PA['l1'], [(0, 57, 1.6), (1.6, 60, 0.8), (2.4, 59, 0.6), (3.0, 57, 1.0), (4.0, 64, 0.8)], beat=0.5, v=84)
note('piano', PA['l2'], 1.2, 45, 56); note('piano', PA['l2'] + 0.25, 1.0, 52, 50)
chord('strS', PA['l3'], 2.4, [41, 53, 60, 65, 67, 69], 82, h=0); chord('oohs', PA['l3'], 2.2, [65, 69, 72], 66); gliss('harp', PA['l3'], [53, 60, 65, 69, 72, 77, 81], 0.07, 62)
tune('oboe', PA['l3'] + 0.4, MOT, v=74)
# the secret: the theme alone on the piano
tune('piano', SE['t'] + 0.2, A, v=74)
for i, (r, tones) in enumerate([F_, Bb, F_, C7]): note('piano', SE['t'] + 0.2 + i * 1.5, 1.4, r, 58); chord('piano', SE['t'] + 0.2 + i * 1.5 + 0.5, 0.8, [t_ - 12 for t_ in tones], 44)
chord('strS', SE['time1'], 3.2, [41, 53, 57, 60, 65], 58, h=0)
roll('timp', CU['close2'][0], CU['close2'][1], 38, 70, 30); chord('strS', CU['close2'][0], 1.4, [38, 50, 57, 62], 54, h=0)
# ═══ Act IV — night: 箫 and 古琴 over a drone; the drum; the fall; the poem
chord('pad', GE['t'], GE['out'] - GE['t'], [38, 45, 50], 50, h=0); chord('trem', GE['t'], GE['kill'] - GE['t'], [74, 77], 40)
line('xiao', GE['l1'], [74, 77, 79, 81, 79, 77], 0.55, d=0.6, v=68)
for k in range(4): note('qin', GE['l1'] + 0.3 + k * 0.6, 0.8, [50, 57, 62, 57][k], 62)
note('timp', GE['kill'], 1.2, 38, 104); note('sub', GE['kill'], 1.4, 26, 90)
note('xiao', GE['l3'], 1.4, 81, 76); note('xiao', GE['l3'] + 1.0, 0.9, 79, 70)
gliss('qin', GE['fall'], [74, 72, 69, 67, 65, 62, 60, 57, 55, 50], 0.07, 74); note('timp', GE['fall'] + 0.8, 1.0, 38, 96)
chord('strS', GE['poem'], 3.0, [38, 50, 57, 62, 64], 70, h=0); chord('oohs', GE['poem'], 2.8, [62, 65, 69], 58)
for k in range(6): note('qin', GE['poem'] + k * 0.5, 0.9, [50, 57, 62, 64, 65, 69][k], 70)
line('xiao', GE['poem'] + 0.6, [74, 77, 79, 81], 0.6, d=0.7, v=74); note('xiao', GE['poem'] + 3.0, 1.4, 81, 70)
# the loquat tree: qin and piano turn towards consolation
chord('strS', LQ['t'], 4.0, [41, 53, 57, 60], 54, h=0)
for k in range(8): note('piano', LQ['t'] + 0.2 + k * 0.5, 0.9, [53, 60, 65, 69, 53, 60, 64, 67][k], 54)
line('qin', LQ['l2'], [72, 74, 77, 74, 72], 0.5, d=0.8, v=70)
chord('strS', LQ['l3'], 2.0, [41, 53, 60, 65, 69], 74, h=0); chord('oohs', LQ['l3'], 2.0, [65, 69, 72], 60)
# ═══ Act V — Rembrandt: a chorale in four parts
for i, (b, te, al, so) in enumerate([(41, 57, 60, 65), (38, 57, 62, 65), (43, 58, 62, 67), (36, 55, 60, 64)]):
    s = RI['t'] + i * 0.95; note('cello', s, 0.92, b, 70); note('strS', s, 0.92, te, 64); note('strS', s, 0.92, al, 64); note('vln', s, 0.92, so + 12, 70)
# Fromm: minimalist piano — the same figure, practised
for i, (r, tones) in enumerate([F_, Dm, Bb, C_]):
    for k in range(4):
        s = FR['t'] + i * 1.0 + k * 0.25; note('piano', s, 0.24, [tones[0], tones[1], tones[2], tones[1]][k], 62 + i * 3)
    note('piano', FR['t'] + i * 1.0, 0.9, r, 58); note('pizz', FR['t'] + i * 1.0, 0.3, r + 12, 54)
chord('strS', FR['l2'], 2.0, [41, 53, 60, 65], 56, h=0)
# the cascade: chord by chord upward
for i, (s, tones) in enumerate(zip(MO['q'], ([45, 57, 60, 64], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]))):
    chord('strS', s, 1.1, tones, 66 + i * 6, h=0); chord('oohs', s, 1.1, tones[-3:], 56 + i * 5); note('timp', s, 0.5, tones[0] if tones[0] >= 40 else tones[0] + 12, 72 + i * 8)
chord('strS', MO['out'] - 0.4, 0.6, [43, 55, 59, 62, 67], 82, h=0); roll('timp', MO['out'] - 0.6, MO['out'], 43, 50, 96)
# Klimt: Vienna 1907 — the harp, the lush strings, the theme high and slow on violin
for k in range(int((KI['out'] - KI['t']) / 0.18)): note('harp', KI['t'] + k * 0.18, 0.7, [53, 60, 64, 69, 72, 76, 72, 69, 64, 60][k % 10] + (5 if (k // 10) % 2 else 0), 54)
chord('strS', KI['t'], 2.0, [41, 53, 57, 64, 69], 70, h=0); chord('strS', KI['paint'], 2.2, [46, 58, 62, 65, 69], 80, h=0); chord('strS', KI['paint'] + 2.2, 1.8, [41, 53, 60, 65, 69, 72], 84, h=0)
tune('vln', KI['paint'], [(0, 84, 2), (2, 81, 1), (3, 89, 1.2), (4.2, 88, 1), (5.2, 86, 1.6)], beat=0.6, v=96)
chord('choir', KI['paint'] + 1.2, 2.8, [65, 69, 72, 77], 74); note('sub', KI['paint'], 2.0, 29, 84)
# ═══ epilogue: each answer recalls an instrument; the question hangs; the theme rises and resolves
chord('strS', EN['ask'] - 0.2, EN['roses'] - EN['ask'], [41, 53, 60], 50, h=0); chord('cello', EN['a1'], EN['roses'] - EN['a1'], [41], 52)
chord('strS', EN['t'], 1.8, [41, 53, 60, 65], 54, h=0); note('piano', EN['ask'], 1.0, 72, 60); note('piano', EN['ask'] + 0.5, 1.0, 69, 54)
for k in range(5): note('pizz', EN['a1'] + k * 0.5, 0.1, 84, 48)
line('accord', EN['a1'] + 0.2, [72, 69, 77, 76], 0.5, v=64); chord('pad', EN['a1'], 2.2, [53, 57, 60, 65], 42, h=0)
tune('flute', EN['a2'], MOT, v=68); chord('pad', EN['a2'], 2.2, [58, 62, 65, 70], 42, h=0)
line('horn', EN['a3'], [65, 69, 72, 77], 0.45, d=0.9, v=74); chord('strS', EN['a3'], 2.0, [41, 53, 57, 60, 65], 60, h=0)
gliss('harp', EN['roses'], SCALE_F, 0.04, 60); chord('strS', EN['roses'], 2.0, [41, 53, 60, 65, 69], 66, h=0)
chord('strS', EN['who'], 1.5, [46, 58, 60, 62, 65, 67], 70, h=0); chord('oohs', EN['who'], 1.5, [60, 62, 67], 56)
tune('vln', EN['go1'], A2[:5], beat=0.4, v=88); chord('strS', EN['go1'], 1.0, [48, 55, 60, 64, 67], 74, h=0)
chord('strS', EN['go2'], 1.6, [41, 53, 60, 65, 69, 72], 86, h=0); chord('choir', EN['go2'], 1.6, [65, 69, 72], 72); note('timp', EN['go2'], 0.8, 41, 96); note('sub', EN['go2'], 1.2, 29, 86)
roll('timp', CU['close3'][0], CU['open3'][0], 41, 40, 104)
# ═══ curtain call: the waltz on full orchestra, the bows, the final chord
c0 = CU['open3'][0]
waltz(c0, 3, [F_, Bb, C7], beat=0.45, bass='cb', comp='harp', v=64, bassv=88)
tune('vln', c0, A2, beat=0.45, v=96); tune('accord', c0, A2, beat=0.45, tr=-12, v=74); tune('horn', c0, A2, beat=0.45, tr=-12, v=78); tune('flute', c0, A2, beat=0.45, tr=12, v=70)
chord('strS', c0, 4.0, [41, 53, 60, 65, 69], 80, h=0)
for i, s in enumerate(CA['bows']): note('harp', s, 0.6, [72, 74, 76, 77, 79, 81, 84, 89][i], 60)
fc = CA['title']
chord('strS', fc, 2.0, [29, 41, 53, 60, 65, 69, 72], 96, h=0); chord('choir', fc, 1.9, [60, 65, 69, 72], 84); chord('horn', fc, 1.9, [53, 60, 65, 69], 92)
note('timp', fc, 1.0, 41, 118); note('sub', fc, 1.8, 29, 100); gliss('harp', fc - 0.4, SCALE_F[:12], 0.03, 70)

# a held note and a new note on the same pitch: end the old one just before the new one starts
for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i

music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: theatre sounds and a few touches, all soft
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_velvet(dur=1.1, seed=1):                 # a heavy curtain moving: a low, soft rush
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(bp(noise(n, seed), 120, 1400), 1600) * np.sin(np.pi * t / dur) ** 1.4
    return np.stack([x, lp(bp(noise(n, seed + 1), 120, 1400), 1600) * np.sin(np.pi * t / dur) ** 1.4], axis=1)
def s_swell(dur=0.8, seed=12, lo=200, hi=1800):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), lo, hi), 2200) * (t / dur) ** 2.2)
def s_rumble(seed=25):
    n = int(1.8 * SR); t = np.arange(n) / SR
    return st(lp(noise(n, seed), 170) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * t)) * env(n, 0.03, 0.6) + 0.3 * bp(noise(n, seed + 1), 400, 1600) * env(n, 0.001, 0.05))
def s_tick(seed=3):                            # a clock: a small wooden tick
    n = int(0.06 * SR); t = np.arange(n) / SR; return st(lp(np.sin(2 * np.pi * 1300 * t) * env(n, 0.0005, 0.008) + 0.3 * bp(noise(n, seed), 1500, 3500) * env(n, 0.0003, 0.004), 4000))
def s_heart():
    return np.concatenate([s_thump(60, 38, 0.2), np.zeros((int(0.12 * SR), 2)), 0.7 * s_thump(60, 38, 0.2)])
def s_wind(dur=3.5, seed=31):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 200, 1500), 1600) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8))
def s_flap(seed=27):
    n = int(0.16 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 150, 1000), 1200) * np.sin(np.pi * t / 0.16) ** 2)
def s_fall(dur=0.9, seed=41):                  # something falling through the air
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k in range(0, n, 2400):
        f = 1200 - 900 * (k / n); m = min(2400, n - k); x[k:k + m] = bp(noise(m, seed + k), max(150, f * 0.6), f)
    return st(lp(x, 1800) * (t / dur) ** 1.5)
def s_applause(dur=4.4, seed=77, rate=260):    # a warm audience: many hand claps, filtered soft
    n = int(dur * SR); x = np.zeros((n, 2)); r = np.random.default_rng(seed); t = np.arange(n) / SR
    swell = np.minimum(1, t / 0.9) * np.minimum(1, (dur - t) / 1.2)
    for i in r.integers(0, n - 2000, int(dur * rate)):
        m = int(r.uniform(0.006, 0.014) * SR); c = bp(r.standard_normal(m), r.uniform(700, 1100), r.uniform(1800, 2600)) * np.exp(-np.arange(m) / (m / 4)) * r.uniform(0.3, 1)
        pan = r.uniform(-0.8, 0.8); x[i:i + m, 0] += c * np.sqrt((1 - pan) / 2); x[i:i + m, 1] += c * np.sqrt((1 + pan) / 2)
    return lp(x, 3800) * swell[:, None]

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))

for i, (k, why) in enumerate([('open1', 'the curtain rises'), ('close2', 'the curtain falls (intermission)'), ('open2', 'it rises on the night'), ('close3', 'it falls before the curtain call'), ('open3', 'it rises for the bows'), ('close4', 'it closes on the title')]):
    a, b = CU[k]; put(a, s_velvet(b - a + 0.2, 10 + i), -27, 'velvet curtain (synth)', why)
put(HK['glow'] - 0.4, s_swell(0.6, 20), -32, 'warm swell (synth)', 'one rose lights up')
put(PL['split'], s_rumble(), -25, 'thunder (synth)', 'the circle is split')
for k in range(int((CL['out'] - CL['t']) / 0.5)): put(CL['t'] + k * 0.5, s_tick(50 + k), -33, 'clock tick (synth)', 'four o\'clock is coming' if k == 0 else '')
for k in range(5): put(CL['sweep'] + k * (0.62 - k * 0.07), s_heart(), -31, 'heartbeat (synth)', 'happier the closer it gets' if k == 0 else '')
put(WH['t'], s_wind(3.4), -31, 'wind in the wheat (synth)', 'the colour of wheat')
for k in range(5): put(GE['l1'] + 0.2 + k * 0.33, s_flap(60 + k), -34, 'wing beat (synth)', 'two geese' if k == 0 else '')
put(GE['fall'], s_fall(0.9), -26, 'falling (synth)', 'the other one falls'); put(GE['fall'] + 0.9, s_thump(70, 40, 0.3), -27, 'soft impact (synth)', '')
for i, s in enumerate(MO['q']): put(s - 0.3, s_swell(0.35, 70 + i, 300, 2000), -34, 'soft whoosh (synth)', 'a cascade of answers' if i == 0 else '')
put(KI['bloom'], s_swell(1.2, 80, 200, 1500), -31, 'warm swell (synth)', 'Klimt\'s gold blooms')
for k in range(5): put(EN['a1'] + k * 0.5, s_tick(90 + k), -35, 'clock tick (synth)', 'the clock again' if k == 0 else '')
put(EN['roses'] - 0.3, s_swell(0.6, 95), -32, 'warm swell (synth)', 'the rose lights up again')
put(CA['applause'] - 0.6, s_applause(CA['title'] - CA['applause'] + 1.6), -18, 'applause (synth)', 'the curtain call')

SFX = lp(SFX, 6000)
ir = sc.ir
sfx_mix = SFX + 0.3 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 80, 'low', fs=SR, output='sos'), x, axis=0) + 0.12 * sosfilt(butter(1, 2500, 'high', fs=SR, output='sos'), x, axis=0)
x = lp(x, 12000)
fade = np.ones(N); f0 = int((DUR - 1.4) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m2 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m2)) ** 2; fr = np.fft.rfftfreq(len(m2), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'love_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'love_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 什么是爱 — cue sheet (generated by music/love.py)\n\nEvery time comes from src/love/love.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'love_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))

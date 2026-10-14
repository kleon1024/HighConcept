"""万圣节 · 人类为什么需要一个鬼节？ (80 s) — score and sound design, synced to src/halloween/halloween.json.
Run: python3 music/halloween.py → public/halloween_score.wav, out/halloween_sfx_only.wav, out/halloween_cues.md

One "ghost-lantern" motif in 6/8 (a bar every two seconds), written in the spirit of Saint-Saëns's *Danse macabre*
(1874, public domain; nothing is quoted): the call — a tritone, A up to E♭; the walk — a limping chromatic descent
G–F–E–E♭–D in long–short pairs; home — D up to G, left unresolved. It changes costume with every culture:
  Hook      — four low pizzicato Ds (midnight) and the violin's call as a match flares in a turnip.
  Samhain   — an Irish jig: fiddle, a low whistle, a bodhrán and a drone; a door in the hill opens on a low choir.
  Hallows   — one breath of church: a soft organ and the Dies irae (a 13th-century chant for the dead).
  Souling   — a parlour harpsichord and fiddle, knocks on the door on the beat.
  Guising   — a theremin-like wobble on the folk explanation ("so the ghosts won't know you") — a joke, flagged.
  Postcards — a cartoon: pizzicato, bassoon and wooden "bones" (low xylophone).
  Boom      — an ostinato that climbs and speeds up to the money, then a dead stop and a breath.
  Mexico    — son jarocho in G major: jarana strums, a requinto line, the harp; the dead are welcome here.
  中元      — 笙-like reed drone, 箫 bending the motif, 木鱼 and a low drum; water.
  お盆      — a fun scare (drum and the tritone), then a bon-odori: taiko, shamisen, a low flute.
  Lift      — the guest instruments each light one note, then the orchestra and choir; on 「怕鬼，其实是想念」 the
              tritone finally resolves (E♭→D, A→B) into G major.
"""
import json, os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, fftconvolve, sosfilt
import engine
from engine import SF2, Score, Synth
from mixutil import compress, jumps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'halloween', 'halloween.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); B = 1.0; E8 = B / 3          # a dotted-quarter beat is 1 s; an eighth is 1/3 s
HK, TH, SM, HL, SO, GU, CA, BO, MX, ZY, OB, LF = (J[k] for k in ('hook', 'thesis', 'samhain', 'hallows', 'souling', 'guising', 'cards', 'boom', 'mexico', 'zhongyuan', 'obon', 'lift'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

def v_drum(f, dur, vel, sr, rng):
    """A frame drum / taiko: a low skin that drops in pitch, with air."""
    n = int(1.0 * sr); t = np.arange(n) / sr; fr = f * (1 + 0.3 * np.exp(-t / 0.04))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.3) + 0.3 * lp(rng.standard_normal(n), 800, sr) * np.exp(-t / 0.04)
    y = np.tanh(1.3 * y * (1 - np.exp(-t / 0.002))); return np.stack([y, y], axis=1)
def v_muyu(f, dur, vel, sr, rng):
    n = int(0.2 * sr); t = np.arange(n) / sr
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.05) + 0.4 * np.sin(2 * np.pi * f * 1.62 * t) * np.exp(-t / 0.02) + 0.6 * bp(rng.standard_normal(n), 700, 2000, sr) * np.exp(-t / 0.006))
    y = lp(y * (1 - np.exp(-t / 0.0008)), 3000, sr); return np.stack([y, y], axis=1)
def v_theremin(f, dur, vel, sr, rng, glide=0.35):
    """A theremin-like voice: a near-sine with a wide, slow vibrato that scoops up into the note."""
    n_on, n = int(dur * sr), int((dur + 0.3) * sr); t = np.arange(n) / sr
    fr = f * (1 - 0.06 * np.exp(-t / glide)) * (1 + 0.012 * np.sin(2 * np.pi * 5.6 * t) * np.minimum(1, t / 0.3))
    ph = 2 * np.pi * np.cumsum(fr) / sr; y = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph)
    e = np.minimum(1, t / 0.12); e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.08 * sr))
    y = lp(y * e, 3000, sr); return np.stack([y, y * 0.96], axis=1)
engine.VOICES.update({'drum': v_drum, 'muyu': v_muyu, 'theremin': v_theremin})

PARTS = {
    'vln': SF2('ms', 40, level=-17, verb=0.5, lp=6000), 'fiddle': SF2('ms', 110, level=-17, verb=0.35, lp=6000), 'strS': SF2('ms', 49, level=-19, verb=0.55, lp=6000),
    'cello': SF2('ms', 42, level=-18, verb=0.45), 'cb': SF2('ms', 43, level=-20, verb=0.4), 'trem': SF2('ms', 44, level=-21, verb=0.5, lp=5000),
    'pizz': SF2('ms', 45, level=-18, verb=0.35), 'harp': SF2('ms', 46, level=-19, verb=0.5), 'timp': SF2('ms', 47, level=-19, verb=0.45),
    'bsn': SF2('ms', 70, level=-17, verb=0.35), 'flute': SF2('ms', 73, level=-19, verb=0.45, lp=5000), 'xylo': SF2('ms', 13, level=-21, verb=0.35, lp=4500),
    'hpsd': SF2('ms', 6, level=-19, verb=0.4, lp=6000), 'organ': SF2('ms', 19, level=-20, verb=0.6, lp=4000), 'reed': SF2('ms', 20, level=-21, verb=0.55, lp=3500),
    'choir': SF2('ms', 52, level=-19, verb=0.7), 'oohs': SF2('ms', 53, level=-20, verb=0.7),
    'guitar': SF2('ms', 24, level=-18, verb=0.35, lp=6000), 'xiao': SF2('ms', 75, level=-19, verb=0.55, lp=4000), 'shami': SF2('ms', 106, level=-19, verb=0.35, lp=5000),
    'drum': Synth('drum', level=-19, verb=0.4), 'muyu': Synth('muyu', level=-22, verb=0.4), 'theremin': Synth('theremin', level=-19, verb=0.6),
    'sub': Synth('sub', level=-24, verb=0.0, cap=100),
}
sc = Score(DUR, SR, seed=1031)
rng = np.random.default_rng(1031)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=72, h=0.0):
    for p in ps: note(part, s, d, p, v, h)
def tune(part, s, phrase, tr=0, v=80, legato=0.95, beat=B):
    for b, p, l in phrase: note(part, s + b * beat, l * beat * legato, p + tr, v)
def gliss(part, s, ps, step=0.04, v=70):
    for i, p in enumerate(ps): note(part, s + i * step, 0.4, p, v)

# the ghost-lantern motif (beats of one second): call · walk · home
CALL = [(0, 69, 1.0), (1, 75, 1.0)]
WALK = [(0, 67, 0.62), (2 / 3, 67, 0.3), (1, 65, 0.62), (5 / 3, 65, 0.3), (2, 64, 0.62), (8 / 3, 64, 0.3), (3, 63, 0.62), (11 / 3, 63, 0.3)]
HOME = [(0, 62, 1.0), (1, 67, 1.2)]
MOTIF = CALL + [(b + 2, p, l) for b, p, l in WALK] + [(b + 6, p, l) for b, p, l in HOME]
WALK_MAJ = [(b, {67: 67, 65: 66, 64: 64, 63: 62}[p], l) for b, p, l in WALK]       # in G major: G F♯ E D
Gm = (43, [55, 58, 62]); Dd = (38, [57, 62, 66]); Cm = (36, [55, 60, 63]); Eb = (39, [55, 58, 63]); G_ = (43, [55, 59, 62]); C_ = (36, [55, 60, 64]); D7 = (38, [54, 57, 60])
def jig(s, bars, chords, comp, bass='cb', v=60, bassv=70):
    for i in range(bars):
        r, tones = chords[i % len(chords)]; b0 = s + i * 2 * B
        for k in range(6):
            if k in (0, 3): note(bass, b0 + k * E8, E8 * 0.9, r, bassv - (8 if k == 3 else 0))
            else: chord(comp, b0 + k * E8, E8 * 0.7, tones, v - (8 if k in (2, 5) else 0))

# ═══ hook: midnight in four low Ds; the call as the match flares
for k in range(4): note('pizz', HK['strike'] + k * 2 * E8, 0.3, 38, 92 - k * 4); note('cb', HK['strike'] + k * 2 * E8, 0.3, 26, 70)
chord('trem', 0.0, HK['out'], [38, 50], 52)
tune('vln', HK['l2'], CALL, v=88); note('sub', 0.0, 1.4, 26, 70)
# ═══ thesis: the walk on a bare violin
tune('vln', TH['l1'] - 0.2, WALK + [(4, 62, 1.0)], v=84); chord('strS', TH['t'], TH['out'] - TH['t'], [43, 50, 55], 52)
note('pizz', TH['dive'], 0.3, 43, 80); note('timp', TH['dive'], 0.6, 43, 76)
# ═══ Samhain: an Irish jig
jig(SM['t'], 3, [Gm, Dd, Gm], comp='guitar', v=56, bassv=66)
for i in range(int((SM['out'] - SM['t']) / E8)): note('drum', SM['t'] + i * E8, 0.2, 50, 74 if i % 3 == 0 else 46)
tune('fiddle', SM['l1'], MOTIF, v=88); tune('flute', SM['l1'] + 2.0, WALK, tr=-12, v=60)
chord('cb', SM['t'], SM['out'] - SM['t'], [31, 38], 50)
gliss('harp', SM['door'], [86, 82, 79, 75, 74, 70, 67, 63, 62], 0.05, 62); chord('oohs', SM['door'], 3.0, [55, 62, 67], 64)
# ═══ All Hallows: a soft organ and the Dies irae
DIES = [65, 64, 65, 62, 64, 60, 62, 62]
chord('organ', HL['t'], HL['out'] - HL['t'], [38, 50, 57], 54)
for i, p in enumerate(DIES): note('organ', HL['l1'] + i * 0.5, 0.48, p, 66); note('oohs', HL['l1'] + i * 0.5, 0.48, p - 12, 58)
for s in HL['cal']: note('pizz', s, 0.2, 74, 60)
note('bsn', HL['squash'], 0.25, 50, 82); note('bsn', HL['squash'] + 0.3, 0.6, 43, 80)
# ═══ souling: harpsichord and fiddle, knocks on the beat
jig(SO['t'], 3, [Gm, Cm, Dd], comp='hpsd', bass='cello', v=60, bassv=62)
SOUL = [(0, 67, 0.5), (0.5, 67, 0.5), (1, 69, 0.5), (1.5, 70, 0.5), (2, 70, 0.5), (2.5, 69, 0.5), (3, 67, 1.0)]
tune('fiddle', SO['l1'], SOUL, v=80); tune('fiddle', SO['l2'], SOUL, tr=2, v=82)
# ═══ guising: the parlour waltz, and a theremin on the folk explanation
jig(GU['t'], 3, [Gm, Eb, Dd], comp='hpsd', bass='cello', v=58, bassv=60)
tune('vln', GU['l1'], WALK, v=76)
note('theremin', GU['gag'], 1.2, 69, 84); note('theremin', GU['gag'] + 1.3, 1.4, 75, 84)
# ═══ postcards: a cartoon
jig(CA['t'], 3, [Gm, Dd, Gm], comp='pizz', bass='cb', v=58, bassv=66)
tune('bsn', CA['l1'], MOTIF, v=88, legato=0.6)
for i in range(int((CA['out'] - CA['fly']) / E8)): note('xylo', CA['fly'] + i * E8, 0.15, [55, 58, 62, 67, 62, 58][i % 6], 58)
# ═══ the boom: a climbing, speeding ostinato, then a dead stop
s = BO['l1']; k = 0
while s < BO['stop'] - 0.05:
    p = [43, 46, 50, 53, 55, 58][k % 6] + 2 * (k // 6)
    note('bsn', s, 0.12, p, 70 + min(30, k)); note('pizz', s, 0.12, p + 12, 62 + min(30, k)); note('xylo', s, 0.1, p + 24, 50 + min(20, k))
    s += max(0.09, E8 * 0.95 ** k); k += 1
chord('strS', BO['count'], BO['stop'] - BO['count'], [43, 50, 55, 62, 67], 76); note('timp', BO['stop'] - 0.4, 0.4, 43, 96)
# ═══ Mexico: son jarocho in G major
for i in range(int((MX['out'] - MX['t']) / E8)):
    r, tones = [G_, C_, D7, G_][(i // 6) % 4]; b0 = MX['t'] + i * E8
    for j, p in enumerate(tones + [tones[0] + 12]): note('guitar', b0 + j * 0.012, E8 * 0.6, p, 66 if i % 3 == 0 else 50)
    if i % 3 == 0: note('harp', b0, 0.5, r, 74)
tune('guitar', MX['l1'], [(b, p + 12, l) for b, p, l in CALL[:1] + [(b + 1, p, l) for b, p, l in WALK_MAJ] + [(5, 62, 1.0), (6, 67, 1.5)]], v=86)
gliss('harp', MX['l3'], [55, 59, 62, 67, 71, 74, 79], 0.06, 70); chord('strS', MX['l3'], MX['out'] - MX['l3'], [43, 55, 59, 62, 67], 70)
# ═══ 中元: reed drone, 箫 bending the motif, 木鱼, a low drum
chord('reed', ZY['t'], ZY['out'] - ZY['t'], [43, 50, 57], 54); note('drum', ZY['t'], 0.8, 40, 90)
for i in range(int((ZY['out'] - ZY['t']) / B)): note('muyu', ZY['t'] + i * B, 0.1, 64, 70)
tune('xiao', ZY['l1'], [(0, 67, 1.5), (1.5, 65, 0.5), (2, 63, 1.0), (3, 62, 2.0)], v=80)
tune('xiao', ZY['l2'], [(0, 70, 1.0), (1, 67, 1.0), (2, 65, 1.0), (3, 62, 2.2)], v=78)
# ═══ お盆: a fun scare, then a bon-odori
note('drum', OB['scare'], 0.8, 36, 120); chord('strS', OB['scare'], 0.7, [57, 63], 96); note('sub', OB['scare'], 1.0, 24, 96)
chord('trem', OB['scare'] + 0.5, OB['l1'] - OB['scare'] - 0.4, [50, 51], 50); note('cb', OB['scare'] + 0.5, OB['l1'] - OB['scare'], 26, 56)
def ob(part, s_, d, p, v):
    if s_ < OB['out'] + 0.3: note(part, s_, d, p, v)
for bar in range(4):
    b0 = OB['l1'] - 0.6 + bar * 2 * B; g = min(1.0, 0.7 + 0.15 * bar)        # the dance comes in softly and grows
    for o_, v_ in ((0, 92), (E8, 70), (3 * E8, 88), (5 * E8, 60)): ob('drum', b0 + o_, 0.3, 45, v_ * g)
    for j in range(6): ob('shami', b0 + j * E8, 0.2, [55, 62, 67, 62, 58, 62][j], 62 * g)
tune('flute', OB['l1'] + 0.5, WALK, tr=-12, v=74)
# ═══ the lift: one note from each guest, then everyone; the call resolves into G major
for i, (s, part, p) in enumerate(zip(LF['lit'], ['fiddle', 'bsn', 'guitar', 'xiao', 'flute'], [69, 67, 66, 64, 62])): note(part, s, 0.9, p, 80)
chord('strS', LF['t'], LF['l3'] - LF['t'], [43, 50, 55, 58, 62], 62); chord('oohs', LF['l1'], LF['l3'] - LF['l1'], [55, 58, 62], 60)
note('vln', LF['l1'], 1.0, 69, 82); note('vln', LF['l1'] + 1.0, 1.4, 75, 82)                       # 这些“鬼”，是谁？ — the call, unresolved
tune('vln', LF['l2'], [(0, 67, 0.62), (2 / 3, 67, 0.3), (1, 66, 0.62), (5 / 3, 66, 0.3), (2, 64, 1.0)], v=84)
r0 = LF['l3']
chord('strS', r0, 3.0, [31, 43, 50, 55, 59, 62, 67, 71], 90); chord('choir', r0, 3.0, [55, 59, 62, 67], 82); chord('organ', r0, 3.2, [43, 55, 59, 62], 66)
note('vln', r0, 2.4, 74, 90); note('vln', r0, 2.4, 71, 84)                                          # E♭→D and A→B: the tritone resolves
note('timp', r0, 0.8, 43, 100); note('sub', r0, 2.0, 31, 90); gliss('harp', r0 - 0.3, [55, 59, 62, 67, 71, 74, 79, 83], 0.035, 70)
note('xiao', LF['title'] + 0.2, 1.8, 74, 66); note('fiddle', LF['title'] + 0.4, 1.8, 71, 60); chord('strS', LF['title'], 2.2, [43, 55, 62, 67, 71], 60)

for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i
# the boom stops dead: cut everything that would ring past the stop, and leave a breath
for part, evs in sc.ev.items():
    sc.ev[part] = [(s, min(d, max(0.03, BO['stop'] - s)) if s < BO['stop'] < s + d else d, p, v) for s, d, p, v in evs if not (BO['stop'] <= s < BO['out'])]
music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: one flame, knocks, paper, water, fire
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def s_flame(seed=1):                              # a match struck and a flame catching: a scratch, then a soft "whoomp"
    n = int(0.9 * SR); t = np.arange(n) / SR
    scratch = bp(noise(n, seed), 1500, 4500) * env(n, 0.002, 0.04)
    whoomp = lp(noise(n, seed + 1), 600) * np.exp(-((t - 0.12) / 0.12) ** 2) * 1.5 + lp(noise(n, seed + 2), 1800) * env(n, 0.1, 0.4) * 0.4
    return st(lp(0.35 * scratch + whoomp, 5000))
def s_knock():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return st(lp(np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.03) + 0.4 * bp(noise(n, 3), 300, 1500) * np.exp(-t / 0.01), 2500))
def s_paper(dur=0.35, seed=5):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 800, 4000), 4500) * np.sin(np.pi * t / dur) ** 0.6)
def s_riffle(dur=1.2, seed=7):                    # a deck of postcards flicked
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in np.linspace(0, n - 4000, 14).astype(int): m = 2400; x[i:i + m] += bp(r.standard_normal(m), 900, 4000) * np.exp(-np.arange(m) / 500)
    return st(lp(x, 4500))
def s_water(dur=6.0, seed=9):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.stack([lp(bp(noise(n, seed + c), 150, 1400), 1500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t + c)) ** 2 * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8) for c in range(2)], axis=1)
def s_fire(dur=4.0, seed=11):
    n = int(dur * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); cr = np.zeros(n)
    for i in r.integers(0, n - 500, int(dur * 25)): cr[i:i + 300] += r.uniform(0.3, 1) * np.exp(-np.arange(300) / 40)
    return st(lp(0.6 * lp(noise(n, seed), 400) + bp(cr, 800, 3000), 4000) * np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.8))
def s_wind(dur=4.0, seed=13):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 200, 1200), 1300) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * t)) * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8))
def s_door(seed=15):                              # a heavy door (a hill opening): a low creak
    n = int(1.2 * SR); t = np.arange(n) / SR; f = 90 + 40 * t
    y = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.random.default_rng(seed).random(n)), 700) * np.sin(np.pi * t / 1.2)
    return st(y)

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
put(HK['strike'], s_flame(1), -22, 'match and flame (synth)', 'frame 1: a flame inside the turnip')
put(0.0, s_wind(HK['out'] + TH['out'] - HK['t'], 13), -32, 'night wind (synth)', '')
put(SM['door'], s_door(15), -26, 'the hill door creaks (synth)', 'the door in the hill opens')
for i, s in enumerate(HL['cal']): put(s, s_paper(0.3, 20 + i), -28, 'calendar leaf (synth)', 'the calendar turns' if i == 0 else '')
for i, s in enumerate(SO['knock']): put(s, s_knock(), -24, 'knock (synth)', 'knocking for soul cakes' if i == 0 else '')
put(CA['fly'], s_riffle(1.2, 7), -28, 'postcards riffled (synth)', 'the postcards fly in')
for i in range(3): put(BO['knock'] + i * 0.25, s_knock(), -24, 'knock (synth)', 'trick or treat' if i == 0 else '')
put(MX['l2'], s_flame(31), -27, 'candles lit (synth)', 'the ofrenda candles')
put(ZY['t'], s_water(ZY['out'] - ZY['t'], 9), -28, 'river water (synth)', 'lanterns on the river')
put(OB['fires'], s_fire(OB['out'] - OB['fires'], 11), -28, 'bonfire (synth)', 'the send-off fires')
for i, s in enumerate(LF['lit']): put(s - 0.05, s_flame(40 + i), -27, 'flame (synth)', 'every lantern lights' if i == 0 else '')

SFX = lp(SFX, 6000)
ir = sc.ir
sfx_mix = SFX + 0.3 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 80, 'low', fs=SR, output='sos'), x, axis=0) + 0.08 * sosfilt(butter(1, 2500, 'high', fs=SR, output='sos'), x, axis=0)
x = lp(x, 11000)
fade = np.ones(N); f0 = int((DUR - 1.2) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m2 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m2)) ** 2; fr = np.fft.rfftfreq(len(m2), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'halloween_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'halloween_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 万圣节 — cue sheet (generated by music/halloween.py)\n\nEvery time comes from src/halloween/halloween.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'halloween_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')

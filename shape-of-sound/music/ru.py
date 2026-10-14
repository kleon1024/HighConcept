"""儒 · 一个人，成不了“仁” (86 s) — score and sound design, synced to src/ru/ru.json.
Run: python3 music/ru.py → public/ru_score.wav, out/ru_sfx_only.wav, out/ru_cues.md

The ritual music of the Confucian temple (雅乐 / 释奠乐), built the way the film argues: one voice is not enough.
  · The theme is four notes, one per "character", like the four-character lines of the temple hymns. The 埙 (clay
    flute) plays it alone and stops on an unresolved note; the 古琴 answers with the missing one. 人 + 二.
  · 金声玉振 (孟子 on Confucius): each act opens on a deep bronze bell (镈钟) and closes on a stone chime (特磬).
  · The eight materials of the 八音 join one by one like ripples spreading — clay (埙), silk (琴), gourd (笙),
    skin (搏拊, 建鼓), bamboo (篪), metal (钟), stone (磬), wood (柷 to begin, 敔 to end) — and sound together, 和而不同,
    under 「四海之内，皆兄弟也」.
  · Every bell of the Marquis Yi set sounds two notes a third apart. Ours strike minor thirds all through and a
    major third on the last line: 「你从来不是一个人」.
Everything is low and soft: bells low-passed, no bright upper bells or chime runs, no presence boost.
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
J = json.load(open(os.path.join(ROOT, 'src', 'ru', 'ru.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); BEAT = 0.5
HK, ER, AS, LV, RL, ST, RP, VS, TR, GT, BL, EN = (J[k] for k in ('hook', 'er', 'ask', 'love', 'rule', 'stone', 'ripple', 'vessel', 'travel', 'gate', 'bells', 'end'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

def v_bell(f, dur, vel, sr, rng, third=3):
    """镈钟 / 甬钟: a deep bronze bell that sounds two notes a third apart (struck at the centre and the side), with slow
    beating partials, everything above ~2.2 kHz rolled off."""
    n = int(6.0 * sr); t = np.arange(n) / sr; y = np.zeros(n)
    for base, g in ((f, 1.0), (f * 2 ** (third / 12), 0.6)):
        for r, a, d in ((1.0, 1.0, 3.6), (2.0, 0.42, 2.0), (2.76, 0.22, 1.2), (3.9, 0.1, 0.7), (0.5, 0.3, 4.5)):
            y += g * a * 0.5 * (np.sin(2 * np.pi * base * r * t) + np.sin(2 * np.pi * (base * r + 0.4) * t)) * np.exp(-t / d)
    y += 0.4 * lp(rng.standard_normal(n), 500, sr) * np.exp(-t / 0.03)
    y = lp(y * (1 - np.exp(-t / 0.003)), 2200, sr); return np.stack([y, y * 0.98], axis=1)
def v_qing(f, dur, vel, sr, rng):
    """特磬: a large stone chime — a short, woody-glassy strike with inharmonic partials, low-passed."""
    n = int(1.6 * sr); t = np.arange(n) / sr
    y = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for r, a, d in ((1.0, 1.0, 0.7), (2.71, 0.5, 0.35), (5.2, 0.2, 0.15), (0.62, 0.35, 0.5)))
    y = lp((y + 0.3 * bp(rng.standard_normal(n), 400, 2500, sr) * np.exp(-t / 0.01)) * (1 - np.exp(-t / 0.001)), 3000, sr); return np.stack([y, y], axis=1)
def v_xun(f, dur, vel, sr, rng):
    """埙: a clay vessel flute — hollow, breathy, nearly pure, swelling in."""
    n_on, n = int(dur * sr), int((dur + 0.4) * sr); t = np.arange(n) / sr
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 4.6 * t) * np.minimum(1, t / 0.6)) * (1 - 0.02 * np.exp(-t / 0.08))) / sr
    y = np.sin(ph) + 0.12 * np.sin(3 * ph) + 0.05 * np.sin(2 * ph) + 0.18 * bp(rng.standard_normal(n), f * 0.8, f * 2.5, sr)
    e = np.minimum(1, t / 0.18) ** 1.5; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.12 * sr))
    y = lp(y * e, 2200, sr); return np.stack([y, y * 0.97], axis=1)
def v_qin(f, dur, vel, sr, rng, decay=0.9975):
    """古琴: a plucked silk string (Karplus–Strong) with a warm body."""
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.8) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), 1800, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); t = np.arange(n) / sr
    y = y / (np.abs(y).max() + 1e-9) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.4 * sr))
    y = lp(y, 2600, sr); return np.stack([y, y], axis=1)
def v_sheng(f, dur, vel, sr, rng):
    """笙: a free-reed mouth organ — a reedy tone that breathes in and out, slightly beating."""
    n_on, n = int(dur * sr), int((dur + 0.5) * sr); t = np.arange(n) / sr
    y = sum((1 / k ** 1.2) * np.sin(2 * np.pi * f * k * t * (1 + 0.0015 * (k % 2)) + k) for k in range(1, 9))
    e = np.minimum(1, t / 0.35) ** 1.3 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)); e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.2 * sr))
    y = lp(y * e, 2800, sr); return np.stack([y, y * 0.96], axis=1)
def v_drum(f, dur, vel, sr, rng, soft=False):
    """建鼓 (deep) / 搏拊 (soft=True: a small leather drum stuffed with bran, beaten by hand — a muffled thud)."""
    n = int((0.4 if soft else 1.4) * sr); t = np.arange(n) / sr; fr = f * (1 + 0.3 * np.exp(-t / 0.04))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / (0.08 if soft else 0.45)) + 0.3 * lp(rng.standard_normal(n), 600 if soft else 800, sr) * np.exp(-t / 0.03)
    y = np.tanh(1.2 * y * (1 - np.exp(-t / 0.002))); return np.stack([y, y], axis=1)
def v_zhu(f, dur, vel, sr, rng):
    """柷: a wooden box struck inside with a pestle — a dull, hollow thump."""
    n = int(0.4 * sr); t = np.arange(n) / sr
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.07) + 0.6 * bp(rng.standard_normal(n), 150, 900, sr) * np.exp(-t / 0.02)
    y = lp(y * (1 - np.exp(-t / 0.001)), 1500, sr); return np.stack([y, y], axis=1)
engine.VOICES.update({'bell': v_bell, 'bellM': lambda *a, **k: v_bell(*a, third=4, **k), 'qing': v_qing, 'xun': v_xun, 'qin': v_qin, 'sheng': v_sheng,
                      'drum': v_drum, 'bofu': lambda *a, **k: v_drum(*a, soft=True, **k), 'zhu': v_zhu})

PARTS = {
    'bell': Synth('bell', level=-19, verb=0.6), 'bellM': Synth('bellM', level=-19, verb=0.6), 'qing': Synth('qing', level=-22, verb=0.55),
    'xun': Synth('xun', level=-18, verb=0.55), 'qin': Synth('qin', level=-17, verb=0.45), 'sheng': Synth('sheng', level=-23, verb=0.5),
    'drum': Synth('drum', level=-20, verb=0.45), 'bofu': Synth('bofu', level=-23, verb=0.35), 'zhu': Synth('zhu', level=-21, verb=0.4),
    'chi': SF2('ms', 73, level=-20, verb=0.5, lp=3500), 'chant': SF2('ms', 53, level=-23, verb=0.65, lp=3000), 'sub': Synth('sub', level=-27, verb=0.0, cap=90),
}
sc = Score(DUR, SR, seed=551)
rng = np.random.default_rng(551)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=70):
    for p in ps: note(part, s, d, p, v, 0)
def tune(part, s, notes, step=1.0, v=80, tr=0, legato=0.92):
    for i, p in enumerate(notes):
        if p is not None: note(part, s + i * step, step * legato, p + tr, v)

# G 宫 pentatonic. The 埙's line stops on A (unresolved); the 琴 answers G — two voices finish one phrase.
LINE = [74, 76, 71, 69]; ANSWER = 67
GONG = [43, 50, 55, 59, 62]
def jinsheng(s, p=31, v=96, major=False): note('bellM' if major else 'bell', s, 4.0, p, v); note('sub', s, 2.0, p - 12 + 12, 60)
def yuzhen(s, p=55, v=84): note('qing', s, 1.0, p, v)

# ═══ hook: the 柷 starts the music; one bell; one voice alone
note('zhu', HK['carve'], 0.3, 45, 100); jinsheng(HK['carve'] + 0.35)
note('xun', HK['l2'], 2.2, 62, 70)
chord('sheng', HK['carve'] + 0.6, AS['t'] + 0.6 - HK['carve'] - 0.6, [43, 50, 55], 60)   # a low 笙 bed under the opening, so the 琴's answer doesn't jump out of silence
# ═══ 仁 = 人 + 二: the 埙 alone plays the line and stops short
tune('xun', ER['l1'], LINE, v=82); note('chi', ER['bamboo'], 2.3, 74, 56)
# ═══ the students ask: the 琴 answers with the missing note; five answers, five different notes
note('qin', AS['t'] + 0.2, 2.0, ANSWER, 80); note('qin', AS['t'] + 0.2, 2.0, ANSWER - 12, 62)
for i, s in enumerate(AS['cascade']): note('qin', s, 0.9, [62, 64, 67, 69, 71][i], 76)
chord('sheng', AS['l2'], AS['out'] - AS['l2'] + 0.5, [55, 62, 67], 50)
# ═══ 爱人 / 知人: 埙 and 琴 together, the phrase complete; a soft hand drum
for b in range(int((LV['out'] - LV['t']) / 2.0)): note('bofu', LV['t'] + b * 2.0, 0.2, 52, 74)
tune('xun', LV['l1'], LINE + [ANSWER], v=80); tune('qin', LV['l1'], [p - 12 for p in LINE] + [ANSWER - 12], v=72)
tune('xun', LV['l3'], [74, 71, 69, 67], v=76); chord('sheng', LV['t'], LV['out'] - LV['t'], [43, 55, 62], 46)
# ═══ the golden rule, carved; act I closes on the stone
yuzhen(RL['carve'], 60, 70); tune('chi', RL['carve'] + 0.4, [74, 72, 71, 69, 67], step=0.9, v=60); tune('qin', RL['carve'] + 0.4, [55, 57, 59, 62, 55], step=0.9, v=70)
chord('sheng', RL['carve'], RL['fall'] - RL['carve'] + 0.3, [43, 50, 55, 59], 50)
yuzhen(RL['fall'], 55, 84); jinsheng(RL['fall'] + 0.15, 31, 80)
# ═══ the stone drops into water: the deep drum, the 笙 swells, the line again
note('drum', ST['drop'], 1.2, 38, 94); chord('sheng', ST['drop'], 3.6, [43, 50, 55, 62, 67], 60)
tune('xun', ST['l1'], LINE + [ANSWER], v=80); tune('qin', ST['l2'], [62, 64, 67, 71, 74], step=0.5, v=66)
chord('sheng', ST['drop'] + 3.4, RP['rings'][0] - ST['drop'] - 3.2, [43, 55, 62], 46)   # the water stays still: hold the 笙 until the first ring
# ═══ ripples: each ring a drum and a wider chord (one note more each time), two events a bar
for i, s in enumerate(RP['rings']):
    note('drum', s, 0.8, 40 - i, 80 - i * 4); chord('sheng', s, 0.85 if i < 3 else VS['t'] + 0.4 - s, [43, 50, 55, 59, 62, 67][:2 + i], 54 + i * 3)
for k in range(int((RP['out'] - RP['t']) / 1.0)): note('bofu', RP['t'] + k * 1.0, 0.2, 52, 60)
tune('chi', RP['l2'], [67, 69, 71, 74, 76], step=0.8, v=56)
# ═══ the vessel and the family: a bell, then warmth
jinsheng(VS['t'], 33, 84); tune('qin', VS['family'], [55, 59, 62, 64, 62, 59, 55], step=0.55, v=74)
tune('xun', VS['l2'], [74, 76, 74, 71, 69, 67], step=0.8, v=78); chord('sheng', VS['family'], VS['out'] - VS['family'], [43, 50, 55, 59, 62], 50)
# ═══ the journey: a light bamboo line; a wry little qin "laugh" on 「然哉！然哉！」
for k in range(int((TR['out'] - TR['t']) / 1.0)): note('bofu', TR['t'] + k * 1.0, 0.2, 54, 56 + (k % 2) * 8)
tune('chi', TR['l1'], [67, 69, 71, 74, 71, 69, 67, 64], step=0.5, v=62); chord('sheng', TR['t'], GT['t'] + 0.4 - TR['t'], [43, 50, 55], 44)
tune('xun', TR['l2'], [67, 69, 71, 69], step=0.9, v=64)   # the road goes on: the 埙 hums along
for i in range(4): note('qin', TR['l3'] + 0.2 + i * 0.22, 0.25, [74, 71, 74, 71][i], 72)
# ═══ the gate and the school: events four to a bar, rings fill with pupils
for k in range(int((GT['out'] - GT['t']) / 0.5)): note('bofu', GT['t'] + k * 0.5, 0.15, 52, 50 + (12 if k % 4 == 0 else 0))
tune('xun', GT['l1'], LINE + [ANSWER], v=78); chord('sheng', GT['pupils'], GT['out'] - GT['pupils'], [43, 50, 55, 59, 62, 67, 71], 56)
for i in range(8): note('qin', GT['pupils'] + i * 0.4, 0.5, [55, 59, 62, 67, 71, 74, 79, 74][i], 62)
# ═══ the bells: all eight materials together; the bell's third turns from minor to major
for i, s in enumerate(BL['strike']):
    note('bellM' if s >= BL['major'] else 'bell', s, 3.0, [31, 36, 38, 31, 36, 38, 31][i], 88)
chord('sheng', BL['t'], BL['out'] - BL['t'], [43, 50, 55, 59, 62, 67], 62); note('drum', BL['t'], 1.2, 38, 96)
tune('chant', BL['l1'], [62, 64, 59, 57, 55], step=1.2, v=66); tune('xun', BL['l1'], [74, 76, 71, 69, 67], step=1.2, v=76)
tune('qin', BL['l1'], [50, 52, 47, 45, 43], step=1.2, v=74); tune('chi', BL['l1'] + 0.6, [79, 76, 74, 71], step=1.2, v=52)
for k in range(int((BL['out'] - BL['t']) / 1.0)): note('bofu', BL['t'] + k * 1.0, 0.2, 52, 66)
yuzhen(BL['out'] - 0.2, 55, 80)
# ═══ the ending: the rhythm broadens back to one; the line whole; a major-third bell; the stone; silence; the 敔
chord('sheng', EN['t'], EN['title'] - EN['t'], [43, 50, 55, 62], 48)
tune('xun', EN['l1'], LINE + [ANSWER], step=1.1, v=78); tune('qin', EN['l1'], [p - 12 for p in LINE] + [ANSWER - 12], step=1.1, v=70)
jinsheng(EN['l2'], 31, 92, major=True); note('qin', EN['l2'] + 0.3, 2.4, 67, 80); note('qin', EN['l2'] + 0.3, 2.4, 71, 70)
yuzhen(EN['title'], 55, 88)

for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i
music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: carving in stone, a stone into water, a cart, brush and paper; the 敔 to close
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_chisel(n_hits=5, seed=1, gap=0.18):        # a chisel cutting a stroke into stone: soft taps and grit
    L = int((n_hits * gap + 0.3) * SR); x = np.zeros(L); r = np.random.default_rng(seed)
    for k in range(n_hits):
        i = int(k * gap * SR); m = int(0.06 * SR); tt = np.arange(m) / SR
        x[i:i + m] += (np.sin(2 * np.pi * r.uniform(900, 1300) * tt) * np.exp(-tt / 0.006) + 0.6 * bp(r.standard_normal(m), 1500, 4000) * np.exp(-tt / 0.01))
    return st(lp(x, 4000))
def s_splash(seed=3):                            # a stone into still water
    n = int(1.4 * SR); t = np.arange(n) / SR
    plop = np.sin(2 * np.pi * np.cumsum(300 + 900 * np.exp(-t / 0.03)) / SR) * np.exp(-t / 0.05)
    return st(lp(0.7 * plop + bp(noise(n, seed), 300, 2500) * np.exp(-t / 0.25) * 0.6, 3000))
def s_water(dur=6.0, seed=5):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.stack([lp(bp(noise(n, seed + c), 150, 1200), 1300) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.3 * t + c)) ** 2 * np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.8) for c in range(2)], axis=1)
def s_cart(dur=4.0, seed=7):                     # a wooden cart on a dirt road: a slow creak and rumble
    n = int(dur * SR); t = np.arange(n) / SR; f = 80 + 20 * np.sin(2 * np.pi * 0.7 * t)
    y = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.2 + lp(noise(n, seed), 300), 900) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 0.7 * t)))
    return st(y * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.8))
def s_yu(seed=9):                                # 敔: the tiger's serrated back scraped with a split bamboo, three times, softly
    L = int(1.5 * SR); x = np.zeros(L); r = np.random.default_rng(seed)
    for k in range(3):
        i0 = int(k * 0.45 * SR); m = int(0.32 * SR); tt = np.arange(m) / SR
        teeth = (np.sin(2 * np.pi * 38 * tt) > 0.6).astype(float)
        x[i0:i0 + m] += lp(bp(r.standard_normal(m), 300, 2000) * (0.3 + teeth), 2200) * np.sin(np.pi * tt / 0.32)
    return st(x)
def s_brush(dur=0.8, seed=11):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 500, 3000), 3200) * np.sin(np.pi * t / dur) ** 0.8)

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
put(HK['carve'] + 0.05, s_chisel(6, 1), -27, 'chisel in stone (synth)', 'frame 1: 亻 is carved')
put(ER['slide'], s_brush(0.6, 13), -29, 'stone dust (synth)', 'the two strokes slide in')
put(RL['carve'], s_chisel(10, 2, 0.22), -29, 'chisel in stone (synth)', 'the golden rule is carved')
put(ST['drop'], s_splash(3), -24, 'stone into water (synth)', 'the stone drops')
put(ST['drop'] + 0.6, s_water(RP['out'] - ST['drop'] - 0.6, 5), -32, 'still water (synth)', '')
put(TR['t'], s_cart(TR['out'] - TR['t'], 7), -30, 'cart on the road (synth)', 'fourteen years on the road')
put(EN['title'] + 1.6, s_yu(9), -30, '敔 scraped (synth)', 'the music ends')

SFX = lp(SFX, 5000)
ir = sc.ir
sfx_mix = SFX + 0.35 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 70, 'low', fs=SR, output='sos'), x, axis=0)
x = lp(x, 9000)
fade = np.ones(N); f0 = int((DUR - 0.8) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m2 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m2)) ** 2; fr = np.fft.rfftfreq(len(m2), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'ru_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'ru_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 儒 — cue sheet (generated by music/ru.py)\n\nEvery time comes from src/ru/ru.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'ru_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')

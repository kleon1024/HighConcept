"""佛 · 第二支箭 (90 s) — score and sound design, synced to src/buddha/buddha.json.
Run: python3 music/buddha.py → public/buddha_score.wav, out/buddha_sfx_only.wav, out/buddha_cues.md

A temple, not a world-music tour. Every sound comes from a Chinese Buddhist hall:
  诵经 — a chorus of monks reciting on one tone, one syllable per stroke of the 木鱼 (formant-synthesised voices);
  木鱼 — the hollow wooden fish that keeps the chant's pulse; 大鼓 — the temple drum; 梵钟 — a deep bronze bell,
  struck only three times (佛, 空, and the far shore), low and muffled; 古琴 — a low plucked string for the leitmotif;
  箫 / 尺八 — a low bamboo flute; underneath, monks humming and low strings.
Nothing bright: no plucked koto or sitar, no harp runs, no presence boost; the effects are low-passed.
Leitmotif: A–D–C–A on the qin (the arrow: up a fourth, falling back), answered at the end by A–D–E–F♯ on the 箫.
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
J = json.load(open(os.path.join(ROOT, 'src', 'buddha', 'buddha.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
HK, TI, DO, FX, SE, NT, HT, DM, SX, AB, CN, EN = (J[k] for k in ('hook', 'title', 'doctor', 'flux', 'self', 'net', 'heart', 'diamond', 'six', 'abide', 'chan', 'end'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

# ═══ the temple's instruments
VOWELS = {'a': [(730, 90, 1.0), (1090, 110, 0.45), (2440, 170, 0.12)], 'o': [(570, 80, 1.0), (840, 100, 0.5), (2410, 160, 0.1)],
          'u': [(300, 70, 1.0), (870, 100, 0.3), (2240, 160, 0.06)], 'e': [(530, 80, 1.0), (1840, 120, 0.3), (2480, 170, 0.1)],
          'm': [(260, 60, 1.0), (900, 120, 0.12), (2200, 200, 0.03)]}
def v_monk(f, dur, vel, sr, rng, vowel=None, breath=0.03):
    """One chanted syllable from a male voice: a glottal buzz shaped by three formants, a small scoop into the tone."""
    n_on, n = int(dur * sr), int((dur + 0.14) * sr); t = np.arange(n) / sr
    vib = 1 + 0.005 * np.sin(2 * np.pi * (5.0 + rng.uniform(-0.4, 0.4)) * t + rng.uniform(0, 6)) + 0.002 * np.sin(2 * np.pi * 0.7 * t)
    ph = 2 * np.pi * np.cumsum(f * vib * (1 - 0.025 * np.exp(-t / 0.05))) / sr
    K = int(min(36, 3600 / f)); src = sum(np.sin(k * ph) / k for k in range(1, K + 1)) + breath * rng.standard_normal(n)
    vw = VOWELS[vowel or rng.choice(['a', 'o', 'u', 'a', 'o', 'e'])]
    y = sum(a * bp(src, fc - bw, fc + bw, sr) for fc, bw, a in vw)
    e = np.ones(n); na = int(0.045 * sr); e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    e[n_on:] = np.exp(-np.arange(n - n_on) / (0.05 * sr)); y = lp(y * e, 3200, sr)
    return np.stack([y, y * 0.96], axis=1)
def v_qin(f, dur, vel, sr, rng, decay=0.9975):
    """A low plucked silk string (Karplus–Strong through a soft loop filter) with a warm body: the guqin's colour."""
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.6) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), 1800, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); t = np.arange(n) / sr
    y = y / (np.abs(y).max() + 1e-9) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.35 * sr))
    y = lp(y, 2600, sr); return np.stack([y, y], axis=1)
def v_muyu(f, dur, vel, sr, rng):
    """木鱼: a hollow wooden knock, round and short, no ring."""
    n = int(0.22 * sr); t = np.arange(n) / sr; f = f * rng.uniform(0.985, 1.015)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.05) + 0.45 * np.sin(2 * np.pi * f * 1.62 * t) * np.exp(-t / 0.025)
         + 0.6 * np.sin(2 * np.pi * f * 0.5 * t) * np.exp(-t / 0.035) + 0.7 * bp(rng.standard_normal(n), 700, 2000, sr) * np.exp(-t / 0.006))
    y = lp(y * (1 - np.exp(-t / 0.0008)), 3000, sr); return np.stack([y, y], axis=1)
def v_gu(f, dur, vel, sr, rng):
    """大鼓: a big temple drum — a low membrane that drops in pitch, with skin and air around it."""
    n = int(1.6 * sr); t = np.arange(n) / sr; fr = f * (1 + 0.35 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.55) + 0.3 * np.sin(2 * np.pi * np.cumsum(fr * 2.3) / sr) * np.exp(-t / 0.18)
    y = np.tanh(1.3 * (y + 0.35 * lp(rng.standard_normal(n), 700, sr) * np.exp(-t / 0.08)) * (1 - np.exp(-t / 0.002)))
    return np.stack([y, y], axis=1)
def v_zhong(f, dur, vel, sr, rng):
    """梵钟: a deep bronze temple bell struck by a wooden beam — low partials beating slowly, nothing above 1.8 kHz."""
    n = int(7.5 * sr); t = np.arange(n) / sr; y = np.zeros(n)
    for r, a, d in ((0.5, 0.55, 7.0), (1.0, 1.0, 5.5), (1.19, 0.32, 3.8), (1.5, 0.28, 3.2), (2.0, 0.36, 2.6), (2.53, 0.16, 1.8), (2.98, 0.12, 1.4), (4.07, 0.06, 0.9)):
        y += a * (np.sin(2 * np.pi * f * r * t) + np.sin(2 * np.pi * (f * r + 0.35) * t)) * 0.5 * np.exp(-t / d)
    y += 0.5 * np.sin(2 * np.pi * f * 0.8 * t) * np.exp(-t / 0.06) + 0.2 * lp(rng.standard_normal(n), 500, sr) * np.exp(-t / 0.03)
    y = lp(y * (1 - np.exp(-t / 0.004)), 1800, sr); return np.stack([y, y * 0.98], axis=1)
engine.VOICES.update({'monk': v_monk, 'qin': v_qin, 'muyu': v_muyu, 'gu': v_gu, 'zhong': v_zhong})

PARTS = {
    'monk': Synth('monk', level=-19, verb=0.55), 'hum': Synth('monk', vowel='m', level=-21, verb=0.65),
    'qin': Synth('qin', level=-17, verb=0.45), 'muyu': Synth('muyu', level=-21, verb=0.28), 'gu': Synth('gu', level=-19, verb=0.35),
    'zhong': Synth('zhong', level=-20, verb=0.45),
    'xiao': SF2('ms', 75, level=-20, verb=0.6, lp=3500), 'shaku': SF2('ms', 77, level=-19, verb=0.65, lp=3500),
    'strS': SF2('ms', 49, level=-19, verb=0.6, lp=3000), 'cello': SF2('ms', 42, level=-19, verb=0.5, lp=3000), 'cb': SF2('ms', 43, level=-20, verb=0.45, lp=2500),
    'sub': Synth('sub', level=-22, verb=0.0, cap=100), 'pad': Synth('pad', level=-25, verb=0.6, cutoff=800, attack=1.0),
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
def chant(s, n, step=0.25, tone=50, v=72, low=True, muyu=True, fall_last=True):
    """Monks reciting: one syllable per step on a reciting tone (an octave below doubling it), a 木鱼 stroke on each."""
    for k in range(n):
        p = tone - (2 if fall_last and k == n - 1 else 0)
        for voice in range(3): note('monk', s + k * step, step * 0.92, p, v - voice * 4, h=0.012)
        if low: note('monk', s + k * step, step * 0.92, p - 12, v - 6, h=0.012)
        if muyu: note('muyu', s + k * step, 0.1, 67, 70 + (12 if k % 4 == 0 else 0))
MOTIF = [57, 62, 60, 57]               # A D C A on the qin — the arrow: up a fourth, falling back
MURMUR = [51, 50, 52, 51, 49, 52, 50, 51, 53, 50]

# ═══ hook: the drum on frame 1 under the question; the answer on the qin; the arrows; the monks recite the sutra
note('gu', HK['q'], 1.0, 41, 118); note('sub', HK['q'], 1.4, 26, 96); chord('hum', HK['q'], 2.6, [38, 45, 50], 78); chord('cb', HK['q'], 2.6, [26, 38], 70)
note('gu', HK['ans'] + 0.2, 0.8, 43, 104); line('qin', HK['ans'] + 0.45, MOTIF, 0.22, d=0.6, v=96); chord('strS', HK['ans'] + 0.2, 2.2, [38, 50, 57], 62, h=0)
note('gu', HK['hit1'], 0.8, 45, 92); note('qin', HK['t1'], 1.2, 50, 80)
for k in range(10): note('monk', HK['swarm'] + k * 0.09, 0.08, MURMUR[k], 58, h=0.02)                                  # the thoughts: a crowded murmur
note('gu', HK['hit2'], 1.0, 41, 120); note('sub', HK['hit2'], 1.4, 26, 100); chord('cb', HK['hit2'], 1.6, [26, 38], 76)
chant(HK['quote'], 7, 0.25, 50, 70)                                                                                       # 譬 如 士 夫 被 一 毒 …
note('xiao', HK['decode'], 1.2, 69, 66); chord('hum', HK['quote'], 2.2, [38, 45], 66)
# ═══ title: the temple bell, the monks' hum, the drum
note('zhong', TI['t'], 6.0, 43, 110); note('gu', TI['t'], 1.0, 38, 100); chord('hum', TI['t'], 2.2, [38, 45, 50, 57], 82); chord('strS', TI['t'], 2.2, [38, 50, 57], 60, h=0)
# ═══ the physician: a quiet 木鱼 pulse; the qin answers each row; the eight sufferings; a low minor hum
for k in range(int((DO['out'] - DO['t']) / 0.5)): note('muyu', DO['t'] + k * 0.5, 0.1, 64, 52 + (8 if k % 4 == 0 else 0))
for i, s in enumerate(DO['rows']): note('qin', s, 0.9, [50, 53, 55, 57][i], 82)
chord('cello', DO['t'], 4.0, [38, 45], 60); chord('hum', DO['t'], 3.0, [38, 45], 60)
note('xiao', DO['blow'], 0.6, 69, 52)
for k in range(8): note('qin', DO['eight'] + k * 0.11, 0.5, [69, 67, 64, 62, 60, 57, 55, 50][k], 66 + k)
chord('hum', DO['bitter'], 1.6, [38, 45, 50, 53], 74); chord('strS', DO['bitter'], 1.6, [38, 50, 53, 57], 58, h=0)
# ═══ impermanence: the qin shapes each phase; the grip — the 木鱼 quickens; the wheel — a deep chant, three drums
for i, s in enumerate(FX['phases']): line('qin', s, [[50, 55, 57], [57, 57, 57], [57, 58, 56], [57, 53, 50]][i], 0.2, d=0.5, v=74)
chord('hum', FX['t'], 3.6, [38, 45], 60); chord('cello', FX['t'], 4.0, [38], 58)
g0, g1 = FX['grasp'], FX['wheel']; s_, step = g0, 0.5
while s_ < g1 - 0.05: note('muyu', s_, 0.1, 66, 60 + int(30 * (s_ - g0) / (g1 - g0))); step = max(0.125, step * 0.82); s_ += step
chord('strS', g0, g1 - g0, [38, 39], 46, h=0)
note('gu', FX['wheel'], 1.2, 38, 112); note('sub', FX['wheel'], 1.6, 26, 92)
for k in range(5): chord('monk', FX['wheel'] + k * 0.5, 0.48, [38, 45], 70)
for i, s in enumerate(FX['poisons']): note('gu', s, 0.6, [45, 43, 41][i], 96)
note('qin', FX['who'], 0.6, 57, 76); note('qin', FX['who'] + 0.3, 0.6, 62, 70)
# ═══ no-self: five strings for five aggregates; the cart's wood; the name — the hum resolves
note('gu', SE['t'], 0.8, 43, 96); chord('hum', SE['t'], 2.4, [38, 45, 50], 72); chord('cello', SE['t'], 3.0, [38, 45], 58)
for i, s in enumerate(SE['heaps']): note('qin', s, 0.7, [50, 53, 55, 57, 60][i], 82)
note('xiao', SE['which'], 1.0, 64, 60)
for k in range(5): note('muyu', SE['cart'] + k * 0.18, 0.1, [60, 64, 62, 67, 60][k], 70)
line('qin', SE['apart'], [62, 60, 57, 55, 53, 50], 0.07, d=0.4, v=70)
chord('hum', SE['name'], 1.6, [41, 48, 53, 57], 74); chord('strS', SE['name'], 1.6, [41, 53, 57], 56, h=0)
line('xiao', SE['decode'], [69, 74, 72, 69], 0.4, v=64)
# ═══ dependent origination: a soft hum; a qin note for each thread; the net; the cloud pulled; 空 — the bell
chord('hum', NT['t'] - 0.4, 3.0, [38, 45, 50], 64); chord('strS', NT['t'] - 0.5, 3.3, [38, 50, 57], 54, h=0)
for i in range(8): note('qin', NT['nodes'] + i * 0.17, 0.7, [50, 52, 55, 57, 59, 62, 64, 67][i], 70)
chord('pad', NT['web'], 1.6, [50, 55, 59, 62], 54, h=0)
note('qin', NT['pull'], 0.5, 59, 72); note('qin', NT['pull'] + 0.25, 0.9, 58, 60)
chord('hum', NT['gone'], 1.4, [45, 52], 56)
note('zhong', NT['kong'], 5.0, 38, 104); note('gu', NT['kong'], 1.0, 38, 96); chord('hum', NT['kong'], 2.4, [38, 45, 50, 57], 78)
line('xiao', NT['decode'] + 0.3, [69, 74, 72, 69], 0.4, v=62)
# ═══ the Heart Sutra: a wave in the low strings; the monks recite while the 260 characters appear; the raft drifts
chord('cello', HT['rise'] - 0.3, 2.2, [38, 45], 64); chord('strS', HT['rise'], 1.6, [38, 50, 57], 60, h=0); chord('strS', HT['fall'], 1.6, [43, 50, 55], 58, h=0)
chord('hum', HT['t'], 3.4, [38, 45], 60)
chant(HT['field'], 12, 0.25, 50, 76)                                                                                       # 观 自 在 菩 萨 行 深 般 若 波 罗 蜜
chord('hum', HT['field'], 3.0, [38, 45], 70); chord('hum', HT['sz'], 1.3, [43, 50, 55], 72)
for k in range(10): note('qin', HT['raft'] + k * 0.2, 0.5, [50, 52, 55, 57, 59, 57, 55, 57, 59, 62][k], 64)
chord('pad', HT['raft'], 2.2, [50, 55, 59], 46, h=0)
line('qin', HT['leave'], [57, 59, 62], 0.12, d=0.6, v=70)
line('xiao', HT['rdecode'], [69, 74, 72, 69], 0.35, v=62); chord('hum', HT['rdecode'], 1.4, [38, 45, 50], 60)
# ═══ the Diamond Sutra: the scroll under a low hum and strings; the monks; the labels; the six likenesses
chord('strS', DM['t'], 3.0, [38, 50, 57], 60, h=0); chord('hum', DM['t'], 2.5, [38, 45, 50], 64); note('gu', DM['t'], 0.8, 41, 80)
line('qin', DM['fact'], [50, 52, 55, 57, 62], 0.25, d=0.7, v=72)
chant(DM['quote'], 8, 0.25, 50, 68)                                                                                        # 凡 所 有 相 皆 是 虚 妄
chord('hum', DM['quote'] + 2.0, 1.8, [38, 45, 50], 66); chord('cello', DM['quote'], 3.6, [38, 45], 58)
note('shaku', DM['sengai'], 1.4, 62, 64)
line('qin', DM['peel'], [50, 55, 57, 62], 0.08, d=0.5, v=68)
chord('hum', DM['decode2'], 1.4, [38, 45, 50, 54], 70)
for k in range(9): note('muyu', SX['t'] + k * 0.5, 0.1, 64, 54)
chord('hum', SX['t'] - 0.2, 4.2, [38, 45], 58); chord('pad', SX['t'] - 0.2, 3.6, [50, 57, 62], 40, h=0)
for i, s in enumerate(SX['items']):
    if i < 5: note('qin', s, 0.6, [62, 64, 67, 69, 74][i], 62)
    else: note('gu', s, 0.8, 41, 100); note('sub', s, 1.0, 26, 86)
chord('hum', SX['decode'], 1.2, [43, 50, 55], 66)
# ═══ 应无所住: still water; the 箫; a few qin notes; the light grows into white paper
chord('pad', AB['t'], 4.2, [50, 57, 62], 44, h=0); chord('hum', AB['t'], 4.0, [38, 45], 56); chord('cb', AB['t'], 4.0, [26], 50)
line('xiao', AB['quote'], [57, None, 62, 60, 57], 0.5, d=0.9, v=66)
for k, p in enumerate([62, 69, 67]): note('qin', AB['goose'] + 0.4 + k * 0.6, 0.7, p, 60)
chord('hum', AB['huineng'], 1.4, [38, 45, 50, 54], 70); chord('strS', AB['huineng'], 1.4, [38, 50, 57], 56, h=0)
# ═══ Chan: almost nothing — the shakuhachi, one 木鱼 stroke per verse, the mirror gone, the empty circle, the moon
chord('hum', CN['t'], 13.0, [38, 45], 46)
line('shaku', CN['who'], [62, 60, 57], 0.45, d=0.8, v=60)
note('muyu', CN['shen'] - 0.05, 0.1, 62, 84); note('qin', CN['shen'], 1.0, 38, 70)
chord('strS', CN['shen'] - 0.6, 3.6, [38, 45, 50], 46, h=0); line('shaku', CN['shen'] + 0.8, [57, 55, 50], 0.8, d=1.2, v=54)
note('muyu', CN['neng'] - 0.05, 0.1, 62, 84); line('qin', CN['neng'], [50, 57, 62], 0.35, d=0.9, v=72)
chord('strS', CN['dissolve'], 1.4, [38, 50, 57], 46, h=0)
note('qin', CN['decode'], 1.2, 50, 66); note('qin', CN['decode'] + 0.4, 1.0, 57, 60)
chord('strS', CN['decode'] + 0.6, 3.0, [38, 50, 57], 46, h=0); note('shaku', CN['ox'] - 0.6, 2.2, 62, 54)
chord('hum', CN['moon'], 3.0, [38, 45, 50, 54, 57], 70); chord('strS', CN['moon'], 3.0, [38, 50, 54, 57], 56, h=0)
line('shaku', CN['focus'], [57, 62, 60, 57], 0.45, v=66)
# ═══ the ending: the drum, the murmur dissolving, the monks recite the mantra and climb; the bell; D major
chord('hum', EN['t'] - 0.4, 4.0, [38, 45, 50], 64); chord('strS', EN['t'] - 0.4, 1.2, [38, 50, 57], 54, h=0)
note('gu', EN['hit'], 0.8, 45, 90); note('qin', EN['l1'], 1.0, 50, 74)
for k in range(10): note('monk', EN['swarm'] + k * 0.09, 0.08, MURMUR[k], 50, h=0.02)
line('qin', EN['dissolve'], [57, 62, 64, 66, 69], 0.12, d=0.8, v=66)
chord('hum', EN['l2'], 1.5, [38, 45, 50, 54], 74); line('xiao', EN['l2'] + 0.2, [69, 74, 76, 78], 0.3, v=64)
SYL = [[0.0, 0.25], [0.0, 0.25], [0.0, 0.19, 0.38, 0.56], [0.0, 0.15, 0.3, 0.45, 0.6], [0.0, 0.25, 0.5, 0.75, 1.0]]
TONE = [50, 50, 52, 54, 57]            # the reciting tone climbs, phrase by phrase: D E F♯ A
for i, (s, offs) in enumerate(zip(EN['mantra'], SYL)):
    for j, o in enumerate(offs):
        last = i == 4 and j == len(offs) - 1
        d = 2.8 if last else (offs[j + 1] - o if j + 1 < len(offs) else 0.45) * 0.92
        p = 62 if last else TONE[i]
        for voice in range(3): note('monk', s + o, d, p, 74 + i * 3 - voice * 4, h=0.012)
        note('monk', s + o, d, p - 12, 70 + i * 3, h=0.012); note('muyu', s + o, 0.1, 67, 72 + (10 if j == 0 else 0))
    note('gu', s, 0.6, 41, 80 + i * 6); chord('hum', s, 0.5 if i < 4 else 3.0, [38, 45], 62 + i * 4)
note('zhong', EN['chord'], 6.0, 38, 116); note('sub', EN['chord'], 2.0, 26, 90); note('gu', EN['chord'], 1.0, 38, 108)
chord('hum', EN['chord'], 3.2, [38, 45, 50, 54, 57], 82); chord('strS', EN['chord'], 3.4, [38, 50, 54, 57, 62], 66, h=0)
line('xiao', EN['chord'] + 0.3, [69, 74, 76, 78], 0.32, v=70)
chord('strS', EN['card'], 2.6, [38, 50, 54, 57, 62], 60, h=0); chord('hum', EN['card'], 2.4, [38, 45, 50, 54], 66)
note('qin', EN['card'] + 0.3, 1.8, 50, 76); note('qin', EN['card'] + 0.7, 1.6, 57, 64)

# a held note and a new note on the same pitch: end the old one just before the new one starts
for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i

music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: all synthesized, all kept low and soft
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def pad_to(x, n): return np.pad(x, ((0, max(0, n - len(x))), (0, 0)))[:n]
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12, rev=False, lo=200, hi=1500):
    n = int(dur * SR); t = np.arange(n) / SR; x = lp(bp(noise(n, seed), lo, hi), 2000) * (t / dur) ** 2.2
    return st(x[::-1].copy() if rev else x)
def s_thunk(f=150, seed=3):
    n = int(0.35 * SR); t = np.arange(n) / SR
    body = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.3 * t)) * env(n, 0.0008, 0.05)
    return st(lp(body + 0.3 * bp(noise(n, seed), 500, 2000) * env(n, 0.0003, 0.008), 2500) + 0.9 * pad_to(s_thump(90, 48, 0.3), n)[:, 0])
def s_arrow(dur=0.7, seed=1):                 # an arrow: a low air sweep, then the head in wood
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k in range(0, n, 2400):
        f = 300 + 900 * (k / n) ** 2; m = min(2400, n - k); x[k:k + m] = bp(noise(m, seed + k), f, f * 1.7)
    return np.concatenate([st(lp(x, 2200) * (t / dur) ** 2.5), s_thunk()])
def s_stamp(seed=5):                           # a seal pressed onto paper
    n = int(0.3 * SR); return st(0.9 * pad_to(s_thump(110, 60, 0.18), n)[:, 0] + 0.2 * lp(bp(noise(n, seed), 900, 3000), 2500) * env(n, 0.001, 0.02))
def s_brush(dur=0.55, seed=7):                 # a soft brush on paper
    n = int(dur * SR); t = np.arange(n) / SR
    return st(lp(bp(noise(n, seed), 400, 2500) * np.sin(np.pi * t / dur) ** 1.5, 2600))
def s_breath(dur=0.45, seed=9):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 250, 1500), 1800) * np.sin(np.pi * t / dur) ** 0.8)
def s_sand(dur=2.0, seed=13, density=500):     # sand: soft, low grains
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 300, int(dur * density)): x[i:i + 260] += r.uniform(-1, 1) * np.exp(-np.arange(260) / 45)
    return st(lp(bp(x, 500, 3500), 3000) * np.minimum(1, np.arange(n) / (0.2 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.3 * SR)))
def s_water(dur=2.0, seed=19):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(noise(n, seed), 900) * np.sin(np.pi * t / dur) ** 2)
def s_lap(dur=2.0, seed=20):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(noise(n, seed), 700) * (0.4 + 0.6 * np.sin(2 * np.pi * 1.2 * t) ** 2) * np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.4))
def s_pop(seed=21):                            # a bubble, soft and low
    n = int(0.14 * SR); t = np.arange(n) / SR; f = 350 + 900 * t / 0.14
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.035))
def s_drip(seed=23):
    n = int(0.25 * SR); t = np.arange(n) / SR; f = 500 + 600 * np.exp(-t / 0.02)
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.05))
def s_rumble(seed=25):                         # distant thunder: only the roll
    n = int(1.8 * SR); t = np.arange(n) / SR
    return st(lp(noise(n, seed), 160) * (0.6 + 0.4 * np.sin(2 * np.pi * 2.3 * t)) * env(n, 0.04, 0.6))
def s_flap(seed=27):
    n = int(0.16 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 150, 1000), 1200) * np.sin(np.pi * t / 0.16) ** 2)
def s_tear(seed=29, dur=0.4):                  # paper: soft
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 200, int(dur * 400)): x[i:i + 160] += r.uniform(-1, 1) * np.exp(-np.arange(160) / 25)
    return st(lp(bp(x, 400, 3000), 2600) * np.sin(np.pi * np.arange(n) / n) ** 0.5)
def s_dust(dur=1.6, seed=33): return s_sand(dur, seed, 600) * np.linspace(1, 0.3, int(dur * SR))[:, None]
def s_wood(f=300, seed=15): return v_muyu(f, 0.1, 80, SR, np.random.default_rng(seed))

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
ARROW = 0.7
def arrow_at(hit, db, why, seed=1): put(hit - ARROW, s_arrow(ARROW, seed), db, 'arrow: low air + thunk (synth)', why)

arrow_at(HK['hit1'], -26, 'the first arrow lands')
arrow_at(HK['hit2'], -24, 'the second arrow lands, harder', seed=2)
for s in (HK['t1'] + 0.4, HK['t2'] + 0.7): put(s, s_stamp(), -32, 'seal stamp (synth)', 'seal: 身受 / 心受' if s < 4 else '')
put(TI['t'], s_brush(0.6), -31, 'brush stroke (synth)', '佛 is written'); put(TI['seal'], s_stamp(6), -32, 'seal stamp (synth)', '觉者')
for i, s in enumerate(DO['rows']): put(s + 0.15, s_stamp(10 + i), -31, 'seal stamp (synth)', 'the diagnosis, row by row' if i == 0 else '')
put(DO['blow'], s_breath(), -31, 'breath (synth)', 'nirvana: the flame is blown out')
put(FX['phases'][0] - 0.3, s_sand(1.0, 50, 400), -34, 'sand gathering (synth)', '生: the form gathers')
put(FX['phases'][3], s_dust(1.2, 51), -33, 'dust scattering (synth)', '灭: it scatters')
put(FX['grasp'], s_sand(FX['wheel'] - FX['grasp'] + 0.2, 52, 700), -32, 'running sand (synth)', 'the tighter the grip, the faster it runs')
put(FX['glabel'], s_brush(0.5, 53), -32, 'brush stroke (synth)', '执着')
put(FX['wheel'] - 0.3, s_swell(0.35, 54), -34, 'air (synth)', 'into the wheel of life')
put(SE['t'], s_brush(0.7, 60), -30, 'brush stroke (synth)', '我 is written')
put(SE['split'], s_swell(0.25, 61, lo=400, hi=2000), -34, 'soft slice (synth)', '我 is cut into five')
put(NT['pull'] + 0.1, s_tear(70, 0.5), -32, 'paper tear (synth)', 'the cloud is pulled out; the paper goes')
put(HT['rise'] - 0.2, s_water(2.6, 80), -30, 'wave rising and falling (synth)', 'the wave rises from the water and falls back')
put(HT['field'], s_tear(81, 0.6), -35, 'paper sweep (synth)', 'the 260 characters')
put(HT['raft'], s_lap(HT['leave'] - HT['raft'] + 0.5, 83), -33, 'lapping water (synth)', 'the raft crosses')
put(HT['leave'], s_wood(180, 84), -33, 'step on the bank (synth)', 'the raft is left behind')
put(DM['t'] - 0.1, s_tear(90, 0.8), -34, 'scroll unrolling (synth)', 'the Diamond Sutra of 868')
for i, s in enumerate(DM['labels']): put(s, s_stamp(91 + i), -30, 'label slapped on (synth)', 'labels: 我的 / 失败 / 完美' if i == 0 else '')
for i in range(3): put(DM['peel'] + i * 0.1, s_tear(95 + i, 0.3), -34, 'label peeled (synth)', 'peeled off' if i == 0 else '')
put(SX['items'][0], s_swell(0.5, 100, rev=True), -35, 'reverse swell (synth)', '梦')
put(SX['items'][2] + 0.9, s_pop(), -33, 'bubble (synth)', '泡')
put(SX['items'][4] + 0.2, s_drip(), -34, 'drip (synth)', '露')
put(SX['items'][5], s_rumble(), -27, 'distant thunder (synth)', '电')
for k in range(6): put(AB['goose'] + 0.2 + k * 0.33, s_flap(110 + k), -35, 'wing beat (synth)', 'the goose crosses' if k == 0 else '')
put(AB['out'] - 0.8, s_swell(0.9, 111, lo=300, hi=1800), -33, 'soft swell (synth)', 'the light becomes white paper')
for i, s in enumerate(CN['wipes']): put(s - 0.05, s_brush(0.35, 122 + i), -31, 'dry brush wipe (synth)', 'the mirror wiped clean' if i == 0 else '')
put(CN['dissolve'], s_swell(0.8, 125, rev=True, lo=150, hi=1000), -32, 'ink dispersing (synth)', 'the mirror is not there')
put(CN['fall'], s_sand(1.2, 126, 300), -35, 'dust falling (synth)', 'the dust falls through')
arrow_at(EN['hit'], -28, 'the first arrow still comes', seed=3)
put(EN['dissolve'], s_dust(1.6, 131), -31, 'dust lifting (synth)', 'the thoughts dissolve before they become an arrow')
put(EN['shore'], s_water(2.0, 132), -34, 'water (synth)', 'the far shore')
put(EN['card'], s_brush(0.7, 133), -31, 'brush stroke (synth)', '佛')

SFX = lp(SFX, 4500)
ir = sc.ir
sfx_mix = SFX + 0.22 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 70, 'low', fs=SR, output='sos'), x, axis=0)          # trim only the deepest sub; no presence lift
x = lp(x, 9000)
fade = np.ones(N); f0 = int((DUR - 1.2) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m4 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m4)) ** 2; fr = np.fft.rfftfreq(len(m4), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'buddha_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'buddha_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 佛 · 第二支箭 — cue sheet (generated by music/buddha.py)\n\nEvery time comes from src/buddha/buddha.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s. The 木鱼, the drum, the bell and the chant are part of the score.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'buddha_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))

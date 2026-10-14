"""红楼 · 第一页就写好了所有人的结局 (90 s) — score and sound design, synced to src/hlm/hlm.json.
Run: python3 music/hlm.py → public/hlm_score.wav, out/hlm_sfx_only.wav, out/hlm_cues.md

Kunqu colours, original melodies only (nothing from the 1987 TV score, no recordings): 曲笛 leads, 笙 breathes round it,
檀板 and 单皮鼓 keep the 板眼, 三弦 and 琵琶 pluck, 筝 shimmers in the dream (the novel itself stages its ch. 5 songs
with 「檀板」 and 「银筝」), and a low 箫 takes over at the end.
  · The motif is the four sisters' names, 元迎探惜 = 原应叹息 (脂批), one note each in 南曲 pentatonic:
    元 = 宫 D, 迎 = 商 E, 探 = 角 F♯, 惜 = 徵 A. All through the film it stops after three notes; the ear waits for the
    fourth. Only on the last line does 息 (A) sound, and it falls home to 宫 on a breath — 息 is both "sigh" and "rest".
  · The beat stretches as the family falls (板式递减): 流水板 / 一板一眼 in the garden, 一板三眼 at the dream,
    赠板 for 葬花, then 散板 — free time, a single 底板 at the very end.
  · 好了歌: a beggar's 数板 on dry 三弦 and clapper, every 「好」 a fourth above every 「了」; that falling fourth ends
    each sister's fate in the register.
Everything is soft and low-passed; no gongs, cymbals or 云锣.
"""
import json, os
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy.signal import butter, fftconvolve, lfilter, sosfilt
import engine
from engine import Score, Synth
from mixutil import compress, jumps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'hlm', 'hlm.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
HK, ST, NM, GM, SS, GD, TN, RG, ZH, HL, WY, WH, LF = (J[k] for k in ('hook', 'stone', 'names', 'game', 'sisters', 'garden', 'turn', 'register', 'zanghua', 'haole', 'why', 'white', 'lift'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def hp(x, f, sr=SR): return sosfilt(butter(2, f, 'high', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)
def st(y, w=0.97): return np.stack([y, y * w], axis=1)

def v_dizi(f, dur, vel, sr, rng):
    """曲笛: a bamboo flute, mellow, with the buzzing 笛膜 (membrane) on the 2nd–4th harmonics, breath, a slight scoop
    up into the note and a vibrato that grows."""
    n_on, n = int(dur * sr), int((dur + 0.3) * sr); t = np.arange(n) / sr
    vib = 0.006 * np.sin(2 * np.pi * 5.4 * t) * np.minimum(1, np.maximum(0, t - 0.25) / 0.5)
    ph = 2 * np.pi * np.cumsum(f * (1 + vib - 0.025 * np.exp(-t / 0.05))) / sr
    tone = np.sin(ph) + 0.28 * np.sin(2 * ph + 0.3) + 0.12 * np.sin(3 * ph) + 0.05 * np.sin(4 * ph)
    buzz = 0.22 * np.tanh(4 * (np.sin(2 * ph) + 0.6 * np.sin(3 * ph))) * (0.6 + 0.4 * rng.standard_normal(n).clip(-1, 1) * 0.3)
    y = tone + bp(buzz, 1200, 3200, sr) + 0.14 * bp(rng.standard_normal(n), f, f * 4, sr)
    e = np.minimum(1, t / 0.06) ** 1.2; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.08 * sr))
    return st(lp(y * e, 3600, sr))
def v_xiao(f, dur, vel, sr, rng):
    """箫: an end-blown bamboo flute, low, dark and very breathy."""
    n_on, n = int(dur * sr), int((dur + 0.5) * sr); t = np.arange(n) / sr
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 4.8 * t) * np.minimum(1, t / 0.8))) / sr
    y = np.sin(ph) + 0.1 * np.sin(2 * ph) + 0.06 * np.sin(3 * ph) + 0.3 * bp(rng.standard_normal(n), f * 0.7, f * 3, sr)
    e = np.minimum(1, t / 0.3) ** 1.6; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.2 * sr))
    return st(lp(y * e, 2000, sr))
def v_sheng(f, dur, vel, sr, rng):
    """笙: free reeds that breathe in and out."""
    n_on, n = int(dur * sr), int((dur + 0.5) * sr); t = np.arange(n) / sr
    y = sum((1 / k ** 1.25) * np.sin(2 * np.pi * f * k * t * (1 + 0.0015 * (k % 2)) + k) for k in range(1, 9))
    e = np.minimum(1, t / 0.4) ** 1.3 * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t)); e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.25 * sr))
    return st(lp(y * e, 2600, sr), 0.95)
def ks(f, dur, sr, rng, decay, bright, body=0.0):
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.5) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), bright, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); y = y / (np.abs(y).max() + 1e-9); t = np.arange(n) / sr
    if body: y += body * np.sin(2 * np.pi * f * t) * np.exp(-t / 0.8) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.25 * sr))
    return y, t
def v_zheng(f, dur, vel, sr, rng):
    """筝 (银筝): a long silk-steel zither string, soft attack, long ring."""
    y, t = ks(f, dur, sr, rng, 0.9985, 2400, 0.3); y *= 1 - np.exp(-t / 0.006)
    return st(lp(y, 3000, sr), 0.93)
def v_sanxian(f, dur, vel, sr, rng):
    """三弦: dry, nasal, a snakeskin buzz, short."""
    y, t = ks(f, min(dur, 0.6), sr, rng, 0.993, 3000)
    y = y + 0.22 * bp(np.tanh(5 * y), 900, 2600, sr)                       # the skin's buzz
    return st(lp(y, 3200, sr))
def v_pipa(f, dur, vel, sr, rng):
    """琵琶: a bright pluck with a quick decay (tremolo is written as repeated notes)."""
    y, t = ks(f, min(dur, 1.2), sr, rng, 0.996, 3400, 0.15)
    return st(lp(y, 3400, sr), 0.96)
def v_ban(f, dur, vel, sr, rng):
    """檀板 / 拍板: two sandalwood boards struck together — a dry, woody clap."""
    n = int(0.25 * sr); t = np.arange(n) / sr
    y = sum(a * np.sin(2 * np.pi * fr * t) * np.exp(-t / d) for fr, a, d in ((f, 1.0, 0.025), (f * 1.83, 0.6, 0.015), (f * 2.9, 0.3, 0.01)))
    y += 0.8 * bp(rng.standard_normal(n), 900, 3800, sr) * np.exp(-t / 0.006)
    return st(lp(y * (1 - np.exp(-t / 0.0005)), 4000, sr))
def v_danpi(f, dur, vel, sr, rng):
    """单皮鼓 (板鼓): a tiny, tight drum struck with thin sticks — a high dry tick."""
    n = int(0.18 * sr); t = np.arange(n) / sr
    y = np.sin(2 * np.pi * f * (1 + 0.2 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.03) + 0.4 * bp(rng.standard_normal(n), 1200, 3500, sr) * np.exp(-t / 0.008)
    return st(lp(y, 3800, sr))
def v_tanggu(f, dur, vel, sr, rng):
    """堂鼓: a low barrel drum, one heavy stroke."""
    n = int(1.6 * sr); t = np.arange(n) / sr; fr = f * (1 + 0.35 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.5) + 0.3 * lp(rng.standard_normal(n), 700, sr) * np.exp(-t / 0.04)
    return st(np.tanh(1.3 * y))
def v_hum(f, dur, vel, sr, rng):
    """A hummed 「啊」 (formant synth) with the Kunqu 擞腔 — a tremolo that comes in bursts. Used once, at 葬花."""
    n_on, n = int(dur * sr), int((dur + 0.6) * sr); t = np.arange(n) / sr
    shu = 1 + 0.012 * np.sin(2 * np.pi * 6.2 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 0.7 * t)))
    ph = np.cumsum(f * shu) / sr; saw = 2 * (ph % 1) - 1
    y = sum(g * bp(saw, fc * 0.85, fc * 1.15, sr) for fc, g in ((700, 1.0), (1150, 0.6), (2600, 0.18)))
    e = np.minimum(1, t / 0.5) ** 1.5; e[n_on:] *= np.exp(-np.arange(n - n_on) / (0.3 * sr))
    return st(lp(y * e, 3000, sr), 0.94)
engine.VOICES.update({'dizi': v_dizi, 'xiao': v_xiao, 'sheng': v_sheng, 'zheng': v_zheng, 'sanxian': v_sanxian, 'pipa': v_pipa,
                      'ban': v_ban, 'danpi': v_danpi, 'tanggu': v_tanggu, 'hum': v_hum})

PARTS = {
    'dizi': Synth('dizi', level=-17, verb=0.45), 'xiao': Synth('xiao', level=-17, verb=0.55), 'sheng': Synth('sheng', level=-23, verb=0.5),
    'zheng': Synth('zheng', level=-19, verb=0.5), 'sanxian': Synth('sanxian', level=-20, verb=0.3), 'pipa': Synth('pipa', level=-20, verb=0.35),
    'ban': Synth('ban', level=-22, verb=0.35), 'danpi': Synth('danpi', level=-29, verb=0.3), 'tanggu': Synth('tanggu', level=-19, verb=0.4),
    'hum': Synth('hum', level=-21, verb=0.6), 'sub': Synth('sub', level=-28, verb=0.0, cap=90),
}
sc = Score(DUR, SR, seed=1754)
rng = np.random.default_rng(1754)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=70):
    for p in ps: note(part, s, d, p, v, 0)
def tune(part, s, notes, step=0.5, v=80, legato=0.92):
    for i, p in enumerate(notes):
        if p is not None: note(part, s + i * step, step * legato, p, v)
def ban(s, v=86): note('ban', s, 0.1, 76, v, 0)
def yan(s, v=60): note('danpi', s, 0.1, 88, v, 0)
def banyan(a, b, step, eyes=1, v=82):
    """板眼 from a to b: a 板 every `step` seconds and `eyes` 眼 between."""
    k = 0
    while a + k * step < b - 1e-6:
        s = a + k * step; ban(s, v)
        for e in range(1, eyes + 1): yan(s + e * step / (eyes + 1))
        k += 1

# D 宫 南曲 pentatonic: D E F♯ A B. The motif 原应叹息 = D E F♯ … (A withheld until the end)
D, E, Fs, A, B = 62, 64, 66, 69, 71
MOTIF3 = [D + 12, E + 12, Fs + 12]

# ═══ hook: a clap on frame 1, the 笙 opens a fifth; the 笛 plays 原–应–叹 and stops
ban(HK['t'] + 0.02, 96); chord('sheng', HK['t'], HK['out'] + 0.4, [50, 57, 62], 56)
tune('dizi', HK['l2'], MOTIF3, step=0.55, v=82); note('zheng', HK['push'], 1.2, A, 64)
# ═══ the stone (一板一眼): a bright spring tune; when one stone is left, the 筝 rings it
banyan(ST['t'], NM['out'], 1.0, 1, 74)
tune('dizi', ST['t'] + 0.2, [A + 12, B + 12, A + 12, Fs + 12, E + 12, D + 12, E + 12, Fs + 12, A + 12, None, Fs + 12, E + 12], step=0.5, v=74)
chord('sheng', ST['t'], NM['out'] - ST['t'], [50, 57, 62, 66], 46)
for i in range(6): note('zheng', ST['fly'] + i * 0.11, 0.6, [74, 78, 81, 83, 86, 90][i], 56)
note('zheng', ST['one'], 2.4, A + 12, 76); note('zheng', ST['one'], 2.4, D + 12, 60)
# ═══ the author's names: 三弦 on the 板; a 筝 pluck under each red 批
for k in range(6): note('sanxian', NM['t'] + k, 0.4, [50, 57, 54, 57, 50, 57][k], 70)
tune('dizi', NM['t'] + 0.5, [Fs + 12, A + 12, B + 12, A + 12, Fs + 12, E + 12, D + 12, E + 12], step=0.7, v=70)
for s in (NM['zhenpi'], NM['jiapi']): note('zheng', s, 1.4, B, 66); note('zheng', s + 0.12, 1.2, Fs + 12, 56)
# ═══ the name game (流水板): wood ticks every half second, a 三弦 note per name
for k in range(12): (ban if k % 2 == 0 else yan)(GM['t'] + k * 0.5)
for i, s in enumerate(GM['items']): note('sanxian', s, 0.3, [62, 66, 69, 71, 74][i], 82); note('pipa', s + 0.25, 0.3, [57, 62, 64, 66, 69][i], 60)
note('dizi', GM['l'], 0.9, A + 12, 72); chord('sheng', GM['t'], GM['out'] - GM['t'] + 0.3, [50, 57, 62], 48)
# ═══ the four sisters: the motif, one note per sister — and on 惜/息, nothing but the clapper
for i, s in enumerate(SS['wins']): note('zheng', s, 1.0, [D, E, Fs, A][i] + 12, 60)
for i, s in enumerate(SS['decode'][:3]): note('dizi', s, 0.75, MOTIF3[i], 86)
ban(SS['decode'][3], 92)
chord('sheng', SS['t'], SS['out'] - SS['t'], [50, 57, 62], 44)
tune('dizi', SS['l2'], MOTIF3, step=0.45, v=74)
for i in range(7): note('zheng', SS['out'] - 0.75 + i * 0.1, 1.0, [62, 64, 66, 69, 71, 74, 76][i], 52 + i * 3)   # a rising sweep into the garden
banyan(SS['t'], SS['out'], 2.0, 1, 70)
# ═══ the golden garden (peak): full ensemble, 一板一眼, the four plays each a strummed chord
banyan(GD['t'], GD['out'], 1.0, 1, 80)
chord('sheng', GD['t'], GD['out'] - GD['t'], [50, 57, 62, 69], 54)
tune('dizi', GD['t'] + 0.1, [D + 12, E + 12, Fs + 12, A + 12, B + 12, A + 12, Fs + 12, A + 12, D + 24, B + 12, A + 12, Fs + 12, E + 12, Fs + 12, A + 12, None,
                             B + 12, A + 12, Fs + 12, E + 12, D + 12, E + 12, Fs + 12, None], step=0.33, v=78)
for k in range(8): note('sanxian', GD['t'] + k, 0.35, [50, 57, 54, 57][k % 4], 66)
for k in range(16): note('zheng', GD['t'] + 0.5 + k * 0.5, 0.5, [74, 78, 81, 78, 83, 81, 78, 74][k % 8], 48)
for s in GD['plays']: chord('pipa', s, 0.5, [50, 57, 62, 66], 78)
note('tanggu', GD['l2'], 1.0, 41, 70)
# ═══ the turn (一板三眼): the motif descends, slowly; the 筝 rings on the tea and the wine
banyan(TN['t'], TN['out'], 2.0, 3, 66)
chord('sheng', TN['t'], TN['out'] - TN['t'] + 0.5, [50, 56, 62], 48)   # a flattened 角: unease
tune('dizi', TN['arch'], [Fs + 12, E + 12, D + 12, None, Fs, E, D], step=0.8, v=70)
for s in (TN['tea'], TN['wine']):
    for i in range(4): note('zheng', s + i * 0.16, 1.6, [86, 81, 78, 74][i], 52)
# ═══ the register: each fate ends on the falling fourth (好→了); 琵琶 tremolo under
banyan(RG['t'], RG['out'], 2.0, 3, 62)
chord('sheng', RG['t'], RG['out'] - RG['t'], [50, 57, 62], 46)
tune('xiao', RG['page'], [A, Fs, E, D, None, E, Fs], step=0.9, v=70)
for i, s in enumerate(RG['fates']):
    note('dizi', s, 0.45, A + 12, 76); note('dizi', s + 0.5, 0.8, E + 12, 70)
    for k in range(6): note('pipa', s + k * 0.08, 0.1, [50, 54, 47, 52][i], 46)
# ═══ 葬花 (赠板): a 板 every four seconds; the hummed 啊 once; the 箫; a few 筝 drops like petals
banyan(ZH['t'], ZH['out'], 4.0, 0, 64)
chord('sheng', ZH['t'], ZH['out'] - ZH['t'] + 0.5, [50, 57, 62], 44)
note('hum', ZH['l1'], 2.6, 66, 74); note('hum', ZH['l1'] + 2.6, 1.8, 64, 66)
tune('xiao', ZH['l2'], [A, Fs, E, None, D, E, Fs, E], step=0.8, v=72)
for i, s in enumerate([55.6, 56.9, 58.3, 59.4, 60.6]): note('zheng', s, 1.8, [81, 78, 74, 78, 74][i], 44)
# ═══ 好了歌: a beggar's 数板 — dry 三弦 and clapper, 好 a fourth above 了
banyan(HL['t'], HL['out'], 1.0, 1, 74)
for k in range(12): note('sanxian', HL['t'] + k * 0.5, 0.3, (A if k % 2 == 0 else E), 74)
for s in HL['names']: note('pipa', s, 0.4, A + 12, 70); note('pipa', s + 0.4, 0.5, E + 12, 66)
chord('sheng', HL['t'], HL['out'] - HL['t'], [45, 52, 57], 40)
# ═══ why he knew: the seal strip slaps down — 琵琶 strum and 堂鼓 — then free time
note('tanggu', WY['seal'], 1.4, 36, 94); chord('pipa', WY['seal'] + 0.02, 0.8, [38, 45, 50, 54, 57], 82)
chord('sheng', WY['seal'] + 0.4, WY['out'] - WY['seal'], [50, 53, 57], 48)
tune('xiao', WY['l1'] + 0.4, [D + 12, None, A, Fs, E, None, D], step=0.9, v=70)
note('zheng', WY['pi'], 3.0, D, 60); note('zheng', WY['pi'] + 0.2, 2.8, A, 50)
# ═══ white (散板): almost nothing — a held 笙, the 箫 alone
chord('sheng', WH['t'], WH['out'] - WH['t'] + 1.0, [50, 57], 42)
tune('xiao', WH['l1'], [Fs, None, E, None, D], step=1.1, v=62)
note('xiao', WH['l2'] + 0.4, 2.4, A - 12 + 12, 56)
# ═══ lift: the motif returns — 原, 应, 叹 … and 息 at last, falling home to 宫 on a breath; a single 底板
chord('sheng', LF['t'], LF['out'] - LF['t'] - 0.5, [50, 57, 62, 66], 50)
for i, s in enumerate(LF['gallery']): note('zheng', s, 1.4, [62, 66, 69, 71, 74][i], 50)
tune('dizi', LF['l1'], MOTIF3, step=0.6, v=80)
note('dizi', LF['l2'], 1.6, A + 12, 84)                 # 息
note('dizi', LF['title'] - 0.15, 2.0, D + 12, 76)       # home, on a breath
note('zheng', LF['title'] - 0.15, 2.4, D, 60); note('zheng', LF['title'] - 0.05, 2.2, A, 50)
note('sub', LF['title'] - 0.15, 2.0, 38, 56)
ban(LF['out'] - 1.0, 80)

for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i
music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: brush and paper for the red commentary, stones flung into the sky, a pour, a seal strip, wind, snow
def active(x):
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * SR); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    return 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
def norm(x): return x * 10 ** (-active(x) / 20)
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_brush(dur=0.7, seed=11):                    # a brush laying down a short line on paper
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 600, 3200), 3400) * np.sin(np.pi * t / dur) ** 0.8)
def s_stones(dur=1.2, seed=3):                    # many small stones lifting away: a soft rush with a few clicks
    n = int(dur * SR); t = np.arange(n) / SR; y = lp(bp(noise(n, seed), 300, 2000), 2400) * np.sin(np.pi * t / dur) ** 1.5
    r = np.random.default_rng(seed)
    for _ in range(40):
        i = int(r.uniform(0, dur - 0.05) * SR); m = int(0.01 * SR); y[i:i + m] += 0.5 * r.standard_normal(m) * np.exp(-np.arange(m) / (0.002 * SR))
    return st(lp(y, 3000))
def s_pour(dur=1.4, seed=5):                      # tea poured into a cup
    n = int(dur * SR); t = np.arange(n) / SR; f = 900 + 500 * t / dur
    y = bp(noise(n, seed), 500, 2600) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t)) + 0.15 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t))
    return st(lp(y * np.minimum(1, t / 0.1) * np.minimum(1, (dur - t) / 0.3), 3000))
def s_slap(seed=7):                               # a paper seal strip slapped onto a door
    n = int(0.5 * SR); t = np.arange(n) / SR
    return st(lp(bp(noise(n, seed), 200, 2400) * np.exp(-t / 0.03) + 0.6 * np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.06), 2600))
def s_wind(dur=6.0, seed=9):                      # a soft cold wind as the snow falls
    n = int(dur * SR); t = np.arange(n) / SR
    return np.stack([lp(bp(noise(n, seed + c), 200, 1400), 1500) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.17 * t + c)) * np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.5) for c in range(2)], axis=1)
def s_page(seed=13):                              # a page turned
    n = int(0.6 * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 800, 4000), 4000) * np.sin(np.pi * t / 0.6) ** 2 * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t)))

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))
put(HK['push'] - 0.2, s_page(13), -27, 'page (synth)', 'through the window to the first page')
put(ST['fly'], s_stones(1.2, 3), -25, 'stones lifting (synth)', '36,500 stones go up to mend the sky')
put(ST['pi'], s_brush(0.8, 21), -27, 'brush (synth)', 'the red 脂批 is written')
for i, s in enumerate((NM['zhenpi'], NM['jiapi'])): put(s, s_brush(0.7, 22 + i), -27, 'brush (synth)', 'red 批: 真事隐 / 假语村言')
for i, s in enumerate(GM['items']): put(s + 0.35, s_brush(0.35, 30 + i), -29, 'brush flick (synth)', 'a name decoded')
for i, s in enumerate(SS['decode']): put(s, s_brush(0.5, 40 + i), -28, 'brush (synth)', '元迎探惜 → 原应叹息')
put(TN['tea'], s_pour(1.4, 5), -26, 'tea poured (synth)', '千红一窟')
put(TN['wine'], s_pour(1.2, 6), -27, 'wine poured (synth)', '万艳同杯')
put(RG['decode'], s_brush(0.8, 50), -27, 'brush (synth)', '玉带林 / 雪里金簪 decoded')
put(ZH['pi'], s_brush(0.8, 51), -28, 'brush (synth)', '脂批: 诸艳一偈')
put(WY['seal'], s_slap(7), -24, 'seal strip slapped (synth)', '1728: the 曹 house sealed')
put(WY['pi'], s_brush(0.9, 52), -27, 'brush (synth)', '眉批: 芹为泪尽而逝')
put(WH['t'] - 0.5, s_wind(WH['out'] - WH['t'] + 1.0, 9), -26, 'cold wind (synth)', 'white, everywhere')
put(LF['stone'], s_page(14), -27, 'page (synth)', 'back to the first page')

SFX = lp(SFX, 5000)
ir = sc.ir
sfx_mix = SFX + 0.3 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
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
sf.write(os.path.join(ROOT, 'public', 'hlm_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'hlm_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 红楼 — cue sheet (generated by music/hlm.py)\n\nEvery time comes from src/hlm/hlm.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'hlm_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')

"""洋流 (95 s) — score and sound design, synced to src/ocean/ocean.json.
Run: python3 music/ocean.py → public/ocean_score.wav, out/ocean_sfx_only.wav, out/ocean_cues.md

One sea theme — "the river", a rolling 12/8 tune in D Dorian that opens on the sea-call of a rising fifth (D–A) —
travels the world with the water and changes instruments wherever it lands:
  Hokusai     — taiko, shakuhachi and koto; the container lands on the drum; the toys scatter on koto and pizzicato.
  Title       — the theme on horns and strings over rolling harp: NASA's swirling ocean.
  Franklin    — a sea shanty: fiddle, accordion, stamping feet and a men's chorus ("heave — ho"); the band stops dead
                when the captains refuse to believe it, and a bassoon shrugs.
  Homer       — low brass and a timpani roll under the sharks: how big is this river?
  Swiss       — a marimba pulse; every bar of the chart lands a bigger chord, the last on full orchestra and choir.
  Bauhaus     — a minimal ostinato (marimba, clarinet, pizzicato); each arrow is a note; Ekman's spiral is a falling
                arpeggio that gets softer layer by layer; five gyres are the theme's first five notes.
  Kuroshio    — the theme on shakuhachi with koto: the nearest current to us.
  Ducks       — the theme on bassoon and clarinet, pizzicato; a rubber squeak at Sitka; a brass "ta-da" when the
                model's forecast comes true.
  Plastic     — the theme bends into Phrygian (E♭) over a low cluster; it sinks.
  Deep        — whale calls, a low choir and a drone; the thousand-year loop walks in the bass, and at every change of
                dynasty the guqin plucks the next note of the theme over a soft temple drum; the water surfaces in
                2026 on a bright chord.
  Challenger  — a Victorian reed organ and a solo cello; 「大海，有记忆」 on the choir.
  AMOC        — a heartbeat that slows and fades under a thinning string tremolo.
  Ending      — guqin and 箫 for Li Bai; the strings bring the theme back ("it does come back"); on 「李白可能还在写诗」
                the harmony turns to D major, and the whole orchestra carries the answering phrase home over the surf.
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
J = json.load(open(os.path.join(ROOT, 'src', 'ocean', 'ocean.json'), encoding='utf-8'))
SR, DUR = 48000, J['duration']; N = int(DUR * SR); BEAT = 0.5; TRI = BEAT / 3
HK, TI, FR, HO, SC, WY, KU, DK, PL, DP, CH, AM, EN = (J[k] for k in ('hook', 'title', 'franklin', 'homer', 'scale', 'why', 'kuro', 'ducks', 'plastic', 'deep', 'challenger', 'amoc', 'ending'))
def lp(x, f, sr=SR): return sosfilt(butter(2, f, 'low', fs=sr, output='sos'), x, axis=0)
def hp(x, f, sr=SR): return sosfilt(butter(2, f, 'high', fs=sr, output='sos'), x, axis=0)
def bp(x, a, b, sr=SR): return sosfilt(butter(2, [a, b], 'band', fs=sr, output='sos'), x, axis=0)

# ═══ voices the soundfonts lack
VOWELS = {'a': [(730, 90, 1.0), (1090, 110, 0.45), (2440, 170, 0.12)], 'o': [(570, 80, 1.0), (840, 100, 0.5), (2410, 160, 0.1)],
          'u': [(300, 70, 1.0), (870, 100, 0.3), (2240, 160, 0.06)], 'e': [(530, 80, 1.0), (1840, 120, 0.3), (2480, 170, 0.1)]}
def v_sailor(f, dur, vel, sr, rng, vowel='o'):
    """A sailor's voice in the chorus: a glottal buzz through three formants, a scoop up into the note, a little rough."""
    n_on, n = int(dur * sr), int((dur + 0.12) * sr); t = np.arange(n) / sr
    vib = 1 + 0.008 * np.sin(2 * np.pi * (5.4 + rng.uniform(-0.6, 0.6)) * t + rng.uniform(0, 6))
    ph = 2 * np.pi * np.cumsum(f * vib * (1 - 0.06 * np.exp(-t / 0.04))) / sr
    K = int(min(36, 3600 / f)); src = sum(np.sin(k * ph) / k for k in range(1, K + 1)) + 0.05 * rng.standard_normal(n)
    y = sum(a * bp(src, fc - bw, fc + bw, sr) for fc, bw, a in VOWELS[vowel])
    e = np.ones(n); na = int(0.03 * sr); e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    e[n_on:] = np.exp(-np.arange(n - n_on) / (0.04 * sr)); y = lp(y * e, 3200, sr)
    return np.stack([y, y * 0.95], axis=1)
def v_qin(f, dur, vel, sr, rng, decay=0.9975):
    """A low plucked silk string (Karplus–Strong through a soft loop filter) with a warm body: the guqin."""
    L = max(2, int(round(sr / f))); n = int((min(dur, 3.0) + 1.6) * sr)
    exc = np.zeros(n); exc[:L] = lp(rng.standard_normal(L), 1800, sr)
    a = np.zeros(L + 2); a[0] = 1; a[L] = -decay * 0.5; a[L + 1] = -decay * 0.5
    y = lfilter([1.0], a, exc); t = np.arange(n) / sr
    y = y / (np.abs(y).max() + 1e-9) + 0.35 * np.sin(2 * np.pi * f * t) * np.exp(-t / 1.4) * (1 - np.exp(-t / 0.004))
    n_off = int(dur * sr)
    if n_off < n: y[n_off:] *= np.exp(-np.arange(n - n_off) / (0.35 * sr))
    y = lp(y, 2600, sr); return np.stack([y, y], axis=1)
def v_gu(f, dur, vel, sr, rng):
    """A big drum (taiko / temple drum): a low membrane that drops in pitch, with skin and air around it."""
    n = int(1.6 * sr); t = np.arange(n) / sr; fr = f * (1 + 0.35 * np.exp(-t / 0.05))
    y = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t / 0.5) + 0.3 * np.sin(2 * np.pi * np.cumsum(fr * 2.3) / sr) * np.exp(-t / 0.16)
    y = np.tanh(1.3 * (y + 0.4 * lp(rng.standard_normal(n), 900, sr) * np.exp(-t / 0.06)) * (1 - np.exp(-t / 0.002)))
    return np.stack([y, y], axis=1)
def v_whale(f, dur, vel, sr, rng, up=7):
    """A humpback-like call: a slow moan that swoops up and falls back, with a hollow formant and a breathy edge."""
    n = int((dur + 0.6) * sr); t = np.arange(n) / sr; u = np.clip(t / dur, 0, 1)
    semis = up * np.sin(np.pi * u) ** 1.5 - 2 * u
    ph = 2 * np.pi * np.cumsum(f * 2 ** (semis / 12) * (1 + 0.004 * np.sin(2 * np.pi * 6 * t))) / sr
    src = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3 * ph) + 0.05 * rng.standard_normal(n)
    y = 0.6 * src + 0.8 * bp(src, 250, 900, sr)
    e = np.sin(np.pi * np.clip(t / (dur + 0.6), 0, 1)) ** 1.2
    y = lp(y * e, 1800, sr); return np.stack([y, 0.9 * y], axis=1)
engine.VOICES.update({'sailor': v_sailor, 'qin': v_qin, 'gu': v_gu, 'whale': v_whale})

PARTS = {
    'strS': SF2('ms', 49, level=-17, verb=0.55, lp=6500), 'vln': SF2('ms', 40, level=-18, verb=0.5, lp=6500), 'fiddle': SF2('ms', 110, level=-17, verb=0.35, lp=6000),
    'cello': SF2('ms', 42, level=-17, verb=0.5), 'cb': SF2('ms', 43, level=-19, verb=0.4), 'trem': SF2('ms', 44, level=-21, verb=0.5, lp=5000),
    'pizz': SF2('ms', 45, level=-20, verb=0.35), 'harp': SF2('ms', 46, level=-18, verb=0.55), 'timp': SF2('ms', 47, level=-18, verb=0.45),
    'horn': SF2('ms', 60, level=-18, verb=0.55, cap=112), 'trb': SF2('ms', 57, level=-20, verb=0.5, cap=110), 'tuba': SF2('ms', 58, level=-21, verb=0.45),
    'flute': SF2('ms', 73, level=-19, verb=0.5, lp=6000), 'clar': SF2('ms', 71, level=-19, verb=0.4, lp=5500), 'bsn': SF2('ms', 70, level=-18, verb=0.4),
    'accord': SF2('ms', 21, level=-17, verb=0.35, lp=5000), 'marimba': SF2('ms', 12, level=-19, verb=0.35, lp=5000),
    'shaku': SF2('ms', 77, level=-18, verb=0.6, lp=5000), 'koto': SF2('ms', 107, level=-19, verb=0.45, lp=5000), 'xiao': SF2('ms', 75, level=-19, verb=0.6, lp=4500),
    'organ': SF2('ms', 20, level=-20, verb=0.5, lp=4500), 'choir': SF2('ms', 52, level=-19, verb=0.7), 'oohs': SF2('ms', 53, level=-20, verb=0.7),
    'sailor': Synth('sailor', level=-21, verb=0.35), 'qin': Synth('qin', level=-17, verb=0.45), 'gu': Synth('gu', level=-19, verb=0.4),
    'whale': Synth('whale', level=-21, verb=0.9), 'sub': Synth('sub', level=-23, verb=0.0, cap=100), 'pad': Synth('pad', level=-25, verb=0.6, cutoff=1300, attack=0.9),
}
sc = Score(DUR, SR, seed=1992)
rng = np.random.default_rng(1992)
def note(part, s, d, p, v=80, h=0.004):
    if s < 0 or s >= DUR: return
    sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, int(max(1, min(127, v))))
def chord(part, s, d, ps, v=76, h=0.004, roll=0.0):
    for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
def line(part, s, ps, step, d=None, v=76):
    for i, p in enumerate(ps):
        if p is not None: note(part, s + i * step, d or step * 0.95, p, v)
def tune(part, s, phrase, beat=BEAT, tr=0, v=80, legato=0.95, upto=None):
    for b, p, l in phrase:
        if upto is not None and b >= upto: break
        note(part, s + b * beat, l * beat * legato, p + tr, v)
def roll(part, s, e, p, v0, v1, step=0.06):
    k = 0; n = max(1, int((e - s) / step))
    while s + k * step < e: note(part, s + k * step, step * 1.2, p, int(v0 + (v1 - v0) * k / n), h=0.002); k += 1
def gliss(part, s, ps, step=0.04, v=70):
    for i, p in enumerate(ps): note(part, s + i * step, 0.5, p, v)
def jig(s, beats, chords, comp='accord', bass='cb', v=60, bassv=70, beat=BEAT):
    """12/8 lilt: the bass on the beat, the chord on the second and third triplet."""
    for i in range(beats):
        root, tones = chords[(i // 2) % len(chords)]; b0 = s + i * beat
        if i % 2 == 0: note(bass, b0, beat * 0.9, root, bassv)
        for k in (1, 2): chord(comp, b0 + k * beat / 3, beat / 3 * 0.8, tones, v - (6 if k == 2 else 0))
def arp(part, s, beats, tones, v=58, beat=BEAT):
    """Rolling triplet arpeggios, up and back down."""
    seq = tones + tones[-2:0:-1]
    for i in range(beats * 3): note(part, s + i * beat / 3, beat * 0.6, seq[i % len(seq)], v - (0 if i % 3 == 0 else 8))

# D Dorian; the theme in beats (one beat = half a second, triplet eighths = a third of a beat)
Dm = (38, [57, 62, 65]); C_ = (36, [55, 60, 64]); Bb = (34, [58, 62, 65]); Am = (45, [57, 60, 64]); G_ = (43, [55, 59, 62]); F_ = (41, [57, 60, 65]); D_ = (38, [57, 62, 66])
T1 = [(0, 62, 1), (1, 69, 2 / 3), (5 / 3, 67, 1 / 3), (2, 65, 2 / 3), (8 / 3, 64, 1 / 3), (3, 62, 1), (4, 60, 2 / 3), (14 / 3, 62, 1 / 3), (5, 64, 2 / 3), (17 / 3, 65, 1 / 3), (6, 69, 2)]
T2 = [(0, 62, 1), (1, 69, 2 / 3), (5 / 3, 72, 1 / 3), (2, 74, 1.5), (3.5, 72, 0.5), (4, 69, 2 / 3), (14 / 3, 67, 1 / 3), (5, 65, 2 / 3), (17 / 3, 64, 1 / 3), (6, 62, 2)]
T2maj = [(b, p + (1 if p % 12 == 5 else 0), l) for b, p, l in T2]       # F → F♯: the answering phrase in D major
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]

# ═══ Hokusai: taiko, shakuhachi, koto
note('gu', 0.0, 1.0, 36, 112); note('sub', 0.0, 1.4, 26, 90); chord('trem', 0.0, HK['drop'], [38, 50, 57], 54)
note('shaku', 0.15, 1.6, 69, 82); note('shaku', 1.25, 0.6, 67, 74); note('shaku', 1.6, 0.4, 65, 70)
for k, p in enumerate([62, 69, 74, 69]): note('koto', 0.5 + k * 0.33, 0.6, p, 64)
roll('timp', HK['drop'] - 0.5, HK['drop'], 38, 40, 90)
d0 = HK['drop'] + 0.33
note('gu', d0, 1.0, 33, 124); note('gu', d0 + 0.17, 1.0, 36, 96); note('timp', d0, 0.8, 38, 116); note('sub', d0, 1.6, 26, 104)
chord('trb', d0, 1.2, [38, 45, 50], 92); chord('horn', d0, 1.0, [50, 57, 62], 86)
gliss('koto', HK['burst'], PENTA, 0.035, 72); gliss('harp', HK['burst'] + 0.1, [p + 12 for p in PENTA[:8]], 0.04, 62)
for k in range(14): note('pizz', HK['burst'] + 0.15 + rng.uniform(0, 1.2), 0.15, int(rng.choice(PENTA)) + 12, 50)
chord('strS', HK['map'], 2.0, [38, 50, 57, 62], 62, h=0); arp('harp', HK['map'], 4, [50, 57, 62, 65], 48)
tune('shaku', HK['map'], T1, upto=4, v=80)
chord('strS', HK['arrive'] + 0.4, 1.6, [41, 53, 57, 60, 65], 66, h=0); note('koto', HK['arrive'], 0.8, 74, 60)
roll('timp', HK['out'] - 0.7, HK['out'], 38, 40, 96)

# ═══ the title: the theme on horns and strings over rolling harp
t0 = TI['t']
note('timp', t0, 0.8, 38, 112); note('sub', t0, 1.6, 26, 98); note('gu', t0, 1.0, 36, 96)
for i, (r, tones) in enumerate([Dm, C_, Bb, C_]): chord('strS', t0 + i * 1.0, 1.05, [r, r + 12] + tones, 76 + (i == 0) * 6, h=0); note('cb', t0 + i * 1.0, 1.0, r, 74)
tune('horn', t0, T1, v=92); tune('vln', t0, T1, tr=12, v=82)
arp('harp', t0, 8, [50, 57, 62, 65, 69], 54); chord('choir', t0, 3.8, [57, 62, 69], 62)

# ═══ Franklin: a sea shanty — fiddle, accordion, stamping feet, a men's chorus
f0 = FR['t']
jig(f0, 2 * int((FR['note'] - f0) / 1.0), [Dm, C_, Dm, Am], v=62, bassv=74)
for k in range(int((FR['note'] - f0) / BEAT)): note('gu', f0 + k * BEAT, 0.4, 45 if k % 2 == 0 else 48, 70 if k % 2 == 0 else 54)
line('fiddle', f0 + 0.1, [69, 67, 65, 64, 62, 64, 65, 67, 69], TRI, v=74)
tune('fiddle', FR['race'], T1, v=88); tune('accord', FR['race'], T1, tr=-12, v=66)
for s in (FR['race'] + 1.0, FR['race'] + 2.0, FR['race'] + 3.0):
    chord('sailor', s, 0.42, [50, 57], 84); chord('sailor', s + 0.5, 0.36, [48, 55], 76)
chord('strS', FR['l3'], 1.2, [34, 46, 58, 62, 65], 70, h=0); chord('strS', FR['l3'] + 1.2, 1.0, [36, 48, 55, 60, 64], 72, h=0)
gliss('harp', FR['paint'], [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74], 0.05, 66)
tune('horn', FR['paint'] + 0.4, T2, upto=4, v=88)
tune('fiddle', FR['l4'], T1[:6], v=86); chord('sailor', FR['l4'] + 0.5, 0.5, [50, 57], 86, h=0)
chord('accord', FR['l4'] + 1.0, 0.25, [57, 62, 65], 74); note('cb', FR['l4'] + 1.0, 0.3, 38, 80)
# "船长们：不信。" — the band stops dead and a bassoon shrugs
note('bsn', FR['note'] + 0.05, 0.32, 45, 84); note('bsn', FR['note'] + 0.42, 0.7, 44, 80)
chord('trem', FR['note'] + 1.0, HO['t'] - FR['note'] - 0.9, [38, 45], 50)

# ═══ Homer: how big is this river?
roll('timp', HO['t'], HO['out'], 38, 40, 104); chord('trb', HO['t'], 2.0, [38, 45, 50, 53], 74, h=0); note('tuba', HO['t'], 2.0, 26, 74)
chord('trem', HO['t'], 2.0, [81, 86], 52); note('sub', HO['t'] + 1.0, 1.0, 26, 70)

# ═══ Swiss: a marimba pulse; each bar lands a bigger chord
for k in range(int((SC['out'] - SC['t']) / TRI)): note('marimba', SC['t'] + k * TRI, 0.12, [62, 69, 74][k % 3] + (0 if k % 6 < 3 else -2), 56 if k % 3 == 0 else 42)
note('harp', SC['rivers'], 0.6, 86, 60)
note('timp', SC['gulf'], 0.6, 38, 92); chord('horn', SC['gulf'], 1.2, [50, 57, 62], 80, h=0); note('cb', SC['gulf'], 1.4, 38, 76)
note('timp', SC['newf'], 0.7, 38, 104); chord('horn', SC['newf'], 1.4, [50, 57, 62, 69], 88, h=0); chord('trb', SC['newf'], 1.4, [38, 45, 50], 86, h=0)
chord('strS', SC['newf'], 1.5, [38, 50, 57, 62], 78, h=0); note('sub', SC['newf'], 1.2, 26, 84)
a0 = SC['acc']
note('gu', a0, 1.0, 33, 118); note('timp', a0, 0.8, 38, 116); note('sub', a0, 1.6, 26, 104)
chord('strS', a0, 0.8, [38, 50, 57, 62, 69, 74], 90, h=0); chord('horn', a0, 0.8, [50, 57, 62, 69], 98, h=0); chord('trb', a0, 0.8, [38, 45, 50, 57], 96, h=0); chord('choir', a0, 0.8, [62, 69, 74], 82)
chord('strS', SC['big'], 0.7, [34, 46, 58, 62, 65, 70], 86, h=0); chord('horn', SC['big'], 0.7, [53, 58, 62, 65], 90, h=0)
chord('strS', SC['big'] + 0.7, 0.75, [36, 48, 60, 64, 67, 72], 86, h=0); chord('horn', SC['big'] + 0.7, 0.75, [55, 60, 64, 67], 90, h=0); chord('choir', SC['big'], 1.4, [62, 65, 70], 76)
note('timp', SC['big'], 0.4, 34, 96); note('timp', SC['big'] + 0.7, 0.4, 36, 100)

# ═══ Bauhaus: a minimal ostinato; each idea adds a layer
w0 = WY['t']
chord('strS', w0, 1.0, [38, 50, 57, 62], 66, h=0); note('cb', w0, 1.0, 38, 70)
note('clar', WY['ask'], 0.4, 57, 76); note('clar', WY['ask'] + 0.45, 0.6, 62, 80)
PAT = [62, 69, 74, 65, 69, 72, 62, 67, 74, 64, 69, 72]
for k in range(int((WY['out'] - WY['wind']) / TRI)):
    s = WY['wind'] + k * TRI; ph = 0 if s < WY['spin'] else 1 if s < WY['ekman'] else 2
    note('marimba', s, 0.12, PAT[(k + ph * 2) % 12], 54 if k % 3 == 0 else 40)
    if k % 6 == 0: note('pizz', s, 0.2, [38, 36, 34, 36][(k // 12) % 4] + 12, 60)
for i in range(4): note('pizz', WY['wind'] + i * 0.12, 0.2, [69, 74, 65, 62][i], 70)
chord('pad', WY['wind'], WY['hill'] - WY['wind'], [50, 57, 62, 64], 46, h=0); note('flute', WY['wind'] + 0.3, 1.6, 74, 56); note('flute', WY['wind'] + 1.9, 1.4, 72, 52)
line('clar', WY['spin'] + 0.2, [62, 64, 65, 67, 69, 72], TRI * 1.5, v=66); chord('strS', WY['spin'], WY['ekman'] - WY['spin'] + 0.3, [38, 50, 57, 64], 62, h=0); line('harp', WY['spin'] + 0.4, [86, 84, 81, 79, 77, 74, 72, 69], 0.13, d=0.4, v=58)
for i, p in enumerate([86, 84, 81, 79, 77, 74, 72, 69, 67]): note('marimba', WY['ekman'] + 0.1 + i * 0.07, 0.3, p, 80 - i * 5)       # Ekman's spiral
for i, p in enumerate([74, 72, 69, 67, 65, 62, 60, 57, 55]): note('harp', WY['ekman'] + 0.1 + i * 0.07, 0.6, p, 70 - i * 4)
note('horn', WY['net'], 0.3, 62, 90); note('horn', WY['net'] + 0.3, 0.9, 67, 94); note('pizz', WY['net'], 0.2, 50, 80)
chord('strS', WY['hill'], 1.0, [34, 46, 58, 62, 65], 64, h=0); chord('strS', WY['hill'] + 1.0, 1.0, [36, 48, 60, 64, 67], 74, h=0); chord('choir', WY['hill'], 2.0, [58, 62, 65], 60)
for i, p in enumerate([62, 69, 67, 65, 64]): note('marimba', WY['gyres'] + i * 0.12, 0.4, p + 12, 86); note('timp', WY['gyres'] + i * 0.12, 0.3, [38, 45, 43, 41, 40][i], 70)
tune('horn', WY['gyres'] + 0.7, T1, upto=3, v=84); chord('strS', WY['gyres'] + 0.7, 1.2, [38, 50, 57, 62], 74, h=0)

# ═══ Kuroshio: the theme on shakuhachi, with koto
k0 = KU['t']
note('gu', k0, 1.0, 36, 92); chord('strS', k0, 3.5, [38, 50, 57, 62], 62, h=0); note('sub', k0, 1.5, 26, 76)
tune('shaku', k0 + 0.2, T2, v=86)
for i in range(int((KU['out'] - k0) / TRI)): note('koto', k0 + i * TRI, 0.3, [50, 57, 62, 65, 62, 57][i % 6], 56 if i % 3 == 0 else 44)

# ═══ the ducks: bassoon and clarinet, pizzicato; a forecast comes true
u0 = DK['t']
jig(u0, int((DK['wa'] - u0) / BEAT), [Dm, C_], comp='pizz', bass='cb', v=56, bassv=64)
tune('bsn', DK['l1'], T1, v=86, legato=0.6); tune('clar', DK['l1'] + 2.0, T1[5:], tr=12, v=70, legato=0.6)
gliss('flute', DK['sitka'], [65, 69, 72, 77, 81], 0.06, 70); chord('strS', DK['sitka'], 1.4, [41, 53, 57, 60, 65], 70, h=0)
for k in range(int((DK['wa'] - DK['model']) / TRI)): note('marimba', DK['model'] + k * TRI, 0.1, [74, 77, 81, 79][k % 4], 52 if k % 3 == 0 else 40)
tune('clar', DK['model'] + 0.2, T2, upto=4, v=72)
chord('horn', DK['wa'], 0.25, [50, 57, 62], 92); chord('horn', DK['wa'] + 0.33, 1.4, [50, 57, 62, 66], 98); chord('strS', DK['wa'] + 0.33, 1.6, [38, 50, 57, 62, 66, 69], 86, h=0)
note('timp', DK['wa'] + 0.33, 0.6, 38, 104); gliss('harp', DK['wa'] + 0.33, [62, 66, 69, 74, 78, 81], 0.05, 66); note('cb', DK['wa'] + 0.33, 1.4, 38, 80)

# ═══ the plastic: the theme bends into Phrygian and sinks
p0 = PL['t']
chord('pad', p0, PL['out'] - p0, [50, 51, 57], 50, h=0); chord('trem', p0, PL['out'] - p0, [38, 39], 48)
tune('clar', PL['l1'], [(b, p - 12 - (1 if p % 12 == 4 else 0), l) for b, p, l in T1], v=74, upto=6)   # E → E♭
note('trb', PL['area'], 1.4, 38, 88); note('tuba', PL['area'], 1.4, 27, 84); note('timp', PL['area'], 0.6, 38, 96)
note('trb', PL['pieces'], 1.2, 39, 86); note('tuba', PL['pieces'], 1.2, 26, 86); note('sub', PL['pieces'], 1.4, 26, 90)
gliss('harp', PL['sink'], [74, 70, 67, 63, 62, 58, 55, 51, 50, 46, 43, 38], 0.07, 62)

# ═══ the deep: whales, a low choir and a drone; the thousand-year loop
e0 = DP['t']
note('sub', e0, DP['out'] - e0, 26, 70); note('cb', e0, DP['loop'] - e0, 26, 66); chord('oohs', e0 + 0.3, DP['loop'] - e0, [50, 57], 58)
note('whale', e0 + 0.4, 2.2, 57, 90); note('whale', e0 + 2.4, 1.8, 62, 84); note('whale', DP['sink'] + 0.3, 2.4, 52, 92)
line('harp', DP['l1'], [38, 45, 50, 53, 57], 0.3, d=1.2, v=54)
note('gu', DP['sink'] + 0.2, 1.0, 31, 96); note('cello', DP['sink'] + 0.2, 1.8, 50, 76); note('cello', DP['sink'] + 2.0, 1.0, 45, 70)
for k in range(int((DP['dyn'][-1] - DP['loop']) / 1.0)): note('cb', DP['loop'] + k * 1.0, 0.8, [38, 45, 43, 41, 40][k % 5], 70)
chord('strS', DP['loop'], DP['dyn'][-1] - DP['loop'], [38, 50, 57], 58, h=0); chord('choir', DP['loop'], DP['dyn'][-1] - DP['loop'], [50, 57, 62], 56)
for i, s in enumerate(DP['dyn'][:-1]):
    note('qin', s, 1.4, [62, 69, 67, 65, 64][i], 92); note('gu', s, 0.8, 38, 70 + i * 4)
s2026 = DP['dyn'][-1]
chord('strS', s2026, 0.9, [41, 53, 57, 60, 65, 69], 84, h=0); chord('choir', s2026, 0.9, [65, 69, 72], 74); gliss('harp', s2026 - 0.3, [57, 60, 65, 69, 72, 77], 0.05, 66); note('qin', s2026, 1.2, 62, 96)

# ═══ Challenger: a Victorian reed organ and a solo cello; the sea remembers
c0 = CH['t']
for i, (r, tones) in enumerate([Dm, Bb, F_, C_, Dm, Bb]): chord('organ', c0 + i * 0.9, 0.95, [r + 12] + tones, 58)
tune('cello', CH['l1'], T1, beat=0.55, tr=-12, v=88)
chord('strS', CH['l3'], CH['memory'] - CH['l3'], [34, 46, 58, 62, 65], 62, h=0)
m0 = CH['memory']
chord('choir', m0, 1.6, [57, 62, 65, 69], 80); chord('strS', m0, 1.6, [38, 50, 57, 62, 65, 69], 80, h=0); note('timp', m0, 0.6, 38, 90); note('sub', m0, 1.4, 26, 84)
tune('horn', m0 + 0.2, T1, upto=3, v=80)

# ═══ AMOC: a heartbeat that slows and fades (the beats are sound design); strings thin out
chord('trem', AM['t'], AM['flat'] - AM['t'], [81, 86], 50); chord('pad', AM['t'], AM['out'] - AM['t'] + 0.4, [50, 57], 44, h=0)
note('cb', AM['t'], AM['flat'] - AM['t'], 38, 58); note('strS', AM['flat'], AM['out'] - AM['flat'] + 0.6, 74, 52)

# ═══ the ending: guqin and 箫; the theme comes back; D major on the most human line; the orchestra carries it home
n0 = EN['t']
chord('pad', n0, EN['back'] - n0 + 0.3, [50, 57, 62], 46, h=0)
for dt, p in [(0.3, 50), (0.8, 57), (1.3, 62), (2.3, 57), (2.8, 62), (3.3, 65)]: note('qin', n0 + dt, 1.4, p, 82)
note('xiao', EN['poem'], 1.6, 69, 80); note('xiao', EN['poem'] + 1.7, 0.6, 67, 72); note('xiao', EN['poem'] + 2.3, 0.9, 65, 72)
b0 = EN['back']
tune('vln', b0, T1, v=86)
for i, (r, tones) in enumerate([Dm, C_, Bb, C_]): chord('strS', b0 + i * 0.8, 0.85, [r, r + 12] + tones, 66 + i * 3, h=0)
arp('harp', b0, 6, [50, 57, 62, 65, 69], 52)
chord('strS', EN['l1'], EN['l2'] - EN['l1'], [34, 46, 58, 62, 65, 70], 72, h=0); chord('oohs', EN['l1'], EN['l2'] - EN['l1'], [58, 62, 65], 60); tune('xiao', EN['l1'] + 0.2, T2, upto=3, v=74)
l2 = EN['l2']
chord('strS', l2, EN['home'] - l2, [38, 50, 57, 62, 66, 69], 82, h=0); chord('choir', l2, EN['home'] - l2, [62, 66, 69], 72); note('qin', l2, 1.6, 62, 92)
note('timp', l2, 0.5, 38, 84); gliss('harp', l2, [62, 66, 69, 74, 78, 81], 0.06, 62); note('cb', l2, EN['home'] - l2, 38, 70)
h0 = EN['home']
note('timp', h0, 0.8, 38, 112); note('sub', h0, 1.8, 26, 98); note('gu', h0, 1.0, 36, 96)
tune('vln', h0, T2maj, v=94); tune('horn', h0, T2maj, tr=-12, v=88); tune('xiao', h0, T2maj, tr=12, v=70)
for i, (r, tones) in enumerate([D_, (43, [55, 59, 62]), (36, [55, 60, 64]), D_]):
    chord('strS', h0 + i * 0.7, 0.75, [r, r + 12] + tones, 84, h=0); note('cb', h0 + i * 0.7, 0.7, r, 80)
chord('choir', h0, 2.8, [62, 66, 69], 78); arp('harp', h0, 5, [50, 57, 62, 66, 69], 56)
for k, p in enumerate([50, 57, 62, 66, 69]): note('qin', h0 + 0.2 + k * 0.17, 1.2, p, 84)
f1 = EN['title']
chord('strS', f1, 2.6, [26, 38, 50, 57, 62, 66, 69, 74], 92, h=0); chord('choir', f1, 2.5, [62, 66, 69, 74], 82); chord('horn', f1, 2.4, [50, 57, 62, 66], 88)
note('timp', f1, 0.9, 38, 108); note('sub', f1, 2.0, 26, 96); gliss('harp', f1 - 0.3, [50, 57, 62, 66, 69, 74, 78, 81, 86], 0.035, 66); note('xiao', f1 + 0.6, 1.8, 74, 70)

# a held note and a new note on the same pitch: end the old one just before the new one starts
for part, evs in sc.ev.items():
    evs.sort(key=lambda e: e[0]); last = {}
    for i, (s0, d, p, v) in enumerate(evs):
        j = last.get(p)
        if j is not None and evs[j][0] + evs[j][1] > s0 - 0.01:
            a = evs[j]; evs[j] = (a[0], max(0.03, s0 - a[0] - 0.012), a[2], a[3])
        last[p] = i
# the band stops dead at 「船长们：不信」: cut everything that would ring past it (except the bassoon and the tremolo)
for part, evs in sc.ev.items():
    if part in ('bsn', 'trem', 'sub'): continue
    sc.ev[part] = [(s, min(d, max(0.03, FR['note'] - s)) if s < FR['note'] < s + d else d, p, v) for s, d, p, v in evs]

music, stems = sc.render(PARTS, kick_part=None)

# ═══ sound design: the sea's own sounds, all soft and low
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
def s_surf(dur=5.0, seed=1, period=3.2):        # waves: a swelling wash that breaks and draws back
    n = int(dur * SR); t = np.arange(n) / SR; ph = (t / period) % 1
    sw = np.where(ph < 0.55, (ph / 0.55) ** 2, np.exp(-(ph - 0.55) / 0.18))
    edge = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.8)
    return np.stack([lp(bp(noise(n, seed + c), 150, 2400), 2600) * (0.25 + sw) * edge for c in range(2)], axis=1)
def s_crash(seed=5):                             # one big wave breaking
    n = int(2.2 * SR); t = np.arange(n) / SR; e = (1 - np.exp(-t / 0.05)) * np.exp(-t / 0.7)
    return np.stack([lp(bp(noise(n, seed + c), 120, 3500), 3800) * e + 0.5 * lp(noise(n, seed + 9 + c), 220) * e for c in range(2)], axis=1)
def s_splash(seed=7):                            # a heavy box into the sea: a thump and a burst of water
    n = int(1.2 * SR); t = np.arange(n) / SR
    w = lp(bp(noise(n, seed), 250, 3500), 4000) * (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.28)
    return st(w) + 1.4 * np.pad(s_thump(80, 38, 0.4), ((0, n - int(0.4 * SR)), (0, 0)))
def s_patter(dur=1.4, seed=9, rate=40):          # the toys landing all around: tiny plops on water
    n = int(dur * SR); x = np.zeros((n, 2)); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 4000, int(dur * rate)):
        m = int(0.05 * SR); tt = np.arange(m) / SR; f = r.uniform(500, 1100) * (1 + 0.8 * tt / 0.05)
        c = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.012) * r.uniform(0.3, 1); pan = r.uniform(-0.8, 0.8)
        x[i:i + m, 0] += c * np.sqrt((1 - pan) / 2); x[i:i + m, 1] += c * np.sqrt((1 + pan) / 2)
    return lp(x, 2200) * np.linspace(1, 0.3, n)[:, None]
def s_paper(dur=0.6, seed=11):                   # an old chart unrolled
    n = int(dur * SR); t = np.arange(n) / SR; g = (np.random.default_rng(seed).random(n) < 0.02) * 1.0
    return st(lp(bp(noise(n, seed), 600, 3000) * (0.3 + lp(g, 60) * 30), 3200) * np.sin(np.pi * t / dur))
def s_creak(seed=13):                            # a wooden hull creaking under sail
    n = int(0.9 * SR); t = np.arange(n) / SR; f = 140 + 60 * np.sin(2 * np.pi * 0.9 * t)
    y = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.random.default_rng(seed).random(n)), 900)
    return st(y * np.sin(np.pi * t / 0.9) ** 2)
def s_stamp():
    return s_thump(110, 60, 0.18) + 0.3 * st(lp(bp(noise(int(0.18 * SR), 15), 300, 2000), 2400) * env(int(0.18 * SR), 0.001, 0.02))
def s_air(dur=0.5, seed=17, lo=200, hi=1600):    # a soft transition breath
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), lo, hi), 2000) * np.sin(np.pi * t / dur) ** 2)
def s_wind(dur=2.4, seed=19):
    n = int(dur * SR); t = np.arange(n) / SR; return st(lp(bp(noise(n, seed), 250, 1400), 1500) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t)) * np.minimum(1, t / 0.5) * np.minimum(1, (dur - t) / 0.7))
def s_squeak():                                  # a rubber duck, squeezed once (soft, filtered)
    n = int(0.28 * SR); t = np.arange(n) / SR; f = 900 + 380 * np.sin(np.pi * t / 0.28) - 200 * t / 0.28
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 34 * t))) * np.sin(np.pi * t / 0.28) ** 0.8
    return st(lp(y + 0.15 * bp(noise(n, 21), 800, 2500), 2600))
def s_bubbles(dur=1.6, seed=23, rate=10):        # low bloops rising
    n = int(dur * SR); x = np.zeros(n); r = np.random.default_rng(seed)
    for i in r.integers(0, n - 6000, int(dur * rate)):
        m = int(0.09 * SR); tt = np.arange(m) / SR; f = r.uniform(250, 600) * (1 + 2.5 * tt / 0.09)
        x[i:i + m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / 0.09) * r.uniform(0.4, 1)
    return st(lp(x, 1400))
def s_deep(dur=4.0, seed=29):                    # the pressure of deep water: a slow low rumble
    n = int(dur * SR); t = np.arange(n) / SR
    return np.stack([lp(noise(n, seed + c), 120) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.25 * t + c)) * np.minimum(1, t / 0.8) * np.minimum(1, (dur - t) / 1.0) for c in range(2)], axis=1)
def s_heart(k=1.0):
    return np.concatenate([s_thump(62, 36, 0.22), np.zeros((int(0.14 * SR), 2)), 0.65 * s_thump(60, 36, 0.2)])

SFX = np.zeros((N, 2)); LOG = []
def put(t, x, db, name, why):
    x = norm(x); i0 = int(t * SR); a, b = max(0, i0), min(N, i0 + len(x))
    if b > a: SFX[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
    LOG.append((round(t, 3), name, db, why))

put(0.0, s_crash(5), -24, 'wave breaking (synth)', 'frame 1: the Great Wave')
put(0.0, s_surf(HK['drop'] + 0.6, 1), -30, 'surf (synth)', '')
put(HK['drop'] + 0.33, s_splash(7), -22, 'container splash (synth)', 'the container hits the sea')
put(HK['burst'], s_patter(1.4, 9), -30, 'toys landing on water (synth)', '28,800 toys scatter')
put(HK['map'] - 0.2, s_air(0.6, 31), -32, 'soft air (synth)', 'the print shrinks into the map')
put(TI['t'] - 0.3, s_air(0.7, 33, 150, 1200), -30, 'soft air (synth)', 'into NASA\'s ocean')
put(TI['t'], s_surf(4.0, 35, 4.0), -34, 'surf (synth)', '')
put(FR['t'] - 0.1, s_paper(0.7, 11), -26, 'chart unrolled (synth)', 'Franklin\'s chart')
put(FR['race'], s_creak(13), -27, 'hull creak (synth)', 'the race begins')
put(FR['note'], s_stamp(), -24, 'stamp (synth)', '「船长们：不信」')
put(HO['t'], s_surf(2.2, 37, 1.6), -25, 'rough sea (synth)', 'Homer\'s Gulf Stream')
put(WY['wind'], s_wind(2.2, 19), -28, 'wind (synth)', 'the winds blow')
put(KU['t'] - 0.3, s_air(0.6, 39, 150, 1200), -32, 'soft air (synth)', 'into the Kuroshio')
put(DK['sitka'], s_squeak(), -25, 'rubber duck squeak (synth)', 'the duck lands at Sitka')
put(PL['sink'], s_bubbles(1.0, 41, 8), -27, 'bubbles (synth)', 'the plastic sinks')
put(DP['t'], s_bubbles(1.8, 23), -30, 'bubbles (synth)', 'the dive')
put(DP['t'] + 0.2, s_deep(DP['out'] - DP['t'], 29), -30, 'deep-water rumble (synth)', '')
for i, (tb, amp) in enumerate([(75.5, 1), (76.2, 0.88), (77.0, 0.76), (77.95, 0.62), (79.05, 0.46)]):
    put(tb - 0.02, s_heart(), -24 + 20 * np.log10(amp), 'heartbeat (synth)', 'the conveyor\'s heartbeat slows' if i == 0 else '')
put(EN['home'] - 0.2, s_surf(DUR - EN['home'] + 0.2, 45, 4.0), -25, 'gentle surf (synth)', 'the duck floats home')

SFX = lp(SFX, 6000)
ir = sc.ir
sfx_mix = SFX + 0.3 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)
x = music + sfx_mix
x = x - 0.2 * sosfilt(butter(2, 80, 'low', fs=SR, output='sos'), x, axis=0) + 0.1 * sosfilt(butter(1, 2500, 'high', fs=SR, output='sos'), x, axis=0)
x = lp(x, 12000)
fade = np.ones(N); f0_ = int((DUR - 1.2) * SR); fade[f0_:] = np.cos(np.linspace(0, np.pi / 2, N - f0_)) ** 2; x *= fade[:, None]
x = compress(x, SR)
meter = pyln.Meter(SR); x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -16.0)
ceil = 10 ** (-1.5 / 20); x = np.tanh(x / ceil) * ceil
LU, PK = meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
m2 = x.mean(1)[::2]; spec = np.abs(np.fft.rfft(m2)) ** 2; fr = np.fft.rfftfreq(len(m2), 2 / SR)
band = lambda a, b: 10 * np.log10(np.sum(spec[(fr >= a) & (fr < b)]) + 1e-9)
print('spectrum dB: ' + ' | '.join(f'{a}-{b}: {band(a, b) - band(200, 1000):+.0f}' for a, b in ((20, 200), (200, 1000), (1000, 3000), (3000, 6000), (6000, 12000))))
sf.write(os.path.join(ROOT, 'public', 'ocean_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
y = sfx_mix / (np.abs(sfx_mix).max() + 1e-9) * 0.7
os.makedirs(os.path.join(ROOT, 'out'), exist_ok=True)
sf.write(os.path.join(ROOT, 'out', 'ocean_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')
def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
diffs = [rms_db(sfx_mix, t) - rms_db(music, t) for t, _, _, why in LOG if why]
hdr = ('# 洋流 — cue sheet (generated by music/ocean.py)\n\nEvery time comes from src/ocean/ocean.json, the file the picture reads. '
       '"vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}. Median SFX vs music: {np.median(diffs):+.1f} dB.\n\n'
       '| t (s) | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'ocean_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
print(f'{len(rows)} cues, median SFX vs music {np.median(diffs):+.1f} dB')
db = [20 * np.log10(np.sqrt(np.mean(x[int(i * SR):int((i + 0.5) * SR)].mean(1) ** 2)) + 1e-9) for i in np.arange(0, DUR, 0.5)]
print('loudness /0.5 s:', ' '.join(f'{d:.0f}' for d in db))

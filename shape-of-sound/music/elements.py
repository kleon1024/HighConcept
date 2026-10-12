"""一次看懂元素周期表 — score and sound design, synced to src/elements/elements.json and table.json.
Run: python3 music/elements_data.py && python3 music/elements.py → public/elements_score.wav, out/elements_cues.md
(STEM_DIR=out/stems_el writes the levelled stems.) The music itself — the theme with gaps — is in music/elements_score.py.
"""
import json, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from engine import Score
from mixutil import jumps, master
from sfxlib import LIB, analyse, fetch_one, harsh
from elements_score import PARTS, BEAT, compose

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'elements', 'elements.json'), encoding='utf-8'))
TB = json.load(open(os.path.join(ROOT, 'src', 'elements', 'table.json'), encoding='utf-8'))
E = TB['elements']; EZ = {e['z']: e for e in E}
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
CU, HI, CO = J['cues'], J['hist'], J['cosmos']
sc = Score(DUR, SR, seed=118)
compose(sc, J, TB)
music_dry, stems = sc.render(PARTS, kick_part='drums')
music = music_dry

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
def env(n, a, d): t = np.arange(n) / SR; return (1 - np.exp(-t / max(a, 1e-4))) * np.exp(-t / d)
def st(x): return np.repeat(x[:, None], 2, axis=1) if x.ndim == 1 else x
def noise(n, seed): return np.random.default_rng(seed).standard_normal(n)
def s_tile(seed=0, f=1500):                    # a ceramic tile set down: a short knock with a pitched body
    n = int(0.09 * SR); t = np.arange(n) / SR
    k = sosfilt(butter(2, [f * 0.6, f * 2.2], 'band', fs=SR, output='sos'), noise(n, seed)) * env(n, 0.0005, 0.012)
    body = np.sin(2 * np.pi * f * t) * env(n, 0.001, 0.025)
    return st(k + 0.5 * body)
def s_drop():                                  # a falling pluck (in key), softer than a library water drop
    n = int(0.16 * SR); t = np.arange(n) / SR; f = 1046 - (1046 - 700) * (1 - np.exp(-t / 0.02))
    return st(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05))
def s_thump(f0=90, f1=52, dur=0.22):
    n = int(dur * SR); t = np.arange(n) / SR; f = f1 + (f0 - f1) * np.exp(-t / 0.04)
    return st(np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env(n, 0.002, dur / 3))
def s_swell(dur=0.8, seed=12):
    n = int(dur * SR); t = np.arange(n) / SR
    return st(lp(sosfilt(butter(2, [300, 3000], 'band', fs=SR, output='sos'), noise(n, seed)), 4000) * (t / dur) ** 2.2)
def s_chirp(t0, t1):
    """A gravitational-wave style inspiral: frequency rises as (tc - t)^(-3/8), amplitude as f^(2/3); shifted up to be heard."""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; tc = (t1 - t0) + 0.004
    f = 38 * ((tc) / (tc - t)) ** (3 / 8); f = np.minimum(f, 900)
    a = (f / f[0]) ** (2 / 3); a /= a.max()
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * a
    x = x + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * a
    fo = int(0.02 * SR); x[-fo:] *= np.linspace(1, 0, fo)
    return st(x)
def s_buzz(dur=2.2):                           # a phone on vibrate
    n = int(dur * SR); t = np.arange(n) / SR
    g = (np.sin(2 * np.pi * 1.5 * t) > 0).astype(float); g = np.convolve(g, np.ones(480) / 480, 'same')
    return st(lp(np.sign(np.sin(2 * np.pi * 150 * t)) * 0.4 + np.sin(2 * np.pi * 150 * t), 1200) * g)
def s_neon(dur=1.8):                           # a neon tube's soft hum
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t) + 0.15 * sosfilt(butter(2, [1500, 3000], 'band', fs=SR, output='sos'), noise(n, 4))
    return st(x * np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.3))

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
L = {k: trim(lib(k)) for k in (1063, 1530, 2369, 2001, 2002, 1101, 1489, 2605, 1120, 424, 754, 1694, 2989, 2365, 498, 2299, 774, 163, 790, 168, 2856, 1317)}

# cold open
for k in range(int(9.9 / 0.5)): put(k * 0.5, L[1063][:int(0.12 * SR)], -36 + (k * 0.2), 'clock tick (1063)', 'the lab clock' if k == 0 else '')
put(1.0, L[1120], -32, 'pop_soft (1120)', 'the metal sample appears')
put(CU['density_show'], L[2856], -31, 'gear lock (2856)', 'the density meter clicks to 4.7')
put(CU['letter_in'], L[1530], -26, 'paper slide (1530)', 'the letter slides in')
put(6.2, L[2369], -31, 'pencil scribble (2369)', 'the letter writes itself', maxlen=0.8); put(7.0, L[2369], -31, 'pencil scribble (2369)', '…应该是 5.9', maxlen=0.8)
put(8.6, L[790], -31, 'riser (790)', 'remeasure: rising into the slam', maxlen=1.4)
put(CU['slam'], L[498], -22, 'deep_hit (498)', 'SLAM: 5.9'); put(CU['slam'], s_thump(110, 55, 0.3), -24, 'low thump (synth)', 'the needle lands')
put(CU['to_grid'][0], s_swell(1.0), -30, 'air swell (synth)', 'the letter becomes the grid')
put(CU['title'], L[2605], -28, 'air_quick (2605)', 'title tiles drop', align='peak')
for i in range(5): put(14.1 + i * 0.09 + 0.18, s_tile(i, 900 + i * 80), -27, 'tile knock (synth)', 'title tile lands')
# history: every tile drops with a knock; Mendeleev's cards; the room laughs at Newlands
for e in E:
    a = e['appear']
    if 18.6 <= a < 56: put(a + 0.12, s_tile(e['z'], 1200 + (e['z'] * 37) % 900), -31 if a < 50 else -33, 'tile knock (synth)', f"{e['s']} drops in" if e['z'] in (6, 15, 31, 21, 32, 2, 118) else '')
put(HI['p'], L[1317], -30, 'bubble (1317)', '1669: phosphorus, from urine')
put(CU['laugh'], lp(L[424], 6000), -29, 'crowd laugh (424)', 'Newlands is laughed at', maxlen=2.2)
put(36.8, L[1101], -29, 'book paging (1101)', 'the table lifts into a deck of cards', maxlen=0.9)
lays = sorted(e['lay'] for e in E if e['lay'])
for i, t0 in enumerate(lays[::3]): put(t0, L[2001], -33 - (i % 3), 'card placement (2001)', 'Mendeleev lays a card' if i == 0 else '', pan=((i % 5) - 2) * 0.15)
for i in range(3): put(41.6 + i * 0.25, L[1120], -32, 'pop_soft (1120)', 'a gap lights up with "?"' if i == 0 else '')
for i in range(3): put(CU['predict'] + i * 0.25, L[2002], -32, 'card flick (2002)', 'prediction card' if i == 0 else '')
for z in ('31', '21', '32'): put(HI['fill'][z], s_thump(120, 70, 0.2), -26, 'tile thump (synth)', f'gap filled: {EZ[int(z)]["s"]}')
for z in ('31', '21', '32'): put(HI['fill'][z] + 0.15, L[2001], -31, 'card placement (2001)', 'name chip lands')
put(55.5, L[2299], -26, 'bass_hit (2299)', '118 — all present')
# map
for z in range(1, 9): put(59.4 + (z - 1) * 0.5, L[1120], -33, 'pop_soft (1120)', 'a proton pops in' if z == 1 else '')
put(61.8, L[790], -33, 'riser (790)', 'counting up to 118', maxlen=1.8)
put(75.4, L[1489], -27, 'whoosh_air (1489)', 'the table unfolds to 32 columns', align='peak'); put(79.6, L[1489], -29, 'whoosh_air (1489)', 'folds back', align='peak', rate=1.2)
for i in range(4): put(80.4 + i * 0.12, L[2001], -32, 'card placement (2001)', 's/d/p/f labels' if i == 0 else '')
# roll call: the music *is* the sound; a soft tile tick doubles each element
for e in E: put(e['roll'], s_tile(e['z'] + 300, 1700), -38, 'tile tick (synth)', 'roll call: each element' if e['z'] == 1 else '')
# neighbourhoods
for d in J['hood']: put(d['t'], L[1489], -31, 'whoosh_air (1489)', f"camera flies to {d['name']}", align='peak', rate=1.1)
put(CU['na_drop'], s_drop(), -30, 'drop pluck (synth)', 'sodium falls'); put(CU['na_drop'] + 0.45, L[754], -27, 'splash (754)', 'into the water')
put(CU['na_drop'] + 0.5, lp(L[1694], 5000), -25, 'short explosion, low-passed (1694)', '砰！')
put(113.5, L[2365], -33, 'electric_pop (2365)', 'Li battery charges')
for i, t0 in enumerate(CU['fireworks']): put(t0, lp(L[2989], 6000), -28 - i, 'fireworks bang (2989)', 'firework: Sr red / Ba green' if i < 2 else 'both', maxlen=1.6)
for tool in J['tools']: put(tool['t'], s_tile(tool['z'], 800), -29, 'tile knock, low (synth)', f"tool: {tool['label']}"); put(tool['t'], L[2001], -33, 'card (2001)', '')
put(133.4, s_buzz(2.2), -33, 'phone vibrate (synth)', 'Nd magnet: phone buzzes')
put(143.0, L[2605], -32, 'air_quick (2605)', 'the electron is snatched', align='peak')
put(147.6, s_neon(1.8), -34, 'neon hum (synth)', 'NEON sign')
put(150.2, L[2856], -33, 'gear lock (2856)', 'the yellow line appears')
put(154.4, L[1120], -32, 'pop_soft (1120)', 'smoke detector')
# cosmos
put(158.0, s_swell(1.6, 20), -29, 'air swell (synth)', 'into the night')
put(CO['bb'], L[774], -24, 'impact_space (774)', 'the Big Bang')
put(CO['stars'], L[168], -30, 'sweep_air (168)', 'stars ignite', align='onset')
put(165.8, L[2299], -26, 'bass_hit (2299)', 'a star explodes')
put(CO['chirp'][0], s_chirp(*CO['chirp']), -26, 'inspiral chirp (synth, f ∝ (tc−t)^−3/8)', 'two neutron stars spiral in')
put(CO['ns'], L[774], -21, 'impact_space (774)', 'they collide: gold'); put(CO['ns'], L[498], -25, 'deep_hit (498)', 'merger body')
put(CO['hm'], L[2365], -32, 'electric_pop (2365)', 'human-made: the lab')
# ending
put(CO['back'][0], s_swell(1.4, 30), -31, 'air swell (synth)', 'back to the paper')
for i in range(18): put(CU['ghost_row'] + i * 0.05, s_tile(i + 500, 2000), -38, 'tile tick (synth)', 'row 8 appears' if i == 0 else '')
put(CU['q119'], L[1120], -31, 'pop_soft (1120)', '119? 120?')
put(CU['endcard'], L[2605], -29, 'air_quick (2605)', 'end card', align='peak')
for i in range(5): put(CU['endcard'] + 0.1 + i * 0.08 + 0.2, s_tile(i + 40, 900 + i * 80), -29, 'tile knock (synth)', 'title tile lands' if i == 0 else '')

SFX = lp(SFX, 9500)
ir = sc.ir
sfx_mix = SFX + 0.15 * np.stack([fftconvolve(SFX[:, ch], ir[:, ch])[:N] for ch in range(2)], axis=1)

# the chirp gets the floor: the band dips under it; the music fades to silence at the end
dk = np.ones(N)
a, b = int(CO['chirp'][0] * SR), int(CO['ns'] * SR); dk[a:b] = 10 ** (-6 / 20)
dk = np.convolve(dk, np.ones(int(0.3 * SR)) / int(0.3 * SR), 'same'); music = music * dk[:, None]
if os.environ.get('STEM_DIR'):
    os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
    for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_music.wav'), music.astype(np.float32), SR)
    sf.write(os.path.join(os.environ['STEM_DIR'], '_sfx.wav'), sfx_mix.astype(np.float32), SR)
x = music + sfx_mix
x = x + 0.4 * sosfilt(butter(1, [1200, 5000], 'band', fs=SR, output='sos'), x, axis=0)
fade = np.ones(N); f0 = int((DUR - 0.8) * SR); fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2; x *= fade[:, None]
x, LU, PK = master(x, SR)
print(f'integrated {LU:.1f} LUFS, peak {PK:.1f} dBFS')
med, mx, jj = jumps(x, SR); print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'elements_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
# a sound-effects-only version for posting with a platform track
y = sfx_mix * 10 ** ((LU - LU) / 20); y = y / (np.abs(y).max() + 1e-9) * 0.7
sf.write(os.path.join(ROOT, 'out', 'elements_sfx_only.wav'), y.astype(np.float32), SR, subtype='PCM_16')

def rms_db(y, t, w=0.35):
    a, b = max(0, int(t * SR)), min(N, int((t + w) * SR)); return 20 * np.log10(np.sqrt(np.mean(y[a:b] ** 2)) + 1e-9)
rows = [f'| {t:6.2f} | {int(t // 2) + 1}.{(t % 2) / BEAT + 1:.2f} | {why} | {name} | {db:.0f} | {rms_db(sfx_mix, t) - rms_db(music, t):+.1f} |' for t, name, db, why in sorted(LOG) if why]
hdr = ('# 元素周期表 — cue sheet (generated by music/elements.py)\n\nEvery time comes from src/elements/elements.json and table.json, '
       'the same files the picture reads. Bars are 2 s (120 BPM). "vs music" = RMS of the SFX bus minus the music over the next 0.35 s.\n\n'
       f'Master: {LU:.1f} LUFS integrated, peak {PK:.1f} dBFS; biggest 0.2-s jumps {jj}.\n\n'
       '| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |\n|---|---|---|---|---|---|\n')
open(os.path.join(ROOT, 'out', 'elements_cues.md'), 'w', encoding='utf-8').write(hdr + '\n'.join(rows) + '\n')
used = sorted({int(n.split('(')[1].split(')')[0]) for _, n, _, _ in LOG if '(' in n and n.split('(')[1].split(')')[0].isdigit()})
for i in used:
    an = analyse(os.path.join(LIB, f'{i}.wav')); print(f'sfx {i}: hf {an["hf"]:.3f} tonal {an["tonal"]:.2f} ring {an["ring"]} harsh={harsh(an)}')
print('wrote public/elements_score.wav, out/elements_sfx_only.wav and out/elements_cues.md')

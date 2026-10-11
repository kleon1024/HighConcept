"""失真 DISTORTION — 30 s metal score (160 BPM), composed to the beat sheet in CONCEPT.md.

Sources: FreePats DI electric guitar (CC0) re-amped by the numpy amp below, FreePats picked bass (CC0), FreePats
MuldjordKit acoustic metal kit (CC BY 4.0), SFX from the shared library by numeric id (read-only).
The shared engine (shape-of-sound/music/engine.py) is imported read-only for SF2 rendering, levelling and the reverb;
its FONTS table is only extended in this process's memory.

usage: python3 music/score.py   ->  build/music.wav, build/timeline.json, build/stems/*.wav
"""
import os, sys, json, tempfile
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly, fftconvolve

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
sys.path.insert(0, '/home/user/HighConcept/shape-of-sound/music')
import engine                                    # noqa: E402  (read-only use)
from engine import Score, SF2                    # noqa: E402
import mixutil                                   # noqa: E402
from sfx import Sfx                              # noqa: E402

SNDS = os.path.join(ROOT, 'sounds')
engine.FONTS.update({                            # runtime-only additions (absolute paths)
    'di': os.path.join(SNDS, 'EGuitarFSBS-direct-SF2-20220911/EGuitarFSBS-direct SF2-20220911/EGuitarFSBS-direct bridge 20220911.sf2'),
    'pbass': os.path.join(SNDS, 'PickedBassYR-SF2-20190930/PickedBassYR SF2-20190930/PickedBassYR 20190930.sf2'),
    'mkit': os.path.join(SNDS, 'MuldjordKit-SF2-20201018/MuldjordKit-SF2-20201018/MuldjordKit 20201018.sf2'),
})

SR, DUR = 48000, 30.0
BPM = 160.0; BEAT = 60 / BPM; S16 = BEAT / 4; BAR = 4 * BEAT; T0 = 0.75
def T(bar, pos=0.0): return T0 + (bar - 1) * BAR + pos * S16

# ───────────────────────── arrangement
CH = {'E5': [40, 47, 52], 'F5': [41, 48, 53], 'G5': [43, 50, 55], 'A5': [45, 52, 57], 'Bb5': [46, 53, 58],
      'C5': [48, 55, 60], 'D5': [50, 57, 62], 'B5': [47, 54, 59], 'EF': [40, 47, 52, 59, 64]}
PM = 'pm'
A1 = [(0, 2, 'E5'), (2, 1, PM), (3, 1, PM), (4, 1, PM), (5, 1, PM), (6, 2, 'G5'), (8, 1, PM), (9, 1, PM), (10, 2, 'A5'), (12, 1, PM), (13, 1, PM), (14, 1, 'Bb5'), (15, 1, 'A5')]
A2 = [(0, 2, 'E5'), (2, 1, PM), (3, 1, PM), (4, 1, PM), (5, 1, PM), (6, 2, 'G5'), (8, 1, PM), (9, 1, PM), (10, 3, 'D5'), (13, 1, 'C5'), (14, 2, 'Bb5')]
STOP = [(4, 2, 'E5'), (10, 2, 'G5')]                                          # 1958: stabs on the pencil jabs
B1 = [(0, 2, 52), (2, 1, 52), (3, 1, 55), (4, 2, 57), (6, 1, 58), (7, 1, 57), (8, 2, 55), (10, 1, 52), (11, 1, 50), (12, 2, 52), (14, 2, 47)]
B2 = [(0, 2, 52), (2, 1, 52), (3, 1, 55), (4, 2, 57), (6, 1, 58), (7, 1, 57), (8, 2, 55), (10, 1, 58), (11, 1, 57), (12, 4, 'E5')]
C1 = [(0, 3, 'E5'), (3, 1, PM), (4, 2, PM), (6, 2, 'G5'), (8, 3, 'A5'), (11, 1, PM), (12, 2, 'G5'), (14, 2, 'F5')]
C2 = [(0, 3, 'E5'), (3, 1, PM), (4, 2, PM), (6, 2, 'G5'), (8, 3, 'A5'), (11, 1, PM), (12, 4, 'Bb5')]
def gallop(chords):                                                           # one accent + 3 palm-mutes per beat
    out = []
    for b, c in enumerate(chords):
        if c is None: continue
        out += [(4 * b, 1, c), (4 * b + 1, 1, PM), (4 * b + 2, 1, PM), (4 * b + 3, 1, PM)]
    return out
G1 = gallop(['E5', 'E5', 'E5', None]) + [(12, 2, 'G5'), (14, 2, 'A5')]
G2 = gallop(['E5', 'E5', 'G5', 'A5'])
G3 = gallop(['E5', 'E5', 'C5', 'D5'])
BUILD = [(i, 1, c) for i, c in enumerate(['C5'] * 4 + ['D5'] * 4 + ['E5'] * 4 + ['G5'] * 3)]  # tremolo; last 16th silent

SECTIONS = [  # (bar, pattern)
    (2, A1), (3, A2), (4, A1), (5, A2), (6, STOP), (7, A1), (8, B1), (9, B2), (10, C1), (11, C2),
    (12, G1), (13, G2), (14, G2), (15, G3), (16, BUILD)]

# rhythm-guitar gain (dB into the clipper) follows the history
GAIN_KEYS = [(0.0, 34), (2.25, 34), (2.30, 0), (4.4, 30), (5.25, 30), (5.30, 17), (11.25, 18), (13.9, 40), (14.25, 34),
             (17.2, 34), (17.25, 42), (30.0, 42)]
def gain_env(n):
    t = np.arange(n) / SR; k = np.array(GAIN_KEYS)
    return np.interp(t, k[:, 0], k[:, 1])

LEAD = [(0, 1, 76), (1, 1, 74), (2, 1, 71), (3, 1, 74), (4, 1, 76), (5, 1, 79), (6, 1, 76), (7, 1, 74), (8, 1, 71), (9, 1, 69),
        (10, 1, 67), (11, 1, 69), (12, 1, 71), (13, 1, 74), (14, 2, 76)], \
       [(0, 2, 77), (2, 2, 76), (4, 1, 74), (5, 1, 76), (6, 2, 79), (8, 8, 76)]

# ───────────────────────── DSP: biquads + amp
def peq(f0, g, q):
    A = 10 ** (g / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A])
    return np.concatenate([b / a[0], a / a[0]])[None, :]
def shelf(f0, g, kind='low'):
    A = 10 ** (g / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / 2 * np.sqrt(2); c = np.cos(w); s = 2 * np.sqrt(A) * al
    if kind == 'low':
        b = [A * ((A + 1) - (A - 1) * c + s), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - s)]
        a = [(A + 1) + (A - 1) * c + s, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - s]
    else:
        b = [A * ((A + 1) + (A - 1) * c + s), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - s)]
        a = [(A + 1) - (A - 1) * c + s, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - s]
    b, a = np.array(b), np.array(a); return np.concatenate([b / a[0], a / a[0]])[None, :]
bw = lambda o, f, k: butter(o, f, k, fs=SR, output='sos')
def chain(x, *sos):
    for s in sos: x = sosfilt(s, x)
    return x

def envelope(x, rel=0.045):
    """Peak-hold (4 ms) + one-pole smoothing: the DI's playing envelope, used to key the noise gate."""
    from scipy.ndimage import maximum_filter1d
    pk = maximum_filter1d(np.abs(x), size=int(0.004 * SR))
    return sosfilt(bw(1, 1 / (rel * 2 * np.pi), 'low'), pk)

def amp(di, gain_db, pm=False, mode='metal', drive2=2.6, bias=0.28):
    """Pre-EQ -> 4x oversampled two-stage asymmetric clipper -> tone stack -> 4x12-ish cab -> noise gate."""
    x = chain(di, bw(2, 95 if mode == 'metal' else 70, 'high'), peq(780, 6.0, 0.7), bw(1, 5200, 'low'))
    if pm: x = chain(x, bw(2, 900, 'low'))                          # palm-muted: darker into the clipper
    g = 10 ** (np.asarray(gain_db) / 20) if np.ndim(gain_db) else 10 ** (gain_db / 20)
    u = resample_poly(x * g, 4, 1)
    y = np.tanh(u + bias) - np.tanh(bias)                           # stage 1: asymmetric (even harmonics)
    y = sosfilt(butter(1, 25, 'high', fs=4 * SR, output='sos'), y)                 # DC from the bias
    y = sosfilt(butter(2, 9000, 'low', fs=4 * SR, output='sos'), y)
    y = np.tanh(drive2 * y)                                         # stage 2: power-amp style
    y = resample_poly(y, 1, 4)
    y = chain(y, shelf(110, 1.0, 'low'), peq(450, -4.0, 0.8), peq(2400, 4.5, 0.9),     # tone stack: scoop + presence
              bw(2, 88, 'high'), peq(120, 2.0, 1.3), bw(4, 5600, 'low'), bw(2, 8500, 'low'))  # 4x12-ish cab
    env = envelope(di); thr = np.percentile(env[env > 1e-6], 30) * 0.35
    gate = np.clip((env - thr * 0.5) / (thr * 0.5 + 1e-12), 0, 1)
    gate = sosfilt(bw(1, 60, 'low'), gate)
    return y * gate

def vibrato_delay(x, t_on, t_off, depth_ms=0.6, rate=6.0):
    """Pitch vibrato on [t_on, t_off] via a modulated delay line."""
    n = len(x); t = np.arange(n) / SR
    w = np.clip((t - t_on) / 0.25, 0, 1) * (t < t_off)
    d = (depth_ms / 1000) * SR * (0.5 + 0.5 * np.sin(2 * np.pi * rate * (t - t_on))) * w
    idx = np.arange(n) - d; i0 = np.floor(idx).astype(int); fr = idx - i0
    i0 = np.clip(i0, 0, n - 2)
    return x[i0] * (1 - fr) + x[i0 + 1] * fr

def delay_fx(x, dt, fb=0.3, mix=0.25, lp=3500):
    n = int(dt * SR); y = np.zeros_like(x); buf = x.copy()
    for k in range(1, 5):
        buf = sosfilt(bw(1, lp, 'low'), np.concatenate([np.zeros(n), buf[:-n]])) * fb ** (1 if k == 1 else 1)
        y += buf * (fb ** (k - 1))
    return x + mix * y

def level(x, db):
    return x * 10 ** ((db - Score._active_db(x if x.ndim == 2 else np.stack([x, x], 1), SR)) / 20)

def pan(x, p):
    return np.stack([x * np.sqrt((1 - p) / 2) * np.sqrt(2), x * np.sqrt((1 + p) / 2) * np.sqrt(2)], 1)

# ───────────────────────── score
def build():
    sc = Score(DUR, SR, seed=1964)
    rng = np.random.default_rng(7)
    timeline = {'bpm': BPM, 't0': T0, 'bar': BAR, 'hits': [], 'sections': []}

    def gtr_event(name_open, name_pm, s, d, c, vel, jitter):
        j = rng.normal(0, jitter)
        if c == PM:
            sc.chord(name_pm, s + j, d * 0.85, [40, 47], vel - 18)
        elif isinstance(c, int):
            sc.note(name_open, s + j, d * 0.95, c, vel)
        else:
            sc.chord(name_open, s + j, d * 0.97, CH[c], vel)

    for side, jit in (('L', 0.004), ('R', 0.006)):
        o, p = 'gtr' + side, 'pm' + side
        gtr_event(o, p, T(1), BAR * 0.98, 'E5', 122, 0.002)                     # the slam (bar 1, rings)
        for bar, pat in SECTIONS:
            for pos, ln, c in pat:
                gtr_event(o, p, T(bar, pos), ln * S16, c, 112 if c != PM else 104, jit)
        gtr_event(o, p, T(17), 4.0, 'EF', 124, 0.002)                          # FINAL CHORD 24.75 s

    # bass: roots, one octave below; 16ths under the palm mutes
    def root(c): return (CH[c][0] if isinstance(c, str) else c - 12) - 12
    sc.note('bass', T(1), BAR * 0.95, 28, 118)
    for bar, pat in SECTIONS:
        if bar < 3: continue                                                       # bass enters on bar 3 (clip demo builds)
        for pos, ln, c in pat:
            sc.note('bass', T(bar, pos), ln * S16 * 0.9, 28 if c == PM else max(28, root(c)), 104 if c == PM else 116)
    sc.note('bass', T(17), 4.0, 28, 122)

    # drums (MuldjordKit map: 48/49 kicks, 50 snare, 52 hat, 53 open hat, 54 ride, 58/59 crash, 60 china, 61-64 toms)
    D = 'drums'
    def hit(t, k, v): sc.note(D, t, 0.4, k, v)
    for k in (48, 49): hit(T(1), k, 124)
    for k in (58, 59, 60): hit(T(1), k, 118)
    for i, k in enumerate((61, 62, 63, 64)): hit(T(1, 12 + i), k, 96 + 6 * i)
    for bar, pat in SECTIONS:
        if bar in (2, 4, 8, 10, 12): hit(T(bar), 58 if bar % 4 else 59, 112)
        if bar >= 12:                                                              # double kick 16ths
            for i in range(16 if bar < 16 else 15): hit(T(bar, i), 48 + (i % 2), 92 + (8 if i % 4 == 0 else 0))
            if bar < 16:
                hit(T(bar), 60, 100)
                for q in range(4): hit(T(bar, 4 * q), 54, 92)
        else:
            for pos, ln, c in pat:
                if c != PM or pos % 2 == 0: hit(T(bar, pos), 48 + (int(pos) % 2), 104 if c != PM else 92)
            cymbal = 54 if bar in (4, 5) else 52                                  # 1951: ride, otherwise hats
            if bar != 6:
                for e in range(8): hit(T(bar, 2 * e), cymbal, 78 + (10 if e % 2 == 0 else 0))
        if bar == 16:
            for i in range(15): hit(T(16, i), 50, int(60 + 60 * i / 14))          # snare build
        elif bar != 6:
            hit(T(bar, 4), 50, 114); hit(T(bar, 12), 50, 116)
    for k in (48, 49): hit(T(5), k, 124)                                           # 1951 landing
    hit(T(5), 64, 118); hit(T(5), 59, 114)
    for t in (T(6, 4), T(6, 10), T(7)):                                            # 1958 jabs
        hit(t, 48, 116); hit(t, 50, 100)
    hit(T(7), 58, 110)
    for k in (48, 49, 64): hit(T(17), k, 126)
    for k in (58, 59, 60): hit(T(17), k, 124)

    timeline['hits'] = sorted(set(round(x, 4) for x in [T(1), T(2), T(4), T(5), T(6), T(6, 4), T(6, 10), T(7), T(8), T(10), T(12), T(14), T(16), T(17)]))
    timeline['jabs'] = [T(6, 4), T(6, 10), T(7)]
    timeline['sections'] = [{'name': n, 't': t} for n, t in [('hook', 0), ('slam', T(1)), ('clip', T(2)), ('1951', T(4)), ('land', T(5)),
                                                           ('1958', T(6)), ('1962', T(8)), ('1964', T(10)), ('dive', T(12)), ('wall', T(13)),
                                                           ('solo', T(14)), ('build', T(16)), ('final', T(17))]]
    timeline['gain_keys'] = GAIN_KEYS

    # lead (bars 14-15)
    for bar, phrase in zip((14, 15), LEAD):
        for pos, ln, p in phrase:
            sc.note('lead', T(bar, pos), ln * S16 * (0.98 if ln < 8 else 1.0), p, 110)

    parts_sf = {'gtrL': SF2('di', 0), 'gtrR': SF2('di', 0), 'pmL': SF2('di', 0), 'pmR': SF2('di', 0), 'lead': SF2('di', 0)}
    raw = {}
    with tempfile.TemporaryDirectory() as work:
        for name, part in parts_sf.items():
            raw[name] = sc._stem(name, part, work).mean(1)

    N = sc.N; ge = gain_env(N)
    stems = {}
    for side, p_ in (('L', -0.92), ('R', 0.92)):
        tilt = 1.0 if side == 'L' else 0.985
        op = amp(raw['gtr' + side], ge * tilt, bias=0.28 if side == 'L' else 0.22)
        pm = amp(raw['pm' + side], ge * tilt + 2, pm=True, bias=0.28 if side == 'L' else 0.22)
        g = op + 0.9 * pm
        stems['gtr' + side] = pan(level(g, -13.0), p_)
    ld = amp(raw['lead'], 40.0, drive2=3.0)
    ld = vibrato_delay(ld, T(15, 8) + 0.05, T(17))
    ld = chain(ld, bw(2, 4200, 'low'), peq(1400, 2.5, 1.0))
    ld = delay_fx(ld, BEAT * 0.75, fb=0.35, mix=0.28)
    stems['lead'] = pan(level(ld, -12.5), 0.12)

    # drums + bass through the engine (levelled stems + shared reverb)
    mix_db, eng_stems = sc.render({'drums': SF2('mkit', 0, drum=False, level=-11.5, verb=0.16, cap=127),
                                   'bass': SF2('pbass', 0, level=-15.0, verb=0.0, hp=38, cap=127)}, verb_return=0.30)
    bass = eng_stems['bass']; bass = np.tanh(2.2 * bass / (np.abs(bass).max() + 1e-9)) * np.abs(bass).max()
    bass = sosfilt(bw(2, 3800, 'low'), bass, axis=0)
    bass = sosfilt(bw(2, 45, 'high'), bass, axis=0); bass = sosfilt(peq(850, 3.0, 1.0), bass, axis=0)   # less sub, more growl
    stems['bass'] = level(bass, -15.5)
    drum_mix = mix_db - eng_stems['bass']                                          # drums + their reverb tail
    drum_mix = sosfilt(bw(2, 42, 'high'), drum_mix, axis=0); drum_mix = sosfilt(peq(70, -2.0, 1.0), drum_mix, axis=0)
    stems['drums'] = drum_mix

    # amp hum (pickup and tail) + a soft feedback tone on the two big chords
    t = np.arange(N) / SR
    hum = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.35 * np.sin(2 * np.pi * 180 * t) + 0.12 * np.sin(2 * np.pi * 300 * t))
    hum_env = np.interp(t, [0, 0.05, 0.7, 0.8, 26.5, 28.0, 29.6, 30], [0, 1, 1, 0.25, 0.0, 0.8, 0.5, 0])
    stems['hum'] = pan(hum * hum_env * 0.012, 0)
    fbk = np.zeros(N)
    for (a, b, f) in ((T(1) + 0.35, T(2) - 0.05, 659.26), (T(17) + 0.6, 29.0, 493.88)):
        m = (t >= a) & (t < b); tt = t[m] - a
        sw = np.clip(tt / 0.6, 0, 1) ** 2 * np.clip((b - a - tt) / 0.5, 0, 1)
        fbk[m] += np.sin(2 * np.pi * f * tt + 0.15 * np.sin(2 * np.pi * 5.5 * tt)) * sw
    fbk = np.tanh(1.6 * fbk); fbk = chain(fbk, bw(2, 2500, 'low'))
    stems['feedback'] = pan(fbk * 0.035, -0.2)

    # ending fade: final chord rings, then a breath
    fade = np.interp(t, [0, 26.6, 28.6, 30], [1, 1, 0.0, 0.0])
    for k in ('gtrL', 'gtrR', 'bass', 'lead', 'feedback'): stems[k] = stems[k] * fade[:, None]
    stems['drums'] = stems['drums'] * np.interp(t, [0, 27.2, 29.4, 30], [1, 1, 0, 0])[:, None]

    # guitar room (shared IR)
    ir = sc.ir
    gsend = stems['gtrL'] + stems['gtrR'] + 1.6 * stems['lead']
    wet = np.stack([fftconvolve(gsend[:, ch], ir[:, ch])[:N] for ch in range(2)], 1) * 0.10

    # ───── SFX (shared library, read-only, by id; nothing harsh, all low-passed on the bus)
    fx = Sfx(DUR, SR)
    fx.play(0.20, '2792', -18.0, align='peak')            # razor swipe across the cone (blade crosses 0.0-0.42 s)
    fx.play(0.10, '2996', -24.0, align='onset', rate=0.85)  # paper cone tearing
    fx.play(T(2), '168', -24.0, align='peak')             # T1 zoom-through the wound
    fx.play(T(4), '1092', -23.0, align='peak')            # T2 rewind (the slash heals)
    fx.play(T(5), '752', -20.0, align='onset')            # 1951: the speaker lands
    fx.play(T(5) + 0.35, '386', -28.0, align='onset')     #   … paper stuffed in the cone
    fx.play(T(6), '2951', -26.0, align='onset')           # T3 slice cut
    for tj in timeline['jabs']: fx.play(tj, '2182', -24.0, align='onset')   # pencil jabs (wood)
    fx.play(11.625, '3049', -21.0, align='onset')         # 1962: stomp on the box (footswitch on beat 2)
    fx.play(14.80, '2792', -20.0, align='peak')           # 1964: the razor again (blade crosses 14.58-15.02 s)
    fx.play(T(12), '166', -23.0, align='peak')            # T6 dive
    fx.play(T(16) + 0.2, '790', -27.0, align='onset', maxlen=1.25)   # riser into the final chord
    sfxbus = fx.mix(ir, verb=0.12, lp=7000)

    mix = sum(stems.values()) + wet + sfxbus
    mix = sosfilt(bw(2, 30, 'high'), mix, axis=0)
    # gentle master: no air shelf (no harsh highs); trim mud, compress, normalise to -16 LUFS
    mix = sosfilt(peq(320, -1.5, 0.9), mix, axis=0)
    out, lufs, peak = mixutil.master(mix, SR, lufs=-16.0, ceiling_db=-1.2, eq=False)
    med, mx, js = mixutil.jumps(out, SR)
    os.makedirs(os.path.join(ROOT, 'build', 'stems'), exist_ok=True)
    sf.write(os.path.join(ROOT, 'build', 'music.wav'), out.astype(np.float32), SR)
    for k, v in stems.items(): sf.write(os.path.join(ROOT, 'build', 'stems', k + '.wav'), v.astype(np.float32), SR)
    sf.write(os.path.join(ROOT, 'build', 'stems', '_sfx.wav'), sfxbus.astype(np.float32), SR)
    timeline['sfx'] = fx.log
    json.dump(timeline, open(os.path.join(ROOT, 'build', 'timeline.json'), 'w'), indent=1)
    print(f'LUFS {lufs:.2f}  peak {peak:.2f} dBFS  median {med:.1f}  max {mx:.1f}  jumps {js}')

if __name__ == '__main__':
    build()

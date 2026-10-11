"""Nobel 2026 vertical video — soundtrack synced to src/nobel/nobel.json. Run: python3 music/nobel.py → public/nobel_score.wav"""
import json, os, subprocess
import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'nobel', 'nobel.json')))
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
rng = np.random.default_rng(11)
TPB = 480; tk = lambda s: int(round(s * 2 * TPB))
ev = []
def msg(s, o, m): ev.append((tk(s), o, m))
def note(ch, s, d, p, v=90):
    v = int(max(1, min(127, v + rng.integers(-3, 4))))
    msg(s, 2, mido.Message('note_on', channel=ch, note=int(p), velocity=v)); msg(s + max(0.03, d) - 0.003, 0, mido.Message('note_off', channel=ch, note=int(p), velocity=0))
def chord(ch, s, d, ps, v=85):
    for p in ps: note(ch, s, d, p, v)
DR = 9; KICK, SNARE, CLAP, HAT, OHAT, CRASH, WOOD, LTOM, RIDE = 36, 38, 39, 42, 46, 49, 76, 45, 51
PLK, PAD, BASS, BRASS, CEL, PNO, STR, ARP = 0, 1, 2, 3, 4, 5, 6, 7
for ch, p in [(PLK, 45), (PAD, 89), (BASS, 38), (BRASS, 62), (CEL, 8), (PNO, 0), (STR, 48), (ARP, 81)]:
    msg(0, 0, mido.Message('program_change', channel=ch, program=p))
for ch in range(16):
    msg(0, 1, mido.Message('control_change', channel=ch, control=91, value=50))

D = 62  # D4
prog = [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]]   # D A Bm G
def bars(s0, s1, drums='full', arp=True, chords=PAD):
    t, i = s0, 0
    while t < s1 - 1e-6:
        ch = prog[(i // 4) % 4]   # one chord per bar (4 beats = 2 s)
        if i % 4 == 0:
            chord(chords, t, 2.0, [D + n for n in ch], 70); note(BASS, t, 0.45, D - 24 + ch[0], 105)
        else:
            note(BASS, t, 0.45, D - 24 + ch[0] + (12 if i % 2 else 0), 95)
        if drums == 'full':
            note(DR, t, 0.1, KICK, 110)
            if i % 2 == 1: note(DR, t, 0.1, CLAP, 100)
            note(DR, t + 0.25, 0.05, HAT, 65); note(DR, t, 0.05, HAT, 45)
        elif drums == 'half':
            if i % 4 == 0: note(DR, t, 0.1, KICK, 100)
            if i % 4 == 2: note(DR, t, 0.1, SNARE, 80)
            note(DR, t, 0.05, RIDE, 50)
        if arp:
            for k in range(4):
                note(ARP, t + k * 0.125, 0.11, D + 12 + ch[(i + k) % 3] + (12 if k == 3 else 0), 60)
        t += 0.5; i += 1

H, CARDS, E, O = J['hook'], J['cards'], J['econ'], J['outro']
# hook: ding, swell, drums enter at 2.0
note(CEL, 0.15, 1.5, D + 24, 100); note(CEL, 0.55, 1.2, D + 19, 90); note(CEL, 1.05, 1.0, D + 21, 90)
chord(PAD, 0.0, 4.0, [D - 12, D, D + 4, D + 7], 70)
bars(2.0, H['end'], drums='full', arp=False)
for c in CARDS:
    s, e = c['start'], c['end']
    note(DR, s, 1.5, CRASH, 110); chord(BRASS, s, 0.35, [D - 12, D, D + 7], 105)
    style = {'medicine': ('full', True, PAD), 'physics': ('full', True, PAD), 'chemistry': ('full', True, PLK),
             'literature': ('half', False, PNO), 'peace': ('full', True, STR)}[c['id']]
    bars(s, e, *style)
    if c['id'] == 'medicine':
        for k in range(7): note(CEL, s + 1.2 + k, 0.3, D + 26, 95)            # light ON blips
    if c['id'] == 'physics':
        for t0 in (s + 1.0, s + 4.3):
            for k in range(8): note(CEL, t0 + k * 0.17, 0.4, D + 14 + [0, 4, 7, 12, 16, 19, 24, 28][k], 80)
    if c['id'] == 'chemistry':
        for k in range(5): note(PLK, s + 2.6 + k * 0.6, 0.4, D + 12 + k * 3, 105); note(CEL, s + 2.6 + k * 0.6, 0.4, D + 24 + k * 3, 80)
    if c['id'] == 'literature':
        for k in range(8): note(PNO, s + 1.4 + k * 0.32, 0.8, D + [0, 4, 7, 9, 12, 9, 7, 4][k] + 12, 75)
        chord(STR, s, 8.0, [D - 12, D, D + 7], 60)
    if c['id'] == 'peace':
        for h in (s + 2.6, s + 3.1): note(DR, h, 0.2, LTOM, 120); note(DR, h, 0.1, WOOD, 115)
        chord(BRASS, s + 4.0, 3.8, [D - 12, D - 5, D, D + 4], 85)
# economics: drums drop out, a ticking clock and a held question
chord(PAD, E['start'], 4.0, [D - 10, D - 3, D + 2, D + 5], 75)   # E minor-ish suspension
for k in range(16): note(DR, E['start'] + k * 0.25, 0.05, WOOD, 70 + (k % 4 == 0) * 30)
note(BASS, E['start'], 4.0, D - 22, 85)
# outro: home chord, the motif
note(DR, O['start'], 2.0, CRASH, 115); chord(BRASS, O['start'], 1.0, [D - 12, D, D + 4, D + 7], 110)
chord(STR, O['start'], 3.8, [D - 12, D, D + 4, D + 7, D + 12], 90); note(BASS, O['start'], 3.6, D - 24, 105)
for k, p in enumerate([24, 19, 21, 24, 28]): note(CEL, O['start'] + 0.4 + k * 0.4, 1.0, D + p, 85)
note(DR, O['start'], 0.1, KICK, 115)

mid = mido.MidiFile(ticks_per_beat=TPB); trk = mido.MidiTrack(); mid.tracks.append(trk)
trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
last = 0
for t, _, m in sorted(ev, key=lambda x: (x[0], x[1])): trk.append(m.copy(time=t - last)); last = t
trk.append(mido.MetaMessage('end_of_track', time=tk(DUR + 2) - last))
mid.save(os.path.join(OUT, 'nobel.mid'))
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.55', '-r', str(SR), '-R', '1', '-C', '0', '-o', 'synth.reverb.level=0.45',
                '-F', os.path.join(OUT, 'nobel_orch.wav'), SF2, os.path.join(OUT, 'nobel.mid')], check=True)
x, _ = sf.read(os.path.join(OUT, 'nobel_orch.wav'), always_2d=True)
x = np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]
# whooshes into every card and the economics / outro beats
def whoosh(d=0.4):
    n = int(d * SR); w = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 1024):
        fc = 300 * (7000 / 300) ** (i / n); out[i:i + 1024] = sosfilt(butter(2, [fc * 0.6, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos'), w[i:i + 1024])
    return out * np.sin(np.pi * np.arange(n) / n) ** 2
for s in [c['start'] for c in CARDS] + [E['start'], O['start']]:
    i0 = int((s - 0.38) * SR); w = whoosh(); x[i0:i0 + len(w)] += (w * 0.22)[:, None]
meter = pyln.Meter(SR)
x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -14.0)
ceil = 10 ** (-1.2 / 20); x = np.tanh(x / ceil) * ceil
print(f'integrated {meter.integrated_loudness(x):.1f} LUFS, peak {20 * np.log10(np.abs(x).max()):.1f} dBFS')
sf.write(os.path.join(ROOT, 'public', 'nobel_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/nobel_score.wav')

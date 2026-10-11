"""IceCube vertical video — soundtrack synced to src/icecube/icecube.json. Run: python3 music/icecube.py → public/icecube_score.wav"""
import json, os, subprocess
import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'icecube', 'icecube.json')))
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
rng = np.random.default_rng(7)
TPB = 480; tk = lambda s: int(round(s * 2 * TPB))
S = {s['id']: s for s in J['sections']}; Q = J['cues']
ev = []
def msg(s, o, m): ev.append((tk(s), o, m))
def note(ch, s, d, p, v=90):
    v = int(max(1, min(127, v + rng.integers(-3, 4))))
    msg(s, 2, mido.Message('note_on', channel=ch, note=int(p), velocity=v)); msg(s + max(0.03, d) - 0.003, 0, mido.Message('note_off', channel=ch, note=int(p), velocity=0))
def chord(ch, s, d, ps, v=85):
    for p in ps: note(ch, s, d, p, v)
DR = 9; KICK, SNARE, CLAP, HAT, OHAT, CRASH, WOOD, LTOM, HTOM, RIDE = 36, 38, 39, 42, 46, 49, 76, 45, 50, 51
PAD, MAR, BASS, BRASS, CEL, VIB, STR, ARP, PIZZ, BELL, TIMP = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11
for ch, p in [(PAD, 94), (MAR, 12), (BASS, 38), (BRASS, 61), (CEL, 8), (VIB, 11), (STR, 48), (ARP, 81), (PIZZ, 45), (BELL, 14), (TIMP, 47)]:
    msg(0, 0, mido.Message('program_change', channel=ch, program=p))
for ch in range(16):
    msg(0, 1, mido.Message('control_change', channel=ch, control=91, value=55))

E = 64  # E4 — E minor, i–VI–III–VII
prog = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]   # Em C G D
root = [0, -4, 3, -2]
PENTA = [0, 3, 5, 7, 10]
def bars(s0, s1, drums='full', arp=True, pad=PAD, mar=False):
    t, i = s0, int(round(s0 / 0.5))
    while t < s1 - 1e-6:
        b = (i // 4) % 4; ch = prog[b]
        if i % 4 == 0:
            chord(pad, t, 2.0, [E + n for n in ch], 62); note(BASS, t, 0.45, E - 24 + root[b], 105)
        else:
            note(BASS, t, 0.4, E - 24 + root[b] + (12 if i % 2 else 0), 92)
        if drums == 'full':
            note(DR, t, 0.1, KICK, 110)
            if i % 2 == 1: note(DR, t, 0.1, CLAP, 98)
            note(DR, t + 0.25, 0.05, HAT, 66); note(DR, t, 0.05, HAT, 44)
        elif drums == 'half':
            if i % 4 == 0: note(DR, t, 0.1, KICK, 100)
            if i % 4 == 2: note(DR, t, 0.1, SNARE, 82)
            note(DR, t, 0.05, RIDE, 52)
        elif drums == 'heart':
            if i % 4 == 0: note(DR, t, 0.1, KICK, 80); note(DR, t + 0.22, 0.1, KICK, 60)
        if arp:
            for k in range(4):
                note(ARP, t + k * 0.125, 0.1, E + 12 + ch[(i + k) % 3] + (12 if k == 3 else 0), 52)
        if mar:
            for k in range(2):
                note(MAR, t + k * 0.25, 0.2, E + 12 + ch[(i * 2 + k) % 3], 80)
        t += 0.5; i += 1

# ── 1 hook: halo, the count rushes upward, a hit on "100 万亿", one bell for the single collision
h = Q['hook']
chord(PAD, 0.0, 6.0, [E - 12, E, E + 3, E + 7], 64)
n_tick = 22
for k in range(n_tick):
    x = k / (n_tick - 1); s = h['count'][0] + (h['count'][1] - h['count'][0]) * (1 - (1 - x) ** 1.7)
    note(CEL, s, 0.12, E + 12 + [0, 3, 5, 7, 10][k % 5] + 12 * (k // 5) // 2, 70 + k)
note(DR, h['count'][1], 1.5, CRASH, 112); note(DR, h['count'][1], 0.1, KICK, 120)
chord(BRASS, h['count'][1], 0.6, [E - 12, E - 5, E, E + 3], 108); note(BASS, h['count'][1], 1.5, E - 24, 110)
bars(h['count'][1] + 0.5, S['hook']['end'], drums='heart', arp=True)
note(BELL, h['spark'], 2.0, E + 19, 110); note(CEL, h['spark'], 1.2, E + 24, 100)

# ── 2 ghost: marimba ostinato, two thuds, the neutrino glides through
g, g0 = Q['ghost'], S['ghost']['start']
bars(g0, S['ghost']['end'], drums='half', arp=False, mar=True)
note(DR, g0, 1.2, CRASH, 100); note(VIB, g0 + g['nu'], 1.0, E + 19, 100)
for k, c in enumerate(g['chips']): note(MAR, g0 + c, 0.3, E + 24 + [0, 3, 7][k], 115)
for s in (g['light'][1], g['proton'][1]): note(DR, g0 + s, 0.2, LTOM, 120); note(TIMP, g0 + s, 0.5, E - 24, 100)
a, b = g['neutrino']
for k in range(12): note(VIB, g0 + a + (b - a) * k / 12, 0.2, E + 7 + PENTA[k % 5] + 12 * (k // 5), 85)

# ── 3 messenger: full groove; three path events
m, m0 = Q['messenger'], S['messenger']['start']
bars(m0, S['messenger']['end'], drums='full', arp=True)
note(DR, m0, 1.5, CRASH, 105); chord(BRASS, m0, 0.35, [E - 12, E - 5, E], 100)
note(DR, m0 + m['light'][1], 0.2, LTOM, 118)
for k in range(6): note(ARP, m0 + m['ray'][0] + 0.25 + k * 0.22, 0.2, E + 19 - k * 2 + (3 if k % 2 else 0), 80)
note(DR, m0 + m['nu'][1], 1.5, CRASH, 115); chord(BRASS, m0 + m['nu'][1], 0.9, [E - 12, E, E + 7], 110)
for k in range(5): note(CEL, m0 + m['nu'][1] + 0.25 + k * 0.15, 0.4, E + 12 + PENTA[k] + 12, 85)

# ── 4 idea: drop to bass + pizz, snare roll, hit on "直接用南极的冰", plink for the pin
d0, dq = S['idea']['start'], Q['idea']
for k in range(8): note(PIZZ, d0 + k * 0.25, 0.2, E + [0, 7, 12, 7][k % 4], 85); note(BASS, d0 + (k // 2) * 0.5, 0.4, E - 24, 90) if k % 2 == 0 else None
roll = [d0 + 1.0 + 1.0 * (1 - (1 - k / 16) ** 1.4) for k in range(16)]
for k, s in enumerate(roll): note(DR, s, 0.05, SNARE, 50 + k * 4)
note(DR, d0 + dq['hit'], 1.6, CRASH, 118); note(DR, d0 + dq['hit'], 0.1, KICK, 122)
chord(BRASS, d0 + dq['hit'], 1.0, [E - 12, E - 8, E - 5, E], 112); note(BASS, d0 + dq['hit'], 1.6, E - 28, 110)
note(CEL, d0 + dq['pin'] + 0.15, 0.8, E + 31, 110); note(BELL, d0 + dq['pin'] + 0.15, 1.2, E + 19, 85)
bars(d0 + dq['hit'] + 0.5, S['idea']['end'], drums='half', arp=False)

# ── 5 detector: driving; a woodblock + pluck per string; big chord when the cube appears; then lights off
c0, c = S['detector']['start'], Q['detector']
bars(c0, c0 + c['dark'], drums='full', arp=True, pad=STR)
note(DR, c0, 1.5, CRASH, 108)
for k in range(9):
    s = c0 + c['drop0'] + k * c['dropStep']; note(DR, s, 0.05, WOOD, 115); note(PIZZ, s, 0.3, E + 12 + PENTA[k % 5] + 12 * (k // 5), 105)
note(DR, c0 + c['iso'], 1.8, CRASH, 118); chord(BRASS, c0 + c['iso'], 1.6, [E - 12, E - 5, E, E + 3, E + 7], 105)
chord(STR, c0 + c['iso'], 3.6, [E - 12, E - 5, E + 3, E + 7, E + 12], 85)
# dark: pad + heartbeat
chord(PAD, c0 + c['dark'], 8.0, [E - 12, E - 5, E, E + 3], 70)
bars(c0 + c['dark'], S['detector']['end'], drums='heart', arp=False, pad=PAD)
for k in range(12): note(CEL, c0 + c['nu'] + k * 0.083, 0.08, E + 36 - (k % 3) * 2, 40 + k * 3)   # ghostly shimmer
note(DR, c0 + c['hit'], 2.0, CRASH, 122); note(TIMP, c0 + c['hit'], 1.0, E - 24, 125); note(BASS, c0 + c['hit'], 3.0, E - 36, 120)
mu = c['muEnd'] - c['hit']
for k in range(14): note(CEL, c0 + c['hit'] + mu * k / 14, 0.5, E + 12 + PENTA[k % 5] + 12 * (k // 5), 80 + k * 2); note(VIB, c0 + c['hit'] + mu * k / 14, 0.5, E + PENTA[k % 5] + 12 * (k // 5), 60)
chord(STR, c0 + c['muEnd'], 3.0, [E - 12, E - 5, E, E + 7], 70)
for k in range(8): note(STR, c0 + c['arrow'] + k * 0.1, 0.25, E + 7 + PENTA[k % 5] + 12 * (k // 5), 78)
note(BELL, c0 + c['source'], 2.5, E + 19, 115); chord(BRASS, c0 + c['source'], 2.6, [E - 12, E - 5, E, E + 4], 92)

# ── 6 discoveries: groove returns; a stab on each milestone
x0 = S['discover']['start']
bars(x0, S['discover']['end'], drums='full', arp=True, pad=STR)
note(DR, x0, 1.5, CRASH, 110)
for k, s in enumerate(Q['discover']['nodes']):
    chord(BRASS, x0 + s, 0.45, [E - 12 + n for n in [prog[1], prog[2], prog[3]][k]] + [E + [prog[1], prog[2], prog[3]][k][0]], 112)
    note(DR, x0 + s, 0.2, HTOM, 110)

# ── 7 the prize: crash, E major home chord, celesta motif, sustain to the end
z0 = S['nobel']['start']
note(DR, z0, 2.5, CRASH, 122); note(DR, z0, 0.1, KICK, 122); note(TIMP, z0, 1.2, E - 24, 120)
chord(BRASS, z0, 1.6, [E - 12, E - 5, E, E + 4, E + 7], 115)
chord(STR, z0, 5.8, [E - 24, E - 12, E - 5, E, E + 4, E + 7, E + 12], 90); note(BASS, z0, 5.5, E - 24, 105)
for k, p in enumerate([19, 16, 12, 19, 24]): note(CEL, z0 + Q['nobel']['name'] + k * 0.4, 1.0, E + p, 88)
chord(PAD, z0 + Q['nobel']['close'], 2.6, [E - 12, E, E + 4, E + 11], 75); note(BELL, z0 + Q['nobel']['close'], 2.5, E + 16, 95)

mid = mido.MidiFile(ticks_per_beat=TPB); trk = mido.MidiTrack(); mid.tracks.append(trk)
trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
last = 0
for t, _, mm in sorted(ev, key=lambda x: (x[0], x[1])): trk.append(mm.copy(time=t - last)); last = t
trk.append(mido.MetaMessage('end_of_track', time=tk(DUR + 2) - last))
mid.save(os.path.join(OUT, 'icecube.mid'))
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.55', '-r', str(SR), '-R', '1', '-C', '0', '-o', 'synth.reverb.level=0.5',
                '-F', os.path.join(OUT, 'icecube_orch.wav'), SF2, os.path.join(OUT, 'icecube.mid')], check=True)
x, _ = sf.read(os.path.join(OUT, 'icecube_orch.wav'), always_2d=True)
x = np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]

def whoosh(d=0.4, up=True):
    n = int(d * SR); w = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 1024):
        f = i / n if up else 1 - i / n
        fc = 300 * (7000 / 300) ** f; out[i:i + 1024] = sosfilt(butter(2, [fc * 0.6, min(fc * 1.6, 20000)], 'band', fs=SR, output='sos'), w[i:i + 1024])
    return out * np.sin(np.pi * np.arange(n) / n) ** 2
def add(s, sig, gain):
    i0 = int(s * SR); seg = sig[:max(0, N - i0)]; x[i0:i0 + len(seg)] += (seg * gain)[:, None]
for s in J['sections'][1:]: add(s['start'] - 0.38, whoosh(), 0.22)
add(c0 + c['arrow'] - 0.05, whoosh(0.8), 0.2)                                    # the reconstruction arrow
add(S['ghost']['start'] + g['neutrino'][0], whoosh(1.4), 0.12)                     # neutrino sliding through the Earth
# sub boom at the collision: a falling sine with a fast attack
n = int(1.6 * SR); tt = np.arange(n) / SR
boom = np.sin(2 * np.pi * np.cumsum(np.geomspace(90, 32, n)) / SR) * np.exp(-tt / 0.45) * (1 - np.exp(-tt / 0.004))
add(c0 + c['hit'], boom, 0.55)
# the lights-off cut: duck everything else for a beat
i0 = int((c0 + c['dark']) * SR); ramp = np.ones(N); ramp[i0:i0 + int(0.25 * SR)] = np.linspace(1, 0.55, int(0.25 * SR)); ramp[i0 + int(0.25 * SR):int((c0 + c['hit']) * SR)] = 0.55
x *= ramp[:, None]

meter = pyln.Meter(SR)
x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -14.0)
ceil = 10 ** (-1.2 / 20); x = np.tanh(x / ceil) * ceil
print(f'integrated {meter.integrated_loudness(x):.1f} LUFS, peak {20 * np.log10(np.abs(x).max()):.1f} dBFS')
sf.write(os.path.join(ROOT, 'public', 'icecube_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/icecube_score.wav')

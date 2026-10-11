"""IceCube vertical video — soundtrack synced to src/icecube/icecube.json. Run: python3 music/icecube.py → public/icecube_score.wav"""
import json, os
import numpy as np
import soundfile as sf
from engine import SF2, Drums, Score, Synth
from mixutil import bloom, jumps, master, swell

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'icecube', 'icecube.json')))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
rng = np.random.default_rng(7)
S = {s['id']: s for s in J['sections']}; Q = J['cues']
sc = Score(DUR, SR, seed=7)
note, chord = sc.note, sc.chord
DR = 'drums'; KICK, SNARE, CLAP, HAT, OHAT, CRASH, WOOD, LTOM, HTOM, RIDE = 36, 38, 39, 42, 46, 49, 76, 45, 50, 51
PAD, MAR, BASS, BRASS, CEL, VIB, STR, ARP, PIZZ, BELL, TIMP = 'pad', 'kalimba', 'bass', 'horns', 'glass', 'bell', 'strings', 'arp', 'pizz', 'chime', 'timp'
# palette: icy glass and FM bells over a warm analog pad and sub bass, a soft drum machine, real strings and horns
PARTS = {
    PAD: Synth('pad', level=-15, verb=0.35, duck=0.35, cutoff=2000),
    MAR: SF2('kalimba', level=-17, verb=0.3),
    BASS: Synth('sub', level=-16, verb=0.0, duck=0.5, cap=96),
    BRASS: SF2('ms', 60, level=-17, verb=0.4, cap=88),          # French horns
    CEL: SF2('glass', level=-15, verb=0.45),
    VIB: Synth('bell', level=-17, verb=0.45),
    STR: SF2('ms', 49, level=-15, verb=0.4),                    # slow strings
    ARP: Synth('pluck', level=-18, verb=0.3, bright=0.8),
    PIZZ: SF2('ms', 45, level=-18, verb=0.3),
    BELL: SF2('ms', 14, level=-19, verb=0.5),                   # tubular bells
    TIMP: SF2('ms', 47, level=-17, verb=0.35, cap=86),
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat', 45: 'R8/tom3', 50: 'R8/tom1'}, fallback_kit=25, level=-15, verb=0.12),
}

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
note(DR, c0 + c['hit'], 2.0, CRASH, 60); note(TIMP, c0 + c['hit'], 1.0, E - 24, 72); note(BASS, c0 + c['hit'], 3.0, E - 24, 80)
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

x, stems = sc.render(PARTS, kick_part=DR)

def add(s, sig, gain):
    i0 = int(s * SR); seg = sig[:max(0, N - i0)]; x[i0:i0 + len(seg)] += (seg * gain)[:, None]
pk = np.abs(x).max()
# soft air swells that peak on each cut, instead of white-noise whooshes
for s in J['sections'][1:]: add(s['start'] - 0.55, swell(SR, rng, 0.7), 0.05 * pk)
add(c0 + c['arrow'] - 0.1, swell(SR, rng, 0.9, 300, 2600), 0.05 * pk)              # the reconstruction arrow
add(S['ghost']['start'] + g['neutrino'][0], swell(SR, rng, 1.4, 400, 3000), 0.03 * pk)   # neutrino sliding through the Earth
add(c0 + c['hit'], bloom(SR), 0.12 * pk)                                            # the collision: a low bloom
# lights off: ease the band down over a bar rather than cutting it
i0 = int((c0 + c['dark']) * SR); i1 = int((c0 + c['hit']) * SR); ramp = np.ones(N)
ramp[i0:i1] = 0.7 + 0.3 * np.exp(-np.arange(i1 - i0) / (0.5 * SR))
x *= ramp[:, None]
x, L, P = master(x, SR)
print(f'integrated {L:.1f} LUFS, peak {P:.1f} dBFS')
med, mx, jj = jumps(x, SR)
print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'icecube_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/icecube_score.wav')

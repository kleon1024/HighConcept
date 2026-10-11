"""Optogenetics vertical video — soundtrack synced to src/opto/opto.json. Run: python3 music/opto.py → public/opto_score.wav"""
import json, os, subprocess
import mido
import numpy as np
import soundfile as sf
from mixutil import bloom, cap_velocity, jumps, master, swell

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'opto', 'opto.json')))
OUT = os.path.join(ROOT, 'out'); os.makedirs(OUT, exist_ok=True)
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
rng = np.random.default_rng(5)
TPB = 480; tk = lambda s: int(round(s * 2 * TPB))
S = {s['id']: s for s in J['sections']}; Q = J['cues']
st = lambda k: S[k]['start']
ev = []
def msg(s, o, m): ev.append((tk(s), o, m))
def note(ch, s, d, p, v=90):
    v = int(max(1, min(127, cap_velocity(ch, p, v + rng.integers(-3, 4), DR, BRASS, TIMP, BASS))))
    msg(s, 2, mido.Message('note_on', channel=ch, note=int(p), velocity=v)); msg(s + max(0.03, d) - 0.003, 0, mido.Message('note_off', channel=ch, note=int(p), velocity=0))
def chord(ch, s, d, ps, v=85):
    for p in ps: note(ch, s, d, p, v)
DR = 9; KICK, SNARE, CLAP, HAT, OHAT, CRASH, WOOD, LTOM, HTOM, RIDE, RIM = 36, 38, 39, 42, 46, 49, 76, 45, 50, 51, 37
PAD, MAR, BASS, BRASS, CEL, VIB, STR, ARP, PIZZ, BELL, TIMP, PNO, LEAD = 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13
for ch, p in [(PAD, 89), (MAR, 12), (BASS, 38), (BRASS, 61), (CEL, 8), (VIB, 11), (STR, 48), (ARP, 81), (PIZZ, 45), (BELL, 14), (TIMP, 47), (PNO, 0), (LEAD, 80)]:
    msg(0, 0, mido.Message('program_change', channel=ch, program=p))
for ch in range(16):
    msg(0, 1, mido.Message('control_change', channel=ch, control=91, value=60))

K = 57  # A3 — A minor, i–VI–III–VII; the ending turns to A major
prog = [[0, 3, 7], [-4, 0, 3], [3, 7, 10], [-2, 2, 5]]   # Am F C G
root = [0, -4, 3, -2]
PENTA = [0, 3, 5, 7, 10]
def bars(s0, s1, drums='full', arp=True, pad=PAD, mar=False, bass=True):
    t, i = s0, int(round(s0 / 0.5))
    while t < s1 - 1e-6:
        b = (i // 4) % 4; ch = prog[b]
        if i % 4 == 0:
            chord(pad, t, 2.0, [K + n for n in ch], 60)
        if bass: note(BASS, t, 0.4, K - 12 + root[b] + (12 if i % 2 else 0), 100 if i % 4 == 0 else 88)
        if drums == 'full':
            note(DR, t, 0.1, KICK, 108)
            if i % 2 == 1: note(DR, t, 0.1, CLAP, 96)
            note(DR, t + 0.25, 0.05, HAT, 64); note(DR, t, 0.05, HAT, 42)
        elif drums == 'half':
            if i % 4 == 0: note(DR, t, 0.1, KICK, 98)
            if i % 4 == 2: note(DR, t, 0.1, SNARE, 80)
            note(DR, t, 0.05, RIDE, 50)
        elif drums == 'heart':
            if i % 4 == 0: note(DR, t, 0.1, KICK, 82); note(DR, t + 0.22, 0.1, KICK, 62)
        if arp:
            for k in range(4): note(ARP, t + k * 0.125, 0.1, K + 12 + ch[(i + k) % 3] + (12 if k == 3 else 0), 50)
        if mar:
            for k in range(2): note(MAR, t + k * 0.25, 0.2, K + 12 + ch[(i * 2 + k) % 3], 78)
        t += 0.5; i += 1
hits = []   # (time, kind) for the numpy layer

# ── 1 cold open: every "light on" slams in, every "light off" cuts to silence
c = Q['cold']
for a, b in c['on']:
    hits.append((a, 'boom'))
    note(DR, a, 1.2, CRASH, 122); note(DR, a, 0.1, KICK, 124); chord(BRASS, a, min(0.6, b - a), [K - 12, K - 5, K, K + 3], 115)
    t = a
    while t < b - 1e-6:
        note(DR, t, 0.05, HAT, 80); note(DR, t + 0.125, 0.05, HAT, 60)
        if round((t - a) / 0.25) % 2 == 0: note(DR, t, 0.1, KICK, 112)
        note(LEAD, t, 0.11, K + 12 + [0, 3, 7, 12][int(round((t - a) / 0.125)) % 4], 82); note(LEAD, t + 0.125, 0.11, K + 12 + [3, 7, 12, 15][int(round((t - a) / 0.125)) % 4], 72)
        note(BASS, t, 0.2, K - 12, 108)
        t += 0.25
    note(DR, b, 0.05, RIM, 110)                     # the switch clicking off
chord(STR, 0.0, c['remote'], [K - 24, K - 12, K - 5], 62)              # a low drone under the strobe so "off" is hushed, not dead
chord(PAD, c['remote'], 10 - c['remote'], [K - 12, K - 5, K, K + 3], 58)
for x in (c['nots'] + 0.35, c['nots'] + 0.65): note(DR, x, 0.2, LTOM, 118); note(TIMP, x, 0.4, K - 24, 100)
note(BELL, c['prize'], 2.0, K + 19, 108); chord(BRASS, c['prize'], 1.5, [K - 12, K - 8, K - 5, K], 95)
for k in range(16): note(DR, 8.9 + 1.1 * (1 - (1 - k / 16) ** 1.5), 0.05, SNARE, 48 + k * 4)

# ── 2 title: the hit; a switch click on the toggle
z = st('title')
note(DR, z, 1.8, CRASH, 124); note(DR, z, 0.1, KICK, 124); note(TIMP, z, 1.0, K - 24, 122)
chord(BRASS, z, 1.4, [K - 12, K - 5, K, K + 3, K + 7], 112)
note(DR, z + Q['title']['toggle'], 0.05, WOOD, 120); note(CEL, z + Q['title']['toggle'] + 0.05, 0.8, K + 31, 100)
bars(z + 1.0, S['title']['end'], drums='full', arp=True)

# ── 3 the problem: a dark ostinato, chatter, the electrode zap, the drug's slow wash, Crick
z, p = st('problem'), Q['problem']
bars(z, z + p['crick'], drums='half', arp=False)
for k in range(int(p['crick'] / 0.25)): note(ARP, z + k * 0.25, 0.12, K + [0, 0, 12, 0, 3, 0, 12, 7][k % 8], 55)
for k in range(18):                                 # neurons appearing / counting
    note(CEL, z + p['count'][0] + (p['count'][1] - p['count'][0]) * k / 18, 0.12, K + 24 + PENTA[k % 5] + 12 * (k // 10), 60 + k)
for k in range(20): note(PIZZ, z + p['net'] + rng.uniform(0, 1.8), 0.1, K + 24 + int(rng.choice(PENTA)) + 12 * int(rng.integers(0, 2)), 60)
hits.append((z + p['electrode'] + 0.4, 'zap')); note(DR, z + p['electrode'] + 0.4, 0.3, LTOM, 122); chord(STR, z + p['electrode'] + 0.4, 0.8, [K + 1, K + 2, K + 6, K + 7], 100)
for k in range(8): note(STR, z + p['drug'] + 0.4 + k * 0.25, 0.4, K + 12 - k, 70)
chord(PAD, z + p['crick'], 14 - p['crick'], [K - 12, K - 5, K, K + 3], 66)
for k, x in enumerate([0, 3, 7, 12]): note(PNO, z + p['crick'] + k * 0.3, 1.2, K + x, 80)
for k in range(6): note(CEL, z + p['light'] + k * 0.12, 0.6, K + 24 + PENTA[k % 5] + 12 * (k // 5), 90)

# ── 4 how a neuron fires: marimba groove, the gate opening, two spikes, the wish
z, n = st('neuron'), Q['neuron']
bars(z, S['neuron']['end'], drums='half', arp=False, mar=True)
note(DR, z, 1.2, CRASH, 100)
hits.append((z + n['open'] - 0.4, 'rise'))
chord(BRASS, z + n['open'] + 0.2, 0.4, [K - 12, K - 5, K + 3], 100); note(TIMP, z + n['open'] + 0.2, 0.5, K - 24, 105)
for s in (n['spike'], n['spike'] + 1.0):
    for k in range(5): note(LEAD, z + s + k * 0.08, 0.07, K + 24 + k * 3, 88)
for k in range(8): note(CEL, z + n['wish'] + k * 0.1, 0.5, K + 19 + PENTA[k % 5] + 12 * (k // 5), 85)
chord(STR, z + n['wish'], 3.0, [K - 12, K - 7, K, K + 5], 72)

# ── 5 the pond: airy pads and plinks; the discovery lands on "光一照，它自己打开"
z, p = st('pond'), Q['pond']
bars(z, z + p['open'], drums='heart', arp=False, pad=STR)
for k in range(int(p['open'] / 0.25)): note(PIZZ, z + k * 0.25, 0.3, K + 12 + [0, 7, 12, 15, 12, 7][k % 6], 62)
for k in range(14): note(CEL, z + rng.uniform(0.3, p['sci']), 0.3, K + 31 + int(rng.choice(PENTA)), 55)   # water drops
for k in range(2): note(BRASS, z + p['sci'] + 0.4 + k * 0.25, 0.3, K + [0, 7][k], 95)
hits.append((z + p['eyespot'] - 0.05, 'rise'))
note(DR, z + p['open'], 1.6, CRASH, 120); note(DR, z + p['open'], 0.1, KICK, 122); chord(BRASS, z + p['open'], 1.0, [K - 12, K - 5, K, K + 3, K + 7], 112)
for k in range(10): note(CEL, z + p['open'] + k * 0.1, 0.5, K + 12 + PENTA[k % 5] + 12 * (k // 5), 92)
bars(z + p['open'] + 0.5, S['pond']['end'], drums='full', arp=True, pad=STR)
chord(STR, z + p['dream'], 2.0, [K - 12, K - 9, K - 5, K, K + 3], 80)

# ── 6 the transplant: the groove; each blue flash is a click locked to a spike
z, tq = st('transplant'), Q['transplant']
bars(z, S['transplant']['end'], drums='full', arp=False, pad=PAD)
note(DR, z, 1.5, CRASH, 108)
for k, s in enumerate(tq['steps']): note(DR, z + s, 0.05, WOOD, 115); note(PIZZ, z + s, 0.4, K + 12 + [0, 4, 7][k], 108)
for k in range(tq['pulses']):
    s = z + tq['pulse0'] + k * tq['pulseStep']
    note(DR, s, 0.05, RIM, 118); note(LEAD, s, 0.12, K + 24 + [0, 3, 7, 10, 12, 10, 7, 3][k], 98); hits.append((s, 'tick'))
chord(BRASS, z + tq['ms'], 0.6, [K - 12, K, K + 7], 112)
note(DR, z + tq['crick'], 1.8, CRASH, 122); chord(BRASS, z + tq['crick'], 1.4, [K - 12, K - 8, K - 5, K, K + 4], 115); chord(STR, z + tq['crick'], 1.4, [K, K + 4, K + 7, K + 12], 90)

# ── 7 on & off: bright plucks for blue, a hush for yellow; the mouse spins again
z, w = st('switch'), Q['switch']
bars(z, z + w['mouse'], drums='half', arp=False, pad=PAD)
for k in range(w['fires']): note(PIZZ, z + w['fire0'] + k * w['fireStep'], 0.2, K + 24 + PENTA[k % 5], 105); note(DR, z + w['fire0'] + k * w['fireStep'], 0.05, RIM, 70)
chord(STR, z + w['fire0'], w['fires'] * w['fireStep'], [K - 24, K - 12], 70)
for s in [0.3, 0.75, 1.05, 4.15]: note(DR, z + s, 0.05, RIM, 60)
hits.append((z + w['spin'], 'boom'))
note(DR, z + w['spin'], 1.2, CRASH, 118); chord(BRASS, z + w['spin'], 0.6, [K - 12, K - 5, K, K + 3], 112)
bars(z + w['spin'], S['switch']['end'], drums='full', arp=True)

# ── 8 what it opened up: upbeat, a stab per card
z, r = st('reveal'), Q['reveal']
bars(z, S['reveal']['end'], drums='full', arp=True, pad=STR)
note(DR, z, 1.5, CRASH, 110)
for k, s in enumerate(r['cards']): chord(BRASS, z + s, 0.45, [K - 12 + x for x in prog[[1, 2, 3][k]]] + [K + prog[[1, 2, 3][k]][0]], 112); note(DR, z + s, 0.2, HTOM, 110)

# ── 9 sight: piano and strings, then the swell into A major
z, g = st('sight'), Q['sight']
chord(STR, z, g['see'], [K - 12, K - 5, K, K + 3], 66); note(BASS, z, g['see'], K - 24, 70)
for k in range(int(g['see'] / 0.5)): note(PNO, z + k * 0.5, 0.9, K + 12 + [0, 7, 3, 7, 0, 7, 5, 7][k % 8] - (2 if (k // 8) % 2 else 0), 70)
for k in range(4): note(PNO, z + g['retina'] + 0.4 + k * 0.25, 0.6, K - k * 2, 75)
for k in range(5): note(CEL, z + g['inject'] + 0.3 + k * 0.3, 0.6, K + 24 + PENTA[k], 70)
for k in range(8): note(STR, z + g['goggles'] + k * 0.2, 0.4, K + 7 + PENTA[k % 5] + 12 * (k // 5), 72)
hits.append((z + g['see'] - 0.6, 'rise'))
note(DR, z + g['see'], 2.5, CRASH, 112); note(TIMP, z + g['see'], 1.2, K - 24, 115)
chord(STR, z + g['see'], 2.6, [K - 24, K - 12, K - 5, K, K + 4, K + 7], 100); chord(BRASS, z + g['see'], 2.0, [K - 12, K - 5, K, K + 4], 100)
note(BELL, z + g['see'] + 0.1, 2.5, K + 28, 105)
for k, x in enumerate([16, 19, 24, 28]): note(CEL, z + g['count'] + k * 0.25, 0.8, K + x, 88)

# ── 10 the prize: crash, home chord, the motif; the question lands with a final hit
z, nb = st('nobel'), Q['nobel']
note(DR, z, 2.5, CRASH, 122); note(DR, z, 0.1, KICK, 122); note(TIMP, z, 1.2, K - 24, 120)
chord(BRASS, z, 1.6, [K - 12, K - 5, K, K + 4, K + 7], 115)
bars(z + 0.5, z + nb['q'], drums='half', arp=True, pad=STR)
for k, s in enumerate(nb['people']): note(CEL, z + s, 0.8, K + [19, 23, 28][k], 92)
chord(PAD, z + nb['q'], 0.8, [K - 12, K - 5, K + 2, K + 7], 70)
note(DR, z + nb['a'], 2.5, CRASH, 118); note(TIMP, z + nb['a'], 1.0, K - 24, 118)
chord(STR, z + nb['a'], 8 - nb['a'], [K - 24, K - 12, K - 5, K, K + 4, K + 7, K + 12], 92); note(BASS, z + nb['a'], 8 - nb['a'], K - 24, 100)
for k, x in enumerate([16, 12, 7, 16, 19]): note(CEL, z + nb['a'] + 0.3 + k * 0.4, 1.0, K + x, 86)

mid = mido.MidiFile(ticks_per_beat=TPB); trk = mido.MidiTrack(); mid.tracks.append(trk)
trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
last = 0
for t, _, mm in sorted(ev, key=lambda x: (x[0], x[1])): trk.append(mm.copy(time=t - last)); last = t
trk.append(mido.MetaMessage('end_of_track', time=tk(DUR + 2) - last))
mid.save(os.path.join(OUT, 'opto.mid'))
subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.55', '-r', str(SR), '-R', '1', '-C', '0', '-o', 'synth.reverb.level=0.45',
                '-F', os.path.join(OUT, 'opto_orch.wav'), SF2, os.path.join(OUT, 'opto.mid')], check=True)
x, _ = sf.read(os.path.join(OUT, 'opto_orch.wav'), always_2d=True)
x = np.pad(x, ((0, max(0, N - len(x))), (0, 0)))[:N]

def add(s, sig, gain):
    i0 = int(s * SR)
    if i0 >= N: return
    seg = sig[:N - i0]; x[i0:i0 + len(seg)] += (seg * gain)[:, None]
pk = np.abs(x).max()
for s, kind in hits:
    if kind == 'boom': add(s, bloom(SR, 1.2, 80, 42), 0.2 * pk)
    elif kind == 'zap': add(s - 0.05, swell(SR, rng, 0.3, 1500, 5000), 0.06 * pk)
    elif kind == 'rise': add(s, swell(SR, rng, 0.6, 300, 2600), 0.05 * pk)
    elif kind == 'tick': add(s - 0.04, swell(SR, rng, 0.06, 4000, 7000), 0.02 * pk)
for s in J['sections'][1:]: add(s['start'] - 0.55, swell(SR, rng, 0.7), 0.05 * pk)
# the cold open's "light off": drop the band low (not to silence), with short fades so nothing clicks
gate = np.ones(N); f = int(0.03 * SR)
for (a, b), nxt in zip(c['on'][:2], [c['on'][1][0], c['remote']]):
    i0, i1 = int((b + 0.02) * SR), int(nxt * SR)
    gate[i0:i1] = 0.25; gate[i0:i0 + f] = np.linspace(1, 0.25, f); gate[i1 - f:i1] = np.linspace(0.25, 1, f)
x *= gate[:, None]
x, L, P = master(x, SR)
print(f'integrated {L:.1f} LUFS, peak {P:.1f} dBFS')
med, mx, jj = jumps(x, SR)
print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'opto_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/opto_score.wav')

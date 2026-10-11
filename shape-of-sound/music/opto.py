"""Optogenetics vertical video — soundtrack synced to src/opto/opto.json. Run: python3 music/opto.py → public/opto_score.wav"""
import json, os
import numpy as np
import soundfile as sf
from engine import SF2, Drums, Score, Synth
from mixutil import jumps, master
from sfx import Sfx

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = json.load(open(os.path.join(ROOT, 'src', 'opto', 'opto.json')))
SR, DUR = 48000, J['duration']; N = int(DUR * SR)
rng = np.random.default_rng(5)
S = {s['id']: s for s in J['sections']}; Q = J['cues']
st = lambda k: S[k]['start']
sc = Score(DUR, SR, seed=5)
note, chord = sc.note, sc.chord
DR = 'drums'; KICK, SNARE, CLAP, HAT, OHAT, CRASH, WOOD, LTOM, HTOM, RIDE, RIM = 36, 38, 39, 42, 46, 49, 76, 45, 50, 51, 37
PAD, MAR, BASS, BRASS, CEL, VIB, STR, ARP, PIZZ, BELL, TIMP, PNO, LEAD = 'pad', 'kalimba', 'bass', 'horns', 'glass', 'bell', 'strings', 'arp', 'harp', 'chime', 'timp', 'piano', 'lead'
# palette: organic (kalimba, harp, grand piano) meets electric (analog pad, plucks, FM bells, drum machine)
PARTS = {
    PAD: Synth('pad', level=-15, verb=0.35, duck=0.35, cutoff=2000),
    MAR: SF2('kalimba', level=-16, verb=0.3),
    BASS: Synth('sub', level=-16, verb=0.0, duck=0.5, cap=96),
    BRASS: SF2('ms', 60, level=-17, verb=0.4, cap=88),          # French horns
    CEL: SF2('glass', level=-15, verb=0.45),
    VIB: Synth('bell', level=-17, verb=0.45, ratio=2.0),
    STR: SF2('ms', 49, level=-15, verb=0.4),                    # slow strings
    ARP: Synth('pluck', level=-18, verb=0.3, bright=0.8),
    PIZZ: SF2('ms', 46, level=-17, verb=0.35),                  # harp
    BELL: SF2('ms', 14, level=-19, verb=0.5),                   # tubular bells
    TIMP: SF2('ms', 47, level=-17, verb=0.35, cap=86),
    PNO: SF2('piano', level=-14, verb=0.35),                    # Salamander grand
    LEAD: Synth('pluck', level=-17, verb=0.25, bright=1.6, decay=4.0, length=0.3),
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat', 45: 'R8/tom3', 50: 'R8/tom1'}, fallback_kit=25, level=-15, verb=0.12),
}

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

# ── 1 cold open: every "light on" slams in, every "light off" drops to a hush
c = Q['cold']
for a, b in c['on']:
    note(DR, a, 1.2, CRASH, 122); note(DR, a, 0.1, KICK, 124); chord(BRASS, a, min(0.6, b - a), [K - 12, K - 5, K, K + 3], 115)
    t = a
    while t < b - 1e-6:
        note(DR, t, 0.05, HAT, 80); note(DR, t + 0.125, 0.05, HAT, 60)
        if round((t - a) / 0.25) % 2 == 0: note(DR, t, 0.1, KICK, 112)
        note(LEAD, t, 0.11, K + 12 + [0, 3, 7, 12][int(round((t - a) / 0.125)) % 4], 82); note(LEAD, t + 0.125, 0.11, K + 12 + [3, 7, 12, 15][int(round((t - a) / 0.125)) % 4], 72)
        note(BASS, t, 0.2, K - 12, 108)
        t += 0.25
chord(STR, 0.0, c['remote'], [K - 24, K - 12, K - 5], 62)              # a low drone under the strobe so "off" is hushed, not dead
chord(PAD, c['remote'], 10 - c['remote'], [K - 12, K - 5, K, K + 3], 58)
note(BELL, c['prize'], 2.0, K + 19, 108); chord(BRASS, c['prize'], 1.5, [K - 12, K - 8, K - 5, K], 95)
for k in range(16): note(DR, 8.9 + 1.1 * (1 - (1 - k / 16) ** 1.5), 0.05, SNARE, 48 + k * 4)

# ── 2 title: the hit; a switch click on the toggle
z = st('title')
note(DR, z, 1.8, CRASH, 124); note(DR, z, 0.1, KICK, 124); note(TIMP, z, 1.0, K - 24, 122)
chord(BRASS, z, 1.4, [K - 12, K - 5, K, K + 3, K + 7], 112)
note(CEL, z + Q['title']['toggle'] + 0.05, 0.8, K + 31, 100)
bars(z + 1.0, S['title']['end'], drums='full', arp=True)

# ── 3 the problem: a dark ostinato, chatter, the electrode zap, the drug's slow wash, Crick
z, p = st('problem'), Q['problem']
bars(z, z + p['crick'], drums='half', arp=False)
for k in range(int(p['crick'] / 0.25)): note(ARP, z + k * 0.25, 0.12, K + [0, 0, 12, 0, 3, 0, 12, 7][k % 8], 55)
for k in range(18):                                 # neurons appearing / counting
    note(CEL, z + p['count'][0] + (p['count'][1] - p['count'][0]) * k / 18, 0.12, K + 24 + PENTA[k % 5] + 12 * (k // 10), 60 + k)
for k in range(20): note(PIZZ, z + p['net'] + rng.uniform(0, 1.8), 0.1, K + 24 + int(rng.choice(PENTA)) + 12 * int(rng.integers(0, 2)), 60)
chord(STR, z + p['electrode'] + 0.4, 0.8, [K + 1, K + 2, K + 6, K + 7], 100)
for k in range(8): note(STR, z + p['drug'] + 0.4 + k * 0.25, 0.4, K + 12 - k, 70)
chord(PAD, z + p['crick'], 14 - p['crick'], [K - 12, K - 5, K, K + 3], 66)
for k, x in enumerate([0, 3, 7, 12]): note(PNO, z + p['crick'] + k * 0.3, 1.2, K + x, 80)
for k in range(6): note(CEL, z + p['light'] + k * 0.12, 0.6, K + 24 + PENTA[k % 5] + 12 * (k // 5), 90)

# ── 4 how a neuron fires: marimba groove, the gate opening, two spikes, the wish
z, n = st('neuron'), Q['neuron']
bars(z, S['neuron']['end'], drums='half', arp=False, mar=True)
note(DR, z, 1.2, CRASH, 100)
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
note(DR, z + p['open'], 1.6, CRASH, 120); note(DR, z + p['open'], 0.1, KICK, 122); chord(BRASS, z + p['open'], 1.0, [K - 12, K - 5, K, K + 3, K + 7], 112)
for k in range(10): note(CEL, z + p['open'] + k * 0.1, 0.5, K + 12 + PENTA[k % 5] + 12 * (k // 5), 92)
bars(z + p['open'] + 0.5, S['pond']['end'], drums='full', arp=True, pad=STR)
chord(STR, z + p['dream'], 2.0, [K - 12, K - 9, K - 5, K, K + 3], 80)

# ── 6 the transplant: the groove; each blue flash is a click locked to a spike
z, tq = st('transplant'), Q['transplant']
bars(z, S['transplant']['end'], drums='full', arp=False, pad=PAD)
note(DR, z, 1.5, CRASH, 108)
for k, s in enumerate(tq['steps']): note(PIZZ, z + s, 0.4, K + 12 + [0, 4, 7][k], 108)
for k in range(tq['pulses']):
    s = z + tq['pulse0'] + k * tq['pulseStep']
    note(LEAD, s, 0.12, K + 24 + [0, 3, 7, 10, 12, 10, 7, 3][k], 98)
chord(BRASS, z + tq['ms'], 0.6, [K - 12, K, K + 7], 112)
note(DR, z + tq['crick'], 1.8, CRASH, 122); chord(BRASS, z + tq['crick'], 1.4, [K - 12, K - 8, K - 5, K, K + 4], 115); chord(STR, z + tq['crick'], 1.4, [K, K + 4, K + 7, K + 12], 90)

# ── 7 on & off: bright plucks for blue, a hush for yellow; the mouse spins again
z, w = st('switch'), Q['switch']
bars(z, z + w['mouse'], drums='half', arp=False, pad=PAD)
for k in range(w['fires']): note(PIZZ, z + w['fire0'] + k * w['fireStep'], 0.2, K + 24 + PENTA[k % 5], 105)
chord(STR, z + w['fire0'], w['fires'] * w['fireStep'], [K - 24, K - 12], 70)
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

x, stems = sc.render(PARTS, kick_part=DR)

# the cold open's "light off": drop the band low (not to silence), with short fades so nothing clicks
gate = np.ones(N); f = int(0.03 * SR)
for (a, b), nxt in zip(c['on'][:2], [c['on'][1][0], c['remote']]):
    i0, i1 = int((b + 0.02) * SR), int(nxt * SR)
    gate[i0:i1] = 0.25; gate[i0:i0 + f] = np.linspace(1, 0.25, f); gate[i1 - f:i1] = np.linspace(0.25, 1, f)
x *= gate[:, None]

# ── sound effects (Mixkit one-shots) on the picture's cues
fx = Sfx(DUR, SR)
cuts = [('whoosh_air', -25), ('sweep_air', -25), ('swoosh_wind', -26), ('whoosh_fast', -25), ('swoosh_fast', -25), ('sweep_air', -25), ('swoosh_wind', -25), ('whoosh_air', -30), ('light_sweep', -26)]
for sec, (name, db) in zip(J['sections'][1:], cuts): fx.play(sec['start'], name, db, align='peak')   # a whoosh peaking on every cut
# 1 cold open: the question (a low hit, a clock, a riser into the first switch), then a real switch on every on/off
fx.play(0.0, 'deep_hit', -21); fx.play(c['q'], 'clock_tick', -24, maxlen=c['on'][0][0] - c['q'] - 0.05)
fx.play(c['on'][0][0], 'metal_sweep', -28, align='peak')
for a, b in c['on']:
    fx.play(a, 'switch', -17); fx.play(a, 'static_up', -24); fx.play(a + 0.05, 'whoosh_swirl', -25, maxlen=b - a + 0.3)
    fx.play(b, 'switch', -19, rate=0.92)
for k in range(2): fx.play(c['nots'] + 0.35 + 0.3 * k, 'sweep_small', -23, rate=1 + 0.1 * k)   # red strike-through lines
fx.play(c['alga'], 'bubble_magic', -23)
fx.play(c['prize'], 'notify_ring', -24)
# 2 title
z, tq_ = st('title'), Q['title']
fx.play(z, 'impact_zoom', -22); fx.play(z + tq_['toggle'], 'switch', -19)
# 3 the problem
z, p = st('problem'), Q['problem']
fx.play(z + p['count'][0], 'glitter', -28)
for k in range(3): fx.play(z + p['net'] + 0.6 * k + 0.2, 'zap_small', -30, rate=1 + 0.15 * k)   # chatter
fx.play(z + p['electrode'], 'sweep_small', -25); fx.play(z + p['electrode'] + 0.4, 'zap_buzz', -20)
fx.play(z + p['drug'] + 0.3, 'pop_bubble', -22); fx.play(z + p['drug'] + 0.5, 'bubble_liquid', -27)
fx.play(z + p['crick'], 'tech_slide', -22); fx.play(z + p['light'], 'sparkle', -24)
# 4 neuron
z, n = st('neuron'), Q['neuron']
fx.play(z + n['open'], 'vacuum', -22, align='peak'); fx.play(z + n['open'] + 0.2, 'bubble', -25)
for s in (n['spike'], n['spike'] + 1.0): fx.play(z + s, 'electric_pop', -22)
fx.play(z + n['wish'], 'wand', -26)
# 5 pond
z, p = st('pond'), Q['pond']
fx.play(z + p['drop'], 'water_drop', -24)
fx.play(z + p['zoom'] + 0.5, 'whoosh_air', -29, align='peak')
fx.play(z + p['swim'], 'glow', -30)
for k in range(2): fx.play(z + p['sci'] + 0.4 + 0.25 * k, 'pop_dry', -25, rate=1 + 0.1 * k)
fx.play(z + p['eyespot'] + 0.6, 'sweep_magic', -27, align='peak')
fx.play(z + p['open'] - 0.6, 'bleep_water', -24)                                   # the photon …
fx.play(z + p['open'], 'crystal', -21); fx.play(z + p['open'] + 0.15, 'bubble', -25)   # … and the gate opens
fx.play(z + p['dream'], 'glow', -26)
# 6 transplant: a blip on every blue flash
z, tq = st('transplant'), Q['transplant']
fx.play(z + tq['card'], 'pop_whoosh', -24)
for k, s in enumerate(tq['steps']): fx.play(z + s, 'click_select', -18, rate=1 + 0.1 * k)
fx.play(z + tq['scope'], 'tech_slide', -25)
for k in range(tq['pulses']): fx.play(z + tq['pulse0'] + k * tq['pulseStep'], 'bleep', -25, rate=1 + 0.02 * k, maxlen=0.4)
fx.play(z + tq['ms'], 'impact_zoom', -22)
fx.play(z + tq['crick'], 'notify_ring', -22)
# 7 on & off
z, w = st('switch'), Q['switch']
fx.play(z + w['labels'], 'pop_msg', -25)
for s in [0.3, 0.75, 1.05, 4.15]: fx.play(z + s, 'electric_pop', -30)                # the silenced neuron firing on its own
fx.play(z + w['fire0'], 'zap_small', -24); fx.play(z + w['fire0'], 'power_up', -28, reverse=True, maxlen=2.4)   # yellow hush
fx.play(z + w['spin'], 'switch', -19); fx.play(z + w['spin'] + 0.05, 'whoosh_swirl', -23)
# 8 reveal
z = st('reveal')
for s in Q['reveal']['cards']: fx.play(z + s, 'swoosh_fast', -25, align='peak'); fx.play(z + s + 0.05, 'pop_dry', -27)
# 9 sight
z, g = st('sight'), Q['sight']
fx.play(z + g['inject'] + 0.3, 'vacuum', -26, align='peak')                       # the injection
fx.play(z + g['goggles'] + 0.2, 'gear_lock', -22)
fx.play(z + g['see'], 'choir_shine', -21); fx.play(z + g['see'] + 0.6, 'light_transition', -27, align='peak')
fx.play(z + g['count'], 'sparkle', -26)
# 10 the prize
z, nb = st('nobel'), Q['nobel']
fx.play(z, 'notify_ring', -22)
for s in nb['people']: fx.play(z + s, 'pop_dry', -27)
fx.play(z + nb['a'], 'light_sweep', -27, align='peak')
x = x + fx.mix(sc.ir, 0.15)
x, L, P = master(x, SR)
print(f'integrated {L:.1f} LUFS, peak {P:.1f} dBFS')
med, mx, jj = jumps(x, SR)
print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
sf.write(os.path.join(ROOT, 'public', 'opto_score.wav'), x.astype(np.float32), SR, subtype='PCM_16')
print('wrote public/opto_score.wav')

"""百鬼夜行 · 今夜，摘下面具 — 30 s anime-opening score, synced to src/timing.json.
Run: python3 music/score.py  → sounds/score.wav (mastered, music + SFX)   STEM_DIR=sounds/stems also writes the stems.

180 BPM (beat = 1/3 s = 10 video frames, bar = 4/3 s). E minor; final chorus up a semitone to F minor; the lift lands on
A-flat major (the relative major — the bright payoff), last hit on F at 28.0 s, then 2 s of silence.
Band: MuseScore General acoustic kit + distortion guitars (L/R) + picked bass + numpy sub; Salamander piano runs;
string ensemble; brass section stabs; a square-lead synth carrying the "vocal" hook. Shared engine is used read-only.
"""
import json, os, sys
import numpy as np
import soundfile as sf

MUSIC = '/home/user/HighConcept/shape-of-sound/music'
sys.path.insert(0, MUSIC)
from engine import SF2, Drums, Score, Synth          # noqa: E402  (read-only shared modules)
from mixutil import jumps, master                      # noqa: E402
from sfx import Sfx                                    # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
J = json.load(open(os.path.join(ROOT, 'src', 'timing.json')))
SR, DUR = 48000, J['duration']
BEAT = 60 / J['bpm']; BAR = 4 * BEAT; E8 = BEAT / 2; S16 = BEAT / 4
fr = lambda f: f / J['fps']                    # video frame -> seconds
bar = lambda n, beat=0.0: n * BAR + beat * BEAT

sc = Score(DUR, SR, seed=31)
DR, BASS, SUB, GL, GR, PNO, STR, BRS, LEAD, PAD = 'dr', 'bass', 'sub', 'gtrL', 'gtrR', 'pno', 'str', 'brass', 'lead', 'pad'
PARTS = {
    DR: SF2('ms', 16, drum=True, level=-13.5, verb=0.10),            # GM "Power" kit
    BASS: SF2('ms', 34, level=-16, verb=0.0, duck=0.25),            # picked electric bass
    SUB: Synth('sub', level=-23, verb=0.0, duck=0.5, cap=100),
    GL: SF2('ms', 30, level=-19.5, verb=0.12, pan=-0.6, hp=90),     # distortion guitar, double-tracked
    GR: SF2('ms', 30, level=-19.5, verb=0.12, pan=0.6, hp=90),
    PNO: SF2('piano', level=-18, verb=0.25),
    STR: SF2('ms', 48, level=-19, verb=0.35),
    BRS: SF2('ms', 61, level=-18.5, verb=0.25, cap=110),
    LEAD: SF2('ms', 80, level=-17.5, verb=0.28, lp=7000),           # square lead = the "vocal"
    PAD: Synth('pad', level=-26, verb=0.4, duck=0.4, cutoff=1800),
}
KICK, SNARE, HAT, OHAT, CRASH, RIDE, TOM_H, TOM_M, TOM_L, CRASH2 = 36, 38, 42, 46, 49, 51, 50, 47, 45, 57

# ── harmony: (bar, beat, chord_root_midi, quality) ; key change +1 from bar 15
Q = {'m': [0, 3, 7], 'M': [0, 4, 7], '7': [0, 4, 7, 10], 'm7': [0, 3, 7, 10], '5': [0, 7]}
E2, C2, D2, B1, A1, G2 = 40, 36, 38, 35, 33, 43
CHORDS = []
def ch(b, beat, root, q, beats): CHORDS.append((bar(b, beat), beats * BEAT, root, q))
ch(0, 0, E2, 'm', 4)
for k, (r, q) in enumerate([(C2, 'M'), (D2, 'M'), (B1, '7'), (E2, 'm')]): ch(1, k, r, q, 1)
ch(2, 0, E2, 'm', 4); ch(3, 0, C2, 'M', 2); ch(3, 2, D2, 'M', 2)
for b, (r, q) in zip(range(4, 8), [(E2, 'm'), (C2, 'M'), (D2, 'M'), (B1, 'm')]): ch(b, 0, r, q, 4)
ch(8, 0, A1, 'm7', 2); ch(8, 2, B1, 'm7', 2); ch(9, 0, C2, 'M', 2); ch(9, 2, D2, 'M', 2)
ch(10, 0, B1, '7', 2)
def royal(b0, t):   # IV–V–iii–vi in the relative major (C D Bm Em), transposed by t
    for k, (r, q) in enumerate([(C2, 'M'), (D2, 'M'), (B1, 'm'), (E2, 'm'), (C2, 'M'), (D2, 'M'), (E2, 'm'), (E2, 'm')]):
        ch(b0 + k // 2, (k % 2) * 2, r + t, q, 2)
royal(11, 0)
CHORDS[-1] = (bar(14, 2), 2 * BEAT, C2, '7')        # pivot: C7 = V of F minor
royal(15, 1)
CHORDS[-1] = (bar(18, 2), 2 * BEAT, 39, '7')           # E-flat 7 = V of the lift chord
ch(19, 0, 44, 'M', 4)                                 # A-flat major: the lift
ch(20, 0, 37, 'M', 2); ch(20, 2, 39, 'M', 2)          # Db, Eb
ch(21, 0, 41, '5', 1)                                 # final hit on F

def chord_at(t):
    for s, d, r, q in reversed(CHORDS):
        if s <= t + 1e-6: return r, q
    return CHORDS[0][2], CHORDS[0][3]

# ── drums
def hit(t, p, v=100, d=0.1): sc.note(DR, t, d, p, v)
def groove_verse(b):
    t = bar(b)
    for k in range(8):
        hit(t + k * E8, HAT, 70 if k % 2 == 0 else 52, 0.05)
    for k in (0, 3, 4): hit(t + k * E8, KICK, 108)
    for k in (2, 6): hit(t + k * E8, SNARE, 104)
def groove_chorus(b, crash=True):
    t = bar(b)
    if crash: hit(t, CRASH, 112, 1.2)
    for k in range(4): hit(t + k * BEAT, KICK, 112)
    hit(t + 3.5 * BEAT, KICK, 96)
    for k in (1, 3): hit(t + k * BEAT, SNARE, 112)
    for k in range(4): hit(t + k * BEAT + E8, OHAT, 74, 0.12)
    for k in range(4): hit(t + k * BEAT, HAT, 56, 0.05)
def fill(b, beat0=2, n=8, v0=80):
    t = bar(b, beat0)
    toms = [TOM_H, TOM_H, TOM_M, TOM_M, TOM_L, TOM_L, SNARE, SNARE]
    for k in range(n): hit(t + k * S16, toms[k % len(toms)], v0 + k * 4)

# bar 0: intro hit + three stabs (question tiles)
hit(0, CRASH, 120, 1.5); hit(0, KICK, 124); hit(0, CRASH2, 100, 1.5)
for f in J['cues']['question_tiles']: hit(fr(f), SNARE, 96); hit(fr(f), KICK, 100)
# bar 1: four stabs (mask flips) + a fill
for f in J['cues']['flips']: hit(fr(f), KICK, 110); hit(fr(f), CRASH if f == 40 else HAT, 100 if f == 40 else 70, 0.4)
fill(1, 3, 4, 86)
for b in range(2, 8): groove_verse(b)
for f in (160, 200, 240, 280): hit(fr(f), CRASH, 104, 1.0)
fill(3, 3, 4, 80); fill(7, 2, 8, 78)
# pre-chorus: four on the floor, snare 8ths then 16ths
for b in (8, 9):
    t = bar(b); hit(t, CRASH, 100, 1.0)
    for k in range(4): hit(t + k * BEAT, KICK, 108)
    for k in range(8 if b == 8 else 16): hit(t + k * (E8 if b == 8 else S16), SNARE, (64 + k * 2) if b == 8 else (60 + k * 3))
    for k in range(8): hit(t + k * E8, HAT, 60, 0.05)
# bar 10: two hits, a breath, a 4-note pickup
for f in J['cues']['grip_hits']: hit(fr(f), KICK, 120); hit(fr(f), CRASH, 110, 0.6); hit(fr(f), SNARE, 110)
for k in range(4): hit(bar(10, 3) + k * S16, SNARE, 70 + k * 12)
# choruses
for b in range(11, 15): groove_chorus(b)
for f in J['cues']['bursts']: hit(fr(f), CRASH2, 108, 0.8); hit(fr(f), TOM_L, 110)
fill(14, 2, 8, 84)
for b in range(15, 19): groove_chorus(b)
fill(18, 2, 8, 88)
hit(bar(19), CRASH, 124, 2.0); hit(bar(19), KICK, 124); hit(bar(19), CRASH2, 110, 2.0)
for k in range(4): hit(bar(20, k), RIDE, 58, 0.3)
hit(bar(21), CRASH, 120, 1.0); hit(bar(21), KICK, 124); hit(bar(21), SNARE, 116)

# ── bass (8ths on the root, octave pops in the chorus) + sub (quarters)
def bassline(b0, b1, style='8'):
    t = bar(b0)
    while t < bar(b1) - 1e-6:
        r, q = chord_at(t); k = int(round((t - bar(b0)) / E8))
        p = r + (12 if style == 'oct' and k % 2 == 1 else 0)
        sc.note(BASS, t, E8 * 0.85, p, 100 if k % 2 == 0 else 88)
        if k % 2 == 0: sc.note(SUB, t, BEAT * 0.9, r - 12 + 12, 92)
        t += E8
sc.note(BASS, 0, BAR * 0.9, E2, 120); sc.note(SUB, 0, BAR, E2 - 12 + 12, 110)
for f, (r, q) in zip(J['cues']['flips'], [(C2, 'M'), (D2, 'M'), (B1, '7'), (E2, 'm')]): sc.note(BASS, fr(f), BEAT * 0.8, r, 112); sc.note(SUB, fr(f), BEAT * 0.8, r, 100)
bassline(2, 10); bassline(11, 15, 'oct'); bassline(15, 19, 'oct')
for f in J['cues']['grip_hits']: sc.note(BASS, fr(f), BEAT * 0.8, B1, 116); sc.note(SUB, fr(f), BEAT * 0.8, B1, 110)
sc.note(BASS, bar(19), BAR * 1.0, 44 - 12 + 12, 116); sc.note(SUB, bar(19), BAR, 32 + 12, 110)
sc.note(BASS, bar(20), BEAT * 1.8, 37, 90); sc.note(BASS, bar(20, 2), BEAT * 1.8, 39, 90)
sc.note(BASS, bar(21), BEAT * 0.9, 41, 120); sc.note(SUB, bar(21), BEAT * 1.2, 41, 112)

# ── guitars: power chords; palm-muted 8ths in the verse, ringing 8ths in the chorus
def power(t, d, r, v, both=True):
    ps = [r + 12, r + 19, r + 24]
    for part, dt in ((GL, 0.0), (GR, 0.012)):
        for p in ps: sc.note(part, t + dt, d, p, v)
def gtr(b0, b1, mute=True):
    t = bar(b0)
    while t < bar(b1) - 1e-6:
        r, q = chord_at(t); k = int(round((t - bar(b0)) / E8))
        power(t, E8 * (0.45 if mute else 0.95), r, (92 if k % 2 == 0 else 78) if mute else (104 if k % 2 == 0 else 92))
        t += E8
power(0, BAR * 0.95, E2, 118)
for f in J['cues']['question_tiles']: power(fr(f), BEAT * 0.5, E2, 104)
for f, (r, q) in zip(J['cues']['flips'], [(C2, 'M'), (D2, 'M'), (B1, '7'), (E2, 'm')]): power(fr(f), BEAT * 0.7, r, 110)
gtr(2, 8, True); gtr(8, 10, False)
for f in J['cues']['grip_hits']: power(fr(f), BEAT * 0.8, B1, 116)
gtr(11, 15, False); gtr(15, 19, False)
power(bar(19), BAR * 1.0, 44, 118); power(bar(21), BEAT * 0.9, 41, 122)

# ── piano: intro octaves, verse arpeggios, pre-chorus octave climb, chorus block chords + runs, lift motif
def pchord(t, d, r, q, v, lift=24):
    for i in Q[q]: sc.note(PNO, t, d, r + lift + i, v)
pchord(0, BAR, E2, 'm', 108, 24); pchord(0, BAR, E2, 'm', 100, 36)
for f, (r, q) in zip(J['cues']['flips'], [(C2, 'M'), (D2, 'M'), (B1, '7'), (E2, 'm')]): pchord(fr(f), BEAT * 0.8, r, q, 104, 36)
def arp(b0, b1, v=80):
    t = bar(b0)
    while t < bar(b1) - 1e-6:
        r, q = chord_at(t); k = int(round((t - bar(b0)) / E8)); iv = Q[q]
        sc.note(PNO, t, E8 * 1.6, r + 36 + iv[k % len(iv)] + (12 if k % 4 == 3 else 0), v - (k % 2) * 8)
        t += E8
arp(2, 8)
for k in range(16): sc.note(PNO, bar(8) + k * E8, E8 * 1.4, [57, 60, 64, 69, 59, 62, 66, 71, 60, 64, 67, 72, 62, 66, 69, 74][k] + 12, 70 + k * 2)
def run(t_end, top, pcs, n=8, v=84):   # a bright 16th scale run climbing to `top`, landing on t_end
    notes, p = [], top
    while len(notes) < n:
        if p % 12 in pcs: notes.append(p)
        p -= 1
    for k, pp in enumerate(reversed(notes)):
        sc.note(PNO, t_end - (n - k) * S16, S16 * 1.2, pp, v + k * 2)
EMIN = {4, 6, 7, 9, 11, 0, 2}; FMIN = {(q + 1) % 12 for q in EMIN}
run(bar(11), 88, EMIN); run(bar(15), 89, FMIN, 8, 90)
def blocks(b0, b1, t=0, v=92):
    tt = bar(b0)
    while tt < bar(b1) - 1e-6:
        r, q = chord_at(tt); pchord(tt, BEAT * 0.9, r, q, v, 36); tt += BEAT
blocks(11, 15); blocks(15, 19, v=98)
pchord(bar(19), BAR * 1.5, 44, 'M', 104, 36); pchord(bar(19), BAR * 1.5, 44, 'M', 96, 24)
for k, p in enumerate([80, 77, 75, 77, 80, 82, 84, 87]): sc.note(PNO, bar(20) + k * E8, E8 * 1.5, p, 78 - k * 2)   # the hook, softly, in A-flat
pchord(bar(21), BEAT * 0.9, 41, '5', 112, 24); pchord(bar(21), BEAT * 0.9, 41, '5', 108, 36)

# ── strings: pre-chorus climb, chorus sustain, lift
def strs(b0, b1, v=84, top=48):
    t = bar(b0)
    while t < bar(b1) - 1e-6:
        r, q = chord_at(t)
        nxt = min([s for s, d, rr, qq in CHORDS if s > t + 1e-6] + [bar(b1)])
        for i in Q[q][:3]: sc.note(STR, t, nxt - t, r + 24 + i, v)
        sc.note(STR, t, nxt - t, r + 36, v - 6)
        t = nxt
strs(8, 10, 78); strs(11, 15, 86); strs(15, 19, 94)
for i in Q['M']: sc.note(STR, bar(19), BAR * 2 - 0.1, 44 + 24 + i, 100)
sc.note(STR, bar(19), BAR * 2 - 0.1, 44 + 12, 96)
sc.note(STR, bar(21), BEAT, 41 + 24, 110); sc.note(STR, bar(21), BEAT, 41 + 31, 106)

# ── brass stabs
def stab(t, r, q, v=112, d=None):
    for i in Q[q][:3]: sc.note(BRS, t, d or BEAT * 0.45, r + 24 + i, v)
stab(0, E2, 'm', 120, BEAT * 1.4)
for f in J['cues']['question_tiles']: stab(fr(f), E2, 'm', 100)
for f, (r, q) in zip(J['cues']['flips'], [(C2, 'M'), (D2, 'M'), (B1, '7'), (E2, 'm')]): stab(fr(f), r, q, 110)
for f in (160, 200, 240, 280): r, q = chord_at(fr(f) + 0.01); stab(fr(f), r, q, 108)
for f in J['cues']['grip_hits']: stab(fr(f), B1, '7', 118)
for b in (11, 13, 15, 17): r, q = chord_at(bar(b) + 0.01); stab(bar(b), r, q, 116, BEAT * 0.8)
for f in J['cues']['bursts']: r, q = chord_at(fr(f) + 0.01); stab(fr(f), r, q, 112)
stab(fr(J['scenes']['finish']), 37, 'M', 118, BEAT)
stab(bar(19), 44, 'M', 122, BAR * 1.2)
stab(bar(21), 41, '5', 124, BEAT * 0.7)

# ── lead (the "vocal"): verse, pre-chorus, hook ×2 (second up a semitone), lift note
def phrase(b0, notes, t=0, v=100):
    for s8, d8, p in notes: sc.note(LEAD, bar(b0) + s8 * E8, d8 * E8 * 0.92, p + t, v + (6 if d8 >= 2 else 0))
B4, C5, D5, E5, F5s, G5, A5, B5, A4, G4, F4s, E4 = 71, 72, 74, 76, 78, 79, 81, 83, 69, 67, 66, 64
phrase(1, [(0, 1, E5), (2, 1, G5), (4, 1, F5s), (6, 1, B4 + 12)], v=96)
VERSE = [
    [(0, 1, B4), (1, 1, B4), (2, 1, G4), (3, 1, A4), (4, 2, B4), (6, 1, E5), (7, 1, D5)],
    [(0, 1, C5), (1, 1, B4), (2, 1, A4), (3, 1, G4), (4, 3, A4)],
    [(0, 1, A4), (1, 1, A4), (2, 1, F4s), (3, 1, G4), (4, 2, A4), (6, 1, D5), (7, 1, C5)],
    [(0, 3, B4), (3, 1, A4), (4, 3, F4s)],
]
for k, ph in enumerate(VERSE): phrase(4 + k, ph, v=96)
phrase(8, [(0, 2, A4), (2, 2, C5), (4, 2, B4), (6, 2, D5)], v=98)
phrase(9, [(0, 2, E5), (2, 2, G5), (4, 2, F5s), (6, 1, A5), (7, 1, B5)], v=102)
phrase(10, [(0, 3, B5)], v=108)
HOOK = [
    [(0, 1, E5), (1, 1, D5), (2, 2, E5), (4, 1, G5), (5, 1, F5s), (6, 1, E5), (7, 1, D5)],
    [(0, 2, B4), (2, 1, D5), (3, 3, E5)],
    [(0, 1, E5), (1, 1, D5), (2, 2, E5), (4, 1, G5), (5, 1, A5), (6, 2, B5)],
    [(0, 1, A5), (1, 1, G5), (2, 1, F5s), (3, 1, G5), (4, 4, E5)],
]
for k, ph in enumerate(HOOK): phrase(11 + k, ph, v=106)
for k, ph in enumerate(HOOK[:3]): phrase(15 + k, ph, t=1, v=110)
phrase(18, [(0, 1, A5 + 1), (1, 1, G5 + 1), (2, 1, F5s + 1), (3, 1, G5 + 1), (4, 2, A5 + 1), (6, 2, B5 + 1)], v=112)
phrase(19, [(0, 7, 84)], v=116)                       # C6 over A-flat major: the lift note

# ── pad glue (pre-chorus + lift)
for b0, b1 in ((8, 10), (19, 21)):
    t = bar(b0)
    while t < bar(b1) - 1e-6:
        r, q = chord_at(t); nxt = min([s for s, d, rr, qq in CHORDS if s > t + 1e-6] + [bar(b1)])
        for i in Q[q][:3]: sc.note(PAD, t, nxt - t, r + 36 + i, 80)
        t = nxt

# ── render
x, stems = sc.render(PARTS, verb_return=0.3, kick_part=DR)
# hard stop after the last hit: everything fades out by the silence cue
t_stop = fr(J['scenes']['silence'])
n0, n1 = int((t_stop - 0.25) * SR), int(t_stop * SR)
env = np.ones(len(x)); env[n0:n1] = np.linspace(1, 0, n1 - n0) ** 2; env[n1:] = 0
x = x * env[:, None]

# ── SFX (shared library, numeric ids, read-only). One palette: air-hit / soft punch / sweep / glass / bass body.
fx = Sfx(DUR, SR)
HITAIR, PUNCH, POPW, SWEEP, WHOOSH, GLASS, BASSH, RISER, PAPER, BOOM = '2161', '2151', '3005', '168', '1478', '759', '2299', '790', '1530', '1694'
fx.play(0.0, HITAIR, -21); fx.play(0.0, BASSH, -22, rate=1.59)
for k, f in enumerate(J['cues']['question_tiles']): fx.play(fr(f), PUNCH, -29 - k)
for k, f in enumerate(J['cues']['flips']): fx.play(fr(f), POPW, -31 - 0.5 * k)
fx.play(fr(80), SWEEP, -29, align='peak')
fx.play(fr(160), WHOOSH, -28, align='peak'); fx.play(fr(160), HITAIR, -26)
fx.play(fr(200), WHOOSH, -28, align='peak')
fx.play(fr(240), GLASS, -29, maxlen=1.0)
fx.play(fr(280), BASSH, -24, rate=1.59)
fx.play(fr(320), SWEEP, -31, align='peak')
for f in J['cues']['grip_hits']: fx.play(fr(f), BASSH, -23, rate=1.59)
fx.play(fr(440), RISER, -27, align='peak')
fx.play(fr(440), GLASS, -22, maxlen=1.2); fx.play(fr(440), HITAIR, -23); fx.play(fr(440), BASSH, -21, rate=1.59)
fx.play(fr(480), PAPER, -27)
for k, f in enumerate(J['cues']['bursts']): fx.play(fr(f), BOOM, -27 - k); fx.play(fr(f), BASSH, -26 - k, rate=1.59)
fx.play(fr(580), WHOOSH, -27, align='peak')
for k, f in enumerate(J['cues']['title_tiles']): fx.play(fr(f), PUNCH, -28 - 0.5 * k)
fx.play(fr(600), HITAIR, -24); fx.play(fr(600), BASSH, -23, rate=1.59)
for k, f in enumerate(J['cues']['slogan_tiles']): fx.play(fr(f), PUNCH, -31 - 0.3 * k)
fx.play(fr(760), BASSH, -22, rate=1.59)
fx.play(fr(840), HITAIR, -22); fx.play(fr(840), BASSH, -21, rate=1.59)
bus = fx.mix(sc.ir, 0.15, lp=9000)
bus = bus * env[:, None]
if os.environ.get('STEM_DIR'):
    d = os.environ['STEM_DIR']; os.makedirs(d, exist_ok=True)
    sf.write(os.path.join(d, '_music.wav'), x.astype(np.float32), SR); sf.write(os.path.join(d, '_sfxbus.wav'), bus.astype(np.float32), SR)
y = x + bus
y, L, P = master(y, SR, lufs=-15.0)
y[int(t_stop * SR):] = 0
print(f'integrated {L:.1f} LUFS, peak {P:.1f} dBFS')
med, mx, jj = jumps(y, SR)
print(f'median {med:.1f} dB, loudest {mx:.1f} dB, biggest jumps {jj}')
os.makedirs(os.path.join(ROOT, 'sounds'), exist_ok=True)
sf.write(os.path.join(ROOT, 'sounds', 'score.wav'), y.astype(np.float32), SR, subtype='PCM_16')
print('wrote sounds/score.wav')

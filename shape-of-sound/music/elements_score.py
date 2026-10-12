"""一次看懂元素周期表 — the music (imported by music/elements.py, which adds the sound design and masters).

The idea: the periodic table was a melody with notes missing. One 8-bar theme (C major, I – V⁶ – vi – IV | ii⁷ – iii⁷ –
IV – iv – I) runs through the film the way the table runs through history:
  · cold open: a tense A-minor ostinato; the 5.9 slam lands on C, the theme's home chord; then the theme's first bar with
    its top note missing — a question with a hole in it
  · title: the first phrase, whole and warm
  · history: a light discovery groove; Mendeleev's phrase is played with three notes left out; when gallium, scandium and
    germanium are found, those exact notes are played back in
  · the roll call: all 118 elements become running notes (pitch = column, so every row rises and starts over), and over
    them, for the first time, the whole theme sings out — every piece in its place
  · the neighbourhoods: the band, light and playful, the theme passed between instruments
  · the cosmos: no drums; strings, horns and choir. The theme's second phrase arrives with the neutron-star merger and
    turns to F minor (iv) on 「你身上几乎每个原子，都比地球还老」, resolving to C as the film returns home
  · the ending: solo piano, the theme with its gap still open at 「门捷列夫留下的空格」, and a last chord that resolves
    but keeps one note open (Cadd9) — the next empty square
"""
import numpy as np
from engine import SF2, Drums, Score, Synth

BEAT = 0.5
PNO, BASS, CB, MAR, PIZ, STR, STRF, TRM, CHO, HRP, FL, CL, BSN, HRN, TBN, TIMP, PLK, SUB, PAD, BED, DR, VIB = (
    'piano', 'bass', 'contrabass', 'marimba', 'pizz', 'strings', 'strings_fast', 'tremolo', 'choir', 'harp', 'flute',
    'clarinet', 'bassoon', 'horn', 'trombone', 'timpani', 'pluck', 'sub', 'pad', 'bed', 'drums', 'vibes')
PARTS = {
    PNO: SF2('piano', level=-16, verb=0.32), BASS: SF2('ms', 33, level=-19, verb=0.1), CB: SF2('ms', 43, level=-20, verb=0.35),
    MAR: SF2('ms', 12, level=-19, verb=0.22), PIZ: SF2('ms', 45, level=-21, verb=0.3), STR: SF2('ms', 49, level=-18, verb=0.5),
    STRF: SF2('ms', 48, level=-21, verb=0.4), TRM: SF2('ms', 44, level=-24, verb=0.4), CHO: SF2('ms', 52, level=-21, verb=0.6),
    HRP: SF2('ms', 46, level=-20, verb=0.42), FL: SF2('ms', 73, level=-19, verb=0.35), CL: SF2('ms', 71, level=-19, verb=0.32),
    BSN: SF2('ms', 70, level=-21, verb=0.25), HRN: SF2('ms', 60, level=-20, verb=0.45, cap=110), TBN: SF2('ms', 57, level=-23, verb=0.25),
    TIMP: SF2('ms', 47, level=-21, verb=0.4), VIB: SF2('ms', 11, level=-22, verb=0.35),
    PLK: Synth('pluck', level=-22, verb=0.25, bright=1.3, decay=3.2, length=0.4, lp=6500),
    SUB: Synth('sub', level=-23, verb=0.0, duck=0.4, cap=100), PAD: Synth('pad', level=-25, verb=0.5, duck=0.2, cutoff=1600, attack=0.7),
    BED: Synth('pad', level=-28, verb=0.55, duck=0.15, cutoff=1200, attack=0.9),
    DR: Drums({36: 'R8/kick', 38: 'R8/snare', 42: 'R8/hihat'}, fallback_kit=0, level=-23, verb=0.12),
}
# chords: (bass, voicing around middle C)
CH = {'C': (36, [60, 64, 67, 72]), 'G/B': (35, [59, 62, 67, 71]), 'Am': (45, [57, 60, 64, 69]), 'F': (41, [57, 60, 65, 69]),
      'Dm7': (38, [57, 60, 62, 65]), 'Em7': (40, [55, 59, 62, 67]), 'Fm': (41, [56, 60, 65, 68]), 'G': (43, [55, 59, 62, 67]),
      'Gsus': (43, [55, 60, 62, 67]), 'Cadd9': (36, [60, 64, 67, 74]), 'Am7': (45, [55, 60, 64, 67]), 'E7': (40, [56, 59, 62, 64])}
# the theme, in beats: phrase A (bars 1–4) then phrase B (bars 5–8)
THEME = [(0, 1, 76), (1, 1, 79), (2, 2, 84), (4, 1, 83), (5, 1, 81), (6, 2, 79), (8, 1, 81), (9, 1, 84), (10, 1, 88), (11, 1, 86),
         (12, 3, 84), (15, 1, 81),
         (16, 1, 77), (17, 1, 81), (18, 2, 84), (20, 1, 83), (21, 1, 79), (22, 2, 76), (24, 1, 81), (25, 1, 84), (26, 1, 80), (27, 1, 79),
         (28, 4, 76)]
HARM = [(0, 'C'), (4, 'G/B'), (8, 'Am'), (12, 'F'), (16, 'Dm7'), (20, 'Em7'), (24, 'F'), (26, 'Fm'), (28, 'C')]
GAPS = (2, 10, 12)        # Mendeleev's three blanks: the theme's three peaks in phrase A
def harm(b): return [n for x, n in HARM if x <= (b % 32) + 1e-6][-1]

def compose(sc, J, TB):
    rng = np.random.default_rng(118)
    E = TB['elements']; CU, HI, CO = J['cues'], J['hist'], J['cosmos']; DUR = J['duration']
    def note(part, s, d, p, v=80, h=0.005):
        if s < 0 or s >= DUR: return
        sc.note(part, max(0.0, s + (rng.uniform(-h, h) if h else 0)), d, p, v)
    def chord(part, s, d, ps, v=76, h=0.005, roll=0.0):
        for i, p in enumerate(ps): note(part, s + i * roll, d, p, v - (2 if i else 0), h)
    def theme(part, t0, beats=(0, 32), v=80, tr=0, skip=(), legato=0.95, swell=False):
        for b, d, p in THEME:
            if not beats[0] <= b < beats[1] or b in skip: continue
            vv = v + (6 if b % 4 == 0 else 0) + (int(8 * (b - beats[0]) / max(1, beats[1] - beats[0])) if swell else 0)
            note(part, t0 + (b - beats[0]) * BEAT, d * BEAT * legato, p + tr, vv)
    def comp(t0, beats, b0=0, v=0, arp=None, bass=BASS, pad=True, piano=True):
        """Accompaniment under the theme: bass on the bar, a piano arpeggio in eighths, a pad."""
        for k in range(beats):
            s = t0 + k * BEAT; b = b0 + k; root, vo = CH[harm(b)]
            if b % 2 == 0 and (b % 4 == 0 or harm(b) != harm(b - 2)): note(bass, s, 1.9 if b % 4 == 0 else 0.9, root, 76 + v)
            if pad and (b % 4 == 0 or harm(b) != harm(b - 1)): chord(PAD, s, 2.0 if b % 4 == 0 else 1.0, vo, 46 + v, h=0)
            if piano:
                pat = arp or [0, 2, 1, 3]
                note(PNO, s, 0.45, vo[pat[(2 * k) % 4]] - 12, 44 + v); note(PNO, s + 0.25, 0.3, vo[pat[(2 * k + 1) % 4]] - 12, 38 + v)
    def drums(t0, beats, v=0, hat16=False, snare=True):
        for k in range(beats):
            s = t0 + k * BEAT
            if k % 2 == 0: note(DR, s, 0.2, 36, 90 + v)
            if snare and k % 4 == 2: note(DR, s, 0.2, 38, 72 + v)
            note(DR, s + 0.25, 0.1, 42, 46 + v)
            if hat16: note(DR, s, 0.1, 42, 36 + v); note(DR, s + 0.125, 0.1, 42, 28 + v); note(DR, s + 0.375, 0.1, 42, 28 + v)
    def hit(s, name='C', v=104, brass=True, timp=True):
        root, vo = CH[name]
        chord(PNO, s, 1.6, [p + 12 for p in vo[:3]] + [root + 12], v - 12); chord(STR, s, 2.4, vo, v - 18, h=0)
        note(CB, s, 1.6, root, v - 10); note(SUB, s, 1.2, root - 12, v - 12)
        if timp: note(TIMP, s, 0.8, root if root < 48 else root - 12, v)
        if brass: chord(HRN, s, 1.2, vo[:3], v - 24)

    # ═══ cold open (0–14): a playful A-minor groove as the metal melts; near silence and a clock at the cut to black;
    #     the three ticks play the theme's first notes (E, G …) and the slam completes the motif on C
    HK = J['hook']
    chord(PNO, 0.0, 0.5, [57, 64, 69, 71], 92); note(CB, 0.0, 1.0, 33, 90); note(DR, 0.0, 0.2, 36, 100); chord(STR, 0.0, 1.0, [45, 57, 64], 70)
    riff = [57, 60, 64, 62, 60, 64, 67, 64]
    for k in range(int(HK['cut'] / 0.25)):
        s0 = k * 0.25
        note(PLK, s0, 0.2, riff[k % 8] - 12, 60 + (8 if k % 4 == 0 else 0))
        if k % 2 == 0: note(BASS, s0, 0.22, [33, 33, 36, 31][(k // 8) % 4], 74)
        if k % 4 == 0: note(DR, s0, 0.2, 36, 84)
        if k % 4 == 2: note(DR, s0, 0.15, 38, 60)
        note(DR, s0 + 0.125, 0.08, 42, 34)
    for i, p in enumerate([76, 74, 72, 71, 69, 67, 65, 64, 62, 60]):            # the melt: a sliding descent
        note(MAR, HK['melt0'] + i * 0.25, 0.3, p, 70 - i * 2)
    chord(PNO, HK['temp'], 0.4, [64, 69, 72, 76], 84); chord(HRN, HK['temp'], 0.4, [57, 64, 69], 70)
    note(CB, HK['cut'], 3.2, 33, 56); chord(BED, HK['cut'], 3.2, [45, 57, 64], 44, h=0)          # the cut to black: a drone
    for i, p in enumerate([69, 72, 76]): note(MAR, HK['props'][i], 0.6, p, 66)                   # each prediction is written
    for k in range(5): note(PNO, HK['flip'] + k * 0.08, 0.5, [57, 60, 64, 69, 72][k], 70)       # the tile flips
    for k in range(10): note(DR, HK['flip'] + k * 0.25, 0.1, 42, 40 + k * 2)
    note(DR, HK['flip'], 0.2, 36, 84); note(DR, HK['flip'] + 1.0, 0.2, 36, 80); note(DR, HK['flip'] + 2.0, 0.2, 36, 84)
    for k in range(8): note(DR, 9.0 + k * 0.125, 0.1, 38, 36 + k * 5)
    chord(STR, HK['flip'], 2.4, [57, 60, 64, 69], 60, h=0); note(BASS, HK['flip'], 1.0, 45, 70); note(BASS, HK['flip'] + 1.2, 1.0, 43, 70)
    for p, tc in zip([76, 79], HK['checks'][:2]): note(MAR, tc, 0.5, p, 96); note(PLK, tc, 0.3, p + 12, 60)
    note(MAR, HK['checks'][2], 0.4, 81, 90)
    hit(HK['slam'], 'C', 112); note(MAR, HK['slam'], 1.2, 84, 104); chord(CHO, HK['slam'], 2.2, [60, 64, 67], 66)
    chord(PAD, HK['q1'], 1.0, CH['Am'][1], 44, h=0)
    theme(PNO, 12.0, (0, 4), 66, skip=(2,))                              # 他是怎么知道的？ — E, G, … (the C is missing)
    chord(PAD, 12.0, 2.0, CH['C'][1], 40, h=0)
    # ═══ title (14–18) and into history: the first phrase, whole and warm
    theme(PNO, 14.0, (0, 16), 80); theme(STR, 14.0, (0, 16), 58, tr=-12, legato=1.0)
    comp(14.0, 16, 0, v=-4, piano=False)
    # ═══ history (18–56): a light discovery groove
    drums(18.0, 26, v=-10)
    theme(CL, 22.0, (16, 32), 72)                                        # 22–30: the answer phrase on clarinet
    comp(22.0, 16, 16, v=-8)
    for k in range(8): note(PIZ, 18.0 + k * 0.5, 0.3, [CH[harm(8 + k)][1][j] for j in (0, 2, 1, 3)][k % 4] - 12, 60)
    for e in E:                                                          # every tile that lands: a note from the chord
        a = e['appear']
        if 18.6 <= a < 36.8 or 50.6 <= a < 56:
            b = int((a - 14.0) / BEAT); vo = CH[harm(b)][1]
            note(PLK if a > 50 else MAR, a, 0.18, vo[(e['z'] * 3) % 4] + 12 + (12 if a > 50 else 0), 66 if a < 25 else 58)
    note(VIB, HI['p'], 1.8, 88, 66); chord(PAD, HI['p'], 2.4, [72, 76, 79], 46)
    for k in range(5): note(PIZ, 29.0 + k * 0.5, 0.3, [57, 60, 64, 62, 59][k], 58)
    # Newlands: a do-re-mi octave on the keys; Li and Na are the same note; the room laughs; a soft sad trombone
    for k in range(5): note(PIZ, 31.0 + k * 0.25, 0.2, [48, 52, 55, 52, 48][k], 50)                     # tiptoe into the keyboard
    for i, p in enumerate([60, 62, 64, 65, 67, 69, 71, 72]): note(PNO, CU['octave'] + i * 0.25, 0.3, p, 62 + i * 2)
    chord(PNO, CU['octave'] + 2.0, 1.0, [60, 72], 82); chord(VIB, CU['octave'] + 2.0, 1.0, [60, 72], 66)
    for i, (p, d) in enumerate([(58, .45), (57, .45), (56, .45), (55, 1.1)]): note(TBN, CU['laugh'] + 0.3 + i * 0.5, d, p, 52)
    # Mendeleev (36.8–46): parlour piano under the first phrase, with his three blanks left out
    for k in range(5): note(PNO, 36.8 + k * 0.25, 0.3, [48, 52, 55, 60, 64][k], 44 + k * 3)          # the cards: a parlour lead-in
    comp(38.0, 16, 0, v=-10, arp=[0, 3, 1, 2], pad=False)
    theme(CL, 38.0, (0, 16), 68, skip=GAPS); theme(PIZ, 38.0, (0, 16), 48, tr=-12, skip=GAPS)
    for i, (z, b) in enumerate([(31, 2), (21, 10), (32, 12)]):          # found: each blank gets its exact note back
        t = HI['fill'][str(z)]; p = [x for bb, d, x in THEME if bb == b][0]
        note(MAR, t, 0.9, p, 102); note(PNO, t, 0.9, p, 86); note(PLK, t, 0.5, p + 12, 70)
        chord(STR, t, 1.0, CH[['C', 'Am', 'F'][i]][1], 66, h=0); note(DR, t, 0.2, 36, 76)
    theme(CL, 48.5, (28, 32), 66, tr=12)                                  # 名字，都是国名 — a cheeky little tag
    # 50–56: the modern rush to 118
    drums(50.0, 12, v=-6, hat16=True); comp(50.0, 12, 16, v=-6)
    theme(HRN, 50.0, (16, 28), 62)
    chord(CHO, HI['ng'][0], 2.0, [64, 67, 71, 76], 60)
    hit(55.5, 'C', 106)

    # ═══ the map (56–83): clarity — harp and piano on the theme's chords, protons up a scale, electrons into shells
    for k in range(54):
        s = 56.0 + k * BEAT; b = k % 16; root, vo = CH[harm(b)]
        if s >= 82.4: break
        note(HRP, s, 0.9, vo[k % 4] + 12, 54); note(HRP, s + 0.25, 0.6, vo[(k + 2) % 4] + 12, 46)
        if b % 4 == 0: chord(PAD, s, 2.0, vo, 42, h=0); note(BASS, s, 1.8, root, 64)
    scale = [72, 74, 76, 77, 79, 81, 83, 84]
    for z in range(1, 9): note(MAR, 59.4 + (z - 1) * 0.5, 0.4, scale[z - 1], 86)
    for k in range(24): note(PLK, 61.8 + k * 0.075, 0.12, 72 + [0, 2, 4, 5, 7, 9, 11][k % 7] + 12 * (k // 7), 66)
    for i in range(18):
        s = 64.6 + (68.8 - 64.6) * i / 17; shell = 0 if i < 2 else 1 if i < 10 else 2
        note(VIB, round(s / 0.125) * 0.125, 0.5, [72, 76, 79][shell] + (i % 3) * 2, 62)
    for r in range(7): chord(MAR, 67.2 + r * 0.3, 0.3, [60 + [0, 2, 4, 5, 7, 9, 11][r], 67 + [0, 2, 4, 5, 7, 9, 11][r]], 70)
    for i, base in enumerate([60, 72, 84]):                              # Li, Na, K: the same motif in three octaves
        for j, p in enumerate([76, 79, 84]): note(VIB, 69.8 + i * 0.5 + j * 0.125, 0.3, p - 84 + base, 76)
    for k in range(12): note(HRP, 75.4 + k * 0.15, 0.4, 55 + [0, 2, 4, 7, 9][k % 5] + 12 * (k // 5), 66)
    note(TBN, 77.2, 1.4, 43, 54); note(TBN, 77.2, 1.4, 31, 50)
    for k in range(12): note(HRP, 79.4 + k * 0.1, 0.3, 79 - [0, 2, 4, 7, 9][k % 5] - 12 * (k // 5), 58)
    for i, p in enumerate([60, 67, 64, 72]): note(MAR, 80.4 + i * 0.12, 0.5, p, 76)
    for k in range(4): note(DR, 82.5 + k * 0.125, 0.1, 38, 48 + k * 8)
    note(TIMP, 82.0, 1.0, 43, 70)

    # ═══ ROLL CALL (83–103.5): 118 running notes, and over them the whole theme for the first time
    T0 = 84.0                                                            # the theme starts on the bar after H and He
    for e in E:
        t = e['roll']; step = 0.25 if e['period'] <= 3 else 0.125
        b = int((t - T0) // BEAT) if t >= T0 else 0
        vo = CH[harm(b)][1] if t < T0 + 32 * BEAT else CH[['F', 'G', 'G', 'C'][min(3, int((t - T0 - 16) // 1))]][1]
        ladder = sorted({p + 12 * o for o in (0, 1, 2) for p in vo})          # chord tones from middle C up two octaves
        i = int(round(e['lx'] / 31 * (len(ladder) - 1)))
        p = ladder[i]
        if e['f'] is not None: p = ladder[len(ladder) // 3] + (e['f'] % 7)    # the f-block: a rippling flurry
        note(MAR, t, step * 1.6, p, 62 if e['fam'] != 'ng' else 84)
        note(PLK, t, step, p + 12, 46)
        if e['fam'] == 'ng' or e['z'] == 118:                                # each row lands on a noble gas
            note(DR, t, 0.2, 36, 92); chord(STRF, t, 0.5, [x + 12 for x in vo[:3]], 64)
    theme(STR, T0, (0, 32), 94, legato=1.0, swell=True)                      # the whole melody, at last
    theme(HRN, T0, (0, 32), 80, tr=-12, legato=1.0)
    theme(PNO, T0, (0, 32), 80, tr=12)
    for k in range(32):
        s = T0 + k * BEAT; root, vo = CH[harm(k)]
        if k % 2 == 0: note(BASS, s, 0.45, root, 68); note(CB, s, 0.9, root, 54)
        note(DR, s, 0.1, 42, 42); note(DR, s + 0.25, 0.1, 42, 34)
        if k % 2 == 0: note(DR, s, 0.2, 36, 84)
        if k % 4 == 2: note(DR, s, 0.2, 38, 66)
        if k % 4 == 0 or harm(k) != harm(k - 1): chord(PAD, s, 2.0 if k % 4 == 0 else 1.0, vo, 44, h=0)
    for k, nm in enumerate(['F', 'F', 'G', 'G', 'G', 'G', 'G']):              # coda while the last row finishes
        s = T0 + 16 + k * 0.5; root, vo = CH[nm]
        note(BASS, s, 0.45, root, 80); note(DR, s, 0.2, 36 if k % 2 == 0 else 38, 80); chord(STR, s, 0.5, vo, 70, h=0)
    hit(TB['roll_end'], 'C', 112); chord(CHO, TB['roll_end'], 2.0, [60, 64, 67, 72], 70)

    # ═══ the neighbourhoods (104–158): the band, light; the theme passed between instruments
    voices = {'h': (FL, 0), 'alk': (HRN, -12), 'ae': (MAR, 0), 'tm': (MAR, 0), 'ln': (VIB, 0), 'nm': (PNO, 0), 'hal': (BSN, -24), 'ng': (CHO, -12), 'an': (CB, -24)}
    drums(104.0, 108, v=-10)
    comp(104.0, 108, 0, v=-8, piano=True)
    t0 = 104.0
    while t0 < 158.0 - 1e-6:                                              # 8-bar theme cycles from 104
        for b, d, p in THEME:
            s = t0 + b * BEAT
            if s >= 158.0: continue
            dd = next((x for x in J['hood'] if x['t'] - 0.3 <= s < x['out'] + 0.3), None)
            part, tr = voices[dd['id']] if dd else (CL, 0)
            note(part, s, d * BEAT * 0.95, p + tr, 70 if part not in (CHO, CB) else 60)
        t0 += 16.0
    note(DR, CU['na_drop'] + 0.45, 0.2, 36, 98); chord(HRN, CU['na_drop'] + 0.5, 0.4, [60, 64, 67], 86)
    for k in range(8): note(PLK, 113.5 + k * 0.125, 0.15, 72 + [0, 4, 7, 12, 16, 19, 24, 28][k], 62)
    for i, t in enumerate(CU['fireworks']): note(PLK, t - 0.4, 0.4, 84 + i * 3, 46)
    for tool in J['tools']: note(MAR, tool['t'], 0.4, 84, 84); note(DR, tool['t'], 0.2, 38, 64)
    for k in range(4): note(PIZ, 142.6 + k * 0.25, 0.15, [45, 48, 51, 52][k], 76)
    chord(CHO, 147.4, 2.0, [64, 69, 71, 76], 56); chord(PAD, 149.4, 2.6, [60, 64, 67, 72], 46)
    chord(TRM, 152.4, 5.5, [48, 55, 58], 54)

    # ═══ the cosmos (158–178): no drums. Awe, then the theme with the minor iv on 「比地球还老」, resolving home
    chord(TRM, 158.0, 4.0, [45, 52, 57], 58); note(CB, 158.0, 4.0, 33, 60); chord(BED, 158.0, 4.0, CH['Am7'][1], 50, h=0)
    for k in range(6): note(TIMP, 158.6 + k * 0.25, 0.2, 36, 30 + k * 8)                     # a roll into the Big Bang
    note(SUB, CO['bb'], 2.6, 24, 110); chord(STR, CO['bb'], 1.6, [36, 43, 48, 55, 60, 64], 86); note(TIMP, CO['bb'], 1.0, 36, 108)
    chord(CHO, CO['bb'] + 0.1, 1.5, [60, 64, 67], 66)
    # phrase A (162–170): strings and choir, a horn answering, the harp rising like starlight
    theme(STR, 162.0, (0, 16), 80, legato=1.0, swell=True); theme(CHO, 162.0, (0, 16), 58, tr=-12, legato=1.0)
    theme(HRN, 164.0, (4, 16), 62, tr=-12, legato=1.0)
    for k in range(16):
        s = 162.0 + k * BEAT; root, vo = CH[harm(k)]
        note(HRP, s, 0.6, vo[k % 4] + 12, 58); note(HRP, s + 0.25, 0.5, vo[(k + 2) % 4] + 24, 50)
        if k % 4 == 0 or harm(k) != harm(k - 1): note(CB, s, 2.0, root, 66); chord(PAD, s, 2.0, vo, 46, h=0)
    note(TIMP, 165.8, 0.8, 41, 96); chord(HRN, 165.8, 1.0, [53, 57, 60], 74)                 # a star explodes
    # the chirp gets the floor: F held quietly underneath
    chord(BED, 169.4, 2.8, CH['F'][1], 48, h=0); note(CB, 169.4, 2.6, 41, 54)
    # phrase B (172–178): the merger, gold; F → F minor on "older than the Earth"; home to C
    hit(CO['ns'], 'Dm7', 100, brass=True); chord(CHO, CO['ns'], 2.0, [62, 65, 69], 70)
    theme(STR, 172.0, (16, 28), 86, legato=1.0, swell=True); theme(HRN, 172.0, (16, 28), 70, tr=-12, legato=1.0)
    theme(PNO, 172.0, (16, 28), 66, tr=12)
    for k in range(12):
        s = 172.0 + k * BEAT; b = 16 + k; root, vo = CH[harm(b)]
        note(HRP, s, 0.6, vo[k % 4] + 12, 58)
        if b % 2 == 0: note(CB, s, 1.0, root, 70); chord(CHO, s, 1.0, vo, 56, h=0); chord(PAD, s, 1.0, vo, 46, h=0)
    chord(STR, 177.0, 1.0, CH['Fm'][1], 84, h=0); note(HRN, 177.0, 1.0, 68, 74)              # the iv minor: the tear
    hit(178.0, 'C', 98, brass=False, timp=True); theme(STR, 178.0, (28, 32), 78, legato=1.0); chord(CHO, 178.0, 2.0, [60, 64, 67, 72], 62)

    # ═══ the ending (178–192): solo piano; the theme with its gap still open; a last chord that keeps one note open
    chord(BED, 180.0, 8.0, CH['C'][1], 40, h=0)
    for k in range(16):
        s = 180.0 + k * BEAT; root, vo = CH[harm(k)]
        if k % 4 == 0: note(PNO, s, 1.8, root, 50)
        note(PNO, s + 0.25, 0.4, vo[(k * 2) % 4], 38)
    theme(PNO, 180.0, (0, 16), 64, skip=(10,))                           # the E6 at 「空格」 is missing — the gap is still there
    note(VIB, CU['q119'], 0.5, 79, 60); note(VIB, CU['q119'] + 0.25, 0.5, 84, 60)
    chord(STR, 186.0, 2.4, CH['F'][1], 56, h=0)
    # end card: the last bar of the theme (F → F minor), and home on C — with a D left open on top
    theme(PNO, 188.0, (24, 28), 70); theme(STR, 188.0, (24, 28), 62, legato=1.0)
    chord(STR, 188.0, 1.0, CH['F'][1], 58, h=0); chord(STR, 189.0, 1.0, CH['Fm'][1], 60, h=0)
    root, vo = CH['Cadd9']
    chord(PNO, 190.0, 2.0, [48, 55, 64, 67, 74], 70, roll=0.04); chord(STR, 190.0, 2.0, vo, 60, h=0); note(CB, 190.0, 2.0, 36, 60)
    note(HRP, 190.3, 1.6, 86, 56)

    # a soft continuous bed (the theme's chords, every 8 s), so no stretch of the film falls silent
    for bar in range(1, int(DUR // 2) - 1):
        s0 = bar * 2.0
        if 158.0 <= s0 < 192.0 or s0 < 10.0: continue
        chord(BED, s0, 2.05, CH[harm((bar % 4) * 4)][1], 46, h=0)

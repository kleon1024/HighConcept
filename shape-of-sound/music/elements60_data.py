"""Data for the 60-second periodic-table film (元素周期表 = 宇宙的配料表): src/elements60/t60.json.

Reads the 118 elements from src/elements/table.json (written by music/elements_data.py) and PubChem's periodic table
(music/data/pubchem_periodic_table.csv: state at 25 °C, melting point in K), and the beat times from
src/elements60/e60.json. Adds, per element:
  st    state at room temperature: g / l / s, or u (unknown: 104–118)
  mp    melting point (K), for the melting-point towers
  ab    tile size in the "the universe is mostly hydrogen" lens (from log abundance by number; illustrative)
  rain  when the tile lands in the opening (a diagonal wave)
  gl    when it sounds in the row-by-row glissandi (each row on one beat: periodicity you can hear)
  yr    when it drops in the discovery-year lens (None = after 1869, it arrives in the rush after Mendeleev)
  ot    when it lights up by cosmic origin
and the body silhouette for the ending: 118 dots (by number of atoms: H 62 %, O 24 %, C 12 %, N, Ca, P).
Run: python3 music/elements60_data.py
"""
import csv, json, os
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TB = json.load(open(os.path.join(ROOT, 'src', 'elements', 'table.json'), encoding='utf-8'))
J = json.load(open(os.path.join(ROOT, 'src', 'elements60', 'e60.json'), encoding='utf-8'))
PC = {int(r['AtomicNumber']): r for r in csv.DictReader(open(os.path.join(HERE, 'data', 'pubchem_periodic_table.csv'), encoding='utf-8'))}
E = [dict(z=e['z'], s=e['s'], cn=e['cn'], fam=e['fam'], year=e['year'], origin=e['origin'], period=e['period'],
          group=e['group'], f=e['f'], x=e['x'], y=e['y'], lx=e['lx']) for e in TB['elements']]
q = lambda t, g=1 / 32: round(round(t / g) * g, 4)

# ── state and melting point
for e in E:
    r = PC[e['z']]; s = r['StandardState']
    e['st'] = 'u' if e['z'] >= 104 else {'Gas': 'g', 'Liquid': 'l', 'Solid': 's'}[s]
    e['mp'] = float(r['MeltingPoint']) if r['MeltingPoint'] else None
assert sum(e['st'] == 'l' for e in E) == 2 and sum(e['st'] == 'g' for e in E) == 11

# ── abundance by number (log10, H = 12; solar-system values after Asplund et al. 2009, rounded). Others: a rough
#    falloff. Only used to size tiles in an illustrative lens ("示意"); the claim on screen is H ≈ 92 % of atoms.
A = dict(H=12.0, He=10.93, O=8.69, C=8.43, Ne=7.93, N=7.83, Mg=7.60, Si=7.51, Fe=7.50, S=7.12, Ar=6.40, Al=6.45, Ca=6.34,
         Na=6.24, Ni=6.22, Cr=5.64, Cl=5.50, Mn=5.43, P=5.41, K=5.03, Ti=4.95, Co=4.99, Zn=4.56, F=4.56, Cu=4.19, V=3.93)
for e in E:
    a = A.get(e['s'], max(0.0, 3.4 - 0.03 * (e['z'] - 30)))
    e['ab'] = 0.16 + 0.62 * min(1, max(0, (a - 3) / 5.7)) ** 2
EZ = {e['z']: e for e in E}
EZ[1]['ab'], EZ[2]['ab'] = 6.4, 2.5

# ── the opening: every tile lands in a diagonal wave
H0 = J['hook']; r0, r1 = H0['rain']
order = sorted(E, key=lambda e: (e['x'] + 1.6 * e['y'], e['z']))
for i, e in enumerate(order): e['rain'] = q(r0 + (r1 - r0) * i / (len(order) - 1), 1 / 64)

# ── the glissandi: row r starts on its beat; its elements (in order of Z) spread over 0.42 s
G = J['read']['rows']
for p in range(1, 8):
    row = sorted([e for e in E if e['period'] == p], key=lambda e: e['z'])
    for k, e in enumerate(row): e['gl'] = round(G[p - 1] + 0.42 * k / max(1, len(row) - 1), 4)

# ── discovery years (lens 3): the ancient nine together, then by year to 1869; the rest rush in after the gaps fill
Y = J['years']
for e in E:
    yv = e['year']
    if yv == -1000: e['yr'] = Y['ancient']
    elif yv < 1600: e['yr'] = Y['medieval']
    elif e['z'] == 15: e['yr'] = Y['p']
    elif yv <= 1869: e['yr'] = q(Y['y1700'] + (Y['y1869'] - Y['y1700']) * (yv - 1700) / 169)
    elif e['z'] in (31, 21, 32): e['yr'] = J['gaps']['fill'][str(e['z'])]
    else: e['yr'] = q(Y['rush'][0] + (Y['rush'][1] - Y['rush'][0]) * (yv - 1870) / (2016 - 1870))
assert sum(1 for e in E if e['year'] <= 1869) == 63

# ── cosmic origin: the Big Bang, then stars (sweeping left to right), then explosions, then the merger, then the lab
C = J['cosmos']
for e in E:
    o = e['origin']
    if o == 'bb': e['ot'] = C['bb']
    elif o == 'lm': e['ot'] = q(C['stars'] + 0.9 * e['x'] / 17)
    elif o in ('ms', 'wd', 'cr'): e['ot'] = q(C['sn'] + 0.7 * e['x'] / 17)
    elif o == 'ns': e['ot'] = q(C['ns'] + 0.3 * e['x'] / 17)
    else: e['ot'] = q(C['lab'] + 0.4 * e['x'] / 17)

# ── the body: a superflat figure in table units (centred on x = 9), filled with 118 dots
BODY = {
    'head': [9.0, 1.05, 0.95],
    'polys': [
        [[8.55, 1.9], [9.45, 1.9], [9.5, 2.6], [8.5, 2.6]],                                       # neck
        [[6.95, 2.55], [11.05, 2.55], [10.65, 5.75], [7.35, 5.75]],                               # torso
        [[6.95, 2.55], [7.25, 3.6], [6.55, 6.05], [5.75, 5.95], [6.25, 2.85]],                     # left arm
        [[11.05, 2.55], [10.75, 3.6], [11.45, 6.05], [12.25, 5.95], [11.75, 2.85]],                # right arm
        [[7.35, 5.75], [8.95, 5.75], [8.75, 9.35], [7.55, 9.35]],                                  # left leg
        [[9.05, 5.75], [10.65, 5.75], [10.45, 9.35], [9.25, 9.35]],                                # right leg
    ],
}
def inside(x, y):
    hx, hy, hr = BODY['head']
    if (x - hx) ** 2 + (y - hy) ** 2 <= hr ** 2: return True
    for P in BODY['polys']:
        n = len(P); c = False
        for i in range(n):
            (x1, y1), (x2, y2) = P[i], P[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
        if c: return True
    return False
def grid(d):
    pts = []
    for j, y in enumerate(np.arange(0.1, 9.4, d * 0.866)):
        for x in np.arange(5.6 + (d / 2 if j % 2 else 0), 12.4, d):
            if inside(x, y): pts.append((round(float(x), 3), round(float(y), 3)))
    return pts
lo, hi = 0.3, 1.2
for _ in range(40):
    mid = (lo + hi) / 2
    if len(grid(mid)) >= 118: lo = mid
    else: hi = mid
pts = grid(lo)
rng = np.random.default_rng(65)
keep = sorted(rng.choice(len(pts), 118, replace=False)); pts = [pts[i] for i in keep]
kinds = ['H'] * 73 + ['O'] * 29 + ['C'] * 14 + ['N', 'Ca']                                       # by number of atoms
rng.shuffle(kinds)
# each tile flies to the body point nearest its place in the table (a gentle shuffle, not a scramble)
tx = sorted(range(118), key=lambda i: (E[i]['y'], E[i]['x']))
bp = sorted(range(118), key=lambda i: (pts[i][1], pts[i][0]))
for a, b in zip(tx, bp):
    E[a]['bx'], E[a]['by'] = pts[b]; E[a]['bk'] = kinds[b]

out = os.path.join(ROOT, 'src', 'elements60', 't60.json')
json.dump(dict(elements=E, body=BODY, dot=round(lo, 3)), open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
if __name__ == '__main__':
    print('dot spacing', round(lo, 3), '| liquids', [e['s'] for e in E if e['st'] == 'l'], '| gases', [e['s'] for e in E if e['st'] == 'g'])
    print('rain', E[0]['rain'], '…', max(e['rain'] for e in E), '| gl row 7 ends', max(e['gl'] for e in E))

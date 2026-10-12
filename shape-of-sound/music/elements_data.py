"""The 118 elements for the periodic-table film: one source for the picture (src/elements/table.json) and the score.

Each row: Z, symbol, Chinese name, family, discovery year (the year it was first recognised or isolated as an element;
ancient = -1000), main cosmic origin (simplified after Jennifer Johnson's "origin of the elements" chart).
Run: python3 music/elements_data.py  → writes src/elements/table.json (positions, families, years, origins, roll-call times)
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'elements', 'table.json')

A = -1000  # known since antiquity
# fam: h alk ae tm pt md nm hal ng ln an
# origin: bb (big bang) cr (cosmic rays) lm (dying low-mass stars) ms (exploding massive stars)
#         wd (exploding white dwarfs) ns (merging neutron stars) decay (decay of U/Th) hm (human-made)
E = [
    (1, 'H', '氢', 'h', 1766, 'bb'), (2, 'He', '氦', 'ng', 1895, 'bb'),
    (3, 'Li', '锂', 'alk', 1817, 'cr'), (4, 'Be', '铍', 'ae', 1798, 'cr'), (5, 'B', '硼', 'md', 1808, 'cr'),
    (6, 'C', '碳', 'nm', A, 'lm'), (7, 'N', '氮', 'nm', 1772, 'lm'), (8, 'O', '氧', 'nm', 1774, 'ms'),
    (9, 'F', '氟', 'hal', 1810, 'ms'), (10, 'Ne', '氖', 'ng', 1898, 'ms'),
    (11, 'Na', '钠', 'alk', 1807, 'ms'), (12, 'Mg', '镁', 'ae', 1755, 'ms'), (13, 'Al', '铝', 'pt', 1825, 'ms'),
    (14, 'Si', '硅', 'md', 1824, 'ms'), (15, 'P', '磷', 'nm', 1669, 'ms'), (16, 'S', '硫', 'nm', A, 'ms'),
    (17, 'Cl', '氯', 'hal', 1774, 'ms'), (18, 'Ar', '氩', 'ng', 1894, 'ms'),
    (19, 'K', '钾', 'alk', 1807, 'ms'), (20, 'Ca', '钙', 'ae', 1808, 'ms'), (21, 'Sc', '钪', 'tm', 1879, 'ms'),
    (22, 'Ti', '钛', 'tm', 1791, 'ms'), (23, 'V', '钒', 'tm', 1801, 'wd'), (24, 'Cr', '铬', 'tm', 1797, 'wd'),
    (25, 'Mn', '锰', 'tm', 1774, 'wd'), (26, 'Fe', '铁', 'tm', A, 'wd'), (27, 'Co', '钴', 'tm', 1735, 'ms'),
    (28, 'Ni', '镍', 'tm', 1751, 'wd'), (29, 'Cu', '铜', 'tm', A, 'ms'), (30, 'Zn', '锌', 'tm', 1746, 'ms'),
    (31, 'Ga', '镓', 'pt', 1875, 'ms'), (32, 'Ge', '锗', 'md', 1886, 'ms'), (33, 'As', '砷', 'md', 1250, 'ms'),
    (34, 'Se', '硒', 'nm', 1817, 'ms'), (35, 'Br', '溴', 'hal', 1826, 'ms'), (36, 'Kr', '氪', 'ng', 1898, 'ms'),
    (37, 'Rb', '铷', 'alk', 1861, 'ms'), (38, 'Sr', '锶', 'ae', 1790, 'lm'), (39, 'Y', '钇', 'tm', 1794, 'lm'),
    (40, 'Zr', '锆', 'tm', 1789, 'lm'), (41, 'Nb', '铌', 'tm', 1801, 'lm'), (42, 'Mo', '钼', 'tm', 1778, 'lm'),
    (43, 'Tc', '锝', 'tm', 1937, 'hm'), (44, 'Ru', '钌', 'tm', 1844, 'ns'), (45, 'Rh', '铑', 'tm', 1803, 'ns'),
    (46, 'Pd', '钯', 'tm', 1803, 'ns'), (47, 'Ag', '银', 'tm', A, 'ns'), (48, 'Cd', '镉', 'tm', 1817, 'lm'),
    (49, 'In', '铟', 'pt', 1863, 'lm'), (50, 'Sn', '锡', 'pt', A, 'lm'), (51, 'Sb', '锑', 'md', 1540, 'ns'),
    (52, 'Te', '碲', 'md', 1782, 'ns'), (53, 'I', '碘', 'hal', 1811, 'ns'), (54, 'Xe', '氙', 'ng', 1898, 'ns'),
    (55, 'Cs', '铯', 'alk', 1860, 'ns'), (56, 'Ba', '钡', 'ae', 1808, 'lm'),
    (57, 'La', '镧', 'ln', 1839, 'lm'), (58, 'Ce', '铈', 'ln', 1803, 'lm'), (59, 'Pr', '镨', 'ln', 1885, 'lm'),
    (60, 'Nd', '钕', 'ln', 1885, 'lm'), (61, 'Pm', '钷', 'ln', 1945, 'hm'), (62, 'Sm', '钐', 'ln', 1879, 'ns'),
    (63, 'Eu', '铕', 'ln', 1901, 'ns'), (64, 'Gd', '钆', 'ln', 1880, 'ns'), (65, 'Tb', '铽', 'ln', 1843, 'ns'),
    (66, 'Dy', '镝', 'ln', 1886, 'ns'), (67, 'Ho', '钬', 'ln', 1878, 'ns'), (68, 'Er', '铒', 'ln', 1843, 'ns'),
    (69, 'Tm', '铥', 'ln', 1879, 'ns'), (70, 'Yb', '镱', 'ln', 1878, 'ns'), (71, 'Lu', '镥', 'ln', 1907, 'ns'),
    (72, 'Hf', '铪', 'tm', 1923, 'lm'), (73, 'Ta', '钽', 'tm', 1802, 'ns'), (74, 'W', '钨', 'tm', 1783, 'lm'),
    (75, 'Re', '铼', 'tm', 1925, 'ns'), (76, 'Os', '锇', 'tm', 1803, 'ns'), (77, 'Ir', '铱', 'tm', 1803, 'ns'),
    (78, 'Pt', '铂', 'tm', 1748, 'ns'), (79, 'Au', '金', 'tm', A, 'ns'), (80, 'Hg', '汞', 'tm', A, 'lm'),
    (81, 'Tl', '铊', 'pt', 1861, 'lm'), (82, 'Pb', '铅', 'pt', A, 'lm'), (83, 'Bi', '铋', 'pt', 1753, 'lm'),
    (84, 'Po', '钋', 'pt', 1898, 'decay'), (85, 'At', '砹', 'hal', 1940, 'decay'), (86, 'Rn', '氡', 'ng', 1899, 'decay'),
    (87, 'Fr', '钫', 'alk', 1939, 'decay'), (88, 'Ra', '镭', 'ae', 1898, 'decay'),
    (89, 'Ac', '锕', 'an', 1899, 'decay'), (90, 'Th', '钍', 'an', 1829, 'ns'), (91, 'Pa', '镤', 'an', 1913, 'decay'),
    (92, 'U', '铀', 'an', 1789, 'ns'), (93, 'Np', '镎', 'an', 1940, 'hm'), (94, 'Pu', '钚', 'an', 1940, 'hm'),
    (95, 'Am', '镅', 'an', 1944, 'hm'), (96, 'Cm', '锔', 'an', 1944, 'hm'), (97, 'Bk', '锫', 'an', 1949, 'hm'),
    (98, 'Cf', '锎', 'an', 1950, 'hm'), (99, 'Es', '锿', 'an', 1952, 'hm'), (100, 'Fm', '镄', 'an', 1952, 'hm'),
    (101, 'Md', '钔', 'an', 1955, 'hm'), (102, 'No', '锘', 'an', 1958, 'hm'), (103, 'Lr', '铹', 'an', 1961, 'hm'),
    # 104–118: their Chinese names use characters the project font can't draw, so tiles show symbols only
    (104, 'Rf', '', 'tm', 1969, 'hm'), (105, 'Db', '', 'tm', 1970, 'hm'), (106, 'Sg', '', 'tm', 1974, 'hm'),
    (107, 'Bh', '', 'tm', 1981, 'hm'), (108, 'Hs', '', 'tm', 1984, 'hm'), (109, 'Mt', '', 'tm', 1982, 'hm'),
    (110, 'Ds', '', 'tm', 1994, 'hm'), (111, 'Rg', '', 'tm', 1994, 'hm'), (112, 'Cn', '', 'tm', 1996, 'hm'),
    (113, 'Nh', '', 'pt', 2004, 'hm'), (114, 'Fl', '', 'pt', 1999, 'hm'), (115, 'Mc', '镆', 'pt', 2004, 'hm'),
    (116, 'Lv', '', 'pt', 2000, 'hm'), (117, 'Ts', '', 'hal', 2010, 'hm'), (118, 'Og', '', 'ng', 2002, 'hm'),
]

def place(z):
    """(period 1..7, group 1..18) for the main table, or ('f', row 6/7, index 0..14) for La–Lu / Ac–Lr."""
    if 57 <= z <= 71: return 6, None, z - 57
    if 89 <= z <= 103: return 7, None, z - 89
    starts = [(1, 1), (3, 2), (11, 3), (19, 4), (37, 5), (55, 6), (87, 7)]
    period = max(p for s, p in starts if z >= s)
    first = dict((p, s) for s, p in starts)[period]
    k = z - first
    if period == 1: group = 1 if z == 1 else 18
    elif period in (2, 3): group = k + 1 if k < 2 else k + 11
    elif period in (4, 5): group = k + 1
    else:  # 6, 7: after group 2 the f-block (15 incl. La/Lu, Ac/Lr) sits outside; Hf/Rf continue at group 4
        group = k + 1 if k < 2 else k - 13
    return period, group, None

def long_col(z, period, group, fidx):
    """Column in the 32-wide long form: s-block 0–1, f-block 2–15 (La–Yb / Ac–No), Lu/Lr at group 3 (16), d 17–25, p 26–31."""
    if fidx is not None: return 2 + fidx if fidx < 14 else 16
    if group <= 2: return group - 1
    if period <= 5 and group == 3: return 16
    return group + 13

table = []
for z, sym, cn, fam, year, origin in E:
    period, group, fidx = place(z)
    if fidx is None: x, y = group - 1, period - 1
    else: x, y = 2 + fidx, 7.35 + (period - 6)          # f rows hang under the table
    table.append(dict(z=z, s=sym, cn=cn, fam=fam, year=year, origin=origin, period=period, group=group,
                      f=fidx, x=x, y=y, lx=long_col(z, period, group, fidx), ly=period - 1))

assert len(table) == 118 and len({(e['x'], e['y']) for e in table}) == 118
assert len({(e['lx'], e['ly']) for e in table}) == 118

# ── the roll call: rows 1–3 in eighth notes, rows 4–7 in sixteenths (f-block played in place), a half-beat
#    breath after each noble gas. Pitch = column, so every row is a rising phrase that starts over: periodicity.
ROLL_START = 83.0
t = ROLL_START
order = sorted(table, key=lambda e: (e['period'], e['lx']))
for e in order:
    step = 0.25 if e['period'] <= 3 else 0.125
    e['roll'] = round(t, 4); t += step
    if e['fam'] == 'ng' or e['z'] == 118: t += 0.5
ROLL_END = t

# ── history: when each tile drops in (quantised to sixteenths so the score can play it), and when Mendeleev lays its card
J = json.load(open(os.path.join(HERE, '..', 'src', 'elements', 'elements.json'), encoding='utf-8'))
H = J['hist']; q = lambda t: round(round(t / 0.125) * 0.125, 3)
ancient = [e for e in table if e['year'] == -1000]
def appear(e):
    fill = H['fill'].get(str(e['z']))
    if fill: return fill
    if e['year'] == -1000: return H['ancient'][0] + (H['ancient'][1] - H['ancient'][0]) * ancient.index(e) / (len(ancient) - 1)
    if e['year'] < 1600: return H['medieval'][0] if e['year'] < 1400 else H['medieval'][1]
    if e['z'] == 15: return H['p']
    if e['year'] <= 1869: return H['y1700'] + (H['y1869'] - H['y1700']) * (e['year'] - 1700) / 169
    return H['late'][0] + (H['late'][1] - H['late'][0]) * (e['year'] - 1887) / (2016 - 1887)
import random
rr = random.Random(7)
for e in table:
    e['appear'] = q(appear(e))
    e['lay'] = q(38.4 + rr.random() * 2.4) if e['year'] <= 1869 else None
known_1869 = sum(1 for e in table if e['year'] <= 1869)
json.dump(dict(elements=table, roll_start=ROLL_START, roll_end=round(ROLL_END, 3), known_1869=known_1869),
          open(OUT, 'w'), ensure_ascii=False, indent=0)
if __name__ == '__main__':
    print('known by 1869:', known_1869, '| roll call', ROLL_START, '→', round(ROLL_END, 2))

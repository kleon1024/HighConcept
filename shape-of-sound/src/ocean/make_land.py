"""Project Natural Earth 1:50m land (public domain) to one SVG path: x = (lon + 180) * 10, y = (90 - lat) * 10.
Usage: python3 src/ocean/make_land.py ne_50m_land.geojson  → src/ocean/land.json"""
import json, os, sys
K, TOL = 10, 0.12          # 10 units per degree; Douglas–Peucker tolerance in degrees
def dp(pts, tol):
    if len(pts) < 3: return pts
    (x1, y1), (x2, y2) = pts[0], pts[-1]; dx, dy = x2 - x1, y2 - y1; n = (dx * dx + dy * dy) ** 0.5 or 1e-9
    i, dmax = 0, 0
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + x2 * y1 - y2 * x1) / n
        if d > dmax: i, dmax = k, d
    if dmax <= tol: return [pts[0], pts[-1]]
    return dp(pts[:i + 1], tol)[:-1] + dp(pts[i:], tol)
d = []
for f in json.load(open(sys.argv[1]))['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        for ring in poly:
            pts = [tuple(p) for p in ring]; h = len(pts) // 2          # a closed ring: simplify its two halves
            r = dp(pts[:h + 1], TOL)[:-1] + dp(pts[h:], TOL)
            if len(r) < 4: continue
            d.append('M' + 'L'.join(f'{(x + 180) * K:.0f},{(90 - y) * K:.0f}' for x, y in r) + 'Z')
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'land.json')
json.dump({'k': K, 'w': 360 * K, 'h': 180 * K, 'd': ''.join(d), 'source': 'Natural Earth 1:50m land (public domain)'}, open(out, 'w'))
print(len(d), 'rings,', os.path.getsize(out) // 1024, 'KB')

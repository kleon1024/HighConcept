// Extra drawing helpers for the video: parade walkers, torn slit, Z slab, star-burst, ransom lines, call-out plates.
(function (root) {
  const { C, P, poly, strand, strand2, dots, cracks, splat, cutout, kitsune, oni, hannya, pumpkin, glyph, f1, rng } = root.P5K;
  const MASKS = { oni, kitsune, hannya, pumpkin };

  // ---------- easing ----------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const E = {
    out3: (t) => 1 - Math.pow(1 - clamp(t), 3),
    in3: (t) => Math.pow(clamp(t), 3),
    io3: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    back: (t, s = 2.2) => { t = clamp(t) - 1; return 1 + (s + 1) * t * t * t + s * t * t; },
  };
  const prog = (f, a, b) => clamp((f - a) / (b - a));
  // slam: big -> 1 with overshoot over n frames
  const slam = (f, f0, n = 4, from = 1.6) => { if (f < f0) return null; const p = (f - f0) / n; return p >= 1.6 ? 1 : (p < 1 ? lerp(from, 0.94, E.out3(p)) : lerp(0.94, 1, E.out3((p - 1) / 0.6))); };

  // ---------- ransom line: array of [char, opts] laid along an angle; each tile slams at its own frame ----------
  function ransom(f, items, ox, oy, angDeg, f0, stagger = 2) {
    const a = angDeg * Math.PI / 180;
    let s = '';
    items.forEach(([ch, d, o], i) => {
      const fi = f0 + i * stagger, k = slam(f, fi, 3, 1.7);
      if (k === null) return;
      const x = ox + Math.cos(a) * d, y = oy + Math.sin(a) * d;
      const jitter = (i % 2 ? 1 : -1) * 4 * (1 - clamp((f - fi) / 4));
      s += `<g transform="translate(${f1(x)},${f1(y)}) scale(${f1(k * 100) / 100}) translate(${f1(-x)},${f1(-y)})">` +
        glyph(ch, Object.assign({ x, y }, o, { rot: angDeg + (o.rot || 0) + jitter })) + `</g>`;
    });
    return s;
  }

  // ---------- parade walker (silhouette, facing right, feet at 0,0) ----------
  function walker(type, mask, phase, s = 1, seed = 1) {
    const r = rng(seed);
    const bob = -10 * Math.abs(Math.sin(phase * Math.PI));
    const step = Math.sin(phase * Math.PI);
    let g = '';
    // feet / geta
    g += poly([[-30 + 22 * step, -6], [10 + 22 * step, -6], [14 + 22 * step, 6], [-34 + 22 * step, 6]], C.K);
    g += poly([[-20 - 22 * step, -6], [20 - 22 * step, -6], [24 - 22 * step, 6], [-24 - 22 * step, 6]], C.K);
    g += `<g transform="translate(0,${f1(bob)})">`;
    // robe with forward lean
    const lean = 0.16;
    const robe = [[-58, -300], [62, -300], [96, -20], [-84, -20]].map(([x, y]) => [x - y * lean, y]);
    g += poly(robe, C.K);
    // kimono details: white collar V, grey obi, hem line
    g += poly([[-10, -300], [6, -300], [40, -200], [30, -196]].map(([x, y]) => [x - y * lean, y]), C.W);
    g += poly([[22, -300], [36, -300], [44, -206], [36, -202]].map(([x, y]) => [x - y * lean, y]), C.W);
    g += poly([[-70, -200], [76, -200], [79, -176], [-73, -176]].map(([x, y]) => [x - y * lean, y]), C.G2);
    g += `<path d="${strand2(-50 + 120 * lean, -150, -76, -26, 8, 4, -2)}" fill="${C.G3}"/>`;
    // back sleeve swinging
    g += poly([[-30, -290], [10, -280], [-30 - 30 * step, -150], [-86 - 30 * step, -160]].map(([x, y]) => [x - y * lean, y]), C.K);
    // head: hood / hair silhouette
    g += `<path d="M${f1(-34 + 340 * lean)},-300 C${f1(-60 + 380 * lean)},-360 ${f1(-30 + 430 * lean)},-410 ${f1(20 + 420 * lean)},-404 C${f1(60 + 410 * lean)},-396 ${f1(70 + 360 * lean)},-340 ${f1(46 + 300 * lean)},-296 Z" fill="${C.K}"/>`;
    // props (front arm)
    const hx = 70 - (-210) * lean, hy = -210;
    if (type === 'lantern') {
      g += `<path d="M${f1(hx)},${hy} L${f1(hx + 120)},${hy - 120}" stroke="${C.K}" stroke-width="9"/>`;
      const lx = hx + 120, ly = hy - 120 + 24 + 4 * step;
      g += `<path d="M${f1(lx)},${f1(ly - 24)} L${f1(lx)},${f1(ly)}" stroke="${C.K}" stroke-width="4"/>`;
      g += `<ellipse cx="${f1(lx)}" cy="${f1(ly + 46)}" rx="36" ry="46" fill="${C.R}" stroke="${C.K}" stroke-width="5"/>`;
      for (let k = -2; k <= 2; k++) g += `<path d="M${f1(lx - 34 * Math.cos(k * 0.5))},${f1(ly + 46 + k * 15)} L${f1(lx + 34 * Math.cos(k * 0.5))},${f1(ly + 46 + k * 15)}" stroke="${C.K}" stroke-width="3"/>`;
      g += `<rect x="${f1(lx - 20)}" y="${f1(ly - 4)}" width="40" height="10" fill="${C.K}"/><rect x="${f1(lx - 20)}" y="${f1(ly + 86)}" width="40" height="10" fill="${C.K}"/>`;
      g += `<path d="M${f1(lx - 18)},${f1(ly + 20)} Q${f1(lx - 26)},${f1(ly + 46)} ${f1(lx - 18)},${f1(ly + 72)}" stroke="${C.W}" stroke-width="5" fill="none"/>`;
    } else if (type === 'umbrella') {
      g += `<path d="M${f1(hx)},${hy} L${f1(hx - 10)},${hy - 250}" stroke="${C.K}" stroke-width="8"/>`;
      const ux = hx - 10, uy = hy - 250;
      g += poly([[ux - 150, uy + 50], [ux, uy - 30], [ux + 150, uy + 50]], C.K);
      for (let k = -3; k <= 3; k++) g += `<path d="M${ux},${uy - 26} L${ux + k * 48},${uy + 46}" stroke="${C.R}" stroke-width="3"/>`;
    } else if (type === 'staff') {
      g += `<path d="M${f1(hx)},${hy} L${f1(hx + 40)},${hy - 260}" stroke="${C.K}" stroke-width="9"/>`;
      g += `<circle cx="${f1(hx + 42)}" cy="${hy - 270}" r="22" fill="none" stroke="${C.K}" stroke-width="7"/>`;
      g += `<circle cx="${f1(hx + 30)}" cy="${hy - 250}" r="10" fill="none" stroke="${C.K}" stroke-width="5"/><circle cx="${f1(hx + 56)}" cy="${hy - 250}" r="10" fill="none" stroke="${C.K}" stroke-width="5"/>`;
    } else if (type === 'fan') {
      g += `<path d="M${f1(hx)},${hy} L${f1(hx + 60)},${hy - 40}" stroke="${C.K}" stroke-width="10"/>`;
      g += `<path d="M${f1(hx + 50)},${hy - 30} L${f1(hx + 150)},${hy - 140} A140,140 0 0,1 ${f1(hx + 190)},${hy - 10} Z" fill="${C.K}"/>`;
    }
    // front sleeve
    g += poly([[20, -286], [64, -270], [f1(hx + 6), hy + 10], [f1(hx - 40), hy + 70]].map(([x, y]) => [x - (y < -250 ? y * lean : 0), y]), C.K);
    // the mask, in colour, with a white cut-out edge (3/4 squash, facing right)
    const mx = 20 + 380 * lean, my = -366;
    if (mask) g += `<g transform="translate(${f1(mx)},${my}) skewY(-6) scale(${0.27 * 0.82},0.27)">${cutout(MASKS[mask](), { outline: 30 })}</g>`;
    g += `</g>`;
    return `<g transform="scale(${s})">${g}</g>`;
  }

  // ---------- torn slit (horizontal tear) : returns path of the hole, deterministic jagged edges ----------
  function tornSlit(cx, cy, w, h, seed) {
    const r = rng(seed), top = [], bot = [];
    const n = 28;
    for (let i = 0; i <= n; i++) {
      const x = cx - w / 2 + (w * i) / n;
      const taper = Math.sin(Math.PI * i / n);
      top.push([x, cy - h / 2 * taper - (r() - 0.5) * 22 * taper]);
      bot.push([x, cy + h / 2 * taper + (r() - 0.5) * 22 * taper]);
    }
    return P(top.concat(bot.reverse()));
  }
  // white torn paper rim around a slit (slightly larger hole outline), plus flying paper flecks
  function tornRim(cx, cy, w, h, seed) {
    const r = rng(seed + 7);
    let s = `<path d="${tornSlit(cx, cy, w + 40, h + 46, seed + 1)}" fill="${C.W}"/>`;
    for (let i = 0; i < 9; i++) {
      const x = cx + (r() - 0.5) * w, y = cy + (r() < 0.5 ? -1 : 1) * (h / 2 + 30 + r() * 80);
      s += poly([[x, y], [x + 30 + r() * 50, y - 8 - r() * 10], [x + 12, y + 10]], C.W);
    }
    return s;
  }

  // ---------- Z slab (white zig-zag wipe) at progress p (0..1 = entering .. covered) ----------
  function zSlab(p, color = C.W) {
    const x = lerp(-1700, 0, E.io3(p));
    const pts = [[0, -200], [1500, -200], [700, 900], [1500, 800], [1500, 2200], [-400, 2200], [400, 1100], [-400, 1200]];
    return `<g transform="translate(${f1(x)},0)">${poly(pts, color)}</g>`;
  }

  // ---------- star-burst (spiky polygon) ----------
  function starburst(cx, cy, R, n, seed, color) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 + 0.1;
      const rr = i % 2 ? R * (0.55 + r() * 0.1) : R * (0.95 + r() * 0.25);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return poly(pts, color);
  }

  // ---------- jagged name plate ----------
  function jagPlate(x, y, w, h, seed, fill = C.K, rim = C.W) {
    const r = rng(seed), pts = [];
    const add = (px, py) => pts.push([px, py]);
    add(x, y + 10); add(x + w * 0.4, y - 6); add(x + w * 0.42, y - 30); add(x + w * 0.5, y - 4); add(x + w, y + 14);
    add(x + w + 20, y + h * 0.5); add(x + w, y + h - 8); add(x + w * 0.2, y + h + 12); add(x + w * 0.12, y + h + 40); add(x + w * 0.08, y + h + 6); add(x - 10, y + h - 4);
    return poly(pts.map(([a, b]) => [a + 14, b + 14]), C.R) + poly(pts, fill, `stroke="${rim}" stroke-width="8" stroke-linejoin="miter"`);
  }

  root.P5S = { MASKS, clamp, lerp, E, prog, slam, ransom, walker, tornSlit, tornRim, zSlab, starburst, jagPlate };
})(typeof window !== 'undefined' ? window : globalThis);

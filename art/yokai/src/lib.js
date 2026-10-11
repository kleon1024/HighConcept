// Shared drawing library for style C (P5-inspired graphic language, all shapes original).
// Everything returns SVG markup strings. Deterministic (seeded RNG), so the video can reuse it per frame.
(function (root) {
  const C = {
    K: '#0B0B0C', K2: '#161618', R: '#E8141C', RD: '#8E0A10', W: '#FFFFFF',
    G1: '#D2D2D2', G2: '#5A5A5E', G3: '#2A2A2E', CREAM: '#F4EFE6',
  };
  const D2R = Math.PI / 180;
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const f1 = (n) => Math.round(n * 10) / 10;
  const P = (pts) => 'M' + pts.map((p) => f1(p[0]) + ',' + f1(p[1])).join(' L') + ' Z';
  const poly = (pts, fill, extra = '') => `<path d="${P(pts)}" fill="${fill}" ${extra}/>`;
  const mirror = (pts) => pts.map((p) => [-p[0], p[1]]);

  // tapered strand (hair lock, crack, slash): base centre (x0,y0) width w -> sharp tip (x1,y1); bend = sideways bow
  function strand(x0, y0, x1, y1, w, bend = 0) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const mx = (x0 + x1) / 2 + nx * bend, my = (y0 + y1) / 2 + ny * bend;
    const ax = x0 + nx * w / 2, ay = y0 + ny * w / 2, bx = x0 - nx * w / 2, by = y0 - ny * w / 2;
    return `M${f1(ax)},${f1(ay)} Q${f1(mx + nx * w / 4)},${f1(my + ny * w / 4)} ${f1(x1)},${f1(y1)} Q${f1(mx - nx * w / 4)},${f1(my - ny * w / 4)} ${f1(bx)},${f1(by)} Z`;
  }

  // S-curved tapered lock: cubic sides, sharp tip
  function strand2(x0, y0, x1, y1, w, b1 = 0, b2 = 0) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const c1x = x0 + dx / 3 + nx * b1, c1y = y0 + dy / 3 + ny * b1, c2x = x0 + 2 * dx / 3 + nx * b2, c2y = y0 + 2 * dy / 3 + ny * b2;
    const ax = x0 + nx * w / 2, ay = y0 + ny * w / 2, bx = x0 - nx * w / 2, by = y0 - ny * w / 2;
    return `M${f1(ax)},${f1(ay)} C${f1(c1x + nx * w * 0.36)},${f1(c1y + ny * w * 0.36)} ${f1(c2x + nx * w * 0.16)},${f1(c2y + ny * w * 0.16)} ${f1(x1)},${f1(y1)} ` +
      `C${f1(c2x - nx * w * 0.16)},${f1(c2y - ny * w * 0.16)} ${f1(c1x - nx * w * 0.36)},${f1(c1y - ny * w * 0.36)} ${f1(bx)},${f1(by)} Z`;
  }

  // halftone dots on a rotated lattice; rFn(x,y)->radius (<=0 skips)
  function dots(x0, y0, x1, y1, step, angDeg, rFn, fill) {
    const a = angDeg * D2R, ca = Math.cos(a), sa = Math.sin(a);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + step;
    let out = '';
    for (let u = -R; u <= R; u += step) {
      for (let v = -R; v <= R; v += step) {
        const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
        if (x < x0 - step || x > x1 + step || y < y0 - step || y > y1 + step) continue;
        const r = rFn(x, y);
        if (r > 0.35) out += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`;
      }
    }
    return `<g fill="${fill}">${out}</g>`;
  }

  // radial glass crack from (cx,cy)
  function cracks(cx, cy, n, minL, maxL, seed, color = C.K, w = 9) {
    const r = rng(seed);
    let out = '';
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * 360 + (r() - 0.5) * 22;
      const L = minL + r() * (maxL - minL);
      // jagged polyline with taper: build two sides
      const segs = 5, left = [], right = [];
      let px = cx, py = cy, a = ang * D2R;
      const pts = [[cx, cy]];
      for (let s = 1; s <= segs; s++) {
        a += (r() - 0.5) * 0.35;
        px += Math.cos(a) * L / segs; py += Math.sin(a) * L / segs;
        pts.push([px, py]);
      }
      pts.forEach((p, k) => {
        const t = k / segs, ww = w * (1 - t) + 0.6;
        const p2 = pts[Math.min(k + 1, segs)], p1 = pts[Math.max(k - 1, 0)];
        const dx = p2[0] - p1[0], dy = p2[1] - p1[1], L2 = Math.hypot(dx, dy) || 1;
        left.push([p[0] - dy / L2 * ww / 2, p[1] + dx / L2 * ww / 2]);
        right.unshift([p[0] + dy / L2 * ww / 2, p[1] - dx / L2 * ww / 2]);
      });
      out += poly(left.concat(right), color);
      // a branch
      if (r() < 0.6) {
        const k = 2 + Math.floor(r() * 2), bp = pts[k];
        const ba = a + (r() < 0.5 ? -1 : 1) * (0.5 + r() * 0.5);
        const bl = L * (0.25 + r() * 0.25);
        out += `<path d="${strand(bp[0], bp[1], bp[0] + Math.cos(ba) * bl, bp[1] + Math.sin(ba) * bl, w * 0.55, (r() - 0.5) * 10)}" fill="${color}"/>`;
      }
    }
    // concentric fracture ring fragments
    for (let ring = 0; ring < 2; ring++) {
      const rr = minL * (0.55 + ring * 0.6);
      for (let i = 0; i < n; i++) {
        if (r() < 0.45) continue;
        const a0 = ((i / n) * 360 + r() * 10) * D2R, a1 = a0 + (360 / n) * D2R * (0.6 + r() * 0.4);
        const p0 = [cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr], p1 = [cx + Math.cos(a1) * rr * (0.9 + r() * 0.2), cy + Math.sin(a1) * rr * (0.9 + r() * 0.2)];
        const dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1, ww = w * 0.45;
        out += poly([[p0[0], p0[1]], [p1[0] - dy / L * ww, p1[1] + dx / L * ww], [p1[0] + dy / L * ww, p1[1] - dx / L * ww]], color);
      }
    }
    return out;
  }

  // ink splatter
  function splat(cx, cy, rad, seed, color = C.K, drops = 14) {
    const r = rng(seed);
    const pts = [];
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const spike = r() < 0.3 ? 1.5 + r() * 0.9 : 0.75 + r() * 0.3;
      pts.push([cx + Math.cos(a) * rad * spike, cy + Math.sin(a) * rad * spike * 0.8]);
    }
    let out = poly(pts, color);
    for (let i = 0; i < drops; i++) {
      const a = r() * Math.PI * 2, d = rad * (1.4 + r() * 1.8), s = rad * (0.05 + r() * 0.14);
      out += `<circle cx="${f1(cx + Math.cos(a) * d)}" cy="${f1(cy + Math.sin(a) * d * 0.8)}" r="${f1(s)}" fill="${color}"/>`;
      if (r() < 0.5) out += `<path d="${strand(cx + Math.cos(a) * rad * 0.9, cy + Math.sin(a) * rad * 0.72, cx + Math.cos(a) * d * 0.95, cy + Math.sin(a) * d * 0.76, s * 1.4, 0)}" fill="${color}"/>`;
    }
    return out;
  }

  // outline+offset wrapper: renders `inner` three times: offset plate, white outline, then itself
  function cutout(inner, { outline = 18, outlineColor = C.W, shadow = [0, 0], shadowColor = C.K, shadowOutline = true } = {}) {
    let s = '';
    if (shadow[0] || shadow[1]) {
      s += `<g class="sil" style="--c:${shadowColor};--w:${shadowOutline ? outline : 0}px" transform="translate(${shadow[0]},${shadow[1]})">${inner}</g>`;
    }
    if (outline) s += `<g class="sil" style="--c:${outlineColor};--w:${outline}px">${inner}</g>`;
    return s + inner;
  }

  // ---------------- MASKS (local coords, ~300 wide, centred on 0,0) ----------------
  function kitsune() {
    // smooth, symmetric fox mask; light from the viewer's left so the right half takes a grey cel shadow
    const half = 'M0,-122 C-30,-124 -52,-120 -64,-114 L-104,-202 C-128,-162 -146,-112 -150,-72 C-154,-44 -166,-14 -186,8 L-150,22 C-158,44 -164,60 -172,76 L-124,84 C-100,122 -68,160 -42,182 C-30,194 -16,204 0,206';
    const mirrorPath = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${-parseFloat(x)},${y}`);
    const right = mirrorPath(half);
    // build closed outline: left half forward, right half reversed
    const rev = (d) => { // reverse a path made of M/C/L segments
      const segs = d.match(/[MCL][^MCL]*/g).map((t) => ({ c: t[0], n: t.slice(1).trim().split(/\s+/).map((q) => q.split(',').map(Number)) }));
      const pts = []; segs.forEach((sg) => pts.push(sg));
      let cur = pts[pts.length - 1].n[pts[pts.length - 1].n.length - 1];
      let out = `L${cur[0]},${cur[1]}`;
      for (let i = pts.length - 1; i > 0; i--) {
        const sg = pts[i], prevEnd = pts[i - 1].n[pts[i - 1].n.length - 1];
        if (sg.c === 'C') out += ` C${sg.n[1][0]},${sg.n[1][1]} ${sg.n[0][0]},${sg.n[0][1]} ${prevEnd[0]},${prevEnd[1]}`;
        else out += ` L${prevEnd[0]},${prevEnd[1]}`;
      }
      return out;
    };
    const outline = half + ' ' + rev(right).replace(/^L0,206/, '') + ' Z';
    let s = `<clipPath id="kitClip"><path d="${outline}"/></clipPath>`;
    s += `<path d="${outline}" fill="${C.W}"/>`;
    s += `<g clip-path="url(#kitClip)"><path d="M84,-120 C112,-60 116,30 96,110 C80,160 50,192 24,214 L220,214 L220,-230 L110,-230 Z" fill="${C.G1}"/>` +
      `<path d="M-150,-72 C-154,-44 -166,-14 -186,8 L-150,22 C-158,44 -164,60 -172,76 L-150,80 C-140,40 -136,0 -132,-60 Z" fill="${C.W}"/></g>`;
    // inner ears
    s += `<path d="M-100,-176 C-114,-150 -124,-124 -128,-100 L-82,-114 Z" fill="${C.R}"/><path d="M100,-176 C114,-150 124,-124 128,-100 L82,-114 Z" fill="${C.R}"/>`;
    // ink outline on top
    s += `<path d="${outline}" fill="none" stroke="${C.K}" stroke-width="7" stroke-linejoin="miter"/>`;
    // forehead flame-jewel
    s += `<path d="M0,-118 C20,-94 22,-76 0,-56 C-22,-76 -20,-94 0,-118 Z" fill="${C.R}"/><path d="M0,-102 C8,-92 9,-82 0,-72 C-6,-82 -6,-92 0,-102 Z" fill="${C.W}"/>`;
    // red brows
    s += `<path d="${strand(-28, -66, -98, -86, 15, -5)}" fill="${C.R}"/><path d="${strand(28, -66, 98, -86, 15, 5)}" fill="${C.R}"/>`;
    // eyes: thin slanted slits with red liner flames to the ears
    const eyeL = 'M-114,-28 C-92,-50 -60,-52 -34,-36 C-58,-22 -90,-18 -114,-28 Z';
    s += `<path d="${eyeL}" fill="${C.K}"/><path d="${mirrorPath(eyeL)}" fill="${C.K}"/>`;
    const liner = 'M-116,-30 C-130,-56 -140,-84 -146,-108 C-124,-86 -110,-62 -98,-44 Z';
    s += `<path d="${liner}" fill="${C.R}"/><path d="${mirrorPath(liner)}" fill="${C.R}"/>`;
    // cheek swirls
    const sw = 'M-112,40 C-112,22 -86,20 -84,38 C-82,52 -96,58 -104,52 C-100,64 -112,72 -126,74 C-116,64 -112,54 -112,40 Z';
    s += `<path d="${sw}" fill="${C.R}"/><path d="${mirrorPath(sw)}" fill="${C.R}"/>`;
    // snout ridge, nose, mouth, whisker dots
    s += `<path d="M0,-40 C-4,30 -4,100 0,150" stroke="${C.K}" stroke-width="4" fill="none" opacity="0.7"/>`;
    s += `<path d="M-20,152 C-10,148 10,148 20,152 C14,166 6,174 0,180 C-6,174 -14,166 -20,152 Z" fill="${C.K}"/>`;
    s += `<path d="M-58,142 C-40,180 -18,192 0,182 C18,192 40,180 58,142" fill="none" stroke="${C.K}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<path d="M-22,186 C-10,194 10,194 22,186 C12,202 -12,202 -22,186 Z" fill="${C.R}"/>`;
    [[-60, 116], [-76, 104], [-52, 100], [60, 116], [76, 104], [52, 100]].forEach((p) => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" fill="${C.K}"/>`; });
    return s;
  }

  function oni() {
    let s = '';
    const hornL = `M-118,-104 Q-176,-196 -128,-262 Q-118,-196 -66,-128 Z`;
    const hornR = `M118,-104 Q176,-196 128,-262 Q118,-196 66,-128 Z`;
    s += `<path d="${hornL}" fill="${C.CREAM}" stroke="${C.K}" stroke-width="6"/><path d="${hornR}" fill="${C.CREAM}" stroke="${C.K}" stroke-width="6"/>`;
    s += `<path d="M118,-104 Q160,-180 128,-262 Q148,-180 92,-114 Z" fill="${C.G1}"/>`;
    [[-150, -170, -110, -150], [-148, -210, -122, -200], [150, -170, 110, -150], [148, -210, 122, -200]].forEach((l) => { s += `<path d="M${l[0]},${l[1]} L${l[2]},${l[3]}" stroke="${C.K}" stroke-width="5"/>`; });
    const half = [[-60, -150], [-140, -122], [-160, -30], [-170, 36], [-138, 122], [-92, 176], [0, 196]];
    const face = half.concat(mirror(half).reverse().slice(1)).concat([[0, -140]]);
    s += poly(face, C.R, `stroke="${C.K}" stroke-width="7" stroke-linejoin="miter"`);
    s += poly([[0, -140], [60, -150], [140, -122], [160, -30], [170, 36], [138, 122], [92, 176], [0, 196], [60, 150], [96, 60], [70, -30], [20, -100]], C.RD);
    // brow ridges with flame tufts
    const brow = [[-150, -66], [-128, -96], [-104, -78], [-84, -110], [-62, -80], [-30, -96], [-14, -56], [-40, -34], [-140, -44]];
    s += poly(brow, C.K) + poly(mirror(brow), C.K);
    // forehead furrows
    s += `<path d="M-30,-118 Q0,-104 30,-118 M-24,-132 Q0,-120 24,-132" stroke="${C.K}" stroke-width="6" fill="none"/>`;
    // eyes
    const eye = [[-122, -30], [-40, -20], [-52, 4], [-106, 0]];
    s += poly(eye, C.W, `stroke="${C.K}" stroke-width="5"`) + poly(mirror(eye), C.W, `stroke="${C.K}" stroke-width="5"`);
    s += `<circle cx="-72" cy="-12" r="11" fill="${C.K}"/><circle cx="72" cy="-12" r="11" fill="${C.K}"/>`;
    // nose
    s += `<path d="M-42,30 Q-46,56 -22,60 L0,48 L22,60 Q46,56 42,30 Q20,46 0,20 Q-20,46 -42,30 Z" fill="${C.K}"/>`;
    // mouth + teeth + fangs
    s += poly([[-112, 84], [112, 84], [86, 146], [-86, 146]], C.K);
    s += poly([[-98, 88], [98, 88], [92, 104], [-92, 104]], C.W);
    for (let i = -4; i <= 4; i++) s += `<path d="M${i * 20},88 L${i * 20},104" stroke="${C.K}" stroke-width="3"/>`;
    s += poly([[-80, 146], [-64, 96], [-52, 146]], C.W, `stroke="${C.K}" stroke-width="3"`) + poly([[80, 146], [64, 96], [52, 146]], C.W, `stroke="${C.K}" stroke-width="3"`);
    return s;
  }

  function hannya() {
    let s = '';
    const hornL = `M-96,-120 Q-150,-170 -168,-268 Q-120,-190 -60,-150 Z`;
    s += `<path d="${hornL}" fill="${C.W}" stroke="${C.K}" stroke-width="6"/>`;
    s += `<path d="M96,-120 Q150,-170 168,-268 Q120,-190 60,-150 Z" fill="${C.G1}" stroke="${C.K}" stroke-width="6"/>`;
    [[-140, -212, -118, -196], [-122, -170, -100, -158], [140, -212, 118, -196], [122, -170, 100, -158]].forEach((l) => { s += `<path d="M${l[0]},${l[1]} L${l[2]},${l[3]}" stroke="${C.K}" stroke-width="5"/>`; });
    const half = [[-40, -160], [-118, -128], [-150, -40], [-150, 40], [-128, 120], [-80, 182], [0, 204]];
    const face = half.concat(mirror(half).reverse().slice(1)).concat([[0, -150]]);
    s += poly(face, C.W, `stroke="${C.K}" stroke-width="7" stroke-linejoin="miter"`);
    s += poly([[0, -150], [40, -160], [118, -128], [150, -40], [150, 40], [128, 120], [80, 182], [0, 204], [52, 150], [92, 40], [70, -60], [26, -110]], C.G1);
    // hair strands on the brow
    for (let i = -3; i <= 3; i++) s += `<path d="${strand(i * 18, -158, i * 26 + (i < 0 ? -10 : 10), -112, 9, i * 2)}" fill="${C.K}"/>`;
    // furrowed brows (inner ends up)
    const brow = [[-130, -40], [-46, -86], [-30, -72], [-120, -26]];
    s += poly(brow, C.K) + poly(mirror(brow), C.K);
    // eyes: red ring, black pupil
    const eye = [[-118, -14], [-46, -46], [-40, -24], [-96, 0]];
    s += poly(eye, C.W, `stroke="${C.K}" stroke-width="5"`) + poly(mirror(eye), C.W, `stroke="${C.K}" stroke-width="5"`);
    s += `<circle cx="-72" cy="-20" r="13" fill="${C.R}" stroke="${C.K}" stroke-width="3"/><circle cx="-72" cy="-20" r="5" fill="${C.K}"/>`;
    s += `<circle cx="72" cy="-20" r="13" fill="${C.R}" stroke="${C.K}" stroke-width="3"/><circle cx="72" cy="-20" r="5" fill="${C.K}"/>`;
    // nose
    s += `<path d="M-30,50 Q0,30 30,50 Q14,62 0,56 Q-14,62 -30,50 Z" fill="${C.K}"/>`;
    // ear-to-ear mouth
    s += `<path d="M-128,84 Q0,120 128,84 Q104,176 0,186 Q-104,176 -128,84 Z" fill="${C.R}" stroke="${C.K}" stroke-width="7"/>`;
    s += `<path d="M-118,92 Q0,124 118,92 L104,108 Q0,136 -104,108 Z" fill="${C.W}"/>`;
    s += poly([[-92, 102], [-72, 152], [-62, 108]], C.W, `stroke="${C.K}" stroke-width="3"`) + poly([[92, 102], [72, 152], [62, 108]], C.W, `stroke="${C.K}" stroke-width="3"`);
    s += poly([[-40, 178], [-30, 140], [-18, 180]], C.W) + poly([[40, 178], [30, 140], [18, 180]], C.W);
    return s;
  }

  function pumpkin() {
    let s = '';
    s += `<path d="M-8,-150 Q-4,-196 30,-212 L40,-198 Q14,-186 14,-148 Z" fill="${C.G2}" stroke="${C.K}" stroke-width="6"/>`;
    s += `<path d="M0,-150 C-120,-170 -184,-90 -178,10 C-172,120 -100,176 0,170 C100,176 172,120 178,10 C184,-90 120,-170 0,-150 Z" fill="${C.K}" stroke="${C.K}" stroke-width="6"/>`;
    // ribs
    s += `<path d="M-70,-150 C-120,-80 -122,90 -70,166 M70,-150 C120,-80 122,90 70,166" stroke="${C.G3}" stroke-width="10" fill="none"/>`;
    s += `<path d="M120,-110 C160,-50 160,70 120,130 L140,40 Z" fill="${C.G2}"/>`;
    // carved face (glow = red with white-hot core)
    const eyeL = [[-110, -24], [-40, -38], [-74, -96]];
    s += poly(eyeL, C.R) + poly(mirror(eyeL), C.R);
    s += poly([[-92, -34], [-56, -42], [-72, -72]], C.W) + poly(mirror([[-92, -34], [-56, -42], [-72, -72]]), C.W);
    s += poly([[-16, 6], [16, 6], [0, 36]], C.R);
    const grin = [[-130, 56], [-96, 76], [-80, 58], [-56, 84], [-30, 62], [0, 92], [30, 62], [56, 84], [80, 58], [96, 76], [130, 56], [104, 118], [70, 104], [44, 132], [16, 108], [-16, 132], [-44, 108], [-70, 132], [-104, 112]];
    s += poly(grin, C.R);
    s += poly([[-80, 84], [-56, 98], [-30, 82], [0, 108], [30, 82], [56, 98], [80, 84], [60, 112], [0, 118], [-60, 112]], C.W);
    return s;
  }

  // ---------------- RANSOM TYPE ----------------
  // one glyph "clipped from a magazine": tile + glyph, rotated
  function glyph(ch, o) {
    const sz = o.size, x = o.x, y = o.y, rot = o.rot || 0;
    const tw = (o.tw || sz * 1.12), th = (o.th || sz * 1.12);
    let s = `<g transform="translate(${f1(x)},${f1(y)}) rotate(${rot})">`;
    if (o.shadow) s += `<rect x="${-tw / 2 + o.shadow[0]}" y="${-th / 2 + o.shadow[1]}" width="${tw}" height="${th}" fill="${o.shadowColor || C.K}" transform="skewX(${o.skew || 0})"/>`;
    if (o.bg) s += `<rect x="${-tw / 2}" y="${-th / 2}" width="${tw}" height="${th}" fill="${o.bg}" ${o.border ? `stroke="${o.border}" stroke-width="${o.borderW || 6}"` : ''} transform="skewX(${o.skew || 0})"/>`;
    const fam = o.font || "'Noto Sans SC'";
    const st = o.stroke ? `stroke="${o.stroke}" stroke-width="${o.strokeW || 10}" stroke-linejoin="miter" paint-order="stroke"` : '';
    if (o.tshadow) s += `<text x="${o.tshadow[0]}" y="${o.tshadow[1] + (o.dy || 0)}" font-family="${fam}" font-weight="${o.weight || 900}" font-size="${sz}" text-anchor="middle" dominant-baseline="central" fill="${o.tshadowColor || C.K}" ${o.stroke ? `stroke="${o.tshadowColor || C.K}" stroke-width="${o.strokeW || 10}" stroke-linejoin="miter"` : ''}>${ch}</text>`;
    s += `<text x="0" y="${o.dy || 0}" font-family="${fam}" font-weight="${o.weight || 900}" font-size="${sz}" text-anchor="middle" dominant-baseline="central" fill="${o.fill || C.K}" ${st} ${o.ls ? `letter-spacing="${o.ls}"` : ''}>${ch}</text>`;
    return s + '</g>';
  }

  root.P5K = { C, rng, P, poly, mirror, strand, strand2, dots, cracks, splat, cutout, kitsune, oni, hannya, pumpkin, glyph, f1, D2R };
})(typeof window !== 'undefined' ? window : globalThis);

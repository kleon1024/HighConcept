// 元素周期表 = 宇宙的配料表 (60 s): the timeline, camera, colour fields and every tile's state over time.
// Times: e60.json (shared with music/elements60.py). Per-element data: t60.json (written by music/elements60_data.py).
import J from "./e60.json";
import TD from "./t60.json";
import { FAM, ORIGIN, P, backOut, clamp01, eIn, eInOut, eOut, lerp, lighten, makeProj, mix, range, rnd, win } from "../elements/core";

export const T6 = J;
export type E6 = {
  z: number; s: string; cn: string; fam: string; year: number; origin: string; period: number; group: number | null; f: number | null;
  x: number; y: number; lx: number; st: string; mp: number | null; ab: number; rain: number; gl: number; yr: number; ot: number;
  bx: number; by: number; bk: string;
};
export const EL6 = TD.elements as E6[];
export const BODY = TD.body as { head: number[]; polys: number[][][] };
export const DOT = TD.dot as number;
export const LENS = J.lens as { id: string; t: number; out: number }[];
export const lensAt = (t: number) => LENS.findIndex((l) => t >= l.t && t < l.out);

// ───────────── colour fields: one per beat of the story, changed with a diagonal sweep that ends on the cut
const BG = J.bg as [number, string][];
export const WIPE6 = 0.34;
export const bg6 = (t: number) => {
  let i = 0;
  while (i + 1 < BG.length && BG[i + 1][0] - WIPE6 <= t) i++;
  const [t0, c] = BG[i], prev = i > 0 ? BG[i - 1][1] : c;
  const k = i > 0 ? clamp01((t - (t0 - WIPE6)) / WIPE6) : 1;
  return { c, prev, k, t0, i };
};
export const bgCol6 = (t: number) => { const b = bg6(t); return mix(b.prev, b.c, b.k); };

// ───────────── camera (a quick ease between keys: snappy moves, then holds)
type Key = { t: number; th: number; ph: number; z: number; cx: number; cy: number };
export const cam6 = (t: number) => {
  const K = J.cam as Key[];
  if (t <= K[0].t) return { ...K[0], L: 0 };
  if (t >= K[K.length - 1].t) return { ...K[K.length - 1], L: 0 };
  let i = 0;
  while (K[i + 1].t < t) i++;
  const a = K[i], b = K[i + 1];
  let k = eInOut((t - a.t) / (b.t - a.t));
  if (a.z !== b.z && Math.abs(Math.log(b.z / a.z)) > 1) {        // big zooms: interpolate in log space so they feel even
    const zz = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k));
    return { th: lerp(a.th, b.th, k), ph: lerp(a.ph, b.ph, k), z: zz, cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), L: 0 };
  }
  return { th: lerp(a.th, b.th, k), ph: lerp(a.ph, b.ph, k), z: lerp(a.z, b.z, k), cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), L: 0 };
};
export const proj6 = (t: number) => makeProj(cam6(t));

// ───────────── colours for the data lenses
export const STATE_C: Record<string, string> = { s: "#F6F0E4", g: "#9FE8FF", l: "#FF3D7F", u: "#B8B2C8" };
export const heat = (mp: number) => {                           // melting point (K) → a glow from cold blue to white-hot
  const stops: [number, string][] = [[0, "#3B5BFF"], [300, "#4D7CFE"], [700, "#FF5B4F"], [1600, "#FF9F43"], [2600, "#FFD23F"], [3800, "#FFF6D6"]];
  for (let i = 1; i < stops.length; i++) if (mp <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (mp - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
  return stops[stops.length - 1][1];
};
export const BODY_C: Record<string, string> = { H: ORIGIN.bb.c, O: ORIGIN.ms.c, C: ORIGIN.lm.c, N: ORIGIN.lm.c, Ca: ORIGIN.ms.c };
const HM = new Set(Array.from({ length: 26 }, (_, i) => 93 + i));
export const isMade = (e: E6) => HM.has(e.z);

// ───────────── the state of one tile
export type Tile6 = {
  show: number; ghost: boolean; q: number; h: number; drop: number; col: string; dim: number; glow: number; white: number;
  x: number; y: number; sx: number; sy: number; zi: number; label: boolean; ring: number;
};
// a card-stunt flip: the tile squashes to a line and opens with its new colour; the wave runs diagonally
const flipK = (e: E6, t: number, t0: number, dur = 0.26) => range(t, t0 + (e.x + e.y) * 0.022, t0 + (e.x + e.y) * 0.022 + dur);
const flip = (s: Tile6, k: number, from: string, to: string) => {
  if (k <= 0) { s.col = from; return; }
  if (k >= 1) { s.col = to; return; }
  s.sx *= Math.abs(Math.cos(Math.PI * k)); s.col = k < 0.5 ? from : to;
};
const pop = (t: number, at: number, amp = 0.25, d = 0.16) => (t >= at ? 1 + amp * Math.exp(-(t - at) / d) * Math.sin(Math.min(Math.PI, (t - at) / d * 1.4) + 0.5) : 1);
const pulse = (t: number, at: number, d = 0.45) => (t >= at ? Math.exp(-(t - at) / d) : 0);

export const tile6 = (e: E6, t: number): Tile6 => {
  const base = FAM[e.fam].c;
  const s: Tile6 = { show: 1, ghost: false, q: 0, h: 0.2, drop: 0, col: base, dim: 0, glow: 0, white: 0, x: e.x, y: e.y, sx: 1, sy: 1, zi: 0, label: true, ring: -1 };
  const H = J.hook, R = J.read;
  // ═══ the opening: tiles slam down from the camera in a diagonal wave, then dim for the title
  if (t < R.start) {
    const k = range(t, e.rain - 0.22, e.rain);
    if (k <= 0) { s.show = 0; return s; }
    s.sx = s.sy = lerp(2.4, 1, eIn(k)) * pop(t, e.rain, 0.12, 0.08);
    s.show = eOut(k * 1.4);
    s.glow = pulse(t, e.rain, 0.35) + 0.8 * pulse(t, H.n118, 0.4);
    s.dim = 0.55 * win(t, H.title - 0.1, R.start + 0.3, 0.3, 0.3);
    return s;
  }
  // ═══ 01 how to read it
  if (t < R.end) {
    const [p1, p2, p3] = R.protons;
    if (t < R.count[0]) {
      const at = e.z === 1 ? p1 : e.z === 2 ? p2 : e.z === 3 ? p3 : -1;
      s.dim = at > 0 && t >= at ? 0 : 0.62 * eOut(range(t, R.start, R.start + 0.3));
      if (at > 0) { s.glow = pulse(t, at, 0.5); s.sx = s.sy = pop(t, at, 0.3); s.white = 0.7 * pulse(t, at, 0.3); }
      return s;
    }
    if (t < R.rings) {
      const at = R.count[0] + (R.count[1] - R.count[0] - 0.05) * (e.z - 1) / 117;
      s.dim = t >= at ? 0 : 0.62; s.glow = pulse(t, at, 0.3); s.sx = s.sy = pop(t, at, 0.2, 0.1);
      return s;
    }
    if (t < R.col1) {
      const at = R.rings + (e.period - 1) * R.ringStep;
      s.glow = pulse(t, at, 0.35) * 0.9; s.white = 0.5 * pulse(t, at, 0.2);
      s.dim = t >= at ? 0.15 : 0.4;
      return s;
    }
    if (t < R.rows[0]) {
      const c1 = e.group === 1 && e.z > 1, c18 = e.group === 18;
      const k1 = backOut(range(t, R.col1 + (e.period - 2) * 0.06, R.col1 + 0.45 + (e.period - 2) * 0.06), 1.6);
      const k18 = backOut(range(t, R.col18 + (e.period - 1) * 0.06, R.col18 + 0.45 + (e.period - 1) * 0.06), 1.6);
      const out = 1 - eInOut(range(t, R.rows[0] - 0.3, R.rows[0]));
      if (c1) { s.h = 0.2 + 2.2 * k1 * out; s.glow = 0.5 * pulse(t, R.col1 + (e.period - 2) * 0.06, 0.4); }
      else if (c18) { s.h = 0.2 + 1.6 * k18 * out; s.glow = 0.5 * pulse(t, R.col18 + (e.period - 1) * 0.06, 0.4); }
      else s.dim = 0.62 * out;
      return s;
    }
    // the glissandi: each tile jumps on its note and stays lit; each row ends on a noble gas
    if (t < e.gl) { s.dim = 0.7; return s; }
    const d = t - e.gl;
    s.sx = s.sy = 1 + 0.28 * Math.exp(-d / 0.12); s.glow = Math.exp(-d / 0.3); s.ring = d < 0.55 ? d / 0.55 : -1;
    if (e.fam === "ng") { s.white = 0.9 * Math.exp(-d / 0.3); s.glow = Math.max(s.glow, 0.8 * Math.exp(-d / 0.6)); }
    s.glow = Math.max(s.glow, 0.9 * pulse(t, R.period, 0.5));
    return s;
  }
  // ═══ 02 nine surprises
  const li = lensAt(t);
  const L = LENS[li];
  if (L) {
    if (L.id === "state") {
      const S = J.state;
      flip(s, flipK(e, t, S.flip), base, STATE_C[e.st]);
      if (e.st === "u") { s.dim = 0.3 * eOut(range(t, S.flip, S.flip + 0.6)); }
      if (e.st === "g") {
        const k = eOut(range(t, S.float + rnd(e.z) * 0.25, S.float + 0.9 + rnd(e.z) * 0.25));
        s.y -= k * (0.85 + 0.25 * Math.sin(t * 3.1 + e.z)); s.x += k * 0.12 * Math.sin(t * 2.3 + e.z * 1.7); s.glow = 0.4 * k;
      }
      if (e.st === "l") {
        const k = eOut(range(t, S.melt, S.melt + 0.6));
        s.sx *= 1 + 0.7 * k; s.sy *= 1 - 0.35 * k; s.y += 0.2 * k; s.glow = 0.5 + pulse(t, S.melt, 0.5); s.zi = 60; s.white = 0.4 * pulse(t, S.melt, 0.3);
      }
      if (e.z === 31 || e.z === 55) { const k = win(t, S.ga, L.out, 0.2, 0.3); s.sx *= 1 + 0.08 * k * Math.sin(t * 40); s.glow = 0.6 * k; }
      const out = range(t, L.out - 0.25, L.out); if (out > 0) { s.y = lerp(s.y, e.y, eInOut(out)); s.x = lerp(s.x, e.x, eInOut(out)); }
      return s;
    }
    if (L.id === "melt") {
      const M = J.melt;
      if (e.mp === null) { s.ghost = true; return s; }
      flip(s, flipK(e, t, L.t, 0.22), STATE_C[e.st], heat(e.mp));
      const at = M.rise[0] + (M.rise[1] - M.rise[0]) * (e.z - 1) / 117 * 0.6 + rnd(e.z) * 0.25;
      const k = backOut(range(t, at, at + 0.45), 1.4);
      s.h = 0.12 + 3.1 * (e.mp / 3823) * k;
      if (e.z === 74) { s.glow = 0.3 + 0.7 * pulse(t, M.w, 0.6); s.white = 0.6 * pulse(t, M.w, 0.4); }
      const out = range(t, L.out - 0.3, L.out); s.h = lerp(s.h, 0.2, eInOut(out));
      return s;
    }
    if (L.id === "years" || L.id === "gaps") {
      const G = J.gaps;
      const lift = eIn(range(t, J.lens[2].t, J.lens[2].t + 0.2));
      if (t < e.yr) {
        s.ghost = lift >= 1 || t > J.lens[2].t + 0.2;
        if (!s.ghost) { s.sx = s.sy = 1 - lift; s.col = heat(e.mp ?? 300); }
        if ([31, 21, 32].includes(e.z) && t > G.q) s.q = win(t, G.q, e.yr + 0.15, 0.3, 0.2);
        return s;
      }
      const d = t - e.yr;
      s.sx = s.sy = lerp(2.2, 1, eIn(range(t, e.yr, e.yr + 0.14))) * (d > 0.14 ? pop(t, e.yr + 0.14, 0.08, 0.08) : 1);
      s.show = eOut(range(t, e.yr, e.yr + 0.08));
      s.glow = pulse(t, e.yr + 0.12, 0.4);
      if ([31, 21, 32].includes(e.z)) { s.white = 0.8 * pulse(t, e.yr + 0.1, 0.4); s.glow = Math.max(s.glow, win(t, e.yr, G.hit + 0.8, 0.1, 0.4)); }
      if (e.z === 15) s.glow = Math.max(s.glow, win(t, J.years.p, J.years.p + 1.0, 0.1, 0.3));
      if (e.year === -1000) s.glow = Math.max(s.glow, 0.7 * win(t, J.years.ancient, J.years.ancient + 0.7, 0.05, 0.3));
      if (L.id === "gaps" && ![31, 21, 32].includes(e.z) && t < G.hit) s.dim = 0.35 * win(t, G.q, G.hit, 0.3, 0.3);
      return s;
    }
    if (L.id === "abund") {
      const A = J.abund;
      const k = eInOut(range(t, A.grow, A.grow + 0.6 + (e.z <= 2 ? 0.2 : 0)));
      const out = eInOut(range(t, L.out - 0.35, L.out));
      const sz = lerp(1, e.ab, k * (1 - out));
      s.sx = s.sy = sz;
      if (e.z === 1) { s.x = lerp(e.x, 3.4, k * (1 - out)); s.y = lerp(e.y, 3.9, k * (1 - out)); s.zi = 100; s.glow = 0.5 * pulse(t, A.n92, 0.8); }
      else if (e.z === 2) { s.x = lerp(e.x, 15.3, k * (1 - out)); s.y = lerp(e.y, 1.0, k * (1 - out)); s.zi = 90; }
      else s.dim = 0.25 * k * (1 - out);
      s.label = e.z <= 2 || k < 0.3 || out > 0.7;
      return s;
    }
    if (L.id === "rare") {
      const R2 = J.rare;
      const isLn = e.fam === "ln", isCu = e.z === 29;
      const k = backOut(range(t, R2.lift + (isLn ? (e.f ?? 0) * 0.03 : 0), R2.lift + 0.5 + (isLn ? (e.f ?? 0) * 0.03 : 0)), 1.5);
      const out = eInOut(range(t, L.out - 0.3, L.out));
      if (isLn) { s.h = 0.2 + (e.z === 58 ? 1.9 : 1.1) * k * (1 - out); s.glow = e.z === 58 ? 0.6 * win(t, R2.bars, L.out, 0.2, 0.3) : 0.3 * k; }
      else if (isCu) { s.h = 0.2 + 1.9 * eOut(range(t, R2.bars, R2.bars + 0.4)) * (1 - out); s.glow = 0.6 * win(t, R2.bars, L.out, 0.2, 0.3); }
      else s.dim = 0.6 * k * (1 - out);
      return s;
    }
    if (L.id === "ytterby") {
      const Y = J.ytterby, idx = [39, 65, 68, 70].indexOf(e.z);
      const k = eOut(range(t, L.t, L.t + 0.4)), out = eInOut(range(t, L.out - 0.3, L.out));
      if (idx >= 0) {
        const at = Y.tiles[idx];
        s.glow = Math.max(pulse(t, at, 0.5), t >= at ? 0.45 : 0) * (1 - out); s.white = 0.6 * pulse(t, at, 0.25);
        s.sx = s.sy = t >= at ? lerp(pop(t, at, 0.35, 0.12) * 1.18, 1, out) : 1;
        s.dim = t >= at ? 0 : 0.5 * k; s.zi = 50;
      } else s.dim = 0.62 * k * (1 - out);
      return s;
    }
    if (L.id === "helium") {
      const He = J.helium;
      const k = eOut(range(t, L.t, L.t + 0.4)), out = eInOut(range(t, L.out - 0.3, L.out));
      if (e.z === 2) {
        if (t < He.drop) { s.ghost = true; s.q = 0; return s; }
        const kk = eInOut(range(t, He.drop, He.drop + 0.5));
        s.x = lerp(-4.96, e.x, kk); s.y = lerp(6.85, e.y, kk) - 3.2 * Math.sin(Math.PI * kk); s.sx = s.sy = lerp(1.8, 1.25, kk) * pop(t, He.drop + 0.45, 0.2);
        s.glow = 0.6 + 0.4 * pulse(t, He.drop + 0.45, 0.4); s.zi = 100;
      } else s.dim = 0.55 * k * (1 - out);
      return s;
    }
    if (L.id === "made") {
      const Md = J.made;
      const k = eOut(range(t, L.t, L.t + 0.4));
      if (isMade(e)) {
        const at = Md.zap[0] + (Md.zap[1] - Md.zap[0]) * (e.z - 93) / 25;
        const kk = backOut(range(t, at, at + 0.3), 1.6);
        s.h = 0.2 + 0.9 * kk; s.col = mix(base, "#E9EDF5", 0.75 * clamp01(kk)); s.white = 0.8 * pulse(t, at, 0.2); s.glow = 0.5 * clamp01(kk);
      } else s.dim = 0.6 * k;
      return s;
    }
  }
  // ═══ 03 where the ingredients were made: lights out, then each origin lights its elements
  const C = J.cosmos, EN = J.end;
  if (t < EN.morph[0]) {
    const off = eInOut(range(t, C.off + e.x * 0.025, C.off + 0.35 + e.x * 0.025));
    const on = eOut(range(t, e.ot, e.ot + 0.35));
    const dark = mix(base, P.night2, 0.85 * off);
    s.col = mix(dark, ORIGIN[e.origin].c, on);
    s.glow = pulse(t, e.ot, 0.5) * 0.9; s.white = 0.5 * pulse(t, e.ot, 0.18);
    s.sx = s.sy = t >= e.ot ? pop(t, e.ot, 0.22, 0.1) : 1;
    return s;
  }
  // ═══ the ending: the tiles fly into a body, then back into the table
  const bodyC = BODY_C[e.bk];
  const go = eInOut(range(t, EN.morph[0] + rnd(e.z) * 0.35, EN.morph[0] + 0.85 + rnd(e.z) * 0.35));
  const back = eInOut(range(t, EN.back[0] + rnd(e.z + 7) * 0.25, EN.back[0] + 0.55 + rnd(e.z + 7) * 0.25));
  const k = go * (1 - back);
  const sz = (DOT * 0.8) / 0.89;
  const tx = e.bx - 0.5, ty = e.by - 0.5;
  const fy = e.f !== null ? 1.45 * eInOut(range(t, EN.back[0] + 0.2, EN.back[1])) : 0;   // f rows step down to make room for row 8
  s.x = lerp(e.x, tx, k) + Math.sin(Math.PI * k) * 0.8 * (rnd(e.z + 3) - 0.5);
  s.y = lerp(e.y + fy, ty, k) - Math.sin(Math.PI * go) * 0.6 * (1 - back);
  s.sx = s.sy = lerp(1, sz, k);
  s.col = mix(mix(ORIGIN[e.origin].c, bodyC, go), base, back);
  s.label = k < 0.25;
  s.glow = 0.35 * k + 0.6 * pulse(t, EN.morph[0] + 1.0 + rnd(e.z) * 0.35, 0.3) * (1 - back);
  return s;
};

export const lighten6 = lighten;

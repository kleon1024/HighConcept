// Shared maths for the periodic-table film: palette, the 2.5D camera, the projection and every tile's state over time.
import TB from "./table.json";
import J from "./elements.json";

export const EL = TB.elements as El[];
export const T = J;
export type El = {
  z: number; s: string; cn: string; fam: string; year: number; origin: string; period: number; group: number | null;
  f: number | null; x: number; y: number; lx: number; ly: number; roll: number; appear: number; lay: number | null;
};
export const W = 1920, H = 1080;

export const P = {
  paper: "#F6F0E4", ink: "#17172B", ghost: "#D8CFBE", night: "#0D1130", night2: "#1B2150", dimTop: "#E9E2D3",
};
const FAM_C = { h: "#6FD6F2", alk: "#FF5B4F", ae: "#FF9F43", tm: "#4D7CFE", pt: "#9B8CFF", md: "#B9D24A", nm: "#2FC27E", hal: "#FFD23F", ng: "#FF6FB1", ln: "#2CCFC7", an: "#C77DFF" };
export const FAM: Record<string, { c: string; name: string }> = {
  h: { c: "#6FD6F2", name: "氢" }, alk: { c: "#FF5B4F", name: "碱金属" }, ae: { c: "#FF9F43", name: "碱土金属" },
  tm: { c: "#4D7CFE", name: "过渡金属" }, pt: { c: "#9B8CFF", name: "后过渡金属" }, md: { c: "#B9D24A", name: "类金属" },
  nm: { c: "#2FC27E", name: "非金属" }, hal: { c: "#FFD23F", name: "卤素" }, ng: { c: "#FF6FB1", name: "稀有气体" },
  ln: { c: "#2CCFC7", name: "镧系" }, an: { c: "#C77DFF", name: "锕系" },
};
export const ORIGIN: Record<string, { c: string; name: string }> = {
  bb: { c: "#9FE8FF", name: "宇宙大爆炸" }, cr: { c: "#7BE495", name: "宇宙射线" },
  lm: { c: "#FFA94D", name: "小恒星晚年" }, ms: { c: "#FF6B5A", name: "大恒星爆炸" }, wd: { c: "#FF9ECF", name: "白矮星爆炸" },
  ns: { c: "#FFD84D", name: "中子星相撞" }, decay: { c: "#8E95B2", name: "放射性衰变" }, hm: { c: "#DDE1EC", name: "人类制造" },
};

// ───────────── the background: one full-screen colour per chapter / district, changed with a diagonal sweep
export const BGC: Record<string, string> = {
  paper: "#F6F0E4", ink: "#14142B", yellow: "#FFD23F", pink: "#FF3D7F", old: "#F1E4C8", blue: "#2D5BFF", violet: "#6C3CFF",
  black: "#0E0E12", mint: "#00D9A3", night: "#0D1130",
};
const BG_SEG: [number, string][] = [
  [0, BGC.pink], [4.4, BGC.ink], [10.0, BGC.yellow], [13.6, BGC.ink], [18.0, BGC.yellow], [31.4, BGC.pink], [36.8, BGC.old], [50.4, BGC.yellow],
  [56.0, BGC.blue], [74.0, BGC.violet], [80.4, BGC.blue], [82.4, BGC.black], [104.0, BGC.mint],
  ...(J.hood as { t: number; fam?: string; id: string }[]).map((d) => [d.t, d.id === "nm" ? "#2FC27E" : d.id === "h" ? "#6FD6F2" : (FAM_C as Record<string, string>)[d.fam as string]] as [number, string]),
  [158.0, BGC.night], [179.4, BGC.paper],
];
export const WIPE = 0.42;
export const bgAt = (t: number) => {
  let i = 0;
  while (i + 1 < BG_SEG.length && BG_SEG[i + 1][0] - WIPE <= t) i++;
  const [t0, c] = BG_SEG[i], prev = i > 0 ? BG_SEG[i - 1][1] : c;
  const k = i > 0 ? clamp01((t - (t0 - WIPE)) / WIPE) : 1;
  return { c, prev, k, t0, i };
};
export const bgColorAt = (t: number) => { const b = bgAt(t); return mix(b.prev, b.c, b.k); };
export const isDark = (c: string) => { const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] < 0.45; };

// ───────────── small helpers
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const range = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const eInOut = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 4);
export const eIn = (x: number) => Math.pow(clamp01(x), 3);
export const backOut = (x: number, s = 1.9) => { x = clamp01(x) - 1; return x * x * ((s + 1) * x + s) + 1; };
// a landing bounce: 0 → 1 with one overshoot, for things that drop into place
export const bounce = (x: number) => { x = clamp01(x); return 1 - Math.cos(x * Math.PI * 2.5) * Math.exp(-5.5 * x) * (1 - x); };
export const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => Math.min(eOut(range(t, a, a + fi)), 1 - eIn(range(t, b - fo, b)));
export const rnd = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (v: number[]) => "#" + v.map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("");
export const mix = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return toHex(A.map((x, i) => lerp(x, B[i], clamp01(k)))); };
export const shade = (c: string, k: number) => toHex(hex(c).map((x) => x * k));
export const lighten = (c: string, k: number) => mix(c, "#FFFFFF", k);

// ───────────── camera: keys in elements.json, eased between keys
export type Cam = { th: number; ph: number; z: number; cx: number; cy: number; L: number };
export const camAt = (t: number): Cam => {
  const K = T.cam;
  if (t <= K[0].t) return K[0];
  if (t >= K[K.length - 1].t) return K[K.length - 1];
  let i = 0;
  while (K[i + 1].t < t) i++;
  const a = K[i], b = K[i + 1], k = eInOut((t - a.t) / (b.t - a.t));
  return { th: lerp(a.th, b.th, k), ph: lerp(a.ph, b.ph, k), z: lerp(a.z, b.z, k), cx: lerp(a.cx, b.cx, k), cy: lerp(a.cy, b.cy, k), L: lerp(a.L, b.L, k) };
};
export type Proj = { p: (x: number, y: number, z: number) => [number, number]; sinT: number; cosT: number; cosP: number; zoom: number };
export const makeProj = (c: Cam, dy = 36): Proj => {
  const th = (c.th * Math.PI) / 180, ph = (c.ph * Math.PI) / 180;
  const cT = Math.cos(th), sT = Math.sin(th), sP = Math.sin(ph), cP = Math.cos(ph);
  const X = (x: number, y: number) => x * cT - y * sT;
  const Y = (x: number, y: number, z: number) => (x * sT + y * cT) * sP - z * cP;
  const Xc = X(c.cx, c.cy), Yc = Y(c.cx, c.cy, 0);
  return { p: (x, y, z) => [W / 2 + c.z * (X(x, y) - Xc), H / 2 + dy + c.z * (Y(x, y, z) - Yc)], sinT: sT, cosT: cT, cosP: cP, zoom: c.z };
};

// ───────────── where each element sits: the 18-wide table, or the 32-wide long form (L → 1), staggered
export const posAt = (e: El, L: number, t: number): [number, number] => {
  const k = eInOut(clamp01(L * 1.5 - (e.z / 118) * 0.5));
  let y = lerp(e.y, e.ly, k);
  if (e.f !== null) y += eInOut(range(t, 179.3, 180.2)) * 1.45 * (1 - k);   // the ending makes room for row 8
  return [lerp(e.x, e.lx, k), y];
};

// ───────────── history: when each element appears, and the year shown on the counter
const H_ = T.hist;
export const appearAt = (e: El): number => e.appear;   // computed (and quantised to sixteenths) in music/elements_data.py
export const yearAt = (t: number): string => {
  if (t < H_.medieval[0]) return "古代";
  if (t < H_.p) return String(Math.round(lerp(1250, 1669, range(t, H_.medieval[0], H_.p))));
  if (t < H_.y1700) return String(Math.round(lerp(1669, 1700, range(t, H_.p, H_.y1700))));
  if (t < H_.y1869) return String(Math.round(lerp(1700, 1869, range(t, H_.y1700, H_.y1869))));
  if (t < 45.4) return "1869";
  if (t < 47.6) return String(Math.round(lerp(1875, 1886, range(t, 45.4, 47.6))));
  if (t < H_.late[0]) return "1886";
  return String(Math.round(lerp(1887, 2016, range(t, H_.late[0], H_.late[1]))));
};
const GAPS = [31, 21, 32];

// ───────────── the state of one tile at time t
export type Tile = { show: number; ghost: boolean; h: number; drop: number; col: string; dim: number; glow: number; q: number; lit: number; beam: number; ripple: number; white: number };
const hood = T.hood as { id: string; t: number; out: number; z?: number[]; fam?: string }[];
const inHood = (e: El, d: (typeof hood)[number]) => (d.z ? d.z.includes(e.z) : e.fam === d.fam);
const COS = T.cosmos;
const ROW_END: Record<number, number> = {};
for (const e of EL) ROW_END[e.period] = Math.max(ROW_END[e.period] ?? 0, e.roll);
const originAt = (o: string) => (o === "bb" ? COS.bb : o === "ns" ? COS.ns : o === "hm" || o === "decay" ? COS.hm : COS.stars);

export const tileAt = (e: El, t: number): Tile => {
  const base = FAM[e.fam].c;
  const s: Tile = { show: 1, ghost: false, h: 0.2, drop: 0, col: base, dim: 0, glow: 0, q: 0, lit: 0, beam: 0, ripple: -1, white: 0 };
  // before the table exists, and the title: ghost cells only
  if (t < 18.6) { s.ghost = true; s.show = clamp01((t - 12.9) / 0.9); return s; }
  // 1 · history: tiles drop in as they are discovered; Mendeleev's cards (36.8–41.8) shuffle the known ones
  if (t < 56) {
    const at = appearAt(e);
    if (t < at) {
      s.ghost = true;
      if (GAPS.includes(e.z) && t > H_.gaps[0]) s.q = win(t, H_.gaps[0], at + 0.2, 0.4, 0.3);
      return s;
    }
    const k = range(t, at, at + 0.45);
    s.drop = (1 - bounce(k)) * 2.2;
    s.glow = Math.exp(-(t - at) / 0.5) * 0.9;
    if (e.z === 15) s.glow = Math.max(s.glow, win(t, H_.p, H_.p + 3.0) * 0.8);
    if (e.fam === "ng" && e.year > 1890) s.glow = Math.max(s.glow, win(t, H_.ng[0], H_.ng[1] + 1.2) * 0.9);
    // Mendeleev: the known cards lift into his hand and are laid back down in order
    if (e.year <= 1869 && t > 36.8 && t < 42.0) {
      const lay = e.lay ?? 38.4, up = eInOut(range(t, 36.8, 37.6)), down = range(t, lay, lay + 0.5);
      s.show = 1 - up + up * clamp01(down * 3);
      s.drop = down > 0 ? (1 - bounce(down)) * 1.6 : 0;
      s.ghost = down <= 0 && up > 0.5;
      if (s.ghost) s.show = 1;
    }
    if (t > 31.4 && t < 36.8) s.dim = 0.55 * win(t, 31.4, 36.8, 0.4, 0.4);
    return s;
  }
  // 2 · the map
  if (t < 104) {
    // proton count: H → O one by one
    if (t > 59.2 && t < 64.4 && e.z <= 8) { const at = 59.4 + (e.z - 1) * 0.5; s.glow = Math.exp(-Math.max(0, t - at) / 0.6) * (t >= at ? 1 : 0); s.h = 0.2 + (t >= at ? 0.25 * Math.exp(-(t - at) / 0.8) : 0); }
    // rows light up one after another
    if (t > 67.0 && t < 69.6) { const at = 67.2 + (e.period - 1) * 0.3; s.glow = Math.max(s.glow, t >= at ? Math.exp(-(t - at) / 0.45) * 0.9 : 0); }
    // column 1 rises: same outer electrons, same temper
    if (t > 69.6 && t < 74.0) {
      const k = win(t, 69.8, 74.0, 0.5, 0.5);
      if (e.group === 1 && e.z > 1) { s.h = 0.2 + 0.9 * k; s.glow = 0.4 * k; } else s.dim = 0.5 * k;
    }
    // roll call: everything waits a little dimmer, then each tile jumps on its note and stays lit
    if (t > 82.4) {
      const before = t < e.roll, k = range(t, 82.4, 83.0);
      if (before) s.dim = 0.72 * k;
      else {
        const d = t - e.roll; s.h = 0.2 + 1.3 * Math.exp(-d / 0.18) * clamp01(d / 0.04); s.glow = Math.exp(-d / 0.3); s.lit = 1;
        s.beam = Math.exp(-d / 0.32); s.ripple = d < 0.6 ? d : -1;
        const re = ROW_END[e.period]; if (t >= re) s.glow = Math.max(s.glow, 0.85 * Math.exp(-(t - re) / 0.35));
      }
      if (t > 103.6) s.dim = 0;
    }
    return s;
  }
  // 3 · neighbourhoods
  if (t < 158) {
    const d = hood.find((x) => t >= x.t - 0.3 && t < x.out + 0.3);
    const intro = win(t, 104.0, 106.4, 0.4, 0.5);     // every column lifts briefly: same column, same temper
    if (intro > 0) s.h = 0.2 + 0.35 * intro * (0.5 + 0.5 * Math.sin((e.group ?? 3) * 0.9 + t * 6));
    if (d) {
      const k = win(t, d.t - 0.3, d.out + 0.3, 0.45, 0.45);
      const kk2 = win(t, d.t - 0.3 + ((e.z * 7) % 11) * 0.025, d.out + 0.3, 0.55, 0.45);
      if (inHood(e, d)) { s.h = 0.2 + 2.3 * backOut(kk2, 1.6); s.white = kk2; } else { s.dim = 0.7 * k; s.h = 0.2 - 0.1 * k; }
      for (const tool of T.tools) if (tool.z === e.z) { const kk = win(t, tool.t, tool.t + 1.2, 0.2, 0.25); s.h += 0.9 * kk; s.glow = Math.max(s.glow, kk * 0.8); }
    }
    return s;
  }
  // 4 · where they came from: the table goes dark, then lights up by origin
  if (t < 179.8) {
    const back = eInOut(range(t, COS.back[0], COS.back[1]));
    const at = originAt(e.origin) + (e.origin === "bb" || e.origin === "ns" || e.origin === "hm" || e.origin === "decay" ? 0 : (e.x / 18) * 1.2);
    const on = eOut(range(t, at, at + 0.5));
    const dark = mix(base, P.night2, 0.82 * eInOut(range(t, COS.bg[0], COS.bg[1])));
    const oc = ORIGIN[e.origin].c;
    s.col = mix(mix(dark, oc, on), base, back);
    s.h = 0.2 + 0.5 * on * (1 - back) * (0.6 + 0.4 * rnd(e.z));
    s.glow = Math.exp(-Math.max(0, t - at) / 0.6) * (t >= at ? 0.9 : 0) * (1 - back);
    s.lit = on * (1 - back);
    return s;
  }
  // ending: the table settles; nothing special per tile (row 8 is drawn separately)
  return s;
};

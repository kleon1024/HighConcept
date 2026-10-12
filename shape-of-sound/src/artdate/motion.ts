// The motion system for the art-date film, defined once and reused everywhere (see ARTDATE_STORYBOARD.md "Motion system").
import J from "./artdate.json";

export const FPS = J.fps, VW = J.width, VH = J.height, BAR = J.bar, BEAT = J.bar / 4;
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => (b === a ? (t >= b ? 1 : 0) : clamp01((t - a) / (b - a)));
export const smooth = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

// ── easings (custom curves, never the defaults)
export const outExpo = (x: number) => { const t = clamp01(x); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); };
export const inCubic = (x: number) => { const t = clamp01(x); return t * t * t; };
export const outCubic = (x: number) => { const t = clamp01(x); return 1 - Math.pow(1 - t, 3); };
export const inOutSine = (x: number) => { const t = clamp01(x); return -(Math.cos(Math.PI * t) - 1) / 2; };
export const inOutCubic = (x: number) => { const t = clamp01(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const inOutQuint = (x: number) => { const t = clamp01(x); return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2; };
export const outBack = (x: number, k = 1.7) => { const t = clamp01(x) - 1; return 1 + (k + 1) * t * t * t + k * t * t; };
export const EASE: Record<string, (x: number) => number> = {
  lin: (x) => clamp01(x), inout: inOutSine, out: outExpo, in: inCubic, punch: (x) => outBack(x, 1.25), whip: inOutQuint,
  hold: (x) => (x >= 1 ? 1 : 0), zoomout: inOutCubic, walk: inOutSine, steps: inOutSine,
};

// damped spring step response: 0 → 1 with a little overshoot (ζ < 1). t in seconds since start.
export const spring = (t: number, zeta = 0.55, freq = 2.6) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * w * t) * (Math.cos(wd * t) + (zeta * w / wd) * Math.sin(wd * t));
};
// an enter/exit envelope for UI: spring in at `a`, ease-in out at `b`
export const inOut = (t: number, a: number, b: number, outDur = 0.3) => (t < a ? 0 : spring(t - a)) * (1 - inCubic(range(t, b, b + outDur)));

// ── deterministic randomness
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
export const hash2 = (a: number, b: number) => hash(a * 157.31 + b * 113.97 + 7.13);
export const mulberry = (seed: number) => { let a = seed >>> 0; return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const vnoise = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  const u = fade(xf), v = fade(yf);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
};
export const fbm = (x: number, y: number, oct = 3) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2; a *= 0.5; } return s; };
// a divergence-free swirl field (for the van Gogh strokes)
export const curl = (x: number, y: number, sc = 0.004): [number, number] => {
  const e = 1.5, n = (a: number, b: number) => fbm(a * sc, b * sc, 2);
  return [(n(x, y + e) - n(x, y - e)) / (2 * e), -(n(x + e, y) - n(x - e, y)) / (2 * e)];
};

// ── colour
export type RGB = [number, number, number];
export const hex = (c: string): RGB => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) as RGB;
export const rgb = (c: RGB, a = 1) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;
export const mixc = (a: string | RGB, b: string | RGB, k: number): RGB => {
  const A = typeof a === "string" ? hex(a) : a, B = typeof b === "string" ? hex(b) : b;
  return [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
};
export const shade = (c: string, k: number) => rgb(k > 0 ? mixc(c, "#FFFFFF", k) : mixc(c, "#0B0907", -k));

// ── timeline sampling: keys [{t, ...numbers, e}] — `e` on a key is the easing used to arrive at it
export type Key = { t: number; e?: string; [k: string]: number | string | boolean | undefined };
export const sampleKeys = <T extends Key>(keys: T[], t: number, fields: string[], logFields: string[] = []) => {
  const out: Record<string, number> = {};
  let i = 0;
  while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const p = b === a ? 0 : (EASE[(b.e as string) ?? "inout"] ?? inOutSine)(range(t, a.t, b.t));
  for (const f of fields) {
    const va = a[f] as number, vb = b[f] as number;
    out[f] = logFields.includes(f) ? Math.exp(lerp(Math.log(va), Math.log(vb), p)) : lerp(va, vb, p);
  }
  out.p = p; out.seg = i;
  return out;
};
// the active entry of a step timeline ({t, id, dur?, tr?, cut?}) with transition progress
export type Step = { t: number; id: string; dur?: number; tr?: string; cut?: boolean; fx?: string };
export const stepAt = (steps: Step[], t: number) => {
  let i = 0;
  while (i < steps.length - 1 && steps[i + 1].t <= t) i++;
  const cur = steps[i], prev = i > 0 ? steps[i - 1] : cur;
  const dur = cur.dur ?? 0;
  const p = !dur || cur.cut ? 1 : range(t, cur.t, cur.t + dur);
  return { cur, prev, p, i };
};

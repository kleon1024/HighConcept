// 提灯的人 (60 s): shared timing, palette, fonts and the timeline ruler's mapping. Times: philo.json (shared with the score).
import J from "./philo.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix, shade, lighten, isDark } from "../elements/core";
import { clamp01, eInOut, lerp, range } from "../elements/core";

export const PJ = J;
export type Sec = (typeof J.sec)[number];
export const SEC = J.sec;
export const secAt = (t: number) => SEC.find((s) => t >= s.t && t < s.out);

export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const LATIN = "'Cormorant Garamond', 'Noto Serif SC', serif";
export const MONO = "'Space Grotesk', 'Noto Sans SC', sans-serif";

export const GOLD = "#FFC24A", FLAME = "#FFE7A3", EMBER = "#FF7A1A", NIGHT = "#0B0907", PAPER = "#F2E6CC", INK = "#140C08";

// the ruler: antiquity on the left, a break for the 2000 quiet years, modernity on the right
export const RULER_Y = 1012;
export const yearX = (y: number) => {
  if (y < 0) return lerp(150, 560, clamp01((y + 450) / 200));
  return lerp(700, 1770, clamp01((y - 1760) / 260));
};
export const fmtYear = (y: number) => (y < 0 ? `公元前 ${-y}` : `${y}`);
// where the lamp (the playhead) is on the ruler at time t: it flies to each section's year on its downbeat
const KEYS: [number, number][] = [[0, -350], [8.0, -399], [14.0, -350], [20.0, 1789], [26.0, 1818], [32.0, 1882], [38.0, 1945], [44.0, 1975], [48.0, 1984], [50.0, 1983], [52.6, 2024]];
export const playYear = (t: number) => {
  let p = KEYS[0];
  for (const k of KEYS) if (k[0] <= t) p = k;
  const n = KEYS.find((k) => k[0] > t);
  if (n && t > n[0] - 0.45) { const k = eInOut(range(t, n[0] - 0.45, n[0])); return { x: lerp(yearX(p[1]), yearX(n[1]), k), y: k < 0.5 ? p[1] : n[1], moving: true }; }
  return { x: yearX(p[1]), y: p[1], moving: false };
};

// 意义，从哪来？(60 s): shared timing, fonts and helpers. Times: meaning.json (shared with music/meaning.py).
import J from "./meaning.json";
export { clamp01, lerp, range, eOut, eIn, eInOut, backOut, win, rnd, mix, shade, lighten, isDark } from "../elements/core";
export const MJ = J;
export type Seg = (typeof J.seg)[number];
export const SEG = J.seg;
export const CUE = J.cue;
export const segAt = (t: number) => SEG.find((s) => t >= s.t && t < s.out);
export const SERIF = "'Noto Serif SC', serif";
export const SANS = "'Noto Sans SC', sans-serif";
export const LATIN = "'Cormorant Garamond', 'Noto Serif SC', serif";
export const GROT = "'Space Grotesk', 'Noto Sans SC', sans-serif";
export const BIG = "'Archivo Black', 'Noto Sans SC', sans-serif";
export const GOLD = "#F5C451", INK = "#0B0B0D", PAPER = "#F4EEE2";

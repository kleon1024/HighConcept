// Style registry: how each movement repaints the hall and the couple.
import { Mat, MAT_NATURAL } from "./couple";
import { hsl, rgb2hsl } from "./npr";
import { Pal, PAL } from "./world";

export type StyleDef = {
  pal?: (arch: string) => Pal;           // architecture palette (defaults to the hall's natural palette)
  mat?: Mat;                             // couple materials
  light?: string;                        // lighting overlay on the source: "warm" | "spot" | "cool" | "day" | "gallery"
  bg?: string; fg?: string;              // NPR passes: "none" | "oil" | "sfumato" | "dabs" | "dots" | "swirl" | ...
  grain?: number; varnish?: string;      // finishing
};
const nat = (a: string) => PAL[a] ?? PAL.cube;
const remap = (pal: Pal, f: (h: number, s: number, l: number) => [number, number, number]): Pal => {
  const out: Pal = {};
  for (const [k, v] of Object.entries(pal)) { const r = parseInt(v.slice(1, 3), 16), g = parseInt(v.slice(3, 5), 16), b = parseInt(v.slice(5, 7), 16); const [h, s, l] = rgb2hsl(r, g, b); const [H, S, L] = f(h, s, l); out[k] = hsl(H, S, L); }
  return out;
};
export const STYLES: Record<string, StyleDef> = {
  flat: { light: "gallery", bg: "none", fg: "none", grain: 0.05 },
  gothic: { light: "cool", bg: "oil", fg: "oil", grain: 0.06, varnish: "rgba(40,30,20,0.18)" },
  renaissance: { light: "warm", bg: "sfumato", fg: "sfumato", grain: 0.05, varnish: "rgba(150,110,40,0.16)" },
  baroque: { light: "spot", bg: "oil", fg: "oil", grain: 0.06, varnish: "rgba(110,70,20,0.14)" },
  impressionist: { light: "day", bg: "dabs", fg: "dabs", grain: 0.04 },
  pointillist: { light: "day", bg: "dots", fg: "dots", grain: 0.0 },
  vangogh: { light: "night", bg: "swirl", fg: "swirl", grain: 0.03, pal: (a) => remap(nat(a), (h, s, l) => [l > 0.6 ? 48 : 222, Math.min(1, s + 0.45), l * 0.8 + 0.05]) },
  fauve: { light: "gallery", bg: "fauve", fg: "fauve", grain: 0.04 },
  cubist: { light: "gallery", bg: "cubist", fg: "cubist", grain: 0.05 },
  suprematist: { light: "gallery", bg: "none", fg: "suprematist", grain: 0.05 },
  dada: { light: "gallery", bg: "none", fg: "dada", grain: 0.06 },
  colorfield: { light: "gallery", bg: "soft", fg: "soft", grain: 0.04 },
  pop: { light: "gallery", bg: "pop", fg: "pop", grain: 0.0 },
  nouveau: { light: "gallery", bg: "nouveau", fg: "nouveau", grain: 0.04 },
  deco: { light: "gallery", bg: "deco", fg: "deco", grain: 0.03 },
  bauhaus: { light: "gallery", bg: "none", fg: "bauhaus", grain: 0.04 },
  hightech: { light: "gallery", bg: "none", fg: "none", grain: 0.04 },
};
export const styleMat = (id: string): Mat => STYLES[id]?.mat ?? MAT_NATURAL;
export const stylePal = (id: string, arch: string): Pal => (STYLES[id]?.pal ? STYLES[id].pal!(arch) : nat(arch));

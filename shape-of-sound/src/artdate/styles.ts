// Style registry: how each movement repaints the hall and the couple.
import { Mat, MAT_NATURAL } from "./couple";
import { hsl, rgb2hsl } from "./npr";
import { Pal, PAL } from "./world";

type Ctx = CanvasRenderingContext2D;
export type StyleDef = {
  pal?: (arch: string) => Pal;           // architecture palette (defaults to the hall's natural palette)
  outline?: { color: string; w: number };
  mat?: (ctx: Ctx) => Mat;               // couple materials (patterns are made on the target context)
  figure?: "couple" | "bauhaus" | "suprematist";
  light?: string;                        // lighting overlay on the source
  bg?: string; fg?: string;              // NPR passes
  orn?: string;                          // extra ornament on the hall source: "pop" | "nouveau" | "deco" | "dada"
  grain?: number; varnish?: string;
};
const nat = (a: string) => PAL[a] ?? PAL.cube;
const remap = (pal: Pal, f: (h: number, s: number, l: number) => [number, number, number]): Pal => {
  const out: Pal = {};
  for (const [k, v] of Object.entries(pal)) { const r = parseInt(v.slice(1, 3), 16), g = parseInt(v.slice(3, 5), 16), b = parseInt(v.slice(5, 7), 16); const [h, s, l] = rgb2hsl(r, g, b); const [H, S, L] = f(h, s, l); out[k] = hsl(H, S, L); }
  return out;
};
// a small repeating dot tile (Ben-Day / halftone)
const dots = (ctx: Ctx, bg: string, dot: string, size = 12, r = 3.2) => {
  const c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d")!;
  g.fillStyle = bg; g.fillRect(0, 0, size, size); g.fillStyle = dot;
  for (const [x, y] of [[0, 0], [size, 0], [0, size], [size, size], [size / 2, size / 2]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  return ctx.createPattern(c, "repeat")!;
};
const flat = (o: Partial<Mat>): Mat => ({ ...MAT_NATURAL, shade: false, ...o });

export const STYLES: Record<string, StyleDef> = {
  flat: { light: "gallery", bg: "none", fg: "none", grain: 0.05 },
  gothic: { light: "cool", bg: "oil", fg: "oil", grain: 0.06, varnish: "rgba(40,30,20,0.18)" },
  renaissance: { light: "warm", bg: "sfumato", fg: "sfumato", grain: 0.05, varnish: "rgba(150,110,40,0.16)" },
  baroque: { light: "spot", bg: "oil", fg: "oil", grain: 0.06, varnish: "rgba(110,70,20,0.14)" },
  impressionist: { light: "day", bg: "dabs", fg: "dabs", grain: 0.04 },
  pointillist: { light: "day", bg: "dots", fg: "dots", grain: 0.0 },
  vangogh: { light: "gallery", bg: "swirl", fg: "swirl", grain: 0.03, pal: (a) => remap(nat(a), (h, s, l) => (l > 0.86 ? [48, 0.95, 0.66] : [218 + (h % 24), 0.5 + s * 0.3, 0.2 + l * 0.42])) },
  fauve: { light: "gallery", bg: "fauve", fg: "fauve", grain: 0.04 },
  cubist: { light: "gallery", bg: "cubist", fg: "cubist", grain: 0.05 },
  suprematist: { light: "gallery", bg: "none", fg: "none", figure: "suprematist", grain: 0.05 },
  dada: { light: "gallery", bg: "none", fg: "dada", orn: "dada", grain: 0.06 },
  colorfield: { light: "gallery", bg: "soft", fg: "soft", grain: 0.04 },
  pop: {
    light: "none", bg: "none", fg: "none", orn: "pop", grain: 0.0, outline: { color: "#111111", w: 4 },
    pal: (a) => ({ ...nat(a), wall: "#FFF2C8", wall2: "#FFE08A", ceil: "#FFFFFF", floor: "#2A8BD8", floor2: "#1E6FB5", rail: "#111111", skirt: "#111111", glass: "#7FC6F0", sky: "#BFE6FF", mull: "#111111", beam: "#FFFFFF", red: "#E8322B", yellow: "#F6C21C", blue: "#2A8BD8" }),
    mat: (ctx) => flat({ coat: "#F6C21C", coatDk: "#111111", scarf: "#2A8BD8", scarf2: "#111111", trousers: "#1B1B1B", shoeM: "#111111", hairM: "#111111", hairMhi: "#2A8BD8",
      skin: dots(ctx, "#FFD9C2", "#F07A7A", 10, 2.2), skinDk: "#F07A7A", dress: "#E8322B", dressDk: "#111111", hairF: "#111111", hairFhi: "#2A8BD8", legs: dots(ctx, "#FFD9C2", "#F07A7A", 10, 2.2), shoeF: "#111111", gold: "#F6C21C", line: "#111111", lw: 1.3, eye: "#111111" }),
  },
  nouveau: {
    light: "none", bg: "none", fg: "none", orn: "nouveau", grain: 0.05, outline: { color: "#5A3E2B", w: 2.5 },
    pal: (a) => ({ ...nat(a), wall: "#EFE3C8", wall2: "#E2D1AE", ceil: "#F3EAD6", beam: "#D9C7A0", glass: "#C9D3B0", sky: "#E4E8CF", glass2: "#B7C49A", mull: "#6E5236", floor: "#B79B73", floor2: "#9E825C", red: "#C98A7E", yellow: "#D9B45E", blue: "#8FA38A" }),
    mat: () => flat({ coat: "#C9A36B", coatDk: "#7A5A36", scarf: "#D9B45E", scarf2: "#7A8F5C", trousers: "#5A4636", shoeM: "#3A2A1E", hairM: "#4A2E1C", hairMhi: "#7A4A2E",
      skin: "#F1D6BC", skinDk: "#D9B396", dress: "#B5655F", dressDk: "#7A3A36", hairF: "#8A4A28", hairFhi: "#B8743E", legs: "#E9C9AA", shoeF: "#3A2A1E", gold: "#D9B45E", line: "#4A3222", lw: 0.9, eye: "#3A2416" }),
  },
  deco: {
    light: "none", bg: "none", fg: "none", orn: "deco", grain: 0.03, outline: { color: "#C9A23A", w: 1.5 },
    pal: (a) => ({ ...nat(a), wall: "#151515", wall2: "#202020", ceil: "#101010", beam: "#2A2A2A", glass: "#1F2A2A", sky: "#263333", glass2: "#2E3B3B", mull: "#D4AF37", floor: "#1A1A1A", floor2: "#D4AF37", red: "#D4AF37", yellow: "#F3E6C4", blue: "#0F3B3A" }),
    mat: () => flat({ coat: "#1C1C1C", coatDk: "#D4AF37", scarf: "#D4AF37", scarf2: "#111111", trousers: "#111111", shoeM: "#0A0A0A", hairM: "#0E0E0E", hairMhi: "#D4AF37",
      skin: "#EAD7C0", skinDk: "#CDB79C", dress: "#0F3B3A", dressDk: "#D4AF37", hairF: "#0E0E0E", hairFhi: "#D4AF37", legs: "#EAD7C0", shoeF: "#D4AF37", gold: "#D4AF37", line: "#D4AF37", lw: 0.7, eye: "#111111" }),
  },
  bauhaus: { light: "gallery", bg: "none", fg: "none", figure: "bauhaus", grain: 0.04 },
  hightech: { light: "gallery", bg: "none", fg: "none", grain: 0.04 },
};
export const styleMat = (id: string, ctx: Ctx): Mat => (STYLES[id]?.mat ? STYLES[id].mat!(ctx) : MAT_NATURAL);
export const stylePal = (id: string, arch: string): Pal => (STYLES[id]?.pal ? STYLES[id].pal!(arch) : nat(arch));

// The per-frame compositor: hall (stylised) → real artworks (crisp) → couple (stylised) → finish; style/architecture
// changes render both states and reveal the new one through a stroke-shaped mask (the film's signature transition).
import { staticFile } from "remotion";
import J from "./artdate.json";
import { coupleScreen, drawCouple, drawProps, MAT_NATURAL } from "./couple";
import { clamp01, Step, stepAt, VH, VW } from "./motion";
import { drawMask } from "./masks";
import { drawClink } from "./ending";
import { canvasTex, field, grab, grainTex, overlayTex, paintDots, paintStrokes, brokenColour, plainColour } from "./npr";
import { drawArt, stylizeBg, stylizeFg } from "./styleops";
import { STYLES, stylePal, styleMat } from "./styles";
import { ARCH, Cam, camAt, drawFrame, workRect } from "./world";

type Ctx = CanvasRenderingContext2D;
const pool: Record<string, HTMLCanvasElement> = {};
export const cv = (k: string) => { if (!pool[k]) { const c = document.createElement("canvas"); c.width = VW; c.height = VH; pool[k] = c; } return pool[k]; };
export const cx2 = (k: string) => cv(k).getContext("2d", { willReadFrequently: k.endsWith("src") })!;

// ── assets
export const IMGS: Record<string, HTMLImageElement> = {};
let loading: Promise<void> | null = null;
export const loadAssets = () => {
  if (loading) return loading;
  const list = J.works.filter((w) => "img" in w && w.img).map((w) => (w as { img: string }).img);
  loading = Promise.all([
    ...list.map((src) => new Promise<void>((res) => { const im = new Image(); im.onload = () => { IMGS[src] = im; res(); }; im.onerror = () => res(); im.src = staticFile(src); })),
    document.fonts.load('900 60px "Noto Serif SC"'), document.fonts.load('700 60px "Noto Sans SC"'), document.fonts.load('italic 600 60px "Cormorant Garamond"'),
  ]).then(() => undefined);
  return loading;
};
export const aspectOf = (w: (typeof J.works)[number]) => {
  const im = "img" in w && w.img ? IMGS[w.img as string] : null;
  if (im) return im.naturalWidth / im.naturalHeight;
  return ({ urinal: 0.9, colorfield: 0.78, pop: 1.0, deco: 0.72, bauhaus: 0.72 } as Record<string, number>)[(w as { kind?: string }).kind ?? ""] ?? 1;
};

// ── scene time: the panic freeze holds the picture at 3.0 s
export const sceneTime = (t: number) => (t >= 3.0 && t < 4.0 ? 3.0 : t);

// ── lighting on the source (before the paint)
const light = (ctx: Ctx, kind: string | undefined, c: Cam, t: number) => {
  ctx.save();
  const vg = ctx.createRadialGradient(VW * 0.42, VH * 0.45, VH * 0.3, VW * 0.5, VH * 0.5, VH * 0.95);
  const vig = (a: number) => { vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, `rgba(0,0,0,${a})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, VW, VH); };
  if (kind === "warm") { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(255,226,170,0.35)"; ctx.fillRect(0, 0, VW, VH); ctx.globalCompositeOperation = "source-over"; vig(0.35); }
  else if (kind === "spot") {
    ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(70,50,35,1)"; ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "screen";
    const g = ctx.createRadialGradient(VW * 0.36, VH * 0.42, 40, VW * 0.4, VH * 0.5, VH * 0.75);
    g.addColorStop(0, "rgba(255,214,150,0.95)"); g.addColorStop(0.45, "rgba(170,110,60,0.45)"); g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.globalAlpha = 0.22; ctx.fillStyle = "#FFE2A8";                                          // a raking beam from the upper right
    ctx.beginPath(); ctx.moveTo(VW * 0.95, -20); ctx.lineTo(VW * 1.15, -20); ctx.lineTo(VW * 0.45, VH); ctx.lineTo(VW * 0.12, VH); ctx.closePath(); ctx.fill();
  }
  else if (kind === "cool") { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(170,185,215,1)"; ctx.fillRect(0, 0, VW, VH); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.16; ctx.fillStyle = "#F6E7B8"; for (const x0 of [0.15, 0.55, 0.95]) { ctx.beginPath(); ctx.moveTo(VW * x0, 0); ctx.lineTo(VW * (x0 + 0.08), 0); ctx.lineTo(VW * (x0 - 0.12), VH); ctx.lineTo(VW * (x0 - 0.22), VH); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; vig(0.4); }
  else if (kind === "day") {   // skylight glow from above, cool shadows low down, drifting steam (Gare Saint-Lazare)
    ctx.globalCompositeOperation = "screen"; const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, "rgba(255,240,205,0.5)"); g.addColorStop(0.55, "rgba(255,240,205,0.06)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "multiply"; const g2 = ctx.createLinearGradient(0, VH * 0.55, 0, VH); g2.addColorStop(0, "rgba(255,255,255,1)"); g2.addColorStop(1, "rgba(175,185,220,1)"); ctx.fillStyle = g2; ctx.fillRect(0, 0, VW, VH);
    ctx.globalCompositeOperation = "source-over"; ctx.filter = "blur(40px)";
    for (let i = 0; i < 7; i++) { const x = ((i * 337 + t * 22 - c.x * c.s * 0.6) % (VW + 600) + VW + 600) % (VW + 600) - 300, y = 60 + (i * 97) % 380; ctx.fillStyle = `rgba(236,240,246,${0.16 + (i % 3) * 0.05})`; ctx.beginPath(); ctx.ellipse(x, y, 260, 90, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.filter = "none"; vig(0.16);
  }
  else if (kind === "night") { ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(120,140,200,1)"; ctx.fillRect(0, 0, VW, VH); ctx.globalCompositeOperation = "source-over"; vig(0.3); }
  else vig(0.16);
  ctx.restore();
  void c; void t;
};

// ── artworks: frames go into the hall source (and get painted), canvases are drawn crisp on top
const drawFrames = (ctx: Ctx, c: Cam, t: number) => {
  for (const w of J.works) {
    if (Math.abs(w.x - c.x) > VW / c.s + 3) continue;
    const r = workRect(c, w, aspectOf(w), t);
    if (w.frame === "plinth") continue;
    drawFrame(ctx, r, w.frame, c.s);
  }
};
const drawWorks = (ctx: Ctx, c: Cam, t: number, style: string) => {
  for (const w of J.works) {
    if (Math.abs(w.x - c.x) > VW / c.s + 3) continue;
    const r = workRect(c, w, aspectOf(w), t), im = "img" in w && w.img ? IMGS[w.img as string] : null;
    ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.rotate(r.rot);
    if (im) { ctx.imageSmoothingQuality = "high"; ctx.drawImage(im, -r.w / 2, -r.h / 2, r.w, r.h); }
    else drawArt(ctx, (w as { kind?: string }).kind ?? "", r.w, r.h, c, t, style);
    ctx.restore();
  }
};

// ── one fully styled state
export const renderStyled = (out: Ctx, style: string, arch: string, build: number, t: number, c: Cam) => {
  const S = STYLES[style] ?? STYLES.flat;
  const bs = cx2("bgsrc");
  bs.setTransform(1, 0, 0, 1, 0, 0); bs.clearRect(0, 0, VW, VH);
  ARCH[arch](bs, c, { pal: stylePal(style, arch), build, t });
  drawFrames(bs, c, t);
  light(bs, S.light, c, t);
  out.save();
  stylizeBg(out, bs, S.bg ?? "none", c, t, style);
  drawWorks(out, c, t, style);
  const fs = cx2("fgsrc");
  fs.setTransform(1, 0, 0, 1, 0, 0); fs.clearRect(0, 0, VW, VH);
  drawCouple(fs, styleMat(style), c, t);
  drawProps(fs, c, arch, styleMat(style));
  if (S.light === "spot" || S.light === "night") { fs.save(); fs.globalCompositeOperation = "source-atop"; fs.fillStyle = S.light === "spot" ? "rgba(40,20,10,0.35)" : "rgba(20,30,70,0.3)"; fs.fillRect(0, 0, VW, VH); fs.restore(); }
  stylizeFg(out, fs, S.fg ?? "none", c, t, style);
  if (S.varnish) { out.globalCompositeOperation = "multiply"; out.fillStyle = S.varnish; out.fillRect(0, 0, VW, VH); out.globalCompositeOperation = "source-over"; }
  if (S.grain) overlayTex(out, grainTex(), S.grain * 2.4, "overlay", Math.floor(t * 30) * 97);
  if (S.bg === "oil" || S.bg === "sfumato") overlayTex(out, canvasTex(), 0.18, "overlay");
  out.restore();
};

// ── the frame
const steps = (k: "styles" | "arch") => J[k] as Step[];
export const renderFrame = (out: Ctx, tIn: number) => {
  const t = sceneTime(tIn), c = camAt(t);
  const st = stepAt(steps("styles"), t), ar = stepAt(steps("arch"), t);
  const sTr = st.p < 1, aTr = ar.p < 1;
  if (!sTr && !aTr) renderStyled(out, st.cur.id, ar.cur.id, 1, t, c);
  else {
    const A = cx2("A"), B = cx2("B"), M = cx2("M");
    renderStyled(A, sTr ? st.prev.id : st.cur.id, aTr ? ar.prev.id : ar.cur.id, 1, t, c);
    renderStyled(B, st.cur.id, ar.cur.id, aTr ? ar.p : 1, t, c);
    const p = sTr ? st.p : ar.p, kind = sTr ? st.cur.tr ?? "dabs" : ar.cur.fx ?? "dabs";
    M.setTransform(1, 0, 0, 1, 0, 0); M.clearRect(0, 0, VW, VH);
    drawMask(M, kind, p, c, t);
    B.save(); B.globalCompositeOperation = "destination-in"; B.drawImage(cv("M"), 0, 0); B.restore();
    out.drawImage(cv("A"), 0, 0); out.drawImage(cv("B"), 0, 0);
  }
  // whip-pans: directional blur from the camera's screen velocity
  const v = Math.abs(c.vx) / 30;
  if (v > 25) {
    const W = cx2("W"), n = 10, L = Math.min(520, v * 0.9);
    W.setTransform(1, 0, 0, 1, 0, 0); W.clearRect(0, 0, VW, VH); W.drawImage(out.canvas, 0, 0);
    out.save(); out.globalAlpha = 1; out.fillStyle = "#000";
    for (let i = 0; i < n; i++) { out.globalAlpha = 1 / (i + 1); out.drawImage(cv("W"), (i / (n - 1) - 0.5) * L * Math.sign(c.vx), 0); }
    out.restore();
  }
  drawClink(out, tIn);
  return { c, t, st, ar, couple: coupleScreen(c, t) };
};
export { MAT_NATURAL, clamp01, field, grab, paintStrokes, paintDots, brokenColour, plainColour };

// The gallery as a tiny 3-D world: a pinhole camera faces the long wall (d = 0) and trucks along it (x, metres).
// Each hall is drawn as wall elevation + ceiling/vault + floor in one-point perspective; `build` (0..1) animates the
// architecture "rebuilding" during a morph. Colours come from a palette so the vector styles can recolour it.
import J from "./artdate.json";
import { clamp01, hash, hash2, lerp, outBack, outCubic, sampleKeys, VH, VW } from "./motion";

export type Cam = { x: number; s: number; z: number; h: number; yh: number; f: number; vx: number; vs: number; whip: boolean };
const camRaw = (t: number) => {
  const c = sampleKeys(J.cam as never, t, ["x", "s", "z", "h", "yh"], ["s"]);
  return { x: c.x, s: c.s, z: c.z, h: c.h, yh: c.yh, seg: c.seg };
};
// a segment is a whip-pan when the key it travels to is eased "whip" (only those get the stylised streak blur)
const isWhip = (seg: number) => (J.cam[Math.min(seg + 1, J.cam.length - 1)] as { e?: string }).e === "whip";
export const camAt = (t: number): Cam => {
  const { seg, ...c } = camRaw(t), a = camRaw(t - 1 / 60), b = camRaw(t + 1 / 60);
  return { ...c, f: c.s * c.z, vx: ((b.x - a.x) * 30) * c.s, vs: (Math.log(b.s) - Math.log(a.s)) * 30, whip: isWhip(seg) && b.x !== a.x };
};
// project world (x, y up, d toward camera) → screen
export const P = (c: Cam, x: number, y: number, d = 0): [number, number] => {
  const k = c.f / Math.max(0.05, c.z - d);
  return [VW / 2 + k * (x - c.x), c.yh - k * (y - c.h)];
};
export const K = (c: Cam, d = 0) => c.f / Math.max(0.05, c.z - d);
export const visX = (c: Cam, m = 1.15) => [c.x - (VW / 2 / c.s) * m - 1, c.x + (VW / 2 / c.s) * m + 1] as const;

type Ctx = CanvasRenderingContext2D;
// vector styles (pop, Nouveau, Deco) ink every architectural shape with an outline
export const OUTLINE: { color: string; w: number } = { color: "", w: 0 };
export const poly = (ctx: Ctx, pts: [number, number][], fill?: string | CanvasGradient | CanvasPattern, stroke?: string, lw = 1) => {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke || OUTLINE.w) { ctx.strokeStyle = OUTLINE.w ? OUTLINE.color : stroke!; ctx.lineWidth = OUTLINE.w || lw; ctx.lineJoin = "round"; ctx.stroke(); }
};
const wallRect = (ctx: Ctx, c: Cam, x0: number, x1: number, y0: number, y1: number, fill: string | CanvasGradient, d = 0, stroke?: string, lw = 1) => {
  const [a, b] = P(c, x0, y1, d), [e, g] = P(c, x1, y0, d);
  ctx.fillStyle = fill; ctx.fillRect(a, b, e - a, g - b);
  if (stroke || (OUTLINE.w && (e - a) > 3 && (g - b) > 3)) { ctx.strokeStyle = OUTLINE.w ? OUTLINE.color : stroke!; ctx.lineWidth = OUTLINE.w || lw; ctx.strokeRect(a, b, e - a, g - b); }
};
const line3 = (ctx: Ctx, c: Cam, pts: [number, number, number][], stroke: string, lw: number) => {
  ctx.beginPath(); pts.forEach(([x, y, d], i) => { const [X, Y] = P(c, x, y, d); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
};

// ───────────── palettes (natural colours; vector styles pass their own)
export type Pal = Record<string, string>;
export const PAL: Record<string, Pal> = {
  gothic: { wall: "#8E8A80", wall2: "#77736A", joint: "#5F5B53", floor: "#6B675F", floor2: "#5A564E", ceil: "#7C786F", rib: "#4E4A43", glassA: "#2F4FA0", glassB: "#A3283A", glassC: "#D7A93A", light: "#F3E2B0" },
  palace: { sky: "#9DB8D6", wall: "#7E1E24", wall2: "#6A161C", damask: "#93303A", dado: "#2F2A22", dado2: "#4A3F31", pil: "#E8DCC4", pil2: "#C9B99A", gold: "#C99A3B", gold2: "#8E6A22", ceil: "#E9DFC8", coffer: "#C8B48A", rosette: "#C99A3B", floorA: "#E6DED0", floorB: "#2B2622", light: "#FFE7B0" },
  station: { wall: "#DCD5C8", wall2: "#C8C0B3", joint: "#A49C90", arch: "#CFC6B8", ceil: "#E2DACB", coffer: "#C9BDA6", rosette: "#B88F3E", rib: "#34444E", glass: "#E4EEF3", glass2: "#B3CAD8", floor: "#BDB7AC", floor2: "#A8A196", clock: "#F2EAD6", gold: "#B88F3E", light: "#FFF6DF" },
  cube: { wall: "#E9E5DD", wall2: "#D6D1C7", floor: "#C6C0B5", floor2: "#ADA699", ceil: "#F2F0EB", rail: "#1E1E20", skirt: "#3A3A3C", light: "#FFFDF4" },
  design: { wall: "#F2F0EB", glass: "#BFD6E2", glass2: "#9FBCCB", sky: "#DCE9F0", mull: "#1D1F22", floor: "#3A3634", floor2: "#2E2B29", ceil: "#EDEBE6", beam: "#D7D3CB", red: "#D2342A", yellow: "#F2C230", blue: "#2457A5", light: "#FFFFFF" },
  hightech: { wall: "#F2F0EB", glass: "#BFD6E2", glass2: "#9FBCCB", sky: "#DCE9F0", mull: "#1D1F22", floor: "#3A3634", floor2: "#2E2B29", ceil: "#EDEBE6", beam: "#D7D3CB", red: "#D2342A", yellow: "#F2C230", blue: "#2457A5", light: "#FFFFFF", green: "#2E9B57" },
};

export type ArchOpts = { pal: Pal; build: number; t: number; outline?: string; ow?: number; flat?: boolean; noCeil?: boolean };

// ── ceiling helpers: a vault given by a section profile y(u), d(u) for u ∈ [0,1] (u = 0 at the wall)
const vaultQuad = (ctx: Ctx, c: Cam, x0: number, x1: number, prof: (u: number) => [number, number], u0: number, u1: number, fill: string | CanvasGradient, stroke?: string, lw = 1) => {
  const [y0, d0] = prof(u0), [y1, d1] = prof(u1);
  if (d0 > c.z - 0.3 || d1 > c.z - 0.3) return;
  poly(ctx, [P(c, x0, y0, d0), P(c, x1, y0, d0), P(c, x1, y1, d1), P(c, x0, y1, d1)], fill, stroke, lw);
};
const floorGrid = (ctx: Ctx, c: Cam, tile: number, depth: number, colA: string, colB: string, diag = false, joint?: string) => {
  const [xa, xb] = visX(c, 1.6), dmax = Math.min(depth, c.z - 0.4);
  ctx.fillStyle = colA;
  const [, yb] = P(c, 0, 0, 0); ctx.fillRect(0, yb, VW, VH - yb);
  for (let d = 0; d < dmax; d += tile) {
    for (let x = Math.floor(xa / tile) * tile; x < xb; x += tile) {
      const i = Math.round(x / tile), j = Math.round(d / tile);
      if (diag) {
        if ((i + j) % 2 !== 0) continue;
        const cx = x + tile / 2, cd = d + tile / 2;
        poly(ctx, [P(c, cx, 0, cd - tile / 2), P(c, cx + tile / 2, 0, cd), P(c, cx, 0, cd + tile / 2), P(c, cx - tile / 2, 0, cd)], colB);
      } else if ((i + j) % 2 === 0) {
        poly(ctx, [P(c, x, 0, d), P(c, x + tile, 0, d), P(c, x + tile, 0, Math.min(d + tile, dmax)), P(c, x, 0, Math.min(d + tile, dmax))], colB);
      }
    }
  }
  if (joint) {
    for (let x = Math.floor(xa / tile) * tile; x < xb; x += tile) line3(ctx, c, [[x, 0, 0], [x, 0, dmax]], joint, 1);
    for (let d = 0; d < dmax; d += tile) line3(ctx, c, [[xa, 0, d], [xb, 0, d]], joint, 1);
  }
};

// ───────────── the halls
// heights are chosen so the ceiling zone (vault, coffers, glass, track lights) is in frame in every close shot
export const drawGothic = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, [xa, xb] = visX(c), BAY = 4.5, SPR = 4.3, HV = 8.6, D = 10;
  const prof = (u: number): [number, number] => [SPR + (HV - SPR) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 1.7)), 0.55), u * D];
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (let k = 0; k < 16; k++) for (let x = Math.floor(xa / BAY) * BAY; x < xb; x += BAY)
      vaultQuad(ctx, c, x, x + BAY, prof, k / 16, (k + 1) / 16, (k + Math.round(x / BAY)) % 2 ? p.ceil : p.wall2);
    for (let x = Math.floor(xa / BAY) * BAY; x < xb + BAY; x += BAY) {   // transverse + diagonal ribs converge on bosses
      const pts: [number, number, number][] = [], d1: [number, number, number][] = [], d2: [number, number, number][] = [];
      for (let k = 0; k <= 30; k++) { const u = k / 30, [y, d] = prof(u); if (d > c.z - 0.4) break; pts.push([x, y, d]); d1.push([x + u * BAY, y, d]); d2.push([x + BAY - u * BAY, y, d]); }
      line3(ctx, c, pts, p.rib, Math.max(3, 0.16 * c.s)); line3(ctx, c, d1, p.rib, Math.max(2, 0.1 * c.s)); line3(ctx, c, d2, p.rib, Math.max(2, 0.1 * c.s));
    }
  }
  wallRect(ctx, c, xa, xb, 0, SPR + 0.01, p.wall);
  for (let x = Math.floor(xa / BAY) * BAY - BAY; x < xb + BAY; x += BAY) {
    for (let r = 0; r < 10; r++) for (let q = 0; q < 5; q++) {           // ashlar
      const y = r * 0.45, xx = x + q * 0.9 + (r % 2) * 0.45;
      wallRect(ctx, c, xx, xx + 0.88, y, y + 0.43, hash2(r, Math.round(xx * 3)) > 0.5 ? p.wall : p.wall2);
    }
    const cx = x + BAY / 2, w = 0.95, y0 = 1.3, y1 = 3.3, ytop = 4.05;   // a lancet window with stained glass
    const arch = (ww: number, yy1: number, yt: number) => {
      const pts: [number, number][] = [P(c, cx - ww, y0), P(c, cx - ww, yy1)];
      for (let k = 0; k <= 12; k++) { const a = k / 12; pts.push(P(c, cx - ww + ww * Math.sin(a * Math.PI / 2), yy1 + (yt - yy1) * Math.sin(a * Math.PI / 2) ** 0.8)); }
      for (let k = 12; k >= 0; k--) { const a = k / 12; pts.push(P(c, cx + ww - ww * Math.sin(a * Math.PI / 2), yy1 + (yt - yy1) * Math.sin(a * Math.PI / 2) ** 0.8)); }
      pts.push(P(c, cx + ww, y0)); return pts;
    };
    poly(ctx, arch(w + 0.22, y1, ytop + 0.22), p.joint);
    poly(ctx, arch(w, y1, ytop), p.glassA);
    ctx.save(); poly(ctx, arch(w, y1, ytop)); ctx.clip();
    for (let r = 0; r < 8; r++) for (let q = 0; q < 4; q++) {
      const g = [p.glassA, p.glassB, p.glassC, p.glassA][Math.floor(hash2(r + x, q) * 4)];
      wallRect(ctx, c, cx - w + q * (w / 2) + 0.03, cx - w + (q + 1) * (w / 2) - 0.03, y0 + r * 0.36 + 0.03, y0 + (r + 1) * 0.36 - 0.03, g);
    }
    ctx.restore();
    wallRect(ctx, c, x - 0.4, x + 0.4, 0, SPR + 0.4, p.wall2);              // clustered pier
    for (const dx of [-0.26, 0, 0.26]) wallRect(ctx, c, x + dx - 0.07, x + dx + 0.07, 0, SPR + 0.4, p.joint);
  }
  floorGrid(ctx, c, 1.2, 9, p.floor, p.floor2);
};

export const drawPalace = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), BAY = 6, COR = 4.3, D = 10;
  const V0 = COR + 0.5, prof = (u: number): [number, number] => { const a = u * Math.PI; return [V0 + (D / 2) * Math.sin(a) * 0.8, (D / 2) * (1 - Math.cos(a))]; };
  if (!o.noCeil) {                                                    // a painted, coffered vault: gilt ribs, sky panels
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    const NU = 16;
    for (let k = 0; k < NU; k++) {
      const kb = clamp01(b * 1.6 - k * 0.04);
      for (let x = Math.floor(xa / 1.5) * 1.5; x < xb; x += 1.5) {
        const sky = (Math.round(x / 1.5) % 4 === 0) && k % 4 === 1;
        vaultQuad(ctx, c, x, x + 1.5, prof, k / NU, (k + 1) / NU, p.gold2);
        vaultQuad(ctx, c, x + 0.07, x + 1.43, prof, (k + 0.07) / NU, (k + 0.93) / NU, kb > 0 ? (sky ? p.sky : p.coffer) : p.ceil);
        if (kb > 0.5 && !sky) { const [y, d] = prof((k + 0.5) / NU); if (d < c.z - 0.5) { const [X, Y] = P(c, x + 0.75, y, d); ctx.fillStyle = p.rosette; ctx.beginPath(); ctx.arc(X, Y, 0.17 * K(c, d), 0, Math.PI * 2); ctx.fill(); } }
      }
    }
  }
  wallRect(ctx, c, xa, xb, 0, V0, p.wall);
  for (let x = Math.floor(xa / 0.6) * 0.6; x < xb; x += 0.6)            // damask lozenges
    for (let y = 1.25; y < COR - 0.3; y += 0.6) {
      const cx = x + ((Math.round(y / 0.6) % 2) * 0.3), cy = y + 0.3;
      poly(ctx, [P(c, cx, cy + 0.2), P(c, cx + 0.12, cy), P(c, cx, cy - 0.2), P(c, cx - 0.12, cy)], p.damask);
    }
  wallRect(ctx, c, xa, xb, 0, 1.05, p.dado);
  wallRect(ctx, c, xa, xb, 1.0, 1.12, p.gold);
  for (let x = Math.floor(xa / 1.5) * 1.5; x < xb; x += 1.5) wallRect(ctx, c, x + 0.1, x + 1.4, 0.15, 0.9, p.dado2, 0, p.gold2, 1);
  wallRect(ctx, c, xa, xb, COR, COR + 0.14, p.gold);
  wallRect(ctx, c, xa, xb, COR + 0.14, COR + 0.34, p.gold2);
  for (let x = Math.floor(xa / 0.3) * 0.3; x < xb; x += 0.3) wallRect(ctx, c, x, x + 0.14, COR + 0.18, COR + 0.3, p.gold);   // dentils
  wallRect(ctx, c, xa, xb, COR + 0.34, V0, p.gold);
  for (let x = Math.floor(xa / BAY) * BAY - BAY; x < xb + BAY; x += BAY) {   // Corinthian pilasters rise from the floor
    const kb = outCubic(clamp01(b * 1.5 - ((x - xa) / (xb - xa + 1)) * 0.5));
    const top = lerp(0, COR, kb);
    if (top <= 0.01) continue;
    wallRect(ctx, c, x - 0.38, x + 0.38, 0, top, p.pil);
    for (const dx of [-0.22, -0.07, 0.07, 0.22]) wallRect(ctx, c, x + dx - 0.03, x + dx + 0.03, 1.3, Math.max(1.3, top - 0.6), p.pil2);   // flutes
    wallRect(ctx, c, x - 0.46, x + 0.46, 0, 1.15, p.pil2);
    if (kb > 0.95) {                                                  // the capital: gilded acanthus + volutes
      const y0 = COR - 0.58;
      wallRect(ctx, c, x - 0.46, x + 0.46, COR - 0.1, COR, p.gold);
      for (let row = 0; row < 2; row++) for (let k = 0; k < 4; k++) {
        const lx = x - 0.33 + k * 0.22 + row * 0.11, [X0, Y0] = P(c, lx - 0.1, y0 + row * 0.2), [X1, Y1] = P(c, lx + 0.1, y0 + row * 0.2 + 0.32);
        ctx.fillStyle = row ? p.gold : p.gold2; ctx.beginPath(); ctx.ellipse((X0 + X1) / 2, (Y0 + Y1) / 2, (X1 - X0) / 2, (Y0 - Y1) / 2, 0, 0, Math.PI * 2); ctx.fill();
      }
      for (const sgn of [-1, 1]) { const [X, Y] = P(c, x + sgn * 0.36, COR - 0.18); ctx.strokeStyle = p.gold; ctx.lineWidth = Math.max(1.5, 0.04 * c.s); ctx.beginPath(); ctx.arc(X, Y, 0.09 * c.s, 0, Math.PI * 1.6); ctx.stroke(); }
    }
  }
  floorGrid(ctx, c, 1.0, 9, p.floorA, p.floorB, true);
};

export const drawStation = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), BAY = 4, OFF = 1, ENT = 4.3, D = 12;
  const V0 = ENT + 0.45, prof = (u: number): [number, number] => { const a = u * Math.PI; return [V0 + 5.2 * Math.sin(a), (D / 2) * (1 - Math.cos(a))]; };
  if (!o.noCeil) {                                                    // a fully glazed iron vault (Gare Saint-Lazare, Orsay)
    ctx.fillStyle = p.light; ctx.fillRect(0, 0, VW, VH);
    const NU = 20;
    for (let k = 0; k < NU; k++) for (let x = Math.floor(xa / 1) * 1; x < xb; x += 1)
      vaultQuad(ctx, c, x + 0.03, x + 0.97, prof, k / NU + 0.004, (k + 1) / NU - 0.004, hash2(k, x) > 0.82 ? p.glass2 : p.glass);
    for (let k = 1; k < NU; k++) {                                    // purlins along the hall
      const pts: [number, number, number][] = []; const [y, d] = prof(k / NU); if (d > c.z - 0.4) continue;
      pts.push([xa, y, d], [xb, y, d]); line3(ctx, c, pts, p.rib, Math.max(1, 0.03 * K(c, d)));
    }
    for (let x = Math.floor(xa / 2) * 2 + OFF; x < xb + 2; x += 2) {   // iron ribs grow from the springing to the crown
      const pts: [number, number, number][] = [];
      const n = Math.round(30 * clamp01(b * 1.4 - 0.1 * ((x - xa) / (xb - xa + 1))));
      for (let k = 0; k <= n; k++) { const [y, d] = prof(k / 30); if (d > c.z - 0.4) break; pts.push([x, y, d]); }
      if (pts.length > 1) { line3(ctx, c, pts, p.rib, Math.max(3, 0.14 * c.s)); line3(ctx, c, pts.map(([X, Y, Dd]) => [X + 0.09, Y - 0.05, Dd]), "#5D707A", Math.max(1, 0.03 * c.s)); }
    }
  }
  wallRect(ctx, c, xa, xb, 0, V0, p.wall);
  for (let y = 0.4; y < 1.3; y += 0.4) wallRect(ctx, c, xa, xb, y - 0.03, y, p.joint);   // rusticated base
  wallRect(ctx, c, xa, xb, ENT, V0, p.wall2);                                         // entablature + frieze
  wallRect(ctx, c, xa, xb, ENT - 0.07, ENT, p.joint); wallRect(ctx, c, xa, xb, V0 - 0.08, V0, p.joint);
  for (let x = Math.floor(xa / 0.5) * 0.5; x < xb; x += 0.5) wallRect(ctx, c, x, x + 0.06, ENT + 0.08, V0 - 0.12, p.joint);
  for (let x = Math.floor(xa / BAY) * BAY - BAY + OFF; x < xb + BAY; x += BAY) {
    const cx = x + BAY / 2, R = (BAY - 0.9) / 2, spring0 = 2.75;
    const arc: [number, number][] = [P(c, cx - R, 1.3)];
    for (let k = 0; k <= 24; k++) { const a = Math.PI - (k / 24) * Math.PI; arc.push(P(c, cx + R * Math.cos(a), spring0 + R * Math.sin(a) * 0.85)); }
    arc.push(P(c, cx + R, 1.3));
    poly(ctx, arc, p.arch);
    wallRect(ctx, c, x - 0.45, x + 0.45, 0, ENT, p.wall2);                  // piers
    wallRect(ctx, c, x - 0.45, x - 0.39, 0, ENT, p.joint); wallRect(ctx, c, x + 0.39, x + 0.45, 0, ENT, p.joint);
    wallRect(ctx, c, x - 0.55, x + 0.55, spring0 - 0.2, spring0, p.joint);
    for (let k = 0; k < 9; k++) {                                         // voussoirs + keystone
      const a = Math.PI - ((k + 0.5) / 9) * Math.PI, r1 = R + 0.04, r2 = R + (k === 4 ? 0.5 : 0.36);
      const q: [number, number][] = [P(c, cx + r1 * Math.cos(a - 0.16), spring0 + r1 * Math.sin(a - 0.16) * 0.85), P(c, cx + r2 * Math.cos(a - 0.16), spring0 + r2 * Math.sin(a - 0.16) * 0.85), P(c, cx + r2 * Math.cos(a + 0.16), spring0 + r2 * Math.sin(a + 0.16) * 0.85), P(c, cx + r1 * Math.cos(a + 0.16), spring0 + r1 * Math.sin(a + 0.16) * 0.85)];
      poly(ctx, q, k % 2 ? p.wall2 : p.wall, p.joint, 1);
    }
  }
  // the giant station clocks hang in the empty bays (they rebuild last)
  const kc = outBack(clamp01(b * 1.8 - 0.8), 1.4);
  if (kc > 0) for (const cx of [-29, -13]) {
    const [X, Y] = P(c, cx, 3.05), r = 0.72 * c.s * kc;
    if (X < -r || X > VW + r) continue;
    ctx.fillStyle = p.gold; ctx.beginPath(); ctx.arc(X, Y, r * 1.14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.clock; ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.rib; ctx.lineWidth = Math.max(1, r * 0.03);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * r * 0.76, Y + Math.sin(a) * r * 0.76); ctx.lineTo(X + Math.cos(a) * r * 0.92, Y + Math.sin(a) * r * 0.92); ctx.stroke(); }
    const hm = o.t * 0.02, mm = o.t * 0.25;
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.sin(2.2 + hm) * r * 0.5, Y - Math.cos(2.2 + hm) * r * 0.5); ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.sin(0.4 + mm) * r * 0.75, Y - Math.cos(0.4 + mm) * r * 0.75); ctx.stroke();
  }
  floorGrid(ctx, c, 1.5, 11, p.floor, p.floor2, false);
  // cast-iron columns stand in front of the piers (parallax against the wall when the camera trucks)
  for (let x = Math.floor(xa / (2 * BAY)) * 2 * BAY - 2 * BAY + OFF; x < xb + 2 * BAY; x += 2 * BAY) {
    const d = 0.9, kb = clamp01(b * 1.6 - 0.2), top = lerp(0, V0 + 0.3, outCubic(kb));
    if (top <= 0) continue;
    const [X0, Y0] = P(c, x - 0.12, top, d), [X1, Y1] = P(c, x + 0.12, 0, d), k = K(c, d);
    const g = ctx.createLinearGradient(X0, 0, X1, 0); g.addColorStop(0, p.rib); g.addColorStop(0.35, "#6E8088"); g.addColorStop(1, "#1E262A");
    ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    ctx.fillStyle = p.rib; ctx.fillRect(X0 - 0.12 * k, Y1 - 0.5 * k, (X1 - X0) + 0.24 * k, 0.5 * k);
    if (kb > 0.9) {
      ctx.fillRect(X0 - 0.16 * k, Y0 - 0.1 * k, (X1 - X0) + 0.32 * k, 0.28 * k);
      ctx.strokeStyle = p.rib; ctx.lineWidth = Math.max(1.5, 0.05 * k);
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo((X0 + X1) / 2, Y0 + 0.2 * k); ctx.bezierCurveTo((X0 + X1) / 2 + sgn * 0.6 * k, Y0 + 0.3 * k, (X0 + X1) / 2 + sgn * 0.9 * k, Y0 - 0.2 * k, (X0 + X1) / 2 + sgn * 1.3 * k, Y0 - 0.25 * k); ctx.stroke();
        ctx.beginPath(); ctx.arc((X0 + X1) / 2 + sgn * 0.45 * k, Y0 + 0.12 * k, 0.12 * k, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
};

export const drawCube = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), CEIL = 3.9;
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (const dd of [0.85, 2.3]) {                                       // black track rails; spots on stems click on in turn
      line3(ctx, c, [[xa, CEIL - 0.04, dd], [xb, CEIL - 0.04, dd]], p.rail, Math.max(2, 0.045 * K(c, dd)));
      for (let x = Math.floor(xa / 1.2) * 1.2; x < xb; x += 1.2) {
        const on = clamp01(b * 4 - (hash(x * 3.1 + dd) * 2));
        const [X, Y] = P(c, x, CEIL - 0.04, dd), k = K(c, dd);
        ctx.strokeStyle = p.rail; ctx.lineWidth = Math.max(1, 0.015 * k); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X, Y + 0.12 * k); ctx.stroke();
        ctx.save(); ctx.translate(X, Y + 0.12 * k); ctx.rotate(-0.85);
        ctx.fillStyle = p.rail; ctx.fillRect(-0.045 * k, -0.02 * k, 0.09 * k, 0.2 * k);
        if (on > 0) { ctx.fillStyle = `rgba(255,248,225,${0.85 * on})`; ctx.beginPath(); ctx.ellipse(0, 0.19 * k, 0.04 * k, 0.012 * k, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      }
    }
  }
  const g = ctx.createLinearGradient(0, P(c, 0, CEIL)[1], 0, P(c, 0, 0)[1]);
  g.addColorStop(0, p.wall2); g.addColorStop(0.3, p.wall); g.addColorStop(1, p.wall);
  wallRect(ctx, c, xa, xb, 0, CEIL, g);
  wallRect(ctx, c, xa, xb, 0, 0.06, p.skirt);
  for (const w of J.works) {                                             // light pools + wall labels
    if (w.x < xa - 3 || w.x > xb + 3 || w.x < 0 || w.x > 30) continue;
    const [X, Y] = P(c, w.x, w.y + 0.2), k = c.s, on = clamp01(b * 3 - 0.6);
    const rg = ctx.createRadialGradient(X, Y - 0.4 * k, 0.1 * k, X, Y, 2.0 * k);
    rg.addColorStop(0, `rgba(255,253,244,${0.85 * on})`); rg.addColorStop(0.55, `rgba(255,252,238,${0.35 * on})`); rg.addColorStop(1, "rgba(255,252,238,0)");
    ctx.fillStyle = rg; ctx.fillRect(X - 2.2 * k, Y - 2.4 * k, 4.4 * k, 4.8 * k);
    if (w.frame !== "plinth") {
      const [lx, ly] = P(c, w.x + w.w / 2 + 0.25, 1.62), lw = 0.26 * k, lh = 0.16 * k;
      ctx.fillStyle = "#FBFAF7"; ctx.fillRect(lx, ly, lw, lh); ctx.fillStyle = "rgba(0,0,0,0.5)";
      for (let i = 0; i < 4; i++) ctx.fillRect(lx + 0.03 * k, ly + 0.03 * k + i * 0.03 * k, (i === 0 ? 0.16 : 0.2 - i * 0.02) * k, Math.max(1, 0.008 * k));
    }
  }
  const [, yb] = P(c, 0, 0, 0);
  const fg = ctx.createLinearGradient(0, yb, 0, VH);
  fg.addColorStop(0, p.floor2); fg.addColorStop(0.18, p.floor); fg.addColorStop(1, p.floor2);
  ctx.fillStyle = fg; ctx.fillRect(0, yb, VW, VH - yb);
  ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fillRect(0, yb, VW, Math.min(60, (VH - yb) * 0.3));   // polished-concrete sheen
  for (let x = Math.floor(xa / 3) * 3; x < xb; x += 3) line3(ctx, c, [[x, 0, 0], [x, 0, Math.min(9, c.z - 0.4)]], "rgba(0,0,0,0.06)", 1);
};

export const drawDesign = (ctx: Ctx, c: Cam, o: ArchOpts, pipes = 0) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), CEIL = 3.9;
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (let x = Math.floor(xa / 2.4) * 2.4; x < xb; x += 2.4) {        // exposed concrete beams
      const kb = clamp01(b * 2 - 0.3);
      if (kb <= 0) continue;
      const dd = Math.min(9, c.z - 0.4);
      poly(ctx, [P(c, x - 0.12, CEIL, 0), P(c, x + 0.12, CEIL, 0), P(c, x + 0.12, CEIL, dd), P(c, x - 0.12, CEIL, dd)], p.beam);
      poly(ctx, [P(c, x - 0.12, CEIL, 0), P(c, x - 0.12, CEIL - 0.25, 0), P(c, x - 0.12, CEIL - 0.25, dd), P(c, x - 0.12, CEIL, dd)], p.wall);
    }
  }
  // the glass curtain wall: panes slide in on the grid; outside, sky, birches and the flat-roofed wing across the court
  const g = ctx.createLinearGradient(0, P(c, 0, CEIL)[1], 0, P(c, 0, 0)[1]);
  g.addColorStop(0, p.sky); g.addColorStop(1, p.glass);
  wallRect(ctx, c, xa, xb, 0, CEIL, g);
  for (let x = Math.floor(xa / 9) * 9; x < xb + 9; x += 9) {
    wallRect(ctx, c, x + 1.5, x + 7.5, 0.4, 2.6, "#E9E7E1"); wallRect(ctx, c, x + 1.5, x + 7.5, 2.45, 2.6, "#C9C6BF");
    for (let i = 0; i < 6; i++) wallRect(ctx, c, x + 1.8 + i * 0.95, x + 2.4 + i * 0.95, 1.1, 2.1, "#8FA6B2");
    for (const tx of [x + 0.6, x + 8.2]) { const [X, Y] = P(c, tx, 2.3), r = 0.55 * c.s; ctx.fillStyle = "#7E9B6A"; ctx.beginPath(); ctx.ellipse(X, Y, r * 0.7, r, 0, 0, Math.PI * 2); ctx.fill(); wallRect(ctx, c, tx - 0.04, tx + 0.04, 0.4, 2.0, "#EDEBE4"); }
  }
  const PW = 1.2, PH = 0.7;
  for (let x = Math.floor(xa / PW) * PW; x < xb; x += PW) for (let y = 0.4; y < CEIL - 0.1; y += PH) {
    const i = Math.round(x / PW), j = Math.round(y / PH), delay = (j * 0.08 + ((i % 6) / 6) * 0.25);
    const k = outCubic(clamp01((b - delay) * 3));
    if (k >= 1) continue;
    const slide = (1 - k) * (j % 2 ? 1 : -1) * PW;
    wallRect(ctx, c, x + slide, x + PW + slide, y, y + PH, p.wall);
  }
  const mw = Math.max(0.02, 2.2 / c.s);
  for (let x = Math.floor(xa / PW) * PW; x < xb; x += PW) wallRect(ctx, c, x - mw, x + mw, 0.4, CEIL, p.mull);
  for (let y = 0.4; y < CEIL; y += PH) wallRect(ctx, c, xa, xb, y - mw * 0.8, y + mw * 0.8, p.mull);
  wallRect(ctx, c, xa, xb, 0, 0.4, p.mull);
  for (const w of J.works) {                                             // free-standing white display panels
    if (w.x < 30 || w.x > xb + 3 || w.x < xa - 3) continue;
    const kp = outBack(clamp01(b * 2 - 0.9), 1.2);
    wallRect(ctx, c, w.x - 1.15, w.x + 1.15, 0, lerp(0, 3.5, kp), "#F7F6F2", 0.3, p.mull, 1.5);
    wallRect(ctx, c, w.x - 1.15, w.x - 1.05, 0, lerp(0, 3.5, kp), [p.red, p.yellow, p.blue][Math.round(w.x) % 3], 0.3);
  }
  for (let x = Math.floor(xa / 8) * 8 + 4; x < xb + 8; x += 8) wallRect(ctx, c, x - 0.16, x + 0.16, 0, CEIL, p.red, 0.6);
  wallRect(ctx, c, xa, xb, CEIL - 0.22, CEIL - 0.12, p.yellow);
  const [, yb] = P(c, 0, 0, 0);
  ctx.fillStyle = p.floor; ctx.fillRect(0, yb, VW, VH - yb);
  for (let d = 0; d < Math.min(9, c.z - 0.4); d += 1.2) line3(ctx, c, [[xa, 0, d], [xb, 0, d]], p.floor2, 1.2);
  for (let x = Math.floor(xa / 1.2) * 1.2; x < xb; x += 1.2) line3(ctx, c, [[x, 0, 0], [x, 0, Math.min(9, c.z - 0.4)]], p.floor2, 1.2);
  if (pipes > 0) drawPipes(ctx, c, p, pipes);
};
// high-tech: colour-coded services burst out over the walls (blue air, green water, yellow electricity, red circulation)
const drawPipes = (ctx: Ctx, c: Cam, p: Pal, k: number) => {
  const [xa, xb] = visX(c), cols = [p.blue, p.green ?? "#2E9B57", p.yellow, p.red];
  cols.forEach((col, i) => {
    const y = 3.55 - i * 0.4, d = 0.35 + i * 0.12, r = 0.16 - i * 0.015;
    const x1 = lerp(xa, xb, clamp01(k * 1.6 - i * 0.15));
    if (x1 <= xa) return;
    const [X0, Y0] = P(c, xa, y, d), [X1] = P(c, x1, y, d), R = r * K(c, d);
    const gg = ctx.createLinearGradient(0, Y0 - R, 0, Y0 + R); gg.addColorStop(0, col); gg.addColorStop(0.35, "#FFFFFF"); gg.addColorStop(0.5, col); gg.addColorStop(1, "#000000");
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.fillRect(X0, Y0 - R, X1 - X0, 2 * R);
    ctx.globalAlpha = 0.35; ctx.fillStyle = gg; ctx.fillRect(X0, Y0 - R, X1 - X0, 2 * R); ctx.globalAlpha = 1;
    for (let x = Math.ceil(xa / 2) * 2 + i * 0.5; x < x1; x += 2) { const [X] = P(c, x, y, d); ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(X - 0.04 * K(c, d), Y0 - R * 1.25, 0.08 * K(c, d), R * 2.5); }
    for (let x = Math.ceil(xa / 6) * 6 + i * 1.3; x < x1; x += 6) {   // drops to the floor
      const [Xd, Yd] = P(c, x, y, d), [, Yf] = P(c, x, 0, d);
      ctx.fillStyle = col; ctx.fillRect(Xd - R * 0.8, Yd, R * 1.6, Yf - Yd);
    }
  });
};

export const ARCH: Record<string, (ctx: Ctx, c: Cam, o: ArchOpts) => void> = {
  gothic: drawGothic, palace: drawPalace, station: drawStation, cube: drawCube, design: drawDesign,
  hightech: (ctx, c, o) => drawDesign(ctx, c, o, o.build),
};

// ───────────── artworks: frames are architecture (stylised); canvases are drawn crisp afterwards
export type Work = (typeof J.works)[number];
export const workRect = (c: Cam, w: Work, aspect: number, t: number): { x: number; y: number; w: number; h: number; rot: number } => {
  const hh = w.w / aspect, [X0, Y0] = P(c, w.x - w.w / 2, w.y + hh / 2), [X1, Y1] = P(c, w.x + w.w / 2, w.y - hh / 2);
  // frame wobble: a small damped swing after the camera lands near it
  let rot = 0;
  for (const k of J.cam as { t: number; x: number }[]) if (Math.abs(k.x - w.x) < 2 && t > k.t && t < k.t + 1.5) rot = 0.012 * Math.sin((t - k.t) * 12) * Math.exp(-(t - k.t) * 3.5) * (hash(w.x) > 0.5 ? 1 : -1);
  return { x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0, rot };
};
export const drawFrame = (ctx: Ctx, r: { x: number; y: number; w: number; h: number; rot: number }, kind: string, s: number, gold = "#C99A3B", gold2 = "#7E5A1C") => {
  ctx.save(); ctx.translate(r.x + r.w / 2, r.y + r.h / 2); ctx.rotate(r.rot);
  const W = r.w, H = r.h;
  ctx.fillStyle = "rgba(0,0,0,0.28)"; ctx.fillRect(-W / 2 + 0.05 * s, -H / 2 + 0.07 * s, W, H);                // shadow
  if (kind === "gilt") {
    const m = 0.16 * s;
    const g = ctx.createLinearGradient(-W / 2 - m, -H / 2 - m, W / 2 + m, H / 2 + m);
    g.addColorStop(0, "#F3D98A"); g.addColorStop(0.3, gold); g.addColorStop(0.6, gold2); g.addColorStop(1, gold);
    ctx.fillStyle = g; ctx.fillRect(-W / 2 - m, -H / 2 - m, W + 2 * m, H + 2 * m);
    ctx.strokeStyle = gold2; ctx.lineWidth = Math.max(1, 0.025 * s); ctx.strokeRect(-W / 2 - m * 0.55, -H / 2 - m * 0.55, W + m * 1.1, H + m * 1.1);
    for (let k = 0; k < 4; k++) { const cx = (k % 2 ? 1 : -1) * (W / 2 + m * 0.5), cy = (k < 2 ? -1 : 1) * (H / 2 + m * 0.5); ctx.fillStyle = "#F3D98A"; ctx.beginPath(); ctx.arc(cx, cy, m * 0.42, 0, Math.PI * 2); ctx.fill(); }
  } else if (kind === "plain") {
    const m = 0.05 * s; ctx.fillStyle = "#1B1A18"; ctx.fillRect(-W / 2 - m, -H / 2 - m, W + 2 * m, H + 2 * m);
  }
  ctx.fillStyle = "#3B3530"; ctx.fillRect(-W / 2, -H / 2, W, H);
  ctx.restore();
};

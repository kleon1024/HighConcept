// The gallery as a tiny 3-D world: a pinhole camera faces the long wall (d = 0) and trucks along it (x, metres).
// Each hall is drawn as wall elevation + ceiling/vault + floor in one-point perspective; `build` (0..1) animates the
// architecture "rebuilding" during a morph. Colours come from a palette so the vector styles can recolour it.
import J from "./artdate.json";
import { clamp01, hash, hash2, lerp, outBack, outCubic, range, sampleKeys, smooth, spring, VH, VW } from "./motion";

export type Cam = { x: number; s: number; z: number; h: number; yh: number; f: number; vx: number; vs: number };
const camRaw = (t: number) => {
  const c = sampleKeys(J.cam as never, t, ["x", "s", "z", "h", "yh"], ["s"]);
  return { x: c.x, s: c.s, z: c.z, h: c.h, yh: c.yh };
};
export const camAt = (t: number): Cam => {
  const c = camRaw(t), a = camRaw(t - 1 / 60), b = camRaw(t + 1 / 60);
  return { ...c, f: c.s * c.z, vx: ((b.x - a.x) * 30) * c.s, vs: (Math.log(b.s) - Math.log(a.s)) * 30 };
};
// project world (x, y up, d toward camera) → screen
export const P = (c: Cam, x: number, y: number, d = 0): [number, number] => {
  const k = c.f / Math.max(0.05, c.z - d);
  return [VW / 2 + k * (x - c.x), c.yh - k * (y - c.h)];
};
export const K = (c: Cam, d = 0) => c.f / Math.max(0.05, c.z - d);
export const visX = (c: Cam, m = 1.15) => [c.x - (VW / 2 / c.s) * m - 1, c.x + (VW / 2 / c.s) * m + 1] as const;

type Ctx = CanvasRenderingContext2D;
export const poly = (ctx: Ctx, pts: [number, number][], fill?: string | CanvasGradient | CanvasPattern, stroke?: string, lw = 1) => {
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
};
const wallRect = (ctx: Ctx, c: Cam, x0: number, x1: number, y0: number, y1: number, fill: string | CanvasGradient, d = 0, stroke?: string, lw = 1) => {
  const [a, b] = P(c, x0, y1, d), [e, g] = P(c, x1, y0, d);
  ctx.fillStyle = fill; ctx.fillRect(a, b, e - a, g - b);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.strokeRect(a, b, e - a, g - b); }
};
const line3 = (ctx: Ctx, c: Cam, pts: [number, number, number][], stroke: string, lw: number) => {
  ctx.beginPath(); pts.forEach(([x, y, d], i) => { const [X, Y] = P(c, x, y, d); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
};

// ───────────── palettes (natural colours; vector styles pass their own)
export type Pal = Record<string, string>;
export const PAL: Record<string, Pal> = {
  gothic: { wall: "#8E8A80", wall2: "#77736A", joint: "#5F5B53", floor: "#6B675F", floor2: "#5A564E", ceil: "#7C786F", rib: "#4E4A43", glassA: "#2F4FA0", glassB: "#A3283A", glassC: "#D7A93A", light: "#F3E2B0" },
  palace: { wall: "#7E1E24", wall2: "#6A161C", damask: "#93303A", dado: "#2F2A22", dado2: "#4A3F31", pil: "#E8DCC4", pil2: "#C9B99A", gold: "#C99A3B", gold2: "#8E6A22", ceil: "#E9DFC8", coffer: "#C8B48A", rosette: "#C99A3B", floorA: "#E6DED0", floorB: "#2B2622", light: "#FFE7B0" },
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
export const drawGothic = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, [xa, xb] = visX(c), BAY = 5, SPR = 5.2, HV = 9.5, D = 10;
  // pointed vault profile
  const prof = (u: number): [number, number] => [SPR + (HV - SPR) * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * u - 1), 1.7)), 0.55), u * D];
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (let k = 0; k < 14; k++) vaultQuad(ctx, c, xa, xb, prof, k / 14, (k + 1) / 14, k % 2 ? p.ceil : p.wall2);
    for (let x = Math.floor(xa / BAY) * BAY; x < xb + BAY; x += BAY) {   // transverse + diagonal ribs
      const pts: [number, number, number][] = [], diag1: [number, number, number][] = [], diag2: [number, number, number][] = [];
      for (let k = 0; k <= 24; k++) { const u = k / 24, [y, d] = prof(u); if (d > c.z - 0.4) break; pts.push([x, y, d]); diag1.push([x + u * BAY, y, d]); diag2.push([x + BAY - u * BAY, y, d]); }
      line3(ctx, c, pts, p.rib, 7); line3(ctx, c, diag1, p.rib, 4); line3(ctx, c, diag2, p.rib, 4);
    }
  }
  wallRect(ctx, c, xa, xb, 0, SPR + 0.01, p.wall);
  for (let x = Math.floor(xa / BAY) * BAY - BAY; x < xb + BAY; x += BAY) {
    for (let r = 0; r < 12; r++) for (let q = 0; q < 6; q++) {           // ashlar joints
      const y = r * 0.45, xx = x + q * 0.9 + (r % 2) * 0.45;
      wallRect(ctx, c, xx, xx + 0.88, y, y + 0.43, hash2(r, Math.round(xx * 3)) > 0.5 ? p.wall : p.wall2);
    }
    const cx = x + BAY / 2, w = 1.1, y0 = 1.6, y1 = 4.3, ytop = 5.0;     // a lancet window with stained glass
    const arch = (ww: number, yy1: number, yt: number) => {
      const pts: [number, number][] = [P(c, cx - ww, y0), P(c, cx - ww, yy1)];
      for (let k = 0; k <= 10; k++) { const a = k / 10; pts.push(P(c, cx - ww + ww * Math.sin(a * Math.PI / 2) * 1.0, yy1 + (yt - yy1) * Math.sin(a * Math.PI / 2) ** 0.8)); }
      for (let k = 10; k >= 0; k--) { const a = k / 10; pts.push(P(c, cx + ww - ww * Math.sin(a * Math.PI / 2) * 1.0, yy1 + (yt - yy1) * Math.sin(a * Math.PI / 2) ** 0.8)); }
      pts.push(P(c, cx + ww, y0)); return pts;
    };
    poly(ctx, arch(w + 0.25, y1, ytop + 0.25), p.joint);
    poly(ctx, arch(w, y1, ytop), p.glassA);
    for (let r = 0; r < 7; r++) for (let q = 0; q < 3; q++) {
      const g = [p.glassA, p.glassB, p.glassC][Math.floor(hash2(r + x, q) * 3)];
      wallRect(ctx, c, cx - w + q * (2 * w / 3) + 0.05, cx - w + (q + 1) * (2 * w / 3) - 0.05, y0 + r * 0.4 + 0.05, y0 + (r + 1) * 0.4 - 0.05, g);
    }
    wallRect(ctx, c, x - 0.35, x + 0.35, 0, SPR + 0.3, p.wall2);               // clustered pier
    for (const dx of [-0.24, 0, 0.24]) wallRect(ctx, c, x + dx - 0.08, x + dx + 0.08, 0, SPR + 0.3, p.joint);
  }
  floorGrid(ctx, c, 1.2, 9, p.floor, p.floor2);
};

export const drawPalace = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), BAY = 6, COR = 4.7, D = 10;
  const prof = (u: number): [number, number] => { const a = u * Math.PI; return [COR + 0.6 + (D / 2) * Math.sin(a) * 0.9, (D / 2) * (1 - Math.cos(a))]; };
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    const NU = 16;
    for (let k = 0; k < NU; k++) {                                   // coffers drop in row by row during the rebuild
      const kb = clamp01(b * 1.6 - k * 0.04);
      for (let x = Math.floor(xa / 1.5) * 1.5; x < xb; x += 1.5) {
        vaultQuad(ctx, c, x + 0.08, x + 1.42, prof, (k + 0.12) / NU, (k + 0.88) / NU, kb > 0 ? p.coffer : p.ceil);
        if (kb > 0.5) { const [y, d] = prof((k + 0.5) / NU); if (d < c.z - 0.5) { const [X, Y] = P(c, x + 0.75, y, d); ctx.fillStyle = p.rosette; ctx.beginPath(); ctx.arc(X, Y, 0.16 * K(c, d), 0, Math.PI * 2); ctx.fill(); } }
      }
    }
  }
  // cornice (gilded) and wall
  wallRect(ctx, c, xa, xb, 0, COR + 0.6, p.wall);
  for (let x = Math.floor(xa / 0.6) * 0.6; x < xb; x += 0.6)            // damask lozenges
    for (let y = 1.2; y < COR - 0.2; y += 0.7) {
      const cx = x + ((Math.round(y / 0.7) % 2) * 0.3), cy = y + 0.35;
      poly(ctx, [P(c, cx, cy + 0.22), P(c, cx + 0.14, cy), P(c, cx, cy - 0.22), P(c, cx - 0.14, cy)], p.damask);
    }
  wallRect(ctx, c, xa, xb, 0, 1.05, p.dado);
  wallRect(ctx, c, xa, xb, 1.0, 1.12, p.gold);
  for (let x = Math.floor(xa / 1.5) * 1.5; x < xb; x += 1.5) wallRect(ctx, c, x + 0.1, x + 1.4, 0.15, 0.9, p.dado2, 0, p.gold2, 1);
  wallRect(ctx, c, xa, xb, COR, COR + 0.18, p.gold);
  wallRect(ctx, c, xa, xb, COR + 0.18, COR + 0.42, p.gold2);
  wallRect(ctx, c, xa, xb, COR + 0.42, COR + 0.6, p.gold);
  for (let x = Math.floor(xa / BAY) * BAY - BAY; x < xb + BAY; x += BAY) {   // Corinthian pilasters rise from the floor
    const kb = outCubic(clamp01(b * 1.5 - ((x - xa) / (xb - xa + 1)) * 0.5));
    const top = lerp(0, COR, kb);
    if (top <= 0.01) continue;
    wallRect(ctx, c, x - 0.42, x + 0.42, 0, top, p.pil);
    for (const dx of [-0.24, -0.08, 0.08, 0.24]) wallRect(ctx, c, x + dx - 0.035, x + dx + 0.035, 1.3, Math.max(1.3, top - 0.7), p.pil2);   // flutes
    wallRect(ctx, c, x - 0.5, x + 0.5, 0, 1.2, p.pil2);
    if (kb > 0.95) {                                                  // the capital: acanthus as gilded leaves
      const y0 = COR - 0.7;
      wallRect(ctx, c, x - 0.52, x + 0.52, y0 + 0.55, COR, p.gold);
      for (let k = 0; k < 5; k++) {
        const lx = x - 0.4 + k * 0.2, [X0, Y0] = P(c, lx, y0), [X1, Y1] = P(c, lx + 0.1, y0 + 0.55);
        ctx.fillStyle = p.gold; ctx.beginPath(); ctx.ellipse((X0 + X1) / 2, (Y0 + Y1) / 2, (X1 - X0) * 0.9, (Y0 - Y1) * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = p.gold2; ctx.lineWidth = 1; ctx.stroke();
      }
      for (const s of [-1, 1]) { const [X, Y] = P(c, x + s * 0.4, COR - 0.12); ctx.fillStyle = p.gold2; ctx.beginPath(); ctx.arc(X, Y, 0.09 * c.s, 0, Math.PI * 2); ctx.fill(); }   // volutes
    }
  }
  floorGrid(ctx, c, 1.0, 9, p.floorA, p.floorB, true);
};

export const drawStation = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), BAY = 4, ENT = 6.2, D = 12, OFF = 1;
  const prof = (u: number): [number, number] => { const a = u * Math.PI; return [ENT + 0.6 + 6.2 * Math.sin(a), (D / 2) * (1 - Math.cos(a))]; };
  if (!o.noCeil) {
    ctx.fillStyle = p.light; ctx.fillRect(0, 0, VW, VH);
    const NU = 18;
    for (let k = 0; k < NU; k++) {
      const u0 = k / NU, u1 = (k + 1) / NU, mid = Math.abs((u0 + u1) / 2 - 0.5) < 0.24;
      for (let x = Math.floor(xa / 1.5) * 1.5; x < xb; x += 1.5) {
        if (mid) vaultQuad(ctx, c, x + 0.04, x + 1.46, prof, u0 + 0.004, u1 - 0.004, hash2(k, x) > 0.5 ? p.glass : p.glass2);
        else {
          vaultQuad(ctx, c, x, x + 1.5, prof, u0, u1, p.ceil);
          vaultQuad(ctx, c, x + 0.16, x + 1.34, prof, u0 + 0.01, u1 - 0.01, p.coffer);
          const [y, d] = prof((u0 + u1) / 2);
          if (d < c.z - 0.5) { const [X, Y] = P(c, x + 0.75, y, d); ctx.fillStyle = p.rosette; ctx.beginPath(); ctx.arc(X, Y, 0.14 * K(c, d), 0, Math.PI * 2); ctx.fill(); }
        }
      }
    }
    for (let x = Math.floor(xa / 3) * 3; x < xb + 3; x += 3) {          // iron ribs grow from the springing to the crown
      const pts: [number, number, number][] = [];
      const n = Math.round(30 * clamp01(b * 1.4 - 0.1 * ((x - xa) / (xb - xa + 1))));
      for (let k = 0; k <= n; k++) { const [y, d] = prof(k / 30); if (d > c.z - 0.4) break; pts.push([x, y, d]); }
      if (pts.length > 1) line3(ctx, c, pts, p.rib, Math.max(2, 0.12 * c.s));
    }
  }
  wallRect(ctx, c, xa, xb, 0, ENT + 0.6, p.wall);
  for (let y = 0.4; y < 1.6; y += 0.4) wallRect(ctx, c, xa, xb, y - 0.03, y, p.joint);   // rusticated base
  wallRect(ctx, c, xa, xb, ENT, ENT + 0.6, p.wall2);
  wallRect(ctx, c, xa, xb, ENT - 0.08, ENT, p.joint);
  for (let x = Math.floor(xa / BAY) * BAY - BAY + OFF; x < xb + BAY; x += BAY) {
    const cx = x + BAY / 2, R = (BAY - 0.9) / 2, spring0 = 3.7;
    const arc: [number, number][] = [P(c, cx - R, 1.6)];
    for (let k = 0; k <= 24; k++) { const a = Math.PI - (k / 24) * Math.PI; arc.push(P(c, cx + R * Math.cos(a), spring0 + R * Math.sin(a) * 0.85)); }
    arc.push(P(c, cx + R, 1.6));
    poly(ctx, arc, p.arch);
    wallRect(ctx, c, x - 0.45, x + 0.45, 0, ENT, p.wall2);                 // piers
    wallRect(ctx, c, x - 0.45, x - 0.38, 0, ENT, p.joint); wallRect(ctx, c, x + 0.38, x + 0.45, 0, ENT, p.joint);
    wallRect(ctx, c, x - 0.6, x + 0.6, spring0 - 0.25, spring0, p.joint);
    for (let k = 0; k < 9; k++) {                                         // voussoirs
      const a = Math.PI - ((k + 0.5) / 9) * Math.PI, r1 = R + 0.05, r2 = R + 0.45;
      const q: [number, number][] = [P(c, cx + r1 * Math.cos(a - 0.15), spring0 + r1 * Math.sin(a - 0.15) * 0.85), P(c, cx + r2 * Math.cos(a - 0.15), spring0 + r2 * Math.sin(a - 0.15) * 0.85), P(c, cx + r2 * Math.cos(a + 0.15), spring0 + r2 * Math.sin(a + 0.15) * 0.85), P(c, cx + r1 * Math.cos(a + 0.15), spring0 + r1 * Math.sin(a + 0.15) * 0.85)];
      poly(ctx, q, k % 2 ? p.wall2 : p.wall, p.joint, 1);
    }
  }
  // the giant station clock in the arch at x = -16 (rebuilds last)
  const kc = outBack(clamp01(b * 1.8 - 0.8), 1.4);
  if (kc > 0) for (const cx of [-29, -17, -5]) {
    const [X, Y] = P(c, cx, 4.75), r = 0.8 * c.s * kc;
    if (X < -r || X > VW + r) continue;
    ctx.fillStyle = p.gold; ctx.beginPath(); ctx.arc(X, Y, r * 1.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.clock; ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.rib; ctx.lineWidth = Math.max(1, r * 0.03);
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * r * 0.78, Y + Math.sin(a) * r * 0.78); ctx.lineTo(X + Math.cos(a) * r * 0.92, Y + Math.sin(a) * r * 0.92); ctx.stroke(); }
    const hm = o.t * 0.02, mm = o.t * 0.25;                               // the hands creep (one real-time minute ≈ never)
    ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.sin(2.2 + hm) * r * 0.5, Y - Math.cos(2.2 + hm) * r * 0.5); ctx.stroke();
    ctx.lineWidth = Math.max(1, r * 0.035);
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + Math.sin(0.4 + mm) * r * 0.75, Y - Math.cos(0.4 + mm) * r * 0.75); ctx.stroke();
  }
  floorGrid(ctx, c, 1.5, 11, p.floor, p.floor2, false);
  // cast-iron columns stand in front of the piers (parallax against the wall when the camera trucks)
  for (let x = Math.floor(xa / (2 * BAY)) * 2 * BAY - 2 * BAY + OFF; x < xb + 2 * BAY; x += 2 * BAY) {
    const d = 0.9, kb = clamp01(b * 1.6 - 0.2), top = lerp(0, ENT - 0.2, outCubic(kb));
    if (top <= 0) continue;
    const [X0, Y0] = P(c, x - 0.13, top, d), [X1, Y1] = P(c, x + 0.13, 0, d), k = K(c, d);
    const g = ctx.createLinearGradient(X0, 0, X1, 0); g.addColorStop(0, p.rib); g.addColorStop(0.35, "#6E8088"); g.addColorStop(1, "#1E262A");
    ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
    ctx.fillStyle = p.rib; ctx.fillRect(X0 - 0.12 * k, Y1 - 0.5 * k, (X1 - X0) + 0.24 * k, 0.5 * k);          // base
    if (kb > 0.9) {                                                                                           // capital + curly brackets
      ctx.fillRect(X0 - 0.16 * k, Y0 - 0.1 * k, (X1 - X0) + 0.32 * k, 0.28 * k);
      ctx.strokeStyle = p.rib; ctx.lineWidth = Math.max(1.5, 0.05 * k);
      for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo((X0 + X1) / 2, Y0 + 0.2 * k); ctx.bezierCurveTo((X0 + X1) / 2 + sgn * 0.6 * k, Y0 + 0.3 * k, (X0 + X1) / 2 + sgn * 0.9 * k, Y0 - 0.2 * k, (X0 + X1) / 2 + sgn * 1.3 * k, Y0 - 0.25 * k); ctx.stroke();
        ctx.beginPath(); ctx.arc((X0 + X1) / 2 + sgn * 0.45 * k, Y0 + 0.12 * k, 0.12 * k, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
};

export const drawCube = (ctx: Ctx, c: Cam, o: ArchOpts) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), CEIL = 4.6;
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (const dd of [1.3, 2.9]) {                                       // track rails, lights click on in turn
      line3(ctx, c, [[xa, CEIL - 0.06, dd], [xb, CEIL - 0.06, dd]], p.rail, Math.max(1.5, 0.05 * K(c, dd)));
      for (let x = Math.floor(xa / 1.75) * 1.75; x < xb; x += 1.75) {
        const on = clamp01(b * 4 - (hash(x * 3.1 + dd) * 2));
        const [X, Y] = P(c, x, CEIL - 0.06, dd), k = K(c, dd);
        ctx.fillStyle = p.rail; ctx.save(); ctx.translate(X, Y); ctx.rotate(dd < 2 ? 0.5 : 0.35);
        ctx.fillRect(-0.05 * k, 0, 0.1 * k, 0.24 * k); ctx.restore();
        if (on > 0) { ctx.fillStyle = `rgba(255,248,225,${0.7 * on})`; ctx.beginPath(); ctx.arc(X + 0.08 * k, Y + 0.24 * k, 0.05 * k, 0, Math.PI * 2); ctx.fill(); }
      }
    }
  }
  const g = ctx.createLinearGradient(0, P(c, 0, CEIL)[1], 0, P(c, 0, 0)[1]);
  g.addColorStop(0, p.wall2); g.addColorStop(0.35, p.wall); g.addColorStop(1, p.wall);
  wallRect(ctx, c, xa, xb, 0, CEIL, g);
  wallRect(ctx, c, xa, xb, 0, 0.06, p.skirt);
  // light pools over the artworks
  for (const w of J.works) {
    if (w.x < xa - 3 || w.x > xb + 3 || w.x < 0 || w.x > 30) continue;
    const [X, Y] = P(c, w.x, w.y + 0.2), k = c.s, on = clamp01(b * 3 - 0.6);
    const rg = ctx.createRadialGradient(X, Y - 0.4 * k, 0.1 * k, X, Y, 2.0 * k);
    rg.addColorStop(0, `rgba(255,253,244,${0.85 * on})`); rg.addColorStop(0.55, `rgba(255,252,238,${0.35 * on})`); rg.addColorStop(1, "rgba(255,252,238,0)");
    ctx.fillStyle = rg; ctx.fillRect(X - 2.2 * k, Y - 2.4 * k, 4.4 * k, 4.8 * k);
    if (w.frame !== "plinth") {                                           // a small wall label beside the work
      const [lx, ly] = P(c, w.x + w.w / 2 + 0.25, 1.62), lw = 0.26 * k, lh = 0.16 * k;
      ctx.fillStyle = "#FBFAF7"; ctx.fillRect(lx, ly, lw, lh); ctx.fillStyle = "rgba(0,0,0,0.5)";
      for (let i = 0; i < 4; i++) ctx.fillRect(lx + 0.03 * k, ly + 0.03 * k + i * 0.03 * k, (i === 0 ? 0.16 : 0.2 - i * 0.02) * k, Math.max(1, 0.008 * k));
    }
  }
  const [, yb] = P(c, 0, 0, 0);
  const fg = ctx.createLinearGradient(0, yb, 0, VH);
  fg.addColorStop(0, p.floor2); fg.addColorStop(0.25, p.floor); fg.addColorStop(1, p.floor2);
  ctx.fillStyle = fg; ctx.fillRect(0, yb, VW, VH - yb);
  for (let x = Math.floor(xa / 3) * 3; x < xb; x += 3) line3(ctx, c, [[x, 0, 0], [x, 0, Math.min(9, c.z - 0.4)]], "rgba(0,0,0,0.06)", 1);
};

export const drawDesign = (ctx: Ctx, c: Cam, o: ArchOpts, pipes = 0) => {
  const p = o.pal, b = o.build, [xa, xb] = visX(c), CEIL = 4.4;
  if (!o.noCeil) {
    ctx.fillStyle = p.ceil; ctx.fillRect(0, 0, VW, VH);
    for (let x = Math.floor(xa / 2.4) * 2.4; x < xb; x += 2.4) {        // exposed beams
      const kb = clamp01(b * 2 - 0.3);
      if (kb <= 0) continue;
      poly(ctx, [P(c, x - 0.12, CEIL, 0), P(c, x + 0.12, CEIL, 0), P(c, x + 0.12, CEIL, Math.min(9, c.z - 0.4)), P(c, x - 0.12, CEIL, Math.min(9, c.z - 0.4))], p.beam);
    }
  }
  // the glass curtain wall: panes slide in on the grid, row by row
  const g = ctx.createLinearGradient(0, P(c, 0, CEIL)[1], 0, P(c, 0, 0)[1]);
  g.addColorStop(0, p.sky); g.addColorStop(1, p.glass);
  wallRect(ctx, c, xa, xb, 0, CEIL, p.wall);
  const PW = 1.2, PH = 0.8;
  for (let x = Math.floor(xa / PW) * PW; x < xb; x += PW) for (let y = 0.4; y < CEIL - 0.3; y += PH) {
    const i = Math.round(x / PW), j = Math.round(y / PH), delay = (j * 0.08 + ((i % 6) / 6) * 0.25);
    const k = outCubic(clamp01((b - delay) * 3));
    if (k <= 0) continue;
    const slide = (1 - k) * (j % 2 ? 1 : -1) * PW;
    wallRect(ctx, c, x + 0.03 + slide, x + PW - 0.03 + slide, y + 0.03, y + PH - 0.03, hash2(i, j) > 0.8 ? p.glass2 : g);
  }
  for (let x = Math.floor(xa / PW) * PW; x < xb; x += PW) wallRect(ctx, c, x - 0.025, x + 0.025, 0.4, CEIL - 0.3, p.mull);
  for (let y = 0.4; y < CEIL - 0.2; y += PH) wallRect(ctx, c, xa, xb, y - 0.02, y + 0.02, p.mull);
  wallRect(ctx, c, xa, xb, 0, 0.4, p.mull);
  // primary accents: free-standing white panels with a red / yellow / blue edge, a red column
  for (const w of J.works) {
    if (w.x < 30 || w.x > xb + 3 || w.x < xa - 3) continue;
    const kp = outBack(clamp01(b * 2 - 0.9), 1.2);
    wallRect(ctx, c, w.x - 0.95, w.x + 0.95, 0, lerp(0, 3.6, kp), p.wall, 0.25, p.mull, 1.5);
  }
  for (let x = Math.floor(xa / 8) * 8 + 4; x < xb + 8; x += 8) wallRect(ctx, c, x - 0.18, x + 0.18, 0, CEIL, p.red, 0.6);
  wallRect(ctx, c, xa, xb, CEIL - 0.3, CEIL - 0.18, p.yellow);
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
    const y = 3.7 - i * 0.42, d = 0.35 + i * 0.12, r = 0.16 - i * 0.015;
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

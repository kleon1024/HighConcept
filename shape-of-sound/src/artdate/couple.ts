// The couple (original drawings): seen from behind in front of the art, turning to profile for dialogue.
// Local units are centimetres, origin between the feet, y up. Materials let each style recolour/outline them.
import J from "./artdate.json";
import { clamp01, inOutSine, lerp, range, sampleKeys } from "./motion";
import { Cam, K, P } from "./world";

type Ctx = CanvasRenderingContext2D;
type Fill = string | CanvasGradient | CanvasPattern;
export type Mat = {
  coat: Fill; coatDk: Fill; scarf: Fill; scarf2: Fill; trousers: Fill; shoeM: Fill; hairM: Fill; hairMhi: Fill; skin: Fill; skinDk: Fill;
  dress: Fill; dressDk: Fill; hairF: Fill; hairFhi: Fill; legs: Fill; shoeF: Fill; gold: Fill; line: string; lw: number; shade: boolean; eye: string;
};
export const MAT_NATURAL: Mat = {
  coat: "#B98552", coatDk: "#8E6236", scarf: "#D9A43C", scarf2: "#22304A", trousers: "#2C2B2F", shoeM: "#3A2418", hairM: "#271B14", hairMhi: "#4A3426",
  skin: "#E7B48F", skinDk: "#C98D68", dress: "#8A2436", dressDk: "#5E1424", hairF: "#3A2216", hairFhi: "#6B3F26", legs: "#D9A37E", shoeF: "#141214",
  gold: "#D7A947", line: "rgba(0,0,0,0)", lw: 0, shade: true, eye: "#1A1210",
};

// ── pose from the timeline
export type Pose = { walk: number; phase: number; turn: number; panic: number; cool: number; eyeroll: number; smile: number; raise: number; squint: number; sway: number; hairSwing: number; scarfSwing: number;
  chin: number; point: number; shrug: number; excited: number; proud: number; lean: number; cross: number };
const actAt = (who: string, act: string, t: number) => {
  let v = 0;
  for (const a of J.acts as { t: number; who: string; act: string; to: number; dur: number }[]) {
    if (a.act !== act || (a.who !== who && a.who !== "both") || a.t > t) continue;
    v = lerp(v, a.to, inOutSine(range(t, a.t, a.t + a.dur)));
  }
  return v;
};
export const coupleAt = (t: number) => sampleKeys(J.couple as never, t, ["x", "d"]);
// walking: distance travelled → step phase; speed → walk amount (steps land on the beat at 1 m/s)
const speedAt = (t: number) => { const a = coupleAt(t - 0.05), b = coupleAt(t + 0.05); return Math.hypot(b.x - a.x, (b.d - a.d) * 1.5) / 0.1; };
export const poseAt = (who: "him" | "her", t: number): Pose => {
  const sp = speedAt(t);
  const walk = clamp01(sp / 0.9) * (sp > 6 ? 0 : 1);                    // whips are not walks
  // integrate the step phase so it is continuous (cheap fixed-step integral over the last 6 s)
  let ph = 0; for (let tt = Math.max(0, t - 6); tt < t; tt += 1 / 30) { const s = speedAt(tt); ph += (s > 6 ? 0 : Math.min(s, 2.2)) * Math.PI * 2 / 30 * 0.95; }
  // follow-through: ponytail / scarf as damped springs driven by the walk sway and by starts/stops
  let ang = 0, vel = 0; const W = 2 * Math.PI * 1.4, Z = 0.18;
  for (let tt = Math.max(0, t - 2.5); tt < t; tt += 1 / 60) {
    const s = speedAt(tt), drive = (s > 6 ? 0 : 1) * (0.22 * Math.sin(ph + (tt - t) * 6) * clamp01(s) + 0.1 * (s - speedAt(tt - 0.1)));
    const acc = -W * W * (ang - drive) - 2 * Z * W * vel; vel += acc / 60; ang += vel / 60;
  }
  const off = who === "him" ? 0 : Math.PI;                              // she steps in counter-phase
  return {
    walk, phase: ph + off, turn: actAt(who, "turn", t), panic: actAt(who, "panic", t), cool: actAt(who, "cool", t), eyeroll: actAt(who, "eyeroll", t),
    smile: actAt(who, "smile", t), raise: actAt(who, "raise", t), squint: actAt(who, "squint", t), sway: Math.sin(t * 1.3 + off) * 0.6 * (1 - walk),
    hairSwing: ang * (who === "her" ? 1 : 0.7), scarfSwing: ang * 0.8,
    chin: actAt(who, "chin", t), point: actAt(who, "point", t), shrug: actAt(who, "shrug", t), excited: actAt(who, "excited", t), proud: actAt(who, "proud", t), lean: actAt(who, "lean", t), cross: actAt(who, "cross", t),
  };
};

// ── shapes
const path = (ctx: Ctx, pts: [number, number][], close = true) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); };
const fillLine = (ctx: Ctx, m: Mat, f: Fill) => { ctx.fillStyle = f; ctx.fill(); if (m.lw > 0) { ctx.strokeStyle = m.line; ctx.lineWidth = m.lw; ctx.lineJoin = "round"; ctx.stroke(); } };
// a smooth closed blob through points (Catmull-Rom → Bézier)
const blob = (ctx: Ctx, pts: [number, number][], close = true) => {
  const n = pts.length; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  const last = close ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const q0 = !close && i === 0 ? p1 : p0, q3 = !close && i === n - 2 ? p2 : p3;
    ctx.bezierCurveTo(p1[0] + (p2[0] - q0[0]) / 6, p1[1] + (p2[1] - q0[1]) / 6, p2[0] - (q3[0] - p1[0]) / 6, p2[1] - (q3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (close) ctx.closePath();
};
// volume shading: a soft side-to-side gradient clipped to the last path
const volume = (ctx: Ctx, x0: number, x1: number, k = 0.22, light = -1) => {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  const dk = `rgba(20,10,5,${k})`, lt = `rgba(255,240,220,${k * 0.45})`;
  g.addColorStop(0, light < 0 ? lt : dk); g.addColorStop(0.45, "rgba(0,0,0,0)"); g.addColorStop(1, light < 0 ? dk : lt);
  ctx.fillStyle = g; ctx.fill();
};

// a head seen from behind that turns into profile (turn ∈ [-1, 1]; + = toward screen right)
const head = (ctx: Ctx, m: Mat, cx: number, cy: number, rx: number, ry: number, turn: number, hair: Fill, hairHi: Fill, female: boolean, smile: number, eyeroll: number) => {
  const s = Math.sign(turn) || 1, a = Math.abs(turn);
  const edge = (py: number) => rx * Math.sqrt(Math.max(0, 1 - (py / ry) ** 2));
  // face profile in head coordinates (facing +x), scaled to this head
  const sc = rx / 9.3;
  const prof: [number, number][] = [[6.2, 9.4], [8.7, 6.0], [9.5, 3.0], [9.2, 1.4], [11.9, -1.8], [10.0, -3.3], [10.5, -4.5], [9.8, -5.3], [10.2, -6.2], [9.4, -9.0], [6.0, -11.0], [2.0, -10.4]];
  const face = prof.map(([px, py]): [number, number] => { const X = lerp(Math.min(edge(py * sc), px * sc) * 0.98, px * sc, a); return [cx + s * X, cy - py * sc]; });
  // skin: neck-to-face silhouette behind the hair
  ctx.save();
  path(ctx, [[cx, cy - 12 * sc], ...face, [cx + s * 1.5 * sc, cy - 4 * sc]]); fillLine(ctx, m, m.skin);
  if (m.shade) { ctx.fillStyle = "rgba(120,60,30,0.10)"; ctx.fill(); }
  // ears: the near one slides from the side toward the middle as the head turns, the far one disappears
  for (const side of [s, -s]) {
    const near = side === s, vis = near ? 1 : clamp01(1 - a * 3);
    if (vis <= 0) continue;
    const ex = cx + side * (near ? lerp(rx * 0.97, -0.6 * sc, a) : rx * 0.97), ey = cy + 0.5 * sc;
    ctx.globalAlpha = vis; ctx.beginPath(); ctx.ellipse(ex, ey, 1.9 * sc, 3.3 * sc, 0, 0, Math.PI * 2); fillLine(ctx, m, m.skinDk); ctx.globalAlpha = 1;
  }
  // hair: the back mass; its front edge recedes as the face appears
  const top = ry * 1.06, bot = female ? -ry * 0.6 : -ry * 0.66;
  const hx = (py: number) => lerp(edge(py) * 1.06, female ? 4.5 * sc : 5.6 * sc, a * smoothY(py / ry));
  const front: [number, number][] = [], back: [number, number][] = [];
  for (let k = 0; k <= 14; k++) { const py = lerp(top * 0.98, bot, k / 14); front.push([cx + s * hx(py), cy - py]); }
  for (let k = 0; k <= 14; k++) { const py = lerp(bot - ry * 0.06, top * 0.98, k / 14); back.push([cx - s * (edge(py) * 1.06 + (female ? 0.3 : 0)), cy - py]); }
  const nape: [number, number][] = [[cx + s * (female ? 2 : 3) * sc, cy - bot + 0.6 * sc], [cx - s * 3 * sc, cy - bot + 1.4 * sc]];
  blob(ctx, [...front, ...nape, ...back, [cx, cy - top]]); fillLine(ctx, m, hair);
  if (m.shade) {   // a soft sheen across the crown
    ctx.save(); ctx.clip(); ctx.strokeStyle = typeof hairHi === "string" ? hairHi : "#6B4A30"; ctx.globalAlpha = 0.55; ctx.lineWidth = 1.6 * sc;
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(cx - s * 1.5 * sc, cy - ry * 0.2, rx * (0.55 + k * 0.08), ry * (0.75 + k * 0.05), 0, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke(); }
    ctx.restore();
  }
  // eye, brow and mouth when the face shows
  if (a > 0.55) {
    const k = clamp01((a - 0.55) / 0.3);
    const exx = cx + s * 7.0 * sc, eyy = cy - 1.0 * sc;
    ctx.globalAlpha = k;
    ctx.strokeStyle = m.eye; ctx.lineWidth = 1.1 * sc; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(exx - s * 1.6 * sc, eyy - 0.2 * sc); ctx.quadraticCurveTo(exx, eyy - 1.4 * sc, exx + s * 1.3 * sc, eyy - 0.1 * sc); ctx.stroke();
    ctx.fillStyle = m.eye; ctx.beginPath(); ctx.ellipse(exx + s * 0.5 * sc, eyy + (eyeroll > 0.3 ? -0.9 : 0.1) * sc, 0.8 * sc, (eyeroll > 0.3 ? 0.6 : 0.9) * sc, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(exx - s * 1.8 * sc, eyy - 3.0 * sc); ctx.quadraticCurveTo(exx, eyy - (3.9 + eyeroll) * sc, exx + s * 1.8 * sc, eyy - 3.1 * sc); ctx.stroke();
    if (female) { ctx.lineWidth = 0.9 * sc; ctx.beginPath(); ctx.moveTo(exx + s * 1.3 * sc, eyy - 0.3 * sc); ctx.lineTo(exx + s * 2.2 * sc, eyy - 1.1 * sc); ctx.stroke(); }
    const mx = cx + s * 9.9 * sc, my = cy + 5.4 * sc;
    ctx.strokeStyle = female ? "#9C3A44" : m.eye; ctx.lineWidth = 1.0 * sc;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx - s * 1.2 * sc, my + (0.4 - smile * 1.3) * sc, mx - s * 2.0 * sc, my - smile * 1.1 * sc); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};
const smoothY = (v: number) => clamp01(1 - Math.abs(v) * 0.15);

// an arm as a sleeve tube shoulder → elbow → wrist, with a cuff and a hand; points in local cm
type V2 = [number, number];
const arm = (ctx: Ctx, m: Mat, sh: V2, el: V2, wr: V2, w: number, sleeve: Fill, hand = true, cuff?: Fill, open = 0) => {
  ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
  const tube = (lw: number, col: Fill | string) => { ctx.strokeStyle = col as string; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.quadraticCurveTo(el[0], el[1], (el[0] + wr[0]) / 2, (el[1] + wr[1]) / 2); ctx.lineTo(wr[0], wr[1]); ctx.stroke(); };
  if (m.lw > 0) tube(w + m.lw * 2, m.line);
  tube(w, sleeve);
  if (m.shade) { ctx.globalAlpha = 0.22; tube(w * 0.35, "#1A0E08"); ctx.globalAlpha = 1; }
  if (cuff) { ctx.fillStyle = cuff; ctx.beginPath(); ctx.arc(wr[0], wr[1], w * 0.42, 0, Math.PI * 2); ctx.fill(); }
  if (hand) {
    const ang = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
    ctx.translate(wr[0] + Math.cos(ang) * w * 0.55, wr[1] + Math.sin(ang) * w * 0.55); ctx.rotate(ang - Math.PI / 2);
    ctx.beginPath(); ctx.ellipse(0, open * 1.5, w * 0.36 + open, w * 0.52, 0, 0, Math.PI * 2); fillLine(ctx, m, m.skin);
    ctx.beginPath(); ctx.ellipse(w * 0.32 + open * 1.5, -w * 0.05, w * 0.12, w * 0.3, 0.5 + open * 0.6, 0, Math.PI * 2); fillLine(ctx, m, m.skin);   // thumb
  }
  ctx.restore();
};
const L = (a: V2, b: V2, k: number): V2 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
// blend a rest arm toward pose arms by weights
const blendArm = (rest: [V2, V2], poses: [number, [V2, V2]][]): [V2, V2] => {
  let el = rest[0], wr = rest[1];
  for (const [w, [e, r]] of poses) if (w > 0) { el = L(el, e, w); wr = L(wr, r, w); }
  return [el, wr];
};

// ── him (178 cm). X/Y = screen position of the feet, k = px per cm
export const drawHim = (ctx: Ctx, m: Mat, X: number, Y: number, k: number, p: Pose) => {
  ctx.save(); ctx.translate(X, Y); ctx.scale(k, -k);
  const step = Math.sin(p.phase) * p.walk, bob = Math.abs(Math.cos(p.phase)) * 1.4 * p.walk;
  const lift = (sgn: number) => Math.max(0, sgn * step) * 9;
  const sh = p.panic * 3 + p.shrug * 3.5 - p.cool * 1.2 - p.proud * 0.5, sway = p.sway + Math.sin(p.phase) * 0.9 * p.walk;
  ctx.rotate(-p.lean * 0.05);
  for (const s of [-1, 1]) {                                            // legs + shoes
    const l = lift(s);
    path(ctx, [[s * 3.2 + sway * 0.3, 62], [s * 12.6 + sway * 0.3, 62], [s * 11.2, 8 + l], [s * 4.4, 8 + l]]); fillLine(ctx, m, m.trousers);
    ctx.beginPath(); ctx.ellipse(s * 7.8, 4 + l, 5.2, 4.2 + l * 0.08, 0, 0, Math.PI * 2); fillLine(ctx, m, m.shoeM);
    if (l > 2) { ctx.beginPath(); ctx.ellipse(s * 7.8, 2.8 + l, 4.2, 2.2, 0, 0, Math.PI * 2); ctx.fillStyle = "#5A4030"; ctx.fill(); }
  }
  ctx.translate(sway, bob);
  // arms (drawn before the coat: whatever bends in front of him is hidden by his back)
  for (const s of [-1, 1]) {
    const sw = -s * step * 3, shoulder: V2 = [s * 20.5, 139 + sh];
    const rest: [V2, V2] = [[s * 25 + sw * 0.15, 113 + sh * 0.6], [s * 26.5 + sw * 0.3, 90 + Math.abs(sw) * 0.4 + sh * 0.3]];
    const right = s > 0;
    const [el, wr] = blendArm(rest, [
      [p.cool * (right ? 0 : 1), [[-24, 112], [-17, 95]]],                         // left hand in the pocket
      [p.chin * (right ? 1 : 0), [[27, 122], [15, 150]]],                          // right hand to the chin
      [p.point * (right ? 1 : 0), [[27, 152], [21, 176]]],                         // pointing up at the painting
      [p.shrug, [[s * 27, 118], [s * 41, 126]]],                                   // forearms out, palms up
      [p.excited, [[s * 28, 126], [s * 34, 152]]],                                 // both hands up: "wow"
      [p.raise * (right ? 1 : 0), [[27, 124], [24, 146]]],                         // raising a glass
    ]);
    const hidden = p.cool * (right ? 0 : 1) > 0.5;
    arm(ctx, m, shoulder, el, wr, 9.5, m.coat, !hidden && p.chin * (right ? 1 : 0) < 0.5, undefined, p.shrug + p.excited);
  }
  // coat body
  blob(ctx, [[-24, 58], [-21.2, 80], [-20.4, 102], [-21.4, 126], [-24.2 + sh * 0.2, 140 + sh], [-15, 147 + sh], [0, 149 + sh], [15, 147 + sh], [24.2 - sh * 0.2, 140 + sh], [21.4, 126], [20.4, 102], [21.2, 80], [24, 58], [12, 56.5], [0, 56], [-12, 56.5]]);
  fillLine(ctx, m, m.coat);
  if (m.shade) volume(ctx, -24, 24, 0.24);
  ctx.strokeStyle = typeof m.coatDk === "string" ? m.coatDk : "#7A5530"; ctx.lineWidth = 0.7; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(0, 147 + sh); ctx.lineTo(0, 78); ctx.lineTo(-2.2, 74); ctx.lineTo(-2.2, 57); ctx.stroke();          // back seam + vent
  ctx.beginPath(); ctx.moveTo(-17, 100); ctx.quadraticCurveTo(0, 98, 17, 100); ctx.stroke();                                       // half-belt
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 20, 134 + sh); ctx.quadraticCurveTo(s * 14, 128 + sh, s * 12, 120 + sh); ctx.stroke(); }   // shoulder seams
  // collar, neck, scarf (one end thrown over the left shoulder, swinging)
  path(ctx, [[-9.5, 145 + sh], [9.5, 145 + sh], [8.4, 153 + sh], [-8.4, 153 + sh]]); fillLine(ctx, m, m.coatDk);
  path(ctx, [[-5.4, 150], [5.4, 150], [5.0, 160], [-5.0, 160]]); fillLine(ctx, m, m.skin);
  ctx.save(); ctx.translate(-8.5, 150 + sh); ctx.rotate(-0.16 - p.scarfSwing * 0.5);
  blob(ctx, [[-4.2, 2], [4.2, 2], [4.6, -14], [3.6, -27], [-3.4, -27], [-4.4, -12]]); fillLine(ctx, m, m.scarf);
  ctx.fillStyle = m.scarf2; for (const y of [-7, -11, -21]) ctx.fillRect(-4.2, y, 8.4, 1.5);
  for (let i = 0; i < 6; i++) ctx.fillRect(-3.2 + i * 1.3, -30, 0.55, 3.4);
  ctx.restore();
  blob(ctx, [[-9.4, 147.5 + sh], [0, 146.5 + sh], [9.4, 147.5 + sh], [9.2, 155 + sh], [0, 156.5 + sh], [-9.2, 155 + sh]]); fillLine(ctx, m, m.scarf);
  ctx.fillStyle = m.scarf2; ctx.fillRect(-9, 151 + sh, 18, 1.4);
  // head (turns to profile; panic stiffens, proud lifts the chin)
  ctx.save(); ctx.translate(0, 167 + sh * 0.6); ctx.rotate(p.proud * 0.12 * (p.turn >= 0 ? 1 : -1) - p.cool * 0.03 + p.shrug * 0.06 * (p.turn >= 0 ? -1 : 1)); ctx.scale(1, -1);
  head(ctx, m, 0, 0, 9.3, 11.6, p.turn, m.hairM, m.hairMhi, false, Math.max(p.proud, p.cool * 0.6), 0);
  ctx.restore();
  if (p.chin > 0.3) {                                                   // the thinking hand under the chin
    ctx.globalAlpha = clamp01((p.chin - 0.3) * 3);
    ctx.save(); ctx.translate(0, 167 + sh * 0.6);
    ctx.beginPath(); ctx.ellipse(10.5 * (p.turn >= 0 ? 1 : -1), -8.5, 3.6, 4.4, 0.3, 0, Math.PI * 2); fillLine(ctx, m, m.skin);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  ctx.restore();
};

// ── her (166 cm)
export const drawHer = (ctx: Ctx, m: Mat, X: number, Y: number, k: number, p: Pose) => {
  ctx.save(); ctx.translate(X, Y); ctx.scale(k, -k);
  const step = Math.sin(p.phase) * p.walk, bob = Math.abs(Math.cos(p.phase)) * 1.2 * p.walk;
  const lift = (sgn: number) => Math.max(0, sgn * step) * 8, sway = p.sway + Math.sin(p.phase) * 1.1 * p.walk;
  ctx.rotate(p.lean * 0.07 - p.cross * 0.035);                          // leans toward him when impressed, away when not
  for (const s of [-1, 1]) {
    const l = lift(s);
    blob(ctx, [[s * 2.6, 54], [s * 8.8, 54], [s * 8.2, 34 + l], [s * 6.8, 12 + l], [s * 4.4, 12 + l], [s * 3.4, 34 + l]]); fillLine(ctx, m, m.legs);
    path(ctx, [[s * 3.6, 12 + l], [s * 7.6, 12 + l], [s * 7.2, 3 + l * 1.1], [s * 4.0, 3 + l * 1.1]]); fillLine(ctx, m, m.shoeF);
    path(ctx, [[s * 5.2, 3 + l], [s * 6.0, 3 + l], [s * 5.8, -0.2 + l * 1.2], [s * 5.4, -0.2 + l * 1.2]]); fillLine(ctx, m, m.shoeF);
  }
  ctx.translate(sway, bob);
  for (const s of [-1, 1]) {
    const sw = -s * step * 3, shoulder: V2 = [s * 15.5, 133];
    const rest: [V2, V2] = [[s * 19 + sw * 0.15, 108], [s * 20 + sw * 0.3, 85 + Math.abs(sw) * 0.4]];
    const toward = s < 0;                                                // her left arm is on his side
    const [el, wr] = blendArm(rest, [
      [p.cross, [[s * 21, 112], [s * 6, 116]]],                                    // arms crossed: elbows out, hands hidden
      [p.lean * (toward ? 1 : 0), [[s * 20, 114], [s * 9, 126]]],                  // a hand to her chest
      [p.raise * (toward ? 1 : 0), [[-21, 118], [-19, 140]]],
    ]);
    arm(ctx, m, shoulder, el, wr, 7, m.dress, p.cross < 0.5 && !(p.lean > 0.5 && toward));
  }
  const fl = Math.sin(p.phase * 1) * 1.6 * p.walk;
  blob(ctx, [[-24 + fl, 52], [-19, 68], [-13.2, 98], [-14.2, 116], [-17.8, 133], [-10, 138.5], [0, 139.5], [10, 138.5], [17.8, 133], [14.2, 116], [13.2, 98], [19, 68], [24 + fl, 52], [12, 50.4], [0, 50], [-12, 50.4]]);
  fillLine(ctx, m, m.dress);
  if (m.shade) volume(ctx, -24, 24, 0.26);
  ctx.strokeStyle = typeof m.dressDk === "string" ? m.dressDk : "#5E1424"; ctx.lineWidth = 0.8; ctx.lineCap = "round";
  for (const fx of [-11, -4, 5, 12]) { ctx.beginPath(); ctx.moveTo(fx * 0.55, 97); ctx.quadraticCurveTo(fx * 0.8 + fl * 0.3, 74, fx + fl * 0.5, 52); ctx.stroke(); }
  ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-13.2, 99); ctx.quadraticCurveTo(0, 97, 13.2, 99); ctx.stroke();               // waist seam
  path(ctx, [[-7, 138.6], [0, 124], [7, 138.6]]); fillLine(ctx, m, m.skin);                                                       // a V back
  path(ctx, [[-4.4, 137], [4.4, 137], [4.2, 148], [-4.2, 148]]); fillLine(ctx, m, m.skin);
  ctx.save(); ctx.translate(0, 155); ctx.rotate(p.eyeroll * 0.1 * (p.turn >= 0 ? -1 : 1) + p.cross * 0.06 * (p.turn >= 0 ? -1 : 1) + p.lean * 0.05 * (p.turn >= 0 ? 1 : -1)); ctx.scale(1, -1);
  ctx.save(); ctx.translate(-p.turn * 2.5, 7.5); ctx.rotate(p.hairSwing * 0.9 + p.turn * 0.25);
  blob(ctx, [[-3.4, -0.5], [3.4, -0.5], [4.2, 9], [3.0, 20], [0.8, 28], [-1.4, 22], [-3.6, 10]]); fillLine(ctx, m, m.hairF);
  if (m.shade) { ctx.strokeStyle = typeof m.hairFhi === "string" ? m.hairFhi : "#6B3F26"; ctx.lineWidth = 0.7; for (const dx of [-1.5, 0.3, 1.8]) { ctx.beginPath(); ctx.moveTo(dx, 1); ctx.quadraticCurveTo(dx + 1.2, 12, dx * 0.4, 25); ctx.stroke(); } }
  ctx.fillStyle = "#151012"; ctx.fillRect(-3.2, -0.6, 6.4, 2.4);
  ctx.restore();
  head(ctx, m, 0, 0, 8.6, 10.8, p.turn, m.hairF, m.hairFhi, true, p.smile, p.eyeroll);
  for (const s of [-1, 1]) {
    const near = (Math.sign(p.turn) || 1) === s, a = Math.abs(p.turn);
    if (!near && a > 0.35) continue;
    const ex = s * (near ? lerp(8.4, -0.6, a) : 8.4), sw = p.hairSwing * 3;
    ctx.fillStyle = m.gold; ctx.beginPath(); ctx.ellipse(ex + sw * 0.3, 4.4, 0.9, 1.7, sw * 0.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
};

// the passer-by at the end: a soft, out-of-focus silhouette crossing the near foreground
export const passerby = (c: Cam, t: number) => {
  const a = 65.35, b = 67.5;
  if (t < a || t > b) return null;
  const q = (t - a) / (b - a), x = lerp(c.x - 1.6, c.x + 1.5, q), d = c.z - 2.7, k = K(c, d) / 100;
  const [X, Y] = P(c, x, 0, d), bob = Math.abs(Math.sin(q * Math.PI * 4)) * 2 * k;
  return { X, Y, k, bob, head: [X + 30 * k, Y - 185 * k] as [number, number] };
};
export const drawPasserby = (ctx: Ctx, c: Cam, t: number) => {
  const pb = passerby(c, t);
  if (!pb) return null;
  const { X, Y, k, bob } = pb;
  ctx.save(); ctx.filter = `blur(${Math.round(6 + k * 1.5)}px)`; ctx.fillStyle = "#2A2523"; ctx.globalAlpha = 0.92;
  ctx.beginPath(); ctx.ellipse(X, Y - 165 * k - bob, 10 * k, 12 * k, 0, 0, Math.PI * 2); ctx.fill();
  blob(ctx, [[X - 24 * k, Y - 60 * k], [X - 22 * k, Y - 140 * k - bob], [X, Y - 150 * k - bob], [X + 22 * k, Y - 140 * k - bob], [X + 24 * k, Y - 60 * k], [X, Y - 52 * k]]); ctx.fill();
  ctx.restore();
  return pb.head;
};

// the couple in the world: him left, her right; returns the screen anchors for bubbles and effects
export const coupleScreen = (c: Cam, t: number) => {
  const cp = coupleAt(t), k = K(c, cp.d) / 100;
  const him = P(c, cp.x - 0.4, 0, cp.d), her = P(c, cp.x + 0.38, 0, cp.d);
  return { cp, k, him, her, himHead: [him[0], him[1] - 178 * k] as [number, number], herHead: [her[0], her[1] - 166 * k] as [number, number] };
};

// foreground props per hall (nearer than the couple → stronger parallax when the camera trucks)
export const drawProps = (ctx: Ctx, c: Cam, arch: string, m: Mat) => {
  const xs = [c.x - VWm(c), c.x + VWm(c)];
  if (arch === "cube" || arch === "design" || arch === "hightech") {
    if (arch === "cube") {                                                         // a quiet visitor reading a wall label
      const [X, Y] = P(c, 12.95, 0, 0.7), k = K(c, 0.7) / 100;
      ctx.save(); ctx.translate(X, Y); ctx.fillStyle = "#8E8B87";
      ctx.fillRect(-7 * k, -86 * k, 5 * k, 86 * k); ctx.fillRect(2 * k, -86 * k, 5 * k, 86 * k);
      ctx.fillStyle = "#6F7B86"; ctx.beginPath(); ctx.moveTo(-17 * k, -84 * k); ctx.lineTo(-19 * k, -142 * k); ctx.quadraticCurveTo(0, -150 * k, 19 * k, -142 * k); ctx.lineTo(17 * k, -84 * k); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#5B544E"; ctx.beginPath(); ctx.ellipse(0, -160 * k, 9 * k, 11 * k, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    for (let x = Math.floor(xs[0] / 9) * 9 + 2.6; x < xs[1] + 4; x += 9) {          // a low gallery bench
      const d = arch === "cube" ? 1.2 : 3.3, [X0, Y0] = P(c, x - 0.8, 0.45, d), [X1, Y1] = P(c, x + 0.8, 0, d), [X2, Y2] = P(c, x - 0.8, 0.45, d + 0.45), [X3] = P(c, x + 0.8, 0.45, d + 0.45);
      ctx.fillStyle = arch === "cube" ? "#1F1D1C" : "#2A2A2A"; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      ctx.fillStyle = arch === "cube" ? "#3A3634" : "#D2342A"; ctx.beginPath(); ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y0); ctx.lineTo(X3, Y2); ctx.lineTo(X2, Y2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)"; ctx.fillRect(X0, Y1 - 4, X1 - X0, 6);
    }
  }
  if (arch === "palace" || arch === "gothic") {                                      // brass stanchions + velvet rope
    const d = 2.6, step = 3;
    let prev: [number, number] | null = null;
    for (let x = Math.floor(xs[0] / step) * step - step; x < xs[1] + step; x += step) {
      const [X, Y] = P(c, x, 0.95, d), [, Yf] = P(c, x, 0, d), k = K(c, d);
      ctx.fillStyle = "#B8872F"; ctx.fillRect(X - 0.025 * k, Y, 0.05 * k, Yf - Y); ctx.beginPath(); ctx.arc(X, Y, 0.05 * k, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(X, Yf, 0.16 * k, 0.04 * k, 0, 0, Math.PI * 2); ctx.fill();
      if (prev) { ctx.strokeStyle = "#7E1E24"; ctx.lineWidth = Math.max(2, 0.045 * k); ctx.beginPath(); ctx.moveTo(prev[0], prev[1] + 0.03 * k); ctx.quadraticCurveTo((prev[0] + X) / 2, Y + 0.35 * k, X, Y + 0.03 * k); ctx.stroke(); }
      prev = [X, Y];
    }
  }
  if (arch === "station") {                                                          // a slatted platform bench
    for (let x = Math.floor(xs[0] / 8) * 8 + 5.5; x < xs[1] + 4; x += 8) {
      const d = 3.0, [X0, Y0] = P(c, x - 0.9, 0.48, d), [X1, Y1] = P(c, x + 0.9, 0, d), k = K(c, d);
      ctx.fillStyle = "#6B4A2E"; for (let i = 0; i < 3; i++) ctx.fillRect(X0, Y0 - i * 0.12 * k - 0.35 * k * (i > 0 ? 1 : 0), X1 - X0, 0.06 * k);
      ctx.fillStyle = "#2C3438"; ctx.fillRect(X0 + 0.05 * k, Y0, 0.05 * k, Y1 - Y0); ctx.fillRect(X1 - 0.1 * k, Y0, 0.05 * k, Y1 - Y0);
    }
  }
  void m;
};
const VWm = (c: Cam) => 720 / c.s + 2;

export const drawCouple = (ctx: Ctx, m: Mat, c: Cam, t: number) => {
  const s = coupleScreen(c, t);
  if (s.k <= 0 || s.him[1] - 180 * s.k > 1100) return s;
  // a soft contact shadow on the floor
  ctx.save(); ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath(); ctx.ellipse((s.him[0] + s.her[0]) / 2, s.him[1] - 2 * s.k, 78 * s.k, 9 * s.k, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  drawHer(ctx, m, s.her[0], s.her[1], s.k, poseAt("her", t));
  drawHim(ctx, m, s.him[0], s.him[1], s.k, poseAt("him", t));
  return s;
};

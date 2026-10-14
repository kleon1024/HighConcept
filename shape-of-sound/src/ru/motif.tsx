// the two strokes of 二, one continuous layer across the film: keyframes of the two bars (a = upper, b = lower), their
// opacity (per bar) and glow; between keyframes they ease. A keyframe repeated holds the bars still.
// They are: the glyph's 二 → the rods of the first painting → the two strokes between two 人 → a balance beam and its
// base (己 / 人) → (己 falls into water; the rings take over) → the rods of the family painting → the road (the upper
// one goes) → a gate's lintel and sill → the two beams of the bell rack → back into the glyph → the rods of the portrait.
import React from "react";
import { Bar, eInOut, lerp, mixBar, range, RJ, Stroke } from "./kit";
import { ASK_BOX, barOf, ER_BOT, ER_TOP, HAND, HERO_END, LOVE_BARS, rodBot, rodTop } from "./R1";
import { BASE, BEAM, FAMILY_BOX } from "./R2";
import { BEAMS, END_HAND, END_HERO, LINTEL, PORTRAIT_BOX, ROAD, SILL } from "./R3";

type K = { t: number; a: Bar; b: Bar; oa: number; ob?: number; g?: number };
const AS = RJ.ask, LV = RJ.love, RL = RJ.rule, VS = RJ.vessel, TR = RJ.travel, GT = RJ.gate, BL = RJ.bells, EN = RJ.end;
const H = HERO_END, E = END_HERO;
const g0 = barOf(H.cx, H.cy, H.S, ER_TOP), g1 = barOf(H.cx, H.cy, H.S, ER_BOT);
const e0 = barOf(E.cx, E.cy, E.S, ER_TOP), e1 = barOf(E.cx, E.cy, E.S, ER_BOT);
const beam: Bar = { x: 960, y: BEAM.y, w: BEAM.w, h: 22 }, base: Bar = { x: 960, y: BASE.y, w: BASE.w, h: 22 };
const tipped: Bar = { ...beam, r: -14, y: BEAM.y + 30 };
const RULE_L: Bar = { x: 880, y: 545, w: 820, h: 10, r: 90 }, RULE_R: Bar = { x: 1040, y: 545, w: 820, h: 10, r: 90 };
const road: Bar = { x: (ROAD.x0 + ROAD.x1) / 2, y: ROAD.y, w: ROAD.x1 - ROAD.x0, h: 12 };
const sky: Bar = { x: 1500, y: 120, w: 300, h: 14 };
const KEYS: K[] = [
  { t: HAND - 0.1, a: g0, b: g1, oa: 0, g: 0.6 },
  { t: HAND, a: g0, b: g1, oa: 1, g: 0.6 },
  { t: AS.t + 0.45, a: rodTop(ASK_BOX), b: rodBot(ASK_BOX), oa: 1, g: 0 },
  { t: AS.out - 0.4, a: rodTop(ASK_BOX), b: rodBot(ASK_BOX), oa: 1, g: 0 },
  { t: AS.out + 0.4, a: LOVE_BARS[0], b: LOVE_BARS[1], oa: 1, g: 0.3 },
  { t: LV.out - 0.1, a: LOVE_BARS[0], b: LOVE_BARS[1], oa: 1, g: 0.6 },
  // while the rule is carved they stand either side of the column, like the ruled lines of a stele
  { t: RL.carve + 0.5, a: RULE_L, b: RULE_R, oa: 0.8, g: 0 },
  { t: RL.l2, a: RULE_L, b: RULE_R, oa: 0.8, g: 0 },
  { t: RL.l2 + 0.9, a: { ...beam, r: -5 }, b: { ...base, r: 0 }, oa: 1, g: 0.2 },
  { t: RL.l2 + 1.8, a: beam, b: base, oa: 1, g: 0.2 },
  { t: RL.fall, a: beam, b: base, oa: 1, g: 0.2 },
  { t: RL.fall + 0.7, a: tipped, b: base, oa: 0, g: 0 },
  { t: VS.family - 0.1, a: rodTop(FAMILY_BOX), b: rodBot(FAMILY_BOX), oa: 0 },
  { t: VS.family + 0.6, a: rodTop(FAMILY_BOX), b: rodBot(FAMILY_BOX), oa: 1 },
  { t: VS.out - 0.3, a: rodTop(FAMILY_BOX), b: rodBot(FAMILY_BOX), oa: 1 },
  { t: TR.t + 0.5, a: sky, b: road, oa: 0, ob: 1 },
  { t: GT.t - 0.3, a: { ...LINTEL, w: 200 }, b: road, oa: 0, ob: 1 },
  { t: GT.t + 0.5, a: LINTEL, b: SILL, oa: 1, ob: 1 },
  { t: GT.pupils + 0.2, a: LINTEL, b: SILL, oa: 1, ob: 1 },
  { t: GT.pupils + 1.0, a: LINTEL, b: SILL, oa: 0, ob: 0 },
  { t: BL.t - 0.2, a: BEAMS[0], b: BEAMS[1], oa: 0, g: 1 },
  { t: BL.t + 0.4, a: BEAMS[0], b: BEAMS[1], oa: 0.42, g: 1 },
  { t: BL.t + 1.6, a: BEAMS[0], b: BEAMS[1], oa: 0.3, g: 0.6 },
  { t: BL.t + 2.3, a: BEAMS[0], b: BEAMS[1], oa: 0, g: 0 },
  { t: EN.t - 0.35, a: { ...e0, x: -400 }, b: { ...e1, x: 2320 }, oa: 0, g: 0.5 },
  { t: EN.t - 0.3, a: { ...e0, x: -400 }, b: { ...e1, x: 2320 }, oa: 1, g: 0.5 },
  { t: END_HAND, a: e0, b: e1, oa: 1, g: 0.5 },
  { t: END_HAND + 0.15, a: e0, b: e1, oa: 0, g: 0.5 },
  { t: EN.title - 0.35, a: e0, b: e1, oa: 0, g: 0.5 },
  { t: EN.title - 0.15, a: e0, b: e1, oa: 1, g: 0.5 },
  { t: EN.title + 0.7, a: rodTop(PORTRAIT_BOX), b: rodBot(PORTRAIT_BOX), oa: 1, g: 0 },
  { t: EN.out, a: rodTop(PORTRAIT_BOX), b: rodBot(PORTRAIT_BOX), oa: 1, g: 0 },
];
export const Motif: React.FC<{ t: number }> = ({ t }) => {
  if (t < KEYS[0].t || t > KEYS[KEYS.length - 1].t + 0.01) return null;
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const A = KEYS[i], B = KEYS[i + 1], k = eInOut(range(t, A.t, B.t));
  const oa = lerp(A.oa, B.oa, k), ob = lerp(A.ob ?? A.oa, B.ob ?? B.oa, k), g = lerp(A.g ?? 0, B.g ?? 0, k);
  const fadeOut = 1 - range(t, EN.out - 0.7, EN.out);
  return <>
    <Stroke b={mixBar(A.a, B.a, k)} o={oa * fadeOut} glow={g} />
    <Stroke b={mixBar(A.b, B.b, k)} o={ob * fadeOut} glow={g} />
  </>;
};

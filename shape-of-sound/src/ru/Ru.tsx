// 儒 · 仁 — an 86-second film on Confucius's 仁: 「一个人，成不了“仁”」. A lone 亻 is carved in a stele; the two strokes
// of 二 slide in beside it (《说文》: 从人从二), and those two strokes then carry the whole film — the rods of the
// paintings, a balance between 己 and 人, the stone dropped into water and its rings (费孝通's 差序格局), a 簋's rim, the
// wheel of the fourteen-year journey, a gate's lintel and sill, the two beams of the 曾侯乙 bell rack — until the
// glyph comes back whole: 「德不孤，必有邻」「你从来不是一个人」. Timing: ru.json; score: music/ru.py.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/lxgw-wenkai-tc/700.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Filters, STONE } from "./kit";
import { Ask, Hook, Love } from "./R1";
import { Rule, Vessel, Water } from "./R2";
import { Bells, End, Gate, Travel } from "./R3";
import { Motif } from "./motif";

export const Ru: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: STONE, overflow: "hidden" }}>
      <Filters />
      <Hook t={t} />
      <Ask t={t} />
      <Love t={t} />
      <Rule t={t} />
      <Water t={t} />
      <Vessel t={t} />
      <Travel t={t} />
      <Gate t={t} />
      <Bells t={t} />
      <End t={t} />
      <Motif t={t} />
      <Audio src={staticFile("ru_score.wav")} />
    </AbsoluteFill>
  );
};

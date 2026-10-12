// 一次看懂元素周期表 — one table seen through four lenses: when we found them, how to read it, who lives where, where they came from.
// Timeline and captions: elements.json; the 118 elements: table.json (written by music/elements_data.py); score: music/elements.py.
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/archivo-black/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { P, eIn, range } from "./core";
import { TableWorld } from "./World";
import { Captions, HoodTag, RollTicker, SectionChip, YearCounter } from "./UI";
import { ColdOpen, MapWidgets, Mendeleev, Newlands, Title } from "./Scenes";
import { Cosmos, EndCard, HoodDemos } from "./Demos";

// a faint superflat dot grid on the paper
const Paper: React.FC = () => (
  <AbsoluteFill style={{ background: P.paper }}>
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs><pattern id="dots" width={36} height={36} patternUnits="userSpaceOnUse"><circle cx={18} cy={18} r={2} fill="#E4DCCB" /></pattern></defs>
      <rect width={1920} height={1080} fill="url(#dots)" />
    </svg>
  </AbsoluteFill>
);

export const Elements: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper />
      <Cosmos t={t} />
      <TableWorld t={t} />
      <ColdOpen t={t} />
      <Title t={t} />
      <Newlands t={t} />
      <Mendeleev t={t} />
      <MapWidgets t={t} />
      <HoodDemos t={t} />
      <YearCounter t={t} />
      <RollTicker t={t} />
      <HoodTag t={t} />
      <SectionChip t={t} />
      <Captions t={t} />
      <EndCard t={t} />
      <AbsoluteFill style={{ background: "#000", opacity: eIn(range(t, 191.4, 192)), pointerEvents: "none" }} />
      <Audio src={staticFile("elements_score.wav")} />
    </AbsoluteFill>
  );
};

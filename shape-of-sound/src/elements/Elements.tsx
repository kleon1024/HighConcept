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
import { eIn, range } from "./core";
import { TableWorld } from "./World";
import { Captions, HoodTag, RollTicker, YearCounter } from "./UI";
import { Background, ChapterHeader, Geometry, GiantType } from "./Look";
import { MapWidgets, Mendeleev, Newlands, Title } from "./Scenes";
import { Hook } from "./Hook";
import { Cosmos, EndCard, HoodDemos } from "./Demos";

export const Elements: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background t={t} />
      <Geometry t={t} />
      <Cosmos t={t} />
      <GiantType t={t} />
      <TableWorld t={t} />
      <Hook t={t} />
      <Title t={t} />
      <Newlands t={t} />
      <Mendeleev t={t} />
      <MapWidgets t={t} />
      <HoodDemos t={t} />
      <YearCounter t={t} />
      <RollTicker t={t} />
      <HoodTag t={t} />
      <ChapterHeader t={t} />
      <Captions t={t} />
      <EndCard t={t} />
      <AbsoluteFill style={{ background: "#000", opacity: eIn(range(t, 191.4, 192)), pointerEvents: "none" }} />
      <Audio src={staticFile("elements_score.wav")} />
    </AbsoluteFill>
  );
};

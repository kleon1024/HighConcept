// 元素周期表 = 宇宙的配料表 — a 60-second cut: your ingredient label → how to read the table → nine surprises → where
// each ingredient was made → you, older than the Earth. Timeline: e60.json; data: t60.json; score: music/elements60.py.
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/archivo-black/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Background6, Geometry6, Header6, Stars6 } from "./Look60";
import { TableWorld6 } from "./World60";
import { Hook6 } from "./Hook60";
import { Read6 } from "./Read60";
import { Lenses6 } from "./Lenses60";
import { Cosmos6, Ending6 } from "./Finale60";

export const Elements60: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Background6 t={t} />
      <Geometry6 t={t} />
      <Stars6 t={t} />
      <Cosmos6 t={t} />
      <TableWorld6 t={t} />
      <Hook6 t={t} />
      <Read6 t={t} />
      <Lenses6 t={t} />
      <Ending6 t={t} />
      <Header6 t={t} />
      <Audio src={staticFile("elements60_score.wav")} />
    </AbsoluteFill>
  );
};

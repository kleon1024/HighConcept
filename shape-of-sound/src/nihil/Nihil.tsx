// NIHIL · 虚无 — a 60-second black-ground film on nihilism: the word 意义 blows away; where the word "nihilism" came from;
// God is dead and every value falls in all directions; passive and active nihilism; the abyss; the eternal return;
// amor fati and a dancing star; the dust comes back as gold. Timing: nihil.json; score: music/nihil.py.
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/space-grotesk/700.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { BG } from "./Glyph";
import { Abyss, Amor, End, God, Hook, Lineage, Loop, Two } from "./Scenes";
import { Grain } from "../meaning/Kit";

export const Nihil: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Hook t={t} />
      <Lineage t={t} />
      <God t={t} />
      <Two t={t} />
      <Abyss t={t} />
      <Loop t={t} />
      <Amor t={t} />
      <End t={t} />
      <Grain t={t} o={0.16} />
      <Audio src={staticFile("nihil_score.wav")} />
    </AbsoluteFill>
  );
};

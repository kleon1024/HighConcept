// 洋流 — a 95-second film about the rivers in the sea. 28,800 bath toys lost in the North Pacific in 1992 open the
// question; Franklin's chart, Homer's Gulf Stream and a Swiss poster show how big these rivers are; the Bauhaus shows
// why they flow (wind, the spinning Earth, Ekman's spiral, the hill of water, five gyres); the Kuroshio leads back to
// the ducks and the model they helped to build; the same gyre gathers our plastic; the slow river of the deep takes a
// thousand years to go round (a dynasty clock); the sea remembers the Little Ice Age; the Atlantic's conveyor is
// weakening; and on Ma Yuan's water, Li Bai's river that "never returns" comes home. Timing: ocean.json; score:
// music/ocean.py.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/ma-shan-zheng/400.css";
import "@fontsource/jost/700.css";
import "@fontsource/jost/800.css";
import "@fontsource/archivo-black/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Grain } from "../meaning/Kit";
import { Franklin, Homer, Hook, Title } from "./O1";
import { Kuro, Scale, Why } from "./O2";
import { Deep, Ducks } from "./O3";
import { Amoc, Challenger, Ending } from "./O4";

export const Ocean: React.FC<{ audio?: boolean }> = ({ audio = true }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: "#050B16", overflow: "hidden" }}>
      <Title t={t} />
      <Franklin t={t} />
      <Homer t={t} />
      <Scale t={t} />
      <Why t={t} />
      <Kuro t={t} />
      <Ducks t={t} />
      <Deep t={t} />
      <Challenger t={t} />
      <Amoc t={t} />
      <Ending t={t} />
      <Hook t={t} />
      <Grain t={t} o={0.07} />
      {audio && <Audio src={staticFile("ocean_score.wav")} />}
    </AbsoluteFill>
  );
};

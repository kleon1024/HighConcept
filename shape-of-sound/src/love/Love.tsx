// 什么是爱 — a 90-second film in one emotional current: five thousand roses and the one you love; Plato's halves;
// Romeo; the Little Prince, his rose and the fox (taming, four o'clock, the colour of wheat, the time spent on a rose);
// loss (元好问's geese, 归有光's loquat tree); what love becomes (Rilke, Fromm); a cascade of answers; Klimt's gold;
// and the question back to the viewer — staged as a play: a velvet curtain, five acts, an intermission between joy
// and grief, and a curtain call where the paintings take their bow. Timing: love.json; score: music/love.py.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/ma-shan-zheng/400.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { PAPER } from "./kit";
import { Hook, Plato, Prince, Romeo } from "./L1";
import { Clock, Fox, Part, Secret, Wheat } from "./L2";
import { End, Fromm, Geese, Kiss, Loquat, Montage, Rilke } from "./L3";
import { Grain } from "../meaning/Kit";
import { ActLabel, Curtain, CurtainCall } from "./Theatre";

export const Love: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
      <Plato t={t} />
      <Romeo t={t} />
      <Prince t={t} />
      <Fox t={t} />
      <Clock t={t} />
      <Wheat t={t} />
      <Part t={t} />
      <Secret t={t} />
      <Geese t={t} />
      <Loquat t={t} />
      <Rilke t={t} />
      <Fromm t={t} />
      <Montage t={t} />
      <Kiss t={t} />
      <End t={t} />
      <Hook t={t} />
      <CurtainCall t={t} />
      <Curtain t={t} />
      <ActLabel t={t} />
      <Grain t={t} o={0.1} />
      <Audio src={staticFile("love_score.wav")} />
    </AbsoluteFill>
  );
};

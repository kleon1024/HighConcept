// 佛 · 第二支箭 — a 90-second film that explains Buddhism through its sayings, each one decoded (「解」): the two arrows;
// the Buddha as a physician (苦集灭道); impermanence and grasping; no-self; dependent origination and emptiness; the
// Heart Sutra; the Diamond Sutra; Chan; and the ending — the second arrow need not be fired. Timing: buddha.json;
// score: music/buddha.py. Look: gold ink on indigo paper (绀纸金字), white paper and ink for Chan.
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/ma-shan-zheng/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { BJ, Ground, INDIGO, eIn, eInOut, range } from "./kit";
import { Doctor, Hook, Title } from "./S1";
import { Flux, Net, Self } from "./S2";
import { Abide, Diamond, Heart, Six } from "./S3";
import { Chan, End } from "./S4";
import { Grain } from "../meaning/Kit";

export const Buddha: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps, C = BJ.chan;
  const paper = eInOut(range(t, C.t - 0.4, C.t + 0.2)) * (1 - eIn(range(t, C.out - 0.4, C.out + 0.3)));
  return (
    <AbsoluteFill style={{ background: INDIGO, overflow: "hidden" }}>
      <Ground t={t} paper={paper} />
      <Hook t={t} />
      <Title t={t} />
      <Doctor t={t} />
      <Flux t={t} />
      <Self t={t} />
      <Net t={t} />
      <Heart t={t} />
      <Diamond t={t} />
      <Six t={t} />
      <Abide t={t} />
      <Chan t={t} />
      <End t={t} />
      <Grain t={t} o={0.12} />
      <Audio src={staticFile("buddha_score.wav")} />
    </AbsoluteFill>
  );
};

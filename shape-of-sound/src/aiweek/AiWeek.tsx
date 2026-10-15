// 本周AI要闻 (8–15 Oct 2026) — a news recap cut like a movie trailer, narrated by a deep, natural local voice. The
// narration's timeline (aiweek.json, from music/aiweek_vo.py) drives every cue; the mix (narration, score and sound
// design) comes from music/aiweek.py. Script and sources: src/aiweek/script.json, AIWEEK_STORYBOARD.md.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/archivo-black/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { BG, Grain, Vignette } from "./kit";
import { Hook } from "./A0";
import { Chips, Spy } from "./A1";
import { China, Giants } from "./A2";
import { End, Fall, Rogue, Subs } from "./A3";

export const AiWeek: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <Hook t={t} />
      <Spy t={t} />
      <Chips t={t} />
      <Giants t={t} />
      <China t={t} />
      <Rogue t={t} />
      <Fall t={t} />
      <End t={t} />
      <Vignette o={0.8} />
      <Grain t={t} o={0.07} />
      <Subs t={t} />
      <Audio src={staticFile("aiweek_mix.wav")} />
    </AbsoluteFill>
  );
};

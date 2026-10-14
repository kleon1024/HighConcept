// 万圣节 · 人类为什么需要一个鬼节？ — an 80-second film. A flame in a carved turnip (the jack-o'-lantern was a turnip
// before it was a pumpkin) opens the question; Samhain (a legend of opening fairy mounds), All Hallows and its eve,
// souling and guising, the pumpkin and the postcards of America, trick-or-treat and the money; then the turn: the
// pumpkin's home is Mexico, where the dead are welcomed home (Día de Muertos); 中元 / 盂兰盆 with its river lanterns;
// お盆 with its welcome and farewell fires; and every lantern lit: 「怕鬼，其实是想念」. Timing: halloween.json;
// score: music/halloween.py. Folklore is flagged on screen (传说 / 民间说法), forecasts as 预计.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/im-fell-english/400.css";
import "@fontsource/im-fell-english/400-italic.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Hallows, Hook, Samhain, Thesis } from "./H1";
import { Boom, Cards, Guising, Souling } from "./H2";
import { Lift, Mexico, Obon, Zhongyuan } from "./H3";

export const Halloween: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: "#0E0B12", overflow: "hidden" }}>
      <Thesis t={t} />
      <Samhain t={t} />
      <Hallows t={t} />
      <Souling t={t} />
      <Guising t={t} />
      <Cards t={t} />
      <Boom t={t} />
      <Mexico t={t} />
      <Zhongyuan t={t} />
      <Obon t={t} />
      <Lift t={t} />
      <Hook t={t} />
      <Audio src={staticFile("halloween_score.wav")} />
    </AbsoluteFill>
  );
};

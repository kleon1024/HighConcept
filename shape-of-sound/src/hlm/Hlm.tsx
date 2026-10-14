// 红楼 · 第一页就写好了所有人的结局 — a 90-second film. A garden wall's plum-blossom window looks onto 改琦's woodblock
// portraits; the novel is set in black type and the 脂砚斋 commentary brushed beside it in red. The first page: the
// leftover stone, the author's punning names, every name a spoiler, 元迎探惜 = 原应叹息; the happiest night and its four
// prophetic plays; the dream and the register; 葬花; 好了歌; why he knew; white everywhere; then the first page again.
// Timing: hlm.json; score: music/hlm.py.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/noto-serif-sc/700.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/zhi-mang-xing/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Game, Hook, Names, Stone } from "./H1";
import { Garden, Register, Sisters, Turn } from "./H2";
import { Haole, Lift, White, Why, Zanghua } from "./H3";

export const Hlm: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: "#F1E9DA", overflow: "hidden" }}>
      <Hook t={t} />
      <Stone t={t} />
      <Names t={t} />
      <Game t={t} />
      <Sisters t={t} />
      <Garden t={t} />
      <Turn t={t} />
      <Register t={t} />
      <Zanghua t={t} />
      <Haole t={t} />
      <Why t={t} />
      <White t={t} />
      <Lift t={t} />
      <Audio src={staticFile("hlm_score.wav")} />
    </AbsoluteFill>
  );
};

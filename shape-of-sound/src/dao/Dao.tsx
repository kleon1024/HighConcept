// 道 · 空 — a 78-second film on Laozi's and Zhuangzi's emptiness: 「空，才有用」. One empty ink circle becomes a
// wheel's hub, a bowl's hollow and a moon gate (道德经 第十一章); Ma Yuan's lone fisherman shows what 留白 does; water
// (上善若水, 七十八章); the cook whose knife only travels the gaps (庄子·养生主); the useless tree (人间世); taiji (有无
// 相生, 反者道之动); the butterfly (齐物论); a modern month filled with ink until nothing is left white; and back to the
// cold river, where the circle becomes the moon: 「给生活，留一点白」. Timing: dao.json; score: music/dao.py.
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/noto-serif-sc/600.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/ma-shan-zheng/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Hook, Title } from "./D1";
import { Cook, Fly, Liubai, Tree, Water } from "./D2";
import { Busy, End, Taiji } from "./D3";

export const Dao: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  return (
    <AbsoluteFill style={{ background: "#EEE6D3", overflow: "hidden" }}>
      <Title t={t} />
      <Liubai t={t} />
      <Water t={t} />
      <Cook t={t} />
      <Tree t={t} />
      <Taiji t={t} />
      <Fly t={t} />
      <Busy t={t} />
      <End t={t} />
      <Hook t={t} />
      <Audio src={staticFile("dao_score.wav")} />
    </AbsoluteFill>
  );
};

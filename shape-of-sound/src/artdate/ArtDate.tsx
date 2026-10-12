// 看不懂也能装：美术馆约会腔调指南 — a 4:3 date guide through four halls (see ARTDATE_STORYBOARD.md)
import "@fontsource/noto-serif-sc/500.css";
import "@fontsource/noto-serif-sc/700.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-sans-sc/500.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/700.css";
import "@fontsource/zcool-qingke-huangyou/400.css";
import "@fontsource/poiret-one/400.css";
import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { clamp01, inCubic, outExpo, range, VH, VW } from "./motion";
import { Scene } from "./Scene";
import { Overlay, useT } from "./UI";

// camera-lens effects on the painted scene: the panic freeze, the squint, rack focus onto the cards
const lens = (t: number) => {
  const fr = t >= 3.0 && t < 4.0 ? 1 : t >= 4.0 && t < 4.3 ? 1 - outExpo((t - 4.0) / 0.3) : 0;
  const sq = range(t, 26.9, 27.15) * (1 - range(t, 27.6, 27.8));
  const lines = [[13.5, 15.85], [24.0, 25.95], [38.5, 40.85], [54.5, 56.95]];
  let rf = 0; for (const [a, b] of lines) rf = Math.max(rf, clamp01((t - a) / 0.3) * (1 - clamp01((t - b + 0.3) / 0.3)));
  return { fr, sq, rf };
};

export const ArtDate: React.FC = () => {
  const t = useT(), { fr, sq, rf } = lens(t);
  const filter = [fr > 0 ? `grayscale(${0.85 * fr}) contrast(${1 + 0.15 * fr}) brightness(${1 - 0.1 * fr})` : "", sq > 0 ? `blur(${sq * 7}px)` : "", rf > 0 ? `blur(${rf * 2.2}px)` : ""].join(" ").trim();
  return (
    <AbsoluteFill style={{ background: "#14110E", overflow: "hidden" }}>
      <Scene style={{ filter: filter || undefined, transform: fr > 0 ? `scale(${1 + 0.02 * fr})` : undefined }} />
      {sq > 0 && (<>
        <div style={{ position: "absolute", left: -40, right: -40, top: -VH * 0.6 + VH * 0.48 * sq, height: VH * 0.62, background: "#0E0C0A", borderRadius: "0 0 50% 50% / 0 0 30% 30%" }} />
        <div style={{ position: "absolute", left: -40, right: -40, bottom: -VH * 0.6 + VH * 0.48 * sq, height: VH * 0.62, background: "#0E0C0A", borderRadius: "50% 50% 0 0 / 30% 30% 0 0" }} />
      </>)}
      <Overlay />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: inCubic(range(t, 72.6, 73)), background: "#000" }} />
      <Audio src={staticFile("artdate_score.wav")} />
      <div style={{ width: VW, height: 0 }} />
    </AbsoluteFill>
  );
};

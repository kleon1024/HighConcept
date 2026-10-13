// 意义，从哪来？— Western philosophy in 60 seconds, as one question answered fifteen ways, each answer in the art and
// the music of its age. Timing: meaning.json; score: music/meaning.py; artworks: media/media.json (me_*).
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/archivo-black/400.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { GOLD, INK, PAPER, SEG, clamp01, range } from "./base";
import { Cut, CutKind, Frame, Grain, Timeline } from "./Kit";
import { God, Hook, Kynic, Plato, Renais, Stoic } from "./SegA";
import { Cogito, Ethics, Marx, Nietz, Will } from "./SegB";
import { Cynic, End, Exist, Fouc, Post, Witt } from "./SegC";

const SCENES: [number, number, React.FC<{ t: number }>][] = [
  [0, 6.0, Hook], [6.0, 9.5, Plato], [9.5, 12.5, Kynic], [12.5, 15.5, Stoic], [15.5, 19.0, God], [19.0, 22.0, Renais], [22.0, 25.0, Cogito],
  [25.0, 29.0, Ethics], [29.0, 32.5, Will], [32.5, 35.5, Marx], [35.5, 39.5, Nietz], [39.5, 43.0, Exist], [43.0, 46.0, Witt],
  [46.0, 49.0, Fouc], [49.0, 51.5, Post], [51.5, 54.5, Cynic], [54.5, 60.01, End],
];
const CUTS: [number, CutKind, string, string][] = [
  [6.0, "flash", "#FFF4C8", INK], [9.5, "wipe", GOLD, "#2B1B10"], [12.5, "pixel", "#E8C26A", "#7A2E1C"], [15.5, "shutter", GOLD, "#05081C"],
  [19.0, "wipe", "#B3401F", "#E8D9B5"], [22.0, "iris", GOLD, "#070504"], [25.0, "slats", PAPER, "#2E4A7A"], [29.0, "flash", "#F4F6F8", INK],
  [32.5, "slats", "#C8102E", INK], [35.5, "shutter", "#D9541E", "#280804"], [39.5, "wipe", "#C8102E", "#111111"], [43.0, "pixel", "#D12C1F", INK],
  [46.0, "iris", "#3FE0FF", "#050608"], [49.0, "glitch", "#FF2A6D", INK], [51.5, "glitch", "#4F8BFF", INK], [54.5, "iris", GOLD, INK],
];
const LIGHT = new Set(["renais", "marx", "exist", "witt", "post"]);

export const Meaning: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  const seg = SEG.find((s) => t >= s.t && t < s.out);
  const light = seg ? LIGHT.has(seg.id) : false;
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: INK }}>
      {SCENES.map(([a, b, C], i) => (t >= a && t < b ? <C key={i} t={t} /> : null))}
      <Frame t={t} light={light} />
      <div style={{ position: "absolute", inset: 0, opacity: clamp01(range(t, 6.0, 6.3)) * (1 - clamp01(range(t, 54.3, 54.5))) }}><Timeline t={t} light={light} /></div>
      {CUTS.map(([at, kind, c, c2], i) => <Cut key={i} t={t} at={at} kind={kind} c={c} c2={c2} />)}
      <Grain t={t} />
      <Audio src={staticFile("meaning_score.wav")} />
    </AbsoluteFill>
  );
};

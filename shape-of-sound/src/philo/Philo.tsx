// 提灯的人 — 60 seconds of Western philosophy carried by one lamp: Diogenes at noon looking for "a human", Socrates,
// Plato, Aristotle, the Cynics, Bentham and Mill, Schopenhauer, Nietzsche's madman (another lamp at noon), Sartre and
// Camus, Foucault (whose last lectures were about Diogenes), and modern cynicism. Timing: philo.json; score: music/philo.py.
import "@fontsource/noto-sans-sc/700.css";
import "@fontsource/noto-sans-sc/900.css";
import "@fontsource/noto-serif-sc/900.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/space-grotesk/700.css";
import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { PJ, SEC, clamp01, eInOut, range } from "./base";
import { Header, Iris, Ruler, inkFor } from "./Kit";
import { Classic, Hook, Kynic, Title } from "./ScenesA";
import { Exist, Nihil, Schop, Util } from "./ScenesB";
import { Cynic, End, Fouc } from "./ScenesC";

const SCENES: [number, number, React.FC<{ t: number }>][] = [
  [0, 6.0, Hook], [6.0, 8.0, Title], [8.0, 14.0, Classic], [14.0, 20.0, Kynic], [20.0, 26.0, Util], [26.0, 32.0, Schop],
  [32.0, 38.0, Nihil], [38.0, 44.0, Exist], [44.0, 50.0, Fouc], [50.0, 54.0, Cynic], [54.0, 60.01, End],
];

export const Philo: React.FC = () => {
  const f = useCurrentFrame(), { fps } = useVideoConfig();
  const t = f / fps;
  const sec = SEC.find((s) => t >= s.t && t < s.out);
  const rulerInk = sec ? inkFor(sec.bg) : "#F6EEDC";
  const rulerVis = 1 - clamp01(range(t, 53.6, 54.0));
  return (
    <AbsoluteFill style={{ overflow: "hidden", background: "#0B0907" }}>
      {SCENES.map(([a, b, C], i) => {
        const I = PJ.iris.find((x) => Math.abs(x.t - a) < 1e-6);
        const pre = I ? I.dur : 0;
        if (t < a - pre || t >= b) return null;
        // a slow push-in across each scene, so no shot is ever static
        const push = 1 + 0.045 * clamp01((t - a) / (b - a));
        return <Iris key={i} t={t} start={a}><div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "60% 45%" }}><C t={t} /></div></Iris>;
      })}
      <Header t={t} />
      <div style={{ position: "absolute", inset: 0, opacity: rulerVis }}><Ruler t={t} ink={rulerInk} /></div>
      <Audio src={staticFile("philo_score.wav")} />
    </AbsoluteFill>
  );
};
export { eInOut };

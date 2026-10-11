import React from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { Audio } from "@remotion/media";
import { Grain, TL } from "./theme";
import { Open, Ratios, Vibration } from "./scenes1";
import { Chords, Rhythm, Twelve } from "./scenes2";
import { Finale, Genres } from "./scenes3";

// every scene sits on the shared timeline (seconds → frames)
export const ShapeOfSound: React.FC = () => {
  const { fps } = useVideoConfig();
  const seq = (a: number, b: number) => ({ from: Math.round(a * fps), durationInFrames: Math.round((b - a) * fps), premountFor: fps });
  return (
    <AbsoluteFill style={{ background: "#0E0E12" }}>
      <Sequence name="Open" {...seq(0, TL.c1.start)}><Open /></Sequence>
      <Sequence name="01 Vibration" {...seq(TL.c1.start, TL.c2.start)}><Vibration /></Sequence>
      <Sequence name="02 Ratios" {...seq(TL.c2.start, TL.c3.start)}><Ratios /></Sequence>
      <Sequence name="03 Twelve notes" {...seq(TL.c3.start, TL.c4.start)}><Twelve /></Sequence>
      <Sequence name="04 Scales & chords" {...seq(TL.c4.start, TL.c5.start)}><Chords /></Sequence>
      <Sequence name="05 Rhythm" {...seq(TL.c5.start, TL.c6.start)}><Rhythm /></Sequence>
      <Sequence name="06 Genres" {...seq(TL.c6.start, TL.finale.start)}><Genres /></Sequence>
      <Sequence name="Finale" {...seq(TL.finale.start, TL.duration)}><Finale /></Sequence>
      <Grain />
      <Audio src={staticFile("score.wav")} />
    </AbsoluteFill>
  );
};

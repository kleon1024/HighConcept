import React from "react";
import { staticFile } from "remotion";
import { Audio } from "@remotion/media";
import { C } from "../theme";
import { Abs, Grain, Progress, SEC, Section } from "./kit";
import { Cold, NeuronScene, Pond, Problem, Title } from "./scenesA";
import { Nobel, Reveal, Sight, Switch, Transplant } from "./scenesB";

export const Opto: React.FC = () => (
  <Abs style={{ background: C.ink }}>
    <Section s={SEC.cold} first><Cold /></Section>
    <Section s={SEC.title}><Title /></Section>
    <Section s={SEC.problem}><Problem /></Section>
    <Section s={SEC.neuron}><NeuronScene /></Section>
    <Section s={SEC.pond}><Pond /></Section>
    <Section s={SEC.transplant}><Transplant /></Section>
    <Section s={SEC.switch}><Switch /></Section>
    <Section s={SEC.reveal}><Reveal /></Section>
    <Section s={SEC.sight}><Sight /></Section>
    <Section s={SEC.nobel}><Nobel /></Section>
    <Progress />
    <Grain />
    <Audio src={staticFile("opto_score.wav")} />
  </Abs>
);

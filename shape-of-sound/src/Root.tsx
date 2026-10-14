import { Composition } from "remotion";
import { ShapeOfSound } from "./Video";
import { Nobel2026 } from "./nobel/Nobel";
import NB from "./nobel/nobel.json";
import { IceCube } from "./icecube/IceCube";
import IC from "./icecube/icecube.json";
import { Opto } from "./opto/Opto";
import OP from "./opto/opto.json";
import T from "./timeline.json";
import { ArtDate } from "./artdate/ArtDate";
import AD from "./artdate/artdate.json";
import { Elements } from "./elements/Elements";
import EJ from "./elements/elements.json";
import { Elements60 } from "./elements60/Elements60";
import E6 from "./elements60/e60.json";
import { Philo } from "./philo/Philo";
import PH from "./philo/philo.json";
import { Meaning } from "./meaning/Meaning";
import MN from "./meaning/meaning.json";
import { Nihil } from "./nihil/Nihil";
import { Buddha } from "./buddha/Buddha";
import { Love } from "./love/Love";
import { Ocean } from "./ocean/Ocean";
import OC from "./ocean/ocean.json";
import LV from "./love/love.json";
import BD from "./buddha/buddha.json";
import NH from "./nihil/nihil.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ShapeOfSound" component={ShapeOfSound} durationInFrames={T.duration * T.fps} fps={T.fps} width={1920} height={1080} />
      <Composition id="Nobel2026" component={Nobel2026} durationInFrames={NB.duration * NB.fps} fps={NB.fps} width={NB.width} height={NB.height} />
      <Composition id="IceCube" component={IceCube} durationInFrames={IC.duration * IC.fps} fps={IC.fps} width={IC.width} height={IC.height} />
      <Composition id="Optogenetics" component={Opto} durationInFrames={OP.duration * OP.fps} fps={OP.fps} width={OP.width} height={OP.height} />
      <Composition id="Elements" component={Elements} durationInFrames={EJ.duration * EJ.fps} fps={EJ.fps} width={EJ.width} height={EJ.height} />
      <Composition id="Elements60" component={Elements60} durationInFrames={E6.duration * E6.fps} fps={E6.fps} width={E6.width} height={E6.height} />
      <Composition id="Philo" component={Philo} durationInFrames={PH.duration * PH.fps} fps={PH.fps} width={PH.width} height={PH.height} />
      <Composition id="Meaning" component={Meaning} durationInFrames={MN.duration * MN.fps} fps={MN.fps} width={MN.width} height={MN.height} />
      <Composition id="Nihil" component={Nihil} durationInFrames={NH.duration * NH.fps} fps={NH.fps} width={NH.width} height={NH.height} />
      <Composition id="Buddha" component={Buddha} durationInFrames={BD.duration * BD.fps} fps={BD.fps} width={BD.width} height={BD.height} />
      <Composition id="Love" component={Love} durationInFrames={LV.duration * LV.fps} fps={LV.fps} width={LV.width} height={LV.height} />
      <Composition id="Ocean" component={Ocean} durationInFrames={OC.duration * OC.fps} fps={OC.fps} width={OC.width} height={OC.height} />
      <Composition id="ArtDate" component={ArtDate} durationInFrames={AD.duration * AD.fps} fps={AD.fps} width={AD.width} height={AD.height} />
    </>
  );
};

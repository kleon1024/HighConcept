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

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ShapeOfSound" component={ShapeOfSound} durationInFrames={T.duration * T.fps} fps={T.fps} width={1920} height={1080} />
      <Composition id="Nobel2026" component={Nobel2026} durationInFrames={NB.duration * NB.fps} fps={NB.fps} width={NB.width} height={NB.height} />
      <Composition id="IceCube" component={IceCube} durationInFrames={IC.duration * IC.fps} fps={IC.fps} width={IC.width} height={IC.height} />
      <Composition id="Optogenetics" component={Opto} durationInFrames={OP.duration * OP.fps} fps={OP.fps} width={OP.width} height={OP.height} />
      <Composition id="Elements" component={Elements} durationInFrames={EJ.duration * EJ.fps} fps={EJ.fps} width={EJ.width} height={EJ.height} />
      <Composition id="ArtDate" component={ArtDate} durationInFrames={AD.duration * AD.fps} fps={AD.fps} width={AD.width} height={AD.height} />
    </>
  );
};

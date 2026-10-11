import { Composition } from "remotion";
import { ShapeOfSound } from "./Video";
import { Nobel2026 } from "./nobel/Nobel";
import NB from "./nobel/nobel.json";
import T from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ShapeOfSound" component={ShapeOfSound} durationInFrames={T.duration * T.fps} fps={T.fps} width={1920} height={1080} />
      <Composition id="Nobel2026" component={Nobel2026} durationInFrames={NB.duration * NB.fps} fps={NB.fps} width={NB.width} height={NB.height} />
    </>
  );
};

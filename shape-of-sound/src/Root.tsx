import { Composition } from "remotion";
import { ShapeOfSound } from "./Video";
import T from "./timeline.json";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="ShapeOfSound" component={ShapeOfSound} durationInFrames={T.duration * T.fps} fps={T.fps} width={1920} height={1080} />
    </>
  );
};

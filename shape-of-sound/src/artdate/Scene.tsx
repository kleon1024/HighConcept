// The painted gallery: one <canvas> redrawn every frame (pure function of time).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { continueRender, delayRender, useCurrentFrame } from "remotion";
import { FPS, VH, VW } from "./motion";
import { loadAssets, renderFrame } from "./render";

export const Scene: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const frame = useCurrentFrame(), ref = useRef<HTMLCanvasElement>(null);
  const [handle] = useState(() => delayRender("artdate assets"));
  const [ready, setReady] = useState(false);
  useEffect(() => { loadAssets().then(() => { setReady(true); continueRender(handle); }); }, [handle]);
  useLayoutEffect(() => {
    if (!ready || !ref.current) return;
    const ctx = ref.current.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, VW, VH);
    renderFrame(ctx, frame / FPS);
  }, [frame, ready]);
  return <canvas ref={ref} width={VW} height={VH} style={{ position: "absolute", inset: 0, width: VW, height: VH, ...style }} />;
};

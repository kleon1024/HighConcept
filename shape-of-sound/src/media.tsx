// Real photos and footage, used sparingly where drawing can't carry the point. Files live in public/media (see media/media.json).
import React from "react";
import { Img, OffthreadVideo, staticFile } from "remotion";
import { clamp01, eInOut, eOut, FONT_UI, lerp, range, useT } from "./theme";

// small credit line: "图：author · licence"
export const Credit: React.FC<{ text: string; color?: string; x?: number; y?: number; align?: "left" | "right" }> = ({ text, color = "#FFFFFF", x = 70, y = 1700, align = "left" }) => (
  <div style={{ position: "absolute", top: y, ...(align === "left" ? { left: x } : { right: x }), fontFamily: FONT_UI, fontWeight: 500, fontSize: 22, letterSpacing: 1, color, opacity: 0.6 }}>{text}</div>
);

// full-bleed photo with a slow push-in and a darkening gradient so type on top stays readable
export const Photo: React.FC<{
  src: string; at?: number; out?: number; zoom?: [number, number]; focus?: [number, number]; shade?: number; credit?: string; creditColor?: string; dur?: number; fade?: number;
  fit?: "cover" | "contain"; bg?: string; box?: React.CSSProperties;
}> = ({ src, at = 0, out = 99, zoom = [1.06, 1.16], focus = [50, 50], shade = 0.55, credit, creditColor, dur = 4, fade = 0.12, fit = "cover", bg = "#000", box }) => {
  const t = useT();
  if (t < at || t > out + fade) return null;
  const k = eInOut(range(t, at, at + dur)), op = clamp01((t - at) / fade) * (1 - clamp01((t - out) / fade));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op, overflow: "hidden", background: bg }}>
      <Img src={staticFile(src)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...box, objectFit: fit, objectPosition: `${focus[0]}% ${focus[1]}%`, scale: `${lerp(zoom[0], zoom[1], k)}`, transformOrigin: `${focus[0]}% ${focus[1]}%` }} />
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(0,0,0,${shade}) 0%, rgba(0,0,0,${shade * 0.25}) 45%, rgba(0,0,0,${shade}) 100%)` }} />
      {credit && <Credit text={credit} color={creditColor} />}
    </div>
  );
};

// a framed inset (photo or video) that pops in, labelled as real footage
export const Inset: React.FC<{
  src: string; video?: boolean; at: number; out?: number; x: number; y: number; w: number; h: number; label?: string; credit?: string; ink?: string; radius?: number; startFrom?: number; rate?: number;
}> = ({ src, video, at, out = 99, x, y, w, h, label, credit, ink = "#0E0E12", radius = 28, startFrom = 0, rate = 1 }) => {
  const t = useT();
  if (t < at - 0.05 || t > out + 0.35) return null;
  const a = eOut(range(t, at, at + 0.4)), e = clamp01((t - out) / 0.3);
  return (
    <div style={{ position: "absolute", left: x, top: y, width: w, opacity: a * (1 - e), translate: `0px ${(1 - a) * 40}px`, scale: `${lerp(0.92, 1, a)}` }}>
      <div style={{ width: w, height: h, borderRadius: radius, overflow: "hidden", boxShadow: `0 0 0 6px ${ink}`, background: "#000" }}>
        {video
          ? <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} playbackRate={rate} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
      </div>
      {label && <div style={{ position: "absolute", left: 18, top: 16, fontFamily: FONT_UI, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: "#FFFFFF", background: "rgba(0,0,0,0.55)", padding: "6px 12px", borderRadius: 10 }}>{label}</div>}
      {credit && <div style={{ marginTop: 12, fontFamily: FONT_UI, fontWeight: 500, fontSize: 20, color: ink, opacity: 0.6 }}>{credit}</div>}
    </div>
  );
};

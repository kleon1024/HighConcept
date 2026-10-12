// The new cold open (0–14 s): a metal melts in your hand → it was predicted before anyone saw it → "almost all right"
// → "how did he know?". It hands over to the title on an ink background with the empty grid, exactly like before.
import React from "react";
import { Img, staticFile } from "remotion";
import { FAM, P, T, backOut, bounce, camAt, clamp01, eIn, eInOut, eOut, lerp, makeProj, posAt, range, win, EL } from "./core";
import { Chars, FONT_BIG, FONT_CN, FONT_SYM, Sticker } from "./UI";

const HK = (T as unknown as { hook: Record<string, number | number[]> }).hook;
const n = (k: string) => HK[k] as number;
const INK = P.ink, SKIN = "#F4C7A1", SKIN2 = "#E2A882";

// a big kinetic line: characters drop in with a spring
const Big: React.FC<{ text: string; t: number; at: number; out: number; size: number; color?: string; shadow?: string; top: number; stagger?: number }> = ({ text, t, at, out, size, color = "#FFFFFF", shadow = INK, top, stagger = 0.04 }) => {
  const k = win(t, at, out, 0.01, 0.25);
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, textAlign: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: size, color, lineHeight: 1.1, textShadow: `7px 7px 0 ${shadow}`, opacity: k }}>
      {Array.from(text).map((ch, i) => {
        const d = range(t, at + i * stagger, at + i * stagger + 0.35);
        return <span key={i} style={{ display: "inline-block", opacity: d > 0 ? 1 : 0, transform: `translateY(${(1 - backOut(d, 2.2)) * 60}px) scale(${0.6 + 0.4 * backOut(d, 2.2)})` }}>{ch}</span>;
      })}
    </div>
  );
};

// ── the hand and the melting gallium cube
const Hand: React.FC<{ t: number }> = ({ t }) => {
  const rise = eOut(range(t, 0.0, 0.45));
  const m = eInOut(range(t, n("melt0"), n("melt1")));            // 0 = a crisp cube, 1 = a puddle in the palm
  const cx = 960, cy = 720, s = 128;
  const hgt = s * 1.35 * (1 - m) + 8;
  const top = cy - hgt;
  const rx = s * 1.15 + 120 * m, ry = 26 + 22 * m;
  const sway = Math.sin(t * 2.2) * 4;
  const drips = [[-0.55, 0.15], [0.35, 0.35], [0.75, 0.55]].map(([fx, d0], i) => {
    const k = range(t, n("melt0") + 0.8 + d0 * 2, n("melt1") + 0.6 + d0 * 2);
    return { x: cx + fx * rx, len: 30 + 230 * eIn(k), drop: range(t, n("melt1") + 0.3 + i * 0.25, n("melt1") + 0.9 + i * 0.25), i };
  });
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - rise) * 500 + sway}px)` }}>
      {/* the hand: an open palm from below, superflat */}
      <g stroke={INK} strokeWidth={9} strokeLinejoin="round" fill={SKIN}>
        {[[-215, 480, 0.94], [-75, 420, 1], [65, 430, 0.98], [195, 500, 0.9]].map(([dx, h, sc], i) => (
          <rect key={i} x={cx + dx - 52} y={cy - h * 0.62} width={104 * sc} height={h} rx={52} transform={`rotate(${(i - 1.5) * 6} ${cx + dx} ${cy + 200})`} />
        ))}
        <path d={`M ${cx - 300} ${cy + 40} C ${cx - 330} ${cy + 260} ${cx - 220} ${cy + 520} ${cx - 120} ${cy + 560} L ${cx + 190} ${cy + 560} C ${cx + 300} ${cy + 420} ${cx + 320} ${cy + 200} ${cx + 290} ${cy + 20} Z`} />
        <path d={`M ${cx - 300} ${cy + 120} C ${cx - 420} ${cy + 40} ${cx - 520} ${cy - 40} ${cx - 560} ${cy - 120} C ${cx - 590} ${cy - 175} ${cx - 520} ${cy - 215} ${cx - 470} ${cy - 165} C ${cx - 420} ${cy - 110} ${cx - 360} ${cy - 40} ${cx - 270} ${cy + 20} Z`} />
      </g>
      <path d={`M ${cx - 170} ${cy + 180} C ${cx - 60} ${cy + 230} ${cx + 80} ${cy + 220} ${cx + 180} ${cy + 150}`} fill="none" stroke={SKIN2} strokeWidth={10} strokeLinecap="round" />
      {/* drips running down the palm, a drop falling off */}
      {drips.map((d) => (
        <g key={d.i} opacity={m > 0.25 ? 1 : 0}>
          <path d={`M ${d.x} ${cy} L ${d.x} ${cy + d.len}`} stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <path d={`M ${d.x} ${cy} L ${d.x} ${cy + d.len}`} stroke="#C9D2DE" strokeWidth={20} strokeLinecap="round" />
          <path d={`M ${d.x - 4} ${cy + 10} L ${d.x - 4} ${cy + d.len - 10}`} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
          {d.drop > 0 && d.drop < 1 && <ellipse cx={d.x} cy={cy + d.len + 30 + 420 * eIn(d.drop)} rx={13} ry={17} fill="#C9D2DE" stroke={INK} strokeWidth={5} />}
        </g>
      ))}
      {/* the puddle */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#C9D2DE" stroke={INK} strokeWidth={8} />
      <ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.25} rx={rx * 0.32} ry={ry * 0.22} fill="#FFFFFF" opacity={0.85} />
      {/* the cube, slumping as it melts: corners round off, the top sinks, the sides bulge */}
      {m < 0.97 && (() => {
        const w = s * (1 + 0.35 * m), r = 6 + 60 * m, bul = 30 * m;
        const L = cx - w, R = cx + w, B = cy - 4, Tp = top;
        const d = `M ${L} ${B} C ${L - bul} ${B - (B - Tp) * 0.4} ${L} ${Tp + r} ${L + r} ${Tp} L ${R - r} ${Tp} C ${R} ${Tp + r} ${R + bul} ${B - (B - Tp) * 0.4} ${R} ${B} Z`;
        return (
          <g>
            <path d={d} fill="#B8C2D1" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
            <path d={`M ${cx} ${Tp + 2} L ${cx} ${B}`} stroke="#9AA6B8" strokeWidth={6} opacity={1 - m} />
            <rect x={L + 18} y={Tp + 16} width={w * 0.5} height={Math.max(4, (B - Tp) * 0.18)} rx={8} fill="#FFFFFF" opacity={0.85 * (1 - m * 0.6)} />
            {m < 0.5 && <text x={cx} y={B - (B - Tp) * 0.32} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={72} fill={INK} opacity={1 - m * 2}>Ga</text>}
          </g>
        );
      })()}
    </svg>
  );
};

// ── the mystery tile: a dashed "?" with Mendeleev's predictions, which flips to gallium and gets ticked off
const PRED = [["原子量", "≈ 68", "69.7"], ["密度", "≈ 6", "5.9"], ["熔点", "很低", "29.8°C"]];
const Mystery: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, n("cut"), n("fly"), 0.25, 0.01);
  if (k <= 0 && t < n("fly")) return null;
  const flip = range(t, n("flip"), n("flip") + 0.5), fl = eInOut(flip);
  const fly = eInOut(range(t, n("fly"), n("fly") + 0.9));
  // fly from the centre to gallium's square in the (still empty) table
  const cam = camAt(13.4), pr = makeProj(cam), ga = EL[30];
  const [x, y] = posAt(ga, 0, 13.4); const dst = pr.p(x + 0.5, y + 0.5, 0.2);
  const hero = eInOut(range(t, n("slam") + 0.1, n("slam") + 0.6));
  const size = lerp(lerp(320, 360, hero), cam.z * 0.9, fly), cx = lerp(lerp(620, 960, hero), dst[0], fly), cy = lerp(lerp(600, 640, hero), dst[1], fly);
  const gone = range(t, n("fly") + 0.7, n("fly") + 1.1);
  const scaleX = Math.abs(Math.cos(fl * Math.PI)), solid = fl > 0.5;
  const pop = backOut(range(t, n("cut"), n("cut") + 0.45), 2.2);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - gone }}>
      <div style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, transform: `scaleX(${Math.max(0.02, scaleX)}) scale(${pop})` }}>
        {solid ? (
          <div style={{ width: "100%", height: "100%", background: FAM.pt.c, border: `${Math.max(3, size / 28)}px solid ${INK}`, borderRadius: size * 0.08, boxShadow: `${size / 22}px ${size / 22}px 0 ${INK}`, position: "relative", fontFamily: FONT_SYM, fontWeight: 700, color: INK }}>
            <div style={{ position: "absolute", left: size * 0.09, top: size * 0.05, fontSize: size * 0.16 }}>31</div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.42, paddingTop: size * 0.02 }}>Ga</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: size * 0.06, textAlign: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: size * 0.15 }}>镓</div>
          </div>
        ) : (
          <div style={{ width: "100%", height: "100%", border: `${Math.max(3, size / 40)}px dashed #FFFFFF`, borderRadius: size * 0.08, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SYM, fontWeight: 700, fontSize: size * 0.6, color: "#FF5B4F", transform: `scale(${1 + 0.05 * Math.sin(t * 7)})` }}>?</div>
        )}
      </div>
      {t < n("slam") + 0.35 && (
        <div style={{ opacity: 1 - eIn(range(t, n("slam") - 0.05, n("slam") + 0.3)) }}>
          {/* who predicted it */}
          <div style={{ position: "absolute", left: 460, top: 330, opacity: eOut(range(t, n("cut") + 0.4, n("cut") + 0.8)), display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 32, overflow: "hidden", border: `4px solid #FFFFFF` }}>
              <Img src={staticFile("media/el_mendeleev.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 20%" }} />
            </div>
            <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 36, color: "#FFFFFF" }}>{solid ? "1875 · 被找到：镓" : "1871 · 门捷列夫预言：类铝"}</div>
          </div>
          {/* the predictions, then the real values ticked off */}
          <div style={{ position: "absolute", left: 870, top: 460, display: "flex", flexDirection: "column", gap: 26 }}>
            {PRED.map(([a, p, real], i) => {
              const tp = (HK.props as number[])[i], tc = (HK.checks as number[])[i];
              const kp = range(t, tp, tp + 0.4), kc = range(t, tc, tc + 0.3);
              if (kp <= 0) return null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, fontFamily: FONT_CN, fontWeight: 900, fontSize: 60, color: "#FFFFFF", opacity: eOut(kp), transform: `translateX(${(1 - eOut(kp)) * 40}px)` }}>
                  <span style={{ width: 150, opacity: 0.7, fontSize: 40 }}>{a}</span>
                  <span style={{ width: 170 }}><Chars text={p} t={t} at={tp} stagger={0.06} /></span>
                  {kc > 0 && <>
                    <span style={{ fontFamily: FONT_SYM, fontWeight: 700, color: "#FFD23F", width: 230 }}>{real}</span>
                    <span style={{ fontSize: 64, color: "#2FC27E", transform: `scale(${backOut(kc, 3)})`, display: "inline-block" }}>✓</span>
                  </>}
                </div>
              );
            })}
            {t > (HK.checks as number[])[0] - 0.4 && <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 22, letterSpacing: 2, color: "#9AA3D8", marginLeft: 168 }}>预言 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;实测</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export const Hook: React.FC<{ t: number }> = ({ t }) => {
  if (t > 14.05) return null;
  const handOut = 1 - eIn(range(t, n("cut") - 0.15, n("cut")));
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {t < n("cut") && (
        <div style={{ position: "absolute", inset: 0, opacity: handOut }}>
          <div style={{ position: "absolute", inset: 0, opacity: win(t, n("temp"), n("cut"), 0.2, 0.2), display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_BIG, fontSize: 420, color: "#E0346F", letterSpacing: -8, paddingTop: 260 }}>29.8°C</div>
          <Hand t={t} />
          <Big text="这块金属，" t={t} at={0.15} out={n("cut")} size={118} top={70} />
          <Big text="会在你手心里融化。" t={t} at={1.1} out={n("cut")} size={118} top={210} stagger={0.05} />
          {t > n("temp") && (
            <div style={{ position: "absolute", right: 120, top: 560, transform: `scale(${backOut(range(t, n("temp"), n("temp") + 0.35), 2.5)}) rotate(-4deg)` }}>
              <Sticker bg="#FFD23F" style={{ padding: "12px 26px" }} radius={18}>
                <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: INK }}>熔点只有</div>
                <div style={{ fontFamily: FONT_BIG, fontSize: 76, color: INK, lineHeight: 1 }}>29.8°C</div>
              </Sticker>
            </div>
          )}
        </div>
      )}
      <Mystery t={t} />
      <Big text="1871 年，还没人见过它，" t={t} at={n("cut") + 0.1} out={n("flip") - 0.1} size={76} top={80} stagger={0.03} />
      <Big text="有人已经写出了它的样子：" t={t} at={n("cut") + 1.3} out={n("flip") - 0.1} size={76} top={185} stagger={0.03} />
      <Big text="1875 年，它被找到了——" t={t} at={n("flip") + 0.1} out={n("slam") - 0.05} size={76} top={120} stagger={0.03} />
      <Big text="几乎全中！" t={t} at={n("slam")} out={n("q1") - 0.05} size={190} color={INK} shadow="#FFFFFF" top={80} stagger={0.06} />
      <Big text="他从没见过它，" t={t} at={n("q1")} out={n("q2") - 0.05} size={110} color={INK} shadow="#FFFFFF" top={110} stagger={0.05} />
      <Big text="他是怎么知道的？" t={t} at={n("q2")} out={13.45} size={124} color={INK} shadow="#FFFFFF" top={100} stagger={0.05} />
    </div>
  );
};

export { clamp01, bounce };

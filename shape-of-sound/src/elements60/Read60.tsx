// 01 怎么读 (8–18 s): the number is the proton count; a row is an electron shell; a column is a temperament;
// and played in order, every row is the same rising run — the period you can hear.
import React from "react";
import { FAM, P, backOut, clamp01, eIn, eInOut, range } from "../elements/core";
import { EL6, T6, proj6 } from "./core60";
import { FONT_BIG, FONT_SYM } from "./Look60";
import { Kin, Sticker } from "./UI60";

const R = T6.read;
const WX = 1612, WY = 520;
const SHELLS = [2, 8, 18, 32, 32, 18, 8];

const Nucleus: React.FC<{ n: number; scale: number }> = ({ n, scale }) => {
  const nN = n <= 3 ? [0, 2, 4][n - 1] : Math.round(n * (1 + 0.5 * Math.min(1, (n - 3) / 115)));
  const N = n + nN, rb = Math.min(64, 220 / Math.sqrt(N));
  return (
    <g transform={`scale(${scale})`}>
      {Array.from({ length: N }, (_, i) => {
        const r = rb * 1.02 * Math.sqrt(i + 0.3), a = i * 2.39996;
        const proton = Math.floor(((i + 1) * n) / N) > Math.floor((i * n) / N);
        return <circle key={i} cx={r * Math.cos(a)} cy={r * Math.sin(a)} r={rb} fill={proton ? "#FF5B4F" : "#F6F0E4"} stroke={P.ink} strokeWidth={Math.max(2, rb * 0.16)} />;
      }).reverse()}
    </g>
  );
};

export const Read6: React.FC<{ t: number }> = ({ t }) => {
  if (t < R.start - 0.1 || t > R.end + 0.2) return null;
  const pr = proj6(t);
  // the count: 1, 2, 3 on the beats, then a rush to 118 with the table
  let n = 0;
  R.protons.forEach((p, i) => { if (t >= p) n = i + 1; });
  if (t >= R.count[0]) n = Math.min(118, Math.max(3, Math.round(3 + 115 * eIn(range(t, R.count[0], R.count[1] - 0.05)))));
  const cur = EL6[Math.max(0, n - 1)];
  const wIn = backOut(range(t, R.start, R.start + 0.35), 1.6), wOut = 1 - eIn(range(t, R.col1 - 0.25, R.col1));
  const shrink = eInOut(range(t, R.rings - 0.1, R.rings + 0.25));
  const lastP = n <= 3 ? R.protons[n - 1] ?? 0 : t;
  const punch = 1 + 0.12 * Math.exp(-(t - lastP) / 0.12);
  const ringsOn = t >= R.rings;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the widget: a nucleus, then electron shells around it */}
      {t < R.col1 && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: wOut }}>
          <g transform={`translate(${WX} ${WY}) scale(${wIn})`}>
            {ringsOn && SHELLS.map((ne, i) => {
              const at = R.rings + i * R.ringStep, k = backOut(range(t, at, at + 0.25), 1.8);
              if (k <= 0) return null;
              const rr = (82 + i * 26) * k;
              return (
                <g key={i}>
                  <circle r={rr} fill="none" stroke="#FFFFFF" strokeWidth={i === Math.floor((t - R.rings) / R.ringStep) ? 6 : 3} opacity={0.85} />
                  {Array.from({ length: Math.min(ne, 12) }, (_, j) => {
                    const a = (j / Math.min(ne, 12)) * Math.PI * 2 + (t - at) * (2.4 - i * 0.25) * (i % 2 ? -1 : 1);
                    return <circle key={j} cx={rr * Math.cos(a)} cy={rr * Math.sin(a)} r={7} fill="#FFD23F" stroke={P.ink} strokeWidth={2.5} />;
                  })}
                </g>
              );
            })}
            <g transform={`scale(${(1 - 0.72 * shrink) * (n <= 3 ? punch : 1)})`}><Nucleus n={Math.max(1, n)} scale={1} /></g>
          </g>
        </svg>
      )}
      {t >= R.start && t < R.rings && n > 0 && (
        <div style={{ position: "absolute", left: WX, top: 855, transform: `translateX(-50%) scale(${punch})`, display: "flex", alignItems: "baseline", gap: 18, color: "#FFFFFF", opacity: wOut, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 64, background: FAM[cur.fam].c, color: P.ink, padding: "0 14px", border: `5px solid ${P.ink}`, borderRadius: 6 }}>{cur.s}</span>
          <span style={{ fontFamily: FONT_BIG, fontSize: 130, lineHeight: 1 }}>{n}</span>
          <span style={{ fontFamily: "'Noto Sans SC'", fontWeight: 900, fontSize: 40 }}>个质子</span>
        </div>
      )}
      <Sticker t={t} at={R.start + 0.1} out={R.rings} x={WX} y={138} text="编号 = 质子数" size={56} anchor="center" bg="#FFD23F" />
      <Sticker t={t} at={R.rings} out={R.col1} x={WX} y={138} text="第几行 = 几层电子" size={52} anchor="center" bg="#FFFFFF" rot={2} />
      {/* row numbers beside the table */}
      {t >= R.rings && t < R.col1 && Array.from({ length: 7 }, (_, i) => {
        const at = R.rings + i * R.ringStep, k = backOut(range(t, at, at + 0.25), 2);
        const [x, y] = pr.p(-0.35, i + 0.5, 0);
        return k > 0 ? <div key={i} style={{ position: "absolute", left: x, top: y, transform: `translate(-100%, -50%) scale(${k})`, fontFamily: FONT_BIG, fontSize: 44, color: "#FFD23F",
          opacity: 1 - eIn(range(t, R.col1 - 0.25, R.col1)) }}>{i + 1}</div> : null;
      })}
      {/* columns: same outer electrons, same temper */}
      <Kin t={t} at={R.col1} out={R.rows[0]} text="同一列 = 同一种脾气" x={960} y={880} size={74} color="#FFFFFF" anchor="center" />
      {t >= R.col1 && t < R.rows[0] && (() => {
        const [ax, ay] = pr.p(0.5, 2.5, 2.5), [bx, by] = pr.p(17.5, 3.5, 1.9);
        return (
          <>
            <Sticker t={t} at={R.col1 + 0.3} out={R.rows[0]} x={ax + 20} y={ay - 120} text="外层 1 个电子 → 超活泼" size={42} bg={FAM.alk.c} rot={-3} />
            <Sticker t={t} at={R.col18 + 0.3} out={R.rows[0]} x={bx - 20} y={by - 120} text="外层满了 → 超淡定" size={42} bg={FAM.ng.c} rot={3} anchor="right" />
          </>
        );
      })()}
      {/* the glissandi */}
      <Kin t={t} at={R.rows[0] - 0.2} out={R.rows[3]} text="按顺序，弹一遍——" x={790} y={196} size={64} color="#FFFFFF" anchor="center" />
      <Kin t={t} at={R.rows[3]} out={R.period} text="听：每一行都在重复" x={790} y={196} size={64} color="#FFFFFF" anchor="center" />
      <Sticker t={t} at={R.period} out={R.end + 0.15} x={790} y={210} text={<span>这就是 <span style={{ color: "#FF3D7F" }}>「周期」</span></span>} size={84} bg="#FFD23F" anchor="center" rot={-3} />
      {/* a playhead runs along each row while it plays */}
      {t >= R.rows[0] && t < R.period && (
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {R.rows.map((t0, i) => {
            const k = (t - t0) / 0.42;
            if (k < 0 || k > 1.25) return null;
            const kk = Math.min(1, k), o = 1 - clamp01((k - 1) / 0.25);
            const xs = EL6.filter((e) => e.period === i + 1).sort((a, b) => a.z - b.z);
            const e = xs[Math.min(xs.length - 1, Math.floor(kk * (xs.length - 0.001)))];
            const [x0, y0] = pr.p(e.x + 0.5, e.y - 0.15, 0), [, y1] = pr.p(e.x + 0.5, e.y + 1.15, 0);
            return <g key={i} opacity={o}><line x1={x0} y1={y0} x2={x0} y2={y1} stroke="#FFD23F" strokeWidth={8} strokeLinecap="round" /><circle cx={x0} cy={y0} r={10} fill="#FFD23F" /></g>;
          })}
        </svg>
      )}
    </div>
  );
};

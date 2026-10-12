// The table as a stage: 118 blocks drawn with the 2.5D projection from ../elements/core, each block's state from core60.ts.
import React from "react";
import { FAM, P, Proj, isDark, lighten, mix, range, shade, eOut, win } from "../elements/core";
import { EL6, T6, Tile6, bgCol6, cam6, proj6, tile6 } from "./core60";

const FONT_SYM = "'Space Grotesk', 'Noto Sans SC', sans-serif";
const FONT_CN = "'Noto Sans SC', sans-serif";
const lum = (c: string) => { const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const poly = (pts: [number, number][]) => pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

// children drawn in a 0–100 square mapped onto a rectangle of the ground plane at height zt
export const Mapped6: React.FC<React.PropsWithChildren<{ pr: Proj; x: number; y: number; zt: number; w: number; hgt?: number }>> = ({ pr, x, y, zt, w, hgt, children }) => {
  const o = pr.p(x, y, zt), ex = pr.p(x + w, y, zt), ey = pr.p(x, y + (hgt ?? w), zt);
  const a = (ex[0] - o[0]) / 100, b = (ex[1] - o[1]) / 100, c = (ey[0] - o[0]) / 100, d = (ey[1] - o[1]) / 100;
  return <g transform={`matrix(${a} ${b} ${c} ${d} ${o[0]} ${o[1]})`}>{children}</g>;
};

export const Block6: React.FC<{ pr: Proj; s: Tile6; sym?: string; num?: string; cn?: string; dimTo: string; t: number; fam: string }> = ({ pr, s, sym, num, cn, dimTo, t, fam }) => {
  const g = 0.055, cx = s.x + 0.5, cy = s.y + 0.5, hw = (0.5 - g) * s.sx, hh = (0.5 - g) * s.sy;
  const x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh, z0 = s.drop, zt = z0 + s.h;
  const p = pr.p;
  const top: [number, number][] = [p(x0, y0, zt), p(x1, y0, zt), p(x1, y1, zt), p(x0, y1, zt)];
  if (s.ghost) {
    const dk = isDark(dimTo);
    return (
      <g>
        <polygon points={poly(top)} fill={s.q > 0 ? "rgba(255,255,255,0.85)" : dk ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.25)"}
          stroke={s.q > 0 ? "#FF3D3D" : dk ? "rgba(255,255,255,0.3)" : "rgba(20,20,43,0.3)"} strokeWidth={s.q > 0 ? 4 : 2} strokeDasharray="6 5" />
        {s.q > 0 && <Mapped6 pr={pr} x={x0} y={y0} zt={zt} w={x1 - x0}>
          <text x={50} y={76} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={76} fill="#FF3D3D" opacity={s.q}
            transform={`translate(50 50) scale(${1 + 0.1 * Math.sin(t * 9)}) translate(-50 -50)`}>?</text>
        </Mapped6>}
      </g>
    );
  }
  const base = mix(s.col, dimTo, s.dim);
  const topC = mix(lighten(base, s.glow * 0.45), "#FFFFFF", s.white * 0.85);
  const line = isDark(dimTo) && s.dim > 0.5 ? "rgba(255,255,255,0.18)" : P.ink;
  const faces: { pts: [number, number][]; fill: string }[] = [];
  if (pr.cosP > 0.02 && s.h > 0.01) {
    faces.push({ pts: [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, zt), p(x0, y1, zt)], fill: shade(base, 0.78) });
    if (pr.sinT > 0.005) faces.push({ pts: [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, zt), p(x1, y0, zt)], fill: shade(base, 0.62) });
    else if (pr.sinT < -0.005) faces.push({ pts: [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, zt), p(x0, y0, zt)], fill: shade(base, 0.62) });
  }
  const ink = lum(topC) > 0.42 ? P.ink : "#F6F0E4";
  const z = pr.zoom * Math.min(s.sx, s.sy);
  const sw = Math.max(1, Math.min(2, pr.zoom * s.sy / 40));
  return (
    <g>
      {faces.map((f, i) => <polygon key={i} points={poly(f.pts)} fill={f.fill} stroke={line} strokeOpacity={0.55} strokeWidth={1.3} strokeLinejoin="round" />)}
      <polygon points={poly(top)} fill={topC} stroke={line} strokeOpacity={0.85} strokeWidth={sw} strokeLinejoin="round" />
      {s.ring >= 0 && (() => {
        const r = 0.5 + 1.6 * s.ring;
        return <polygon points={poly([p(cx - r, cy - r, zt), p(cx + r, cy - r, zt), p(cx + r, cy + r, zt), p(cx - r, cy + r, zt)])} fill="none" stroke={FAM[fam].c} strokeWidth={4} opacity={1 - s.ring} />;
      })()}
      {s.glow > 0.02 && <polygon points={poly(top)} fill="none" stroke="#FFFFFF" strokeOpacity={Math.min(1, s.glow) * 0.9} strokeWidth={2 + 3 * Math.min(1, s.glow)} />}
      {s.label && z > 30 && s.sx > 0.3 && (
        <Mapped6 pr={pr} x={x0} y={y0} zt={zt} w={x1 - x0} hgt={y1 - y0}>
          {z > 56 && num && <text x={9} y={22} fontFamily={FONT_SYM} fontWeight={700} fontSize={17} fill={ink} opacity={0.75}>{num}</text>}
          <text x={50} y={z > 70 && cn ? 64 : 68} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={sym && sym.length > 1 ? 40 : 44} fill={ink}>{sym}</text>
          {z > 70 && cn && <text x={50} y={88} textAnchor="middle" fontFamily={FONT_CN} fontWeight={700} fontSize={17} fill={ink} opacity={0.8}>{cn}</text>}
        </Mapped6>
      )}
    </g>
  );
};

export const TableWorld6: React.FC<{ t: number }> = ({ t }) => {
  if (t < T6.hook.merge) return null;
  const cam = cam6(t), pr = proj6(t), dimTo = bgCol6(t);
  const items = EL6.map((e) => { const s = tile6(e, t); return { e, s, d: s.x * pr.sinT + s.y * pr.cosT + s.zi }; });
  items.sort((a, b) => a.d - b.d);
  // the ending's empty row 8: 18 dashed cells; 119 and 120 blink with a question mark
  const EN = T6.end;
  const row8 = t > EN.row8 ? Array.from({ length: 18 }, (_, i) => ({ i, k: eOut(range(t, EN.row8 + i * 0.03, EN.row8 + i * 0.03 + 0.3)) })) : [];
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {row8.map(({ i, k }) => {
        const s: Tile6 = { show: 1, ghost: true, q: i < 2 ? win(t, EN.q, 61, 0.3, 0.01) : 0, h: 0, drop: 0, col: "#000", dim: 0, glow: 0, white: 0, x: i, y: 7.0, sx: 1, sy: 1, zi: 0, label: false, ring: -1 };
        return (
          <g key={"r8" + i} opacity={k}>
            <Block6 pr={pr} s={s} dimTo={dimTo} t={t} fam="h" />
            {i < 2 && cam.z > 56 && <Mapped6 pr={pr} x={i + 0.055} y={7.055} zt={0} w={0.89}>
              <text x={9} y={22} fontFamily={FONT_SYM} fontWeight={700} fontSize={17} fill="#9A917F">{119 + i}</text>
            </Mapped6>}
          </g>
        );
      })}
      {items.map(({ e, s }) =>
        s.show <= 0.001 ? null : (
          <g key={e.z} opacity={s.show}>
            <Block6 pr={pr} s={s} sym={e.s} num={String(e.z)} cn={e.cn} dimTo={dimTo} t={t} fam={e.fam} />
          </g>
        ),
      )}
    </svg>
  );
};

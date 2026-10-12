// The 2.5D periodic table: every element is a little block; the camera, layout and each block's state come from core.ts.
import React from "react";
import { EL, P, Proj, T, Tile, camAt, clamp01, eOut, lighten, makeProj, mix, posAt, range, shade, tileAt, win } from "./core";

const FONT_SYM = "'Space Grotesk', 'Noto Sans SC', sans-serif";
const FONT_CN = "'Noto Sans SC', sans-serif";
const lum = (c: string) => { const v = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };

type Face = { pts: [number, number][]; fill: string };
const poly = (pts: [number, number][]) => pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");

// one block: top face (with its labels mapped onto it), and the two side faces the camera can see
const Block: React.FC<{ pr: Proj; x: number; y: number; z0: number; h: number; col: string; ghost?: boolean; st?: Tile;
  sym?: string; num?: string; cn?: string; dimTo: string; label?: boolean; q?: number; t: number }> = ({ pr, x, y, z0, h, col, ghost, st, sym, num, cn, dimTo, label = true, q = 0, t }) => {
  const g = 0.055, x0 = x + g, x1 = x + 1 - g, y0 = y + g, y1 = y + 1 - g, zt = z0 + h;
  const p = pr.p;
  const top: [number, number][] = [p(x0, y0, zt), p(x1, y0, zt), p(x1, y1, zt), p(x0, y1, zt)];
  if (ghost) {
    return (
      <g>
        <polygon points={poly(top)} fill={q > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.3)"} stroke={q > 0 ? "#FF5B4F" : dimTo === P.night ? "#3A4078" : "#BDB29C"} strokeWidth={q > 0 ? 3 : 2} strokeDasharray="6 5" />
        {q > 0 && <Mapped pr={pr} x={x0} y={y0} zt={zt} w={x1 - x0}>
          <text x={50} y={73} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={70} fill="#FF5B4F" opacity={q}
            transform={`translate(50 50) scale(${1 + 0.08 * Math.sin(t * 7)}) translate(-50 -50)`}>?</text>
        </Mapped>}
      </g>
    );
  }
  const dim = st?.dim ?? 0, glow = st?.glow ?? 0;
  const base = mix(col, dimTo, dim);
  const topC = lighten(base, glow * 0.45);
  const faces: Face[] = [];
  if (pr.cosP > 0.02) {
    faces.push({ pts: [p(x0, y1, z0), p(x1, y1, z0), p(x1, y1, zt), p(x0, y1, zt)], fill: shade(base, 0.78) });       // front (+y)
    if (pr.sinT > 0.005) faces.push({ pts: [p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, zt), p(x1, y0, zt)], fill: shade(base, 0.62) });
    else if (pr.sinT < -0.005) faces.push({ pts: [p(x0, y0, z0), p(x0, y1, z0), p(x0, y1, zt), p(x0, y0, zt)], fill: shade(base, 0.62) });
  }
  const ink = lum(topC) > 0.42 ? P.ink : "#F6F0E4";
  const z = pr.zoom;
  return (
    <g>
      {faces.map((f, i) => <polygon key={i} points={poly(f.pts)} fill={f.fill} />)}
      <polygon points={poly(top)} fill={topC} stroke={shade(base, 0.55)} strokeOpacity={0.35} strokeWidth={1.1} />
      {glow > 0.02 && <polygon points={poly(top)} fill="none" stroke="#FFFFFF" strokeOpacity={glow * 0.9} strokeWidth={2 + 3 * glow} />}
      {label && z > 34 && (
        <Mapped pr={pr} x={x0} y={y0} zt={zt} w={x1 - x0}>
          {z > 58 && num && <text x={9} y={22} fontFamily={FONT_SYM} fontWeight={700} fontSize={17} fill={ink} opacity={0.75}>{num}</text>}
          <text x={50} y={z > 70 && cn ? 64 : 68} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={sym && sym.length > 1 ? 40 : 44} fill={ink}>{sym}</text>
          {z > 70 && cn && <text x={50} y={88} textAnchor="middle" fontFamily={FONT_CN} fontWeight={700} fontSize={17} fill={ink} opacity={0.8}>{cn}</text>}
        </Mapped>
      )}
    </g>
  );
};

// draw children in a 0–100 square that is mapped onto a block's top face
const Mapped: React.FC<React.PropsWithChildren<{ pr: Proj; x: number; y: number; zt: number; w: number }>> = ({ pr, x, y, zt, w, children }) => {
  const o = pr.p(x, y, zt), ex = pr.p(x + w, y, zt), ey = pr.p(x, y + w, zt);
  const a = (ex[0] - o[0]) / 100, b = (ex[1] - o[1]) / 100, c = (ey[0] - o[0]) / 100, d = (ey[1] - o[1]) / 100;
  return <g transform={`matrix(${a} ${b} ${c} ${d} ${o[0]} ${o[1]})`}>{children}</g>;
};

export const TableWorld: React.FC<{ t: number }> = ({ t }) => {
  if (t < 12.9) return null;
  const cam = camAt(t);
  const pr = makeProj(cam);
  const night = t > 158.2 && t < 179.2;
  const dimTo = night ? P.night : P.dimTop;
  const items = EL.map((e) => {
    const [x, y] = posAt(e, cam.L, t);
    return { e, x, y, st: tileAt(e, t), d: x * pr.sinT + y * pr.cosT };
  });
  // the ending's empty row 8: 18 dashed cells; 119 and 120 blink with a question mark
  const row8 = t > T.cues.ghost_row ? Array.from({ length: 18 }, (_, i) => ({ i, k: eOut(range(t, T.cues.ghost_row + i * 0.05, T.cues.ghost_row + i * 0.05 + 0.4)) })) : [];
  items.sort((a, b) => a.d - b.d);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {row8.map(({ i, k }) => (
        <g key={"r8" + i} opacity={k}>
          <Block pr={pr} x={i} y={7.0} z0={0} h={0} col="#000000" ghost dimTo={dimTo} q={i < 2 ? win(t, T.cues.q119, 192, 0.4, 0.01) : 0} t={t} />
          {i < 2 && cam.z > 60 && <Mapped pr={pr} x={i + 0.055} y={7.055} zt={0} w={0.89}>
            <text x={9} y={22} fontFamily={FONT_SYM} fontWeight={700} fontSize={17} fill="#B5AB98">{119 + i}</text>
          </Mapped>}
        </g>
      ))}
      {items.map(({ e, x, y, st }) =>
        st.show <= 0.001 ? null : (
          <g key={e.z} opacity={st.show}>
            <Block pr={pr} x={x} y={y} z0={st.drop} h={st.h} col={st.col} ghost={st.ghost} st={st} sym={e.s} num={String(e.z)} cn={e.cn}
              dimTo={dimTo} q={st.q} t={t} label={!st.ghost} />
          </g>
        ),
      )}
    </svg>
  );
};

export { clamp01 };

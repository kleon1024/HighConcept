// 02 反常识 (18–41 s): nine surprises, each one a new way of colouring, lifting or resizing the same 118 tiles,
// with one short label and one big number. The labels follow the camera (they're pinned to points of the table).
import React from "react";
import { FAM, P, backOut, clamp01, eIn, eInOut, eOut, range, win } from "../elements/core";
import { EL6, LENS, T6, heat, proj6 } from "./core60";
import { FONT_BIG, FONT_CN, inkOn } from "./Look60";
import { Giant, Kin, Sticker } from "./UI60";

const L = Object.fromEntries(LENS.map((l) => [l.id, l])) as Record<string, { t: number; out: number }>;
const EZ = Object.fromEntries(EL6.map((e) => [e.z, e]));

export const Lenses6: React.FC<{ t: number }> = ({ t }) => {
  if (t < L.state.t - 0.1 || t > L.made.out + 0.1) return null;
  const pr = proj6(t), ink = inkOn(t);
  const at = (x: number, y: number, z = 0) => pr.p(x, y, z);
  const S = T6.state, M = T6.melt, Y = T6.years, G = T6.gaps, A = T6.abund, RA = T6.rare, HE = T6.helium;
  const hole = at(7, 1.45);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* 1 · states at room temperature */}
      <Kin t={t} at={S.flip + 0.1} out={L.state.out} text="常温下是液体的元素" x={hole[0]} y={hole[1] - 100} size={60} color={ink} anchor="center" />
      <Sticker t={t} at={S.melt} out={L.state.out} x={hole[0]} y={hole[1] - 10} anchor="center" bg="#FF3D7F" fg="#FFFFFF" size={56}
        text={<span>只有 <span style={{ fontFamily: FONT_BIG, fontSize: 96 }}>2</span> 个：汞、溴</span>} />
      <Sticker t={t} at={S.float + 0.1} out={L.state.out} x={1860} y={128} anchor="right" bg="#9FE8FF" size={40} text="气体：11 种 ↑" rot={3} />
      {(() => { const [x, y] = at(12.5, 4.0); return <Sticker t={t} at={S.ga} out={L.state.out} x={x - 20} y={y} anchor="right" bg="#FFFFFF" size={36} text="镓 29.8°C：握在手里就化" rot={-2} />; })()}

      {/* 2 · melting point as height */}
      <Kin t={t} at={L.melt.t} out={L.melt.out} text="熔点 = 高度" x={960} y={46} size={72} color="#FFFFFF" anchor="center" />
      {(() => {
        const w = EZ[74]; const [x, y] = at(w.x + 0.5, w.y + 0.5, 0.12 + 3.1 * (w.mp as number) / 3823);
        return (
          <>
            <Giant t={t} at={M.w} out={L.melt.out} text="3422°C" x={x} y={y - 120} size={130} color="#FFD23F" stroke={`3px ${P.ink}`} />
            <Sticker t={t} at={M.w + 0.15} out={L.melt.out} x={x} y={y - 30} anchor="center" bg="#FFFFFF" size={34} text="钨：熔点最高的金属 → 灯丝" rot={2} />
          </>
        );
      })()}
      {t > L.melt.t + 0.3 && t < L.melt.out && (
        <div style={{ position: "absolute", right: 70, bottom: 54, display: "flex", alignItems: "center", gap: 14, fontFamily: FONT_CN, fontWeight: 900, fontSize: 28, color: "#FFFFFF",
          opacity: win(t, L.melt.t + 0.3, L.melt.out, 0.3, 0.2) }}>
          <span>汞 −39°C</span>
          <div style={{ width: 300, height: 22, borderRadius: 11, border: `3px solid ${P.ink}`, background: `linear-gradient(90deg, ${heat(234)}, ${heat(700)}, ${heat(1600)}, ${heat(2600)}, ${heat(3700)})` }} />
          <span>钨 3422°C</span>
        </div>
      )}

      {/* 3 · discovery years */}
      {t > Y.ancient - 0.1 && t < G.q + 0.2 && (() => {
        const yr = t < Y.medieval ? "古代" : t < Y.p ? "1250" : t < Y.y1700 ? "1669" : t < Y.y1869 ? String(Math.round(1700 + 169 * range(t, Y.y1700, Y.y1869))) : "1869";
        return <div style={{ position: "absolute", left: hole[0], top: hole[1], transform: "translate(-50%, -50%)", fontFamily: FONT_BIG, fontSize: 190, color: P.ink, opacity: 0.9 * win(t, Y.ancient - 0.1, G.q + 0.2, 0.15, 0.2), lineHeight: 1 }}>{yr}</div>;
      })()}
      <Sticker t={t} at={Y.ancient} out={Y.p} x={1860} y={128} anchor="right" bg="#FFD23F" size={44} text="古人只认识 9 种" rot={2} />
      <Sticker t={t} at={Y.p} out={Y.y1869} x={1860} y={128} anchor="right" bg="#FFFFFF" size={44} text="1669：磷，从尿里炼出" rot={-2} />
      <Sticker t={t} at={Y.n63} out={G.q + 0.1} x={1860} y={128} anchor="right" bg="#FF3D7F" fg="#FFFFFF" size={44} text="1869：已知 63 种" rot={2} />

      {/* 4 · Mendeleev's gaps */}
      <Kin t={t} at={G.q} out={G.predict} text="门捷列夫：故意留了 3 个空格" x={hole[0]} y={hole[1] - 70} size={58} color={P.ink} anchor="center" stagger={0.025} />
      <Kin t={t} at={G.predict} out={G.hit} text="还预言了它们长什么样" x={hole[0]} y={hole[1] - 70} size={58} color={P.ink} anchor="center" stagger={0.025} />
      {([[31, "镓 1875"], [21, "钪 1879"], [32, "锗 1886"]] as const).map(([z, txt], i) => {
        const e = EZ[z], [x, y] = at(e.x + 0.5, e.y + 1.0);
        const tf = (G.fill as Record<string, number>)[String(z)];
        return <Sticker key={z} t={t} at={tf + 0.1} out={G.hit + 0.6} x={x} y={y + 6 + (i === 2 ? 64 : 0)} anchor="center" bg="#FFFFFF" size={34} rot={i % 2 ? 3 : -3} text={<span>{txt} <span style={{ color: "#00B37A" }}>✓</span></span>} />;
      })}
      <Giant t={t} at={G.hit} out={L.gaps.out} text="全中！" x={hole[0]} y={hole[1]} size={180} color="#FF3D7F" font={FONT_CN} stroke={`5px ${P.ink}`} />
      {t > Y.rush[0] && t < L.gaps.out && (
        <Sticker t={t} at={Y.rush[0]} out={L.gaps.out} x={1860} y={128} anchor="right" bg={P.ink} fg="#FFD23F" size={46} text={(() => { const yy = Math.round(1887 + 129 * eInOut(range(t, Y.rush[0], Y.rush[1]))); return yy < 2016 ? <span style={{ fontFamily: FONT_BIG }}>{yy}</span> : <span><span style={{ fontFamily: FONT_BIG }}>2016</span>：118 种</span>; })()} rot={-2} />
      )}

      {/* 5 · the universe is mostly hydrogen */}
      <Kin t={t} at={A.grow + 0.4} out={L.abund.out} text="宇宙里的原子" x={1290} y={470} size={64} color="#FFFFFF" anchor="center" />
      <Giant t={t} at={A.n92} out={L.abund.out} text="92%" x={1290} y={680} size={250} color={FAM.h.c} stroke={`4px ${P.ink}`} />
      <Sticker t={t} at={A.n92 + 0.25} out={L.abund.out} x={1290} y={830} anchor="center" bg={FAM.h.c} size={52} text="都是氢" rot={-3} />
      <Sticker t={t} at={A.n92 + 0.5} out={L.abund.out} x={1860} y={1010} anchor="right" bg="#FFFFFF" size={24} text="按原子个数 · 大小为示意" rot={0} />

      {/* 6 · rare earths are neither rare nor earths */}
      <Kin t={t} at={L.rare.t} out={L.rare.out} text="稀土：不稀，也不是土" x={960} y={46} size={70} color="#FFFFFF" anchor="center" />
      {(() => {
        const ce = EZ[58], cu = EZ[29];
        const [ax, ay] = at(ce.x + 0.5, ce.y + 0.5, 2.1), [bx, by] = at(cu.x + 0.5, cu.y + 0.5, 2.1);
        const k = eOut(range(t, RA.eq, RA.eq + 0.35)) * (1 - eIn(range(t, L.rare.out - 0.25, L.rare.out)));
        return (
          <>
            <Sticker t={t} at={RA.bars} out={L.rare.out} x={ax} y={ay - 70} anchor="center" bg={FAM.ln.c} size={40} text="铈 Ce" />
            <Sticker t={t} at={RA.bars + 0.1} out={L.rare.out} x={bx} y={by - 70} anchor="center" bg={FAM.tm.c} fg="#FFFFFF" size={40} text="铜 Cu" />
            {k > 0 && <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
              <line x1={ax} y1={ay} x2={ax + (bx - ax) * k} y2={ay + (by - ay) * k} stroke="#FFFFFF" strokeWidth={6} strokeDasharray="14 10" />
            </svg>}
            <Sticker t={t} at={RA.eq} out={L.rare.out} x={(ax + bx) / 2} y={(ay + by) / 2 - 60} anchor="center" bg="#FFD23F" size={40} text="地壳里一样多" rot={-3} />
          </>
        );
      })()}

      {/* 7 · one village, four elements */}
      <Ytterby t={t} at={at} />

      {/* 8 · helium was found in the Sun first */}
      <Kin t={t} at={L.helium.t} out={L.helium.out} text="氦：先在太阳上被发现" x={960} y={46} size={66} color="#FFFFFF" anchor="center" />
      <SunSpectrum t={t} />
      {(() => { const [x, y] = at(17.5, 1.05); return <Sticker t={t} at={HE.earth} out={L.helium.out} x={x} y={y + 10} anchor="right" bg="#FFFFFF" size={40} text="27 年后，地球上才找到" rot={2} />; })()}

      {/* 9 · made by people */}
      <Kin t={t} at={L.made.t} out={L.made.out} text="93 号以后：几乎全靠人造" x={960} y={46} size={66} color={P.ink} anchor="center" />
      <Accelerator t={t} />
    </div>
  );
};

// the word YTTERBY; each element's letters light up as its tile does, with a line down to the tile
const Ytterby: React.FC<{ t: number; at: (x: number, y: number, z?: number) => [number, number] }> = ({ t, at }) => {
  const L7 = L.ytterby, YT = T6.ytterby;
  if (t < L7.t - 0.05 || t > L7.out + 0.05) return null;
  const word = "YTTERBY", picks: [number, number[]][] = [[39, [0]], [65, [1, 5]], [68, [3, 4]], [70, [6, 5]]];
  const k = backOut(range(t, YT.word, YT.word + 0.35), 1.6), out = 1 - eIn(range(t, L7.out - 0.25, L7.out));
  const lit: (string | null)[] = Array(7).fill(null);
  picks.forEach(([, idx], i) => { if (t >= YT.tiles[i]) idx.forEach((j) => (lit[j] = "#FECC02")); });
  const LW = 150, x0 = 960 - (word.length * LW) / 2;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {picks.map(([z, idx], i) => {
          const kk = eOut(range(t, YT.tiles[i], YT.tiles[i] + 0.3));
          if (kk <= 0) return null;
          const e = EZ[z], [tx, ty] = at(e.x + 0.5, e.y + 0.5), lx = x0 + idx[0] * LW + LW / 2, ly = 340;
          return <path key={z} d={`M${lx},${ly} C${lx},${ly + 120} ${tx},${ty - 160} ${tx},${ty - 26}`} fill="none" stroke="#FECC02" strokeWidth={6} strokeDasharray={`${1400 * kk} 2000`} />;
        })}
      </svg>
      <div style={{ position: "absolute", left: 960, top: 74, transform: "translateX(-50%)", fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: "#FECC02", opacity: k }}>瑞典 · 一个叫于特比的小村</div>
      <div style={{ position: "absolute", left: x0, top: 130, display: "flex", transform: `scale(${0.6 + 0.4 * k})`, transformOrigin: "960px 100px" }}>
        {Array.from(word).map((ch, i) => (
          <div key={i} style={{ width: LW, textAlign: "center", fontFamily: FONT_BIG, fontSize: 200, lineHeight: 1, color: lit[i] ?? "rgba(255,255,255,0.4)", WebkitTextStroke: `4px ${P.ink}`,
            transform: `translateY(${(1 - backOut(range(t, YT.word + i * 0.04, YT.word + i * 0.04 + 0.3), 2)) * 80}px)` }}>{ch}</div>
        ))}
      </div>
      <Sticker t={t} at={YT.n4} out={L7.out} x={1880} y={400} anchor="right" bg="#FECC02" size={46} text="1 个村 → 4 种元素" rot={-3} />
    </div>
  );
};

// the Sun, and its spectrum with a bright yellow line nobody could explain in 1868
const SunSpectrum: React.FC<{ t: number }> = ({ t }) => {
  const L8 = L.helium, HE = T6.helium;
  if (t < L8.t - 0.05 || t > L8.out + 0.05) return null;
  const k = backOut(range(t, HE.sun, HE.sun + 0.4), 1.5), out = 1 - eIn(range(t, L8.out - 0.25, L8.out));
  const sk = eOut(range(t, HE.line - 0.3, HE.line + 0.1)), lk = backOut(range(t, HE.line, HE.line + 0.3), 2);
  const lt = t - HE.sun;
  const X0 = 180, X1 = 900, LX = X0 + 0.625 * (X1 - X0);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: out }}>
      <defs>
        <linearGradient id="spec" x1="0" x2="1">
          {["#7B3CFF", "#2D5BFF", "#00C2FF", "#00D9A3", "#B9D24A", "#FFD23F", "#FF9F43", "#FF3B3B"].map((c, i) => <stop key={i} offset={i / 7} stopColor={c} />)}
        </linearGradient>
      </defs>
      <g transform={`translate(430 380) scale(${k}) rotate(${lt * 25})`}>
        {Array.from({ length: 16 }, (_, i) => <polygon key={i} points="-24,-190 24,-190 0,-250" fill="#FFD23F" stroke={P.ink} strokeWidth={5} transform={`rotate(${i * 22.5})`} />)}
        <circle r={175} fill="#FFD23F" stroke={P.ink} strokeWidth={7} />
        <circle r={110} fill="#FFE98A" />
      </g>
      <polygon points={`${430 - 40},${520} ${430 + 40},${520} ${X1},${700} ${X0},${700}`} fill="rgba(255,255,255,0.25)" opacity={sk} />
      <rect x={X0} y={700} width={(X1 - X0) * sk} height={60} fill="url(#spec)" stroke={P.ink} strokeWidth={5} opacity={sk} />
      <rect x={X0} y={700} width={(X1 - X0) * sk} height={60} fill="rgba(13,17,48,0.45)" opacity={sk} />
      {lk > 0 && <>
        <rect x={LX - 6} y={690 - 20 * lk} width={12} height={80 + 40 * lk} fill="#FFF6B0" stroke={P.ink} strokeWidth={3} />
        <text x={LX} y={830} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={34} fill="#FFFFFF" opacity={lk}>1868：一条认不出的黄线</text>
      </>}
    </svg>
  );
};

// a ring accelerator: two beams chase round and collide; the count of human-made elements sits inside
const Accelerator: React.FC<{ t: number }> = ({ t }) => {
  const L9 = L.made, MD = T6.made;
  if (t < L9.t - 0.05 || t > L9.out + 0.05) return null;
  const k = backOut(range(t, L9.t, L9.t + 0.4), 1.6), out = 1 - eIn(range(t, L9.out - 0.25, L9.out));
  const a = (t - L9.t) * 9;
  const n = Math.round(26 * clamp01(range(t, MD.zap[0], MD.zap[1])));
  const cx = 1640, cy = 790, r = 150;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: out }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${cx} ${cy}) scale(${k})`}>
          <circle r={r} fill="#FFFFFF" stroke={P.ink} strokeWidth={22} />
          <circle r={r} fill="none" stroke="#C9D1E0" strokeWidth={10} />
          {[0, 1].map((i) => {
            const aa = i ? -a : a;
            return <circle key={i} cx={r * Math.cos(aa)} cy={r * Math.sin(aa)} r={14} fill={i ? "#FF3D7F" : "#2D5BFF"} stroke={P.ink} strokeWidth={4} />;
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -54%) scale(${k})`, fontFamily: FONT_BIG, fontSize: 130, color: P.ink, lineHeight: 1 }}>{n}</div>
      <div style={{ position: "absolute", left: cx, top: cy + 70, transform: "translateX(-50%)", fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink, opacity: k }}>种</div>
    </div>
  );
};

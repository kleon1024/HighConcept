// Scene overlays: the cold open (gallium), the title, Newlands' octaves, Mendeleev's cards, and the map widgets.
import React from "react";
import { Img, staticFile } from "remotion";
import { EL, FAM, P, T, backOut, bounce, camAt, clamp01, eIn, eInOut, eOut, lerp, makeProj, posAt, range, rnd, win } from "./core";
import { Chars, FONT_BIG, FONT_CN, FONT_SYM, Sticker } from "./UI";

const C = T.cues;
const byZ = (z: number) => EL[z - 1];
const tileScreen = (z: number, t: number, h = 0.2): [number, number] => {
  const cam = camAt(t), pr = makeProj(cam), [x, y] = posAt(byZ(z), cam.L, t);
  return pr.p(x + 0.5, y + 0.5, h);
};

export const Photo: React.FC<{ src: string; w: number; h: number; label: string; rot?: number; style?: React.CSSProperties; pos?: string }> = ({ src, w, h, label, rot = 0, style, pos = "50% 30%" }) => (
  <div style={{ position: "absolute", transform: `rotate(${rot}deg)`, ...style }}>
    <Sticker style={{ padding: 10, width: w }} radius={14} shadow={7}>
      <Img src={staticFile(src)} style={{ width: w - 20, height: h, objectFit: "cover", objectPosition: pos, borderRadius: 6, filter: "grayscale(0.15) contrast(1.05)" }} />
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 24, color: P.ink, textAlign: "center", marginTop: 8 }}>{label}</div>
    </Sticker>
  </div>
);

// ───────────── cold open: 1875, a metal, a wrong density, a letter, the right answer
const Gauge: React.FC<{ t: number }> = ({ t }) => {
  const k = backOut(range(t, C.density_show, C.density_show + 0.4), 2);
  const slam = range(t, C.slam - 0.05, C.slam + 0.25);
  const wob = t > 8.2 && t < C.slam ? Math.sin(t * 40) * 6 * range(t, 8.2, 9.2) : 0;
  const val = t < C.slam ? 4.7 : 5.9;
  const ang = lerp(-60, 30, eOut(slam)) + wob;           // 4.7 → 5.9 on the dial
  const shake = t > C.slam && t < C.slam + 0.3 ? Math.sin(t * 90) * 8 * (1 - range(t, C.slam, C.slam + 0.3)) : 0;
  return (
    <div style={{ position: "absolute", left: 810, top: 250, opacity: clamp01(k), transform: `scale(${0.85 + 0.15 * k}) translateX(${shake}px)` }}>
      <Sticker style={{ width: 470, height: 470, display: "flex", flexDirection: "column", alignItems: "center" }} bg={t > C.slam ? "#FFF3B0" : "#FFFFFF"}>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 34, color: P.ink, marginTop: 26 }}>密度</div>
        <svg width={360} height={190} viewBox="-180 -170 360 190">
          <path d="M -150 0 A 150 150 0 0 1 150 0" fill="none" stroke={P.ink} strokeWidth={10} strokeLinecap="round" />
          <path d="M 75 -130 A 150 150 0 0 1 130 -75" fill="none" stroke="#2FC27E" strokeWidth={22} />
          {Array.from({ length: 9 }, (_, i) => { const a = (-180 + i * 22.5) * Math.PI / 180; return <line key={i} x1={Math.cos(a) * 128} y1={Math.sin(a) * 128} x2={Math.cos(a) * 112} y2={Math.sin(a) * 112} stroke={P.ink} strokeWidth={5} />; })}
          <g transform={`rotate(${ang})`}><line x1={0} y1={0} x2={0} y2={-120} stroke="#FF5B4F" strokeWidth={10} strokeLinecap="round" /></g>
          <circle r={16} fill={P.ink} />
        </svg>
        <div style={{ fontFamily: FONT_BIG, fontSize: 120, color: P.ink, lineHeight: 1, transform: `scale(${t > C.slam ? 1 + 0.25 * Math.exp(-(t - C.slam) / 0.15) : 1})` }}>
          {val.toFixed(1)}<span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 34, marginLeft: 10 }}>g/cm³</span>
        </div>
      </Sticker>
      {t > C.slam && (
        <svg width={700} height={700} style={{ position: "absolute", left: -115, top: -115, pointerEvents: "none" }} viewBox="-350 -350 700 700">
          {Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, k2 = eOut(range(t, C.slam, C.slam + 0.4)), f = 1 - range(t, C.slam + 0.3, C.slam + 0.8);
            return <line key={i} x1={Math.cos(a) * (260 + 40 * k2)} y1={Math.sin(a) * (260 + 40 * k2)} x2={Math.cos(a) * (290 + 70 * k2)} y2={Math.sin(a) * (290 + 70 * k2)} stroke={P.ink} strokeWidth={9} strokeLinecap="round" opacity={f} />; })}
        </svg>
      )}
    </div>
  );
};

const Letter: React.FC<{ t: number }> = ({ t }) => {
  const k = eOut(range(t, C.letter_in, C.letter_in + 0.7));
  if (k <= 0) return null;
  const toGrid = eInOut(range(t, C.to_grid[0], C.to_grid[1]));
  const x = lerp(2000, 1340, k), rot = lerp(14, 4, k);
  return (
    <div style={{ position: "absolute", left: lerp(x, 560, toGrid), top: lerp(170, 120, toGrid), transform: `rotate(${lerp(rot, 0, toGrid)}deg) scale(${1 + toGrid * 1.6})`, opacity: 1 - range(t, C.to_grid[1] - 0.45, C.to_grid[1]) }}>
      <Sticker style={{ width: 520, height: 560, background: "#FFFDF6", position: "relative", overflow: "hidden" }} radius={10}>
        {Array.from({ length: 11 }, (_, i) => <div key={i} style={{ position: "absolute", left: 30, right: 30, top: 150 + i * 36, height: 2, background: "#E5DCC8" }} />)}
        <div style={{ position: "absolute", left: 26, top: 22, width: 104, height: 128, borderRadius: 6, overflow: "hidden", border: `3px solid ${P.ink}` }}>
          <Img src={staticFile("media/el_mendeleev.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 22%" }} />
        </div>
        <div style={{ position: "absolute", left: 150, top: 40, fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink }}>来自 圣彼得堡</div>
        <div style={{ position: "absolute", left: 150, top: 86, fontFamily: FONT_CN, fontWeight: 700, fontSize: 22, color: "#8C826F" }}>门捷列夫（照片摄于 1897）</div>
        <div style={{ position: "absolute", left: 40, top: 200, fontFamily: "'Noto Serif SC', serif", fontWeight: 900, fontSize: 44, color: "#1F3A93", lineHeight: 1.75 }}>
          <Chars text="你测的密度不对，" t={t} at={6.2} stagger={0.06} /><br />
          <Chars text="应该是 5.9。" t={t} at={7.0} stagger={0.07} />
        </div>
        <div style={{ position: "absolute", right: 36, bottom: 30, fontFamily: FONT_CN, fontWeight: 700, fontSize: 24, color: "#8C826F" }}>—— 门捷列夫（大意）</div>
        <div style={{ position: "absolute", right: 22, top: 18, width: 74, height: 86, border: "4px dashed #FF5B4F", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SYM, fontWeight: 700, fontSize: 18, color: "#FF5B4F", transform: "rotate(8deg)" }}>РОССИЯ</div>
      </Sticker>
    </div>
  );
};

export const ColdOpen: React.FC<{ t: number }> = ({ t }) => {
  if (t > 14.2) return null;
  const out = eIn(range(t, 12.6, 13.6));
  const s = eOut(range(t, 0.0, 0.45));
  const sample = backOut(range(t, 0.25, 0.7), 2.4);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `scale(${1 - out * 0.08})` }}>
        <div style={{ position: "absolute", left: 64, top: 56, opacity: 1, transform: `scale(${backOut(range(t, 0, 0.35), 2.2)})`, transformOrigin: "left top" }}>
          <Sticker bg="#FFD23F" style={{ padding: "8px 22px" }} radius={14} shadow={6}>
            <span style={{ fontFamily: FONT_BIG, fontSize: 44, color: P.ink }}>1875</span>
            <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 34, color: P.ink, marginLeft: 14 }}>巴黎</span>
          </Sticker>
        </div>
        <div style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)` }}>
          <Photo src="media/el_lecoq.jpg" w={300} h={330} label="勒科克·德布瓦博德兰" rot={-4} style={{ left: 110, top: 220 }} />
        </div>
        {/* the new metal */}
        <svg width={360} height={360} style={{ position: "absolute", left: 470, top: 330, opacity: clamp01(sample), transform: `scale(${0.7 + 0.3 * sample})` }} viewBox="-180 -180 360 360">
          <ellipse cx={0} cy={110} rx={150} ry={34} fill="#E3DACA" />
          <path d="M -90 60 C -120 -10 -60 -80 10 -70 C 90 -60 120 10 90 70 C 60 110 -60 110 -90 60 Z" fill="#C9D2DE" stroke={P.ink} strokeWidth={8} />
          <path d="M -50 -30 C -30 -55 10 -55 30 -45" fill="none" stroke="#FFFFFF" strokeWidth={12} strokeLinecap="round" />
          <path d="M 40 40 C 60 30 70 10 70 -5" fill="none" stroke="#9AA6B8" strokeWidth={10} strokeLinecap="round" />
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT_SYM} fontWeight={700} fontSize={64} fill={P.ink}>Ga</text>
          <text x={0} y={168} textAnchor="middle" fontFamily={FONT_CN} fontWeight={900} fontSize={30} fill={P.ink}>镓</text>
        </svg>
        <Gauge t={t} />
      </div>
      <Letter t={t} />
    </div>
  );
};

// ───────────── title: the five characters are element tiles
export const Title: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 14.0, 17.8, 0.01, 0.4);
  if (k <= 0) return null;
  const chars = [["元", "1", FAM.h.c], ["素", "6", FAM.nm.c], ["周", "26", FAM.tm.c], ["期", "10", FAM.ng.c], ["表", "11", FAM.alk.c]];
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: k }}>
      <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 56, color: P.ink, marginBottom: 26, opacity: eOut(range(t, 14.05, 14.4)) }}>一次看懂</div>
      <div style={{ display: "flex", gap: 22 }}>
        {chars.map(([ch, n, c], i) => {
          const d = range(t, 14.1 + i * 0.09, 14.1 + i * 0.09 + 0.5);
          return (
            <Sticker key={i} bg={c} style={{ width: 200, height: 200, position: "relative", transform: `translateY(${(1 - bounce(d)) * -260}px)`, opacity: d > 0 ? 1 : 0 }} radius={18}>
              <div style={{ position: "absolute", left: 16, top: 10, fontFamily: FONT_SYM, fontWeight: 700, fontSize: 30, color: P.ink }}>{n}</div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_CN, fontWeight: 900, fontSize: 130, color: P.ink, paddingTop: 12 }}>{ch}</div>
            </Sticker>
          );
        })}
      </div>
      <div style={{ marginTop: 44, fontFamily: FONT_CN, fontWeight: 900, fontSize: 52, color: P.ink, background: "#FFD23F", padding: "4px 24px", borderRadius: 10, opacity: eOut(range(t, 14.8, 15.2)) }}>
        <Chars text="一张能预言未来的表" t={t} at={14.8} stagger={0.04} />
      </div>
    </div>
  );
};

// ───────────── Newlands' "law of octaves", 1865
export const Newlands: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, C.newlands[0], C.newlands[1], 0.4, 0.4);
  if (k <= 0) return null;
  const keys = ["Li", "Be", "B", "C", "N", "O", "F", "Na"], sol = ["do", "re", "mi", "fa", "sol", "la", "si", "do"];
  const laugh = range(t, C.laugh, C.laugh + 0.4);
  return (
    <div style={{ position: "absolute", left: 360, top: 300, opacity: k, transform: `translateY(${(1 - k) * 60}px)` }}>
      <Sticker style={{ width: 1200, height: 470, position: "relative" }}>
        <div style={{ position: "absolute", left: 40, top: 26, fontFamily: FONT_CN, fontWeight: 900, fontSize: 34, color: P.ink }}>纽兰兹的“八音律” · 1865</div>
        <div style={{ position: "absolute", left: 80, top: 100, display: "flex", gap: 10 }}>
          {keys.map((s, i) => {
            const on = t >= C.octave + i * 0.25, press = on ? Math.exp(-(t - C.octave - i * 0.25) / 0.25) : 0;
            const same = (i === 0 || i === 7) && t > C.octave + 7 * 0.25;
            return (
              <div key={i} style={{ width: 120, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 26, color: "#8C826F", height: 36 }}>{sol[i]}</div>
                <div style={{ width: 112, height: 210, border: `5px solid ${P.ink}`, borderRadius: "0 0 14px 14px", background: same ? FAM.alk.c : on ? "#FFF3B0" : "#FFFFFF", transform: `translateY(${press * 10}px)`, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 14 }}>
                  <span style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 44, color: P.ink }}>{s}</span>
                </div>
              </div>
            );
          })}
        </div>
        {t > C.octave + 2.0 && (
          <div style={{ position: "absolute", left: 140, top: 392, width: 880, height: 40, borderBottom: `6px dashed ${FAM.alk.c}`, borderLeft: `6px dashed ${FAM.alk.c}`, borderRight: `6px dashed ${FAM.alk.c}`, borderRadius: "0 0 30px 30px", opacity: eOut(range(t, C.octave + 2.0, C.octave + 2.3)) }} />
        )}
      </Sticker>
      {laugh > 0 && (
        <div style={{ position: "absolute", left: 820, top: -120, transform: `scale(${backOut(laugh, 2.5)}) rotate(4deg)`, transformOrigin: "left bottom" }}>
          <Sticker bg="#FFFFFF" style={{ padding: "14px 26px" }} radius={40}>
            <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 38, color: P.ink }}>你怎么不按字母排？</span>
          </Sticker>
          {["哈", "哈", "哈"].map((h, i) => (
            <div key={i} style={{ position: "absolute", left: -90 + i * 60, top: -50 - i * 26, fontFamily: FONT_CN, fontWeight: 900, fontSize: 40, color: "#FF5B4F", transform: `rotate(${-15 + i * 12}deg) translateY(${Math.sin(t * 14 + i) * 6}px)`, opacity: eOut(range(t, C.laugh + 0.15 * i, C.laugh + 0.15 * i + 0.2)) }}>{h}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ───────────── Mendeleev: his portrait, the cards he lays down, his predictions, and the countries that filled the gaps
const KNOWN = EL.filter((e) => e.year <= 1869);
export const Mendeleev: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 36.8, 50.4, 0.5, 0.5);
  if (k <= 0) return null;
  const cards = t > 37.0 && t < 41.9 ? KNOWN.map((e) => {
    const lay = e.lay ?? 38.4;
    if (t > lay + 0.5) return null;
    const pile: [number, number] = [960 + (rnd(e.z + 3) - 0.5) * 500, 760 + (rnd(e.z + 7) - 0.5) * 140];
    const inK = eOut(range(t, 37.0 + rnd(e.z + 1) * 0.6, 37.4 + rnd(e.z + 1) * 0.6));
    const fly = eInOut(range(t, lay, lay + 0.5));
    const dst = tileScreen(e.z, t);
    const x = lerp(pile[0], dst[0], fly), y = lerp(pile[1] + (1 - inK) * 400, dst[1], fly);
    const rot = lerp((rnd(e.z + 9) - 0.5) * 50, 0, fly);
    return (
      <div key={e.z} style={{ position: "absolute", left: x - 42, top: y - 56, width: 84, height: 112, background: "#FFFFFF", border: `4px solid ${P.ink}`, borderRadius: 10, transform: `rotate(${rot}deg) scale(${lerp(1, 0.8, fly)})`, opacity: inK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `4px 4px 0 ${P.ink}` }}>
        <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 36, color: P.ink }}>{e.s}</div>
        <div style={{ width: 40, height: 6, background: FAM[e.fam].c, borderRadius: 3, marginTop: 6 }} />
      </div>
    );
  }) : null;
  const preds = [[31, "类铝", "密度 ≈ 5.9"], [21, "类硼", "原子量 ≈ 44"], [32, "类硅", "原子量 ≈ 72"]] as const;
  const OFF: Record<number, [number, number]> = { 21: [-300, -150], 31: [-300, -160], 32: [30, -220] };
  const fills = [[31, "镓 Ga", "Gallia＝法国"], [21, "钪 Sc", "Scandia＝斯堪的纳维亚"], [32, "锗 Ge", "Germania＝德国"]] as const;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      <Photo src="media/el_mendeleev.jpg" w={230} h={270} label="门捷列夫 · 1869" rot={-3} style={{ left: 60, top: 640 }} pos="50% 20%" />
      {cards}
      {preds.map(([z, a, b], i) => {
        const kk = win(t, C.predict + i * 0.25, (T.hist.fill as Record<string, number>)[String(z)] - 0.1, 0.3, 0.2);
        if (kk <= 0) return null;
        const [sx, sy] = tileScreen(z, t);
        return (
          <div key={z} style={{ position: "absolute", left: sx + OFF[z][0] + 60, top: sy + OFF[z][1] + 20, opacity: kk, transform: `scale(${backOut(kk, 2)})` }}>
            <Sticker bg="#FFFFFF" style={{ width: 180, padding: "8px 0", textAlign: "center" }} radius={12} shadow={5} border={4}>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 28, color: "#FF5B4F" }}>{a}</div>
              <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 22, color: P.ink }}>{b}</div>
            </Sticker>
          </div>
        );
      })}
      {fills.map(([z, a, b]) => {
        const at = (T.hist.fill as Record<string, number>)[String(z)];
        const kk = win(t, at + 0.15, 50.4, 0.3, 0.4);
        if (kk <= 0) return null;
        const [sx, sy] = tileScreen(z, t);
        return (
          <div key={z} style={{ position: "absolute", left: sx + OFF[z][0], top: sy + OFF[z][1], opacity: kk, transform: `scale(${backOut(kk, 2)})` }}>
            <Sticker bg="#FFD23F" style={{ width: 260, padding: "8px 0", textAlign: "center" }} radius={12} shadow={5} border={4}>
              <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink }}>{a} · {z === 31 ? "1875" : z === 21 ? "1879" : "1886"}</div>
              <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 22, color: P.ink }}>{b}</div>
            </Sticker>
          </div>
        );
      })}
    </div>
  );
};

// ───────────── map widgets: the nucleus, the electron shells, the four blocks
const Nucleus: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 58.8, 64.2, 0.35, 0.35);
  if (k <= 0) return null;
  let n = 1;
  for (let i = 1; i <= 8; i++) if (t >= 59.4 + (i - 1) * 0.5) n = i;
  if (t > 61.8) n = Math.max(8, Math.round(lerp(8, 118, eInOut(range(t, 61.8, 63.6)))));
  const R = 22 + 8.5 * Math.sqrt(n);
  const e = EL[n - 1];
  return (
    <div style={{ position: "absolute", right: 70, top: 220, opacity: k, transform: `scale(${0.9 + 0.1 * k})` }}>
      <Sticker style={{ width: 400, height: 470, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <svg width={300} height={300} viewBox="-150 -150 300 300" style={{ marginTop: 18 }}>
          <circle r={R + 18} fill="#FFF3B0" />
          {Array.from({ length: n }, (_, i) => {
            const r = 9.5 * Math.sqrt(i + 0.5) * (R / (22 + 8.5 * Math.sqrt(n))) * 0.95, a = i * 2.39996;
            const d = t - (n <= 8 ? 59.4 + i * 0.5 : 61.8 + (i / 118) * 1.8);
            const pop = n <= 8 ? backOut(clamp01(d / 0.25), 2.4) : 1;
            return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={10 * pop} fill="#FF5B4F" stroke={P.ink} strokeWidth={2.5} />;
          })}
        </svg>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 34, color: P.ink }}>质子 × <span style={{ fontFamily: FONT_BIG, fontSize: 52 }}>{n}</span></div>
        <div style={{ fontFamily: FONT_SYM, fontWeight: 700, fontSize: 30, color: "#8C826F", marginTop: 4 }}>{e.s}{e.cn ? " · " + e.cn : ""}</div>
      </Sticker>
    </div>
  );
};

const Atom: React.FC<{ shells: number[]; size: number; hiOuter?: boolean; t: number; build?: number }> = ({ shells, size, hiOuter, t, build = 999 }) => {
  let count = 0;
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200">
      <circle r={9} fill="#FF5B4F" stroke={P.ink} strokeWidth={2.5} />
      {shells.map((n, si) => {
        const r = 26 + si * 22;
        return (
          <g key={si}>
            <circle r={r} fill="none" stroke={P.ink} strokeWidth={2.5} opacity={0.5} />
            {Array.from({ length: n }, (_, i) => {
              count++;
              if (count > build) return null;
              const a = (i / n) * Math.PI * 2 + t * (1.2 - si * 0.25);
              const outer = hiOuter && si === shells.length - 1;
              return <circle key={i} cx={Math.cos(a) * r} cy={Math.sin(a) * r} r={outer ? 8 : 6} fill={outer ? FAM.alk.c : "#4D7CFE"} stroke={P.ink} strokeWidth={2} />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

const Shells: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 64.3, 73.8, 0.35, 0.35);
  if (k <= 0) return null;
  const phase2 = t >= 69.6;
  const build = Math.round(lerp(1, 18, eInOut(range(t, 64.6, 68.8))));
  const shellsFor = (n: number) => { const s: number[] = []; let left = n; for (const cap of [2, 8, 8]) { if (left <= 0) break; s.push(Math.min(cap, left)); left -= cap; } return s; };
  return (
    <div style={{ position: "absolute", right: 70, top: 220, opacity: k }}>
      <Sticker style={{ width: 420, height: 500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {!phase2 ? (
          <>
            <Atom shells={shellsFor(build)} size={330} t={t} />
            <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 32, color: P.ink }}>电子：{shellsFor(build).join(" · ")}</div>
          </>
        ) : (
          <>
            {[["Li 锂", [2, 1]], ["Na 钠", [2, 8, 1]], ["K 钾", [2, 8, 8, 1]]].map(([name, sh], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, opacity: eOut(range(t, 69.8 + i * 0.3, 70.2 + i * 0.3)) }}>
                <Atom shells={sh as number[]} size={130} hiOuter t={t} />
                <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 30, color: P.ink, width: 120 }}>{name as string}</div>
              </div>
            ))}
            <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 28, color: P.ink, background: FAM.alk.c, padding: "4px 14px", borderRadius: 8, marginTop: 6 }}>最外层：都是 1 个</div>
          </>
        )}
      </Sticker>
    </div>
  );
};

const Blocks: React.FC<{ t: number }> = ({ t }) => {
  const k = win(t, 80.3, 82.6, 0.3, 0.3);
  if (k <= 0) return null;
  const cam = camAt(t), pr = makeProj(cam);
  const lab: [string, number, number, string][] = [["s 区", 1, -0.4, "#FF5B4F"], ["d 区", 7, 2.6, "#4D7CFE"], ["p 区", 14.5, -0.4, "#2FC27E"], ["f 区", 9.5, 7.0, "#2CCFC7"]];
  return (
    <>
      {lab.map(([s, x, y, c], i) => {
        const [sx, sy] = pr.p(x, y, 0.2);
        return (
          <div key={i} style={{ position: "absolute", left: sx - 70, top: sy - 40, opacity: k, transform: `scale(${backOut(range(t, 80.3 + i * 0.12, 80.7 + i * 0.12), 2)})` }}>
            <Sticker bg={c} style={{ width: 140, textAlign: "center", padding: "4px 0" }} radius={12} shadow={5} border={4}>
              <span style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 34, color: P.ink }}>{s}</span>
            </Sticker>
          </div>
        );
      })}
    </>
  );
};

export const MapWidgets: React.FC<{ t: number }> = ({ t }) => (t < 58 || t > 83 ? null : (
  <>
    <Nucleus t={t} />
    <Shells t={t} />
    <Blocks t={t} />
  </>
));

export { eIn };

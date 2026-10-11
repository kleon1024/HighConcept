import React from "react";
import { Abs, C, CHAPTER, eIn, eInOut, eOut, FONT_CN, FONT_EN, FONT_UI, Kinetic, lerp, polar, pts, pulse, range, TL, useSpring, useT, W } from "./theme";

type G = (typeof TL.c6.genres)[number];
const beatsOf = (bpm: number, len: number, offs: number[] = [0], perBar = 1) => {
  const b = 60 / bpm, out: number[] = [];
  for (let t = 0; t < len; t += b * perBar) offs.forEach(o => out.push(t + o * b));
  return out.sort((x, y) => x - y);
};

const GenreArt: React.FC<{ g: G; ct: number }> = ({ g, ct }) => {
  const cx = 1400, cy = 560;
  const b = 60 / g.bpm;
  switch (g.id) {
    case "classical": {
      const p1 = pulse(ct, beatsOf(g.bpm, 3, [0], 3), 0.3), pAll = pulse(ct, beatsOf(g.bpm, 3), 0.2);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          {[0, 1, 2, 3, 4].map(k => {
            const r = 120 + k * 58, a0 = ct * (20 + k * 9) * (k % 2 ? -1 : 1);
            return <circle key={k} cx={cx} cy={cy} r={r} fill="none" stroke={k % 2 ? g.b : g.a} strokeWidth={22} strokeDasharray={`${r * 2.2} ${r * 1.1}`} strokeLinecap="round" style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${a0}deg` }} />;
          })}
          {[0, 1, 2].map(k => <circle key={k} cx={cx - 90 + k * 90} cy={cy} r={k === 0 ? 34 + 14 * p1 : 22 + 8 * pAll} fill={g.ink} />)}
        </svg>
      );
    }
    case "jazz": {
      const swing = beatsOf(g.bpm, 3, [0, 2 / 3]);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          {[0, 1, 2].map(k => { const s = 360 - k * 95; return <rect key={k} x={cx - s / 2} y={cy - s / 2 - 60} width={s} height={s} fill="none" stroke={k === 1 ? g.b : g.a} strokeWidth={18} style={{ transformOrigin: `${cx}px ${cy - 60}px`, rotate: `${ct * (30 - k * 18) + k * 15}deg` }} />; })}
          {swing.slice(0, 8).map((s, k) => <circle key={k} cx={cx - 330 + (s / b) * 160} cy={cy + 260} r={k % 2 ? 16 : 26} fill={ct >= s ? g.a : g.ink} opacity={ct >= s ? 1 : 0.35} />)}
          <text x={cx} y={cy + 360} textAnchor="middle" fontFamily={FONT_UI} fontWeight={700} fontSize={38} fill={g.ink}>长 — 短  长 — 短  (2 : 1)</text>
        </svg>
      );
    }
    case "rock": {
      const sn = beatsOf(g.bpm, 3, [1], 2), p = pulse(ct, sn, 0.16);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          {[0, 1, 2].map(k => <rect key={k} x={980 + k * 230} y={-200} width={130} height={1500} fill={k === 1 ? g.b : g.a} style={{ transformOrigin: `${1100 + k * 230}px 540px`, rotate: "18deg", translate: `0px ${(1 - p) * 0 + p * (k - 1) * 40}px`, scale: `${1 + 0.1 * p}` }} />)}
          <circle cx={cx - 120} cy={cy} r={50} fill={g.bg} stroke={g.a} strokeWidth={12} />
          <circle cx={cx + 140} cy={cy - 120} r={50} fill={g.bg} stroke={g.a} strokeWidth={12} />
          <line x1={cx - 80} y1={cy - 25} x2={cx + 100} y2={cy - 95} stroke={g.a} strokeWidth={14} />
          <text x={cx + 10} y={cy + 160} textAnchor="middle" fontFamily={FONT_EN} fontSize={110} fill={g.b} stroke={g.a} strokeWidth={5}>1 + 5</text>
        </svg>
      );
    }
    case "hiphop": {
      const kick = beatsOf(g.bpm, 3, [0, 1.75, 2.5], 4), snare = beatsOf(g.bpm, 3, [1, 3], 4);
      const pk = pulse(ct, kick, 0.15), ps = pulse(ct, snare, 0.15);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          {[...Array(16)].map((_, k) => {
            const col = k % 4, row = Math.floor(k / 4), x = 1110 + col * 150, y = 290 + row * 150;
            const isK = (col + row) % 3 === 0, s = 1 + (isK ? 0.3 * pk : 0.25 * ps);
            return <rect key={k} x={x} y={y - (isK ? 40 * pk : 30 * ps)} width={120} height={120} rx={24} fill={isK ? g.a : g.b} style={{ transformOrigin: `${x + 60}px ${y + 60}px`, scale: `${s}` }} />;
          })}
        </svg>
      );
    }
    case "house": {
      const ks = beatsOf(g.bpm, 3), duck = pulse(ct, ks, 0.22);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          {[0, 1, 2, 3, 4, 5].map(k => { const s = (420 - k * 64) * (1 - 0.18 * duck * (1 - k * 0.1)); return <rect key={k} x={cx - s / 2} y={cy - s / 2} width={s} height={s} rx={8} fill="none" stroke={k % 2 ? g.b : g.a} strokeWidth={12} style={{ transformOrigin: `${cx}px ${cy}px`, rotate: `${45 + ct * 12 * (k % 2 ? -1 : 1)}deg` }} />; })}
          <circle cx={cx} cy={cy} r={30 + 40 * duck} fill={g.b} />
        </svg>
      );
    }
    default: { // latin: son clave 3-2 on a 16-step necklace
      const step = b / 4, idx = Math.floor(ct / step) % 16, clave = [0, 3, 6, 10, 12], R = 300;
      const p = Math.exp(-((ct % step)) / 0.1);
      return (
        <svg width={W} height={1080} style={{ position: "absolute" }}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={g.ink} strokeWidth={5} />
          <polygon points={pts(clave.map(k => polar(cx, cy, R, k, 16)))} fill={g.a} stroke={g.ink} strokeWidth={7} strokeLinejoin="round" />
          {[...Array(16)].map((_, k) => { const [x, y] = polar(cx, cy, R, k, 16), on = clave.includes(k); return <circle key={k} cx={x} cy={y} r={on ? 30 + (k === idx ? 14 * p : 0) : 12} fill={on ? g.ink : g.b} stroke={g.ink} strokeWidth={3} />; })}
          <text x={cx} y={cy + 28} textAnchor="middle" fontFamily={FONT_EN} fontSize={72} fill={g.ink}>3 – 2</text>
        </svg>
      );
    }
  }
};

const GenreCard: React.FC<{ g: G; at: number; len: number; i: number }> = ({ g, at, len, i }) => {
  const t = useT(), sp = useSpring();
  if (t < at - 0.01 || t > at + len + 0.3) return null;
  const ct = t - at;
  const wipe = eOut(range(t, at, at + 0.3));
  const s = sp(at + 0.05);
  return (
    <Abs style={{ clipPath: `polygon(${(1 - wipe) * 120}% 0, 120% 0, 120% 100%, ${(1 - wipe) * 120 - 20}% 100%)`, background: g.bg, zIndex: 10 + i }}>
      <GenreArt g={g} ct={ct} />
      <div style={{ position: "absolute", left: 120, top: 250 }}>
        <div style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 36, color: g.ink, letterSpacing: 6, opacity: 0.7 }}>0{i + 1} / 06</div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 900, fontSize: 250, color: g.ink, lineHeight: 1.05, translate: `${(1 - Math.min(1, s)) * -120}px 0px` }}>{g.cn}</div>
        <div style={{ fontFamily: FONT_EN, fontSize: 104, color: g.id === "rock" ? C.paper : g.a, lineHeight: 1, translate: `${(1 - Math.min(1, sp(at + 0.12))) * -160}px 0px` }}>{g.en}</div>
        <div style={{ display: "flex", gap: 22, marginTop: 50, opacity: eOut(range(t, at + 0.25, at + 0.6)) }}>
          {[`♩ = ${g.bpm}`, g.meter].map((x, k) => <div key={k} style={{ fontFamily: FONT_UI, fontWeight: 700, fontSize: 44, color: g.bg, background: g.ink, padding: "10px 26px", borderRadius: 40 }}>{x}</div>)}
        </div>
        <div style={{ fontFamily: FONT_CN, fontWeight: 700, fontSize: 52, color: g.ink, marginTop: 30, opacity: eOut(range(t, at + 0.4, at + 0.8)) }}>{g.tag}</div>
      </div>
    </Abs>
  );
};

// ════════════════ 06 GENRES
export const Genres: React.FC = () => {
  const t = useT(), c = TL.c6, s0 = c.start;
  const L = (x: number) => x - s0;
  const introOut = eIn(range(t, L(c.cards) - 0.1, L(c.cards) + 0.2));
  return (
    <>
      <Abs style={{ background: C.violet }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 300, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - introOut }}>
        <Kinetic text="同样的积木" at={0.05} size={170} color={C.paper} stagger={0.05} />
        <Kinetic text="不同的音乐" at={0.3} size={170} color={C.yellow} stagger={0.05} />
      </div>
      {c.genres.map((g, i) => <GenreCard key={g.id} g={g} i={i} at={L(c.cards) + i * c.cardLen} len={c.cardLen} />)}
    </>
  );
};

// ════════════════ FINALE: every colour, the fifths star, the claim, back to the dot
export const Finale: React.FC = () => {
  const t = useT(), sp = useSpring(), f = TL.finale, s0 = f.start;
  const L = (x: number) => x - s0;
  const cols = [...CHAPTER, C.paper];
  const starIn = sp(L(f.text) - 0.2, { damping: 13 });
  const collapse = eInOut(range(t, L(f.collapse), L(f.collapse) + 1.4));
  const cx = 960, cy = 470, R = 330 * (1 - collapse);
  const star = [...Array(12)].map((_, k) => polar(cx, cy, R, (k * 5) % 12));
  const rot = t * 25;
  const dotA = eOut(range(t, L(f.collapse) + 1.2, L(f.collapse) + 1.5)), ping = pulse(t, [L(f.ping)], 0.5);
  const fadeOut = eIn(range(t, L(f.end) - 0.5, L(f.end)));
  return (
    <Abs style={{ background: C.ink }}>
      {/* the slice transition: six colours sweep across */}
      {cols.slice(0, 6).map((c, k) => {
        const a = eInOut(range(t, k * 0.06, 0.35 + k * 0.06));
        return <Abs key={k} style={{ background: c, clipPath: `inset(0 ${100 - (k + 1) * (100 / 6)}% 0 ${k * (100 / 6)}%)`, translate: `0px ${(a - 0) * -110}%` }} />;
      })}
      <svg width={W} height={1080} style={{ position: "absolute", opacity: 1 - fadeOut }}>
        <g style={{ transformOrigin: `${cx}px ${cy}px`, scale: `${Math.min(1.1, starIn)}`, rotate: `${rot}deg` }}>
          {[...Array(12)].map((_, k) => {
            const a = polar(cx, cy, R, k), b2 = polar(cx, cy, R, (k + 4) % 12), c2 = polar(cx, cy, R, (k + 7) % 12);
            return <polygon key={k} points={pts([a, b2, c2])} fill={cols[k % 6]} opacity={0.22} />;
          })}
          <polygon points={pts(star)} fill="none" stroke={C.paper} strokeWidth={6} strokeLinejoin="round" />
          {[...Array(12)].map((_, k) => { const [x, y] = polar(cx, cy, R, k); return <circle key={k} cx={x} cy={y} r={14 * (1 - collapse)} fill={cols[k % 6]} />; })}
        </g>
        <circle cx={cx} cy={cy} r={(14 + 10 * ping) * dotA} fill={C.paper} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - collapse }}>
        <Kinetic text="音乐 = 你听得见的数学" at={L(f.text) + 0.3} size={104} color={C.paper} stagger={0.045} />
        <div style={{ height: 14 }} />
        <Kinetic text="MUSIC IS MATH YOU CAN FEEL" at={L(f.text) + 0.9} size={44} color={C.yellow} font={FONT_EN} weight={400} stagger={0.02} tracking={8} />
      </div>
    </Abs>
  );
};
export const _u = { lerp, FONT_CN };

// Procedural score for DESCENT (30 s). Pure JS DSP, no dependencies.
// Output: out/score.wav (48 kHz, 16-bit stereo). Every cue is placed on the shared beat grid.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BEAT_SEC, TOTAL_BEATS, SILENCES, kickTimes } from '../src/timeline.js';

const SR = 48000;
const DUR = TOTAL_BEATS * BEAT_SEC;
const N = Math.ceil(DUR * SR);
const TAU = Math.PI * 2;
const b2s = b => b * BEAT_SEC;
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

// ---------- deterministic noise ----------
let seed = 1337;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const noise = () => rnd() * 2 - 1;

// ---------- buses ----------
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const dry = bus(), pad = bus(), verb = bus();

function put(target, i, v, pan, send) {
  if (i < 0 || i >= N) return;
  const l = Math.cos((pan + 1) * Math.PI / 4), r = Math.sin((pan + 1) * Math.PI / 4);
  target.L[i] += v * l; target.R[i] += v * r;
  if (send) { verb.L[i] += v * l * send; verb.R[i] += v * r * send; }
}

// Render a voice: fn(t, k) returns a sample for local time t (s); k = sample index from start.
function voice(t0, dur, fn, { pan = 0, send = 0.2, gain = 1, to = dry } = {}) {
  const i0 = Math.floor(t0 * SR), n = Math.floor(dur * SR);
  for (let k = 0; k < n; k++) put(to, i0 + k, fn(k / SR, k) * gain, pan, send);
}

class Biquad {
  constructor(type, f, q = 0.707) { this.set(type, f, q); this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  set(type, f, q) {
    const w = TAU * Math.min(f, SR * 0.45) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
    let b0, b1, b2;
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; } // bandpass
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = -2 * c / a0; this.a2 = (1 - a) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y;
  }
}

const expDec = (t, tau) => Math.exp(-t / tau);
const att = (t, a) => Math.min(1, t / a);

// ---------- instruments ----------
function kick(t0, g = 1) {
  let ph = 0;
  voice(t0, 0.5, t => {
    const f = 42 + 110 * Math.exp(-t / 0.035);
    ph += TAU * f / SR;
    return (Math.sin(ph) * expDec(t, 0.22) + (t < 0.004 ? noise() * 0.4 : 0)) * 0.9;
  }, { gain: g, send: 0.05 });
}
function snare(t0, g = 1, pan = 0) {
  const bp = new Biquad('bp', 1800, 0.8);
  voice(t0, 0.35, t => (bp.run(noise()) * 1.6 * expDec(t, 0.09) + Math.sin(TAU * 185 * t) * expDec(t, 0.05) * 0.5), { gain: g * 0.6, pan, send: 0.25 });
}
function hat(t0, g = 1, pan = 0, open = false) {
  const hp = new Biquad('hp', 7000, 0.7);
  voice(t0, open ? 0.25 : 0.06, t => hp.run(noise()) * expDec(t, open ? 0.08 : 0.018), { gain: g * 0.35, pan, send: 0.1 });
}
function tom(t0, f, g = 1, pan = 0) {
  let ph = 0;
  voice(t0, 0.4, t => { ph += TAU * f * (1 + 0.6 * Math.exp(-t / 0.04)) / SR; return Math.sin(ph) * expDec(t, 0.16); }, { gain: g * 0.7, pan, send: 0.2 });
}
// FM bell. glass: ratio 3.5; bianzhong: inharmonic ratio + a minor-third second tone.
function bell(t0, f, dur, g = 1, { ratio = 3.5, index = 2, pan = 0, send = 0.45, tau = dur / 3 } = {}) {
  voice(t0, dur, t => {
    const mod = index * Math.exp(-t / (tau * 0.5)) * Math.sin(TAU * f * ratio * t);
    return Math.sin(TAU * f * t + mod) * expDec(t, tau) * att(t, 0.002);
  }, { gain: g * 0.35, pan, send });
}
function bianzhong(t0, f, g = 1, pan = 0) {
  bell(t0, f, 3.5, g, { ratio: 1.41, index: 3.2, pan, send: 0.5, tau: 1.1 });
  bell(t0, f * 1.19, 3, g * 0.6, { ratio: 2.76, index: 1.5, pan: -pan, send: 0.5, tau: 0.9 });
  bell(t0, f * 2.92, 1.2, g * 0.3, { ratio: 1.0, index: 0.5, pan, send: 0.5, tau: 0.3 });
}
// Karplus-Strong pluck
function pluck(t0, f, g = 1, pan = 0, dur = 1.2, bright = 0.5) {
  const len = Math.max(2, Math.round(SR / f)), buf = new Float32Array(len);
  for (let i = 0; i < len; i++) buf[i] = noise();
  let idx = 0;
  voice(t0, dur, t => {
    const a = buf[idx], b = buf[(idx + 1) % len];
    buf[idx] = (a * (1 - bright) + b * bright) * 0.996;
    idx = (idx + 1) % len;
    return a * Math.min(1, (dur - t) * 8);
  }, { gain: g * 0.5, pan, send: 0.3 });
}
// Detuned saw pad through a lowpass. notes: midi[]
function padChord(t0, dur, notes, g = 1, { cutoff = 1400, a = 0.4, r = 0.6, send = 0.5, to = pad, sweep = 0 } = {}) {
  notes.forEach((m, ni) => {
    for (const det of [-0.11, 0.0, 0.12]) {
      const f = mtof(m + det), lp = new Biquad('lp', cutoff, 0.9);
      let ph = rnd();
      const pan = ((ni % 2) ? 0.4 : -0.4) * (det ? Math.sign(det) : 0.3);
      voice(t0, dur, t => {
        if (sweep) lp.set('lp', cutoff * Math.pow(2, sweep * t / dur), 0.9);
        ph = (ph + f / SR) % 1;
        const env = att(t, a) * Math.min(1, (dur - t) / r);
        return lp.run(ph * 2 - 1) * env;
      }, { gain: g * 0.07, pan, send, to });
    }
  });
}
// Additive organ (drawbars 16', 8', 5 1/3', 4', 2 2/3', 2')
function organ(t0, dur, notes, g = 1, { glide = 0, send = 0.55 } = {}) {
  const bars = [[0.5, 0.5], [1, 1], [1.5, 0.45], [2, 0.6], [3, 0.3], [4, 0.35], [6, 0.12], [8, 0.15]];
  notes.forEach((m, ni) => {
    const f0 = mtof(m); let ph = 0;
    voice(t0, dur, t => {
      const f = f0 * Math.pow(2, -glide * (t / dur) ** 2);
      ph += f / SR;
      let s = 0; for (const [h, a] of bars) s += a * Math.sin(TAU * ph * h);
      return s * att(t, 0.04) * Math.min(1, (dur - t) / 0.05) * (1 + 0.04 * Math.sin(TAU * 6 * t));
    }, { gain: g * 0.045, pan: (ni - notes.length / 2) * 0.15, send, to: pad });
  });
}
// Formant "choir"
function choir(t0, dur, notes, g = 1) {
  notes.forEach((m, ni) => {
    const f = mtof(m), f1 = new Biquad('bp', 700, 4), f2 = new Biquad('bp', 1150, 5);
    let ph = rnd();
    voice(t0, dur, t => {
      ph = (ph + f * (1 + 0.004 * Math.sin(TAU * 5 * t + ni)) / SR) % 1;
      const x = ph * 2 - 1, env = Math.sin(Math.PI * Math.min(1, t / dur)) ** 1.5;
      return (f1.run(x) + f2.run(x) * 0.7) * env;
    }, { gain: g * 0.5, pan: (ni % 2 ? 0.5 : -0.5), send: 0.7, to: pad });
  });
}
function sine(t0, dur, f, g = 1, { a = 0.01, r = 0.1, pan = 0, send = 0.3, fEnd = f, curve = 1 } = {}) {
  let ph = 0;
  voice(t0, dur, t => {
    const x = t / dur, fr = f * Math.pow(fEnd / f, x ** curve);
    ph += TAU * fr / SR;
    return Math.sin(ph) * att(t, a) * Math.min(1, (dur - t) / r);
  }, { gain: g, pan, send });
}
function noiseSweep(t0, dur, f0, f1, g = 1, { shape = 2, pan = 0, send = 0.4, q = 1.2, fadeIn = true } = {}) {
  const bp = new Biquad('bp', f0, q);
  voice(t0, dur, (t, k) => {
    const x = t / dur;
    if (k % 32 === 0) bp.set('bp', f0 * Math.pow(f1 / f0, x), q);
    return bp.run(noise()) * (fadeIn ? x ** shape : 1) * Math.min(1, (dur - t) / 0.01);
  }, { gain: g, pan, send });
}
function thunder(t0, g = 1) {
  const lp = new Biquad('lp', 400, 0.7);
  let br = 0;
  voice(t0, 2.6, t => {
    br = br * 0.985 + noise() * 0.15;
    const rumble = 1 + 0.6 * Math.sin(TAU * 7 * t) * Math.sin(TAU * 2.3 * t);
    return lp.run(br * 4) * expDec(t, 0.7) * rumble + (t < 0.03 ? noise() * (1 - t / 0.03) : 0);
  }, { gain: g, send: 0.6 });
}
function crackle(t0, dur, density, g = 1) {
  for (let t = 0; t < dur; t += 0.004) if (rnd() < density) {
    const ts = t0 + t, p = noise() * 0.8, a = 0.3 + rnd() * 0.7;
    voice(ts, 0.006, tt => noise() * (1 - tt / 0.006), { gain: g * a, pan: p, send: 0.2 });
  }
}
function impact(t0, g = 1) {
  kick(t0, 1.3 * g);
  const hp = new Biquad('hp', 900, 0.7);
  voice(t0, 0.5, t => hp.run(noise()) * expDec(t, 0.07), { gain: 0.55 * g, send: 0.6 });
  sine(t0, 1.6, 55, 0.45 * g, { fEnd: 30, a: 0.002, r: 1.2, send: 0.1 });
  [36, 43, 48, 51].forEach((m, i) => bell(t0, mtof(m), 2.4, 0.5 * g, { ratio: 1.41, index: 2.5, pan: (i - 1.5) * 0.4, tau: 0.8 }));
}
function musicBox(t0, f, g = 1, dur = 1.4, pan = 0) {
  voice(t0, dur, (t, k) => {
    const hold = k - (k % 6); // sample-rate reduction
    const tt = hold / SR;
    let s = Math.sin(TAU * f * tt) + 0.3 * Math.sin(TAU * f * 3.01 * tt) * expDec(tt, 0.08) + 0.15 * Math.sin(TAU * f * 5.2 * tt) * expDec(tt, 0.03);
    s *= expDec(tt, 0.45);
    return Math.round(s * 24) / 24; // 5-bit crush
  }, { gain: g * 0.22, pan, send: 0.5 });
}
// Shepard–Risset glissando, descending forever.
function shepard(t0, dur, g = 1, octPerSec = 0.35) {
  const NO = 8, fmin = 30, ph = new Float64Array(NO);
  voice(t0, dur, t => {
    let s = 0;
    for (let k = 0; k < NO; k++) {
      let pos = ((k - octPerSec * t) % NO + NO) % NO; // octave position 0..NO
      const f = fmin * Math.pow(2, pos);
      ph[k] += TAU * f / SR;
      const w = Math.exp(-0.5 * ((pos - NO / 2) / 1.4) ** 2);
      s += Math.sin(ph[k]) * w;
    }
    return s * att(t, 0.4) * Math.min(1, (dur - t) / 0.05);
  }, { gain: g * 0.07, send: 0.5 });
}
function breath(t0, dur, g = 1) {
  const bp = new Biquad('bp', 900, 0.8), lp = new Biquad('lp', 3000, 0.7);
  voice(t0, dur, (t, k) => {
    const x = t / dur;
    if (k % 64 === 0) bp.set('bp', 600 + 1400 * x, 0.8);
    return lp.run(bp.run(noise())) * Math.sin(Math.PI * x) ** 0.8;
  }, { gain: g, send: 0.3 });
}

// ---------- score ----------
const C = 48; // C3
const cmin = [0, 2, 3, 5, 7, 8, 10];
const deg = (d, base = C) => base + cmin[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);

// Prologue 0–4: 20 Hz sub rising to C1, harmonic series partials enter one by one.
sine(0, 2.0, 20, 0.5, { fEnd: 32.7, a: 0.6, r: 0.05, send: 0 });
for (let h = 2; h <= 8; h++) sine(0.12 + (h - 2) * 0.2, 2.0 - (0.12 + (h - 2) * 0.2), 32.7 * h, 0.09 / Math.sqrt(h), { a: 0.25, r: 0.02, pan: (h % 2 ? 0.3 : -0.3), send: 0.6 });
noiseSweep(b2s(2.5), b2s(1.5), 300, 6000, 0.35, { shape: 3 });

// Chapter hits (the crack transitions)
[4, 12, 20, 28, 36].forEach(b => impact(b2s(b)));
impact(b2s(48), 0.6);

// Kicks shared with the picture
kickTimes().forEach(b => kick(b2s(b), b >= 12 && b < 20 ? 0.55 : b >= 48 ? 0.7 : 1));

// I 振 (4–12)
const series = [4, 5, 6, 7, 8, 9, 10, 12].map(h => 32.7 * h * 2);
for (let i = 0; i < 15; i++) bell(b2s(4.5 + i * 0.5), series[(i * 3) % series.length], 1.5, 0.5, { ratio: 3.5, index: 1.4, pan: Math.sin(i) * 0.7 });
[36, 43, 48, 51, 55].forEach((m, i) => pluck(b2s(5) + i * 0.03, mtof(m), 0.8, (i - 2) * 0.3, 1.5));
organ(b2s(6), b2s(0.9), [C, C + 3, C + 7, C + 12], 1.2);
[84, 91, 96].forEach((m, i) => bell(b2s(7 + i / 3), mtof(m), 0.5, 0.7, { ratio: 2, index: 3, pan: (i - 1) * 0.6, tau: 0.12 }));
choir(b2s(8), b2s(2.4), [C, C + 7, C + 15], 1);
padChord(b2s(8), b2s(3.75), [C - 12, C, C + 3, C + 7], 0.8, { a: 0.6 });
noiseSweep(b2s(10), b2s(1.75), 200, 8000, 0.5, { shape: 2.5 });
sine(b2s(10), b2s(1.75), 80, 0.2, { fEnd: 600, a: 0.3, r: 0.01, curve: 2 });
sine(b2s(4), b2s(7.75), 32.7, 0.25, { a: 0.5, r: 0.05, send: 0 });

// II 冻 (12–20): wind, ice crackle, six-note benzene loop
noiseSweep(b2s(12), b2s(7.75), 300, 900, 0.18, { fadeIn: false, q: 2, pan: -0.3 });
for (let b = 12; b < 19.75; b += 0.25) hat(b2s(b), 0.4 + rnd() * 0.6, noise() * 0.8);
crackle(b2s(12), b2s(2), 0.05, 0.25);
const ring = [72, 75, 79, 82, 79, 75];
for (let i = 0; b2s(12) + i * b2s(0.25) < b2s(19.75); i++) {
  const b = 12 + i * 0.25;
  const accent = Math.abs(b - 17) < 1e-6 ? 1.6 : 1;
  bell(b2s(b), mtof(ring[i % 6]), 0.6, 0.35 * accent, { ratio: 2, index: 1.2, pan: Math.sin(i * TAU / 6) * 0.8, tau: 0.15 });
}
bell(b2s(14), mtof(76), 1.5, 0.8, { ratio: 3.5, index: 1, pan: -0.4 });
bell(b2s(14.05), mtof(84), 1.5, 0.6, { ratio: 3.5, index: 1, pan: 0.4 });
[84, 87, 91, 96].forEach((m, i) => bell(b2s(15 + i * 0.25), mtof(m), 0.3, 0.5, { ratio: 2, index: 2, tau: 0.08, pan: (i - 1.5) * 0.4 }));
impact(b2s(17), 0.7); // the snake bites its tail
padChord(b2s(12), b2s(4), [C - 12, C + 3, C + 7], 0.6, { cutoff: 800 });
padChord(b2s(16), b2s(2), [C - 16, C - 4, C + 3], 0.6, { cutoff: 900 });
padChord(b2s(18), b2s(1.75), [C - 14, C - 2, C + 5], 0.6, { cutoff: 900, sweep: 2 });
for (let i = 0; i < 7; i++) pluck(b2s(18 + i * 0.25), mtof(deg(7 + i, C)), 0.6, (i - 3) * 0.2, 0.5);

// III 生 (20–28): heartbeat, arpeggio, synapse, Cambrian fill, the first eye, lightning
[0, 1, 2, 3].forEach(i => pluck(b2s(20 + i * 0.25), mtof(C + 12 * i), 0.8, (i - 1.5) * 0.4, 0.6, 0.6));
const arp = [0, 3, 7, 10, 12, 10, 7, 3];
for (let i = 0; i < 16; i++) {
  const b = 20 + i * 0.25, lp = new Biquad('lp', 600 + i * 220, 3);
  let ph = 0; const f = mtof(C + 12 + arp[i % 8]);
  voice(b2s(b), 0.2, t => { ph = (ph + f / SR) % 1; return lp.run(ph * 2 - 1) * expDec(t, 0.06); }, { gain: 0.25, pan: Math.sin(i) * 0.5, send: 0.3 });
}
for (let i = 0; i < 8; i++) voice(b2s(21) + i * 0.05 + rnd() * 0.02, 0.004, () => noise(), { gain: 0.5, pan: noise(), send: 0.2 });
sine(b2s(21.5), 0.2, 2400, 0.25, { fEnd: 180, a: 0.002, r: 0.05 });
for (let i = 0; i < 8; i++) pluck(b2s(22 + i * 0.125), mtof(deg(i * 2, C + 12)), 0.45, (i - 4) * 0.15, 0.6);
for (let i = 0; i < 8; i++) tom(b2s(23 + i * 0.125), 220 - i * 18, 0.9, (i - 4) * 0.2);
padChord(b2s(20), b2s(4), [C - 12, C, C + 3, C + 10], 0.7, { cutoff: 700, sweep: 2.5 });
bell(b2s(24), 1046.5, 4.2, 0.9, { ratio: 1, index: 0.05, tau: 1.6, send: 0.8 }); // first light
bell(b2s(24), 1567.98, 4.2, 0.35, { ratio: 1, index: 0.05, tau: 1.4, send: 0.8 });
sine(b2s(26), b2s(0.5), 40, 0.3, { fEnd: 90, a: 0.2, r: 0.01 });
thunder(b2s(26.5), 0.45);
crackle(b2s(26.5), b2s(1.2), 0.08, 0.35);

// IV 盗 (28–36): fire, broken beat, flame-test fate motif on bronze bells
crackle(b2s(28), b2s(7.75), 0.03, 0.3);
[29, 31, 33, 35].forEach(b => snare(b2s(b), 1));
snare(b2s(34.75), 0.4, 0.3);
for (let b = 28; b < 35.75; b += 0.5) hat(b2s(b + ((b * 2) % 2 ? 0.04 : 0)), 0.6, 0.3);
[28, 28.75, 32, 32.5].forEach((b, i) => tom(b2s(b), 70 + i * 6, 1.4, 0));
const bass = (b, l, m) => { const lp = new Biquad('lp', 300, 1.5); let ph = 0; const f = mtof(m);
  voice(b2s(b), b2s(l), t => { ph = (ph + f / SR) % 1; return Math.tanh(lp.run(ph * 2 - 1) * 3) * Math.min(1, (b2s(l) - t) / 0.02); }, { gain: 0.22, send: 0.05 }); };
bass(28, 2, 24); bass(30, 1.5, 31); bass(31.5, 1.5, 27); bass(33, 2.75, 24);
const fateStab = (b, m, kind, l = 0.5) => {
  bianzhong(b2s(b), mtof(m), 0.9, kind === 'Li' ? -0.4 : kind === 'K' ? 0.4 : 0);
  const notes = [m - 12, m - 5, m];
  if (kind === 'Li') padChord(b2s(b), b2s(l), notes, 2.2, { cutoff: 3500, a: 0.005, r: 0.05, send: 0.3, to: dry });
  if (kind === 'K') organ(b2s(b), b2s(l), notes, 1.6, { send: 0.3 });
  if (kind === 'Cu') notes.forEach(n => bell(b2s(b), mtof(n), 0.4, 0.8, { ratio: 1.41, index: 5, tau: 0.15 }));
  if (kind === 'Na') { padChord(b2s(b), b2s(l), [m - 24, m - 12, m - 5, m], 1.8, { cutoff: 2400, a: 0.01, r: 0.3, to: dry }); choir(b2s(b), b2s(l), [m - 12, m - 5, m], 0.8); }
};
fateStab(30, 67, 'Li'); fateStab(30.5, 67, 'K'); fateStab(31, 67, 'Cu'); fateStab(31.5, 63, 'Na', 1.5);
bianzhong(b2s(33), mtof(36), 1.2);
bell(b2s(33), 55, 3, 0.8, { ratio: 1.37, index: 4, tau: 1.2 }); // gong
[34, 34.25, 34.5, 34.75].forEach((b, i) => crackle(b2s(b), 0.12, 0.35, 0.5 + i * 0.15));
thunder(b2s(35), 0.6);
bianzhong(b2s(35), mtof(48), 0.8, 0.3);

// V 繁 (36–48): organ climbs a whole tone every two beats (Babel), stutter, black hole
[37, 39, 41].forEach(b => snare(b2s(b), 1.1));
for (let b = 36; b < 43; b += 0.25) hat(b2s(b), (b % 0.5) ? 0.5 : 0.8, (b % 0.5) ? 0.4 : -0.4, (b % 1) === 0.5);
[[36, 0], [38, 2], [40, 4], [42, 6]].forEach(([b, tr]) => {
  const root = C + tr, l = b === 42 ? 1 : 2;
  organ(b2s(b), b2s(l), [root - 12, root, root + 3, root + 7, root + 12], 2.2);
  choir(b2s(b), b2s(l), [root, root + 7, root + 15], 1.2);
  for (let i = 0; i < l * 4; i++) {
    const f = mtof(root + 24 + arp[i % 8]); let ph = 0; const lp = new Biquad('lp', 2500, 2);
    voice(b2s(b + i * 0.25), 0.18, t => { ph = (ph + f / SR) % 1; return lp.run(ph * 2 - 1) * expDec(t, 0.05); }, { gain: 0.18, pan: Math.sin(i * 1.3) * 0.6, send: 0.35 });
  }
  for (let i = 0; i < l * 2; i++) bass(b + i * 0.5, 0.45, root - 24);
});
// stutter over the flash montage (43–45): 32nd retriggers, gated by flash cuts
for (let i = 0; i < 16; i++) {
  const b = 43 + i * 0.125, m = C + 6 + [0, 7, 12, 15][i % 4] + (i >> 2) * 2;
  if (i % 4 === 3) continue; // the 2-frame black gaps
  organ(b2s(b), b2s(0.1), [m, m + 7], 1.6, { send: 0.2 });
  hat(b2s(b), 0.9, noise());
  sine(b2s(b), 0.05, 3000 + rnd() * 3000, 0.08, { a: 0.001, r: 0.01, pan: noise() });
}
[43, 44].forEach(b => kick(b2s(b), 1.1));
// black hole: sub boom, organ chord pulled down in pitch, reverse swell — hard cut at 47.5
sine(b2s(45), b2s(2.5), 55, 0.6, { fEnd: 20, a: 0.005, r: 0.01, send: 0.1 });
organ(b2s(45), b2s(2.5), [C + 6 - 12, C + 6, C + 9, C + 13], 1.6, { glide: 2.5 });
noiseSweep(b2s(45), b2s(2.5), 8000, 120, 0.6, { shape: 3, q: 0.8 });
impact(b2s(45), 0.8);

// VI 降 (48–56): Shepard descent, the gradient melody, android lullaby, sheep fate motif
shepard(b2s(48), b2s(7.5), 1.1);
const descentMel = [84, 82, 86, 80, 79, 81, 77, 75, 76, 74, 72, 72];
descentMel.forEach((m, i) => pluck(b2s(48 + i * (2 / 12)), mtof(m), 0.55, Math.sin(i * 2) * 0.5, 0.7, 0.4));
choir(b2s(50), b2s(1.4), [C, C + 7, C + 15], 1);
[72, 75, 79, 75, 74, 72, 70, 72].forEach((m, i) => musicBox(b2s(51 + i * 0.125), mtof(m), 0.8, 0.8, (i % 2 ? 0.3 : -0.3)));
[[52, 79], [52.5, 79], [53, 79]].forEach(([b, m]) => { musicBox(b2s(b), mtof(m), 1.2, 1); bell(b2s(b), mtof(m - 12), 0.6, 0.4, { ratio: 3.5, index: 0.8 }); sine(b2s(b), 0.25, 300, 0.05, { fEnd: 900, a: 0.01, r: 0.1 }); });
for (let i = 0; i < 12; i++) musicBox(b2s(53.5 + i * 0.125), mtof(75), 0.9 * (1 - i / 14), 0.5, (i % 2 ? 0.2 : -0.2));
bell(b2s(53.5), mtof(63), 2.5, 0.7, { ratio: 3.5, index: 0.6, tau: 0.9 });
padChord(b2s(51), b2s(4.4), [C - 12, C, C + 3, C + 7], 0.6, { cutoff: 600, a: 0.8 });
sine(b2s(55), b2s(0.5), 523.25, 0.18, { fEnd: 261.63, a: 0.01, r: 0.1, send: 0.6 });

// VII 觉 (56–60): breath, just-intonation C major (the harmonic series, finally heard), bronze bell, 20 Hz returns
breath(b2s(56), 0.65, 0.5);
const c3 = 130.81;
[1, 5 / 4, 3 / 2, 2, 5 / 2, 3, 4].forEach((r, i) => sine(b2s(56.8), b2s(3.0), c3 * r, 0.11 / Math.sqrt(i + 1), { a: 0.35, r: 0.5, pan: (i % 2 ? 0.35 : -0.35), send: 0.7 }));
bianzhong(b2s(58), mtof(60), 0.9);
sine(b2s(58.6), b2s(1.4), 32.7, 0.3, { fEnd: 20, a: 0.4, r: 0.15, send: 0 });

// ---------- mix ----------
// Freeverb-style reverb on the send bus
function reverb(inL, inR) {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617], aps = [556, 441, 341, 225];
  const out = [new Float32Array(N), new Float32Array(N)];
  [inL, inR].forEach((inp, ch) => {
    const spread = ch * 23;
    const cb = combs.map(d => ({ buf: new Float32Array(d + spread), i: 0, f: 0 }));
    const ab = aps.map(d => ({ buf: new Float32Array(d + spread), i: 0 }));
    const o = out[ch];
    for (let n = 0; n < N; n++) {
      const x = inp[n] * 0.015; let s = 0;
      for (const c of cb) { const y = c.buf[c.i]; c.f = y * 0.75 + c.f * 0.25; c.buf[c.i] = x + c.f * 0.86; c.i = (c.i + 1) % c.buf.length; s += y; }
      for (const a of ab) { const y = a.buf[a.i]; const v = -s + y; a.buf[a.i] = s + y * 0.5; a.i = (a.i + 1) % a.buf.length; s = v; }
      o[n] = s;
    }
  });
  return out;
}
const [wL, wR] = reverb(verb.L, verb.R);

// Sidechain duck for the pad bus
const duck = new Float32Array(N).fill(1);
kickTimes().forEach(b => { const i0 = Math.floor(b2s(b) * SR); for (let k = 0; k < SR * 0.3; k++) if (i0 + k < N) duck[i0 + k] = Math.min(duck[i0 + k], 1 - 0.6 * Math.exp(-k / (SR * 0.08))); });

// Gate for the shared silences (absolute silence, including tails)
const gate = new Float32Array(N).fill(1);
const ramp = Math.floor(SR * 0.004);
SILENCES.forEach(([a, b]) => { const i0 = Math.floor(b2s(a) * SR), i1 = Math.floor(b2s(b) * SR);
  for (let i = i0 - ramp; i < i1 + ramp; i++) if (i >= 0 && i < N) gate[i] = Math.min(gate[i], i < i0 ? (i0 - i) / ramp : i >= i1 ? (i - i1) / ramp : 0); });

const L = new Float32Array(N), R = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh((dry.L[i] + pad.L[i] * duck[i] + wL[i] * 1.1) * 0.9) * gate[i];
  R[i] = Math.tanh((dry.R[i] + pad.R[i] * duck[i] + wR[i] * 1.1) * 0.9) * gate[i];
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'out');
fs.mkdirSync(outDir, { recursive: true });
const wav = Buffer.alloc(44 + N * 4);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write('WAVEfmt ', 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22); wav.writeUInt32LE(SR, 24);
wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
fs.writeFileSync(path.join(outDir, 'score.wav'), wav);
console.log(`score.wav written: ${DUR.toFixed(2)} s, peak ${peak.toFixed(3)}`);

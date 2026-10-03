// Shared beat grid for picture and score. 120 BPM, 30 fps → 1 beat = 15 frames.
// s = start beat, l = length in beats, k = scene key, p = scene params.
export const BPM = 120;
export const FPS = 30;
export const BEAT_SEC = 60 / BPM;
export const TOTAL_BEATS = 60;

export const CHAPTERS = [
  { name: 'egg', s: 0 },
  { name: 'vibration', s: 4 },
  { name: 'frost', s: 12 },
  { name: 'genesis', s: 20 },
  { name: 'theft', s: 28 },
  { name: 'excess', s: 36 },
  { name: 'descent', s: 48 },
  { name: 'awake', s: 56 },
];

export const SHOTS = [
  // 序 · 卵 — fate thread, golden egg, Brahma's lotus
  { s: 0, l: 4, k: 'egg' },
  // I 振 — Pangu's eyes, strings, Platonic solids, orbitals, supercluster, meteorite
  { s: 4, l: 1, k: 'burst' },
  { s: 5, l: 1, k: 'strings' },
  { s: 6, l: 1, k: 'solids' },
  { s: 7, l: 1, k: 'orbitals' },
  { s: 8, l: 2, k: 'cosmicweb' },
  { s: 10, l: 2, k: 'meteor' },
  // II 冻 — Freud's iceberg, H2O, structural formulae, Kekulé's ouroboros, DNA
  { s: 12, l: 2, k: 'iceberg' },
  { s: 14, l: 1, k: 'h2o' },
  { s: 15, l: 1, k: 'formula' },
  { s: 16, l: 2, k: 'ouroboros' },
  { s: 18, l: 2, k: 'dna' },
  // III 生 — cells, synapse, tree of knowledge, Cambrian, first eye, lightning
  { s: 20, l: 1, k: 'cells' },
  { s: 21, l: 1, k: 'synapse' },
  { s: 22, l: 1, k: 'tree' },
  { s: 23, l: 1, k: 'cambrian' },
  { s: 24, l: 2, k: 'compoundEye' },
  { s: 26, l: 2, k: 'lightning' },
  // IV 盗 — fire, Plato's cave, flame test (fate motif), bronze taotie, oracle bone
  { s: 28, l: 1, k: 'fire' },
  { s: 29, l: 1, k: 'cave' },
  { s: 30, l: 0.5, k: 'flame', p: { el: 'Li' } },
  { s: 30.5, l: 0.5, k: 'flame', p: { el: 'K' } },
  { s: 31, l: 0.5, k: 'flame', p: { el: 'Cu' } },
  { s: 31.5, l: 1.5, k: 'flame', p: { el: 'Na' } },
  { s: 33, l: 1, k: 'taotie' },
  { s: 34, l: 2, k: 'oracle' },
  // V 繁 — Athens, geocentric epicycles, baroque, Library of Babel, silicon, Babel, black hole
  { s: 36, l: 1, k: 'parthenon' },
  { s: 37, l: 1, k: 'epicycles' },
  { s: 38, l: 1, k: 'baroque' },
  { s: 39, l: 1, k: 'library' },
  { s: 40, l: 1, k: 'silicon' },
  { s: 41, l: 2, k: 'babel' },
  { s: 43, l: 0.5, k: 'baroque', p: { flash: true, u0: 0.5 } },
  { s: 43.5, l: 0.5, k: 'dna', p: { flash: true, u0: 0.3 } },
  { s: 44, l: 0.5, k: 'taotie', p: { flash: true, u0: 0.9 } },
  { s: 44.5, l: 0.5, k: 'cosmicweb', p: { flash: true, u0: 0.6 } },
  { s: 45, l: 3, k: 'blackhole' },
  // VI 降 — loss landscape, neural web, android dreaming electric sheep (fate motif)
  { s: 48, l: 2, k: 'loss' },
  { s: 50, l: 1, k: 'cosmicweb', p: { neural: true } },
  { s: 51, l: 1, k: 'android' },
  { s: 52, l: 0.5, k: 'sheep', p: { n: 0 } },
  { s: 52.5, l: 0.5, k: 'sheep', p: { n: 1 } },
  { s: 53, l: 0.5, k: 'sheep', p: { n: 2 } },
  { s: 53.5, l: 1.5, k: 'sheep', p: { n: 3, dissolve: true } },
  { s: 55, l: 1, k: 'converge' },
  // VII 觉 — Necker cube, the eye, ouroboros closes, back to the seed
  { s: 56, l: 2, k: 'eye' },
  { s: 58, l: 2, k: 'ending' },
];

// Moments of absolute silence / black (beat ranges), shared by picture and score.
export const SILENCES = [
  [11.75, 12], [19.75, 20], [27.75, 28], [35.75, 36], [47.5, 48], [55.5, 56],
];

// Kick pattern per beat range (beat offsets within each beat), shared so bloom pulses with the drum.
export function kickTimes() {
  const k = [];
  const add = (a, b, step, offs = [0]) => { for (let x = a; x < b - 1e-6; x += step) offs.forEach(o => k.push(x + o)); };
  add(4, 11.75, 2);                 // I: half-time
  add(12, 19.75, 1);                // II: soft four-on-floor
  add(20, 24, 1, [0, 0.2]);         // III: heartbeat lub-dub
  k.push(26.5);                     // lightning strike
  k.push(28, 29.5, 30, 30.5, 31, 31.5, 32.75, 33, 34, 35, 35.5); // IV: broken
  add(36, 43, 1);                   // V: four-on-floor
  add(48, 55.5, 2, [0, 0.2]);       // VI: slow heartbeat
  return k.filter(t => !SILENCES.some(([a, b]) => t >= a && t < b));
}

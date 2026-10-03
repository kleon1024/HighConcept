import { THREE, W, H, WHITE, GOLD, rng, v3, crack, LineBuilder, finalShader, Dust } from './core.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SHOTS, FPS, BEAT_SEC, CHAPTERS, SILENCES, kickTimes } from './timeline.js';
import { scenesA } from './scenesA.js';
import { scenesB } from './scenesB.js';
import { scenesC } from './scenesC.js';

const SCENES = { ...scenesA, ...scenesB, ...scenesC };
const PR = Number(new URLSearchParams(location.search).get('scale') || 1);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 1);
document.body.appendChild(renderer.domElement);

const overlay = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-W / H, W / H, 1, -1, -10, 10);
const composer = new EffectComposer(renderer);
const mainPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const overPass = new RenderPass(overlay, ortho); overPass.clear = false; overPass.clearDepth = true;
const bloom = new UnrealBloomPass(new THREE.Vector2(W * PR, H * PR), 1.0, 0.5, 0.22);
const final = new ShaderPass(finalShader);
composer.addPass(mainPass); composer.addPass(overPass); composer.addPass(bloom); composer.addPass(final);

const BEAT_FRAMES = FPS * BEAT_SEC;
const kicks = kickTimes();
const chapterHits = CHAPTERS.map(c => c.s).filter(s => s > 0 && s < 56);
const cracks = new Map();
function crackFor(beat) {
  if (!cracks.has(beat)) {
    const r = rng(beat * 13 + 1), a = W / H;
    const L = new LineBuilder();
    crack(v3(r.range(-a, -a * 0.3), 1.1, 0), v3(r.range(a * 0.3, a), -1.1, 0), r, { depth: 7, rough: 0.28, branches: 5, branchLen: 0.3 })
      .forEach((pl, i) => L.poly(pl.map(p => p.setZ(0)), false, i ? GOLD : WHITE));
    cracks.set(beat, L.build(1));
  }
  return cracks.get(beat);
}

let current = null, currentIdx = -1;
function dispose(obj) {
  obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
}
function setDustScale(scene, cam) {
  const s = H * PR / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  scene.traverse(o => { if (o instanceof Dust) o.material.uniforms.uScale.value = s; });
}

window.renderFrame = function (f) {
  const beat = f / BEAT_FRAMES;
  let idx = SHOTS.findIndex(s => beat >= s.s - 1e-9 && beat < s.s + s.l - 1e-9);
  if (idx < 0) idx = SHOTS.length - 1;
  const shot = SHOTS[idx];
  if (idx !== currentIdx) {
    if (current) dispose(current.scene);
    current = SCENES[shot.k](shot.p || {});
    currentIdx = idx;
    setDustScale(current.scene, current.cam);
    mainPass.scene = current.scene; mainPass.camera = current.cam;
  }
  const local = (beat - shot.s) / shot.l;
  const u = shot.p && shot.p.flash ? (shot.p.u0 || 0) + local * 0.25 : local;
  const t = (beat - shot.s) * BEAT_SEC;
  const post = current.update(Math.min(u, 0.9999), t) || {};
  setDustScale(current.scene, current.cam);

  // beat-synced bloom pulse from the shared kick grid
  const last = kicks.filter(k => k <= beat + 1e-9).pop();
  const pulse = last === undefined ? 0 : Math.exp(-(beat - last) * BEAT_SEC / 0.12);
  bloom.strength = 0.75 * (post.bloom ?? 1.1) + 0.45 * pulse;

  // chapter cracks + flash
  overlay.clear();
  let flash = post.flash || 0;
  for (const cb of chapterHits) {
    const age = (beat - cb) * BEAT_FRAMES;
    if (age >= 0 && age < 9) { const c = crackFor(cb); c.material.opacity = 1 - age / 9; overlay.add(c); flash = Math.max(flash, 0.75 * Math.exp(-age / 2.2)); }
  }
  // flash-montage black gaps (2 frames) and shared silences
  let fade = 1;
  if (shot.p && shot.p.flash && (beat - shot.s) * BEAT_FRAMES < 2) fade = 0;
  if (SILENCES.some(([a, b]) => beat >= a - 1e-9 && beat < b - 1e-9)) { fade = 0; flash = 0; }

  final.uniforms.uTime.value = f;
  final.uniforms.uFlash.value = flash;
  final.uniforms.uFade.value = fade;
  final.uniforms.uTint.value = post.tint ?? 0.35;
  final.uniforms.uCA.value = (post.ca ?? 1) + 2 * pulse;
  composer.render();
};
window.ready = true;

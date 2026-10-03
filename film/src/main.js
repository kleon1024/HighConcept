import { THREE, W, H, rng, v3, crack, LineBuilder, gradeShader, setRenderer, backdrop, seedPoint } from './core.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SHOTS, FPS, BEAT_SEC, CHAPTERS, SILENCES, ACCENTS } from './timeline.js';
import { shots as s01 } from './shots/ch01_cosmos.js';
import { shots as s23 } from './shots/ch23_frost_genesis.js';
import { shots as s45 } from './shots/ch45_theft_excess.js';
import { shots as s67 } from './shots/ch67_descent_awake.js';

const SCENES = { ...s01, ...s23, ...s45, ...s67 };
const PR = Number(new URLSearchParams(location.search).get('scale') || 1);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(PR);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);
setRenderer(renderer);

const overlay = new THREE.Scene();
const ortho = new THREE.OrthographicCamera(-W / H, W / H, 1, -1, -10, 10);
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 }));
const mainPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const overPass = new RenderPass(overlay, ortho); overPass.clear = false; overPass.clearDepth = true;
const bloom = new UnrealBloomPass(new THREE.Vector2(W * PR, H * PR), 0.6, 0.6, 0.9);
const grade = new ShaderPass(gradeShader);
composer.addPass(mainPass); composer.addPass(overPass); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(grade);

// placeholder for shots not yet built
function placeholder() {
  const S = new THREE.Scene(); backdrop(S, 'void');
  const c = new THREE.PerspectiveCamera(35, W / H, 0.1, 1000); c.position.set(0, 0, 5);
  S.add(seedPoint());
  return { scene: S, cam: c, update() {} };
}

const BEAT_FRAMES = FPS * BEAT_SEC;
const chapterHits = CHAPTERS.map(c => c.s).filter(s => s > 0 && s < 56);
const cracks = new Map();
function crackFor(beat) {
  if (!cracks.has(beat)) {
    const r = rng(beat * 13 + 1), a = W / H, L = new LineBuilder();
    crack(v3(r.range(-a, -a * 0.3), 1.1, 0), v3(r.range(a * 0.3, a), -1.1, 0), r, { depth: 7, rough: 0.28, branches: 4, branchLen: 0.3 })
      .forEach((pl, i) => L.poly(pl.map(p => p.setZ(0)), false, i ? '#ffcf70' : '#fff2d8', i ? 2 : 6));
    cracks.set(beat, L.build(1));
  }
  return cracks.get(beat);
}

let current = null, currentIdx = -1;
function dispose(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); }); }
function setDustScale(scene, cam) {
  const s = H * PR / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  scene.traverse(o => { if (o.isDust) o.material.uniforms.uScale.value = s; });
}

// f may be fractional (sub-frames for motion blur)
window.renderFrame = function (f) {
  const beat = f / BEAT_FRAMES;
  let idx = SHOTS.findIndex(s => beat >= s.s - 1e-9 && beat < s.s + s.l - 1e-9);
  if (idx < 0) idx = SHOTS.length - 1;
  const shot = SHOTS[idx];
  if (idx !== currentIdx) {
    if (current) dispose(current.scene);
    const make = SCENES[shot.k] || placeholder;
    current = make(shot.p || {}, { renderer });
    currentIdx = idx;
    mainPass.scene = current.scene; mainPass.camera = current.cam;
  }
  const local = (beat - shot.s) / shot.l;
  const u = shot.p && shot.p.flash ? (shot.p.u0 || 0) + local * 0.2 : local;
  const t = (beat - shot.s) * BEAT_SEC;
  const post = current.update(Math.min(u, 0.9999), t) || {};
  setDustScale(current.scene, current.cam);

  // music accents nudge the bloom a little (no flashing)
  const last = ACCENTS.filter(k => k <= beat + 1e-9).pop();
  const pulse = last === undefined ? 0 : Math.exp(-(beat - last) * BEAT_SEC / 0.15);
  bloom.strength = (post.bloom ?? 0.6) * (1 + 0.35 * pulse);
  bloom.threshold = post.threshold ?? 0.9;
  renderer.toneMappingExposure = post.exposure ?? 1.0;

  // chapter cut: a single gold crack splits the frame for a few frames
  overlay.clear();
  let flash = post.flash || 0;
  for (const cb of chapterHits) {
    const age = (beat - cb) * BEAT_FRAMES;
    if (age >= 0 && age < 6) { const c = crackFor(cb); c.material.opacity = 1 - age / 6; overlay.add(c); flash = Math.max(flash, 0.22 * Math.exp(-age / 1.5)); }
  }
  let fade = post.fade ?? 1;
  if (shot.p && shot.p.flash && (beat - shot.s) * BEAT_FRAMES < 2) fade = 0;
  if (SILENCES.some(([a, b]) => beat >= a - 1e-9 && beat < b - 1e-9)) { fade = 0; flash = 0; }

  grade.uniforms.uTime.value = Math.floor(f);
  grade.uniforms.uFlash.value = flash;
  grade.uniforms.uFade.value = fade;
  grade.uniforms.uVignette.value = post.vignette ?? 0.9;
  grade.uniforms.uGrain.value = post.grain ?? 0.025;
  composer.render();
};

// motion blur: average n sub-frames spanning a 180° shutter, via a 2D canvas accumulator
const acc = document.createElement('canvas'); acc.width = W * PR; acc.height = H * PR;
const g2 = acc.getContext('2d');
window.renderFrameBlur = function (f, n = 3) {
  const gl = renderer.domElement;
  const beat = f / BEAT_FRAMES;
  const sh = SHOTS.find(s => beat >= s.s - 1e-9 && beat < s.s + s.l - 1e-9) || SHOTS[SHOTS.length - 1];
  const f0 = sh.s * BEAT_FRAMES, f1 = (sh.s + sh.l) * BEAT_FRAMES - 0.01;
  for (let j = 0; j < n; j++) {
    window.renderFrame(Math.min(f1, Math.max(f0, f + (j / n - 0.5) * 0.5)));
    g2.globalAlpha = 1 / (j + 1);
    g2.drawImage(gl, 0, 0);
  }
  g2.globalAlpha = 1;
  return acc.toDataURL('image/png');
};
window.ready = true;

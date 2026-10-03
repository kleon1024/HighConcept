import { THREE, W, H, gradeShader, clamp, smooth, range } from './core.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FPS, DURATION, SILENCE } from './plan.js';
import { actVoid, actMatter, actLife, actMind, actSeeing } from './acts.js';

const PR = Number(new URLSearchParams(location.search).get('scale') || 1);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(PR); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W * PR, H * PR, { type: THREE.HalfFloatType, samples: 4 }));
const pass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
const bloom = new UnrealBloomPass(new THREE.Vector2(W * PR, H * PR), 0.9, 0.7, 0.55);
const grade = new ShaderPass(gradeShader);
composer.addPass(pass); composer.addPass(bloom); composer.addPass(new OutputPass()); composer.addPass(grade);

// acts are built lazily; MIND grows out of LIFE's final cell positions
const built = {};
const get = k => {
  if (!built[k]) built[k] = k === 'void' ? actVoid() : k === 'matter' ? actMatter() : k === 'life' ? actLife() : k === 'mind' ? actMind(get('life')) : actSeeing();
  return built[k];
};
// [act, start, end] — overlaps are crossfades
const SPANS = [['void', 0, 5], ['matter', 5, 10.35], ['life', 10, 17.35], ['mind', 17, 25.35], ['seeing', 25.35, 30.01]];
const XFADE = { matter: 0, life: 0.35, mind: 0.35, seeing: 0 };

function renderAct(k, t) {
  const a = get(k);
  pass.scene = a.scene; pass.camera = a.cam;
  const post = a.update(t) || {};
  bloom.strength = post.bloom ?? 0.9; bloom.threshold = post.threshold ?? 0.55;
  grade.uniforms.uTime.value = Math.floor(t * FPS);
  grade.uniforms.uFade.value = SILENCE[0] <= t && t < SILENCE[1] ? 0 : 1;
  composer.render();
  return renderer.domElement;
}

const comp = document.createElement('canvas'); comp.width = W * PR; comp.height = H * PR;
const cg = comp.getContext('2d');
function composite(t) {
  const live = SPANS.filter(([, a, b]) => t >= a && t < b);
  cg.globalAlpha = 1; cg.fillStyle = '#000'; cg.fillRect(0, 0, comp.width, comp.height);
  live.forEach(([k, a], i) => {
    const xf = XFADE[k] || 0;
    cg.globalAlpha = i === 0 ? 1 : (xf ? smooth(range(t, a, a + xf)) : 1);
    cg.drawImage(renderAct(k, t), 0, 0);
  });
  cg.globalAlpha = 1;
  return comp;
}

const acc = document.createElement('canvas'); acc.width = W * PR; acc.height = H * PR;
const ag = acc.getContext('2d');
window.renderOut = function (f, n = 1) {
  for (let j = 0; j < n; j++) {
    const t = clamp((f + (n > 1 ? (j / n - 0.5) * 0.5 : 0)) / FPS, 0, DURATION - 1e-4);
    ag.globalAlpha = 1 / (j + 1);
    ag.drawImage(composite(t), 0, 0);
  }
  ag.globalAlpha = 1;
  return acc.toDataURL('image/png');
};
window.ready = true;

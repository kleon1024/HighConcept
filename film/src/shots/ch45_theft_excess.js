// IV 盗 — firelight and bronze; V 繁 — marble and gilt, silicon blue, the void.
import {
  THREE, TAU, clamp, lerp, smooth, smoother, easeOut, easeIn, easeInOut, range, v3, col, rng, fbm, noise3,
  displace, backdrop, rig, mats, canvasTexture, noiseTexture, Dust, LineBuilder, tube, squareSpiral, crack,
  camera, look, orbit, drift, W, H,
} from '../core.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// ================================================================ shared helpers
const GLSL_NOISE = `
float hash13(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm4(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s; }
`;

// Billboard flame: a plane whose base sits at y=0, shaded by scrolling fbm. Additive, HDR.
// shape: sharp (profile exponent), tongue (break-up near tip), wob (lateral sway)
function flameMesh({ h = 1.5, w = 0.7, core = '#fff2c0', mid = '#ffa030', edge = '#c03008', k = 3, speed = 2.2, wob = 0.5, sharp = 0.75, tongue = 1.0, seed = 1, waist = 0.18 } = {}) {
  const g = new THREE.PlaneGeometry(w, h, 1, 1); g.translate(0, h / 2, 0);
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uK: { value: k }, uSpeed: { value: speed }, uWob: { value: wob }, uSharp: { value: sharp }, uTongue: { value: tongue }, uWaist: { value: waist },
      cCore: { value: col(core) }, cMid: { value: col(mid) }, cEdge: { value: col(edge) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: GLSL_NOISE + `
      uniform float uTime, uSeed, uK, uSpeed, uWob, uSharp, uTongue, uWaist; uniform vec3 cCore, cMid, cEdge; varying vec2 vUv;
      void main(){
        float y = vUv.y; float x = (vUv.x - 0.5) * 2.0; float t = uTime * uSpeed;
        float n1 = fbm4(vec3(x * 1.3, y * 2.2 - t, uSeed));
        float n2 = fbm4(vec3(x * 3.5 + 3.0, y * 4.5 - t * 1.6, uSeed + 7.0));
        x += (n1 - 0.5) * uWob * y * 1.6;
        float prof = pow(clamp(1.0 - y, 0.0, 1.0), uSharp) * smoothstep(-0.03, uWaist, y);
        float d = 1.0 - smoothstep(prof * 0.55, prof, abs(x));
        d *= smoothstep(0.0, 0.5, (1.0 - y) * 1.25 - (n2 - 0.45) * uTongue - 0.12);
        float core = (1.0 - smoothstep(prof * 0.0, prof * 0.5, abs(x))) * smoothstep(0.85, 0.05, y);
        vec3 c = mix(cEdge, cMid, smoothstep(0.0, 0.7, d));
        c = mix(c, cCore, clamp(core * d * 1.3, 0.0, 1.0));
        float a = d * smoothstep(0.0, 0.04, y) * (0.6 + 0.6 * n2);
        gl_FragColor = vec4(c * uK, clamp(a, 0.0, 1.0));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
  mesh.faceCam = (cam, t) => { m.uniforms.uTime.value = t; const wp = mesh.getWorldPosition(v3()); mesh.rotation.y = Math.atan2(cam.position.x - wp.x, cam.position.z - wp.z) - (mesh.parent ? mesh.parent.getWorldQuaternion(new THREE.Quaternion()).y * 0 : 0); };
  return mesh;
}
// smooth deterministic flicker 0..1-ish around 1
const flicker = (t, s = 0) => 1 + 0.14 * Math.sin(t * 13.1 + s) + 0.09 * Math.sin(t * 23.7 + s * 2.1) + 0.06 * Math.sin(t * 41.3 + s * 3.7) + 0.05 * Math.sin(t * 7.3 + s);

// cache tileable noise as raw canvases for painting
const noiseCanvas = (key, o) => noiseTexture(key, o).image;

function rep(tex, n) { const t = tex.clone(); t.repeat.set(n, n); t.needsUpdate = true; return t; }
function plane(w, h, mat, segW = 1, segH = 1) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h, segW, segH), mat); }
function std(color, o = {}) { return new THREE.MeshStandardMaterial({ color: col(color), roughness: 0.8, ...o }); }

// ================================================================ CAVE: paintings texture
function hand(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath();
  g.ellipse(0, 0.15, 0.32, 0.38, 0, 0, TAU);
  const finger = (ax, ay, ang, len, wd) => { g.save(); g.translate(ax, ay); g.rotate(ang); g.moveTo(-wd, 0); g.lineTo(-wd, -len); g.arc(0, -len, wd, Math.PI, 0); g.lineTo(wd, 0); g.closePath(); g.restore(); };
  finger(-0.22, -0.05, -0.18, 0.5, 0.075); finger(-0.08, -0.15, -0.05, 0.62, 0.08); finger(0.07, -0.15, 0.05, 0.6, 0.08); finger(0.2, -0.08, 0.17, 0.5, 0.072); finger(0.3, 0.2, 0.9, 0.4, 0.085);
  g.rect(-0.22, 0.4, 0.42, 0.45);
  g.fill(); g.restore();
}
function bison(g, x, y, s, flip, r) {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); g.translate(-0.5, -0.5);
  const body = () => {
    g.beginPath(); g.moveTo(0.05, 0.55);
    g.bezierCurveTo(0.02, 0.45, 0.08, 0.36, 0.15, 0.33); g.bezierCurveTo(0.2, 0.12, 0.38, 0.04, 0.5, 0.12);
    g.bezierCurveTo(0.65, 0.18, 0.85, 0.2, 0.93, 0.3); g.quadraticCurveTo(0.99, 0.33, 0.97, 0.44); g.lineTo(0.95, 0.56);
    g.lineTo(0.94, 0.86); g.lineTo(0.88, 0.87); g.lineTo(0.85, 0.62); g.quadraticCurveTo(0.62, 0.7, 0.4, 0.63);
    g.lineTo(0.37, 0.89); g.lineTo(0.31, 0.89); g.lineTo(0.27, 0.63); g.quadraticCurveTo(0.19, 0.74, 0.12, 0.66); g.quadraticCurveTo(0.07, 0.62, 0.05, 0.55); g.closePath();
  };
  const gr = g.createLinearGradient(0, 0.1, 0, 0.9); gr.addColorStop(0, 'rgba(50,30,20,0.9)'); gr.addColorStop(0.35, 'rgba(150,70,35,0.8)'); gr.addColorStop(1, 'rgba(190,120,60,0.6)');
  body(); g.fillStyle = gr; g.fill();
  // dark head and hump like Lascaux
  g.save(); body(); g.clip(); g.fillStyle = 'rgba(25,14,8,0.85)'; g.beginPath(); g.ellipse(0.2, 0.42, 0.17, 0.22, 0.3, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.42, 0.18, 0.2, 0.1, 0.1, 0, TAU); g.fill();
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '230,140,60' : '60,30,15'},${r() * 0.25})`; g.beginPath(); g.arc(r(), r(), r() * 0.025, 0, TAU); g.fill(); }
  g.restore();
  g.lineWidth = 0.012; g.strokeStyle = 'rgba(20,12,8,0.9)'; body(); g.stroke();
  // horns + tail
  g.lineWidth = 0.012; g.beginPath(); g.moveTo(0.14, 0.33); g.quadraticCurveTo(0.1, 0.2, 0.2, 0.18); g.moveTo(0.17, 0.32); g.quadraticCurveTo(0.2, 0.22, 0.27, 0.22); g.moveTo(0.97, 0.4); g.quadraticCurveTo(1.02, 0.55, 0.99, 0.66); g.stroke();
  g.restore();
}
function caveWallTexture() {
  return canvasTexture('cave-wall-paint', 2048, 1024, (g, w, h) => {
    const r = rng(41);
    g.fillStyle = '#a08468'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    const n1 = noiseCanvas('rough-mid', { scale: 12, contrast: 1.4 }), n2 = noiseCanvas('rough-fine', { scale: 40, contrast: 1.5 });
    g.globalAlpha = 0.28; for (let i = 0; i < 2; i++) g.drawImage(n1, i * 1024, 0, 1024, 1024);
    g.globalAlpha = 0.22; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) g.drawImage(n2, i * 256, j * 256, 256, 256);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    // mineral stains
    for (let i = 0; i < 60; i++) { const x = r() * w, y = r() * h, rad = r.range(40, 220); const gg = g.createRadialGradient(x, y, 0, x, y, rad); const c = r() < 0.5 ? '190,150,110' : '70,55,45'; gg.addColorStop(0, `rgba(${c},0.18)`); gg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    // painted bison & horse-like herd (upper band)
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.85;
    bison(g, 520, 250, 360, false, r); bison(g, 1180, 210, 300, true, r); bison(g, 1640, 330, 250, false, r); bison(g, 860, 420, 200, true, r);
    // hand stencils: spray around a hand-shaped mask
    const tmp = document.createElement('canvas'); tmp.width = 220; tmp.height = 260; const t2 = tmp.getContext('2d');
    [[230, 520, 0.3], [330, 470, -0.2], [1460, 560, 0.1], [1900, 420, -0.4], [120, 300, 0.5]].forEach(([x, y, rot], k) => {
      t2.clearRect(0, 0, 220, 260);
      for (let i = 0; i < 1600; i++) { const a = r() * TAU, d = Math.pow(r(), 0.6) * 110; t2.fillStyle = `rgba(${k % 2 ? '150,45,25' : '190,95,40'},${r() * 0.35})`; t2.beginPath(); t2.arc(110 + Math.cos(a) * d, 130 + Math.sin(a) * d * 1.1, r() * 3 + 0.5, 0, TAU); t2.fill(); }
      t2.globalCompositeOperation = 'destination-out'; t2.fillStyle = '#000'; hand(t2, 110, 130, 130, rot); t2.globalCompositeOperation = 'source-over';
      g.drawImage(tmp, x - 110, y - 130);
    });
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  });
}

function prisoner(r, mat) {
  const G = new THREE.Group();
  const cap = (rad, len, pos, rx = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.CapsuleGeometry(rad, len, 6, 12), mat); m.position.copy(pos); m.rotation.set(rx, 0, rz); m.castShadow = true; G.add(m); return m; };
  const lean = r.range(0.15, 0.45);
  cap(0.24, 0.42, v3(0, 0.62, 0), -lean);                       // torso (leaning toward the wall, -z)
  const sh = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), mat); sh.scale.set(1.25, 0.6, 0.85); sh.position.set(0, 0.92, -0.12 - lean * 0.25); sh.castShadow = true; G.add(sh);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 20, 16), mat); head.scale.set(0.95, 1.1, 1.05); head.position.set(0, 1.13, -0.2 - lean * 0.3); head.castShadow = true; G.add(head);
  cap(0.075, 0.3, v3(-0.3, 0.72, -0.25), 0.9, 0.15); cap(0.075, 0.3, v3(0.3, 0.72, -0.25), 0.9, -0.15); // arms reaching to knees
  cap(0.1, 0.4, v3(-0.13, 0.36, -0.42), 1.25); cap(0.1, 0.4, v3(0.13, 0.36, -0.42), 1.25);                 // thighs
  G.rotation.y = r.range(-0.12, 0.12);
  return G;
}

// ================================================================ FLAME TEST data
const ELEMENTS = {
  Li: { core: '#ff8090', mid: '#ff1040', edge: '#900018', light: '#ff2050', name: 'Li', k: 1.3 },
  K: { core: '#f0c0ff', mid: '#a860ff', edge: '#5020b0', light: '#c090ff', name: 'K', k: 1.1 },
  Cu: { core: '#b0ffc0', mid: '#10e070', edge: '#00805a', light: '#30ff90', name: 'Cu', k: 1.2 },
  Na: { core: '#fff0a0', mid: '#ffb010', edge: '#ff6a00', light: '#ffb020', name: 'Na', k: 1.5 },
};
function bunsen(brass) {
  const G = new THREE.Group();
  const prof = [[0, 0], [0.42, 0], [0.45, 0.02], [0.45, 0.06], [0.4, 0.09], [0.16, 0.12], [0.1, 0.16], [0.1, 0.36], [0.13, 0.37], [0.13, 0.52], [0.105, 0.53], [0.095, 0.56], [0.095, 1.58], [0.105, 1.6], [0.085, 1.6], [0.085, 1.0]];
  const lathe = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, y)), 64);
  const body = new THREE.Mesh(lathe, brass); body.castShadow = true; G.add(body);
  // air-hole collar (dark holes drawn into a texture on a ring)
  const holeTex = canvasTexture('bunsen-holes', 256, 64, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse((i + 0.5) * w / 4, h / 2, 14, 18, 0, 0, TAU); g.fill(); } }, { srgb: true });
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.133, 0.133, 0.13, 48, 1, true), brass.clone()); collar.material.map = holeTex; collar.position.y = 0.445; G.add(collar);
  // gas inlet
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 20), brass); inlet.rotation.z = Math.PI / 2; inlet.position.set(0.3, 0.22, 0); G.add(inlet);
  const hose = new THREE.Mesh(tube([v3(0.5, 0.22, 0), v3(0.85, 0.2, 0.1), v3(1.3, 0.06, 0.6), v3(2.2, 0.06, 1.4), v3(4, 0.06, 2.0)], 0.055, 80, 14), new THREE.MeshPhysicalMaterial({ color: col('#b0502a'), roughness: 0.45, clearcoat: 0.5 }));
  hose.castShadow = true; G.add(hose);
  return G;
}
function spectrumCardTexture() {
  return canvasTexture('na-spectrum-card', 2048, 512, (g, w, h) => {
    g.fillStyle = '#050403'; g.fillRect(0, 0, w, h);
    const x = nm => (nm - 400) / 300 * w;
    // faint ghost of the continuous spectrum (reference strip)
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[400, '#3a0060'], [450, '#0020a0'], [490, '#00a0a0'], [530, '#00a020'], [575, '#c0c000'], [600, '#d06000'], [650, '#b00000'], [700, '#300000']].forEach(([nm, c]) => gr.addColorStop((nm - 400) / 300, c));
    g.globalAlpha = 0.18; g.fillStyle = gr; g.fillRect(0, h * 0.78, w, h * 0.06); g.globalAlpha = 1;
    // scale
    g.strokeStyle = '#8a7a60'; g.fillStyle = '#b8a888'; g.lineWidth = 2; g.font = '28px Georgia, serif'; g.textAlign = 'center';
    for (let nm = 400; nm <= 700; nm += 10) { const X = x(nm); g.beginPath(); g.moveTo(X, h * 0.88); g.lineTo(X, h * (nm % 50 ? 0.91 : 0.94)); g.stroke(); if (nm % 50 === 0) g.fillText(String(nm), X, h * 0.985); }
    g.beginPath(); g.moveTo(0, h * 0.88); g.lineTo(w, h * 0.88); g.stroke();
  });
}


// ================================================================ DING: relief drawings (height maps) → bump + colour
function yunlei(g, x0, y0, w, h, cell, color, lw) {
  g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
  g.strokeStyle = color; g.lineWidth = lw; g.lineCap = 'square'; g.lineJoin = 'miter';
  const sp = squareSpiral(2.5, 0.2);
  for (let j = 0; j * cell < h + cell; j++) for (let i = 0; i * cell < w + cell; i++) {
    const cx = x0 + (i + 0.5) * cell, cy = y0 + (j + 0.5) * cell, fl = (i + j) % 2 ? -1 : 1;
    g.beginPath(); sp.forEach((p, k) => { const X = cx + p.x * fl * cell * 0.8, Y = cy + p.y * cell * 0.8; k ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.stroke();
  }
  g.restore();
}
// symmetric taotie mask, unit coords x∈[-1,1] (half-width), y down; drawn as raised (light) shapes
function taotie(g, cx, cy, S) {
  const P = (x, y) => [cx + x * S, cy + y * S];
  const half = (sgn) => {
    g.save(); g.translate(cx, cy); g.scale(sgn * S, S);
    g.fillStyle = '#d8d8d8'; g.strokeStyle = '#3a3a3a'; g.lineWidth = 0.022;
    // horn: big C-curl above the eye
    g.beginPath(); g.moveTo(0.1, -0.22); g.bezierCurveTo(0.12, -0.62, 0.6, -0.78, 0.78, -0.5); g.bezierCurveTo(0.88, -0.32, 0.7, -0.18, 0.56, -0.3);
    g.bezierCurveTo(0.48, -0.38, 0.56, -0.48, 0.64, -0.44); g.bezierCurveTo(0.6, -0.6, 0.3, -0.52, 0.26, -0.24); g.closePath(); g.fill(); g.stroke();
    // brow / face plate around the eye
    g.beginPath(); g.moveTo(0.08, -0.2); g.bezierCurveTo(0.3, -0.26, 0.5, -0.2, 0.56, -0.02); g.bezierCurveTo(0.56, 0.14, 0.4, 0.2, 0.2, 0.16); g.lineTo(0.08, 0.12); g.closePath(); g.fill(); g.stroke();
    // body + tail curl running out to the side
    g.beginPath(); g.moveTo(0.58, -0.08); g.bezierCurveTo(0.75, -0.14, 0.9, -0.1, 0.95, 0.04); g.bezierCurveTo(1.0, 0.2, 0.86, 0.26, 0.8, 0.16); g.bezierCurveTo(0.76, 0.1, 0.82, 0.06, 0.86, 0.1);
    g.bezierCurveTo(0.84, 0.0, 0.72, 0.0, 0.6, 0.08); g.closePath(); g.fill(); g.stroke();
    // foot / claw under the body
    g.beginPath(); g.moveTo(0.66, 0.12); g.lineTo(0.7, 0.36); g.lineTo(0.84, 0.4); g.lineTo(0.78, 0.46); g.lineTo(0.62, 0.42); g.lineTo(0.58, 0.16); g.closePath(); g.fill(); g.stroke();
    // ear
    g.beginPath(); g.moveTo(0.5, -0.24); g.quadraticCurveTo(0.66, -0.3, 0.64, -0.14); g.quadraticCurveTo(0.58, -0.1, 0.5, -0.16); g.closePath(); g.fill(); g.stroke();
    // upper jaw with curled fang
    g.beginPath(); g.moveTo(0.1, 0.24); g.bezierCurveTo(0.3, 0.26, 0.46, 0.28, 0.5, 0.42); g.bezierCurveTo(0.52, 0.56, 0.36, 0.6, 0.32, 0.5); g.bezierCurveTo(0.3, 0.44, 0.38, 0.42, 0.4, 0.46);
    g.bezierCurveTo(0.38, 0.36, 0.24, 0.36, 0.1, 0.36); g.closePath(); g.fill(); g.stroke();
    // incised inner lines (detail grooves)
    g.strokeStyle = '#6a6a6a'; g.lineWidth = 0.014;
    g.beginPath(); g.moveTo(0.18, -0.28); g.bezierCurveTo(0.24, -0.56, 0.56, -0.68, 0.7, -0.5); g.moveTo(0.64, -0.06); g.bezierCurveTo(0.76, -0.08, 0.88, -0.04, 0.9, 0.06); g.stroke();
    // eye: almond with round pupil (highest)
    g.fillStyle = '#efefef'; g.strokeStyle = '#2a2a2a'; g.lineWidth = 0.02;
    g.beginPath(); g.moveTo(0.14, -0.02); g.bezierCurveTo(0.2, -0.13, 0.4, -0.14, 0.48, -0.02); g.bezierCurveTo(0.4, 0.07, 0.2, 0.07, 0.14, -0.02); g.fill(); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0.31, -0.03, 0.065, 0, TAU); g.fill(); g.stroke();
    g.restore();
  };
  half(1); half(-1);
  // nose ridge + nostrils (centre)
  g.save(); g.translate(cx, cy); g.scale(S, S); g.fillStyle = '#e4e4e4'; g.strokeStyle = '#3a3a3a'; g.lineWidth = 0.022;
  g.beginPath(); g.moveTo(-0.05, -0.62); g.lineTo(0.05, -0.62); g.lineTo(0.07, 0.12); g.bezierCurveTo(0.2, 0.12, 0.22, 0.3, 0.08, 0.3); g.lineTo(-0.08, 0.3); g.bezierCurveTo(-0.22, 0.3, -0.2, 0.12, -0.07, 0.12); g.closePath(); g.fill(); g.stroke();
  g.restore();
}
function dingRelief(key, w, h, withMask) {
  return canvasTexture(key, w, h, (g) => {
    g.fillStyle = '#5a5a5a'; g.fillRect(0, 0, w, h);
    const b = h * 0.075; // border with nipple bosses
    // raised frame lines
    g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, w, h * 0.03); g.fillRect(0, h * 0.2, w, h * 0.015);
    // upper frieze: small cloud-thunder band
    yunlei(g, 0, h * 0.035, w, h * 0.16, h * 0.08, '#8a8a8a', h * 0.008);
    // main field ground
    yunlei(g, b, h * 0.23, w - 2 * b, h * 0.77 - b, h * 0.06, '#7c7c7c', h * 0.006);
    // nipple bosses (乳钉) along sides and bottom
    const boss = (x, y, r) => { const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#bbbbbb'); gr.addColorStop(1, '#5a5a5a'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
    const step = b * 1.05;
    for (let y = h * 0.23 + step * 0.5; y < h - b * 0.5; y += step) { boss(b * 0.5, y, b * 0.32); boss(w - b * 0.5, y, b * 0.32); }
    for (let x = b * 1.5; x < w - b; x += step) boss(x, h - b * 0.5, b * 0.32);
    g.fillStyle = '#9a9a9a'; g.fillRect(b - 3, h * 0.215, 6, h * 0.785 - b); g.fillRect(w - b - 3, h * 0.215, 6, h * 0.785 - b); g.fillRect(b, h - b - 3, w - 2 * b, 6);
    if (withMask) taotie(g, w / 2, h * 0.56, Math.min((w - 2 * b) * 0.48, h * 0.62));
  }, { srgb: false });
}
// colour: polished bronze on the raised parts, verdigris + dark earth in the recesses
function dingColor(key, relief) {
  return canvasTexture(key, relief.image.width, relief.image.height, (g, w, h) => {
    const pat = noiseCanvas('rough-mid', { scale: 12, contrast: 1.4 });
    const rc = relief.image.getContext('2d').getImageData(0, 0, w, h).data;
    g.drawImage(pat, 0, 0, w, h); const nz = g.getImageData(0, 0, w, h); const d = nz.data;
    for (let i = 0; i < d.length; i += 4) {
      const ht = rc[i] / 255, n = d[i] / 255;
      const green = clamp((0.6 - ht) * 2.4 + (n - 0.5) * 0.5);         // recess → verdigris
      const pol = clamp((ht - 0.7) * 3);                                 // high relief → worn bronze
      let r = lerp(78, 58, green), gg = lerp(64, 92, green), b = lerp(44, 74, green);
      r = lerp(r, 140, pol * 0.6); gg = lerp(gg, 100, pol * 0.6); b = lerp(b, 60, pol * 0.6);
      const k = 0.85 + n * 0.3; d[i] = r * k; d[i + 1] = gg * k; d[i + 2] = b * k;
    }
    g.putImageData(nz, 0, 0);
  });
}
function dingPlain() {
  return canvasTexture('ding-plain-h', 512, 512, (g, w, h) => { g.fillStyle = '#707070'; g.fillRect(0, 0, w, h); }, { srgb: false });
}
function eyeEmissive(key, w, h) {
  return canvasTexture(key, w, h, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const b = h * 0.075, S = Math.min((w - 2 * b) * 0.48, h * 0.62), cx = w / 2, cy = h * 0.56;
    [-1, 1].forEach(sg => { const x = cx + sg * 0.31 * S, y = cy - 0.03 * S, gr = g.createRadialGradient(x, y, 0, x, y, 0.07 * S); gr.addColorStop(0, '#fff'); gr.addColorStop(0.6, '#a86020'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, 0.07 * S, 0, TAU); g.fill(); });
  });
}

// ================================================================ ORACLE: plastron
function plastronShape() {
  const R = [[0, 1.5], [0.14, 1.57], [0.4, 1.54], [0.6, 1.4], [0.72, 1.16], [0.76, 0.88], [0.73, 0.66], [0.84, 0.58], [0.95, 0.46], [0.99, 0.2], [0.99, -0.1], [0.96, -0.32], [0.84, -0.44], [0.73, -0.52], [0.75, -0.8], [0.7, -1.12], [0.58, -1.4], [0.4, -1.58], [0.22, -1.63], [0.0, -1.42]];
  const pts = R.map(([x, y]) => new THREE.Vector2(x, y));
  const L = R.slice(1, -1).reverse().map(([x, y]) => new THREE.Vector2(-x, y));
  const curve = new THREE.SplineCurve([...pts, ...L, pts[0].clone()]);
  return new THREE.Shape(curve.getPoints(200));
}
const PL = { w: 2.2, h: 3.4, px: 1024, py: 1584 };
const plX = x => (x + 1.1) / 2.2 * PL.px, plY = y => (1.7 - y) / 3.4 * PL.py;
const PITS = [[0.45, 0.95], [0.42, 0.35], [0.5, -0.25], [0.4, -0.85], [0.72, 0.15], [0.68, -0.55]];
function boneTexture() {
  return canvasTexture('plastron-bone', PL.px, PL.py, (g, w, h) => {
    const r = rng(77);
    g.fillStyle = '#e6d6b4'; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    const n1 = noiseCanvas('rough-mid', { scale: 12, contrast: 1.4 }); g.globalAlpha = 0.18; g.drawImage(n1, 0, 0, w, h);
    g.globalAlpha = 1;
    // age staining toward the rim
    const gr = g.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.75); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(150,110,60,0.7)'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over';
    // scute seams
    g.strokeStyle = 'rgba(110,80,45,0.75)'; g.lineWidth = 3.5;
    g.beginPath(); for (let y = 1.6; y > -1.5; y -= 0.05) { const X = plX(0.012 * Math.sin(y * 9)), Y = plY(y); y === 1.6 ? g.moveTo(X, Y) : g.lineTo(X, Y); } g.stroke();
    [[1.2, 0.18], [0.72, -0.05], [0.08, 0.06], [-0.55, -0.08], [-1.08, 0.12]].forEach(([y0, c]) => { g.beginPath(); for (let x = -1; x <= 1.0001; x += 0.05) { const X = plX(x), Y = plY(y0 + c * x * x + 0.015 * Math.sin(x * 13)); x === -1 ? g.moveTo(X, Y) : g.lineTo(X, Y); } g.stroke(); });
    // chiselled hollows (both sides): oval chisel + round drill, darker, scorched
    PITS.forEach(([x, y]) => [1, -1].forEach(sg => {
      const X = plX(x * sg), Y = plY(y);
      g.fillStyle = 'rgba(95,60,30,0.85)'; g.beginPath(); g.ellipse(X, Y, 14, 30, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(70,40,20,0.85)'; g.beginPath(); g.arc(X - sg * 24, Y + 4, 13, 0, TAU); g.fill();
    }));
    // old (cold) 卜 cracks on the left side
    g.strokeStyle = 'rgba(60,35,20,0.8)'; g.lineWidth = 2;
    PITS.slice(0, 4).forEach(([x, y]) => { const X = plX(-x), Y = plY(y); g.beginPath(); g.moveTo(X, Y - 46); g.lineTo(X + 2, Y + 44); g.moveTo(X, Y); g.lineTo(X + 52, Y - 8); g.stroke(); });
    // incised inscriptions (dark, cinnabar-filled)
    g.strokeStyle = 'rgba(120,40,20,0.85)'; drawGlyphs(g, 6);
  });
}
// bump: seams and incisions as grooves, hollows as pits
function boneHeight() {
  return canvasTexture('plastron-height', PL.px / 2, PL.py / 2, (g, w, h) => {
    g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, w, h); g.scale(0.5, 0.5);
    g.strokeStyle = '#606060'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(plX(0), plY(1.6)); g.lineTo(plX(0), plY(-1.5)); g.stroke();
    [[1.2, 0.18], [0.72, -0.05], [0.08, 0.06], [-0.55, -0.08], [-1.08, 0.12]].forEach(([y0, c]) => { g.beginPath(); for (let x = -1; x <= 1.0001; x += 0.05) { const X = plX(x), Y = plY(y0 + c * x * x + 0.015 * Math.sin(x * 13)); x === -1 ? g.moveTo(X, Y) : g.lineTo(X, Y); } g.stroke(); });
    PITS.forEach(([x, y]) => [1, -1].forEach(sg => {
      const X = plX(x * sg), Y = plY(y);
      let gr = g.createRadialGradient(X, Y, 2, X, Y, 32); gr.addColorStop(0, '#000'); gr.addColorStop(0.8, '#404040'); gr.addColorStop(1, '#c0c0c0'); g.fillStyle = gr; g.beginPath(); g.ellipse(X, Y, 16, 32, 0, 0, TAU); g.fill();
      gr = g.createRadialGradient(X - sg * 24, Y + 4, 1, X - sg * 24, Y + 4, 15); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#a0a0a0'); g.fillStyle = gr; g.beginPath(); g.arc(X - sg * 24, Y + 4, 15, 0, TAU); g.fill();
    }));
    g.strokeStyle = '#303030'; drawGlyphs(g, 7);
  }, { srgb: false });
}
// four oracle-bone glyphs in a column: 日 sun, 目 eye, 火 fire, 人 person. If stage, R channel encodes order.
function drawGlyphs(g, lw, enc = false) {
  const s = 54; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  const at = (k) => [plX(0.2), plY(0.95 - k * 0.36)];
  const st = k => { if (enc) g.strokeStyle = `rgb(${60 + k * 60},255,0)`; };
  let [x, y] = at(0); st(0); g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.6, 0, 0, TAU); g.moveTo(x - s * 0.18, y); g.lineTo(x + s * 0.18, y); g.stroke();             // 日
  [x, y] = at(1); st(1); g.beginPath(); g.moveTo(x - s * 0.8, y); g.quadraticCurveTo(x, y - s * 0.75, x + s * 0.8, y); g.quadraticCurveTo(x, y + s * 0.75, x - s * 0.8, y); g.moveTo(x + s * 0.27, y); g.arc(x, y, s * 0.27, 0, TAU); g.stroke(); // 目
  [x, y] = at(2); st(2); g.beginPath(); g.moveTo(x - s * 0.7, y - s * 0.2); g.quadraticCurveTo(x - s * 0.6, y + s * 0.55, x, y + s * 0.55); g.quadraticCurveTo(x + s * 0.6, y + s * 0.55, x + s * 0.7, y - s * 0.2);
  g.moveTo(x - s * 0.35, y + s * 0.3); g.lineTo(x - s * 0.45, y - s * 0.25); g.moveTo(x, y + s * 0.45); g.lineTo(x, y - s * 0.65); g.moveTo(x + s * 0.35, y + s * 0.3); g.lineTo(x + s * 0.45, y - s * 0.25); g.stroke(); // 火
  [x, y] = at(3); st(3); g.beginPath(); g.moveTo(x + s * 0.2, y - s * 0.65); g.quadraticCurveTo(x - s * 0.05, y, x - s * 0.45, y + s * 0.6); g.moveTo(x + s * 0.02, y - s * 0.15); g.quadraticCurveTo(x + s * 0.35, y + s * 0.1, x + s * 0.4, y + s * 0.45); g.stroke(); // 人
}
// crack field: R = arrival (stage + fraction), G = presence
function crackTexture() {
  return canvasTexture('plastron-crack', PL.px, PL.py, (g, w, h) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    const r = rng(345);
    const [cx, cy] = PITS[1];
    const segs = [];
    const path = (pts, k0, k1, lw) => { for (let i = 0; i < pts.length - 1; i++) segs.push({ a: pts[i], b: pts[i + 1], t: lerp(k0, k1, i / (pts.length - 1)), lw }); };
    const jag = (a, b, n, rough) => { const pts = []; for (let i = 0; i <= n; i++) { const s = i / n; pts.push([lerp(a[0], b[0], s) + (i && i < n ? r.range(-rough, rough) : 0), lerp(a[1], b[1], s) + (i && i < n ? r.range(-rough, rough) * 0.4 : 0)]); } return pts; };
    path(jag([cx, cy], [cx + 0.01, cy + 0.2], 6, 0.02), 0, 0.7, 11);           // stage 0: crack starts at the hollow
    path(jag([cx, cy], [cx - 0.01, cy - 0.18], 6, 0.02), 0, 0.7, 11);
    path(jag([cx + 0.01, cy + 0.2], [cx + 0.0, cy + 0.55], 8, 0.025), 1, 1.8, 10); // stage 1: the long vertical stroke of 卜
    path(jag([cx - 0.01, cy - 0.18], [cx + 0.02, cy - 0.5], 8, 0.025), 1, 1.8, 10);
    path(jag([cx, cy + 0.02], [cx + 0.42, cy + 0.12], 10, 0.03), 2, 2.85, 9);    // stage 2: the side branch of 卜
    for (let k = 0; k < 7; k++) { const a = [cx + r.range(-0.02, 0.3), cy + r.range(-0.4, 0.4)]; path(jag(a, [a[0] + r.range(-0.15, 0.2), a[1] + r.range(-0.15, 0.15)], 5, 0.02), 3, 3.8, 4.5); } // stage 3: hairlines
    g.lineCap = 'round';
    segs.forEach(sg => { g.strokeStyle = `rgb(${Math.round(sg.t / 4 * 255)},255,0)`; g.lineWidth = sg.lw; g.beginPath(); g.moveTo(plX(sg.a[0]), plY(sg.a[1])); g.lineTo(plX(sg.b[0]), plY(sg.b[1])); g.stroke(); });
  }, { srgb: false });
}
function glyphTexture() {
  return canvasTexture('plastron-glyph', PL.px, PL.py, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, PL.px, PL.py); drawGlyphs(g, 11, true); }, { srgb: false });
}
function woodTexture() {
  return canvasTexture('dark-wood', 1024, 1024, (g, w, h) => {
    const r = rng(5); g.fillStyle = '#2a170c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const y0 = r() * h, a = r.range(4, 18), f = r.range(0.002, 0.008), ph = r() * TAU; g.strokeStyle = r() < 0.5 ? `rgba(80,45,22,${r() * 0.5})` : `rgba(10,5,2,${r() * 0.5})`; g.lineWidth = r.range(1, 5); g.beginPath(); for (let x = 0; x <= w; x += 16) { const y = y0 + Math.sin(x * f + ph) * a; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  });
}


// fat screen-space line segments with progressive reveal (pts: flat array of segment endpoint pairs)
function fatLines(segs, color, width = 2.5, k = 1.5) {
  const pos = []; segs.forEach(([a, b]) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z));
  const g = new LineSegmentsGeometry(); g.setPositions(pos);
  const m = new LineMaterial({ color: col(color).multiplyScalar(k), linewidth: width, transparent: true, depthWrite: false, depthTest: false });
  m.resolution.set(W, H);
  const l = new LineSegments2(g, m); l.frustumCulled = false; l.renderOrder = 10;
  const n = segs.length; l.reveal = u => { g.instanceCount = Math.floor(clamp(u) * n); };
  return l;
}
function arcPts(c, r, a0, a1, n = 24) { const out = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); out.push(v3(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, c.z)); } return out; }
const toSegs = pts => pts.slice(0, -1).map((p, i) => [p, pts[i + 1]]);
function gradientSky(S, bottom, mid, top, sunDir = null, sunCol = '#ffd8a0', radius = 1400) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { cB: { value: col(bottom) }, cM: { value: col(mid) }, cT: { value: col(top) }, uSun: { value: sunDir || v3(0, -1, 0) }, cS: { value: col(sunCol) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 cB, cM, cT, cS, uSun; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h < 0.08 ? mix(cB, cM, smoothstep(-0.2, 0.08, h)) : mix(cM, cT, smoothstep(0.08, 0.7, h));
        float s = max(0.0, dot(normalize(vP), normalize(uSun))); c += cS * (pow(s, 6.0) * 0.5 + pow(s, 60.0) * 1.5);
        gl_FragColor = vec4(c, 1.0); }`,
  });
  const d = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), m); d.renderOrder = -10; S.add(d); return d;
}
function instanced(geo, mat, mats4) { const im = new THREE.InstancedMesh(geo, mat, mats4.length); mats4.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; return im; }
const M4 = (x, y, z, ry = 0, sx = 1, sy = 1, sz = 1, rx = 0, rz = 0) => new THREE.Matrix4().compose(v3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), v3(sx, sy, sz));

// ================================================================ PARTHENON parts
function flutedShaft(h, rb, rt, flutes = 20) {
  const g = new THREE.CylinderGeometry(1, 1, h, 160, 12, true); g.translate(0, h / 2, 0);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), th = Math.atan2(x, z), s = y / h;
    const ph = ((th / TAU * flutes) % 1 + 1) % 1;
    const R = lerp(rb, rt, s) + 0.025 * Math.sin(Math.PI * s);
    const r = R * (1 - 0.05 * Math.sin(Math.PI * ph));
    P.setXYZ(i, Math.sin(th) * r, y, Math.cos(th) * r);
  }
  g.computeVertexNormals(); return g;
}
function frieze() {
  return canvasTexture('triglyph', 256, 128, (g, w, h) => {
    g.fillStyle = '#e8dcc6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#cdbfa5'; g.fillRect(0, 0, w * 0.4, h); // triglyph block
    g.fillStyle = '#6a5a48'; [0.08, 0.18, 0.28].forEach(x => g.fillRect(x * w - 0.022 * w, h * 0.06, 0.044 * w, h * 0.9));
    g.fillStyle = '#d8ccb4'; g.fillRect(w * 0.45, h * 0.08, w * 0.5, h * 0.84); // metope panel
  });
}

// ================================================================ ARMILLARY parts
function globeTexture() {
  return canvasTexture('antique-globe', 1024, 512, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const lon = x / w * TAU, lat = (0.5 - y / h) * Math.PI;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const n = fbm(px * 1.6 + 4, py * 1.6, pz * 1.6, 5) + 0.08 - 0.12 * Math.abs(py) ** 3;
      const land = n > 0.06;
      const i = (y * w + x) * 4;
      if (land) { const k = clamp((n - 0.06) * 4); img.data[i] = lerp(200, 150, k); img.data[i + 1] = lerp(160, 112, k); img.data[i + 2] = lerp(80, 50, k); }
      else { const k = clamp(-n * 3); img.data[i] = lerp(30, 14, k); img.data[i + 1] = lerp(70, 40, k); img.data[i + 2] = lerp(120, 90, k); }
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.strokeStyle = 'rgba(230,200,140,0.35)'; g.lineWidth = 1;
    for (let k = 1; k < 12; k++) { g.beginPath(); g.moveTo(k * w / 12, 0); g.lineTo(k * w / 12, h); g.stroke(); }
    for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(0, k * h / 6); g.lineTo(w, k * h / 6); g.stroke(); }
  });
}
function bandTexture(key, n, zodiac) {
  return canvasTexture(key, 2048, 64, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 6); g.fillRect(0, h - 6, w, 6);
    g.fillStyle = '#404040';
    for (let i = 0; i < n; i++) { const x = i / n * w; g.fillRect(x, 8, 2, i % 5 ? 10 : 20); }
    if (zodiac) { g.strokeStyle = '#303030'; g.lineWidth = 3; for (let k = 0; k < 12; k++) { const x = (k + 0.5) / 12 * w; g.beginPath(); g.arc(x, h * 0.62, 10, 0, TAU); g.moveTo(x - 14, h * 0.62 - 14); g.lineTo(x + 14, h * 0.62 + 14); g.stroke(); g.fillRect(k / 12 * w - 1, 6, 3, h - 12); } }
  }, { srgb: false });
}

// ================================================================ DOME parts
const DOME = { R: 10, y0: 14, th0: 0.2, sectors: 16, rows: 5 };
// coffer layout in (sector-fraction a∈[0,1), row-param b∈[0,1] from base→oculus); returns depth 0..3 steps
function cofferDepth(a, b) {
  const rb0 = 0.1, rb1 = 0.86; if (b < rb0 || b > rb1) return 0;
  const rr = (b - rb0) / (rb1 - rb0) * DOME.rows, row = Math.floor(rr), fy = rr - row;
  const fx = a; const m = 0.12;
  const ex = Math.min(fx, 1 - fx), ey = Math.min(fy, 1 - fy);
  const e = Math.min(ex, ey);
  if (e < m) return 0;
  return e < m + 0.06 ? 1 : e < m + 0.12 ? 2 : 3;
}
function domeTextures() {
  const Wd = 2048, Hd = 1024;
  const draw = (mode) => (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      const v = 1 - y / h, th = DOME.th0 + (1 - v) * (Math.PI / 2 - DOME.th0), b = 1 - (th - DOME.th0) / (Math.PI / 2 - DOME.th0);
      for (let x = 0; x < w; x++) {
        const sa = (x / w * DOME.sectors) % 1, d = cofferDepth(sa, b), i = (y * w + x) * 4;
        // rosette in the coffer centre
        const rr = (b - 0.1) / 0.76 * DOME.rows, fy = rr - Math.floor(rr);
        const rd = Math.hypot(sa - 0.5, (fy - 0.5)), ros = d === 3 && rd < 0.13;
        if (mode === 'color') {
          let c = d === 0 ? [214, 168, 86] : d === 3 ? [232, 222, 200] : d === 2 ? [205, 160, 80] : [190, 150, 76];
          if (ros) c = [240, 196, 110];
          if (d === 3 && !ros) { const k = 0.9 + 0.1 * Math.sin(x * 0.05) * Math.sin(y * 0.05); c = c.map(q => q * k); }
          img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2];
        } else if (mode === 'mr') { // G roughness, B metalness
          const gold = d !== 3 || ros; img.data[i] = 0; img.data[i + 1] = gold ? 90 : 170; img.data[i + 2] = gold ? 255 : 0;
        } else { const hv = ros ? 255 - rd * 900 : [255, 180, 110, 60][d]; img.data[i] = img.data[i + 1] = img.data[i + 2] = clamp(hv, 0, 255); }
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  };
  return { color: canvasTexture('dome-col', Wd, Hd, draw('color')), mr: canvasTexture('dome-mr', Wd, Hd, draw('mr'), { srgb: false }), bump: canvasTexture('dome-bump', Wd, Hd, draw('bump'), { srgb: false }) };
}
function heavenTexture() {
  return canvasTexture('lantern-heaven', 1024, 1024, (g, w, h) => {
    const r = rng(12);
    let gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, '#fff6d8'); gr.addColorStop(0.22, '#ffd27a'); gr.addColorStop(0.5, '#7aa6d8'); gr.addColorStop(1, '#3a5a98');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const a = r() * TAU, d = r.range(0.28, 0.48) * w, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d, rad = r.range(30, 90); const c = g.createRadialGradient(x, y, 0, x, y, rad); c.addColorStop(0, 'rgba(255,240,220,0.55)'); c.addColorStop(1, 'rgba(255,230,210,0)'); g.fillStyle = c; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    // radiating gilded rays and a dove-like glory
    g.strokeStyle = 'rgba(255,220,140,0.5)'; g.lineWidth = 3; for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 60, h / 2 + Math.sin(a) * 60); g.lineTo(w / 2 + Math.cos(a) * 250, h / 2 + Math.sin(a) * 250); g.stroke(); }
  });
}
function volute(turns = 2.2, r0 = 0.5) {
  const pts = []; for (let i = 0; i <= 80; i++) { const s = i / 80, a = s * turns * TAU, r = r0 * (1 - s * 0.85); pts.push(v3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
  return tube(pts, 0.07, 120, 8);
}

// ================================================================ LIBRARY parts
function hexPts(r, rot = 0) { const out = []; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rot; out.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r)); } return out; }
function spineTexture() {
  return canvasTexture('book-spine', 64, 256, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c89a40'; [0.1, 0.13, 0.85, 0.88].forEach(y => g.fillRect(0, y * h, w, h * 0.015));
    g.fillStyle = '#a07830'; g.fillRect(w * 0.2, h * 0.25, w * 0.6, h * 0.12);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0.4; y < 0.8; y += 0.08) g.fillRect(0, y * h, w, 2);
  });
}


// ================================================================ CHIP parts
function waferTexture() {
  return canvasTexture('wafer-dies', 2048, 2048, (g, w, h) => {
    const r = rng(8), n = 20, c = w / n;
    g.fillStyle = '#1a2230'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = i * c, y = j * c, cx = (i + 0.5) / n - 0.5, cy = (j + 0.5) / n - 0.5;
      if (Math.hypot(cx, cy) > 0.47) continue;
      g.fillStyle = '#3a4a62'; g.fillRect(x + 4, y + 4, c - 8, c - 8);
      // memory arrays + logic blocks
      const blocks = [[0.1, 0.1, 0.45, 0.4, '#5a4a8a'], [0.6, 0.1, 0.3, 0.4, '#3a6a8a'], [0.1, 0.55, 0.8, 0.35, '#7a6a3a'], [0.6, 0.55, 0.3, 0.15, '#4a7a6a']];
      blocks.forEach(([bx, by, bw, bh, cc]) => { g.fillStyle = cc; g.fillRect(x + bx * c, y + by * c, bw * c, bh * c); g.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < bw * c; k += 3) g.fillRect(x + bx * c + k, y + by * c, 1, bh * c); });
      g.fillStyle = '#c8a860'; for (let k = 0; k < 10; k++) { g.fillRect(x + 6 + k * (c - 12) / 10, y + 5, 4, 4); g.fillRect(x + 6 + k * (c - 12) / 10, y + c - 9, 4, 4); }
    }
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55;
    const rb = g.createLinearGradient(0, 0, w, h); ['#ff4080', '#ffa020', '#e0ff40', '#20ffa0', '#20a0ff', '#8040ff', '#ff40c0', '#ffa020', '#40ffa0'].forEach((cc, i, a) => rb.addColorStop(i / (a.length - 1), cc));
    g.fillStyle = rb; g.beginPath(); g.arc(w / 2, h / 2, w * 0.49, 0, TAU); g.fill();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  });
}
function circuitTexture() {
  return canvasTexture('die-circuit', 2048, 2048, (g, w, h) => {
    const r = rng(17);
    g.fillStyle = '#000000'; g.fillRect(0, 0, w, h);
    const trace = (x, y, len, horiz, lw, a) => { g.strokeStyle = `rgba(${lerp(60, 200, a) | 0},${lerp(160, 240, a) | 0},255,${0.35 + a * 0.65})`; g.lineWidth = lw; g.beginPath(); g.moveTo(x, y); let px = x, py = y, hz = horiz; let rem = len; while (rem > 0) { const seg = Math.min(rem, r.range(40, 260)); if (hz) px += (r() < 0.5 ? -1 : 1) * seg; else py += (r() < 0.5 ? -1 : 1) * seg; px = clamp(px, 30, w - 30); py = clamp(py, 30, h - 30); g.lineTo(px, py); hz = !hz; rem -= seg; } g.stroke(); };
    // city grid: arteries
    for (let k = 1; k < 8; k++) { const q = k * w / 8; g.strokeStyle = 'rgba(120,210,255,0.95)'; g.lineWidth = 6; g.beginPath(); g.moveTo(q, 20); g.lineTo(q, h - 20); g.moveTo(20, q); g.lineTo(w - 20, q); g.stroke(); }
    for (let i = 0; i < 900; i++) trace(r() * w, r() * h, r.range(80, 600), r() < 0.5, r.range(1, 3.5), Math.pow(r(), 2));
    // vias + pads
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(200,240,255,${r() * 0.9})`; g.fillRect(r() * w, r() * h, 3, 3); }
    g.fillStyle = '#e0c070'; for (let k = 0; k < 40; k++) { g.fillRect(30 + k * (w - 60) / 40, 6, 22, 22); g.fillRect(30 + k * (w - 60) / 40, h - 28, 22, 22); g.fillRect(6, 30 + k * (h - 60) / 40, 22, 22); g.fillRect(w - 28, 30 + k * (h - 60) / 40, 22, 22); }
  });
}
function windowsTexture() {
  return canvasTexture('city-windows', 64, 128, (g, w, h) => {
    const r = rng(90); g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    for (let y = 4; y < h - 4; y += 8) for (let x = 4; x < w - 4; x += 10) if (r() < 0.55) { g.fillStyle = `rgba(160,220,255,${r.range(0.4, 1)})`; g.fillRect(x, y, 5, 4); }
  });
}
// ================================================================ BABEL parts
function arcadeTexture() {
  return canvasTexture('babel-arcade', 256, 256, (g, w, h) => {
    const r = rng(4);
    g.fillStyle = '#a89880'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(60,50,40,0.25)'; for (let y = 0; y < h; y += 12) { g.fillRect(0, y, w, 1.5); for (let x = (y / 12 % 2) * 12; x < w; x += 24) g.fillRect(x, y, 1.5, 12); }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,240,220' : '40,30,20'},${r() * 0.08})`; g.fillRect(r() * w, r() * h, r() * 20, r() * 12); }
    const arch = (cx, top, aw, ah) => { g.fillStyle = '#e0d4bc'; g.beginPath(); g.moveTo(cx - aw / 2 - 6, top + ah); g.lineTo(cx - aw / 2 - 6, top + aw / 2); g.arc(cx, top + aw / 2, aw / 2 + 6, Math.PI, 0); g.lineTo(cx + aw / 2 + 6, top + ah); g.fill();
      g.fillStyle = '#16120e'; g.beginPath(); g.moveTo(cx - aw / 2, top + ah); g.lineTo(cx - aw / 2, top + aw / 2); g.arc(cx, top + aw / 2, aw / 2, Math.PI, 0); g.lineTo(cx + aw / 2, top + ah); g.fill(); };
    arch(w * 0.25, h * 0.12, w * 0.3, h * 0.36); arch(w * 0.75, h * 0.12, w * 0.3, h * 0.36);
    arch(w * 0.25, h * 0.58, w * 0.26, h * 0.3); arch(w * 0.75, h * 0.58, w * 0.26, h * 0.3);
    g.fillStyle = '#c8b8a0'; g.fillRect(0, h * 0.5, w, h * 0.04); g.fillRect(0, h * 0.95, w, h * 0.05);
  });
}
function cloudTexture() {
  return canvasTexture('soft-cloud', 256, 256, (g, w, h) => {
    const r = rng(21);
    for (let i = 0; i < 40; i++) { const x = w / 2 + r.gauss() * w * 0.14, y = h / 2 + r.gauss() * h * 0.07, rad = r.range(25, 70); const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
  });
}

// ================================================================ shots
export const shots = {
  // ── Plato's cave: fire, prisoners, shadows of the ideal solids, painted bison ──
  cave() {
    const S = new THREE.Scene(), C = camera(42);
    backdrop(S, 'theft');
    S.fog = new THREE.Fog(col('#0a0402'), 14, 32);
    const r = rng(28);
    // rock wall (concave, displaced) with Lascaux paintings
    const wallG = new THREE.PlaneGeometry(26, 11, 220, 100);
    displace(wallG, (v) => { const n = fbm(v.x * 0.35, v.y * 0.35, 1.3, 5); return v3(v.x, v.y, v.z + n * 0.9 + 0.012 * v.x * v.x - 0.1 * Math.max(0, v.y - 3) ** 2); });
    const wall = new THREE.Mesh(wallG, new THREE.MeshStandardMaterial({ map: caveWallTexture(), roughness: 0.95, bumpMap: noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), bumpScale: 4 }));
    wall.position.set(0, 4.2, -6); wall.receiveShadow = true; S.add(wall);
    const floorG = new THREE.PlaneGeometry(30, 20, 120, 80);
    displace(floorG, v => v3(v.x, v.y, v.z + fbm(v.x * 0.4, v.y * 0.4, 5, 4) * 0.35));
    const floor = new THREE.Mesh(floorG, mats.stone('#4a3628', { bumpScale: 0.8, bumpMap: rep(noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), 6) })); floor.rotation.x = -Math.PI / 2; floor.position.z = 2; floor.receiveShadow = true; S.add(floor);
    // low parapet behind which the carriers walk
    const parG = new THREE.BoxGeometry(16, 0.6, 0.5, 64, 4, 2); displace(parG, v => v.add(v3(0, 0, fbm(v.x, v.y * 2, 2, 3) * 0.06)));
    const parapet = new THREE.Mesh(parG, mats.stone('#5a4434', { bumpMap: rep(noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), 4) })); parapet.position.set(0, 0.3, 1.0); parapet.castShadow = true; parapet.receiveShadow = true; S.add(parapet);
    // prisoners, seated in a row facing the wall
    const skin = new THREE.MeshStandardMaterial({ color: col('#3a2418'), roughness: 0.85 });
    [-4.4, -2.3, -0.4, 1.6, 3.7].forEach((x, i) => { const pz = prisoner(r, skin); pz.position.set(x + r.range(-0.2, 0.2), 0, -2.6 + r.range(-0.2, 0.2)); pz.scale.setScalar(r.range(0.95, 1.08)); S.add(pz); });
    // the fire: charred logs, embers, layered flames, flickering shadow-casting light
    const fire = new THREE.Group(); fire.position.set(0.9, 0, 3.5); S.add(fire);
    const ember = new THREE.MeshStandardMaterial({ color: col('#1a0f0a'), roughness: 0.9, emissive: col('#ff4a10'), emissiveIntensity: 1.5, emissiveMap: noiseTexture('ember-noise', { size: 256, scale: 10, contrast: 2.5, srgb: true }) });
    for (let i = 0; i < 6; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.1, 10), ember); const a = i / 6 * TAU; lg.position.set(Math.cos(a) * 0.3, 0.2, Math.sin(a) * 0.3); lg.lookAt(v3(0, 0.75, 0)); lg.rotateX(Math.PI / 2); fire.add(lg); }
    for (let i = 0; i < 10; i++) { const st = new THREE.Mesh(new THREE.DodecahedronGeometry(r.range(0.12, 0.2), 0), mats.stone('#3a2c24')); const a = i / 10 * TAU; st.position.set(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62); st.rotation.set(r() * 3, r() * 3, 0); fire.add(st); }
    const flames = [
      flameMesh({ h: 1.9, w: 1.0, k: 1.25, seed: 1.3, wob: 0.6, tongue: 1.3 }),
      flameMesh({ h: 1.4, w: 0.75, k: 1.0, seed: 5.1, wob: 0.8, tongue: 1.2, speed: 2.8 }),
      flameMesh({ h: 1.0, w: 0.8, k: 1.0, seed: 9.7, core: '#fff0c8', mid: '#ffa040', speed: 3.2, tongue: 0.8 }),
    ];
    flames[0].position.set(0, 0.12, 0); flames[1].position.set(-0.18, 0.12, 0.1); flames[2].position.set(0.15, 0.1, -0.05);
    flames.forEach(f => fire.add(f));
    const fl = new THREE.PointLight(col('#ff8a30'), 30, 0, 1.15); fl.position.set(0.6, 1.05, 3.6); fl.castShadow = true;
    fl.shadow.mapSize.set(1024, 1024); fl.shadow.bias = -0.004; fl.shadow.radius = 3; fl.shadow.camera.near = 0.2; fl.shadow.camera.far = 30; S.add(fl);
    const hemi = new THREE.HemisphereLight(col('#ff9a50'), col('#100604'), 0.12); S.add(hemi);
    // the forms carried past on poles: the five Platonic solids
    const geos = [new THREE.TetrahedronGeometry(0.42), new THREE.BoxGeometry(0.52, 0.52, 0.52), new THREE.OctahedronGeometry(0.42), new THREE.DodecahedronGeometry(0.4), new THREE.IcosahedronGeometry(0.42)];
    const wood = new THREE.MeshStandardMaterial({ color: col('#6a4a2a'), roughness: 0.6 });
    const solids = geos.map((g, i) => {
      const grp = new THREE.Group();
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: col('#7a5a3a'), metalness: 0.5, roughness: 0.5 })); m.castShadow = true; grp.add(m);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 1.6, 8), wood); pole.position.y = -0.9; grp.add(pole);
      grp.userData = { x0: -3.4 + i * 1.45, spin: v3(r.range(0.4, 0.9), r.range(0.5, 1.2), r.range(0.2, 0.6)), bob: r() * TAU, m };
      S.add(grp); return grp;
    });
    const embers = new Dust(50, { size: 0.025, color: '#ffa040', intensity: 3 }); S.add(embers);
    const ed = []; for (let i = 0; i < 50; i++) ed.push({ x: r.range(-0.4, 0.4), z: r.range(-0.3, 0.3), ph: r(), sp: r.range(0.5, 1.1) });
    return {
      scene: S, cam: C,
      update(u, t) {
        const fk = flicker(t, 0.3);
        fl.intensity = 30 * fk; fl.position.set(0.9 + 0.04 * Math.sin(t * 9.1), 1.05 + 0.05 * Math.sin(t * 7.3), 3.5 + 0.03 * Math.sin(t * 11));
        flames.forEach(f => f.faceCam(C, t));
        ember.emissiveIntensity = 1.2 + 0.4 * Math.sin(t * 5);
        solids.forEach((s, i) => { const d = s.userData; s.position.set(d.x0 + t * 0.55 - 0.3, 1.55 + 0.05 * Math.sin(t * 5 + d.bob), 1.0); d.m.rotation.set(d.spin.x * t + i, d.spin.y * t + i * 2, d.spin.z * t); });
        ed.forEach((e, i) => { const k = (t * e.sp * 0.6 + e.ph) % 1; embers.set(i, fire.position.x + e.x + Math.sin(t * 3 + i) * 0.1 * k, 0.4 + k * 2.6, fire.position.z + e.z); embers.alpha[i] = Math.sin(Math.PI * k) * 0.8; });
        embers.dirty();
        const cp = v3(lerp(-1.4, -0.9, u), lerp(3.0, 2.85, u), lerp(10.4, 9.6, easeInOut(u))).add(drift(t, 0.03));
        look(C, cp, v3(lerp(-0.6, -0.4, u), 2.4, -6));
        return { bloom: 0.55, exposure: 1.05, vignette: 1.0 };
      },
    };
  },

  // ── Shang bronze fangding with taotie mask, museum-lit, slow orbit to face the eyes ──
  ding(p) {
    const S = new THREE.Scene(), C = camera(28);
    backdrop(S, 'theft'); S.fog = new THREE.Fog(col('#030100'), 14, 34); S.environmentIntensity = 0.45;
    const reliefL = dingRelief('ding-relief-long', 1024, 724, true), reliefS = dingRelief('ding-relief-short', 768, 724, true);
    const colL = dingColor('ding-col-long', reliefL), colS = dingColor('ding-col-short', reliefS);
    const eyeL = eyeEmissive('ding-eye-long', 1024, 724);
    const rough = noiseTexture('rough-mid', { scale: 12, contrast: 1.4 });
    const face = (map, bump, emi) => new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 5, metalness: 0.45, roughness: 0.72, envMapIntensity: 0.35, emissive: col('#ff9030'), emissiveMap: emi || null, emissiveIntensity: 0 });
    const fL = face(colL, reliefL, eyeL), fS = face(colS, reliefS);
    const plain = new THREE.MeshStandardMaterial({ map: dingColor('ding-col-plain', dingPlain()), metalness: 0.45, roughness: 0.65, envMapIntensity: 0.35, bumpMap: noiseTexture('rough-fine', { scale: 40, contrast: 1.5 }), bumpScale: 1 });
    const inner = new THREE.MeshStandardMaterial({ color: col('#1c1a12'), metalness: 0.5, roughness: 0.7 });
    const D = new THREE.Group(); S.add(D);
    const BW = 2.4, BD = 1.8, BH = 1.7, LEG = 1.25, T = 0.1;
    const wallL = new THREE.BoxGeometry(BW, BH, T), wallS = new THREE.BoxGeometry(BD, BH, T);
    [[0, BD / 2 - T / 2, 0, wallL, fL], [0, -BD / 2 + T / 2, Math.PI, wallL, fL], [BW / 2 - T / 2, 0, Math.PI / 2, wallS, fS], [-BW / 2 + T / 2, 0, -Math.PI / 2, wallS, fS]].forEach(([x, z, ry, geo, fm]) => {
      const m = new THREE.Mesh(geo, [plain, plain, plain, plain, fm, inner]); m.position.set(x, LEG + BH / 2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; D.add(m);
    });
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.1, 0.1, BD - 0.1), inner); bottom.position.y = LEG + 0.5; D.add(bottom);
    // thick lip
    const lipM = plain;
    [[0, BD / 2, BW + 0.12, 0.16], [0, -BD / 2, BW + 0.12, 0.16]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.13, d), lipM); m.position.set(x, LEG + BH + 0.05, z); m.castShadow = true; D.add(m); });
    [[BW / 2, 0], [-BW / 2, 0]].forEach(([x, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, BD + 0.12), lipM); m.position.set(x, LEG + BH + 0.05, z); m.castShadow = true; D.add(m); });
    // flanges (扉棱): notched ridges at corners and face centres
    const flG = new THREE.BoxGeometry(0.07, 0.36, 0.12);
    const flPos = [];
    for (const [x, z, ry] of [[0, BD / 2 + 0.05, 0], [0, -BD / 2 - 0.05, 0], [BW / 2 + 0.05, 0, Math.PI / 2], [-BW / 2 - 0.05, 0, Math.PI / 2],
      [BW / 2 + 0.03, BD / 2 + 0.03, Math.PI / 4], [-BW / 2 - 0.03, BD / 2 + 0.03, -Math.PI / 4], [BW / 2 + 0.03, -BD / 2 - 0.03, -Math.PI / 4], [-BW / 2 - 0.03, -BD / 2 - 0.03, Math.PI / 4]])
      for (let k = 0; k < 4; k++) flPos.push([x, LEG + 0.25 + k * 0.4, z, ry]);
    const fl = new THREE.InstancedMesh(flG, plain, flPos.length); const mm = new THREE.Object3D();
    flPos.forEach(([x, y, z, ry], i) => { mm.position.set(x, y, z); mm.rotation.set(0, ry, 0); mm.updateMatrix(); fl.setMatrixAt(i, mm.matrix); }); fl.castShadow = true; D.add(fl);
    // legs: columnar, slightly waisted, with a mask bulge and rings
    const legProf = []; for (let i = 0; i <= 40; i++) { const y = i / 40 * LEG; const rr = 0.17 - 0.025 * Math.sin(Math.PI * i / 40) + 0.035 * Math.exp(-((((i / 40) - 0.78) / 0.08) ** 2)) + (i < 2 ? 0.02 : 0); legProf.push(new THREE.Vector2(rr, y)); }
    const legG = new THREE.LatheGeometry(legProf, 40);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => { const m = new THREE.Mesh(legG, plain); m.position.set(sx * (BW / 2 - 0.32), 0, sz * (BD / 2 - 0.3)); m.castShadow = true; D.add(m); });
    // upright loop handles on the short rims
    const hs = new THREE.Shape(); hs.moveTo(-0.45, 0); hs.lineTo(-0.45, 0.72); hs.lineTo(0.45, 0.72); hs.lineTo(0.45, 0); hs.lineTo(0.3, 0); hs.lineTo(0.3, 0.56); hs.lineTo(-0.3, 0.56); hs.lineTo(-0.3, 0); hs.closePath();
    const hG = new THREE.ExtrudeGeometry(hs, { depth: 0.14, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 3 }); hG.translate(0, 0, -0.07);
    [-1, 1].forEach(sx => { const m = new THREE.Mesh(hG, plain); m.rotation.y = Math.PI / 2; m.position.set(sx * (BW / 2 - 0.02), LEG + BH + 0.1, 0); m.castShadow = true; D.add(m); });
    // museum plinth and floor
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.2, 3.6), new THREE.MeshStandardMaterial({ color: col('#0e0c0b'), roughness: 0.85 })); plinth.position.y = -0.6; plinth.receiveShadow = true; S.add(plinth);
    const flr = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: col('#070605'), roughness: 0.6 })); flr.rotation.x = -Math.PI / 2; flr.position.y = -1.2; flr.receiveShadow = true; S.add(flr);
    // lighting: warm top spot (shadows), cool-ish rim, low bounce
    const spot = new THREE.SpotLight(col('#ffe2b8'), 260, 0, 0.42, 0.6, 1.6); spot.position.set(2.2, 9.5, 5.5); spot.target.position.set(0, 1.8, 0); spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0004; spot.shadow.radius = 4; S.add(spot, spot.target);
    const rimL = new THREE.SpotLight(col('#ffb070'), 160, 0, 0.5, 0.8, 1.6); rimL.position.set(-6, 5, -6); rimL.target.position.set(0, 2, 0); S.add(rimL, rimL.target);
    const rimR = new THREE.SpotLight(col('#ffd0a0'), 70, 0, 0.5, 0.8, 1.6); rimR.position.set(6.5, 3, -4); rimR.target.position.set(0, 2, 0); S.add(rimR, rimR.target);
    const fillL = new THREE.PointLight(col('#ff9a50'), 4, 0, 1.2); fillL.position.set(-3, 1.5, 6); S.add(fillL);
    // pool of light on the floor around the plinth
    const pool = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: {}, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vUv; void main(){ float d=length(vUv-0.5)*2.0; gl_FragColor=vec4(vec3(0.5,0.3,0.15)*0.25, (1.0-smoothstep(0.2,1.0,d))*0.6);}' }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = -1.19; S.add(pool);
    return {
      scene: S, cam: C,
      update(u, t) {
        const k = easeOut(u);
        const az = lerp(-1.05, 0, k), el = lerp(0.3, 0.1, k), rad = lerp(11.5, 9.8, k);
        look(C, orbit(rad, az, el, v3(0, 2.2, 0)).add(drift(t, 0.01)), v3(0, lerp(2.1, 2.35, k), 0));
        fL.emissiveIntensity = 2.5 * smooth(range(u, 0.72, 0.95));
        return { bloom: 0.45, exposure: 1.1, vignette: 1.0 };
      },
    };
  },

  // ── oracle bone: hot bronze rod, ember cracks in the shape of 卜, glowing glyphs ──
  oracle() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'theft'); S.fog = new THREE.Fog(col('#040100'), 10, 26); S.environmentIntensity = 0.3;
    const table = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshStandardMaterial({ map: rep(woodTexture(), 2), roughness: 0.55, roughnessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }) }));
    table.rotation.x = -Math.PI / 2; table.receiveShadow = true; S.add(table);
    const shape = plastronShape();
    const boneMap = boneTexture(); boneMap.repeat.set(1 / 2.2, -1 / 3.4); boneMap.offset.set(0.5, 0.5);
    const bump = rep(noiseTexture('rough-fine', { scale: 40, contrast: 1.5 }), 1);
    const boneH = boneHeight(); boneH.repeat.set(1 / 2.2, -1 / 3.4); boneH.offset.set(0.5, 0.5);
    const bone = new THREE.MeshPhysicalMaterial({ map: boneMap, color: col('#d8c8a8'), roughness: 0.5, clearcoat: 0.2, clearcoatRoughness: 0.5, bumpMap: boneH, bumpScale: 3 });
    const pg = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 1 });
    const plast = new THREE.Mesh(pg, bone); plast.rotation.x = -Math.PI / 2; plast.position.y = 0.0; plast.castShadow = true; plast.receiveShadow = true; S.add(plast);
    // glowing crack + glyph overlay on the top face (same shape, additive)
    const crackT = crackTexture(), glyphT = glyphTexture();
    const ovU = { uCrack: { value: crackT }, uGlyph: { value: glyphT }, uP: { value: 0 }, uG: { value: 0 }, uHeat: { value: 0 } };
    const ov = new THREE.Mesh(new THREE.ShapeGeometry(shape, 1), new THREE.ShaderMaterial({
      uniforms: ovU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec2 vS; void main(){ vS = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D uCrack, uGlyph; uniform float uP, uG; varying vec2 vS;
        void main(){
          vec2 uv = vec2((vS.x + 1.1) / 2.2, (vS.y + 1.7) / 3.4);
          vec4 c = texture2D(uCrack, uv); vec4 gl = texture2D(uGlyph, uv);
          float arr = c.r * 4.0; float on = c.g * step(arr, uP);
          float age = max(0.0, uP - arr);
          vec3 hot = mix(vec3(1.0, 0.85, 0.55) * 7.0, vec3(1.0, 0.28, 0.04) * 2.2, smoothstep(0.0, 1.2, age));
          float gOn = gl.g * smoothstep(gl.r * 4.0 - 0.3, gl.r * 4.0 + 0.3, uG * 5.0);
          vec3 col = hot * on + vec3(1.0, 0.42, 0.08) * 3.0 * gOn;
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    ov.rotation.x = -Math.PI / 2; ov.position.y = 0.13 + 0.002; ov.renderOrder = 3; S.add(ov);
    // the hot bronze rod
    const [hx, hy] = PITS[1];
    const rodG = new THREE.Group(); S.add(rodG);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.2, 20), mats.bronze({ roughness: 0.4 })); rod.position.y = 1.6; rod.castShadow = true; rodG.add(rod);
    const tipM = new THREE.MeshStandardMaterial({ color: col('#3a1a08'), emissive: col('#ff4a08'), emissiveIntensity: 1.6, roughness: 0.6 });
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.022, 0.32, 20), tipM); tip.position.y = 0.16; rodG.add(tip);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.0, 16), new THREE.MeshStandardMaterial({ color: col('#3a2414'), roughness: 0.8 })); handle.position.y = 3.4; rodG.add(handle);
    rodG.rotation.set(-0.45, 0, -0.55);
    const ember = new THREE.PointLight(col('#ff6a20'), 0, 0, 2); S.add(ember);
    const key = new THREE.SpotLight(col('#ffd2a0'), 38, 0, 0.42, 0.8, 1.5); key.position.set(-4, 8, 3); key.target.position.set(0, 0, 0); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005; S.add(key, key.target);
    const rimL = new THREE.DirectionalLight(col('#ff9a50'), 0.6); rimL.position.set(5, 2, -6); S.add(rimL);
    const hemi = new THREE.HemisphereLight(col('#ffb070'), col('#100604'), 0.15); S.add(hemi);
    const steps = [0, 0.125, 0.25, 0.375];
    return {
      scene: S, cam: C,
      update(u, t) {
        let P = 0; steps.forEach((s0, k) => { if (u >= s0) P = k + 0.85 * clamp((u - s0) / 0.05); }); if (u > 0.43) P = 4.0 + (u - 0.43) * 3;
        ovU.uP.value = P; ovU.uG.value = smooth(range(u, 0.45, 0.82));
        const lift = easeInOut(range(u, 0.38, 0.62));
        rodG.position.set(hx + lift * 0.5, 0.13 + lift * 1.6, -hy - lift * 0.4);
        tipM.emissiveIntensity = 1.6 * (1 - 0.6 * lift);
        let last = 0; steps.forEach(s0 => { if (u >= s0) last = s0; });
        const pulse = Math.exp(-(u - last) * 30) * (u < 0.45 ? 1 : 0);
        ember.position.set(hx, 0.35, -hy); ember.intensity = 0.5 * (1 - lift * 0.7) + 1.5 * pulse + 0.4 * ovU.uG.value;
        const k = easeInOut(u);
        const tgt = v3(lerp(hx - 0.1, 0.32, k), 0.1, lerp(-hy - 0.05, -0.55, k));
        look(C, v3(lerp(-1.6, -0.7, k), lerp(5.4, 3.4, k), lerp(3.1, 1.6, k)).add(drift(t, 0.01)), tgt);
        return { bloom: 0.55, exposure: 1.05, vignette: 1.0 };
      },
    };
  },

  // ── the Parthenon at golden hour, low angle, golden-ratio overlay draws on ──
  parthenon(p, ctx) {
    const S = new THREE.Scene(), C = camera(44, 0.5, 4000);
    const bd = backdrop(S, 'marble', { radius: 1600 }); bd.visible = false;
    const sunDir = v3(0.8, 0.13, 0.55).normalize();
    gradientSky(S, '#c0704a', '#e89060', '#24305a', sunDir, '#ffb060');
    S.fog = new THREE.Fog(col('#c88058'), 150, 1200); S.environmentIntensity = 0.35;
    const marble = mats.marble({ color: col('#f6e8d2'), roughness: 0.45, clearcoat: 0.1 });
    const marbleD = mats.marble({ color: col('#d8c6a8'), roughness: 0.6, clearcoat: 0 });
    const colH = 9.5, top = 1.5 + colH + 0.87;
    // steps (krepidoma)
    [[33.4, 72.0, 0.5], [32.4, 71.0, 1.0], [31.4, 70.0, 1.5]].forEach(([w, d, y]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.5, d), marble); m.position.y = y - 0.25; m.castShadow = m.receiveShadow = true; S.add(m); });
    // columns: peristyle 8×17 + inner prostyle 6
    const cpos = [];
    for (let i = 0; i < 8; i++) { const x = -13.4 + i * 26.8 / 7; cpos.push([x, 32.3], [x, -32.3]); }
    for (let j = 1; j < 16; j++) { const z = -32.3 + j * 64.6 / 16; cpos.push([13.4, z], [-13.4, z]); }
    for (let i = 0; i < 6; i++) { const x = -8.6 + i * 17.2 / 5; cpos.push([x, 26.4], [x, -26.4]); }
    const shaft = instanced(flutedShaft(colH, 0.95, 0.76), marble, cpos.map(([x, z]) => M4(x, 1.5, z)));
    const ech = new THREE.LatheGeometry([[0.74, 0], [0.8, 0.06], [0.74, 0.1], [0.82, 0.16], [0.98, 0.3], [1.08, 0.42], [1.1, 0.45], [0, 0.45]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
    const echin = instanced(ech, marble, cpos.map(([x, z]) => M4(x, 1.5 + colH, z)));
    const abac = instanced(new THREE.BoxGeometry(2.2, 0.42, 2.2), marble, cpos.map(([x, z]) => M4(x, 1.5 + colH + 0.45 + 0.21, z)));
    [shaft, echin, abac].forEach(m => { m.castShadow = m.receiveShadow = true; S.add(m); });
    // cella with dark doorway
    const cella = new THREE.Mesh(new THREE.BoxGeometry(19.5, colH + 0.9, 50), marbleD); cella.position.set(0, 1.5 + (colH + 0.9) / 2, 0); cella.castShadow = cella.receiveShadow = true; S.add(cella);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 9), new THREE.MeshStandardMaterial({ color: col('#140c08'), roughness: 1 })); door.position.set(0, 6, 25.02); S.add(door);
    // entablature
    const arch = new THREE.Mesh(new THREE.BoxGeometry(29.2, 1.35, 66.8), marble); arch.position.y = top + 0.675; arch.castShadow = arch.receiveShadow = true; S.add(arch);
    const fz = frieze(), fzF = rep(fz, 1); fzF.repeat.set(16, 1); const fzS = rep(fz, 1); fzS.repeat.set(36, 1);
    const fmF = new THREE.MeshStandardMaterial({ map: fzF, roughness: 0.6, bumpMap: fzF, bumpScale: 2 }), fmS = new THREE.MeshStandardMaterial({ map: fzS, roughness: 0.6, bumpMap: fzS, bumpScale: 2 });
    const fr = new THREE.Mesh(new THREE.BoxGeometry(29.0, 1.4, 66.6), [fmS, fmS, marble, marble, fmF, fmF]); fr.position.y = top + 1.35 + 0.7; fr.castShadow = fr.receiveShadow = true; S.add(fr);
    const corn = new THREE.Mesh(new THREE.BoxGeometry(30.6, 0.6, 68.4), marble); corn.position.y = top + 2.75 + 0.3; corn.castShadow = corn.receiveShadow = true; S.add(corn);
    // roof prism → pediments; raking cornices
    const pedH = 3.7, base = top + 3.35;
    const tri = new THREE.Shape([new THREE.Vector2(-15.0, 0), new THREE.Vector2(15.0, 0), new THREE.Vector2(0, pedH)]);
    const roofG = new THREE.ExtrudeGeometry(tri, { depth: 67.0, bevelEnabled: false }); roofG.translate(0, 0, -33.5);
    const roof = new THREE.Mesh(roofG, marble); roof.position.y = base; roof.castShadow = roof.receiveShadow = true; S.add(roof);
    const tymp = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-13.8, 0.3), new THREE.Vector2(13.8, 0.3), new THREE.Vector2(0, pedH - 0.6)])), marbleD); tymp.position.set(0, base, 33.52); S.add(tymp);
    const slope = Math.atan2(pedH, 15.3), rl = Math.hypot(15.3, pedH);
    [-1, 1].forEach(sg => { const rc = new THREE.Mesh(new THREE.BoxGeometry(rl + 0.4, 0.55, 1.4), marble); rc.position.set(sg * 7.65, base + pedH / 2 + 0.15, 33.6); rc.rotation.z = sg * -slope; rc.castShadow = true; S.add(rc);
      const rc2 = rc.clone(); rc2.position.z = -33.6; S.add(rc2); });
    // weathered pediment figures (simple reclining/standing masses)
    const fig = new THREE.MeshStandardMaterial({ color: col('#e4d4b8'), roughness: 0.7 }); const rr = rng(36);
    for (let i = 0; i < 13; i++) { const x = -11 + i * 22 / 12, hh = (pedH - 0.9) * (1 - Math.abs(x) / 14.5) * rr.range(0.55, 0.95); const f = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, Math.max(0.1, hh - 0.84), 4, 8), fig); f.position.set(x, base + 0.35 + hh / 2, 33.2); f.rotation.z = rr.range(-0.2, 0.2) + (Math.abs(x) > 9 ? Math.sign(x) * 1.2 : 0); f.castShadow = true; S.add(f); }
    // the rock of the Acropolis
    const groundG = new THREE.PlaneGeometry(900, 900, 160, 160); displace(groundG, v => v3(v.x, v.y, v.z + (Math.hypot(v.x, v.y) > 60 ? -Math.min(40, (Math.hypot(v.x, v.y) - 60) * 0.25) : 0) + fbm(v.x * 0.05, v.y * 0.05, 1, 4) * 1.2));
    const ground = new THREE.Mesh(groundG, mats.stone('#b08a64', { bumpMap: rep(noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), 40), bumpScale: 1.5 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; S.add(ground);
    // golden-hour light
    const sun = new THREE.DirectionalLight(col('#ffa050'), 7.5); sun.position.copy(sunDir.clone().multiplyScalar(120)); sun.target.position.set(0, 6, 10);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -60; sc.right = 60; sc.top = 45; sc.bottom = -45; sc.near = 10; sc.far = 300; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05; S.add(sun, sun.target);
    const hemi = new THREE.HemisphereLight(col('#6a80c0'), col('#804a30'), 0.55); S.add(hemi);
    // golden rectangle + spiral on the facade
    const W0 = 30.6, H0 = W0 / 1.618, x0 = -W0 / 2, y0 = 0, zf = 36.5;
    const segs = [], P = (x, y) => v3(x, y, zf);
    segs.push(...toSegs([P(x0, y0), P(x0 + W0, y0), P(x0 + W0, y0 + H0), P(x0, y0 + H0), P(x0, y0)]));
    let x = x0, y = y0, w = W0, h = H0;
    for (let k = 0; k < 8; k++) {
      let s, c, a0;
      if (k % 4 === 0) { s = h; c = P(x + s, y); a0 = Math.PI; segs.push([P(x + s, y), P(x + s, y + h)]); x += s; w -= s; }
      else if (k % 4 === 1) { s = w; c = P(x, y + h - s); a0 = Math.PI / 2; segs.push([P(x, y + h - s), P(x + w, y + h - s)]); h -= s; }
      else if (k % 4 === 2) { s = h; c = P(x + w - s, y + h); a0 = 0; segs.push([P(x + w - s, y), P(x + w - s, y + h)]); w -= s; }
      else { s = w; c = P(x + w, y + s); a0 = -Math.PI / 2; segs.push([P(x, y + s), P(x + w, y + s)]); y += s; h -= s; }
      segs.push(...toSegs(arcPts(c, s, a0, a0 - Math.PI / 2, 28)));
    }
    const gold = fatLines(segs, '#ffc050', 3.0, 1.4); S.add(gold);
    return {
      scene: S, cam: C,
      update(u, t) {
        const k = easeInOut(u);
        look(C, v3(lerp(-21, -17, k), lerp(0.55, 0.9, k), lerp(66, 61, k)).add(drift(t, 0.03)), v3(lerp(-1.5, -0.5, k), lerp(11.5, 11.8, k), 30));
        gold.reveal(easeOut(range(u, 0.12, 0.95))); gold.material.opacity = 0.85 * smooth(range(u, 0.08, 0.3));
        return { bloom: 0.35, exposure: 1.0, vignette: 0.85 };
      },
    };
  },

  // ── gilded armillary sphere: Earth at the centre, rings turning, epicycle loops traced in gold ──
  armillary() {
    const S = new THREE.Scene(), C = camera(30);
    backdrop(S, 'marble'); S.fog = new THREE.Fog(col('#120d08'), 20, 60); S.environmentIntensity = 0.55;
    const gold = mats.gold({ roughness: 0.32 }), bgold = mats.brushedGold();
    const A = new THREE.Group(); A.position.y = 0.4; S.add(A);
    const band = (R, w, tex, rep2 = 1) => { const t = tex ? tex : null; return new THREE.Mesh(new THREE.CylinderGeometry(R, R, w, 160, 1, true), mats.gold({ roughness: 0.42, side: THREE.DoubleSide, bumpMap: t, bumpScale: 2, envMapIntensity: 0.7 })); };
    const eqTex = bandTexture('band-deg', 360, false), zodTex = bandTexture('band-zod', 360, true);
    // celestial sphere (rotating): equator, ecliptic band, colures, tropics, polar circles
    const tilt = new THREE.Group(); tilt.rotation.z = 0.42; A.add(tilt);           // latitude tilt of the polar axis
    const sph = new THREE.Group(); tilt.add(sph);
    const eq = band(2.0, 0.1, eqTex); sph.add(eq);
    const ecl = new THREE.Group(); ecl.rotation.x = 0.409; sph.add(ecl);
    const zod = band(2.02, 0.32, zodTex); ecl.add(zod);
    [0, Math.PI / 2].forEach(ry => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.035, 10, 160), gold); m.rotation.y = ry; sph.add(m); });
    [[0.409, 1], [-0.409, 1], [Math.PI / 2 - 0.409, 0.8], [-(Math.PI / 2 - 0.409), 0.8]].forEach(([lat]) => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.0 * Math.cos(lat), 0.022, 8, 120), gold); m.rotation.x = Math.PI / 2; m.position.y = 2.0 * Math.sin(lat); sph.add(m); });
    // axis rod + finials
    const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 5.4, 12), bgold); tilt.add(axis);
    [-1, 1].forEach(sg => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), gold); f.position.y = sg * 2.7; tilt.add(f); });
    // fixed meridian ring + horizon ring + stand
    const mer = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.06, 12, 180), bgold); tilt.add(mer);
    const hor = band(2.62, 0.22, eqTex); hor.rotation.x = Math.PI / 2; hor.scale.set(1, 1, 1); A.add(hor);
        for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; const leg = new THREE.Mesh(tube([v3(Math.cos(a) * 2.62, 0, Math.sin(a) * 2.62), v3(Math.cos(a) * 2.2, -1.3, Math.sin(a) * 2.2), v3(Math.cos(a) * 0.6, -2.6, Math.sin(a) * 0.6), v3(Math.cos(a) * 0.25, -3.0, Math.sin(a) * 0.25)], 0.06, 60, 10), bgold); A.add(leg); }
    const pedestal = new THREE.Mesh(new THREE.LatheGeometry([[0, -4.4], [1.3, -4.4], [1.3, -4.25], [1.0, -4.15], [0.45, -3.9], [0.3, -3.4], [0.42, -3.1], [0.3, -2.95], [0, -2.95]].map(([x, y]) => new THREE.Vector2(x, y)), 64), bgold); A.add(pedestal);
    // Earth at the centre
    const earth = new THREE.Mesh(new THREE.SphereGeometry(0.42, 64, 32), new THREE.MeshPhysicalMaterial({ map: globeTexture(), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 })); sph.add(earth);
    // deferent + epicycle in the ecliptic plane; the planet traces retrograde loops
    const Rd = 1.45, Re = 0.42, wD = 1.0, wE = 6.2;
    const pathAt = s => v3(Rd * Math.cos(wD * s) + Re * Math.cos(wE * s), 0, Rd * Math.sin(wD * s) + Re * Math.sin(wE * s));
    const deferent = new THREE.Mesh(new THREE.TorusGeometry(Rd, 0.012, 6, 160), gold); deferent.rotation.x = Math.PI / 2; ecl.add(deferent);
    const epi = new THREE.Mesh(new THREE.TorusGeometry(Re, 0.01, 6, 80), gold); epi.rotation.x = Math.PI / 2; ecl.add(epi);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 6), gold); ecl.add(arm);
    const planet = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), new THREE.MeshStandardMaterial({ color: col('#c0502a'), emissive: col('#ff7030'), emissiveIntensity: 1.2, roughness: 0.5 })); ecl.add(planet);
    const N = 600, sMax = TAU * 1.0, tpts = []; for (let i = 0; i <= N; i++) tpts.push(pathAt(i / N * sMax));
    const trail = fatLines(toSegs(tpts), '#ffcf70', 2.4, 2.2); trail.material.depthTest = true; ecl.add(trail);
    const key = new THREE.SpotLight(col('#fff0d8'), 70, 0, 0.5, 0.6, 1.4); key.position.set(4, 8, 7); key.target.position.set(0, 0, 0); S.add(key, key.target);
    const rimL = new THREE.DirectionalLight(col('#ffc070'), 2.0); rimL.position.set(-6, 3, -6); S.add(rimL);
    const fill = new THREE.HemisphereLight(col('#fff0e0'), col('#2a1c10'), 0.35); S.add(fill);
    return {
      scene: S, cam: C,
      update(u, t) {
        sph.rotation.y = 0.35 + t * 0.25;
        const s = lerp(0.22, 0.98, u) * sMax, pp = pathAt(s), c = v3(Rd * Math.cos(wD * s), 0, Rd * Math.sin(wD * s));
        planet.position.copy(pp); epi.position.copy(c); arm.position.copy(c.clone().multiplyScalar(0.5)); arm.scale.y = Rd; arm.rotation.set(Math.PI / 2, 0, 0); arm.lookAt(c.clone().applyMatrix4(ecl.matrixWorld)); arm.rotateX(Math.PI / 2);
        trail.reveal(s / sMax);
        look(C, orbit(lerp(10.2, 9.0, easeInOut(u)), lerp(0.55, 0.2, u), lerp(0.32, 0.26, u), v3(0, 0.2, 0)).add(drift(t, 0.01)), v3(0, 0.05, 0));
        return { bloom: 0.3, threshold: 0.95, exposure: 1.0, vignette: 1.0 };
      },
    };
  },

  // ── straight up into a baroque gilded dome: coffers, ribs, volutes, lantern sky, a beam of light ──
  dome(p) {
    const S = new THREE.Scene(), C = camera(74, 0.1, 500);
    backdrop(S, 'marble'); S.fog = null; S.environmentIntensity = 0.4;
    const T = domeTextures();
    const { R, y0, th0 } = DOME;
    const dg = new THREE.SphereGeometry(R, 256, 96, 0, TAU, th0, Math.PI / 2 - th0);
    { const P = dg.attributes.position, UV = dg.attributes.uv;
      for (let i = 0; i < P.count; i++) { const uu = UV.getX(i), vv = UV.getY(i), th = th0 + (1 - vv) * (Math.PI / 2 - th0), b = 1 - (th - th0) / (Math.PI / 2 - th0); const d = cofferDepth((uu * DOME.sectors) % 1, b); const k = 1 + d * 0.012 * Math.sin(th); P.setXYZ(i, P.getX(i) * k, P.getY(i) * k, P.getZ(i) * k); }
      dg.computeVertexNormals(); }
    const domeM = new THREE.MeshStandardMaterial({ map: T.color, roughnessMap: T.mr, metalnessMap: T.mr, roughness: 1, metalness: 1, bumpMap: T.bump, bumpScale: 4, side: THREE.BackSide });
    const dome = new THREE.Mesh(dg, domeM); dome.position.y = y0; S.add(dome);
    const gold = mats.gold({ roughness: 0.25 });
    // gilded ribs following the meridians
    for (let k = 0; k < DOME.sectors; k++) { const a = k / DOME.sectors * TAU, pts = []; for (let i = 0; i <= 30; i++) { const th = th0 + i / 30 * (Math.PI / 2 - th0); pts.push(v3(Math.sin(th) * Math.sin(a) * (R - 0.15), y0 + Math.cos(th) * (R - 0.15), Math.sin(th) * Math.cos(a) * (R - 0.15))); } S.add(new THREE.Mesh(tube(pts, 0.17, 60, 8), gold)); }
    // oculus ring + lantern with painted sky
    const ocR = R * Math.sin(th0), ocY = y0 + R * Math.cos(th0);
    const ocRing = new THREE.Mesh(new THREE.TorusGeometry(ocR, 0.28, 16, 96), gold); ocRing.rotation.x = Math.PI / 2; ocRing.position.y = ocY; S.add(ocRing);
    const lanternWall = new THREE.Mesh(new THREE.CylinderGeometry(ocR, ocR, 3.2, 64, 1, true), new THREE.MeshStandardMaterial({ color: col('#e8dcc4'), roughness: 0.7, side: THREE.BackSide, emissive: col('#ffe8c0'), emissiveIntensity: 0.25 })); lanternWall.position.y = ocY + 1.6; S.add(lanternWall);
    const heaven = new THREE.Mesh(new THREE.CircleGeometry(ocR, 64), new THREE.MeshBasicMaterial({ map: heavenTexture(), color: col('#ffffff').multiplyScalar(1.6) })); heaven.rotation.x = Math.PI / 2; heaven.position.y = ocY + 3.2; S.add(heaven);
    // lantern windows (bright slits)
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, wdw = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.8), mats.glow('#fff2d8', 3)); wdw.position.set(Math.sin(a) * (ocR - 0.02), ocY + 1.5, Math.cos(a) * (ocR - 0.02)); wdw.lookAt(0, ocY + 1.5, 0); S.add(wdw); }
    // drum below with windows and pilasters; cornice ring and volutes at the rib feet
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 6, 128, 1, true), new THREE.MeshStandardMaterial({ color: col('#8a7a60'), roughness: 0.6, side: THREE.BackSide })); drum.position.y = y0 - 3; S.add(drum);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) / 8 * TAU, wdw = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 3.2), mats.glow('#ffe8c0', 0.8)); wdw.position.set(Math.sin(a) * (R - 0.05), y0 - 3, Math.cos(a) * (R - 0.05)); wdw.lookAt(0, y0 - 3, 0); S.add(wdw); }
    const corn = new THREE.Mesh(new THREE.TorusGeometry(R - 0.3, 0.35, 12, 160), gold); corn.rotation.x = Math.PI / 2; corn.position.y = y0; S.add(corn);
    const corn2 = new THREE.Mesh(new THREE.TorusGeometry(R - 0.2, 0.18, 10, 160), gold); corn2.rotation.x = Math.PI / 2; corn2.position.y = y0 - 0.5; S.add(corn2);
    const vg = volute();
    for (let k = 0; k < DOME.sectors; k++) { const a = k / DOME.sectors * TAU; [-1, 1].forEach(sg => { const v = new THREE.Mesh(vg, gold); v.position.set(Math.sin(a) * (R - 0.6), y0 + 0.75, Math.cos(a) * (R - 0.6)); v.lookAt(0, y0 + 0.75, 0); v.rotateY(sg * 0.5); v.scale.set(sg, 1, 1); v.translateX(sg * 0.45); S.add(v); }); }
    // shaft of light from the oculus
    const beamG = new THREE.CylinderGeometry(ocR * 0.95, ocR * 1.4, 26, 48, 1, true); beamG.translate(0, -13, 0);
    const beam = new THREE.Mesh(beamG, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 1 } },
      vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uA; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN, vV)), 1.5); float a = f * smoothstep(0.0, 0.5, vUv.y) * uA * 0.22; gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * a, 1.0); }' }));
    beam.position.set(0, ocY + 0.5, 0); beam.rotation.z = 0.32; S.add(beam);
    const sunIn = new THREE.SpotLight(col('#fff0d0'), 900, 0, 0.12, 0.5, 1.2); sunIn.position.set(0, ocY + 4, 0); sunIn.target.position.set(-6, 0, 0); S.add(sunIn, sunIn.target);
    const glowL = new THREE.PointLight(col('#ffdca0'), 22, 0, 1.4); glowL.position.set(0, y0 - 2, 0); S.add(glowL);
    const ocL = new THREE.PointLight(col('#fff4dc'), 10, 0, 1.5); ocL.position.set(0, ocY - 1, 0); S.add(ocL);
    const hemi = new THREE.HemisphereLight(col('#fff0d8'), col('#806040'), 0.15); S.add(hemi);
    const motes = new Dust(160, { size: 0.03, color: '#fff0c8', intensity: 1.5 }); S.add(motes); const r = rng(3), md = []; for (let i = 0; i < 160; i++) md.push([r.range(-1.8, 1.8), r.range(0, 22), r.range(-1.8, 1.8), r()]);
    return {
      scene: S, cam: C,
      update(u, t) {
        const a = 0.3 + u * 0.35;
        C.up.set(Math.sin(a), 0, -Math.cos(a)); C.fov = lerp(76, 68, easeOut(u)); C.updateProjectionMatrix();
        look(C, v3(0.6, 1.6, 0.4), v3(0.0, 40, 0.0));
        md.forEach((m, i) => { const yy = (m[1] + t * 0.3) % 22; motes.set(i, m[0] - yy * 0.33 + 6.0, yy - 4, m[2]); motes.alpha[i] = 0.4 * Math.sin(Math.PI * yy / 22) * (0.5 + 0.5 * Math.sin(t * 2 + m[3] * 9)); }); motes.dirty();
        return { bloom: 0.35, threshold: 0.95, exposure: 0.9, vignette: 1.0 };
      },
    };
  },

  // ── Borges' Library of Babel: hexagonal galleries, endless, the camera falls down the shaft ──
  library() {
    const S = new THREE.Scene(), C = camera(62, 0.05, 300);
    backdrop(S, 'marble'); S.fog = new THREE.Fog(col('#050302'), 6, 34); S.environmentIntensity = 0.4; S.background = col('#050302');
    const Rh = 5.6, r0 = 2.9, HF = 3.2, NF = 16, FY0 = 4 * HF;
    const r = rng(39);
    const wood = new THREE.MeshStandardMaterial({ color: col('#3a2210'), roughness: 0.55 });
    const plaster = new THREE.MeshStandardMaterial({ color: col('#b8a080'), roughness: 0.85 });
    const brass = new THREE.MeshStandardMaterial({ color: col('#d0a050'), metalness: 1, roughness: 0.3 });
    // floor slab: outer hex with hexagonal shaft
    const slab = new THREE.Shape(hexPts(Rh + 0.6)); slab.holes.push(new THREE.Path(hexPts(r0)));
    const slabG = new THREE.ExtrudeGeometry(slab, { depth: 0.35, bevelEnabled: false }); slabG.rotateX(Math.PI / 2);
    const floors = []; for (let f = 0; f < NF; f++) floors.push(M4(0, FY0 - f * HF, 0));
    const slabM = instanced(slabG, new THREE.MeshStandardMaterial({ color: col('#2e2016'), roughness: 0.5 }), floors); slabM.receiveShadow = true; S.add(slabM);
    // shaft edge facing (gilded band) and railings
    const edgeG = new THREE.CylinderGeometry(r0 + 0.01, r0 + 0.01, 0.35, 6, 1, true); edgeG.rotateY(Math.PI / 6 * 0); edgeG.translate(0, -0.175, 0);
    S.add(instanced(edgeG, brass, floors.map(m => m.clone())));
    const rail = new THREE.TorusGeometry(r0 * 0.98, 0.035, 6, 6); rail.rotateX(Math.PI / 2); rail.rotateY(Math.PI / 6 * 0);
    S.add(instanced(rail, brass, floors.map((m, i) => M4(0, FY0 - i * HF + 1.0, 0))));
    const balG = new THREE.CylinderGeometry(0.025, 0.025, 1.0, 6); balG.translate(0, 0.5, 0);
    const bals = []; const hp = hexPts(r0 * 0.98);
    for (let f = 0; f < NF; f++) for (let e = 0; e < 6; e++) { const a = hp[e], b = hp[(e + 1) % 6]; for (let k = 0; k < 9; k++) { const s = k / 9; bals.push(M4(lerp(a.x, b.x, s), FY0 - f * HF, lerp(a.y, b.y, s))); } }
    S.add(instanced(balG, brass, bals));
    // walls and bookcases on four of six sides (two sides open to vestibules)
    const hpo = hexPts(Rh), shelfM = [], bookM = [], bookC = [], wallM = [];
    const leather = ['#5a1a12', '#3a2412', '#1e3020', '#2a1c30', '#6a4418', '#1a2438', '#4a1010', '#70501e', '#2a2a22'].map(c => col(c));
    const side = Rh, nSh = 6, shH = (HF - 0.5) / nSh;
    for (let f = 0; f < NF; f++) {
      const fy = FY0 - f * HF;
      for (let e = 0; e < 6; e++) {
        const a = hpo[e], b = hpo[(e + 1) % 6], mid = v3((a.x + b.x) / 2, 0, (a.y + b.y) / 2), ang = Math.atan2(b.y - a.y, b.x - a.x);
        const ry = -ang;
        if (e === 1 || e === 4) { wallM.push(M4(mid.x * 1.04, fy + HF / 2, mid.z * 1.04, ry, side, HF, 0.2)); continue; }
        wallM.push(M4(mid.x * 1.06, fy + HF / 2, mid.z * 1.06, ry, side, HF, 0.2));
        const inward = v3(-mid.x, 0, -mid.z).normalize();
        for (let k = 0; k <= nSh; k++) { const p = mid.clone().addScaledVector(inward, 0.18); shelfM.push(M4(p.x, fy + 0.3 + k * shH, p.z, ry, side * 0.98, 0.04, 0.42)); }
        for (let k = 0; k < nSh; k++) {
          let s = 0.03;
          while (s < 0.97) {
            const bw = r.range(0.05, 0.1) / side, bh = shH * r.range(0.7, 0.92);
            if (s + bw > 0.97) break;
            const px = lerp(a.x, b.x, s + bw / 2), pz = lerp(a.y, b.y, s + bw / 2);
            const p = v3(px, 0, pz).addScaledVector(inward, 0.2 + r.range(0, 0.03));
            bookM.push(M4(p.x, fy + 0.32 + k * shH + bh / 2, p.z, ry, bw * side * 0.95, bh, 0.3, 0, r() < 0.04 ? r.range(-0.25, 0.25) : 0));
            const c = leather[Math.floor(r() * leather.length)].clone().multiplyScalar(r.range(0.7, 1.3)); bookC.push(c);
            s += bw;
          }
        }
      }
    }
    S.add(instanced(new THREE.BoxGeometry(1, 1, 1), wood, wallM));
    S.add(instanced(new THREE.BoxGeometry(1, 1, 1), wood, shelfM));
    const books = instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: spineTexture(), roughness: 0.55 }), bookM);
    bookC.forEach((c, i) => books.setColorAt(i, c)); books.instanceColor.needsUpdate = true; S.add(books);
    // ceiling plaster under each slab
    const ceil = new THREE.Shape(hexPts(Rh + 0.6)); ceil.holes.push(new THREE.Path(hexPts(r0)));
    const ceilG = new THREE.ShapeGeometry(ceil); ceilG.rotateX(Math.PI / 2);
    S.add(instanced(ceilG, plaster, floors.map((m, i) => M4(0, FY0 - i * HF - 0.351, 0))));
    // the "spherical fruits called lamps": two per gallery
    const lampPos = []; for (let f = 0; f < NF; f++) [0, 3].forEach(e => { const a = hexPts(Rh - 1.6)[e]; lampPos.push(M4(a.x * 0.85, FY0 - f * HF + 2.4, a.y * 0.85)); });
    S.add(instanced(new THREE.SphereGeometry(0.16, 16, 12), mats.glow('#ffd8a0', 4), lampPos));
    const lights = [];
    for (let f = 0; f < 8; f++) { const L = new THREE.PointLight(col('#ffbf78'), 22, 14, 1.5); L.position.set(f % 2 ? 2.2 : -2.2, FY0 - f * HF + 2.2, f % 2 ? 1.5 : -1.5); S.add(L); lights.push(L); }
    S.add(new THREE.HemisphereLight(col('#ffd8a8'), col('#100804'), 0.25));
    return {
      scene: S, cam: C,
      update(u, t) {
        const y = lerp(FY0 + 1.2, FY0 + 1.2 - 2.0 * HF, easeIn(u) * 0.5 + u * 0.5);
        const a = -0.15 + u * 0.35;
        look(C, v3(-Math.cos(a) * 1.4, y, -Math.sin(a) * 1.4), v3(Math.cos(a) * 5.0, y - 3.4, Math.sin(a) * 5.0));
        return { bloom: 0.5, exposure: 1.15, vignette: 1.0 };
      },
    };
  },

  // ── silicon wafer macro: iridescent dies, pushing into one whose circuitry glows like a city ──
  chip() {
    const S = new THREE.Scene(), C = camera(38, 0.002, 200);
    backdrop(S, 'silicon'); S.fog = null; S.environmentIntensity = 0.5;
    const wt = waferTexture();
    const waferM = new THREE.MeshPhysicalMaterial({ map: wt, metalness: 0.35, roughness: 0.25, envMapIntensity: 0.8, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 720], iridescenceThicknessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }), clearcoat: 0.6 });
    const edgeM = new THREE.MeshStandardMaterial({ color: col('#8a9aaa'), metalness: 0.9, roughness: 0.3 });
    const wafer = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 0.05, 256), [edgeM, waferM, edgeM]); wafer.position.y = -0.025; S.add(wafer);
    // hero die: circuitry plane + a city of transistor blocks
    const ct = circuitTexture();
    const die = new THREE.Group(); die.position.set(0.25, 0.0015, 0.25); S.add(die);
    const dieM = new THREE.MeshStandardMaterial({ map: ct, color: col('#7090c0'), metalness: 0.3, roughness: 0.5, envMapIntensity: 0.2, emissive: col('#4fc0ff'), emissiveMap: ct, emissiveIntensity: 0.3 });
    const dp = new THREE.Mesh(new THREE.PlaneGeometry(0.47, 0.47), dieM); dp.rotation.x = -Math.PI / 2; die.add(dp);
    const r = rng(60), blk = [], lit = [];
    for (let i = 0; i < 2400; i++) {
      const gx = Math.floor(r() * 64), gz = Math.floor(r() * 64); if (gx % 8 === 0 || gz % 8 === 0) continue; // keep the arteries clear
      const cell = 0.47 / 64, x = (gx + 0.5) * cell - 0.235, z = (gz + 0.5) * cell - 0.235;
      const d = Math.hypot(x, z), hgt = cell * r.range(0.4, 2.2) * (1 + 2.5 * Math.exp(-d * d * 60)) * (r() < 0.06 ? 2.5 : 1);
      const m = M4(x, hgt / 2, z, 0, cell * r.range(0.5, 0.85), hgt, cell * r.range(0.5, 0.85));
      (r() < 0.22 ? lit : blk).push(m);
    }
    const city = instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: col('#0c1626'), metalness: 0.3, roughness: 0.6, envMapIntensity: 0.3 }), blk); die.add(city);
    const cityLit = instanced(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: col('#0a1a30'), emissive: col('#6fd0ff'), emissiveMap: windowsTexture(), emissiveIntensity: 0.0, metalness: 0.3, roughness: 0.6, envMapIntensity: 0.3 }), lit); die.add(cityLit);
    const key = new THREE.DirectionalLight(col('#e0f0ff'), 1.4); key.position.set(4, 3, 2); S.add(key);
    const rimL = new THREE.DirectionalLight(col('#3fa9ff'), 2); rimL.position.set(-5, 2, -6); S.add(rimL);
    S.add(new THREE.HemisphereLight(col('#a0d0ff'), col('#02060c'), 0.3));
    return {
      scene: S, cam: C,
      update(u, t) {
        const k = easeInOut(u), d = 11 * Math.pow(0.42 / 11, k);
        const tgt = v3(lerp(0.0, 0.25, smooth(range(u, 0, 0.6))), 0, lerp(0.0, 0.25, smooth(range(u, 0, 0.6))));
        const pos = orbit(d, lerp(0.75, 0.35, k), lerp(0.9, 0.42, k), tgt);
        look(C, pos.add(drift(t, 0.002 * d)), tgt.clone().add(v3(0, 0, 0)));
        const g = smooth(range(u, 0.35, 0.9));
        dieM.emissiveIntensity = lerp(0.3, 1.8, g); cityLit.material.emissiveIntensity = lerp(0.0, 1.5, g); S.environmentIntensity = lerp(0.5, 0.08, g); key.intensity = lerp(1.4, 0.5, g);
        return { bloom: 0.45, threshold: 0.95, exposure: 1.0, vignette: 1.0 };
      },
    };
  },

  // ── Bruegel's Tower of Babel rising through clouds; the upper tiers become chip circuitry ──
  babel() {
    const S = new THREE.Scene(), C = camera(40, 0.5, 3000);
    const bd = backdrop(S, 'silicon', { radius: 1500 }); bd.visible = false;
    gradientSky(S, '#0a2448', '#2a5a94', '#020814', v3(-0.6, 0.12, -0.8).normalize(), '#1a3a60');
    S.fog = new THREE.Fog(col('#2a5a90'), 60, 420); S.environmentIntensity = 0.5;
    const N = 9, th = 2.4, ct = circuitTexture(), at = arcadeTexture();
    const stoneM = (n) => { const m = rep(at, 1); m.repeat.set(n, 2); return new THREE.MeshStandardMaterial({ map: m, bumpMap: m, bumpScale: 2, roughness: 0.85 }); };
    const chipM = (n, e) => { const m = rep(ct, 1); m.repeat.set(n / 4, 0.5); return new THREE.MeshStandardMaterial({ color: col('#0c1626'), metalness: 0.7, roughness: 0.35, emissive: col('#4fb8ff'), emissiveMap: m, emissiveIntensity: e }); };
    const ledgeStone = mats.stone('#8a7c6a', { bumpMap: rep(noiseTexture('bump-rock', { scale: 16, contrast: 1.6 }), 8), bumpScale: 1 });
    const ledgeChip = new THREE.MeshStandardMaterial({ color: col('#101c2c'), metalness: 0.8, roughness: 0.3, emissive: col('#3fa9ff'), emissiveIntensity: 0.4 });
    const T = new THREE.Group(); T.position.y = 0; S.add(T);
    const chipMats = [];
    let y = 0;
    for (let i = 0; i < N; i++) {
      const rB = 12 - i * 1.25, rT = rB - 0.15, chip = i >= 6, half = i === 5;
      const n = Math.round(TAU * rB / 2.2);
      const mat = chip ? chipM(n, 0.0) : stoneM(n);
      if (chip) chipMats.push(mat);
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, th, 96, 1, true, 0, i === N - 1 ? 4.6 : TAU), mat); wall.position.y = y + th / 2; wall.castShadow = wall.receiveShadow = true; T.add(wall);
      if (half) { const ov = new THREE.Mesh(new THREE.CylinderGeometry(rT + 0.02, rB + 0.02, th, 96, 1, true, 0.6, 2.2), chipM(n, 0)); ov.position.y = y + th / 2; T.add(ov); chipMats.push(ov.material); }
      // buttress piers
      const piers = []; for (let k = 0; k < n; k++) { const a = k / n * TAU; piers.push(M4(Math.sin(a) * (rB + 0.05), y + th / 2, Math.cos(a) * (rB + 0.05), a, 0.32, th, 0.36)); }
      if (i < N - 1) { const pm = instanced(new THREE.BoxGeometry(1, 1, 1), chip ? ledgeChip : ledgeStone, piers); pm.castShadow = true; T.add(pm); }
      // terrace ledge on top of the tier
      const rN = 12 - (i + 1) * 1.25;
      const ledge = new THREE.Mesh(new THREE.LatheGeometry([[rN - 0.2, 0], [rT + 0.45, 0], [rT + 0.45, 0.28], [rN - 0.2, 0.28]].map(([a, b]) => new THREE.Vector2(a, b)), 96), chip ? ledgeChip : ledgeStone);
      ledge.position.y = y + th; ledge.castShadow = ledge.receiveShadow = true; if (i < N - 1) T.add(ledge);
      y += th + 0.28;
    }
    const topY = y;
    // crowning die with gold pins
    const crown = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 3.2), [ledgeChip, ledgeChip, chipM(6, 1.5), ledgeChip, ledgeChip, ledgeChip]); crown.position.y = topY - 2.3; T.add(crown);
    chipMats.push(crown.material[2]);
    const pins = []; for (let k = 0; k < 12; k++) for (let sd = 0; sd < 4; sd++) { const o = -1.4 + k * 2.8 / 11, a = sd * Math.PI / 2; pins.push(M4(Math.sin(a) * 1.75 + Math.cos(a) * o, topY - 2.35, Math.cos(a) * 1.75 - Math.sin(a) * o, a, 0.12, 0.08, 0.4)); }
    T.add(instanced(new THREE.BoxGeometry(1, 1, 1), mats.gold(), pins));
    // rock base and plain
    const hillG = new THREE.CylinderGeometry(13.5, 20, 3, 96, 6); displace(hillG, v => v.add(v3(0, fbm(v.x * 0.2, v.y, v.z * 0.2, 4) * 1.2, 0))); const hill = new THREE.Mesh(hillG, mats.stone('#6a6458')); hill.position.y = -1.5; hill.receiveShadow = true; S.add(hill);
    const plain = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: col('#1a2a3a'), roughness: 1 })); plain.rotation.x = -Math.PI / 2; plain.position.y = -3; S.add(plain);
    // clouds
    const cloudT = cloudTexture(), clouds = [], r = rng(11);
    for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudT, color: col('#8aa8d8'), transparent: true, opacity: r.range(0.3, 0.55), depthWrite: false, fog: true })); const a = r() * TAU, rr = r.range(13, 23); sp.position.set(Math.sin(a) * rr, r.range(6, 9.5), Math.cos(a) * rr); sp.scale.set(r.range(18, 34), r.range(6, 10), 1); S.add(sp); clouds.push(sp); }
    const moon = new THREE.DirectionalLight(col('#d0e4ff'), 3.2); moon.position.set(-30, 40, 30); moon.castShadow = true; moon.shadow.mapSize.set(2048, 2048); const sc = moon.shadow.camera; sc.left = -20; sc.right = 20; sc.top = 25; sc.bottom = -10; sc.near = 1; sc.far = 150; moon.shadow.bias = -0.0005; S.add(moon);
    const rimL = new THREE.DirectionalLight(col('#3fa9ff'), 2.5); rimL.position.set(30, 10, -30); S.add(rimL);
    S.add(new THREE.HemisphereLight(col('#7ab0ff'), col('#101820'), 0.3));
    const glowL = new THREE.PointLight(col('#5fd0ff'), 0, 0, 1.2); glowL.position.set(0, topY + 1, 0); S.add(glowL);
    return {
      scene: S, cam: C,
      update(u, t) {
        const k = easeInOut(u);
        const az = lerp(0.35, 0.75, u);
        const pos = v3(Math.sin(az) * lerp(46, 26, k), lerp(3, topY + 2.5, k), Math.cos(az) * lerp(46, 26, k));
        look(C, pos.add(drift(t, 0.08)), v3(0, lerp(10, topY - 4, k), 0));
        const e = smooth(range(u, 0.2, 0.8));
        chipMats.forEach((m, i) => { m.emissiveIntensity = (1.8 + 0.3 * Math.sin(t * 6 + i)) * e; });
        ledgeChip.emissiveIntensity = 0.5 * e; glowL.intensity = 30 * e;
        clouds.forEach((c, i) => { c.position.x += 0; c.material.rotation = 0; });
        return { bloom: 0.45, threshold: 0.92, exposure: 0.95, vignette: 1.0 };
      },
    };
  },

  // ── Gargantua: raymarched Schwarzschild lensing, thin Doppler-beamed disk, tower debris spiralling in ──
  blackhole(p, ctx) {
    const S = new THREE.Scene(), C = camera(38, 0.05, 500);
    S.background = col('#000000');
    const R = ctx.renderer, pr = R.getPixelRatio();
    const rt = new THREE.WebGLRenderTarget(Math.round(W * pr * 0.5), Math.round(H * pr * 0.5), { type: THREE.HalfFloatType, depthBuffer: false });
    rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
    const U = { uCamPos: { value: v3() }, uCamMat: { value: new THREE.Matrix4() }, uTan: { value: Math.tan(THREE.MathUtils.degToRad(19)) }, uAspect: { value: W / H }, uTime: { value: 0 } };
    const bhScene = new THREE.Scene(), oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bhQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: U, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: GLSL_NOISE + `
        uniform vec3 uCamPos; uniform mat4 uCamMat; uniform float uTan, uAspect, uTime; varying vec2 vUv;
        vec3 stars(vec3 d){
          vec3 c = vec3(0.0);
          float band = exp(-pow(dot(d, normalize(vec3(0.25, 1.0, 0.35))), 2.0) * 10.0);
          c += vec3(0.30, 0.26, 0.34) * band * 0.05 * (0.4 + fbm4(d * 5.0));
          for (int i = 0; i < 2; i++) {
            float sc = i == 0 ? 90.0 : 210.0; vec3 p = d * sc; vec3 id = floor(p); vec3 f = fract(p) - 0.5;
            float h = hash13(id + float(i) * 17.0);
            if (h > 0.975) { vec3 off = vec3(hash13(id + 1.3), hash13(id + 2.7), hash13(id + 4.1)) - 0.5; float r = length(f - off * 0.5);
              float b = (h - 0.975) / 0.025; c += mix(vec3(1.0, 0.82, 0.6), vec3(0.7, 0.8, 1.0), hash13(id + 9.0)) * smoothstep(0.1, 0.0, r) * b * 3.0; }
          }
          return c;
        }
        vec3 temp(float x){ // 0 cold → 1 hot
          return mix(mix(vec3(0.6, 0.08, 0.01), vec3(1.0, 0.45, 0.1), smoothstep(0.0, 0.45, x)), vec3(1.0, 0.92, 0.78), smoothstep(0.45, 1.0, x));
        }
        void main(){
          vec2 q = (vUv * 2.0 - 1.0); 
          vec3 dir = normalize((uCamMat * vec4(q.x * uTan * uAspect, q.y * uTan, -1.0, 0.0)).xyz);
          vec3 pos = uCamPos; vec3 col = vec3(0.0); float trans = 1.0;
          float h2 = dot(cross(pos, dir), cross(pos, dir));
          bool hole = false; float rmin = 100.0;
          for (int i = 0; i < 200; i++) {
            float r = length(pos);
            rmin = min(rmin, r);
            if (r < 1.0) { hole = true; break; }
            if (r > 60.0 && dot(pos, dir) > 0.0) break;
            float dt = clamp(r < 3.0 ? 0.035 * r : 0.07 * r * (r > 4.0 ? 1.4 : 1.0), 0.01, 3.0);
            vec3 prev = pos;
            vec3 acc = -1.5 * h2 * pos / pow(r, 5.0);
            dir += acc * dt; pos += dir * dt;
            if (prev.y * pos.y < 0.0) {
              float f = prev.y / (prev.y - pos.y); vec3 hp = mix(prev, pos, f); float rr = length(hp.xz);
              if (rr > 2.9 && rr < 13.0) {
                float ang = atan(hp.z, hp.x) - uTime * 1.6 / pow(rr, 1.5);
                vec3 np = vec3(cos(ang) * 2.2, sin(ang) * 2.2, rr * 1.8);
                float n = fbm4(np) * 0.7 + fbm4(vec3(rr * 6.0, cos(ang) * 0.8, sin(ang) * 0.8)) * 0.6;
                float x = pow(2.9 / rr, 0.75) * pow(max(0.0, 1.0 - sqrt(2.9 / rr)), 0.25) * 1.9;
                vec3 v = sqrt(0.5 / rr) * normalize(vec3(-hp.z, 0.0, hp.x));
                vec3 k = -normalize(dir);
                float b = length(v), g = 1.0 / (inversesqrt(1.0 - b * b) * (1.0 - dot(v, k)));
                g *= sqrt(1.0 - 1.0 / rr);
                float I = pow(g, 2.6) * x * x * 3.2 * (0.45 + n);
                vec3 dc = temp(clamp(x * g * 0.9, 0.0, 1.0)) * I; dc = dc / (1.0 + 0.25 * dc);
                float edge = smoothstep(2.9, 3.4, rr) * smoothstep(13.0, 8.0, rr);
                float a = clamp((0.55 + 0.6 * n) * edge, 0.0, 1.0);
                col += trans * dc * a * 0.55; trans *= (1.0 - a * 0.85);
                if (trans < 0.02) break;
              }
            }
          }
          if (!hole) col += trans * stars(normalize(dir));
          col += trans * vec3(1.0, 0.75, 0.45) * 0.5 * exp(-pow((rmin - 1.53) / 0.035, 2.0));
          gl_FragColor = vec4(col, 1.0);
        }`,
    })); bhQuad.frustumCulled = false; bhScene.add(bhQuad);
    const show = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: { tex: { value: rt.texture } }, depthTest: false, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }',
      fragmentShader: 'uniform sampler2D tex; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tex, vUv).rgb, 1.0); }' }));
    show.frustumCulled = false; show.renderOrder = -100; S.add(show);
    S.userData.rt = rt;
    // debris from the tower: stone blocks and glowing circuit shards, spiralling in (drawn in front of the disk)
    const r = rng(48), deb = [];
    const stone = mats.stone('#8a7c6a'), shardM = new THREE.MeshStandardMaterial({ color: col('#0c1626'), metalness: 0.7, roughness: 0.3, emissive: col('#4fb8ff'), emissiveIntensity: 1.2 });
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(i % 4 === 0 ? new THREE.BoxGeometry(0.16, 0.025, 0.16) : new THREE.BoxGeometry(r.range(0.25, 0.6), r.range(0.15, 0.35), r.range(0.2, 0.45)), i % 4 === 0 ? shardM : stone);
      m.userData = { r0: r.range(11, 22), a0: r.range(-0.9, 0.9), y0: r.range(-0.5, 0.9), spin: r.dir(), sp: r.range(0.6, 1.2) }; S.add(m); deb.push(m);
    }
    const diskL = new THREE.PointLight(col('#ffb070'), 60, 0, 1.2); S.add(diskL);
    S.add(new THREE.AmbientLight(col('#ffd0a0'), 0.05));
    return {
      scene: S, cam: C,
      update(u, t) {
        const k = easeIn(u * 1.15) * 0.6 + u * 0.4;
        const dist = lerp(34, 11, clamp(k)), az = lerp(-0.25, 0.1, u), el = lerp(0.115, 0.085, u);
        look(C, orbit(dist, az, el), v3(0, lerp(0.0, 0.1, u), 0));
        C.updateMatrixWorld();
        U.uCamPos.value.copy(C.position); U.uCamMat.value.copy(C.matrixWorld); U.uTime.value = t;
        const prevT = R.getRenderTarget(); R.setRenderTarget(rt); R.render(bhScene, oc); R.setRenderTarget(prevT);
        deb.forEach((m, i) => { const d = m.userData, s = clamp(t * 0.12 * d.sp); const rr = lerp(d.r0, 3.5, s * s); const a = d.a0 + az + s * 2.2 + t * 0.35 / Math.sqrt(rr / 10);
          m.position.set(Math.sin(a) * rr, d.y0 * (rr / 12), Math.cos(a) * rr); m.rotation.set(d.spin.x * t * 2, d.spin.y * t * 2, d.spin.z * t * 2);
          const toCam = C.position.clone().sub(m.position); m.visible = toCam.dot(C.position) > 0 && m.position.distanceTo(C.position) > 5.0; });
        return { bloom: 0.55, threshold: 0.85, exposure: 1.0, vignette: 1.0 };
      },
    };
  },

  // ── flame test: Li crimson, K lilac, Cu green, Na yellow + D lines ──
  flame(p) {
    const el = p.el || 'Na', E = ELEMENTS[el], S = new THREE.Scene(), C = camera(el === 'Na' ? 34 : 30);
    backdrop(S, 'theft'); S.fog = new THREE.Fog(col('#050201'), 8, 22);
    S.environmentIntensity = 0.35;
    const brass = new THREE.MeshStandardMaterial({ color: col('#d8a85a'), metalness: 1, roughness: 0.28, roughnessMap: noiseTexture('rough-fine', { scale: 40, contrast: 1.5 }) });
    const B = bunsen(brass); S.add(B);
    // bench: dark soapstone
    const bench = new THREE.Mesh(new THREE.PlaneGeometry(30, 20), new THREE.MeshStandardMaterial({ color: col('#141210'), roughness: el === 'Na' ? 0.6 : 0.32, roughnessMap: noiseTexture('rough-mid', { scale: 12, contrast: 1.4 }) }));
    bench.rotation.x = -Math.PI / 2; bench.receiveShadow = true; S.add(bench);
    // flames: faint blue inner cone + element-coloured outer flame
    const flameG = new THREE.Group(); flameG.position.y = 1.6; S.add(flameG);
    const inner = flameMesh({ h: 0.4, w: 0.17, core: '#a0d0ff', mid: '#2a60ff', edge: '#1020a0', k: 1.4, wob: 0.05, sharp: 1.0, tongue: 0.2, speed: 4, seed: 3, waist: 0.05 });
    const outer = flameMesh({ h: 1.5, w: 0.46, core: E.core, mid: E.mid, edge: E.edge, k: E.k, wob: 0.45, sharp: 0.7, tongue: 1.4, speed: 2.6, seed: 11 + el.length, waist: 0.1 });
    const outer2 = flameMesh({ h: 1.2, w: 0.36, core: E.core, mid: E.mid, edge: E.edge, k: E.k * 0.5, wob: 0.7, sharp: 0.8, tongue: 1.6, speed: 3.1, seed: 23 + el.length, waist: 0.1 });
    const blueBody = flameMesh({ h: 0.9, w: 0.34, core: '#6080ff', mid: '#2030c0', edge: '#100850', k: 0.7, wob: 0.2, sharp: 0.9, tongue: 0.8, speed: 3, seed: 5, waist: 0.05 });
    flameG.add(blueBody, inner, outer, outer2);
    const lamp = new THREE.PointLight(col(E.light), 6, 0, 1.4); lamp.position.set(0, 2.1, 0); lamp.castShadow = true; lamp.shadow.mapSize.set(512, 512); lamp.shadow.bias = -0.003; S.add(lamp);
    const key = new THREE.SpotLight(col('#ffe0c0'), 25, 0, 0.5, 0.7, 1.2); key.position.set(-3, 5, 3); key.target.position.set(0, 1, 0); S.add(key, key.target);
    const rimL = new THREE.DirectionalLight(col('#ffc890'), 0.6); rimL.position.set(4, 3, -5); S.add(rimL);
    // platinum loop on a glass rod, dipped into the flame edge
    const loopG = new THREE.Group(); S.add(loopG);
    const plat = mats.chrome({ color: col('#d8d6d2'), roughness: 0.18 });
    const wire = new THREE.Mesh(tube([v3(0, 0, 0), v3(0.6, 0.05, 0), v3(1.2, 0.12, 0)], 0.008, 20, 6), plat); loopG.add(wire);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 32), new THREE.MeshStandardMaterial({ color: col('#ffffff'), metalness: 1, roughness: 0.2, emissive: col('#ffb070'), emissiveIntensity: 1.2 })); ring.position.set(-0.04, 0, 0); ring.rotation.y = Math.PI / 2; loopG.add(ring);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 12), mats.glow(E.core, 1.6)); bead.position.copy(ring.position); loopG.add(bead);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 16), new THREE.MeshPhysicalMaterial({ color: col('#e0e8e8'), roughness: 0.08, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.55 }));
    rod.rotation.z = Math.PI / 2; rod.position.set(2.25, 0.12, 0); loopG.add(rod);
    loopG.rotation.set(0, 0.5, -0.32);
    // background glassware catching the flame colour
    const glassM = new THREE.MeshPhysicalMaterial({ color: col('#c8d8d0'), roughness: 0.04, metalness: 0, clearcoat: 1, transparent: true, opacity: 0.12, side: THREE.DoubleSide, envMapIntensity: 1.5 });
    const flaskProf = [[0, 0], [0.5, 0], [0.55, 0.05], [0.3, 0.9], [0.12, 1.0], [0.12, 1.45], [0.15, 1.5]].map(([x, y]) => new THREE.Vector2(x, y));
    [[-1.8, -2.2, 1.1], [-0.6, -3.4, 1.3]].forEach(([x, z, s], i) => {
      const gm = new THREE.Mesh(new THREE.LatheGeometry(flaskProf, 48), glassM);
      gm.position.set(x, 0, z); gm.scale.setScalar(s); S.add(gm);
    });
    // Na: slit, prism and spectroscope card with the sodium doublet
    let card = null, beamIn = null, beamOut = null, lines = null;
    if (el === 'Na') {
      const slit = new THREE.Group(); slit.position.set(1.9, 2.1, 0); slit.rotation.y = Math.PI / 2; S.add(slit);
      const plateM = new THREE.MeshStandardMaterial({ color: col('#121010'), metalness: 0.6, roughness: 0.45 });
      const pa = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.0, 0.04), plateM); pa.position.x = -0.21; slit.add(pa);
      const pb = pa.clone(); pb.position.x = 0.21; slit.add(pb);
      const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6, 12), brass); stand.position.set(1.9, 0.8, 0); S.add(stand);
      const prism = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.75, 3, 1), new THREE.MeshPhysicalMaterial({ color: col('#f0f6ff'), roughness: 0.04, metalness: 0, transparent: true, opacity: 0.4, clearcoat: 1, envMapIntensity: 3, emissive: col('#ff9a20'), emissiveIntensity: 0.12, side: THREE.DoubleSide }));
      prism.position.set(3.4, 2.1, 0.2); prism.rotation.y = 0.35; S.add(prism);
      prism.add(new THREE.LineSegments(new THREE.EdgesGeometry(prism.geometry), new THREE.LineBasicMaterial({ color: col('#ffd890').multiplyScalar(1.2), transparent: true, opacity: 0.6 })));
      const pst = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.12, 6), brass); pst.position.set(3.4, 1.6, 0.2); S.add(pst);
      const pst2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12), brass); pst2.position.set(3.4, 0.8, 0.2); S.add(pst2);
      const beamMat = (c, o) => new THREE.MeshBasicMaterial({ color: col(c).multiplyScalar(o), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      beamIn = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.05), beamMat('#ffb030', 2)); beamIn.position.set(2.65, 2.1, 0.1); beamIn.rotation.x = Math.PI / 2; S.add(beamIn);
      // card on the right
      card = new THREE.Group(); card.position.set(6.4, 2.1, 1.6); card.rotation.y = -1.1; S.add(card);
      const cardM = new THREE.MeshStandardMaterial({ map: spectrumCardTexture(), roughness: 0.7, emissive: col('#ffffff'), emissiveMap: spectrumCardTexture(), emissiveIntensity: 0.25 });
      const cm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.7, 0.03), [plateM, plateM, plateM, plateM, cardM, plateM]); card.add(cm);
      const cst = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 12), brass); cst.position.y = -1.4; card.add(cst);
      lines = new THREE.Group(); card.add(lines);
      const xnm = nm => ((nm - 400) / 300 - 0.5) * 2.8;
      [589.0, 589.6].forEach((nm, i) => { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.01, 0.4), mats.glow('#ffc830', 3.5, { transparent: true })); l.position.set(xnm(nm) + (i ? 0.035 : -0.035), 0.06, 0.02); lines.add(l); });
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.55), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {}, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'varying vec2 vUv; void main(){ vec2 q=(vUv-0.5)*vec2(2.0,2.0); float a=exp(-q.x*q.x*30.0)*exp(-q.y*q.y*4.0); gl_FragColor=vec4(vec3(1.0,0.6,0.1)*a*0.35,1.0);}' }));
      halo.position.set(xnm(589.3), 0.06, 0.025); lines.add(halo);
      const lab = canvasTexture('na-label', 512, 128, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd890'; g.font = 'italic 64px Georgia, serif'; g.textAlign = 'center'; g.fillText('Na  D₁ D₂', w / 2, 84); });
      const lm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.125), new THREE.MeshBasicMaterial({ map: lab, transparent: true, blending: THREE.AdditiveBlending, color: col('#ffffff').multiplyScalar(1.4) })); lm.position.set(xnm(589.3), 0.25 + 0.02, 0.02); card.add(lm);
      // dispersed beam from prism to the doublet on the card
      const target = card.localToWorld(v3(xnm(589.3), 0.06, 0)); card.updateMatrixWorld(true);
      const from = v3(3.5, 2.1, 0.3), tgt = v3(6.4, 2.1, 1.6).add(v3(xnm(589.3) * Math.cos(-1.1), 0.06, -xnm(589.3) * Math.sin(-1.1)));
      const d = tgt.clone().sub(from); beamOut = new THREE.Mesh(new THREE.PlaneGeometry(d.length(), 0.06), beamMat('#ffb030', 1.6));
      beamOut.position.copy(from.clone().add(tgt).multiplyScalar(0.5)); beamOut.rotation.set(Math.PI / 2, 0, 0); beamOut.rotation.order = 'YXZ'; beamOut.rotation.y = -Math.atan2(d.z, d.x); S.add(beamOut);
    }
    const shots = {
      Li: u => ({ pos: orbit(lerp(2.6, 2.3, u), lerp(-0.9, -0.75, u), 0.02, v3(0, 1.75, 0)), tgt: v3(0.15, 2.05, 0), loop: v3(0.25, 1.95, 0.05) }),
      K: u => ({ pos: orbit(lerp(1.45, 1.3, u), lerp(1.25, 1.15, u), lerp(0.15, 0.1, u), v3(0.2, 2.0, 0)), tgt: v3(0.1, 2.0, 0), loop: v3(0.2, 1.95, 0.05) }),
      Cu: u => ({ pos: orbit(lerp(4.2, 3.8, u), lerp(2.6, 2.75, u), 0.62, v3(0, 1.3, 0)), tgt: v3(0, 1.75, 0), loop: v3(0.22, 1.9, 0.04) }),
      Na: u => { const k = easeInOut(range(u, 0.3, 0.95)); return { pos: v3(lerp(0.9, 5.15, k) + u * 0.3, lerp(3.0, 2.25, k), lerp(5.4, 2.65, k)), tgt: v3(lerp(1.5, 6.57, k), lerp(2.0, 2.14, k), lerp(0.2, 1.93, k)), loop: v3(0.22, 1.9, 0.04) }; },
    };
    return {
      scene: S, cam: C,
      update(u, t) {
        const sh = shots[el](u);
        look(C, sh.pos.add(drift(t, 0.01)), sh.tgt);
        [blueBody, inner, outer, outer2].forEach(f => f.faceCam(C, t + 3));
        const fk = flicker(t, 1.7);
        outer.material.uniforms.uK.value = E.k * (0.9 + 0.1 * fk); lamp.intensity = 6 * fk;
        loopG.position.copy(sh.loop).add(v3(0.01 * Math.sin(t * 4), 0.01 * Math.sin(t * 3), 0));
        ring.material.emissiveIntensity = 1.2 + Math.sin(t * 20) * 0.2;
        if (el === 'Na') { const k = range(u, 0.0, 0.35); beamIn.material.opacity = 0.35 * k; beamOut.material.opacity = 0.35 * range(u, 0.2, 0.5); lines.children.forEach(l => { l.material.opacity = smooth(range(u, 0.25, 0.55)); }); }
        return { bloom: 0.4, threshold: 0.95, exposure: 1.0, vignette: 1.0 };
      },
    };
  },
};

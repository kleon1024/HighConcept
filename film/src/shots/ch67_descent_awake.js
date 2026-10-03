// VI 降 and VII 觉 — data cyan/amber descent, then gold awakening.
// loss → network → android → electric sheep → converge → eye → ending (ouroboros → seed point)
import {
  THREE, TAU, clamp, lerp, smooth, smoother, easeOut, easeIn, easeInOut, range, v3, col, rng, fbm, noise3,
  displace, backdrop, rig, mats, canvasTexture, noiseTexture, Dust, LineBuilder,
  camera, look, orbit, drift, seedPoint, PALETTES,
} from '../core.js';

// ============================================================== shared helpers
// shader patch: inject GLSL into a built-in material. vObj = object-space position.
function patch(m, key, o = {}) {
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, o.uniforms || {});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\n' + (o.vHead || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;\n' + (o.vMain || ''));
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\n' + (o.fHead || ''))
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (o.fDiscard || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (o.fMain || ''))
      .replace('#include <opaque_fragment>', '#include <opaque_fragment>\n' + (o.fEnd || ''));
  };
  m.customProgramCacheKey = () => key;
  return m;
}
// anti-aliased thin line mask for a signed distance d (in object units)
const GLSL_LINE = 'float aaLine(float d, float w){ float f = fwidth(d) + 1e-5; return clamp(1.0 - (abs(d) - w) / f, 0.0, 1.0) * clamp(w / f * 1.5 + 0.3, 0.0, 1.0); }\n';

// sweep a circle along points. rFn(s) radius by arc fraction; up: optional fixed up vector for frames.
function sweep(pts, rFn, radial = 8, { closed = false, up = null, uvLen = 1 } = {}) {
  const n = pts.length, T = [], N = [], B = [], L = [0];
  for (let i = 1; i < n; i++) L.push(L[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const tot = L[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    T.push(b.clone().sub(a).normalize());
  }
  for (let i = 0; i < n; i++) {
    let nn;
    if (up) nn = (up.isVector3 ? up : up(i)).clone();
    else if (i === 0) { nn = Math.abs(T[0].y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0); }
    else nn = N[i - 1].clone();
    nn.sub(T[i].clone().multiplyScalar(nn.dot(T[i]))).normalize();
    N.push(nn); B.push(T[i].clone().cross(nn));
  }
  const P = new Float32Array(n * (radial + 1) * 3), UV = new Float32Array(n * (radial + 1) * 2), I = [];
  for (let i = 0; i < n; i++) {
    const r = rFn(L[i] / tot, i);
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, c = Math.cos(a), s = Math.sin(a), k = (i * (radial + 1) + j);
      P[k * 3] = pts[i].x + (N[i].x * c + B[i].x * s) * r;
      P[k * 3 + 1] = pts[i].y + (N[i].y * c + B[i].y * s) * r;
      P[k * 3 + 2] = pts[i].z + (N[i].z * c + B[i].z * s) * r;
      UV[k * 2] = L[i] * uvLen; UV[k * 2 + 1] = j / radial;
    }
  }
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) for (let j = 0; j < radial; j++) {
    const i2 = (i + 1) % n, a = i * (radial + 1) + j, b = i2 * (radial + 1) + j;
    I.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(UV, 2));
  g.setIndex(I); g.computeVertexNormals();
  g.userData.frames = { T, N, B, L, tot };
  return g;
}
// merge plain (indexed, position+normal+uv) geometries
function merge(geos) {
  let nv = 0, ni = 0; geos.forEach(g => { nv += g.attributes.position.count; ni += g.index.count; });
  const P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), U = new Float32Array(nv * 2), I = new Uint32Array(ni);
  let ov = 0, oi = 0;
  geos.forEach(g => {
    P.set(g.attributes.position.array, ov * 3); Nn.set(g.attributes.normal.array, ov * 3);
    if (g.attributes.uv) U.set(g.attributes.uv.array, ov * 2);
    const idx = g.index.array; for (let i = 0; i < idx.length; i++) I[oi + i] = idx[i] + ov;
    ov += g.attributes.position.count; oi += idx.length;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(U, 2)); g.setIndex(new THREE.BufferAttribute(I, 1));
  return g;
}
const gauss2 = (x, y, sx, sy) => Math.exp(-(x * x) / (sx * sx) - (y * y) / (sy * sy));

// perceptual colormap (magma)
const MAGMA = ['#000004', '#1c1044', '#4f127b', '#812581', '#b5367a', '#e55064', '#fb8761', '#fec287', '#fcfdbf'].map(c => col(c));
function magma(t) { t = clamp(t) * (MAGMA.length - 1); const i = Math.min(MAGMA.length - 2, Math.floor(t)); return MAGMA[i].clone().lerp(MAGMA[i + 1], t - i); }

// ============================================================== the loss landscape (shots: loss, converge)
const LA = -0.4, LB = 2.3, LQ = 0.055, HS = 0.45; // saddle x, minimum x, quartic scale, vertical scale
const lc = x => 0.55 * Math.sin(0.75 * x + 0.3);               // ravine centre line
const lg = x => LQ * (x ** 4 / 4 - (2 * LA + LB) * x ** 3 / 3 + (LA * LA + 2 * LA * LB) * x * x / 2 - LA * LA * LB * x);
function lossF(x, y) {
  const d = y - lc(x);
  return 2.6 * Math.tanh(lg(x) / 2.6) + 2.8 * Math.tanh(0.9 * d * d / 2.8)
    + 0.7 * Math.exp(-((x - LA) ** 2 + (d - 1.5) ** 2) / 0.5) + 0.7 * Math.exp(-((x - LA) ** 2 + (d + 1.5) ** 2) / 0.5)
    - 1.1 * Math.exp(-((x - LB) ** 2 + d * d) / 1.6) + 0.02 * (x * x + y * y)
    + 0.5 * fbm(x * 0.45 + 7, y * 0.45, 1.3, 3) * smooth((Math.abs(d) - 1.0) / 1.5);
}
// momentum SGD (heavy ball) with tiny seeded gradient noise
function sgdPath(steps = 125) {
  const e = 1e-4, r = rng(4242), out = [];
  let x = -3.7, y = lc(-3.7) + 1.25, vx = 0, vy = 0; const lr = 0.03, mu = 0.88;
  out.push([x, y]);
  for (let i = 0; i < steps; i++) {
    const gx = (lossF(x + e, y) - lossF(x - e, y)) / (2 * e) + r.gauss() * 0.04;
    const gy = (lossF(x, y + e) - lossF(x, y - e)) / (2 * e) + r.gauss() * 0.04;
    vx = mu * vx - lr * gx; vy = mu * vy - lr * gy; x += vx; y += vy; out.push([x, y]);
  }
  return out;
}
const lossWorld = (x, y, lift = 0) => v3(x, lossF(x, y) * HS + lift, y);

function lossLandscape(S, { res = 1 } = {}) {
  const X0 = -7.5, X1 = 6.5, Y0 = -5.5, Y1 = 5.5, NX = Math.round(230 * res), NY = Math.round(180 * res);
  const g = new THREE.PlaneGeometry(X1 - X0, Y1 - Y0, NX, NY); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position, C = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + (X0 + X1) / 2, y = P.getZ(i) + (Y0 + Y1) / 2, h = lossF(x, y);
    P.setXYZ(i, x, h * HS, y);
    const c = magma(0.06 + 0.8 * Math.pow(clamp((h + 1.3) / 6.0), 0.85));
    C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals();
  const uni = { uFold: { value: 0 }, uMin: { value: lossWorld(LB, lc(LB)) }, uLine: { value: 1 }, uLineCol: { value: col('#5fe6ff').multiplyScalar(0.9) }, uGlow: { value: 0 } };
  const m = patch(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.0, clearcoat: 0.35, clearcoatRoughness: 0.3 }), 'loss-surface', {
    uniforms: uni,
    vHead: 'uniform float uFold; uniform vec3 uMin;',
    vMain: `{ vec2 r = transformed.xz - uMin.xz; float d = length(r);
      float s = pow(max(0.0, 1.0 - uFold), 1.0 + 0.35 * d);
      float an = uFold * uFold * 5.0 / (0.6 + 0.25 * d);
      r = mat2(cos(an), -sin(an), sin(an), cos(an)) * r * s;
      transformed.xz = uMin.xz + r; transformed.y = mix(uMin.y, transformed.y, s); }`,
    fHead: 'uniform float uLine; uniform vec3 uLineCol; uniform float uGlow;\n' + GLSL_LINE,
    fMain: `{ float lv = vObj.y / ${(0.3 * HS).toFixed(4)};
      float ln = aaLine(fract(lv + 0.5) - 0.5, 0.03);
      float major = aaLine(fract(lv / 5.0 + 0.5) - 0.5, 0.007);
      totalEmissiveRadiance += uLineCol * (ln * 0.3 + major * 0.8) * uLine;
      diffuseColor.rgb *= 1.0 - 0.3 * ln * uLine;
      totalEmissiveRadiance += vec3(1.0, 0.7, 0.3) * uGlow; }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; S.add(mesh);
  return { mesh, uni };
}
function goldBall(r = 0.12) {
  const grp = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mats.gold({ emissive: col('#ffb040'), emissiveIntensity: 0.9, roughness: 0.15 }));
  ball.castShadow = true; grp.add(ball);
  const light = new THREE.PointLight(col('#ffc060'), 0.5, 2.5, 1.5); grp.add(light);
  return { grp, ball, light };
}

// ============================================================== android head
// sculpt a unit sphere into a human face (front = +z, up = +y)
function faceField(X, Y, eyeDX = [0, 0]) {
  let h = 0;
  for (const s of [-1, 1]) {
    const ex = s * 0.265;
    h -= 0.085 * gauss2(X - ex, Y - 0.06, 0.2, 0.15);            // socket
    h += 0.085 * gauss2(X - ex - eyeDX[s > 0 ? 1 : 0], Y - 0.035, 0.11, 0.075); // closed lid over the eyeball
    h += 0.06 * gauss2(X - s * 0.22, Y - 0.22, 0.2, 0.05);        // brow ridge
    h += 0.06 * gauss2(X - s * 0.4, Y + 0.12, 0.11, 0.1);         // cheekbone
    h -= 0.05 * gauss2(X - s * 0.36, Y + 0.32, 0.1, 0.12);        // hollow under the cheekbone
    h += 0.06 * gauss2(X - s * 0.085, Y + 0.34, 0.045, 0.035);    // nostril wing
    h -= 0.035 * gauss2(X - s * 0.19, Y + 0.51, 0.04, 0.06);      // mouth-corner hollow
    h += 0.03 * gauss2(X - s * 0.14, Y + 0.4, 0.06, 0.08);        // muzzle
  }
  const ns = smooth((0.12 - Y) / 0.45) * smooth((Y + 0.39) / 0.05); // nose bridge to tip
  h += (0.05 + 0.17 * smooth((0.06 - Y) / 0.38)) * Math.exp(-(X * X) / (0.04 + 0.05 * smooth((0.05 - Y) / 0.4)) ** 2) * ns;
  h += 0.05 * gauss2(X, Y + 0.31, 0.055, 0.05);                   // tip
  h -= 0.025 * gauss2(X, Y + 0.42, 0.018, 0.03);                  // philtrum groove
  h += 0.075 * gauss2(X, Y + 0.465, 0.12, 0.032) * (1 - 0.3 * gauss2(X, 0, 0.02, 1)); // upper lip
  h -= 0.04 * gauss2(X, Y + 0.515, 0.12, 0.012);                  // mouth slit
  h += 0.085 * gauss2(X, Y + 0.565, 0.095, 0.035);               // lower lip
  h -= 0.05 * gauss2(X, Y + 0.65, 0.11, 0.03);                    // under-lip crease
  h += 0.1 * gauss2(X, Y + 0.8, 0.14, 0.09);                      // chin
  return h;
}
function shapeHead(v) {
  const n = v.clone().normalize();
  let x = n.x * 0.74, y = n.y * 1.0, z = n.z > 0 ? 0.8 * n.z * (1 + 0.3 * (1 - n.z * n.z)) : n.z * 0.98;
  if (y < 0) y *= 1.06;
  const jaw = smooth((-0.15 - n.y) / 0.8);
  x *= 1 - 0.3 * jaw; if (n.z < 0) z *= 1 - 0.35 * jaw;
  z += 0.06 * jaw * smooth(n.z / 0.5);
  const w = smooth((n.z - 0.15) / 0.5);
  return { x, y, z, w };
}
function androidHead() {
  const sph = new THREE.SphereGeometry(1, 300, 240);
  // remember eye-region vertices (pre-sculpt) for the REM flicker
  const P0 = sph.attributes.position, eyeV = [];
  for (let i = 0; i < P0.count; i++) {
    const s = shapeHead(v3(P0.getX(i), P0.getY(i), P0.getZ(i)));
    if (s.w > 0.01 && Math.abs(Math.abs(s.x) - 0.265) < 0.2 && Math.abs(s.y - 0.04) < 0.16) eyeV.push([i, s.x, s.y, s.z, s.w]);
  }
  const g = displace(sph, v => { const s = shapeHead(v); return v3(s.x, s.y, s.z + faceField(s.x, s.y) * s.w); });
  const P = g.attributes.position;
  const uni = { uRem: { value: 0 }, uRemCol: { value: col('#6fe8ff') } };
  const seams = `
    float seam = 0.0;
    seam = max(seam, aaLine(vObj.y - 0.5 + 0.25 * vObj.x * vObj.x, 0.002) * step(0.3, vObj.z));   // brow plate
    seam = max(seam, aaLine(vObj.y + 0.36 - 0.5 * abs(vObj.x), 0.002) * step(0.3, vObj.z) * step(0.2, abs(vObj.x)) * step(abs(vObj.x), 0.5)); // cheek plates
    float ex = abs(vObj.x) - 0.265;
    float lidY = 0.0 - 0.03 * (1.0 - pow(ex / 0.12, 2.0));
    float lid = aaLine(vObj.y - lidY, 0.004) * step(abs(ex), 0.12) * step(0.3, vObj.z);
    float mouth = aaLine(vObj.y + 0.52 - 0.02 * pow(abs(vObj.x) / 0.12, 2.0), 0.004) * step(abs(vObj.x), 0.12) * step(0.3, vObj.z);
    float dark = max(seam * 0.9, max(lid, mouth));
    diffuseColor.rgb *= 1.0 - 0.88 * dark; roughnessFactor = mix(roughnessFactor, 0.7, dark);
    totalEmissiveRadiance += uRemCol * lid * uRem;`;
  const ceramic = patch(new THREE.MeshPhysicalMaterial({ color: col('#f1eee8'), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }), 'android-ceramic', {
    uniforms: uni, fHead: 'uniform float uRem; uniform vec3 uRemCol;\n' + GLSL_LINE, fMain: seams,
  });
  const head = new THREE.Mesh(g, ceramic); head.castShadow = true; head.receiveShadow = true;
  // chrome cranial plate: same sculpt, slightly larger, only over crown and back
  const plate = new THREE.Mesh(g, patch(mats.chrome({ roughness: 0.28, envMapIntensity: 0.6 }), 'android-plate', {
    vMain: 'transformed *= 1.012;',
    fDiscard: 'if (vObj.z > 0.05 && pow(vObj.x / 0.57, 2.0) + pow((vObj.y + 0.12) / 0.86, 2.0) < 1.0) discard; if (vObj.y < -0.75 && vObj.z > -0.3) discard;',
  }));
  plate.castShadow = true;
  const grp = new THREE.Group(); grp.add(head, plate);
  // ear modules: chrome discs with rings
  for (const s of [-1, 1]) {
    const ear = new THREE.Group(); ear.position.set(s * 0.7, 0.02, -0.06); ear.rotation.y = s * Math.PI / 2;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.08, 64), mats.chrome({ roughness: 0.18 })); disc.rotation.x = Math.PI / 2; ear.add(disc);
    for (let k = 0; k < 3; k++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(0.06 + k * 0.045, 0.006, 8, 64), mats.chrome({ roughness: 0.05 })); rr.position.z = 0.045; ear.add(rr); }
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.04, 32), mats.glow('#6fe8ff', 1.2)); core.position.z = 0.046; ear.add(core);
    grp.add(ear);
  }
  // neck: chrome column with grooves
  const neck = new THREE.Group(); neck.position.set(0, -0.95, -0.12);
  const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.3, 1.0, 64, 1, true), mats.chrome({ roughness: 0.2 })); col1.position.y = -0.4; neck.add(col1);
  for (let k = 0; k < 6; k++) { const rr = new THREE.Mesh(new THREE.TorusGeometry(0.285 + k * 0.003, 0.012, 8, 64), mats.plastic('#1a1d22', { roughness: 0.4 })); rr.rotation.x = Math.PI / 2; rr.position.y = -0.1 - k * 0.12; neck.add(rr); }
  grp.add(neck);
  return { grp, g, eyeV, uni };
}

// ============================================================== the electric sheep
function coilLoop(c, n, rc, rcoil, turns, np) {
  const e1 = Math.abs(n.y) < 0.9 ? v3(0, 1, 0).cross(n).normalize() : v3(1, 0, 0).cross(n).normalize(), e2 = n.clone().cross(e1);
  const pts = [];
  for (let i = 0; i < np; i++) {
    const a = i / np * TAU, rd = e1.clone().multiplyScalar(Math.cos(a)).add(e2.clone().multiplyScalar(Math.sin(a)));
    pts.push(c.clone().add(rd.clone().multiplyScalar(rc + rcoil * Math.cos(turns * a))).add(n.clone().multiplyScalar(rcoil * Math.sin(turns * a))));
  }
  return pts;
}
// dissolve coordinate in sheep space (JS and GLSL agree)
const sheepQ = p => (p.x + 1.0) / 2.0 + 0.07 * Math.sin(13 * p.y + 2 * p.z) + 0.07 * Math.sin(11 * p.z + 3 * p.x);
const GLSL_Q = 'float sheepQ(vec3 p){ return (p.x + 1.0) / 2.0 + 0.07 * sin(13.0 * p.y + 2.0 * p.z) + 0.07 * sin(11.0 * p.z + 3.0 * p.x); }\n';

function makeSheep() {
  const sheep = new THREE.Group(), r = rng(77);
  const uni = { uD: { value: -1 }, uInv: { value: new THREE.Matrix4() }, uEdge: { value: col('#ffd27a').multiplyScalar(2.5) } };
  const dissolve = (m, key) => patch(m, key, {
    uniforms: uni,
    vHead: 'uniform mat4 uInv; varying vec3 vSL;',
    vMain: 'vSL = (uInv * modelMatrix * vec4(transformed, 1.0)).xyz;',
    fHead: 'uniform float uD; uniform vec3 uEdge; varying vec3 vSL;\n' + GLSL_Q,
    fDiscard: 'float qq = sheepQ(vSL); if (qq < uD) discard;',
    fMain: 'totalEmissiveRadiance += uEdge * (1.0 - smoothstep(0.0, 0.035, qq - uD)) * step(-0.5, uD);',
  });
  // wool: copper filament coils
  const curls = [], woolPts = [];
  const RX = 0.66, RY = 0.43, RZ = 0.42, NCURL = 400;
  const addCurl = (c, n, rc, np = 44) => { const pts = coilLoop(c, n, rc, rc * 0.3, 7 + Math.floor(r() * 3), np); curls.push(sweep(pts, () => 0.0065, 4, { closed: true })); pts.forEach((p, i) => { if (i % 3 === 0) woolPts.push(p); }); };
  for (let i = 0; i < NCURL; i++) {
    const yy = 1 - 2 * (i + 0.5) / NCURL, rr = Math.sqrt(1 - yy * yy), a = i * 2.39996 + r.range(-0.2, 0.2);
    const d = v3(rr * Math.cos(a), yy, rr * Math.sin(a));
    const p = v3(d.x * RX, d.y * RY, d.z * RZ), n = v3(d.x / RX, d.y / RY, d.z / RZ).normalize();
    addCurl(p.add(n.clone().multiplyScalar(0.035 + r.range(-0.02, 0.02))), n.clone().add(r.dir().multiplyScalar(0.4)).normalize(), r.range(0.058, 0.08));
  }
  // tail
  for (let i = 0; i < 6; i++) addCurl(v3(-0.66 + r.range(-0.04, 0.04), 0.12 + r.range(-0.06, 0.06), r.range(-0.06, 0.06)), r.dir().add(v3(-1, 0, 0)).normalize(), r.range(0.045, 0.06), 40);
  const woolMat = dissolve(new THREE.MeshStandardMaterial({ color: col('#f0a070'), metalness: 1, roughness: 0.28, emissive: col('#ff9a50'), emissiveIntensity: 0.5 }), 'sheep-wool');
  const wool = new THREE.Mesh(merge(curls), woolMat); sheep.add(wool);
  const core = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), dissolve(new THREE.MeshStandardMaterial({ color: col('#4a2410'), metalness: 0.6, roughness: 0.5, emissive: col('#ff6a1a'), emissiveIntensity: 0.12 }), 'sheep-core'));
  core.scale.set(RX * 0.98, RY * 0.97, RZ * 0.97); sheep.add(core);
  const inner = new THREE.PointLight(col('#ff8a3a'), 2.5, 4, 1.5); sheep.add(inner);
  // head: dark, long-nosed
  const faceMat = dissolve(mats.plastic('#1b1714', { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 }), 'sheep-face');
  const headG = displace(new THREE.SphereGeometry(1, 64, 48), v => {
    const n = v.clone().normalize(), t = (n.x + 1) / 2; // 0 back of skull, 1 muzzle
    const taper = 1 - 0.18 * smooth((t - 0.3) / 0.7);
    const sq = q => Math.sign(q) * Math.pow(Math.abs(q), 0.8); // a little boxy, like a real sheep's head
    const y = sq(n.y) * 0.15 * taper + 0.04 * (1 - t) * Math.max(0, n.y);
    return v3(n.x * 0.22 + 0.15, y, sq(n.z) * 0.13 * taper);
  });
  const headPivot = new THREE.Group(); headPivot.position.set(0.6, 0.2, 0); headPivot.rotation.z = -0.75; sheep.add(headPivot);
  const head = new THREE.Mesh(headG, faceMat); head.castShadow = true; headPivot.add(head);
  const earMat = dissolve(new THREE.MeshStandardMaterial({ color: col('#1e1714'), roughness: 0.7 }), 'sheep-ear');
  const eyeMat = dissolve(new THREE.MeshPhysicalMaterial({ color: col('#060505'), roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 0.35 }), 'sheep-eye');
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.038, 24, 16), eyeMat); eye.position.set(0.14, 0.07, s * 0.112); headPivot.add(eye);
    const earP = new THREE.Group(); earP.position.set(0.0, 0.08, s * 0.11); earP.rotation.set(s * 0.5, s * -0.3, 0.75); headPivot.add(earP);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), earMat); ear.scale.set(0.055, 0.02, 0.12); ear.position.z = s * 0.1; ear.castShadow = true; earP.add(ear);
  }
  // forelock: a small tuft of coils on the crown
  const tuftG = [];
  for (let i = 0; i < 10; i++) { const c = v3(0.02 + r.range(-0.05, 0.08), 0.16 + r.range(-0.02, 0.03), r.range(-0.08, 0.08)); const pts = coilLoop(c, r.dir().add(v3(0, 1.2, 0)).normalize(), r.range(0.04, 0.055), 0.013, 7, 40); tuftG.push(sweep(pts, () => 0.0065, 4, { closed: true })); pts.forEach((p, k) => { if (k % 3 === 0) woolPts.push(p.clone().applyAxisAngle(v3(0, 0, 1), -0.75).add(v3(0.6, 0.2, 0))); }); }
  headPivot.add(new THREE.Mesh(merge(tuftG), woolMat));
  // legs: hip → knee → hoof
  const legMat = faceMat, legs = [];
  for (const [lx, front] of [[0.33, true], [-0.33, false]]) for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(lx, -0.28, s * 0.2); sheep.add(hip);
    const up = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.27, 16), legMat); up.position.y = -0.135; up.castShadow = true; hip.add(up);
    const knee = new THREE.Group(); knee.position.y = -0.27; hip.add(knee);
    const lo = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.25, 16), legMat); lo.position.y = -0.125; lo.castShadow = true; knee.add(lo);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.042, 0.05, 16), mats.plastic('#0a0806', { roughness: 0.3 })); hoof.position.y = -0.26; knee.add(hoof);
    legs.push({ hip, knee, front });
  }
  sheep.traverse(o => { o.castShadow = o.isMesh && o !== wool; });
  return { sheep, uni, woolPts, legs, inner };
}
// one continuous dream-jump. phi in [0,1]
function poseSheep(sh, phi) {
  const x = lerp(-2.1, 2.1, phi), y = 0.84 + 1.05 * Math.sin(Math.PI * clamp(phi));
  sh.sheep.position.set(x, y, 0);
  const slope = 1.05 * Math.PI * Math.cos(Math.PI * phi) / 4.2;
  sh.sheep.rotation.z = Math.atan(slope) * 0.7;
  const tuck = Math.pow(Math.sin(Math.PI * clamp(phi)), 0.7);
  sh.legs.forEach(L => {
    if (L.front) { L.hip.rotation.z = 1.0 * tuck; L.knee.rotation.z = -2.0 * tuck; }
    else { L.hip.rotation.z = -0.9 * tuck; L.knee.rotation.z = 1.2 * tuck; }
  });
}
function woodTexture() {
  return canvasTexture('fence-wood', 512, 512, (g, w, h) => {
    g.fillStyle = '#6b4526'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let k = 0; k < 140; k++) {
      const y0 = r() * h, a = r.range(4, 18), f = r.range(0.004, 0.012), ph = r() * TAU;
      g.strokeStyle = r() < 0.5 ? `rgba(40,22,10,${r.range(0.15, 0.45)})` : `rgba(160,110,70,${r.range(0.1, 0.3)})`;
      g.lineWidth = r.range(0.6, 3); g.beginPath();
      for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * a; x ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    for (let k = 0; k < 3; k++) { const x = r() * w, y = r() * h; const gr = g.createRadialGradient(x, y, 1, x, y, 18); gr.addColorStop(0, 'rgba(30,15,5,0.8)'); gr.addColorStop(1, 'rgba(30,15,5,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 26, 10, 0, 0, TAU); g.fill(); }
  });
}
function dreamField(S) {
  // ground + grass + fence + moon
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: col('#0b1a18'), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; S.add(ground);
  const blade = new THREE.PlaneGeometry(0.035, 0.32, 1, 4); blade.translate(0, 0.16, 0);
  const bp = blade.attributes.position;
  for (let i = 0; i < bp.count; i++) { const hh = bp.getY(i) / 0.32; bp.setX(i, bp.getX(i) * (1 - hh * 0.9)); bp.setZ(i, 0.12 * hh * hh); }
  blade.computeVertexNormals();
  const NG = 9000, r = rng(31);
  const grass = new THREE.InstancedMesh(blade, new THREE.MeshStandardMaterial({ color: col('#ffffff'), roughness: 0.75, side: THREE.DoubleSide }), NG);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < NG; i++) {
    const rad = Math.pow(r(), 0.6) * 9, a = r() * TAU, x = Math.cos(a) * rad * 1.2, z = Math.sin(a) * rad - 1;
    if (Math.hypot(x - 1.9, z - 3.1) < 1.2) { grass.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); grass.setColorAt(i, col('#000')); continue; }
    e.set(r.range(-0.25, 0.25), r() * TAU, r.range(-0.25, 0.25)); q.setFromEuler(e);
    const s = r.range(0.6, 1.5); M.compose(v3(x, 0, z), q, v3(s, s * r.range(0.7, 1.3), s)); grass.setMatrixAt(i, M);
    grass.setColorAt(i, col('#1f4a3c').lerp(col('#2d5f6a'), r()).multiplyScalar(r.range(0.6, 1.1)));
  }
  S.add(grass);
  const wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8, bumpMap: noiseTexture('rough-fine', { scale: 40, contrast: 1.5 }), bumpScale: 1.5 });
  const fence = new THREE.Group(); S.add(fence);
  for (const z of [-2.2, -0.9, 0.9, 2.2]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.86, 0.11), wood); p.position.set(0, 0.43, z); fence.add(p); const cap = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.08, 4), wood); cap.position.set(0, 0.9, z); cap.rotation.y = Math.PI / 4; fence.add(cap); }
  for (const y of [0.34, 0.68]) for (const [z0, z1] of [[-2.35, -0.85], [-0.95, 0.95], [0.85, 2.35]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, z1 - z0), wood); b.position.set(0.07, y, (z0 + z1) / 2); b.rotation.x = (y - 0.5) * 0.04; fence.add(b); }
  fence.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 32), mats.glow('#e8f6ff', 1.6)); moon.position.set(-5, 5.5, -26); moon.scale.setScalar(0.28); S.add(moon);
  return { ground, grass, fence, moon };
}

// ============================================================== the eye (shots: eye, ending)
function irisTexture() {
  return canvasTexture('iris-gold', 1024, 1024, (g, w, h) => {
    const cx = w / 2, cy = h / 2, R = w / 2, r = rng(12);
    const bg = g.createRadialGradient(cx, cy, R * 0.2, cx, cy, R);
    bg.addColorStop(0, '#ffcf6a'); bg.addColorStop(0.35, '#e09a32'); bg.addColorStop(0.7, '#9a5a18'); bg.addColorStop(0.9, '#4a2a0c'); bg.addColorStop(1, '#120802');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    // radial fibres
    for (let k = 0; k < 2600; k++) {
      const a = r() * TAU, r0 = R * r.range(0.2, 0.4), r1 = R * r.range(0.6, 0.97), wob = r.range(-0.05, 0.05);
      const light = r() < 0.55;
      g.strokeStyle = light ? `rgba(255,${190 + r() * 50 | 0},${90 + r() * 60 | 0},${r.range(0.08, 0.3)})` : `rgba(${60 + r() * 40 | 0},${30 + r() * 20 | 0},5,${r.range(0.1, 0.35)})`;
      g.lineWidth = r.range(0.6, 2.6); g.beginPath();
      for (let s = 0; s <= 1.0001; s += 0.1) { const rr = lerp(r0, r1, s), aa = a + wob * Math.sin(s * 6 + k); const x = cx + Math.cos(aa) * rr, y = cy + Math.sin(aa) * rr; s ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
    }
    // crypts
    for (let k = 0; k < 70; k++) { const a = r() * TAU, rr = R * r.range(0.42, 0.8); g.fillStyle = `rgba(40,18,4,${r.range(0.2, 0.5)})`; g.save(); g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); g.rotate(a); g.beginPath(); g.ellipse(0, 0, r.range(8, 26), r.range(2, 6), 0, 0, TAU); g.fill(); g.restore(); }
    // collarette (zig-zag ring)
    g.strokeStyle = 'rgba(255,230,160,0.55)'; g.lineWidth = 3; g.beginPath();
    for (let k = 0; k <= 180; k++) { const a = k / 180 * TAU, rr = R * (0.43 + 0.035 * Math.sin(k * 1.7) + 0.02 * (k % 2)); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    // limbal ring
    const lim = g.createRadialGradient(cx, cy, R * 0.86, cx, cy, R);
    lim.addColorStop(0, 'rgba(10,4,0,0)'); lim.addColorStop(1, 'rgba(10,4,0,0.95)'); g.fillStyle = lim; g.fillRect(0, 0, w, h);
    // pupil (black hole) — soft edge inward
    const pr = R * 0.3, pu = g.createRadialGradient(cx, cy, pr * 0.9, cx, cy, pr * 1.12);
    pu.addColorStop(0, 'rgba(0,0,0,1)'); pu.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = pu; g.beginPath(); g.arc(cx, cy, pr * 1.12, 0, TAU); g.fill();
  });
}
const IRIS_R = 0.5, PUPIL_R = IRIS_R * 0.3;
// lid opening margins (eye-local, eyeball radius 1)
const XM = 0.97;
function marginU(x, open) { const k = Math.max(0, 1 - (x / XM) ** 2); return -0.06 + open * 0.5 * Math.pow(k, 0.8) + open * 0.06 * x * k; }
function marginL(x, open) { const k = Math.max(0, 1 - (x / XM) ** 2); return -0.06 - open * 0.4 * Math.pow(k, 1.1) + open * 0.04 * x * k; }
function skinZ(x, y, edge, open) {
  // lid over the eyeball, rounded margin; face plane around; smooth max between them
  const rl = 1.0 + 0.07 * smooth(edge / 0.08) + 0.012;
  const zl = Math.sqrt(Math.max(0, rl * rl - x * x - y * y));
  const brow = 0.38 * gauss2(x + 0.1, y - 1.2, 1.4, 0.4), cheek = 0.28 * gauss2(x - 0.3, y + 1.3, 1.5, 0.55), nose = 0.5 * gauss2(x + 1.9, y + 0.6, 0.45, 1.2);
  const zf = 0.5 + 0.36 * gauss2(x, y - 0.1, 1.25, 0.95) + brow + cheek + nose - 0.03 * x * x;
  const hh = 0.45, dd = Math.abs(zl - zf), sm = Math.max(zl, zf) + hh * 0.25 * Math.max(0, 1 - dd / hh) ** 2;
  const crease = y > 0 ? -0.05 * open * Math.exp(-(((y - marginU(x, open) - 0.28) / 0.05) ** 2)) * Math.max(0, 1 - (x / 1.1) ** 2) : 0;
  return sm + crease;
}
function makeEye({ lashes = true } = {}) {
  const grp = new THREE.Group();
  // eyeball
  const scG = new THREE.SphereGeometry(1, 96, 64, 0, TAU, Math.asin(IRIS_R) - 0.01, Math.PI - Math.asin(IRIS_R)); scG.rotateX(Math.PI / 2);
  const sclera = new THREE.Mesh(scG, new THREE.MeshPhysicalMaterial({ color: col('#f3e9df'), roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.4, sheenColor: col('#ffd7c4') }));
  grp.add(sclera);
  const lining = new THREE.Mesh(new THREE.SphereGeometry(1.03, 48, 32), new THREE.MeshStandardMaterial({ color: col('#6a2c22'), roughness: 0.5, side: THREE.BackSide })); grp.add(lining);
  const irisZ = Math.sqrt(1 - IRIS_R * IRIS_R) + 0.005;
  const irisG = new THREE.RingGeometry(0.001, IRIS_R, 160, 24);
  { const p = irisG.attributes.position; for (let i = 0; i < p.count; i++) { const rr = Math.hypot(p.getX(i), p.getY(i)) / IRIS_R; p.setZ(i, irisZ + 0.04 * (1 - rr * rr) - 0.03 * Math.exp(-(((rr - 0.3) / 0.05) ** 2))); } irisG.computeVertexNormals(); }
  const iris = new THREE.Mesh(irisG, new THREE.MeshPhysicalMaterial({ map: irisTexture(), roughness: 0.45, emissive: col('#ff9a2a'), emissiveMap: irisTexture(), emissiveIntensity: 0.12 }));
  grp.add(iris);
  // black hole pupil: photon ring + edge-on accretion disk
  const bh = new THREE.Group(); bh.position.z = irisZ + 0.045; grp.add(bh);
  const hole = new THREE.Mesh(new THREE.CircleGeometry(PUPIL_R * 0.98, 96), new THREE.MeshBasicMaterial({ color: 0x000000 })); bh.add(hole);
  const ring = new THREE.Mesh(new THREE.RingGeometry(PUPIL_R * 0.98, PUPIL_R * 1.04, 128), new THREE.MeshBasicMaterial({ color: col('#fff0c8').multiplyScalar(1.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.z = 0.001; bh.add(ring);
  const diskTex = canvasTexture('accretion', 512, 64, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,170,60,0)'); gr.addColorStop(0.3, 'rgba(255,200,110,0.9)'); gr.addColorStop(0.5, 'rgba(255,245,215,1)'); gr.addColorStop(0.7, 'rgba(255,200,110,0.9)'); gr.addColorStop(1, 'rgba(255,170,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
  const disk = new THREE.Mesh(new THREE.PlaneGeometry(PUPIL_R * 3.4, PUPIL_R * 0.16), new THREE.MeshBasicMaterial({ map: diskTex, color: col('#ffffff').multiplyScalar(1.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  disk.position.z = 0.002; bh.add(disk);
  // cornea: additive specular-only dome
  const cR = 0.62, th = Math.asin(IRIS_R / cR + 0.02);
  const cornea = new THREE.Mesh(new THREE.SphereGeometry(cR, 96, 48, 0, TAU, 0, th), new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.02, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, envMapIntensity: 0.7 }));
  cornea.rotation.x = Math.PI / 2; cornea.position.z = irisZ - cR * Math.cos(th) + 0.02; grp.add(cornea);
  // a softbox catchlight reflected in the cornea (small emissive window)
  const catchL = new THREE.Mesh(new THREE.CircleGeometry(0.045, 32), new THREE.MeshBasicMaterial({ color: col('#fff6e6').multiplyScalar(2.5), transparent: true, opacity: 0.9 }));
  { const n = v3(-0.32, 0.35, 1).normalize(); catchL.position.copy(n.clone().multiplyScalar(cR)).add(v3(0, 0, cornea.position.z)); catchL.lookAt(catchL.position.clone().add(n)); catchL.rotation.z += 0.15; }
  catchL.visible = false;
  // skin: upper + lower sheets parametrised from the lid margins outward
  const NXs = 150, NYs = 46, X0 = -3.4, X1 = 3.4, Ytop = 2.4, Ybot = -2.4;
  const mk = () => { const g = new THREE.PlaneGeometry(1, 1, NXs, NYs); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); return g; };
  const upG = mk(), loG = mk();
  const skinUni = { uFadeR: { value: 2.4 } };
  const skinMat = patch(mats.organic('#c98a66', { roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.45, sheenColor: col('#ffcfae'), bumpMap: noiseTexture('skin-pores', { scale: 90, contrast: 1.2 }), bumpScale: 0.6, side: THREE.DoubleSide }), 'eye-skin', {
    uniforms: skinUni, fHead: 'uniform float uFadeR;',
    fDiscard: 'if (length(vObj.xy * vec2(0.8, 1.15)) > uFadeR) discard;',
    fMain: 'float fr = 1.0 - smoothstep(uFadeR * 0.5, uFadeR, length(vObj.xy * vec2(0.8, 1.15)));',
    fEnd: 'gl_FragColor.rgb *= fr;',
  });
  // fade the specular too, via a dark overlay is not possible — so restrict env on outer skin
  const up = new THREE.Mesh(upG, skinMat), lo = new THREE.Mesh(loG, skinMat);
  grp.add(up, lo);
  const shapeSkin = (g, upper, open) => {
    const P = g.attributes.position, U = g.attributes.uv;
    for (let j = 0; j <= NYs; j++) for (let i = 0; i <= NXs; i++) {
      const k = j * (NXs + 1) + i, sx = i / NXs;
      const x = lerp(X0, X1, Math.sign(sx - 0.5) * Math.pow(Math.abs(sx - 0.5) * 2, 1.4) * 0.5 + 0.5);
      const m = upper ? marginU(x, open) : marginL(x, open);
      const s = Math.pow(j / NYs, 1.8); // dense rows at the margin
      const y = lerp(m, upper ? Ytop : Ybot, s);
      const edge = Math.abs(y - m);
      P.setXYZ(k, x, y, skinZ(x, y, edge, open));
      U.setXY(k, x * 0.4, y * 0.4);
    }
    P.needsUpdate = true; U.needsUpdate = true; g.computeVertexNormals();
  };
  // lashes: tapered curved strands rooted on the margins
  const lashSet = [];
  const r = rng(88);
  if (lashes) {
    for (let k = 0; k < 90; k++) { const x = lerp(-0.85, 0.93, (k + r.range(-0.3, 0.3)) / 90); lashSet.push({ up: true, x, len: 0, jit: r.range(-0.15, 0.15), cur: r.range(0.7, 1.2), off: r.range(0, 0.02) }); }
    for (let k = 0; k < 34; k++) { const x = lerp(-0.6, 0.85, (k + r()) / 34); lashSet.push({ up: false, x, len: 0, jit: r.range(-0.2, 0.2), cur: r.range(0.8, 1.2), off: r.range(0, 0.012) }); }
    lashSet.forEach(L => { const kk = Math.max(0, 1 - (L.x / XM) ** 2); L.len = (L.up ? 0.27 : 0.1) * (0.3 + 0.7 * Math.pow(kk, 0.6)) * (1 + 0.25 * L.x) * r.range(0.7, 1.1); });
  }
  const LSEG = 7, LRAD = 3, lashG = new THREE.BufferGeometry();
  const lv = lashSet.length * (LSEG + 1) * (LRAD + 1), lP = new Float32Array(lv * 3), lI = [];
  for (let L = 0; L < lashSet.length; L++) for (let i = 0; i < LSEG; i++) for (let j = 0; j < LRAD; j++) { const b = L * (LSEG + 1) * (LRAD + 1), a0 = b + i * (LRAD + 1) + j, a1 = a0 + LRAD + 1; lI.push(a0, a1, a0 + 1, a1, a1 + 1, a0 + 1); }
  lashG.setAttribute('position', new THREE.BufferAttribute(lP, 3)); lashG.setIndex(lI);
  const lashMesh = new THREE.Mesh(lashG, new THREE.MeshStandardMaterial({ color: col('#140a05'), roughness: 0.35, metalness: 0.2 }));
  if (lashes) grp.add(lashMesh);
  const shapeLashes = open => {
    let o = 0;
    lashSet.forEach(L => {
      const m = L.up ? marginU(L.x, open) : marginL(L.x, open), sg = L.up ? 1 : -1;
      const root = v3(L.x, m + sg * (0.012 + L.off), 0); root.z = skinZ(root.x, root.y, 0.02, open) + 0.005;
      // direction: forward and up (upper) / down (lower), curling outward; lowered when closed
      const lift = L.up ? lerp(-0.9, 0.1, open) : lerp(-0.2, -0.5, open);
      const pts = [];
      for (let i = 0; i <= LSEG; i++) {
        const s = i / LSEG, a = lift + sg * 0.95 * s * s * L.cur;
        const fwd = Math.cos(a), vy = Math.sin(a);
        pts.push(root.clone().add(v3((L.x * 0.45 + L.jit * 0.5) * s * L.len, vy * L.len * s, fwd * L.len * s)));
      }
      for (let i = 0; i <= LSEG; i++) {
        const p = pts[i], t = pts[Math.min(LSEG, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
        const n1 = v3(1, 0, 0).cross(t).normalize(), n2 = t.clone().cross(n1);
        const rad = 0.0075 * (1 - i / LSEG) + 0.0006;
        for (let j = 0; j <= LRAD; j++) { const a = j / LRAD * TAU; lP[o++] = p.x + (n1.x * Math.cos(a) + n2.x * Math.sin(a)) * rad; lP[o++] = p.y + (n1.y * Math.cos(a) + n2.y * Math.sin(a)) * rad; lP[o++] = p.z + (n1.z * Math.cos(a) + n2.z * Math.sin(a)) * rad; }
      }
    });
    lashG.attributes.position.needsUpdate = true; lashG.computeVertexNormals();
  };
  const set = open => { cornea.visible = open > 0.3; shapeSkin(upG, true, open); shapeSkin(loG, false, open); if (lashes) shapeLashes(open); };
  set(0);
  return { grp, set, bh, ring, disk, iris, sclera, cornea, skinUni, catchL };
}

// Necker cube: 12 thin gold tubes; emphasis swaps between the two square faces
function neckerCube() {
  const grp = new THREE.Group(), s = 0.5;
  const c = [];
  for (let i = 0; i < 8; i++) c.push(v3(i & 1 ? s : -s, i & 2 ? s : -s, i & 4 ? s : -s));
  const edges = [];
  for (let i = 0; i < 8; i++) for (let b = 0; b < 3; b++) { const j = i | (1 << b); if (j !== i) edges.push([i, j, b === 2 ? 'link' : (i & 4 ? 'B' : 'A')]); }
  const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const items = edges.map(([i, j, kind]) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col('#ffcf70'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    const a = c[i], b = c[j]; m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize());
    m.userData = { kind, len: a.distanceTo(b) }; grp.add(m); return m;
  });
  const dots = new Dust(8, { size: 0.05, color: '#ffe2a0', intensity: 2.5 }); c.forEach((p, i) => dots.setV(i, p)); dots.dirty(true); grp.add(dots);
  // f = 0 → face A reads as front, 1 → face B; w = line radius
  const set = (f, alpha, w = 0.006) => items.forEach(m => {
    const k = m.userData.kind, front = k === 'A' ? 1 - f : k === 'B' ? f : 0.55;
    const rad = w * lerp(0.55, 1.5, front);
    m.scale.set(rad, m.userData.len, rad);
    m.material.color.copy(col('#ffcf70')).multiplyScalar(lerp(0.5, 3.2, front) * alpha);
  });
  return { grp, set, dots };
}

// ============================================================== ouroboros
function scaleTexture() {
  return canvasTexture('snake-scales', 512, 512, (g, w, h) => {
    g.fillStyle = '#3a2408'; g.fillRect(0, 0, w, h);
    const rows = 8, cols = 8, sw = w / cols, shh = h / rows;
    for (let rr = rows + 1; rr >= -1; rr--) for (let cc = -1; cc <= cols; cc++) {
      const x = (cc + (rr % 2) * 0.5) * sw, y = rr * shh;
      const gr = g.createRadialGradient(x - sw * 0.1, y - shh * 0.3, 2, x, y, sw * 0.62);
      gr.addColorStop(0, '#fff2c8'); gr.addColorStop(0.55, '#d8a040'); gr.addColorStop(0.9, '#6a400e'); gr.addColorStop(1, '#2a1804');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, sw * 0.58, shh * 0.78, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(30,16,2,0.8)'; g.lineWidth = 2.5; g.stroke();
    }
  });
}
function snakeHead(mat, eyeMat) {
  // local frame: +x forward, +y up (dorsal), +z side
  const grp = new THREE.Group();
  const upper = displace(new THREE.SphereGeometry(1, 72, 48), v => {
    const n = v.clone().normalize(), f = (n.x + 1) / 2;
    const w = 0.2 * (1 - 0.5 * smooth(f)) * (1 + 0.15 * Math.exp(-(((f - 0.3) / 0.2) ** 2)));
    const hh = 0.11 * (1 - 0.35 * smooth(f));
    let y = n.y > 0 ? n.y * hh : n.y * hh * 0.25;
    y += 0.025 * Math.exp(-(((f - 0.62) / 0.08) ** 2)) * Math.max(0, Math.abs(n.z) - 0.4) * 2; // brow over the eyes
    return v3(n.x * 0.33 + 0.28, y, n.z * w);
  });
  const lower = displace(new THREE.SphereGeometry(1, 48, 32), v => {
    const n = v.clone().normalize(), f = (n.x + 1) / 2;
    const w = 0.17 * (1 - 0.45 * smooth(f));
    return v3(n.x * 0.3 + 0.3, (n.y > 0 ? n.y * 0.015 : n.y * 0.055) , n.z * w);
  });
  const up = new THREE.Mesh(upper, mat); grp.add(up);
  const jawP = new THREE.Group(); jawP.position.set(0.0, -0.02, 0); grp.add(jawP);
  const jaw = new THREE.Mesh(lower, mat); jawP.add(jaw);
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshStandardMaterial({ color: col('#2a0a04'), roughness: 0.6 }));
  mouth.scale.set(0.26, 0.03, 0.13); mouth.position.set(0.32, -0.03, 0); grp.add(mouth);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.042, 32, 24), eyeMat); e.position.set(0.4, 0.05, s * 0.135); grp.add(e);
    const slit = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0x000000 })); slit.scale.set(0.008, 0.03, 0.01); slit.position.set(0.41, 0.05, s * 0.176); grp.add(slit);
  }
  return { grp, jawP };
}

// ============================================================== shots
export const shots = {
  // ── 48–50: a gold ball descends a real loss surface by momentum SGD ──
  loss() {
    const S = new THREE.Scene(), C = camera(34);
    backdrop(S, 'data', { stars: 500, seed: 21 });
    S.fog = new THREE.Fog(col('#03141a'), 6, 17);
    const L = rig(S, 'data', { key: v3(-3, 8, 4), keyI: 1.1, rimI: 1.4, fillI: 0.3, shadow: false });
    S.environmentIntensity = 0.35;
    const land = lossLandscape(S);
    const path = sgdPath(125), N = path.length - 1;
    const curve = new THREE.CatmullRomCurve3(path.map(([x, y]) => lossWorld(x, y)), false, 'centripetal');
    const TR = 700, tpts = [];
    for (let i = 0; i <= TR; i++) { const p = curve.getPoint(i / TR); tpts.push(lossWorld(p.x, p.z, 0.035)); }
    const trailG = sweep(tpts, () => 0.014, 6);
    const trail = new THREE.Mesh(trailG, mats.glow('#ffc060', 2.0)); S.add(trail);
    const B = goldBall(0.13); S.add(B.grp);
    const ballAt = u => { const p = curve.getPoint(clamp(u)); return lossWorld(p.x, p.z, 0.13); };
    // time → step index (u maps linearly onto SGD iterations: speed is the optimizer's own)
    const stepU = u => clamp(lerp(0.0, 1.0, u) * 1.0);
    return {
      scene: S, cam: C,
      update(u, t) {
        const su = stepU(u), bp = ballAt(su);
        B.grp.position.copy(bp);
        B.ball.rotation.set(su * 40, 0, su * 25);
        trailG.setDrawRange(0, Math.floor(su * TR) * 6 * 6);
        // camera: low, close, following the ravine direction (smoothed)
        let sx = 0, sz = 0, nW = 7;
        for (let k = 0; k < nW; k++) { const q = ballAt(clamp(su - 0.12 + k * 0.03)); sx += q.x; sz += q.z; }
        sx /= nW; sz /= nW;
        const dir = v3(1, 0, 0.55 * 0.75 * Math.cos(0.75 * sx + 0.3)).normalize(), side = v3(-dir.z, 0, dir.x);
        const ground = lossF(sx, sz) * HS;
        const camP = v3(sx, 0, sz).add(dir.clone().multiplyScalar(-2.9)).add(side.clone().multiplyScalar(-1.3));
        camP.y = Math.max(ground, lossF(camP.x, camP.z) * HS) + 1.25;
        const tgt = v3(sx, 0, sz).add(dir.clone().multiplyScalar(2.2)); tgt.y = ground + 0.05;
        look(C, camP.add(drift(t, 0.02, 4)), tgt);
        return { bloom: 0.55, exposure: 1.05, threshold: 0.85 };
      },
    };
  },

  // ── 50–51: a deep network whose shape is the cosmic web ──
  network() {
    const S = new THREE.Scene(), C = camera(30);
    backdrop(S, 'data', { stars: 700, seed: 23 });
    S.fog = new THREE.Fog(col('#020a10'), 9, 24);
    rig(S, 'data', { key: v3(-4, 7, 8), keyI: 1.8, rimI: 3, fillI: 0.4, shadow: false });
    const r = rng(51), NL = 9, K = 5;
    const strands = Array.from({ length: K }, () => ({ y0: r.range(-1.9, 1.9), z0: r.range(-1.8, 1.8), fy: r.range(0.25, 0.7), fz: r.range(0.25, 0.7), ph: r() * TAU, amp: r.range(0.5, 1.1), w: r.range(0.6, 1.4) }));
    const centre = (k, i) => { const s = strands[k]; return v3(0, s.y0 + s.amp * Math.sin(i * s.fy + s.ph), s.z0 + s.amp * Math.cos(i * s.fz + s.ph * 1.3)); };
    const layers = [];
    for (let i = 0; i < NL; i++) {
      const x = (i - (NL - 1) / 2) * 1.45, n = 26 + Math.round(10 * Math.sin(i * 1.3) ** 2), nodes = [];
      const knot = r.int(0, K - 1); // one dense knot per layer
      for (let j = 0; j < n; j++) {
        const k = j < 6 ? knot : r.int(0, K - 1), c = centre(k, i), sig = j < 6 ? 0.12 : 0.3;
        nodes.push({ p: v3(x + r.gauss() * 0.08, c.y + r.gauss() * sig, c.z + r.gauss() * sig), size: j < 6 ? r.range(0.1, 0.14) : r.range(0.055, 0.1), gain: r.range(0.5, 1) });
      }
      layers.push(nodes);
    }
    const all = layers.flat(); all.forEach((nd, i) => { nd.id = i; });
    layers.forEach((nodes, i) => nodes.forEach(nd => { nd.layer = i; }));
    // connections: each node to its nearest neighbours in the next layer, plus rare long bridges
    const edges = [];
    for (let i = 0; i < NL - 1; i++) for (const a of layers[i]) {
      const near = layers[i + 1].map(b => [b, a.p.distanceTo(b.p)]).sort((x, y) => x[1] - y[1]);
      for (let k = 0; k < 3; k++) edges.push({ a, b: near[k][0], w: clamp(r.gauss() * 0.55 + (k === 0 ? 0.4 : 0), -1, 1), layer: i });
      if (r() < 0.12) edges.push({ a, b: near[r.int(5, near.length - 1)][0], w: r.range(-0.3, 0.3), layer: i });
    }
    // edges as instanced cylinders (HDR colour by sign and magnitude)
    const eg = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
    const em = new THREE.InstancedMesh(eg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }), edges.length);
    const M = new THREE.Matrix4(), q = new THREE.Quaternion(), cyan = col('#3fd8ff'), amber = col('#ffae3a');
    edges.forEach((e, i) => {
      const d = e.b.p.clone().sub(e.a.p), len = d.length(), rad = 0.0035 + 0.016 * Math.pow(Math.abs(e.w), 1.6);
      q.setFromUnitVectors(v3(0, 1, 0), d.normalize()); M.compose(e.a.p.clone().add(e.b.p).multiplyScalar(0.5), q, v3(rad, len, rad)); em.setMatrixAt(i, M);
      e.base = (e.w > 0 ? cyan : amber).clone().multiplyScalar(0.08 + 0.75 * e.w * e.w);
      em.setColorAt(i, e.base);
    });
    S.add(em);
    // nodes: glossy glass shells over glowing cores
    const sg = new THREE.SphereGeometry(1, 24, 16);
    const shell = new THREE.InstancedMesh(sg, new THREE.MeshPhysicalMaterial({ color: col('#0e2a33'), roughness: 0.08, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.45 }), all.length);
    const coreM = new THREE.InstancedMesh(sg, new THREE.MeshBasicMaterial({ color: 0xffffff }), all.length);
    all.forEach((nd, i) => { M.compose(nd.p, q.identity(), v3(nd.size, nd.size, nd.size)); shell.setMatrixAt(i, M); M.compose(nd.p, q.identity(), v3(nd.size * 0.62, nd.size * 0.62, nd.size * 0.62)); coreM.setMatrixAt(i, M); coreM.setColorAt(i, col('#000000')); });
    S.add(coreM, shell);
    const halo = new Dust(all.length, { size: 0.5, color: '#7fe8ff' }); all.forEach((nd, i) => { halo.setV(i, nd.p); halo.size[i] = nd.size * 2.5; }); halo.dirty(true); S.add(halo);
    const strong = edges.filter(e => Math.abs(e.w) > 0.35);
    const pulses = new Dust(strong.length, { size: 0.06 }); strong.forEach((e, i) => pulses.color(i, e.w > 0 ? col('#bff6ff') : col('#ffd08a'), 3)); pulses.dirty(true); S.add(pulses);
    const act = (layer, wf) => { const d = wf - layer; return d < 0 ? Math.exp(-d * d / 0.15) : 0.3 + 0.7 * Math.exp(-d * d / 0.6); };
    return {
      scene: S, cam: C,
      update(u, t) {
        const wf = lerp(-0.6, NL - 0.2, u);
        all.forEach((nd, i) => { const a = act(nd.layer, wf) * nd.gain; coreM.setColorAt(i, col('#0b2f3a').lerp(col('#9ff4ff'), a).multiplyScalar(0.4 + 2.6 * a)); halo.alpha[i] = 0.25 * a; });
        coreM.instanceColor.needsUpdate = true; halo.dirty();
        edges.forEach((e, i) => { const d = wf - e.layer, on = d > 0 && d < 1.3 ? Math.sin(Math.PI * clamp(d / 1.3)) : 0; em.setColorAt(i, e.base.clone().multiplyScalar(1 + 1.3 * on)); });
        em.instanceColor.needsUpdate = true;
        strong.forEach((e, i) => { const d = clamp(wf - e.layer); pulses.setV(i, e.a.p.clone().lerp(e.b.p, d)); pulses.alpha[i] = d > 0 && d < 1 ? Math.abs(e.w) : 0; });
        pulses.dirty();
        const camP = v3(lerp(-2.6, -1.6, u), lerp(1.3, 1.0, u), lerp(9.6, 9.0, u)).add(drift(t, 0.03, 7));
        look(C, camP, v3(lerp(0.0, 0.5, u), 0, 0));
        return { bloom: 0.6, threshold: 0.85, exposure: 1.0 };
      },
    };
  },

  // ── 51–52: a sleeping android head on its side, REM flicker under the lids ──
  android() {
    const S = new THREE.Scene(), C = camera(30);
    backdrop(S, 'data', { stars: 0 });
    S.fog = new THREE.Fog(col('#02080c'), 8, 20);
    const L = rig(S, 'data', { key: v3(3.5, 4.5, 4), keyI: 1.8, rimI: 2.0, fillI: 0.2, target: v3(0, -0.2, 0) });
    S.environmentIntensity = 0.45;
    L.key.shadow.camera.left = L.key.shadow.camera.bottom = -3; L.key.shadow.camera.right = L.key.shadow.camera.top = 3; L.key.shadow.radius = 8;
    const A = androidHead();
    const holder = new THREE.Group(); holder.add(A.grp); S.add(holder);
    A.grp.rotation.z = Math.PI / 2 - 0.08; // lying on its left cheek, top of the head to frame-left
    A.grp.rotation.y = -0.45;
    A.grp.position.y = 0;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: col('#0a1a20'), roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.74; floor.receiveShadow = true; S.add(floor);
    const dreamL = new THREE.PointLight(col('#5fe0ff'), 0, 2.5, 2); S.add(dreamL);
    const motes = new Dust(36, { size: 0.012, color: '#8feaff', intensity: 2 }); S.add(motes);
    const r = rng(61), md = Array.from({ length: 36 }, () => ({ p: v3(r.range(-0.6, 0.4), r.range(-0.1, 0.5), r.range(0.4, 0.9)), ph: r() }));
    const P = A.g.attributes.position;
    // eye-centre position in world for the dream light
    const eyeW = v3(0, 0.03, 0.82);
    return {
      scene: S, cam: C,
      update(u, t) {
        // REM: quick saccades of the eyeballs under the closed lids
        const sac = k => 0.035 * Math.tanh(4 * Math.sin(t * 23 + k * 1.7) + 2 * Math.sin(t * 37 + k));
        const dx = [sac(0), sac(0)];
        for (const [i, X, Y, Z, w] of A.eyeV) P.setZ(i, Z + faceField(X, Y, dx) * w);
        P.needsUpdate = true; A.g.computeVertexNormals();
        const flick = 0.5 + 0.5 * Math.sin(t * 61) * Math.sin(t * 23 + 1);
        A.uni.uRem.value = 0.4 + 1.0 * flick;
        A.grp.updateMatrixWorld(); dreamL.position.copy(eyeW).applyMatrix4(A.grp.matrixWorld); dreamL.intensity = 0.06 + 0.1 * flick;
        md.forEach((m, i) => { const ph = (t * 0.3 + m.ph) % 1; motes.set(i, m.p.x + ph * 0.3, m.p.y + ph * 0.5, m.p.z); motes.alpha[i] = 0.5 * Math.sin(Math.PI * ph); });
        motes.dirty();
        const camP = v3(lerp(0.45, 0.3, u), lerp(0.5, 0.45, u), lerp(4.2, 3.85, u)).add(drift(t, 0.006, 3));
        look(C, camP, v3(0.05, -0.08, 0.25));
        return { bloom: 0.5, threshold: 0.9, exposure: 1.0 };
      },
    };
  },

  // ── 52–55: an electric sheep jumps a fence in a night dream field; four cuts, the last dissolves ──
  sheep(p) {
    const S = new THREE.Scene(), C = camera(p.n === 2 ? 30 : 34);
    backdrop(S, 'data', { stars: 1600, seed: 41 });
    S.fog = new THREE.Fog(col('#03121a'), 7, 30);
    const L = rig(S, 'data', { key: v3(-6, 9, -5), keyI: 1.0, rimI: 2.2, fillI: 0.35, target: v3(0, 0.5, 0) });
    L.key.color.set('#9fd8ff');
    L.key.shadow.camera.left = L.key.shadow.camera.bottom = -4; L.key.shadow.camera.right = L.key.shadow.camera.top = 4;
    const F = dreamField(S);
    const sh = makeSheep(); S.add(sh.sheep);
    const seed = seedPoint(1); seed.opacity(0); S.add(seed);
    const n = p.n || 0;
    const phiR = [[0.04, 0.27], [0.3, 0.42], [0.44, 0.5], [0.5, 0.53]][n];
    // dissolve particles
    let parts = null, G = null;
    if (p.dissolve) {
      const pts = sh.woolPts.filter((_, i) => i % 2 === 0);
      parts = new Dust(pts.length, { size: 0.016 });
      const r = rng(9);
      parts.meta = pts.map((pp, i) => { parts.color(i, r() < 0.7 ? col('#ffb060') : col('#ffe6b0'), r.range(1.5, 3)); return { p: pp, q: sheepQ(pp), s: r() < 0.5 ? 1 : -1, sp: r.range(0.8, 1.3) }; });
      parts.dirty(true); S.add(parts);
      poseSheep(sh, phiR[0]); sh.sheep.updateMatrixWorld(); G = v3(0, 0, 0).applyMatrix4(sh.sheep.matrixWorld);
    }
    return {
      scene: S, cam: C,
      update(u, t) {
        const phi = lerp(phiR[0], phiR[1], n === 3 ? easeOut(u) : u);
        poseSheep(sh, phi); sh.sheep.updateMatrixWorld();
        sh.uni.uInv.value.copy(sh.sheep.matrixWorld).invert();
        const sp = sh.sheep.position;
        let exposure = 1.0;
        if (n === 0) look(C, v3(lerp(-1.5, -1.1, u), 0.85, 5.2), v3(lerp(-1.1, -0.7, u), 1.05, 0));
        if (n === 1) look(C, v3(1.9, 0.55, 3.1), sp.clone().add(v3(0.1, -0.15, 0)));
        if (n === 2) look(C, sp.clone().add(v3(1.9, 0.0, 1.7)), sp.clone().add(v3(0.35, 0.0, 0)));
        if (n === 3) {
          const D = lerp(-0.1, 1.65, smooth(range(u, 0.08, 0.75)));
          sh.uni.uD.value = D;
          sh.inner.intensity = 2.5 * (1 - range(u, 0.4, 0.75));
          parts.meta.forEach((m, i) => {
            const a = clamp((D - m.q) / (0.45 * m.sp));
            const w = m.p.clone().applyMatrix4(sh.sheep.matrixWorld);
            if (a <= 0) { parts.alpha[i] = 0; return; }
            const e = easeInOut(a), o = w.sub(G), ang = e * 2.4 * m.s;
            const c = Math.cos(ang), s = Math.sin(ang);
            const ox = o.x * c - o.z * s, oz = o.x * s + o.z * c, k = Math.pow(1 - e, 1.4);
            parts.set(i, G.x + ox * k, G.y + o.y * k + Math.sin(Math.PI * e) * 0.35, G.z + oz * k);
            parts.alpha[i] = (1 - Math.pow(a, 6)) * 0.9;
          });
          parts.dirty();
          seed.position.copy(G); seed.opacity(smooth(range(u, 0.25, 0.7)));
          const z = smooth(range(u, 0.45, 1));
          const camP = v3(lerp(0.4, G.x, z), lerp(1.2, G.y + 0.2, z), lerp(6.2, G.z + 9.5, z));
          look(C, camP.add(drift(t, 0.01, 5)), v3(lerp(0, G.x, z), lerp(1.25, G.y, z), lerp(0, G.z, z)));
          F.ground.material.color.set('#0b1a18').multiplyScalar(1 - 0.85 * z); F.grass.visible = z < 0.98;
          exposure = lerp(1.0, 0.75, z);
          L.key.intensity = 1.0 * (1 - z); L.rim.intensity = 2.2 * (1 - z); L.fill.intensity = 0.35 * (1 - z);
          F.fence.visible = z < 0.95;
        }
        return { bloom: 0.65, threshold: 0.85, exposure };
      },
    };
  },

  // ── 55–56: top-down; the gold point spirals into the minimum and the landscape folds into it ──
  converge() {
    const S = new THREE.Scene(), C = camera(36);
    backdrop(S, 'data', { stars: 0 });
    S.fog = null;
    rig(S, 'data', { key: v3(-3, 9, 2), keyI: 1.6, rimI: 1.8, fillI: 0.5, shadow: false });
    const land = lossLandscape(S, { res: 0.8 });
    const m = lossWorld(LB, lc(LB));
    const seed = seedPoint(1.6); S.add(seed);
    C.up.set(0, 0, -1);
    return {
      scene: S, cam: C,
      update(u, t) {
        const sp = easeInOut(range(u, 0, 0.26)), rad = 2.2 * (1 - sp), an = sp * 7 + 0.5;
        const x = m.x + Math.cos(an) * rad, z = m.z + Math.sin(an) * rad;
        seed.position.copy(lossWorld(x, z, 0.08));
        const f = easeInOut(range(u, 0.1, 0.42));
        land.uni.uFold.value = f; land.uni.uGlow.value = 0.25 * f;
        land.mesh.visible = f < 0.995;
        look(C, v3(m.x, m.y + lerp(7.5, 6.0, u), m.z + 0.001), m);
        return { bloom: 0.6, exposure: lerp(1, 0.7, f) };
      },
    };
  },

  // ── 56–58: a Necker cube flips twice; then a human eye opens; the pupil is a black hole ──
  eye() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'awake', { stars: 0 });
    S.fog = null;
    const L = rig(S, 'awake', { key: v3(-3, 5, 7), keyI: 2.4, rimI: 2.0, fillI: 0.4, shadow: false });
    const E = makeEye(); S.add(E.grp);
    const cube = neckerCube(); cube.grp.rotation.set(0.62, 0.78, 0); S.add(cube.grp); cube.grp.position.z = 2.2;
    const seed = seedPoint(1.0); seed.position.z = 2.2; S.add(seed);
    const spec = new THREE.PointLight(col('#fff0d0'), 0, 12, 1.5); spec.position.set(-1.6, 1.8, 4.5); S.add(spec);
    return {
      scene: S, cam: C,
      update(u, t) {
        // cube: grow from the point, flip at 0.2 and 0.38, then shrink into the pupil
        const grow = easeOut(range(u, 0.02, 0.12)), shrink = easeIn(range(u, 0.44, 0.56));
        const flip = smooth(range(u, 0.18, 0.22)) - smooth(range(u, 0.36, 0.4));
        cube.grp.scale.setScalar(Math.max(1e-3, grow * (1 - shrink) * 1.2 + 0.001));
        cube.grp.rotation.y = 0.78 + 0.15 * u;
        cube.set(flip, 1 - shrink * 0.6, 0.007);
        cube.grp.visible = shrink < 0.999;
        seed.opacity(1 - grow * 0.85 + shrink * 0.8); seed.scale.setScalar(1);
        // eye opens
        const lit = smooth(range(u, 0.38, 0.6)), open = easeInOut(range(u, 0.48, 0.86));
        E.set(open);
        L.key.intensity = 2.4 * lit; L.rim.intensity = 2.0 * lit; L.fill.intensity = 0.4 * lit; spec.intensity = 6 * lit;
        S.environmentIntensity = PALETTES.awake.env * lit;
        E.ring.material.color.copy(col('#fff0c8')).multiplyScalar(1.5 * smooth(range(u, 0.6, 0.85)));
        E.disk.material.color.copy(col('#ffffff')).multiplyScalar(1.3 * smooth(range(u, 0.65, 0.9)));
        E.catchL.material.opacity = 0.9 * lit;
        seed.visible = u < 0.62;
        // camera pushes in
        const push = easeInOut(range(u, 0.4, 1));
        const camP = v3(lerp(0.0, 0.05, push), lerp(0.1, 0.06, push), lerp(6.2, 2.7, push)).add(drift(t, 0.01, 9));
        look(C, camP, v3(0, lerp(0.0, 0.03, push), 0));
        return { bloom: 0.5, threshold: 0.9, exposure: lerp(1.0, 1.05, lit) };
      },
    };
  },

  // ── 58–60: pull back; a golden ouroboros closes around the eye; all collapses to the seed ──
  ending() {
    const S = new THREE.Scene(), C = camera(32);
    backdrop(S, 'egg', { stars: 600 }); // the egg's own sky, so the loop closes on the same stars
    S.fog = null;
    const L = rig(S, 'awake', { key: v3(-3, 5, 7), keyI: 2.4, rimI: 2.4, fillI: 0.4, shadow: false });
    const world = new THREE.Group(); S.add(world);
    const E = makeEye(); E.set(1); world.add(E.grp);
    const spec = new THREE.PointLight(col('#fff0d0'), 6, 12, 1.5); spec.position.set(-1.6, 1.8, 4.5); S.add(spec);
    // serpent
    const R = 2.0, scaleMap = scaleTexture();
    E.skinUni.uFadeR.value = 1.7;
    const snakeMat = new THREE.MeshPhysicalMaterial({ color: col('#ffd27a'), map: scaleMap, metalness: 1, roughness: 0.3, bumpMap: scaleMap, bumpScale: 3, clearcoat: 0.4, clearcoatRoughness: 0.25 });
    const eyeMat = new THREE.MeshPhysicalMaterial({ color: col('#ff9a1a'), emissive: col('#ff8a10'), emissiveIntensity: 0.8, roughness: 0.05, clearcoat: 1 });
    const NB = 260, RAD = 18;
    let bodyG = null; const body = new THREE.Mesh(new THREE.BufferGeometry(), snakeMat); world.add(body);
    const H = snakeHead(snakeMat, eyeMat); world.add(H.grp);
    // path traced by the head: spiral in from outside, then the ring (theta measured clockwise from the top)
    const TH_END = TAU * 1.0, ringPt = (th, k) => { const rr = R + k; return v3(Math.sin(th) * rr, Math.cos(th) * rr, 0.75); };
    const pathAt = th => { const out = Math.max(0, (TH_END - TAU) - th); return ringPt(th, out * 0.55 + 0.0); };
    const BODY = TAU * 0.965;
    const seed = seedPoint(); seed.opacity(0); S.add(seed);
    const tmpUp = v3();
    return {
      scene: S, cam: C,
      update(u, t) {
        // head travels to bite at u≈0.55; body follows its own path
        const bite = easeOut(range(u, 0.05, 0.55));
        const thH = lerp(TH_END - TAU * 0.55, TH_END, bite) + 0.04;
        const und = 0.07 * (1 - bite);
        const pts = [];
        for (let i = 0; i <= NB; i++) {
          const s = i / NB, th = thH - BODY * (1 - s) - 0.0;
          const p = pathAt(th), outw = p.clone().setZ(0).normalize();
          p.add(outw.multiplyScalar(Math.sin(th * 5 - t * 6) * und * s));
          pts.push(p);
        }
        if (bodyG) bodyG.dispose();
        bodyG = sweep(pts, s => 0.21 * Math.pow(clamp(s / 0.45), 0.6) * (1 - 0.2 * smooth(range(s, 0.92, 1))) + 0.005, RAD, { up: i => tmpUp.copy(pts[i]).setZ(0).normalize(), uvLen: 1.1 });
        body.geometry = bodyG;
        // head at the front of the body, facing along the path
        const hp = pts[NB], ht = pts[NB].clone().sub(pts[NB - 3]).normalize(), hu = hp.clone().setZ(0).normalize();
        hu.sub(ht.clone().multiplyScalar(hu.dot(ht))).normalize();
        const hs = ht.clone().cross(hu);
        H.grp.position.copy(hp).sub(ht.clone().multiplyScalar(0.12));
        H.grp.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ht, hu, hs));
        H.grp.scale.setScalar(1.45);
        H.jawP.rotation.z = -0.45 * (1 - smooth(range(u, 0.5, 0.6))) - 0.15;
        // reveal: the serpent fades in from the dark as it arrives
        const vis = smooth(range(u, 0.02, 0.2));
        body.visible = H.grp.visible = vis > 0.01;
        snakeMat.opacity = 1;
        // pull back from the eye (scale the world down; the camera stays at the seed's framing)
        const pull = easeInOut(range(u, 0.0, 0.5));
        const coll = easeIn(range(u, 0.62, 0.86));
        const sc = lerp(3.2, 1.0, pull) * (1 - coll) + 1e-4;
        world.scale.setScalar(sc);
        world.rotation.z = -coll * 2.5;
        world.visible = coll < 0.995;
        E.grp.position.z = 0;
        seed.opacity(smooth(range(u, 0.66, 0.85)) * lerp(1, 0.75, range(u, 0.92, 1)));
        L.key.intensity = 2.4 * (1 - coll); L.rim.intensity = 2.4 * (1 - coll); spec.intensity = 6 * (1 - coll);
        const camP = orbit(9.5, -0.25, 0.08).add(drift(0, 0.02));
        const camP0 = v3(0, 0.05, 9.5);
        const k = smooth(range(u, 0.6, 0.9));
        look(C, camP0.lerp(camP, k), v3(0, 0, 0));
        return { bloom: lerp(0.55, 0.45, k), threshold: 0.9, exposure: lerp(1.0, 0.85, k) };
      },
    };
  },
};

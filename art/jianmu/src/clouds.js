// 御剑 YUJIAN — clouds: a GL-baked atlas of cumulus/mist sprites (R = density, G = light), depth-sorted instanced billboards,
// and a fbm cloud-sea plane. Sprites are coloured at draw time from ENV/CLOUD uniforms so every shot can re-light them.
import * as THREE from 'three';
import { GLSL_NOISE, GLSL_ATMO, mulberry32 } from './util.js';
import { ENV } from './materials.js';

const C = h => new THREE.Color(h);
export const CLOUD = {
  uLit: { value: C(0xfbf8ee) }, uShade: { value: C(0xb7c9cc) }, uCloudRim: { value: C(0xfff0c8) },
  uCloudDark: { value: 0 },  // storm: 0..1 darkens and cools the clouds
};
const COLS = 4, ROWS = 4;   // 16 cells: 0-7 cumulus, 8-11 long mist bands, 12-15 wisps

const BAKE_FS = /* glsl */`
uniform float uCell; varying vec2 vUv;
${GLSL_NOISE}
float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
// cumulus heightfield: max of sphere caps along a flat base, eroded by fbm
float cumH(vec2 uv, float seed){
  vec2 p = vec2(uv.x * 2.0, uv.y);
  float baseY = 0.22; float h = 0.0;
  for (int i = 0; i < 11; i++){
    float fi = float(i);
    float cx = 0.18 + 1.64 * h1(seed + fi * 3.7);
    float bell = 1.0 - pow((cx - 1.0) / 0.85, 2.0);
    float r = (0.07 + 0.17 * h1(seed + fi * 5.3)) * (0.45 + 0.75 * max(bell, 0.0));
    float cy = baseY + r * (0.35 + 0.5 * h1(seed + fi * 9.1)) * (0.6 + 0.6 * bell);
    vec2 d = p - vec2(cx, cy);
    h = max(h, sqrt(max(r * r - dot(d, d), 0.0)));
  }
  h -= (fbm2(p * 7.0 + seed, 4) - 0.5) * 0.08 + (fbm2(p * 16.0 + seed * 2.0, 3) - 0.5) * 0.02;
  h *= smoothstep(baseY - 0.035, baseY + 0.05, uv.y);
  return h;
}
float bandD(vec2 uv, float seed){
  vec2 c = (uv - 0.5) * vec2(1.0, 2.0);
  float e = 1.0 - smoothstep(0.25, 1.0, length(c * vec2(2.1, 2.4)) + (fbm2(uv * vec2(3.0, 6.0) + seed, 4) - 0.5) * 0.6);
  return e * (0.75 + 0.35 * fbm2(uv * vec2(4.0, 10.0) + seed * 2.0, 3));
}
float wispD(vec2 uv, float seed){
  vec2 c = (uv - 0.5) * vec2(1.0, 2.0);
  float e = 1.0 - smoothstep(0.2, 1.0, length(c * vec2(2.0, 3.2)));
  float st = fbm2(vec2(uv.x * 3.0, uv.y * 18.0) + vec2(seed, 0.0) + vec2(fbm2(uv * 4.0 + seed, 3) * 1.2, 0.0), 5);
  return e * smoothstep(0.35, 0.75, st) * 1.3;
}
void main(){
  float cell = uCell; float seed = cell * 7.13 + 1.7;
  float a, light, thick;
  if (cell < 7.5) {
    float e = 0.003;
    float h = cumH(vUv, seed), hx = cumH(vUv + vec2(e, 0.0), seed), hy = cumH(vUv + vec2(0.0, e), seed);
    vec3 n = normalize(vec3(-(hx - h) / e * 0.5, -(hy - h) / e, 1.0));
    vec3 L = normalize(vec3(-0.45, 0.8, 0.55));
    light = clamp(0.5 + 0.5 * dot(n, L), 0.0, 1.0); light = mix(light, 0.5 + 0.5 * vUv.y, 0.3);
    light *= 0.7 + 0.3 * smoothstep(0.2, 0.55, vUv.y);
    float fr = fbm2(vec2(vUv.x * 2.0, vUv.y) * 6.0 + seed * 1.7, 4);
    a = smoothstep(-0.02, 0.09, h + (fr - 0.5) * 0.06) * 0.97;
    a *= smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x) * smoothstep(1.0, 0.85, vUv.y);
    thick = clamp(h * 5.0, 0.0, 1.0);
  } else if (cell < 11.5) {
    float d = bandD(vUv, seed); a = smoothstep(0.0, 0.8, d); light = clamp(0.55 + (vUv.y - 0.5) * 1.1 + (d - 0.5) * 0.2, 0.0, 1.0); thick = d;
  } else {
    float d = wispD(vUv, seed); a = clamp(d, 0.0, 1.0) * 0.85; light = 0.7 + 0.3 * vUv.y; thick = d * 0.5;
  }
  gl_FragColor = vec4(a, light, thick, 1.0);
}`;

export function bakeCloudAtlas(renderer) {
  const CW = 512, CH = 256;
  const rt = new THREE.WebGLRenderTarget(CW * COLS, CH * ROWS, { type: THREE.UnsignedByteType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const mat = new THREE.ShaderMaterial({ uniforms: { uCell: { value: 0 } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: BAKE_FS });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); const sc = new THREE.Scene(); sc.add(quad);
  const cam = new THREE.Camera();
  renderer.setRenderTarget(rt);
  renderer.autoClear = false; renderer.setClearColor(0x000000, 0); renderer.clear();
  for (let i = 0; i < COLS * ROWS; i++) {
    mat.uniforms.uCell.value = i;
    rt.viewport.set((i % COLS) * CW, Math.floor(i / COLS) * CH, CW, CH);
    renderer.setRenderTarget(rt);
    renderer.render(sc, cam);
  }
  rt.viewport.set(0, 0, CW * COLS, CH * ROWS);
  renderer.setRenderTarget(null); renderer.autoClear = true;
  // build mipmaps
  rt.texture.needsUpdate = true;
  return rt.texture;
}

const VS_SPRITE = /* glsl */`
attribute vec4 aSprite;   // cell, opacity, flipX, mode (0 = upright billboard, 1 = flat horizontal)
attribute vec3 aTint;
varying vec2 vUv; varying vec3 vWP; varying float vOp; varying vec3 vTint;
uniform vec3 uCamPos;
void main(){
  vec3 ctr = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vec3 sx = vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]);
  float sw = length(sx), sh = length(vec3(instanceMatrix[1][0], instanceMatrix[1][1], instanceMatrix[1][2]));
  vec3 wp;
  if (aSprite.w < 0.5) {
    vec3 toCam = uCamPos - ctr; vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
    vec3 up = normalize(cross(toCam, right));
    up = normalize(mix(vec3(0.0, 1.0, 0.0), up, 0.35));
    wp = ctr + right * position.x * sw + up * position.y * sh;
  } else {
    wp = ctr + vec3(position.x * sw, 0.0, -position.y * sh);
  }
  vWP = wp; vOp = aSprite.y; vTint = aTint;
  float cell = aSprite.x; vec2 uv0 = vec2(mod(cell, 4.0), floor(cell / 4.0)) / 4.0;
  vec2 u = uv; if (aSprite.z > 0.5) u.x = 1.0 - u.x;
  vUv = uv0 + (u * 0.96 + 0.02) / 4.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FS_SPRITE = /* glsl */`
uniform sampler2D uAtlas; uniform vec3 uLit, uShade, uCloudRim, uSunCol, uFlashCol, uFlashPos; uniform float uCloudDark;
varying vec2 vUv; varying vec3 vWP; varying float vOp; varying vec3 vTint;
${GLSL_ATMO}
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.r * vOp; if (a < 0.003) discard;
  vec3 V = normalize(vWP - uCamPos);
  float back = pow(max(dot(V, uSunDir), 0.0), 3.0);
  vec3 col = mix(uShade, uLit, t.g) * vTint;
  col += uCloudRim * back * (1.0 - t.b) * 0.35 * smoothstep(0.0, 0.5, t.r);   // faint silver lining toward the sun
  vec3 L = uFlashPos - vWP; float dl = length(L);
  col += uFlashCol * (0.4 + 0.6 * t.g) * (1400.0 / (dl + 1400.0));
  float fk; col = atmo(col, vWP, fk);
  gl_FragColor = vec4(col * a, a);                                 // premultiplied
}`;

export class CloudField {
  constructor(atlas, max = 400) {
    const g = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.uv = base.attributes.uv;
    this.aSprite = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); this.aSprite.setUsage(THREE.DynamicDrawUsage);
    this.aTint = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); this.aTint.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('aSprite', this.aSprite); g.setAttribute('aTint', this.aTint);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { ...ENV, ...CLOUD, uAtlas: { value: atlas } }, vertexShader: VS_SPRITE, fragmentShader: FS_SPRITE,
      transparent: true, depthWrite: false, blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    });
    this.mesh = new THREE.InstancedMesh(g, this.mat, max); this.mesh.frustumCulled = false; this.mesh.count = 0;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.max = max; this.items = [];
  }
  // item: {p: Vector3, w, h, cell, op, flip, flat, tint: Color}
  setItems(items) { this.items = items; }
  update(camPos, camDir) {
    const list = [];
    for (const it of this.items) {
      if (it.op <= 0.002) continue;
      const dx = it.p.x - camPos.x, dy = it.p.y - camPos.y, dz = it.p.z - camPos.z;
      const along = dx * camDir.x + dy * camDir.y + dz * camDir.z;
      const r = Math.max(it.w, it.h) * 0.6;
      if (along < -r) continue;
      list.push([dx * dx + dy * dy + dz * dz, it]);
    }
    list.sort((a, b) => b[0] - a[0]);
    const m = new THREE.Matrix4(); const n = Math.min(list.length, this.max);
    for (let i = 0; i < n; i++) {
      const it = list[i][1];
      m.makeScale(it.w, it.h, 1); m.setPosition(it.p);
      this.mesh.setMatrixAt(i, m);
      this.aSprite.setXYZW(i, it.cell, it.op, it.flip ? 1 : 0, it.flat ? 1 : 0);
      const tc = it.tint || WHITE; this.aTint.setXYZ(i, tc.r, tc.g, tc.b);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true; this.aSprite.needsUpdate = true; this.aTint.needsUpdate = true;
  }
}
const WHITE = new THREE.Color(1, 1, 1);

// ── cloud sea: a huge horizontal fbm sheet (two layers in one shader: crests lit, troughs shaded, gaps to the void)
export const STORM = { uLit: { value: C(0x4d6e77) }, uShade: { value: C(0x132a33) }, uCloudRim: { value: C(0x6f8f98) }, uCloudDark: { value: 1 }, uSeaY: { value: 4400 }, uSeaCover: { value: 0.75 }, uSeaScale: { value: 1 / 900 }, uSeaDrift: { value: new THREE.Vector2(3, 7) }, uVoidCol: { value: C(0x0c1f27) }, uAlpha: { value: 0 } };
export const SEA = { uSeaY: { value: 0 }, uSeaCover: { value: 0.62 }, uSeaScale: { value: 1 / 700 }, uSeaDrift: { value: new THREE.Vector2(0, 0) }, uVoidCol: { value: C(0xa9c0c4) } };
export function cloudSea(own) {
  const U = own || { ...CLOUD, ...SEA, uAlpha: { value: 0 } };
  const m = new THREE.Mesh(new THREE.PlaneGeometry(120000, 120000, 1, 1), new THREE.ShaderMaterial({
    uniforms: { ...ENV, ...U }, side: THREE.DoubleSide,
    vertexShader: `varying vec3 vWP; uniform float uSeaY; void main(){ vec4 wp = modelMatrix * vec4(position.x, uSeaY, -position.y, 1.0); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform vec3 uLit, uShade, uCloudRim, uVoidCol, uFlashCol, uFlashPos, uSunCol; uniform float uSeaCover, uSeaScale, uCloudDark, uAlpha; uniform vec2 uSeaDrift;
varying vec3 vWP;
${GLSL_NOISE}
${GLSL_ATMO}
vec2 hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float worley(vec2 p){ vec2 i = floor(p), f = fract(p); float d = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 o = vec2(float(x), float(y)); vec2 r = o + hash22(i + o) * 0.85 + 0.075 - f; d = min(d, dot(r, r)); }
  return sqrt(d); }
// puffy billows: domes from cellular noise at three scales, modulated by large banks
float seaH(vec2 p, int oct){
  vec2 w = vec2(fbm2(p * 0.18, 3), fbm2(p * 0.18 + 9.2, 3));
  float banks = fbm2(p * 0.12 + w * 0.6, 3);
  vec2 q = p + w * 0.9;
  float d1 = 1.0 - worley(q * 0.9); d1 = d1 * d1;
  float d2 = 1.0 - worley(q * 2.3 + 5.0); d2 = d2 * d2;
  float d3 = oct > 4 ? 1.0 - worley(q * 5.7 + 11.0) : 0.5;
  return banks * 0.7 + d1 * 0.45 + d2 * 0.22 + d3 * 0.08;
}
void main(){
  vec2 p = vWP.xz * uSeaScale + uSeaDrift;
  float dist = length(vWP - uCamPos);
  int oct = dist < 3000.0 ? 6 : (dist < 9000.0 ? 4 : 3);
  float e = 0.035;
  float h = seaH(p, oct), hx = seaH(p + vec2(e, 0.0), oct), hz = seaH(p + vec2(0.0, e), oct);
  vec3 N = normalize(vec3(-(hx - h) / e * 1.1, 1.0, -(hz - h) / e * 1.1));
  float cover = smoothstep(1.0 - uSeaCover - 0.05, 1.0 - uSeaCover + 0.1, h * 0.8);
  float ndl = dot(N, uSunDir);
  float light = clamp(0.25 + 0.8 * ndl, 0.0, 1.0) * (0.6 + 0.4 * smoothstep(0.45, 1.0, h));
  vec3 col = mix(uShade, uLit, light);
  col *= mix(vec3(1.0), uSunCol * 0.35 + 0.75, light * 0.5);
  vec3 V = normalize(vWP - uCamPos);
  col += uCloudRim * pow(max(dot(V, uSunDir), 0.0), 4.0) * 0.3 * (1.0 - light);
  vec3 L = uFlashPos - vWP; col += uFlashCol * 0.6 * (2000.0 / (length(L) + 2000.0));
  float below = step(vWP.y, uCamPos.y) * 2.0 - 1.0;          // seen from above (+1) or below (-1)
  if (below < 0.0) { col = mix(uShade, uLit, 0.25 + 0.5 * h) * (0.8 + 0.2 * light); }
  if (uAlpha < 0.5) col = mix(uVoidCol, col, cover);
  float fk; col = atmo(col, vWP, fk);
  float a = uAlpha > 0.5 ? cover : 1.0;
  gl_FragColor = vec4(col * a, a);
}`,
    transparent: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    depthWrite: true,
  }));
  m.frustumCulled = false; m.userData.U = U;
  return m;
}

// helper to scatter clouds deterministically
export function scatter(seed, n, fn) { const r = mulberry32(seed); const out = []; for (let i = 0; i < n; i++) { const it = fn(r, i); if (it) out.push(it); } return out; }

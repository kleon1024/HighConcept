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
float billow(vec2 p, int oct){ float s = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ if (i >= oct) break; s += a * abs(vnoise(p) * 2.0 - 1.0); p = p * 2.07 + vec2(1.7, 9.2); a *= 0.5; } return s; }
// cumulus heightfield: a soft dome envelope with cauliflower billows, flat base
float cumH(vec2 uv, float seed){
  vec2 p = vec2(uv.x * 2.0, uv.y);
  vec2 w = vec2(fbm2(p * 1.6 + seed, 3), fbm2(p * 1.6 + seed + 7.1, 3)) - 0.5;
  vec2 q = p + w * 0.35;
  float base = 0.2;
  float bump = 0.0;
  for (int i = 0; i < 5; i++){ float fi = float(i); float cx = 0.35 + 1.3 * fract(sin(seed * 3.1 + fi * 12.9) * 4375.5); float r = 0.18 + 0.2 * fract(sin(seed * 7.7 + fi * 3.3) * 2375.1);
    bump = max(bump, r - length((q - vec2(cx, base + r * 0.35)) * vec2(0.85, 1.0))); }
  float env = 0.42 - length((q - vec2(1.0, base)) * vec2(0.55, 1.35));
  float h = max(env, bump * 0.9) + (billow(q * 3.2 + seed, 5) - 0.35) * 0.16;
  h *= smoothstep(base - 0.03, base + 0.07, uv.y);
  return h;
}
float bandH(vec2 uv, float seed){
  vec2 p = vec2(uv.x * 2.0, uv.y);
  float top = 0.55 + (billow(vec2(p.x * 2.5 + seed, seed), 4) - 0.35) * 0.35 + (fbm2(vec2(p.x * 0.8, seed), 3) - 0.5) * 0.3;
  float bot = 0.3 + (fbm2(vec2(p.x * 1.5 + seed, 3.0), 3) - 0.5) * 0.15;
  float h = min(top - uv.y, uv.y - bot) * 1.4 + (billow(p * 4.0 + seed, 4) - 0.35) * 0.08;
  return h * smoothstep(0.0, 0.25, uv.x) * smoothstep(1.0, 0.75, uv.x);
}
float wispH(vec2 uv, float seed){
  vec2 c = (uv - 0.5) * vec2(1.0, 2.0);
  float e = 1.0 - smoothstep(0.2, 1.0, length(c * vec2(2.0, 3.2)));
  float st = fbm2(vec2(uv.x * 3.0, uv.y * 14.0) + vec2(seed, 0.0) + vec2(fbm2(uv * 4.0 + seed, 3) * 1.2, 0.0), 5);
  return (e * smoothstep(0.35, 0.75, st) * 1.2 - 0.1) * 0.25;
}
float H(vec2 uv, float kind, float seed){ return kind < 0.5 ? cumH(uv, seed) : (kind < 1.5 ? bandH(uv, seed) : wispH(uv, seed)); }
void main(){
  float cell = uCell; float kind = cell < 7.5 ? 0.0 : (cell < 11.5 ? 1.0 : 2.0); float seed = cell * 7.13 + 1.7;
  float e = 0.004;
  float h = H(vUv, kind, seed), hx = H(vUv + vec2(e, 0.0), kind, seed), hy = H(vUv + vec2(0.0, e), kind, seed);
  vec2 g = vec2(hx - h, hy - h) / e;
  vec3 n = normalize(vec3(-g.x * 0.25, -g.y * 0.5, 1.0));
  float a = kind < 1.5 ? smoothstep(-0.005, 0.05, h) : clamp(h * 6.0, 0.0, 0.9);
  float thick = clamp(h * 4.0, 0.0, 1.0);
  gl_FragColor = vec4(a, n.x * 0.5 + 0.5, n.y * 0.5 + 0.5, thick);
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
varying vec2 vUv; varying vec3 vWP; varying float vOp; varying vec3 vTint; varying vec3 vR, vU, vF; varying float vY;
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
    vR = right; vU = up; vF = normalize(toCam);
  } else {
    wp = ctr + vec3(position.x * sw, 0.0, -position.y * sh);
    vR = vec3(1.0, 0.0, 0.0); vU = vec3(0.0, 0.0, -1.0); vF = vec3(0.0, 1.0, 0.0);
  }
  vY = uv.y;
  vWP = wp; vOp = aSprite.y; vTint = aTint;
  float cell = aSprite.x; vec2 uv0 = vec2(mod(cell, 4.0), floor(cell / 4.0)) / 4.0;
  vec2 u = uv; if (aSprite.z > 0.5) u.x = 1.0 - u.x;
  vUv = uv0 + (u * 0.96 + 0.02) / 4.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FS_SPRITE = /* glsl */`
uniform sampler2D uAtlas; uniform vec3 uLit, uShade, uCloudRim, uSunCol, uFlashCol, uFlashPos; uniform float uCloudDark;
varying vec2 vUv; varying vec3 vWP; varying float vOp; varying vec3 vTint; varying vec3 vR, vU, vF; varying float vY;
${GLSL_ATMO}
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  float a = t.r * vOp; if (a < 0.003) discard;
  vec2 n2 = t.gb * 2.0 - 1.0; vec3 n = vec3(n2, sqrt(max(0.0, 1.0 - dot(n2, n2))));
  vec3 S = vec3(dot(uSunDir, vR), dot(uSunDir, vU), dot(uSunDir, vF));
  float lam = dot(n, normalize(S + vec3(0.0, 0.0, 0.25)));
  float lit = smoothstep(-0.35, 0.75, lam);
  float ao = 0.72 + 0.28 * smoothstep(0.15, 0.6, vY);
  vec3 col = mix(uShade, uLit, lit) * ao * vTint;
  // backlit: thin edges glow gold (silver lining); front-lit: crisp warm tops
  float back = clamp(-S.z, 0.0, 1.0);
  float edge = pow(1.0 - t.a, 2.0) * smoothstep(0.02, 0.5, t.r);
  col += uCloudRim * (back * 1.6 + 0.25) * edge * (0.5 + 0.5 * smoothstep(-0.2, 0.6, dot(n2, normalize(S.xy + 1e-4))));
  vec3 L = uFlashPos - vWP; float dl = length(L);
  col += uFlashCol * (0.4 + 0.6 * lit) * (1400.0 / (dl + 1400.0));
  float fk; col = atmo(col, vWP, fk);
  gl_FragColor = vec4(col * a, a);
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
  float rimF = pow(1.0 - clamp(dot(N, -V), 0.0, 1.0), 3.0) * (0.25 + 0.75 * clamp(dot(V, uSunDir) * 0.5 + 0.5, 0.0, 1.0));
  col += uCloudRim * rimF * 1.1 * smoothstep(0.45, 0.95, h) * smoothstep(-0.2, 0.4, ndl + 0.3);
  col += uCloudRim * pow(max(dot(V, uSunDir), 0.0), 6.0) * 0.25;
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

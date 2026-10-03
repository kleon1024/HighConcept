// FIRST LIGHT — small shared toolkit.
import * as THREE from 'three';
export { THREE };
export const W = 1920, H = 1080, TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = t => Math.pow(clamp(t), 3);
export const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const range = (x, a, b) => clamp((x - a) / (b - a));
export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const col = c => new THREE.Color(c);
// spring: 0 → overshoot → settle at 1 (for things that "pop" on a beat)
export const spring = t => (t <= 0 ? 0 : 1 - Math.exp(-7 * t) * Math.cos(11 * t));

export function rng(seed = 1) {
  let s = seed >>> 0;
  const f = () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.gauss = () => { let a = 0, b = 0; while (!a) a = f(); while (!b) b = f(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(TAU * b); };
  f.dir = () => { const z = f() * 2 - 1, a = f() * TAU, r = Math.sqrt(1 - z * z); return v3(r * Math.cos(a), r * Math.sin(a), z); };
  return f;
}

export function camera(fov = 45, near = 0.01, far = 500) { return new THREE.PerspectiveCamera(fov, W / H, near, far); }

// soft round point sprites; shaders supply positions/colours
export const SPRITE_FS = `
  varying vec3 vC; varying float vA;
  void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = exp(-d * d * 4.0) * (1.0 - smoothstep(0.85, 1.0, d)); gl_FragColor = vec4(vC * a * vA, 1.0); }`;

// a fullscreen shader "scene"
export function fullscreen(fragmentShader, uniforms) {
  const S = new THREE.Scene(), C = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2(W, H) }, ...uniforms }, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader,
  });
  S.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
  return { scene: S, cam: C, mat: m };
}

// GLSL noise used by several acts
export const GLSL_NOISE = `
  float hash1(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash1(i), hash1(i + vec3(1,0,0)), f.x), mix(hash1(i + vec3(0,1,0)), hash1(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hash1(i + vec3(0,0,1)), hash1(i + vec3(1,0,1)), f.x), mix(hash1(i + vec3(0,1,1)), hash1(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

export const gradeShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFade: { value: 1 }, uGrain: { value: 0.03 }, uVignette: { value: 1 }, uRes: { value: new THREE.Vector2(W, H) } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uFade, uGrain, uVignette; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      c *= mix(1.0, smoothstep(1.3, 0.2, length(q)), uVignette);
      c += (hash(vUv * uRes + uTime * 17.0) - 0.5) * uGrain;
      gl_FragColor = vec4(c * uFade, 1.0);
    }`,
};

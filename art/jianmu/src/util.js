// 御剑 YUJIAN — shared math, easing, seeded random, CPU noise and GLSL chunks.
export const W = 1080, H = 1920;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const smooth = k => k * k * (3 - 2 * k);
export const smoother = k => k * k * k * (k * (k * 6 - 15) + 10);
export const easeOut = k => 1 - Math.pow(1 - k, 3);
export const easeIn = k => k * k * k;
export const easeInOut = k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const easeInOutSine = k => -(Math.cos(Math.PI * k) - 1) / 2;
export const easeOutBack = (k, s = 1.7) => 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2);
export function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// keyframe track: [[t, v], ...] with per-segment easing (default smooth); v may be number or array
export function track(keys, t, ease = easeInOutSine) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [a, va] = keys[i - 1], [b, vb, e] = keys[i];
      const k = (e || ease)((t - a) / (b - a || 1));
      return Array.isArray(va) ? va.map((x, j) => lerp(x, vb[j], k)) : lerp(va, vb, k);
    }
  }
  return keys[keys.length - 1][1];
}

// ── CPU value noise (deterministic) for geometry displacement
const PERM = (() => { const r = mulberry32(1234); const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p.concat(p); })();
const fade = t => t * t * (3 - 2 * t);
function h3(x, y, z) { return PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255] / 255; }
export function noise3(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const fx = fade(x - X), fy = fade(y - Y), fz = fade(z - Z);
  const l = (a, b, k) => a + (b - a) * k;
  return l(l(l(h3(X, Y, Z), h3(X + 1, Y, Z), fx), l(h3(X, Y + 1, Z), h3(X + 1, Y + 1, Z), fx), fy),
           l(l(h3(X, Y, Z + 1), h3(X + 1, Y, Z + 1), fx), l(h3(X, Y + 1, Z + 1), h3(X + 1, Y + 1, Z + 1), fx), fy), fz);
}
export function fbm3(x, y, z, oct = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, oct)); }

// ── GLSL chunks
export const GLSL_NOISE = /* glsl */`
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float hash13(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
float vnoise3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(hash13(i), hash13(i+vec3(1,0,0)), f.x), mix(hash13(i+vec3(0,1,0)), hash13(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(hash13(i+vec3(0,0,1)), hash13(i+vec3(1,0,1)), f.x), mix(hash13(i+vec3(0,1,1)), hash13(i+vec3(1,1,1)), f.x), f.y), f.z); }
float fbm2(vec2 p, int oct){ float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 7; i++){ if (i >= oct) break; s += a * vnoise(p); p = m * p + vec2(3.1, 7.7); a *= .5; } return s; }
float fbm3(vec3 p, int oct){ float s = 0., a = .5;
  for (int i = 0; i < 6; i++){ if (i >= oct) break; s += a * vnoise3(p); p = p * 2.03 + vec3(3.1, 7.7, 1.3); a *= .5; } return s; }
`;

// atmosphere: distance + height fog to a mist colour, with sun in-scatter. Uniforms declared by the caller (ATMO_UNIFORMS).
export const GLSL_ATMO = /* glsl */`
uniform vec3 uFogCol, uFogSunCol, uSunDir, uCamPos;
uniform float uFogDen, uFogHeight, uFogHeightFall, uFogMax, uFogSunPow, uHighFog, uHighFogY;
vec3 atmo(vec3 col, vec3 wp, out float fogK){
  vec3 d = wp - uCamPos; float dist = length(d); vec3 v = d / max(dist, 1e-3);
  float f = 1.0 - exp(-dist * uFogDen);
  // height fog: thicker toward (and below) uFogHeight, integrated roughly along the ray
  float hy = mix(wp.y, uCamPos.y, 0.35);
  float hf = exp(-max(hy - uFogHeight, 0.0) / uFogHeightFall);
  f = 1.0 - (1.0 - f) * exp(-dist * uFogDen * 0.9 * hf);
  f = max(f, smoothstep(uHighFogY, uHighFogY + 3500.0, wp.y) * uHighFog);
  f = min(f, uFogMax); fogK = f;
  float sun = pow(max(dot(v, uSunDir), 0.0), uFogSunPow);
  vec3 fc = mix(uFogCol, uFogSunCol, sun);
  return mix(col, fc, f);
}
`;

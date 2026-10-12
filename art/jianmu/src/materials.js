// 御剑 YUJIAN — painterly materials. All share one ENV uniform set (light, sky, mist), updated per shot.
import * as THREE from 'three';
import { GLSL_NOISE, GLSL_ATMO } from './util.js';

const C = h => new THREE.Color(h);
export const ENV = {
  uCamPos: { value: new THREE.Vector3() },
  uSunDir: { value: new THREE.Vector3(0.3, 0.5, -0.8).normalize() },
  uSunCol: { value: C(0xffe6b8) },
  uSkyAmb: { value: C(0x9fbcc4) },
  uGroundAmb: { value: C(0x6b7d78) },
  uRimCol: { value: C(0xffe2a8) },
  uFogCol: { value: C(0xdfe9e6) },
  uFogSunCol: { value: C(0xfff1d6) },
  uFogDen: { value: 0.00025 },
  uFogHeight: { value: 0 },
  uFogHeightFall: { value: 400 },
  uFogMax: { value: 1.0 },
  uFogSunPow: { value: 6 },
  uHighFog: { value: 0.0 }, uHighFogY: { value: 5000 }, uFogStart: { value: 250 },
  uTime: { value: 0 },
  uFlashCol: { value: C(0x000000) },     // lightning illumination (colour × intensity)
  uFlashPos: { value: new THREE.Vector3() },
  uGrade: { value: 0 },                   // 0 = normal, used by sky/cloud tints
};

const VS_PAINT = /* glsl */`
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying vec3 vLP;
void main(){
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp;
    vec3 sc2 = vec3(dot(instanceMatrix[0].xyz, instanceMatrix[0].xyz), dot(instanceMatrix[1].xyz, instanceMatrix[1].xyz), dot(instanceMatrix[2].xyz, instanceMatrix[2].xyz));
    n = mat3(instanceMatrix) * (n / sc2);
  #endif
  vec4 wp = modelMatrix * lp;
  vWP = wp.xyz; vLP = position; vN = normalize(mat3(modelMatrix) * n);
  vCol = vec3(1.0);
  #ifdef USE_COLOR
    vCol = color;
  #endif
  #ifdef USE_INSTANCING_COLOR
    vCol *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const FS_PAINT = /* glsl */`
uniform vec3 uSunCol, uSkyAmb, uGroundAmb, uRimCol, uFlashCol, uFlashPos, uTint;
uniform float uBrushScale, uBrushAmt, uRim, uEmissive, uWrap, uTime, uRock;
uniform vec3 uMossCol;
uniform vec3 uBrushStretch;
varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying vec3 vLP;
${GLSL_NOISE}
${GLSL_ATMO}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamPos - vWP);
  float ndl = dot(N, uSunDir);
  float lit = smoothstep(-uWrap * 0.4, 0.55, ndl);
  // painted terminator: a soft but readable light/shadow split
  lit = mix(lit, smoothstep(-0.02, 0.18, ndl), 0.45);
  float hemi = N.y * 0.5 + 0.5;
  vec3 amb = mix(uGroundAmb, uSkyAmb, hemi);
  // brush (皴擦): anisotropic world-space noise modulating value
  vec3 bp = vWP * uBrushScale * uBrushStretch;
  float b = vnoise3(bp) * 0.6 + vnoise3(bp * 2.7 + 11.0) * 0.4;
  vec3 alb = vCol * uTint * (1.0 + uBrushAmt * (b - 0.5) * 2.0);
  if (uRock > 0.0) {
    float n1 = vnoise3(vWP * 0.018);
    float strata = sin(vWP.y * 0.09 + n1 * 7.0) * 0.5 + 0.5;
    float strata2 = sin(vWP.y * 0.31 + n1 * 11.0) * 0.5 + 0.5;
    alb *= mix(1.0, 0.8 + 0.28 * strata + 0.1 * strata2, uRock);
    float crack = 1.0 - abs(2.0 * vnoise3(vWP * vec3(0.045, 0.007, 0.045)) - 1.0);
    alb *= mix(1.0, 1.0 - 0.45 * smoothstep(0.88, 1.0, crack), uRock);
    float moss = smoothstep(0.5, 0.78, N.y + (vnoise3(vWP * 0.05) - 0.5) * 0.55);
    alb = mix(alb, uMossCol * (0.75 + 0.5 * vnoise3(vWP * 0.12)), moss * uRock);
  }
  vec3 col = alb * (amb + uSunCol * lit);
  // warm bounce in the shadow side from the cloud sea below
  col += alb * uGroundAmb * 0.25 * smoothstep(0.2, -0.8, N.y);
  // rim light: back-lit edges toward the sun
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
  float back = smoothstep(-0.4, 0.7, dot(-V, uSunDir));
  float sunSide = smoothstep(-0.2, 0.5, dot(N, uSunDir) + 0.3);
  col += uRimCol * fres * (0.25 + 0.95 * back) * (0.4 + 0.6 * sunSide) * uRim * 1.4;
  // lightning
  vec3 L2 = uFlashPos - vWP; float dl = length(L2);
  col += alb * uFlashCol * (0.35 + 0.65 * max(dot(N, L2 / dl), 0.0)) * (900.0 / (dl + 900.0));
  col += vCol * uTint * uEmissive;
  float fk; col = atmo(col, vWP, fk);
  gl_FragColor = vec4(col, 1.0);
}`;

export function paintMat(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      ...ENV,
      uTint: { value: C(o.tint ?? 0xffffff) },
      uBrushScale: { value: o.brushScale ?? 0.02 },
      uBrushStretch: { value: new THREE.Vector3(...(o.stretch ?? [1, 1, 1])) },
      uBrushAmt: { value: o.brush ?? 0.18 },
      uRim: { value: o.rim ?? 0.5 },
      uWrap: { value: o.wrap ?? 0.35 },
      uEmissive: { value: o.emissive ?? 0 },
      uRock: { value: o.rock ?? 0 }, uMossCol: { value: C(o.moss ?? 0x4f8a64) },
    },
    vertexShader: VS_PAINT, fragmentShader: FS_PAINT,
    vertexColors: o.vertexColors ?? true, side: o.side ?? THREE.FrontSide,
  });
}

// unlit emissive material (lanterns, glints) with fog
export function glowMat(color, o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...ENV, uColor: { value: C(color) }, uK: { value: o.k ?? 1 } },
    vertexShader: VS_PAINT,
    fragmentShader: `uniform vec3 uColor; uniform float uK; varying vec3 vWP; varying vec3 vN; varying vec3 vCol; varying vec3 vLP;
${GLSL_ATMO}
void main(){ float fk; vec3 c = uColor * vCol * uK; vec3 a = atmo(c, vWP, fk); gl_FragColor = vec4(mix(c, a, 0.7), 1.0); }`,
    vertexColors: o.vertexColors ?? false,
  });
}

// ── sky dome: gradient + sun glow + faint high streaks; follows the camera
export const SKY = {
  uZenith: { value: C(0xb9d3d4) }, uHorizon: { value: C(0xeef2e8) }, uVoid: { value: C(0xc9d8d6) },
  uSunGlow: { value: C(0xfff0cc) }, uSunK: { value: 1.0 }, uStreak: { value: 0.25 }, uHorizY: { value: 0.0 },
};
export function skyMesh() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(60000, 48, 24), new THREE.ShaderMaterial({
    uniforms: { ...ENV, ...SKY }, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uZenith, uHorizon, uVoid, uSunGlow, uSunDir; uniform float uSunK, uStreak, uHorizY, uTime;
varying vec3 vD;
${GLSL_NOISE}
void main(){
  vec3 d = normalize(vD); float y = d.y - uHorizY;
  vec3 c = mix(uHorizon, uZenith, smoothstep(0.0, 0.75, y));
  c = mix(c, uVoid, smoothstep(0.0, -0.25, y));
  float s = max(dot(d, uSunDir), 0.0);
  c += uSunGlow * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.6 + pow(s, 900.0) * 1.5) * uSunK;
  // high cirrus streaks
  vec2 q = d.xz / max(d.y + 0.15, 0.08);
  float st = fbm2(q * vec2(0.6, 3.0) + vec2(uTime * 0.01, 0.0), 4);
  c = mix(c, c * 0.93 + uSunGlow * 0.07, smoothstep(0.45, 0.8, st) * uStreak * smoothstep(0.02, 0.3, y));
  gl_FragColor = vec4(c, 1.0);
}`,
  }));
  m.renderOrder = -100; m.frustumCulled = false;
  return m;
}

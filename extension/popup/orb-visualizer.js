// StreamPulse AI Visualizer - WebGPU Liquid Glass Orb & Particle Ribbons Engine
// High-Fidelity 3D Refractive Glass Shell, Chromatic Particle Ribbons, and Dynamic State Transitions

const SHADER_WGSL = `
struct Uniforms {
  size:           vec2<f32>,
  time:           f32,
  speed:          f32,
  radius:         f32,
  zoom:           f32,
  warp:           f32,
  ridgeAmt:       f32,
  sharp:          f32,
  shade:          f32,
  sheen:          f32,
  gloss:          f32,
  shellMidAlpha:  f32,
  shellEdgeAlpha: f32,
  exposure:       f32,
  style:          f32,
  edgeSoftness:   f32,
  edgeGlow:       f32,
  paletteCount:   f32,
  glassEnabled:   f32,
  glassOpacity:   f32,
  contourDeform:  f32,
  bandDensity:    f32,
  chromaticShift: f32,
  metalScale:     f32,
  metalStretch:   f32,
  metalAngle:     f32,
  metalOffset:    f32,
  metalPhase:     f32,
  metalEvolution: f32,
  metalRoughness: f32,
  metalDepth:     f32,
  particleDensity: f32,
  ribbonCount:     f32,
  ribbonWidth:     f32,
  ribbonTwist:     f32,
  ribbonFold:      f32,
  ribbonBreath:    f32,
  particleSize:    f32,
  particleBloom:   f32,
  colorA:         vec4<f32>,
  colorB:         vec4<f32>,
  colorC:         vec4<f32>,
  colorD:         vec4<f32>,
  highlightColor: vec4<f32>,
  shellInner:     vec4<f32>,
  shellMid:       vec4<f32>,
  shellEdge:      vec4<f32>,
  sheenColor:     vec4<f32>,
  specColor:      vec4<f32>,
  canvasColor:    vec4<f32>,
  glowColor:      vec4<f32>,
  paletteStop0:    vec4<f32>,
  paletteStop1:    vec4<f32>,
  paletteStop2:    vec4<f32>,
  paletteStop3:    vec4<f32>,
  paletteStop4:    vec4<f32>,
  paletteStop5:    vec4<f32>,
  paletteStop6:    vec4<f32>,
  paletteStop7:    vec4<f32>,
  paletteStop8:    vec4<f32>,
  paletteStop9:    vec4<f32>,
  paletteStop10:   vec4<f32>,
  paletteStop11:   vec4<f32>,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

fn mfEdgeD(soft: f32) -> f32 {
  return soft - 0.005;
}

fn mfEdgeGlow(col: vec3<f32>, uv: vec2<f32>, ctr: vec2<f32>, rad: f32,
              soft: f32, glow: f32, glowRGB: vec3<f32>) -> vec3<f32> {
  if (glow <= 0.0) { return col; }
  let r = length(uv - ctr);
  let outside = smoothstep(rad - max(soft, 0.0005), rad + max(soft, 0.0005), r);
  return col + glowRGB * (glow * exp(-max(r - rad, 0.0) * 11.0) * outside);
}

fn mfRampPick(idx: f32,
              s0: vec3<f32>, s1: vec3<f32>, s2:  vec3<f32>, s3:  vec3<f32>,
              s4: vec3<f32>, s5: vec3<f32>, s6:  vec3<f32>, s7:  vec3<f32>,
              s8: vec3<f32>, s9: vec3<f32>, s10: vec3<f32>, s11: vec3<f32>) -> vec3<f32> {
  var r = s0;
  r = select(r, s1,  idx == 1.0);
  r = select(r, s2,  idx == 2.0);
  r = select(r, s3,  idx == 3.0);
  r = select(r, s4,  idx == 4.0);
  r = select(r, s5,  idx == 5.0);
  r = select(r, s6,  idx == 6.0);
  r = select(r, s7,  idx == 7.0);
  r = select(r, s8,  idx == 8.0);
  r = select(r, s9,  idx == 9.0);
  r = select(r, s10, idx == 10.0);
  r = select(r, s11, idx == 11.0);
  return r;
}

fn mfRampLin(tIn: f32, n: f32,
             s0: vec3<f32>, s1: vec3<f32>, s2:  vec3<f32>, s3:  vec3<f32>,
             s4: vec3<f32>, s5: vec3<f32>, s6:  vec3<f32>, s7:  vec3<f32>,
             s8: vec3<f32>, s9: vec3<f32>, s10: vec3<f32>, s11: vec3<f32>) -> vec3<f32> {
  let k  = clamp(floor(n + 0.5), 1.0, 12.0);
  let x  = clamp(tIn, 0.0, 1.0) * (k - 1.0);
  let i0 = clamp(floor(x), 0.0, max(k - 2.0, 0.0));
  return mix(mfRampPick(i0,     s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11),
             mfRampPick(i0 + 1.0, s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11),
             x - i0);
}

const GL_FU:   f32 = 0.88172043;
const GL_BSIG_CLEAR: f32 = 0.01800000;
const GL_BSIG_GLASS: f32 = 0.03990000;
const GL_KA:  f32 = 6.0;
const GL_KG:  f32 = 4.1209;
const GL_KWA: f32 = 0.5;
const GL_KR:  f32 = 0.32;
const GL_GH:  f32 = 1.73205081;
const GL_CLEAR_EA: f32 = 0.995;
const GL_CLEAR_EB: f32 = 1.04;

fn lqHash(pIn: vec2<f32>) -> f32 {
  var p = fract(pIn * vec2<f32>(123.34, 456.21));
  p = p + vec2<f32>(dot(p, p + vec2<f32>(45.32)));
  return fract(p.x * p.y);
}

fn lqNoise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  var f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(lqHash(i), lqHash(i + vec2<f32>(1.0, 0.0)), f.x),
             mix(lqHash(i + vec2<f32>(0.0, 1.0)), lqHash(i + vec2<f32>(1.0, 1.0)), f.x), f.y);
}

fn lqFbm(pIn: vec2<f32>, bs: f32) -> vec2<f32> {
  var p = pIn;
  var s:  f32 = 0.0;
  var a:  f32 = 0.5;
  var m:  f32 = 0.0;
  var vr: f32 = 0.0;
  let e = -GL_KA * bs * bs;
  var g: f32 = 1.0;
  for (var i: i32 = 0; i < 5; i = i + 1) {
    let b = exp(e * g);
    s  = s  + a * (0.5 + b * (lqNoise(p) - 0.5));
    vr = vr + a * a * (1.0 - b * b);
    m  = m + a;
    a  = a * 0.5;
    g  = g * GL_KG;
    p = vec2<f32>(0.8 * p.x - 0.6 * p.y, 0.6 * p.x + 0.8 * p.y) * 2.03;
  }
  return vec2<f32>(s / m, GL_KR * sqrt(vr) / m);
}

fn glsOver(dst: vec3<f32>, src: vec3<f32>, a: f32) -> vec3<f32> {
  let k = clamp(a, 0.0, 1.0);
  return src * k + dst * (1.0 - k);
}

fn glsRefractionProfile(t: f32) -> f32 {
  let depth = clamp(t, 0.0, 1.0);
  let circular = sqrt(max(1.0 - (1.0 - depth) * (1.0 - depth), 0.0));
  return 1.0 - circular;
}

fn glsHighlightLobe(normal: vec2<f32>, direction: vec2<f32>, cut: f32,
                     power: f32) -> f32 {
  let angular = clamp((dot(normal, direction) - cut) / max(1.0 - cut, 0.001),
                      0.0, 1.0);
  return pow(angular, power);
}

fn glsContourWave(angle: f32, t: f32) -> vec2<f32> {
  let wave = sin(angle * 3.0 + t * 0.62) * 0.52
             + sin(angle * 5.0 - t * 0.41 + 1.7) * 0.31
             + sin(angle * 2.0 + t * 0.23 + 3.1) * 0.17;
  let slope = cos(angle * 3.0 + t * 0.62) * 1.56
              + cos(angle * 5.0 - t * 0.41 + 1.7) * 1.55
              + cos(angle * 2.0 + t * 0.23 + 3.1) * 0.34;
  return vec2<f32>(wave, slope);
}

fn glsContourScale(uv: vec2<f32>, t: f32, amount: f32) -> f32 {
  if (amount <= 0.0) { return 1.0; }
  let contour = glsContourWave(atan2(uv.y, uv.x), t);
  return 1.0 + clamp(amount, 0.0, 1.0) * 0.11 * contour.x;
}

fn glsContourNormal(uv: vec2<f32>, rad: f32, t: f32, amount: f32) -> vec2<f32> {
  let distance = length(uv);
  if (distance <= 0.0001) { return vec2<f32>(0.0); }
  let radial = uv / distance;
  let contour = glsContourWave(atan2(uv.y, uv.x), t);
  let slope = clamp(amount, 0.0, 1.0) * 0.11 * contour.y;
  let tangent = vec2<f32>(-radial.y, radial.x);
  return normalize(radial - tangent * (rad * slope / distance));
}

fn orbGlassLiquidAnim(uv01: vec2<f32>) -> vec4<f32> {
  let fc = vec2<f32>(uv01.x, 1.0 - uv01.y) * u.size;
  let uv = (2.0 * fc - u.size) / max(min(u.size.x, u.size.y), 1.0);
  let rad = max(u.radius, 0.05);
  let t = u.time * u.speed;
  let contourRad = rad * glsContourScale(uv, t, u.contourDeform);

  if (length(uv) > contourRad * (1.01 + mfEdgeD(u.edgeSoftness))) {
    let halo = clamp(mfEdgeGlow(vec3<f32>(0.0), uv, vec2<f32>(0.0), contourRad,
                                u.edgeSoftness, u.edgeGlow, u.glowColor.rgb),
                     vec3<f32>(0.0), vec3<f32>(1.0));
    let haloAlpha = max(halo.r, max(halo.g, halo.b));
    return vec4<f32>(halo, haloAlpha);
  }

  let p = uv / contourRad;
  let pd = length(p);
  let clearFa = 1.0 - smoothstep(GL_CLEAR_EA, GL_CLEAR_EB, pd);
  let contourNormal = glsContourNormal(uv, rad, t, u.contourDeform);
  let normal = contourNormal;
  let edgeDepth = max(1.0 - pd, 0.0);

  var col = vec3<f32>(0.0);

  if (u.glassEnabled > 0.5) {
    let surfaceWidth = 0.09 + 0.12 * clamp(u.shellEdgeAlpha, 0.0, 1.0);
    let surfaceBand = (1.0 - smoothstep(0.0, surfaceWidth, edgeDepth)) * clearFa;
    let opticalRim = pow(surfaceBand, 1.3);
    let innerRimAlpha = opticalRim * u.glassOpacity * 0.14;
    col = glsOver(col, u.shellInner.rgb, innerRimAlpha);

    let coolDirection = normalize(vec2<f32>(0.84, 0.54));
    let warmDirection = normalize(vec2<f32>(-0.62, -0.78));
    let coolSplit = glsHighlightLobe(normal, coolDirection, -0.32, 1.8);
    let warmSplit = glsHighlightLobe(normal, warmDirection, -0.28, 2.0);
    let dispersion = opticalRim * clamp(u.gloss, 0.0, 2.0)
                     * (0.8 + 0.8 * u.shellEdgeAlpha);
    col = glsOver(col, u.shellMid.rgb, dispersion * coolSplit);
    col = glsOver(col, u.shellEdge.rgb, dispersion * warmSplit);

    let edgeShadow = opticalRim * (0.015 + 0.15 * u.shellEdgeAlpha)
                     * (0.15 + 0.85 * max(dot(normal, vec2<f32>(0.45, -0.89)), 0.0));
    col = col * (1.0 - edgeShadow);

    let keyDirection = normalize(vec2<f32>(-0.68, 0.73));
    let fillDirection = normalize(vec2<f32>(0.74, -0.67));
    let key = opticalRim * glsHighlightLobe(normal, keyDirection, 0.2, 2.8)
              * clamp(u.sheen, 0.0, 2.0) * 1.4;
    let fill = opticalRim * glsHighlightLobe(normal, fillDirection, 0.4, 3.6)
               * clamp(u.sheen, 0.0, 2.0) * 1.0;
    col = glsOver(col, u.sheenColor.rgb, key);
    col = glsOver(col, u.specColor.rgb, fill);
  }

  let ballA = 1.0 - smoothstep(0.99 - mfEdgeD(u.edgeSoftness), 1.01 + mfEdgeD(u.edgeSoftness), pd);
  col = clamp(col * max(u.exposure, 0.0), vec3<f32>(0.0), vec3<f32>(1.0)) * ballA;
  let edged = mfEdgeGlow(col, uv, vec2<f32>(0.0), contourRad,
                         u.edgeSoftness, u.edgeGlow, u.glowColor.rgb);
  let finalColor = clamp(edged, vec3<f32>(0.0), vec3<f32>(1.0));
  let emissionAlpha = max(finalColor.r, max(finalColor.g, finalColor.b));
  return vec4<f32>(finalColor, emissionAlpha);
}

struct VOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VOut {
  var p = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>( 3.0, -1.0),
    vec2<f32>(-1.0,  3.0),
  );
  var out: VOut;
  out.pos = vec4<f32>(p[i], 0.0, 1.0);
  let uv01 = (p[i] + vec2<f32>(1.0)) * 0.5;
  out.uv = vec2<f32>(uv01.x, 1.0 - uv01.y);
  return out;
}

@fragment
fn fs_main(in: VOut) -> @location(0) vec4<f32> {
  return orbGlassLiquidAnim(in.uv);
}

const PR_U_SEGMENTS: u32 = 384u;
const PR_V_SEGMENTS: u32 = 96u;
const PR_PARTICLES_PER_LAYER: u32 = PR_U_SEGMENTS * PR_V_SEGMENTS;

struct RibbonOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) color: vec3<f32>,
  @location(2) opacity: f32,
};

fn prHash(value: f32) -> f32 {
  return fract(sin(value * 12.9898 + 78.233) * 43758.5453);
}

fn prRotateX(p: vec3<f32>, angle: f32) -> vec3<f32> {
  let c = cos(angle);\n  let s = sin(angle);
  return vec3<f32>(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}

fn prRotateY(p: vec3<f32>, angle: f32) -> vec3<f32> {
  let c = cos(angle);
  let s = sin(angle);
  return vec3<f32>(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

fn prCurve(theta: f32, layer: f32, phase: f32) -> vec3<f32> {
  let local = theta + layer * 0.11;
  let foldPhase = 2.0 * local + phase * (0.72 + layer * 0.025);
  let fold = clamp(u.ribbonFold, 0.0, 1.2);
  let radial = 0.4 + (0.085 + fold * 0.04) * cos(foldPhase);
  let orbit = local + phase * 0.13
              + sin(local - phase * 0.22 + layer) * fold * 0.13;
  let vertical = (0.235 + fold * 0.085) * sin(foldPhase)
                 + 0.055 * sin(local * 3.0 - phase * 0.46 + layer * 0.7);
  return vec3<f32>(radial * cos(orbit), vertical, radial * sin(orbit));
}

fn prPalette(valueIn: f32) -> vec3<f32> {
  let value = fract(valueIn) * 4.0;
  if (value < 1.0) { return mix(u.colorA.rgb, u.colorB.rgb, value); }
  if (value < 2.0) { return mix(u.colorB.rgb, u.colorC.rgb, value - 1.0); }
  if (value < 3.0) { return mix(u.colorC.rgb, u.colorD.rgb, value - 2.0); }
  return mix(u.colorD.rgb, u.colorA.rgb, value - 3.0);
}

@vertex
fn ribbon_vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> RibbonOut {
  var corners = array<vec2<f32>, 6>(
    vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
    vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0),
  );
  let layerIndex = instanceIndex / PR_PARTICLES_PER_LAYER;
  let particleIndex = instanceIndex % PR_PARTICLES_PER_LAYER;
  let uIndex = particleIndex / PR_V_SEGMENTS;
  let vIndex = particleIndex % PR_V_SEGMENTS;
  let layer = f32(layerIndex);
  let random = prHash(f32(instanceIndex));
  let activeLayer = layer < floor(clamp(u.ribbonCount, 2.0, 6.0) + 0.5);

  let uCoord = (f32(uIndex) + prHash(f32(instanceIndex) + 11.0) * 0.56)
               / f32(PR_U_SEGMENTS);
  let vCoord = (f32(vIndex) + prHash(f32(instanceIndex) + 29.0) * 0.46)
               / f32(PR_V_SEGMENTS);
  let strip = vCoord * 2.0 - 1.0;
  let t = u.time * u.speed;
  let phase = t * 0.48;
  let arc = fract(uCoord + layer * 0.211 - phase * 0.019);
  let arcLength = 0.76 + 0.055 * sin(t * 0.23 + layer * 1.71);
  let arcPosition = arc / arcLength;
  let arcEnvelope = smoothstep(0.0, 0.075, arcPosition)
                    * (1.0 - smoothstep(0.88, 1.0, arcPosition));
  let particleVisible = activeLayer
                        && arc <= arcLength
                        && random <= clamp(u.particleDensity, 0.2, 1.0);
  let theta = uCoord * 6.28318530718;
  let center = prCurve(theta, layer, phase);
  let ahead = prCurve(theta + 0.006, layer, phase);
  let tangent = normalize(ahead - center);
  let radial = normalize(center + vec3<f32>(0.001, 0.013, 0.007));
  let side = normalize(cross(tangent, radial));
  let surfaceNormal = normalize(cross(side, tangent));
  let twist = theta * (0.72 + u.ribbonTwist * 0.58)
              + phase * 0.74 + layer * 1.17;
  let ribbonDirection = normalize(side * cos(twist) + surfaceNormal * sin(twist));
  let widthEnvelope = (0.72 + 0.28 * pow(sin(theta * 1.5 + phase + layer), 2.0))
                      * mix(0.42, 1.0, sqrt(max(arcEnvelope, 0.0)));
  var position = center + ribbonDirection * strip * u.ribbonWidth * 0.5 * widthEnvelope;

  let pulse = sin(t * 0.73 + layer * 1.71)
              + 0.44 * sin(t * 1.17 + layer * 0.83 + 1.2);
  position *= 1.0 + u.ribbonBreath * pulse * 0.16;
  let layerCenter = layer
                    - (floor(clamp(u.ribbonCount, 2.0, 6.0) + 0.5) - 1.0) * 0.5;
  position = prRotateY(
    position,
    layerCenter * 0.24 + sin(t * 0.19 + layer * 1.3) * 0.055,
  );
  position = prRotateX(
    position,
    layerCenter * 0.14 + cos(t * 0.17 + layer * 0.9) * 0.04,
  );
  position = prRotateY(position, t * 0.105 + sin(t * 0.21) * 0.11);
  position = prRotateX(position, -0.2 + sin(t * 0.16 + layer * 0.1) * 0.16);

  let minSize = max(min(u.size.x, u.size.y), 1.0);
  let depthScale = 0.88 + position.z * 0.16;
  let orbPosition = position.xy * u.radius * 1.45 * depthScale;
  let clip = vec2<f32>(
    orbPosition.x * minSize / max(u.size.x, 1.0),
    orbPosition.y * minSize / max(u.size.y, 1.0),
  );
  let canvasParticleScale = clamp(minSize / 640.0, 0.22, 1.0);
  let pointPixels = max(0.6, u.particleSize)
                    * (1.5 + u.particleBloom * 2.5)
                    * (0.92 + position.z * 0.18)
                    * canvasParticleScale;
  let corner = corners[vertexIndex];
  let pointOffset = corner * pointPixels * 2.0 / max(u.size, vec2<f32>(1.0));

  let colorPhase = uCoord * 0.32 + layer * 0.19 + phase * 0.025
                   + position.z * 0.08;
  let stripEdge = smoothstep(0.58, 1.0, abs(strip));
  let front = clamp(0.78 + position.z * 0.54, 0.5, 1.24);
  let baseOpacity = mix(0.025, 0.009, clamp(u.shade / 1.5, 0.0, 1.0));
  var out: RibbonOut;
  out.pos = select(
    vec4<f32>(2.0, 2.0, 1.0, 1.0),
    vec4<f32>(clip + pointOffset, clamp(0.5 - position.z * 0.12, 0.05, 0.95), 1.0),
    particleVisible,
  );
  out.local = corner;
  out.color = pow(
    mix(prPalette(colorPhase), u.highlightColor.rgb, stripEdge * 0.56),
    vec3<f32>(0.72),
  ) * front;
  out.opacity = select(
    0.0,
    baseOpacity
      * (0.72 + stripEdge * 1.28)
      * arcEnvelope
      * pow(canvasParticleScale, 1.35),
    particleVisible,
  );
  return out;
}

@fragment
fn ribbon_fs_main(in: RibbonOut) -> @location(0) vec4<f32> {
  let distanceSquared = dot(in.local, in.local);
  if (distanceSquared > 1.0) { discard; }
  let core = exp(-distanceSquared * 4.8);
  let halo = exp(-distanceSquared * 1.35);
  let bloom = clamp(u.particleBloom, 0.0, 2.0);
  let intensity = in.opacity * (core * 1.9 + halo * bloom * 0.72)
                  * max(u.exposure, 0.0);
  let glowMix = clamp((halo - core * 0.45) * (0.18 + u.edgeGlow * 0.5), 0.0, 0.7);
  let color = mix(in.color, u.glowColor.rgb, glowMix);
  let alpha = clamp(intensity, 0.0, 1.0);
  return vec4<f32>(color * alpha, alpha);
}

@group(0) @binding(1) var ribbonTexture: texture_2d<f32>;
@group(0) @binding(2) var ribbonSampler: sampler;

fn prTextureUvFromOrb(p: vec2<f32>, contourRad: f32) -> vec2<f32> {
  let minSize = max(min(u.size.x, u.size.y), 1.0);
  let fc = (p * contourRad * minSize + u.size) * 0.5;
  return clamp(
    vec2<f32>(fc.x / max(u.size.x, 1.0), 1.0 - fc.y / max(u.size.y, 1.0)),
    vec2<f32>(0.0),
    vec2<f32>(1.0),
  );
}

fn prSampleRibbon(p: vec2<f32>, contourRad: f32) -> vec4<f32> {
  return textureSampleLevel(
    ribbonTexture,
    ribbonSampler,
    prTextureUvFromOrb(p, contourRad),
    0.0,
  );
}

@fragment
fn ribbon_composite_fs_main(in: VOut) -> @location(0) vec4<f32> {
  let direct = textureSampleLevel(ribbonTexture, ribbonSampler, in.uv, 0.0);
  if (u.glassEnabled <= 0.5) { return direct; }

  let fc = vec2<f32>(in.uv.x, 1.0 - in.uv.y) * u.size;
  let minSize = max(min(u.size.x, u.size.y), 1.0);
  let uv = (2.0 * fc - u.size) / minSize;
  let rad = max(u.radius, 0.05);
  let t = u.time * u.speed;
  let contourRad = rad * glsContourScale(uv, t, u.contourDeform);
  let shell = orbGlassLiquidAnim(in.uv);
  if (length(uv) > contourRad * (1.01 + mfEdgeD(u.edgeSoftness))) {
    return shell;
  }

  let p = uv / contourRad;
  let pd = length(p);
  let clearFa = 1.0 - smoothstep(GL_CLEAR_EA, GL_CLEAR_EB, pd);
  let normal = glsContourNormal(uv, rad, t, u.contourDeform);
  let edgeDepth = max(1.0 - pd, 0.0);
  let refractionWidth = 0.015 + 0.95 * clamp(u.shellMidAlpha, 0.0, 1.0);
  let refractionT = edgeDepth / max(refractionWidth, 0.001);
  let refractionProfile = pow(glsRefractionProfile(refractionT), 0.68);
  let refractionAmount = 1.6 * clamp(u.glassOpacity, 0.0, 1.0)
                         * refractionProfile;
  let refractedP = p - normal * refractionAmount;
  let channelSplit = 0.14 * clamp(u.gloss, 0.0, 2.0)
                     * clamp(u.glassOpacity, 0.0, 1.0)
                     * refractionProfile;
  let redSample = prSampleRibbon(refractedP - normal * channelSplit, contourRad);
  let greenSample = prSampleRibbon(refractedP, contourRad);
  let blueSample = prSampleRibbon(refractedP + normal * channelSplit, contourRad);
  let refractedAlpha = max(redSample.a, max(greenSample.a, blueSample.a)) * clearFa;
  let refracted = vec4<f32>(
    vec3<f32>(redSample.r, greenSample.g, blueSample.b) * clearFa,
    refractedAlpha,
  );
  return vec4<f32>(
    shell.rgb + refracted.rgb * (1.0 - shell.a),
    shell.a + refracted.a * (1.0 - shell.a),
  );
}
`;

const ORB_STATE_SEEDS = {
  idle: [
    1,1,0,0.2016,0.66,0.30,3,0.5,2.20,0.12,0.28,0.24,0.18,0.18,1.0064,24,
    0.005,0,0,1,0.44,0,2,0.42,0.77,0.23,65,0,0,1,0.22,0.25,1,4,0.2976,0.483,
    0.21,0.0684,1.12,1.22,0.2275,0.3765,0.4078,1,0.2157,0.3647,0.4706,1,
    0.3490,0.3059,0.5137,1,0.5216,0.2980,0.4784,1,0.7255,0.8000,0.8196,1,
    1,1,1,1,0.6078,0.9569,1,1,0.7725,0.6627,1,1,0.9176,0.9569,1,1,0.8627,
    0.9176,1,1,0.0039,0.0078,0.0314,1,0.3176,0.2980,0.4706,1,0.9686,0.9843,
    1,1,0.9373,0.9647,0.9922,1,0.8784,0.9333,0.9765,1,0.8314,0.9020,0.9686,
    1,0.7333,0.8353,0.9529,1,0.6510,0.7804,0.9412,1,0.5294,0.6902,0.9216,1,
    0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,
    0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1
  ],
  thinking: [
    1,1,0,0.72,0.66,0.30,3,0.5,2.20,0.12,0.28,0.24,0.18,0.18,1.48,24,
    0.005,0,0,1,0.44,0,2,0.42,0.77,0.23,65,0,0,1,0.22,0.25,1,4,0.48,1.15,
    0.60,0.38,1.12,1.22,0.3882,0.9451,1,1,0.2902,0.6157,1,1,0.5216,0.4000,
    1,1,0.9451,0.3647,0.8824,1,0.9608,0.9843,1,1,1,1,1,1,0.6078,0.9569,
    1,1,0.7725,0.6627,1,1,0.9176,0.9569,1,1,0.8627,0.9176,1,1,0.0039,0.0078,
    0.0314,1,0.4627,0.3608,1,1,0.9686,0.9843,1,1,0.9373,0.9647,0.9922,1,
    0.8784,0.9333,0.9765,1,0.8314,0.9020,0.9686,1,0.7333,0.8353,0.9529,1,
    0.6510,0.7804,0.9412,1,0.5294,0.6902,0.9216,1,0.4353,0.6196,0.9098,1,
    0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,
    0.4353,0.6196,0.9098,1
  ],
  found: [
    1,1,0,0.45,0.66,0.30,3,0.5,2.20,0.12,0.28,0.24,0.18,0.18,1.60,24,
    0.005,0,0,1,0.44,0,2,0.42,0.77,0.23,65,0,0,1,0.22,0.25,1,4,0.38,0.85,
    0.40,0.22,1.12,1.22,0.10,0.95,0.45,1,0.00,0.85,0.65,1,0.20,0.70,
    0.95,1,0.85,0.95,0.20,1,1.0,1.0,0.9,1,1,1,1,1,0.40,0.95,
    0.70,1,0.60,0.95,0.40,1,0.80,0.95,0.50,1,0.90,1.0,0.80,1,0.0039,0.0078,
    0.0314,1,0.10,0.80,0.50,1,0.9686,0.9843,1,1,0.9373,0.9647,0.9922,1,
    0.8784,0.9333,0.9765,1,0.8314,0.9020,0.9686,1,0.7333,0.8353,0.9529,1,
    0.6510,0.7804,0.9412,1,0.5294,0.6902,0.9216,1,0.4353,0.6196,0.9098,1,
    0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,0.4353,0.6196,0.9098,1,
    0.4353,0.6196,0.9098,1
  ]
};

class StreamPulseLiquidOrb {
  constructor(canvasId) {
    this.canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    this.state = 'idle';
    this.targetState = 'idle';
    this.running = false;
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.ribbonPipeline = null;
    this.ribbonCompositePipeline = null;
    this.uniformBuffer = null;
    this.bindGroup = null;
    this.ribbonBindGroup = null;
    this.ribbonSampler = null;
    this.ribbonTarget = null;
    this.ribbonCompositeBindGroup = null;
    this.animationFrame = null;

    this.fromUniforms = new Float32Array(ORB_STATE_SEEDS.idle);
    this.targetUniforms = new Float32Array(ORB_STATE_SEEDS.idle);
    this.displayedUniforms = new Float32Array(ORB_STATE_SEEDS.idle);
    this.transitionStartedAt = 0;
    this.activeTransitionDuration = 0;
    this.lastFrameAt = null;
    this.motionPhase = 0;
    this.audioEnergy = 0;
    this.targetAudioEnergy = 0;

    this.ribbonStyleIndex = 24;
    this.ribbonInstanceCount = 221184;
    this.activationDurationMs = 280;
    this.settleDurationMs = 600;

    this.webgpuSupported = false;
    this.fallbackVisualizer = null;
  }

  async init() {
    if (!this.canvas) return false;

    if (navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (adapter) {
          this.device = await adapter.requestDevice();
          this.context = this.canvas.getContext('webgpu');
          if (this.context) {
            this.format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({ device: this.device, format: this.format, alphaMode: 'premultiplied' });

            const shader = this.device.createShaderModule({ code: SHADER_WGSL });
            const compilation = await shader.getCompilationInfo();
            const errors = compilation.messages.filter((m) => m.type === 'error');
            if (errors.length === 0) {
              this.buildPipelines(shader);
              this.webgpuSupported = true;
              return true;
            }
          }
        }
      } catch (err) {
        console.warn('[StreamPulse Orb] WebGPU init failed, switching to 2D canvas fallback:', err);
      }
    }

    return false;
  }

  buildPipelines(shader) {
    const device = this.device;
    const format = this.format;

    this.pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'vs_main' },
      fragment: {
        module: shader,
        entryPoint: 'fs_main',
        targets: [{
          format,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.ribbonPipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'ribbon_vs_main' },
      fragment: {
        module: shader,
        entryPoint: 'ribbon_fs_main',
        targets: [{
          format,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    this.ribbonCompositePipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: { module: shader, entryPoint: 'vs_main' },
      fragment: {
        module: shader,
        entryPoint: 'ribbon_composite_fs_main',
        targets: [{
          format,
          blend: {
            color: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
          },
        }],
      },
      primitive: { topology: 'triangle-list' },
    });

    const values = new Float32Array(this.displayedUniforms);
    this.uniformBuffer = device.createBuffer({
      size: values.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });

    this.ribbonBindGroup = device.createBindGroup({
      layout: this.ribbonPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });

    this.ribbonSampler = device.createSampler({
      addressModeU: 'clamp-to-edge',
      addressModeV: 'clamp-to-edge',
      magFilter: 'linear',
      minFilter: 'linear',
    });
  }

  srgbToLinear(value) {
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }

  linearToSrgb(value) {
    return value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  }

  mixSrgb(from, to, progress) {
    return this.linearToSrgb(
      this.srgbToLinear(from) + (this.srgbToLinear(to) - this.srgbToLinear(from)) * progress
    );
  }

  transitionProgress(now) {
    if (this.activeTransitionDuration === 0) return 1;
    const raw = Math.min(1, Math.max(0, (now - this.transitionStartedAt) / this.activeTransitionDuration));
    return this.targetState === 'thinking' ? 1 - (1 - raw) ** 3 : raw * raw * (3 - 2 * raw);
  }

  sampleTransition(now) {
    const progress = this.transitionProgress(now);
    for (let i = 3; i < this.displayedUniforms.length; i++) {
      const isColor = i >= 40 && (i - 40) % 4 < 3;
      this.displayedUniforms[i] = isColor
        ? this.mixSrgb(this.fromUniforms[i], this.targetUniforms[i], progress)
        : this.fromUniforms[i] + (this.targetUniforms[i] - this.fromUniforms[i]) * progress;
    }
    return this.displayedUniforms;
  }

  setState(nextState) {
    const key = (nextState === 'listening' || nextState === 'analyzing') ? 'thinking' : (nextState === 'found' ? 'found' : 'idle');
    if (!ORB_STATE_SEEDS[key]) return;
    if (key === this.state) return;

    const now = performance.now();
    this.sampleTransition(now);
    this.fromUniforms.set(this.displayedUniforms);
    this.targetUniforms.set(ORB_STATE_SEEDS[key]);
    this.targetState = key;
    this.transitionStartedAt = now;
    this.activeTransitionDuration = (key === 'thinking' || key === 'found') ? this.activationDurationMs : this.settleDurationMs;
    this.state = key;
  }

  setAudioLevels(levels) {
    this.targetAudioEnergy = levels.energy || 0;
  }

  start() {
    if (this.running) return;
    this.running = true;

    if (!this.webgpuSupported) {
      if (this.fallbackVisualizer) this.fallbackVisualizer.start();
      return;
    }

    const frame = (now) => {
      if (!this.running) return;

      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
        const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));

        if (this.canvas.width !== width || this.canvas.height !== height) {
          this.canvas.width = width;
          this.canvas.height = height;
          if (this.ribbonTarget) {
            this.ribbonTarget.destroy();
            this.ribbonTarget = null;
            this.ribbonCompositeBindGroup = null;
          }
        }

        this.audioEnergy += (this.targetAudioEnergy - this.audioEnergy) * 0.15;

        const sampled = this.sampleTransition(now);
        const values = new Float32Array(sampled);

        // Audio reactivity modulation
        if (this.audioEnergy > 0.01) {
          values[36] += this.audioEnergy * 0.65; // ribbonBreath
          values[38] += this.audioEnergy * 0.85; // particleBloom
          values[3]  += this.audioEnergy * 0.35; // speed
        }

        const frameDelta = this.lastFrameAt === null ? 0 : Math.min(0.1, Math.max(0, (now - this.lastFrameAt) / 1000));
        this.lastFrameAt = now;
        this.motionPhase += frameDelta * Math.max(values[3], 0);

        values[0] = width;
        values[1] = height;
        values[2] = this.motionPhase / Math.max(values[3], 0.001);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, values);

        const isParticleRibbon = Math.round(values[15]) === this.ribbonStyleIndex;
        const encoder = this.device.createCommandEncoder();

        if (isParticleRibbon) {
          if (!this.ribbonTarget || !this.ribbonCompositeBindGroup) {
            this.ribbonTarget = this.device.createTexture({
              size: { width, height },
              format: this.format,
              usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            });
            this.ribbonCompositeBindGroup = this.device.createBindGroup({
              layout: this.ribbonCompositePipeline.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: this.ribbonTarget.createView() },
                { binding: 2, resource: this.ribbonSampler },
              ],
            });
          }

          const particlePass = encoder.beginRenderPass({
            colorAttachments: [{
              view: this.ribbonTarget.createView(),
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          });
          particlePass.setPipeline(this.ribbonPipeline);
          particlePass.setBindGroup(0, this.ribbonBindGroup);
          particlePass.draw(6, this.ribbonInstanceCount);
          particlePass.end();
        }

        const pass = encoder.beginRenderPass({
          colorAttachments: [{
            view: this.context.getCurrentTexture().createView(),
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
        });

        if (isParticleRibbon) {
          pass.setPipeline(this.ribbonCompositePipeline);
          pass.setBindGroup(0, this.ribbonCompositeBindGroup);
        } else {
          pass.setPipeline(this.pipeline);
          pass.setBindGroup(0, this.bindGroup);
        }
        pass.draw(3);
        pass.end();

        this.device.queue.submit([encoder.finish()]);
        this.animationFrame = requestAnimationFrame(frame);
      } catch (err) {
        console.error('[StreamPulse Orb] Render loop error:', err);
        this.stop();
      }
    };

    this.animationFrame = requestAnimationFrame(frame);
  }

  stop() {
    this.running = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.fallbackVisualizer) {
      this.fallbackVisualizer.stop();
    }
  }

  destroy() {
    this.stop();
    if (this.ribbonTarget) {
      this.ribbonTarget.destroy();
      this.ribbonTarget = null;
    }
    if (this.device) {
      this.device.destroy();
      this.device = null;
    }
  }
}

window.StreamPulseLiquidOrb = StreamPulseLiquidOrb;
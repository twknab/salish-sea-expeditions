// Cockpit point of view (US8, research.md R3): ray-traced sea surface to a horizon, sky, and island
// silhouettes found by marching the land mask along each bearing. Bow and paddle are drawn on top.

export const POV_FRAG = /* glsl */ `
#pragma phaserTemplate(shaderName)
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 outTexCoord;
uniform sampler2D uMask;
uniform vec2 uMaskMin;
uniform vec2 uMaskSize;
uniform vec2 uBoat;
uniform float uHeading;
uniform float uRoll;
uniform float uPitch;
uniform float uAspect;
uniform float uTime;
uniform vec3 uSun;
uniform vec3 uSky;
uniform vec3 uLightCol;
uniform float uDay;
uniform float uSea;
uniform vec2 uWind;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec2 slope(vec2 p, float t) {
  vec2 wd = length(uWind) > 0.05 ? normalize(uWind) : vec2(0.3, 0.95);
  vec2 s = vec2(0.0);
  float amp = 0.15 + 1.2 * uSea;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float ang = (fi - 2.0) * 0.45 + sin(fi * 5.1) * 0.3;
    vec2 d = vec2(wd.x * cos(ang) - wd.y * sin(ang), wd.x * sin(ang) + wd.y * cos(ang));
    float lambda = 9.0 / (1.0 + fi * 0.7) * (0.7 + uSea);
    float k = 6.2831 / lambda;
    float c = sqrt(9.81 / k);
    float a = amp * 0.07 * lambda / (1.0 + fi);
    s += d * (a * k * cos(dot(d, p) * k - c * k * t + fi * 2.1));
  }
  s += (vec2(noise(p * 1.3 + t), noise(p * 1.3 - t + 7.0)) - 0.5) * (0.1 + 0.6 * uSea);
  return s;
}

void main() {
  vec2 uv = outTexCoord - 0.5;
  // Camera ray: y forward, z up, x right. Horizon sits a little above centre.
  vec3 d = normalize(vec3(uv.x * uAspect * 1.5, 1.0, uv.y * 1.5 - 0.22 + uPitch));
  float cr = cos(uRoll), sr = sin(uRoll);
  d = vec3(d.x * cr - d.z * sr, d.y, d.x * sr + d.z * cr);
  // To world: forward = (sin h, cos h), right = (cos h, -sin h).
  vec2 fw = vec2(sin(uHeading), cos(uHeading));
  vec2 rt = vec2(cos(uHeading), -sin(uHeading));
  vec2 hdir = rt * d.x + fw * d.y;
  float eye = 0.85;
  vec3 col;
  // Sky.
  float el = d.z;
  vec3 zen = mix(vec3(0.05, 0.08, 0.16), vec3(0.28, 0.46, 0.66), uDay);
  vec3 hor = mix(vec3(0.16, 0.18, 0.26), uSky * 1.1 + 0.08, uDay);
  vec3 sky = mix(hor, zen, smoothstep(0.0, 0.5, el));
  vec3 sd = normalize(uSun);
  vec3 wd3 = normalize(vec3(hdir, d.z));
  float sunA = max(dot(wd3, sd), 0.0);
  sky += uLightCol * (pow(sunA, 600.0) * 3.0 + pow(sunA, 12.0) * 0.25) * uDay;
  // Island silhouettes: march the mask along this bearing; highest angular height wins.
  vec2 dir2 = normalize(hdir);
  float best = -1.0;
  float first = 1e6;
  float dist = 60.0;
  for (int i = 0; i < 26; i++) {
    vec2 w = uBoat + dir2 * dist;
    vec4 m = texture2D(uMask, (w - uMaskMin) / uMaskSize);
    if (m.r > 0.5) {
      float az = atan(dir2.x, dir2.y);
      // Tree line: firs make a jagged skyline; rock bluffs where the land is thin.
      float h = 10.0 + 60.0 * m.g + 18.0 * noise(w * 0.02) + 14.0 * noise(vec2(az * dist * 0.08, 3.0)) * smoothstep(0.55, 0.8, m.r);
      best = max(best, atan(h / dist));
      first = min(first, dist);
    }
    dist *= 1.2;
  }
  float horizEl = atan(d.z / max(0.001, length(d.xy)));
  // Land hides the sky above it, and the water beyond its shoreline.
  bool isLand = best > horizEl && horizEl > -atan(eye / first);
  if (d.z > 0.0 || isLand) {
    col = sky;
    if (isLand) {
      float far = clamp(dist / 6000.0, 0.0, 1.0);
      vec3 isl = mix(vec3(0.07, 0.13, 0.09), hor * 0.9, 0.35 + 0.4 * far);
      col = mix(isl, sky, 0.15);
    }
  } else {
    // Water: intersect the sea plane.
    float t = eye / -d.z;
    vec2 p = uBoat + hdir * t;
    vec2 s = slope(p, uTime) * smoothstep(400.0, 20.0, t);
    vec3 n = normalize(vec3(-s, 1.0));
    vec3 v = -normalize(vec3(hdir, d.z));
    float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
    vec3 r = reflect(-v, n);
    vec3 rs = mix(hor, zen, smoothstep(0.0, 0.5, r.z));
    vec3 deep = vec3(0.02, 0.12, 0.15);
    col = mix(deep, rs, fres);
    float spec = pow(max(dot(r, sd), 0.0), 300.0) * 4.0;
    col += uLightCol * spec * uDay;
    float foam = smoothstep(0.62, 0.8, noise(p * 0.5 + uTime * 0.3)) * smoothstep(0.35, 0.9, uSea) * smoothstep(300.0, 10.0, t);
    col = mix(col, vec3(0.9, 0.95, 0.95), foam * 0.7);
    col = mix(col, hor, smoothstep(200.0, 3000.0, t));
  }
  col *= mix(vec3(0.3, 0.35, 0.5), vec3(1.0), uDay);
  gl_FragColor = vec4(col, 1.0);
}
`;

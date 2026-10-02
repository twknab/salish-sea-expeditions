// The world, top-down: water and islands in one full-screen shader (research.md R2).
// World coordinates are metres, north up. The fragment's outTexCoord (0..1, y up) maps to the
// camera's view rectangle.

export const WORLD_FRAG = /* glsl */ `
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
uniform vec2 uCam;      // camera centre, metres
uniform vec2 uView;     // view size, metres
uniform float uTime;    // seconds (visual time)
uniform vec3 uSun;      // direction toward the sun (x east, y north, z up)
uniform vec3 uSky;      // sky colour reflected in the water
uniform vec3 uLightCol; // colour of the light
uniform float uDay;     // 0 night .. 1 full day
uniform vec2 uWind;     // m/s, direction the air moves
uniform vec2 uCur;      // m/s, local current
uniform float uSea;     // 0..1 sea state
uniform float uFog;     // 0..1
uniform vec2 uBoat;     // player position, metres
uniform vec4 uRip0;     // x, y, radius, strength
uniform vec4 uRip1;
uniform float uQ;       // quality 0..1
uniform float uGlow;    // bioluminescence 0..1 (night paddles)

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    if (float(i) > 2.0 + uQ * 2.0) break;
    v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5;
  }
  return v;
}

vec4 mask(vec2 w) {
  vec2 uv = (w - uMaskMin) / uMaskSize;
  return texture2D(uMask, uv);
}

// Directional waves around the wind; returns the slope (dh/dx, dh/dy).
vec2 waveSlope(vec2 p, float t, float mpp) {
  vec2 wd = length(uWind) > 0.05 ? normalize(uWind) : vec2(0.3, 0.95);
  vec2 s = vec2(0.0);
  float amp = 0.12 + 0.9 * uSea;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float ang = (fi - 2.5) * 0.33 + sin(fi * 7.3) * 0.2;
    vec2 d = vec2(wd.x * cos(ang) - wd.y * sin(ang), wd.x * sin(ang) + wd.y * cos(ang));
    float lambda = 16.0 / (1.0 + fi * 0.9) * (0.8 + uSea);   // metres
    float k = 6.2831 / lambda;
    float c = sqrt(9.81 / k);                                  // deep-water phase speed
    float a = amp * 0.08 * lambda / (1.0 + fi);
    // Waves smaller than ~3 pixels would shimmer; fade them out.
    a *= smoothstep(2.0, 5.0, lambda / mpp);
    float ph = dot(d, p) * k - c * k * t + fi * 1.7;
    s += d * (a * k * cos(ph));
  }
  // Fine wind ripples, carried downwind.
  float r = fbm(p * 0.9 - uWind * t * 0.35);
  float r2 = fbm(p * 0.9 + vec2(0.37, 0.0) - uWind * t * 0.35);
  float r3 = fbm(p * 0.9 + vec2(0.0, 0.37) - uWind * t * 0.35);
  float ripple = (0.05 + 0.25 * clamp(length(uWind) / 7.0, 0.0, 1.0)) * smoothstep(0.6, 2.0, 1.0 / mpp);
  s += vec2(r2 - r, r3 - r) * ripple * 6.0;
  return s;
}

void main() {
  vec2 w = uCam + (outTexCoord - 0.5) * uView;
  float mpp = uView.x / 800.0;
  vec4 m = mask(w);
  // Break up the shoreline with detail the mask cannot hold.
  float detail = (fbm(w * 0.035) - 0.5) * 0.22 + (noise(w * 0.18) - 0.5) * 0.06;
  float land = m.r + detail * smoothstep(0.02, 0.2, m.r) * smoothstep(0.98, 0.8, m.r);
  float near = m.g;
  float t = uTime;

  vec3 col;
  float cloud = smoothstep(0.52, 0.8, fbm(w * 0.0011 + uWind * t * 0.004 + 3.0));

  if (land > 0.5) {
    // --- Islands: rock and pebble at the edge, then forest, with meadows on the dry tops.
    float e = land - 0.5;
    float h = near;                           // a stand-in for height: interior is higher
    vec2 grad = vec2(mask(w + vec2(12.0, 0.0)).g - mask(w - vec2(12.0, 0.0)).g,
                     mask(w + vec2(0.0, 12.0)).g - mask(w - vec2(0.0, 12.0)).g);
    float shade = clamp(0.75 - dot(grad * 18.0, uSun.xy) * 0.9, 0.35, 1.25);
    // Tree crowns: bright tops with shadowed gaps, lit from the sun's side.
    vec2 cp = w * 0.16;
    float c1 = noise(cp), c2 = noise(cp + uSun.xy * 0.35);
    float crowns = fbm(w * 0.05);
    vec3 fir = mix(vec3(0.05, 0.13, 0.08), vec3(0.16, 0.29, 0.15), crowns);
    fir *= 0.75 + 0.5 * smoothstep(0.35, 0.75, c1);          // crown tops
    fir *= 1.0 - 0.35 * smoothstep(0.5, 0.8, c2 - c1 + 0.5);  // self-shadow
    fir = mix(fir, vec3(0.20, 0.33, 0.14), smoothstep(0.72, 0.9, noise(w * 0.07 + 3.0)) * 0.5); // lighter deciduous
    float meadow = smoothstep(0.68, 0.76, fbm(w * 0.006 + 11.0)) * smoothstep(0.35, 0.7, h);
    vec3 grass = mix(vec3(0.47, 0.45, 0.27), vec3(0.58, 0.54, 0.33), noise(w * 0.2));
    vec3 forest = mix(fir, grass, meadow * 0.85);
    // Madrona on the bluffs: warm red-brown trunks peeking through near the edge.
    float madrona = smoothstep(0.78, 0.9, noise(w * 0.25)) * smoothstep(0.08, 0.02, e) * smoothstep(0.0, 0.015, e);
    forest = mix(forest, vec3(0.55, 0.24, 0.14), madrona * 0.8);
    vec3 rock = mix(vec3(0.42, 0.40, 0.36), vec3(0.62, 0.58, 0.50), noise(w * 0.6));
    vec3 sand = vec3(0.72, 0.64, 0.48);
    vec3 edge = mix(rock, sand, smoothstep(0.6, 0.75, fbm(w * 0.01 + 5.0)));
    col = mix(edge, forest, smoothstep(0.02, 0.06, e));
    // Driftwood and dry seaweed at the tide line; a dark wet margin right at the water.
    float wrack = smoothstep(0.7, 0.85, noise(w * 0.5 + 2.0)) * smoothstep(0.03, 0.012, e) * smoothstep(0.004, 0.012, e);
    col = mix(col, vec3(0.36, 0.30, 0.2), wrack * 0.7);
    col = mix(col, vec3(0.22, 0.2, 0.17), smoothstep(0.012, 0.0, e) * 0.6);
    col *= shade;
    // Canopy relief: every crown casts a shadow onto the one behind it, toward the sun.
    col *= 0.78 + 0.22 * smoothstep(0.3, 0.75, noise(cp * 1.9 + uSun.xy * 0.8));
    // Tree shadows toward the low sun.
    col *= 0.85 + 0.15 * smoothstep(0.3, 0.7, noise((w + uSun.xy * 3.0) * 0.09));
  } else {
    // --- Water.
    vec2 slope = waveSlope(w, t, mpp);
    // Rips: steep, confused water where current meets a point.
    float rip = 0.0;
    rip = max(rip, uRip0.w * smoothstep(uRip0.z, uRip0.z * 0.2, length(w - uRip0.xy)));
    rip = max(rip, uRip1.w * smoothstep(uRip1.z, uRip1.z * 0.2, length(w - uRip1.xy)));
    if (rip > 0.001) {
      float ch = fbm(w * 0.12 + vec2(t * 0.6, -t * 0.9));
      float ch2 = fbm(w * 0.12 + vec2(0.3, 0.0) + vec2(t * 0.6, -t * 0.9));
      float ch3 = fbm(w * 0.12 + vec2(0.0, 0.3) + vec2(t * 0.6, -t * 0.9));
      slope += vec2(ch2 - ch, ch3 - ch) * rip * 9.0;
    }
    vec3 n = normalize(vec3(-slope, 1.0));
    float depth = pow(near, 1.6);
    vec3 deep = vec3(0.02, 0.12, 0.19);
    vec3 mid = vec3(0.05, 0.28, 0.33);
    vec3 shallow = vec3(0.16, 0.50, 0.46);
    vec3 base = mix(deep, mid, smoothstep(0.0, 0.5, depth));
    base = mix(base, shallow, smoothstep(0.45, 0.95, depth));
    // Sea floor showing through the shallows: pale sand, eelgrass patches and dark boulders, with
    // the light caustics playing over them.
    float floorN = fbm(w * 0.05), boulders = smoothstep(0.66, 0.74, fbm(w * 0.09 + 17.0));
    vec3 seabed = mix(vec3(0.52, 0.56, 0.42), vec3(0.14, 0.30, 0.18), smoothstep(0.5, 0.65, fbm(w * 0.02 + 9.0)));
    seabed = mix(seabed, vec3(0.16, 0.17, 0.15), boulders);
    float caustic = 0.85 + 0.3 * smoothstep(0.55, 0.8, fbm(w * 0.35 + vec2(t * 0.5, t * 0.3)));
    base = mix(base, seabed * caustic, smoothstep(0.78, 1.0, depth) * (0.45 + 0.25 * floorN));

    // Wind patches: glassy water mirrors the sky; ruffled water is darker and textured.
    float windK = clamp(length(uWind) / 6.0, 0.0, 1.0);
    float ruffle = smoothstep(0.35, 0.7, fbm(w * 0.0025 - uWind * t * 0.012 + 20.0) + windK * 0.35 - 0.15);
    ruffle = clamp(max(ruffle, uSea * 0.8), 0.0, 1.0);
    float fres = pow(1.0 - n.z, 3.0) * 0.9 + 0.04;
    float mirror = mix(0.42, 0.12, ruffle);
    vec3 col0 = mix(base, uSky, clamp(fres + mirror, 0.0, 0.7));
    // Long, soft sheen bands on glassy water.
    col0 += uSky * 0.06 * (1.0 - ruffle) * smoothstep(0.4, 0.9, fbm(vec2(w.x * 0.004, w.y * 0.0015) + t * 0.01));
    vec3 hv = normalize(uSun + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(n, hv), 0.0), 220.0) * 2.4 + pow(max(dot(n, hv), 0.0), 36.0) * 0.16 + pow(max(dot(n, hv), 0.0), 8.0) * 0.03;
    // Sub-pixel glitter: when waves are too small to draw, draw their sparkle instead.
    vec2 cell = floor(gl_FragCoord.xy * 0.5);
    float tw = hash(cell + floor(t * 6.0 + hash(cell) * 6.0));
    // Sparse, and only where the ruffled surface can catch the sun.
    float glitter = step(0.9975 - 0.0015 * ruffle, tw) * smoothstep(0.8, 3.0, mpp) * ruffle;
    glitter *= smoothstep(0.1, 0.5, uSun.z) * 0.8 + 0.2;
    col0 += uLightCol * (spec + glitter * 0.55) * uDay * (1.0 - cloud * 0.8);

    // Current made visible: streaks and slicks drawn out along the flow.
    float cs = length(uCur);
    if (cs > 0.05) {
      vec2 cd = uCur / cs;
      vec2 q = vec2(dot(w, vec2(cd.y, -cd.x)), dot(w, cd));
      float bend = fbm(vec2(q.x * 0.002, q.y * 0.002)) * 40.0;
      float st = fbm(vec2((q.x + bend) * 0.012, q.y * 0.0015 - t * cs * 0.004));
      float lines = pow(1.0 - abs(st * 2.0 - 1.0), 22.0);
      float slick = smoothstep(0.62, 0.7, fbm(vec2(q.x * 0.01, q.y * 0.003 - t * cs * 0.008) + 7.0));
      float k = smoothstep(0.1, 0.9, cs);
      col0 = mix(col0, col0 * 1.15 + vec3(0.05), lines * k * 0.6);
      col0 = mix(col0, uSky * 0.9, slick * k * 0.25);
    }

    // Kelp: golden-brown bulbs and blades streaming with the current.
    float kelp = m.b * smoothstep(0.35, 0.6, fbm(w * 0.018 + 4.0) + m.g * 0.4);
    if (kelp > 0.05) {
      vec2 cd = cs > 0.05 ? uCur / cs : vec2(0.0, 1.0);
      vec2 kp = w * 0.35 + cd * sin(t * 0.8 + w.x * 0.1) * 0.4;
      float bulbs = smoothstep(0.78, 0.86, noise(kp)) ;
      float blades = smoothstep(0.55, 0.75, fbm(vec2(dot(w, vec2(cd.y, -cd.x)) * 0.25, dot(w, cd) * 0.06)));
      vec3 kc = mix(vec3(0.36, 0.28, 0.10), vec3(0.62, 0.48, 0.20), noise(kp * 2.0));
      col0 = mix(col0, kc, clamp(bulbs + blades * 0.6, 0.0, 1.0) * smoothstep(0.1, 0.5, kelp));
    }

    // Foam: shoreline lapping, whitecaps in wind, and the rip's broken water.
    float lap = smoothstep(0.34, 0.49, land) * (0.55 + 0.45 * sin(land * 90.0 - t * 1.7 + fbm(w * 0.08) * 6.0));
    float caps = smoothstep(0.72, 0.9, fbm(w * 0.08 - uWind * t * 0.05)) * smoothstep(0.45, 0.9, uSea);
    float ripFoam = smoothstep(0.55, 0.8, fbm(w * 0.16 + vec2(t * 0.5, -t * 0.8))) * rip;
    // Crests: where the water is steep it breaks a little, more as the sea gets up.
    float crest = smoothstep(0.55, 1.1, length(slope)) * smoothstep(0.25, 0.8, uSea) * 0.6;
    float foam = clamp(lap * 0.8 + caps * 0.7 + ripFoam * 0.9 + crest, 0.0, 1.0);
    col0 = mix(col0, vec3(0.92, 0.96, 0.95), foam * (0.55 + 0.45 * noise(w * 0.9 + t)));
    // The wet, dark band just under the shore, and the pale sand where the land begins.
    col0 = mix(col0, vec3(0.30, 0.42, 0.40), smoothstep(0.38, 0.49, land) * 0.5);

    // Night: bioluminescence where the water is disturbed near the boat.
    if (uGlow > 0.0) {
      float dist = length(w - uBoat);
      float spark = smoothstep(0.86, 0.95, noise(w * 1.4 + t * 0.7)) * smoothstep(40.0, 4.0, dist);
      col0 += vec3(0.25, 0.8, 1.0) * spark * uGlow;
    }
    col = col0;
  }

  // Cloud shadows drifting over everything.
  col *= 1.0 - cloud * 0.22 * uDay;
  // Light of the hour.
  col *= mix(vec3(0.20, 0.26, 0.42), uLightCol, uDay);
  // Fog: close things stay clear, the distance goes white.
  if (uFog > 0.0) {
    float d = length(w - uBoat);
    float f = uFog * smoothstep(30.0, 700.0, d) * (0.85 + 0.15 * fbm(w * 0.004 + t * 0.02));
    col = mix(col, vec3(0.80, 0.84, 0.84) * mix(0.35, 1.0, uDay), clamp(f, 0.0, 0.96));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

/** Sun direction, light colour and sky colour for a minute of the day. */
export function daylight(minute, sunrise = 330, sunset = 1270) {
  const dayLen = sunset - sunrise;
  const f = (minute - sunrise) / dayLen; // 0 sunrise .. 1 sunset
  const elev = Math.sin(Math.PI * Math.min(1, Math.max(0, f))) * 0.95; // radians-ish, max ~55°
  const az = Math.PI * 0.5 + Math.PI * f; // east → south → west
  const up = Math.max(0.05, Math.sin(elev));
  const horiz = Math.cos(elev);
  const sun = [Math.sin(az) * horiz, Math.cos(az) * horiz, up];
  const len = Math.hypot(...sun);
  const day = Math.max(0, Math.min(1, (Math.min(minute - sunrise, sunset - minute) + 30) / 90));
  const golden = 1 - Math.min(1, Math.min(minute - sunrise, sunset - minute) / 120);
  const g = Math.max(0, golden);
  const light = [1.0, 0.97 - 0.12 * g, 0.92 - 0.3 * g];
  const sky = [0.46 + 0.35 * g, 0.62 + 0.05 * g, 0.72 - 0.2 * g];
  return { sun: sun.map((v) => v / len), light, sky, day };
}

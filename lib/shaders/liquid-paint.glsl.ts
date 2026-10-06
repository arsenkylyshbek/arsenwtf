// Fragment shader. This file is the source of truth; uniforms are declared in index.ts.
export const fragment = /* glsl */ `
uniform vec2  u_res;
uniform float u_time;
uniform float u_scale;     // pattern zoom
uniform float u_warp;      // how much the flow folds the ribbons
uniform float u_flow;      // animation speed
uniform float u_coverage;  // paint vs bare surface
uniform float u_bands;     // ribbon count
uniform float u_goldMix;   // share of ribbons that are gold
uniform float u_ribbon;    // ribbon width
uniform float u_flakes;    // glitter cells per screen height
uniform float u_sparkle;   // glint strength
uniform float u_gloss;     // clear-coat reflection strength
uniform float u_thick;     // paint body height
uniform float u_rim;       // width of the rounded rim
uniform float u_rough;     // raggedness of the paint's edge
uniform float u_shadow;    // cast shadow strength
uniform float u_shadowSoft;// cast shadow blur, fraction of height
uniform float u_shadowDist;// cast shadow offset (light from upper-left)
uniform vec3  u_bg;
uniform vec3  u_blue;
uniform vec3  u_light;
uniform vec3  u_gold;
out vec4 o;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec3 hash3(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.xxy + q.yzz) * q.zyx);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
const mat2 R = mat2(1.6, 1.2, -1.2, 1.6);
float fbm3(vec2 p) {
  return (0.5 * noise(p) + 0.25 * noise(R * p) + 0.125 * noise(R * R * p)) / 0.875;
}
float fbm2(vec2 p) {
  return (0.5 * noise(p) + 0.25 * noise(R * p)) / 0.75;
}

// Fake studio: ceiling gradient, a big soft box and a small hard key.
// r is a reflected direction; r.xy = 0 means straight up.
float env(vec3 r) {
  float e = 0.08 * smoothstep(-0.2, 1.0, r.z);
  e += 0.85 * smoothstep(1.0, 0.35, length((r.xy - vec2(-0.06, 0.07)) / vec2(0.11, 0.05)));
  e += 1.6 * smoothstep(1.0, 0.5, length((r.xy - vec2(0.3, 0.26)) / vec2(0.05, 0.035)));
  return e;
}

float mask(vec2 p, vec2 d) {
  float m = fbm2(p * 0.28 + d * 0.25 + vec2(3.1, 7.7));
  // ragged edge: finer noise only matters where m crosses the threshold
  return m + u_rough * ((noise(p * 2.3 + d * 1.5) - 0.5) * 0.06 +
                        (noise(p * 7.1 - d) - 0.5) * 0.03);
}

// one glitter layer: a single disc per cell with a random tilt
vec3 glitter(vec2 gp, vec3 n, float t, float strength, vec3 tint) {
  vec2 id = floor(gp);
  vec2 f = fract(gp) - 0.5;
  vec3 h = hash3(id);
  vec2 c = (h.xy - 0.5) * 0.45;
  float r = 0.1 + 0.22 * h.z * h.z;
  float on = step(fract(h.z * 31.7 + h.x), 0.5);   // only half the cells hold a flake
  float aa = length(fwidth(gp)) * 0.7;
  float disc = 1.0 - smoothstep(r - aa, r + aa, length(f - c));
  float ang = h.x * 6.2832 + t * (0.6 + h.y);
  vec3 nf = normalize(n + vec3(vec2(cos(ang), sin(ang)) * (0.1 + 0.5 * h.y), 0.0));
  float glint = env(reflect(vec3(0, 0, -1), nf));
  return on * disc * tint * (0.1 + 0.45 * fract(h.y * 17.3) + strength * glint * glint);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 p = (frag - 0.5 * u_res) / u_res.y * u_scale;
  float t = u_time * u_flow;

  // --- flow: three warps, big & slow to small & fast
  vec2 w = p;
  vec2 d1 = vec2(fbm3(w * 0.6 + vec2(0.0, t)), fbm3(w * 0.6 + vec2(5.2, -t))) - 0.5;
  w += u_warp * d1;
  vec2 d2 = vec2(fbm3(w * 1.3 + vec2(1.7, 9.2) + 0.6 * t), fbm3(w * 1.3 + vec2(8.3, 2.8) - 0.6 * t)) - 0.5;
  w += u_warp * 0.45 * d2;
  vec2 d3 = vec2(fbm3(w * 2.8 + 3.0), fbm3(w * 2.8 + 11.0)) - 0.5;
  w += u_warp * 0.12 * d3;

  // --- paint body: outline + thickness
  float th = 1.0 - u_coverage;
  float m = mask(p, d1);
  float aaM = fwidth(m);
  float inside = smoothstep(th - aaM, th + aaM, m);
  float x = clamp((m - th) / u_rim, 0.0, 1.0);
  float T = 1.0 - (1.0 - x) * (1.0 - x) * (1.0 - x); // meniscus: steep at edge, flat on top

  // --- ribbons: iso-lines of a warped linear field
  float s = dot(w, normalize(vec2(0.45, 1.0))) * u_bands;
  float bid = floor(s);
  float fr = fract(s);
  vec3 bh = hash3(vec2(bid, bid * 1.7 + 3.1));
  float swell = noise(w * 1.4 + bid * 7.13);
  float width = u_ribbon * (0.1 + 1.5 * swell * swell) * (0.5 + bh.y);
  float dist = abs(fr - (0.25 + 0.5 * bh.x));
  float aaS = fwidth(s);
  float rib = 1.0 - smoothstep(width - aaS, width + aaS, dist);
  float ribCore = 1.0 - smoothstep(width * 0.5 - aaS, width * 0.5 + aaS, dist);
  float isGold = step(bh.z, u_goldMix);
  float isLight = step(u_goldMix, bh.z) * step(bh.z, u_goldMix + 0.25);
  float gold = rib * isGold;

  // --- base colour (diffuse layer under the clear coat)
  float tone = smoothstep(-0.25, 0.25, d2.x);
  vec3 base = u_blue * mix(0.55, 1.15, tone);
  base = mix(base, u_light, 0.35 * smoothstep(0.1, 0.35, d3.y));            // hazy streaks
  base = mix(base, u_light, rib * isLight * 0.6);                    // light ribbons
  base = mix(base, u_gold * 0.8, gold);                                      // metal body
  base *= 1.0 - 0.3 * (rib - ribCore) * isGold;                             // dark vein edges
  base *= mix(0.72, 1.0, smoothstep(0.0, 0.4, T));                           // rolled edge reads deeper

  // --- surface height (in screen-height units) -> normal
  float H = u_thick * (T + 0.6 * tone + 0.5 * d3.x + 0.2 * gold);
  vec2 g = vec2(dFdx(H), dFdy(H)) * u_res.y;
  vec3 n = normalize(vec3(-g, 1.0));
  vec3 refl = reflect(vec3(0, 0, -1), n);
  float fres = 0.2 + 0.45 * pow(1.0 - n.z, 3.0);
  vec3 specTint = mix(vec3(1.0), u_gold * 1.6 + 0.2, gold);
  // the steep rim would mirror the whole studio; damp it so the edge stays blue
  vec3 spec = env(refl) * fres * u_gloss * specTint * mix(0.45, 1.0, smoothstep(0.0, 0.5, T));
  float diff = 0.8 + 0.2 * dot(n, normalize(vec3(-0.3, 0.5, 0.8)));

  // --- glitter, moving with the big swirls; second layer sits deeper and dimmer
  vec2 fp = (p + 0.35 * d1 * u_warp) / u_scale * u_flakes;
  vec3 gTint = mix(vec3(0.75, 0.88, 1.0), vec3(1.0, 0.85, 0.5), gold);
  vec3 flakes = glitter(fp, n, u_time, u_sparkle, gTint)
              + 0.45 * glitter(fp * 1.63 + 17.0, n, u_time * 0.7, u_sparkle * 0.5, gTint * vec3(0.6, 0.75, 1.0));
  flakes *= smoothstep(0.0, 0.2, T);

  vec3 paint = base * diff + spec + flakes;

  // --- bare surface: soft cast shadow (light from upper-left) + contact darkening
  float ms = mask(p + vec2(0.55, -0.83) * u_shadowDist * u_scale, d1);
  // signed distance to the shadow's edge in px (first-order), so softness is a
  // real on-screen blur instead of a band of the noise field
  float sd = (ms - th) / max(length(vec2(dFdx(ms), dFdy(ms))), 1e-6);
  float soft = max(u_shadowSoft * u_res.y, 1.0);
  float shadow = smoothstep(-soft, soft * 0.3, sd) * u_shadow;
  // fade with distance from the real paint edge, like a shadow does
  float pd = (th - m) / max(length(vec2(dFdx(m), dFdy(m))), 1e-6);
  shadow *= 1.0 - smoothstep(0.0, u_shadowDist * u_res.y * 1.5 + soft, pd);
  float contact = smoothstep(th - 0.006, th, m) * u_shadow * 0.6;
  vec3 bg = u_bg * (1.0 - shadow - contact);

  o = vec4(mix(bg, paint, inside), 1.0);
}
`;

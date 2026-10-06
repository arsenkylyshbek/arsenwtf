// Fragment shader. This file is the source of truth; uniforms are declared in index.ts.
export const fragment = /* glsl */ `
uniform vec2  u_res;
uniform float u_time;
uniform float u_ribs;      // flutes across the width
uniform float u_angle;     // rib tilt, degrees
uniform float u_refract;   // how much each flute magnifies/flips what's behind it
uniform float u_shade;     // crease darkness between flutes
uniform float u_glow;      // aurora intensity
uniform float u_height;    // aurora reach (0..1 of height)
uniform float u_grain;
uniform vec3  u_deep;      // top / shadow
uniform vec3  u_blue;      // body
uniform vec3  u_aurora;    // aurora tip
uniform vec3  u_aurora2;   // aurora base
out vec4 o;

float h1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float n1(float x) {
  float i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(h1(i), h1(i + 1.0), f);
}
float fbm1(float x) { return n1(x) * 0.6 + n1(x * 2.3 + 7.0) * 0.3 + n1(x * 5.1 + 3.0) * 0.1; }

// What sits "behind" the glass. uv in 0..1.
vec3 scene(vec2 uv, float t) {
  // blue body, darker toward the top centre
  vec3 col = mix(u_blue, u_deep, smoothstep(0.1, 1.0, uv.y));
  float hole = length((uv - vec2(0.5, 1.0)) * vec2(1.3, 1.0));
  col = mix(u_deep * 0.6, col, smoothstep(0.15, 0.75, hole));

  // aurora curtains: per-x height from slow-moving noise
  float curtain = smoothstep(0.25, 0.75, fbm1(uv.x * 3.6 + t * 0.05));
  float h = u_height * (0.12 + 0.85 * curtain);
  float a = 1.0 - smoothstep(0.0, h, uv.y);
  a = pow(a, 1.2) * (0.5 + 0.5 * n1(uv.x * 7.0 + t * 0.1));
  float rays = 0.6 + 0.4 * n1(uv.x * 22.0 - t * 0.25);
  vec3 ac = mix(u_aurora2, u_aurora, smoothstep(0.0, h, uv.y));
  col *= 1.0 - 0.8 * a;                 // aurora replaces some of the blue
  return col + ac * a * rays * u_glow;
}

// flute: each rib is a lens sampling a squeezed, flipped slice of the scene.
// Work in width-normalised, centred space rotated by u_angle so ribs can tilt.
vec3 flute(vec2 frag, mat2 rot, float t) {
  vec2 rp = rot * ((frag - 0.5 * u_res) / u_res.x);
  float fx = rp.x * u_ribs;
  float id = floor(fx);
  float f = fract(fx);
  rp.x = (id + 0.5 + (f - 0.5) * u_refract) / u_ribs;
  rp.y += (f - 0.5) * (f - 0.5) * 0.04;
  vec2 suv = (rp * rot) * u_res.x / u_res + 0.5;
  vec3 col = scene(suv, t);

  col *= 0.85 + 0.3 * h1(id + 3.0);                       // per-rib variance
  col *= mix(1.0 - u_shade, 1.0, smoothstep(0.0, 0.45, f)); // crease
  col += pow(f, 12.0) * 0.18 * vec3(0.55, 0.75, 1.0);      // rim highlight
  return col;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  float t = u_time;
  float a = radians(u_angle);
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));

  // Rib seams are hard edges; when tilted they stair-step. Supersample 4x,
  // but only on pixels that straddle a seam (a few % of the screen).
  float fx = (rot * ((frag - 0.5 * u_res) / u_res.x)).x * u_ribs;
  float fw = fwidth(fx);
  float f = fract(fx);
  vec3 col;
  if (min(f, 1.0 - f) < fw) {
    col = 0.25 * (flute(frag + vec2(-0.125, -0.375), rot, t) +
                  flute(frag + vec2( 0.375, -0.125), rot, t) +
                  flute(frag + vec2( 0.125,  0.375), rot, t) +
                  flute(frag + vec2(-0.375,  0.125), rot, t));
  } else {
    col = flute(frag, rot, t);
  }

  // grain doubles as dither (kills gradient banding)
  col += (fract(sin(dot(frag + fract(t) * 13.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * u_grain;
  o = vec4(col, 1.0);
}
`;

import type { Uniforms } from "./core";
import { fragment as flutedAuroraFragment } from "./fluted-aurora.glsl";
import { fragment as liquidPaintFragment } from "./liquid-paint.glsl";

/**
 * The shader catalogue. Plain data, like content/site.ts — adding a shader is
 * a GLSL file plus one entry here; the index and studio pages pick it up.
 */

/** `prop` is the parameter's name in the arsen-shaders npm package. */
export type Control =
  | { key: string; prop: string; label: string; kind: "range"; min: number; max: number; step: number }
  | { key: string; prop: string; label: string; kind: "color" };

export type ShaderDef = {
  slug: string;
  name: string;
  /** One line. Used on the index card and as the page lead. */
  blurb: string;
  fragment: string;
  defaults: Uniforms;
  groups: { title: string; controls: Control[] }[];
  /** Partial overrides on top of defaults. The first one should be {}. */
  presets: { name: string; values: Uniforms }[];
  /** Painted behind the canvas until the first frame, and forever without WebGL. */
  fallback: string;
  /** Its React component in arsen-shaders/react. */
  component: string;
};

const range = (key: string, prop: string, label: string, min: number, max: number, step: number): Control => ({
  key,
  prop,
  label,
  kind: "range",
  min,
  max,
  step,
});
const color = (key: string, prop: string, label: string): Control => ({ key, prop, label, kind: "color" });

export const SHADERS: ShaderDef[] = [
  {
    slug: "fluted-aurora",
    name: "fluted aurora",
    blurb: "ribbed glass over a deep blue field, with an aurora rising from below.",
    fragment: flutedAuroraFragment,
    defaults: {
      u_ribs: 34,
      u_angle: 0,
      u_refract: -1.6,
      u_shade: 0.55,
      u_glow: 1.15,
      u_height: 0.8,
      u_grain: 0.035,
      u_deep: "#030a2e",
      u_blue: "#1236c8",
      u_aurora: "#1fa7a6",
      u_aurora2: "#3fbf72",
    },
    groups: [
      {
        title: "glass",
        controls: [
          range("u_ribs", "ribs", "ribs", 6, 80, 1),
          range("u_angle", "angle", "angle", -90, 90, 1),
          range("u_refract", "refraction", "refraction", -4, 4, 0.05),
          range("u_shade", "crease", "crease", 0, 1, 0.01),
        ],
      },
      {
        title: "light",
        controls: [
          range("u_glow", "glow", "glow", 0, 3, 0.01),
          range("u_height", "height", "height", 0, 1, 0.01),
          range("u_grain", "grain", "grain", 0, 0.15, 0.005),
        ],
      },
      {
        title: "colour",
        controls: [
          color("u_deep", "deep", "deep"),
          color("u_blue", "body", "body"),
          color("u_aurora", "aurora", "aurora"),
          color("u_aurora2", "auroraBase", "aurora base"),
        ],
      },
    ],
    presets: [
      { name: "banner", values: {} },
      {
        name: "curtain",
        values: { u_ribs: 6, u_angle: -4, u_refract: -2.35, u_shade: 0.48, u_glow: 1.71, u_height: 0.72, u_grain: 0.05 },
      },
      { name: "fine", values: { u_ribs: 64, u_refract: -1, u_shade: 0.35, u_glow: 0.9 } },
      {
        name: "acid",
        values: { u_deep: "#020617", u_blue: "#0b3b8c", u_aurora: "#2dd4bf", u_aurora2: "#a3e635", u_glow: 1.4 },
      },
    ],
    fallback: "linear-gradient(180deg, #030a2e 0%, #1236c8 80%, #1fa7a6 100%)",
    component: "FlutedAurora",
  },
  {
    slug: "liquid-paint",
    name: "liquid paint",
    blurb: "poured glitter paint with gold ribbons, drying on a white surface.",
    fragment: liquidPaintFragment,
    defaults: {
      u_scale: 1.6,
      u_warp: 1.6,
      u_flow: 0.04,
      u_coverage: 0.56,
      u_bands: 5,
      u_goldMix: 0.35,
      u_ribbon: 0.07,
      u_flakes: 260,
      u_sparkle: 1.4,
      u_gloss: 1,
      u_thick: 0.02,
      u_rim: 0.08,
      u_rough: 0.6,
      u_shadow: 0.14,
      u_shadowSoft: 0.012,
      u_shadowDist: 0.036,
      u_bg: "#f2f2ef",
      u_blue: "#1a43a6",
      u_light: "#7cc0ea",
      u_gold: "#c9913f",
    },
    groups: [
      {
        title: "flow",
        controls: [
          range("u_scale", "scale", "scale", 0.5, 5, 0.01),
          range("u_warp", "warp", "warp", 0, 4, 0.01),
          range("u_flow", "speed", "speed", 0, 0.3, 0.005),
          range("u_coverage", "coverage", "coverage", 0, 1, 0.01),
        ],
      },
      {
        title: "ribbons",
        controls: [
          range("u_bands", "ribbons", "count", 1, 15, 0.1),
          range("u_goldMix", "goldShare", "gold share", 0, 1, 0.01),
          range("u_ribbon", "ribbonWidth", "width", 0.005, 0.25, 0.001),
        ],
      },
      {
        title: "surface",
        controls: [
          range("u_flakes", "glitter", "glitter", 50, 600, 1),
          range("u_sparkle", "sparkle", "sparkle", 0, 4, 0.01),
          range("u_gloss", "gloss", "gloss", 0, 2, 0.01),
          range("u_thick", "thickness", "thickness", 0, 0.05, 0.0005),
          range("u_rim", "rim", "rim", 0.01, 0.3, 0.001),
        ],
      },
      {
        title: "edge",
        controls: [
          range("u_rough", "roughness", "roughness", 0, 3, 0.01),
          range("u_shadow", "shadow", "shadow", 0, 0.5, 0.01),
          range("u_shadowSoft", "shadowSoftness", "softness", 0.001, 0.08, 0.001),
          range("u_shadowDist", "shadowDistance", "distance", 0, 0.15, 0.001),
        ],
      },
      {
        title: "colour",
        controls: [
          color("u_bg", "surface", "surface"),
          color("u_blue", "paint", "paint"),
          color("u_light", "streak", "streak"),
          color("u_gold", "gold", "gold"),
        ],
      },
    ],
    presets: [
      { name: "speedrun", values: {} },
      { name: "gold rush", values: { u_goldMix: 0.65, u_ribbon: 0.12, u_bands: 6, u_coverage: 0.7 } },
      { name: "flood", values: { u_coverage: 1, u_scale: 2.4, u_warp: 2.2 } },
      {
        name: "ink",
        values: { u_blue: "#14161d", u_light: "#5b6475", u_gold: "#d9d4c7", u_goldMix: 0.45, u_sparkle: 2 },
      },
    ],
    fallback: "#1a43a6",
    component: "LiquidPaint",
  },
];

export function getShader(slug: string) {
  return SHADERS.find((s) => s.slug === slug);
}

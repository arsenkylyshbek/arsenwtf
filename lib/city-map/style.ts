import type {
  ExpressionSpecification,
  LayerSpecification,
  StyleSpecification,
} from "maplibre-gl";

/**
 * The city map's look, as a function of one number: t, 0 = day, 1 = night.
 *
 * Day is the site's paper: cream land, ink streets, brown contour lines.
 * Night is the view from a plane on approach: dark ground, sodium streets,
 * a soft glow around the big roads, contours fading to a faint blue trace.
 *
 * Every paint value that depends on t is listed in one table, so the style can
 * be built once and then re-tinted with setPaintProperty as the clock moves —
 * no rebuild, no tile reload.
 */

type Value = string | number;
type Pair = { day: Value; night: Value };
type Layer = {
  id: string;
  type: LayerSpecification["type"];
  source?: string;
  "source-layer"?: string;
  filter?: ExpressionSpecification;
  minzoom?: number;
  layout?: Record<string, unknown>;
  paint?: Record<string, unknown>;
  /** Paint properties that blend between day and night. */
  tint?: Record<string, Pair>;
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t);
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
};

const blend = (p: Pair, t: number): Value =>
  typeof p.day === "string" ? mixHex(p.day, p.night as string, t) : p.day + ((p.night as number) - p.day) * t;

// Widths scale with zoom exponentially, like the real thing on screen.
const width = (stops: [number, number][]): ExpressionSpecification => [
  "interpolate",
  ["exponential", 1.6],
  ["zoom"],
  ...stops.flat(),
];

const scaled = (stops: [number, number][], k: number) =>
  width(stops.map(([z, w]) => [z, w * k] as [number, number]));

const MINOR: [number, number][] = [[12, 0.25], [14, 0.7], [17, 3]];
const MAJOR: [number, number][] = [[10, 0.5], [13, 1.2], [17, 6]];
const HIGHWAY: [number, number][] = [[10, 0.9], [13, 1.8], [17, 8]];

const kind = (...kinds: string[]): ExpressionSpecification => [
  "in",
  ["get", "kind"],
  ["literal", kinds],
];

const WATER = { day: "#dfe3dc", night: "#04060b" };

const LAYERS: Layer[] = [
  { id: "water-bg", type: "background", tint: { "background-color": WATER } },
  {
    id: "earth",
    type: "fill",
    source: "base",
    "source-layer": "earth",
    tint: { "fill-color": { day: "#f5f0e4", night: "#0c0e15" } },
  },
  {
    id: "green",
    type: "fill",
    source: "base",
    "source-layer": "landuse",
    filter: kind("park", "nature_reserve", "golf_course", "cemetery", "grass", "wood", "forest", "garden", "recreation_ground", "playground"),
    tint: { "fill-color": { day: "#e7e7d3", night: "#0a110e" } },
  },
  {
    id: "water",
    type: "fill",
    source: "base",
    "source-layer": "water",
    tint: { "fill-color": WATER },
  },
  {
    id: "contours-minor",
    type: "line",
    source: "contours",
    "source-layer": "contours",
    filter: ["!", ["get", "major"]],
    paint: { "line-width": width([[10, 0.35], [15, 0.8]]) },
    tint: {
      "line-color": { day: "#c4b89c", night: "#1d2740" },
      "line-opacity": { day: 0.85, night: 0.7 },
    },
  },
  {
    id: "contours-major",
    type: "line",
    source: "contours",
    "source-layer": "contours",
    filter: ["get", "major"],
    paint: { "line-width": width([[10, 0.7], [15, 1.5]]) },
    tint: {
      "line-color": { day: "#a8987a", night: "#2a3a63" },
      "line-opacity": { day: 0.9, night: 0.8 },
    },
  },
  {
    id: "buildings",
    type: "fill",
    source: "base",
    "source-layer": "buildings",
    minzoom: 14,
    tint: {
      "fill-color": { day: "#ece5d5", night: "#10121b" },
      "fill-opacity": { day: 0.9, night: 0.95 },
    },
  },

  // --- night glow: wide, blurred, invisible by day
  {
    id: "glow-minor",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("minor_road", "other"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-width": scaled(MINOR, 4), "line-blur": scaled(MINOR, 3), "line-color": "#ff8f33" },
    tint: { "line-opacity": { day: 0, night: 0.07 } },
  },
  {
    id: "glow-major",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("major_road", "highway"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-width": scaled(MAJOR, 6), "line-blur": scaled(MAJOR, 4), "line-color": "#ff8a2a" },
    tint: { "line-opacity": { day: 0, night: 0.42 } },
  },

  // --- streets: ink by day, sodium by night
  {
    id: "roads-minor",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("minor_road", "other"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-width": width(MINOR) },
    tint: { "line-color": { day: "#cdc3ad", night: "#a8692e" }, "line-opacity": { day: 1, night: 0.5 } },
  },
  {
    id: "roads-major",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("major_road"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-width": width(MAJOR) },
    tint: { "line-color": { day: "#9e937c", night: "#ffbd6e" } },
  },
  {
    id: "roads-highway",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("highway"),
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-width": width(HIGHWAY) },
    tint: { "line-color": { day: "#857a64", night: "#ffe1a8" } },
  },

  // --- car lights: dashes crawling along the big roads (animated in the component)
  {
    id: "traffic",
    type: "line",
    source: "base",
    "source-layer": "roads",
    filter: kind("major_road", "highway"),
    minzoom: 11,
    paint: {
      "line-width": scaled(MAJOR, 0.45),
      "line-color": "#fff4dc",
      "line-dasharray": [0, 4, 3],
    },
    tint: { "line-opacity": { day: 0, night: 0.85 } },
  },
];

export const TRAFFIC_LAYER = "traffic";

export function buildStyle(tilesBase: string, city: string, t: number): StyleSpecification {
  const credit = "© openstreetmap contributors · protomaps";
  return {
    version: 8,
    sources: {
      base: { type: "vector", url: `pmtiles://${tilesBase}/${city}.pmtiles`, attribution: credit },
      contours: { type: "vector", url: `pmtiles://${tilesBase}/${city}-contours.pmtiles` },
    },
    layers: LAYERS.map(({ tint, paint, ...layer }) => {
      const tinted = Object.fromEntries(
        Object.entries(tint ?? {}).map(([k, p]) => [k, blend(p, t)]),
      );
      return { ...layer, paint: { ...paint, ...tinted } } as LayerSpecification;
    }),
  };
}

type PaintTarget = { setPaintProperty(layer: string, name: string, value: unknown): void };

/** Re-tint an already-loaded style for a new time of day. */
export function applyTime(map: PaintTarget, t: number) {
  for (const layer of LAYERS) {
    for (const [name, pair] of Object.entries(layer.tint ?? {})) {
      map.setPaintProperty(layer.id, name, blend(pair, t));
    }
  }
}

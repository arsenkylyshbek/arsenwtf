import { readFileSync, writeFileSync } from "node:fs";

const geo = JSON.parse(readFileSync(process.argv[2], "utf8"));

// Ray-casting point-in-polygon, with holes subtracted.
function inRing(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function inPolygon(rings, x, y) {
  if (!inRing(rings[0], x, y)) return false;
  for (let i = 1; i < rings.length; i++) {
    if (inRing(rings[i], x, y)) return false;
  }
  return true;
}

const polygons = [];
for (const feature of geo.features) {
  const g = feature.geometry;
  if (g.type === "Polygon") polygons.push(g.coordinates);
  if (g.type === "MultiPolygon") polygons.push(...g.coordinates);
}

// Equirectangular. Antarctica trimmed at -58 — it eats a quarter of the frame
// and says nothing about anywhere anyone has been.
const STEP = 2;
const LON_MIN = -180;
const LON_MAX = 180;
const LAT_MIN = -58;
const LAT_MAX = 84;

const cols = Math.round((LON_MAX - LON_MIN) / STEP);
const rows = Math.round((LAT_MAX - LAT_MIN) / STEP);

const dots = [];
for (let row = 0; row <= rows; row++) {
  const lat = LAT_MAX - row * STEP;
  for (let col = 0; col <= cols; col++) {
    const lon = LON_MIN + col * STEP;
    if (polygons.some((rings) => inPolygon(rings, lon, lat))) {
      dots.push([col, row]);
    }
  }
}

const out = `// GENERATED — do not edit by hand.
// Dot-grid land mask, ${STEP}° equirectangular, from Natural Earth 110m land
// (public domain). Regenerate with scripts/gen-dots.mjs.

export const DOT_GRID = {
  step: ${STEP},
  cols: ${cols},
  rows: ${rows},
  lonMin: ${LON_MIN},
  lonMax: ${LON_MAX},
  latMin: ${LAT_MIN},
  latMax: ${LAT_MAX},
  dots: ${JSON.stringify(dots)} as [number, number][],
};
`;

writeFileSync(process.argv[3], out);
console.log(`${dots.length} land dots · grid ${cols}x${rows}`);

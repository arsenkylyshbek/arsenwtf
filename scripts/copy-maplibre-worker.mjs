// MapLibre 6 loads its tile worker from a file next to its own script, which
// the bundler doesn't emit. Serve the worker (and the shared chunk it imports)
// as static files instead, under the package version so caches never mix
// versions. Runs on postinstall, so Vercel builds get it too.
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "node_modules/maplibre-gl/dist");
const { version } = JSON.parse(readFileSync(join(root, "node_modules/maplibre-gl/package.json"), "utf8"));
const out = join(root, "public/vendor/maplibre", version);

mkdirSync(out, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(dist, file), join(out, file));
}
console.log(`maplibre worker → public/vendor/maplibre/${version}/`);

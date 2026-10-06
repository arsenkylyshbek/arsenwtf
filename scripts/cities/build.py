"""
Build the self-hosted map data for the city shader.

For each city in content/cities.json this writes two files to public/maps/:

  <city>.pmtiles           streets, water, parks, buildings — cut from the
                           Protomaps OpenStreetMap planet build
  <city>-contours.pmtiles  elevation contour lines, traced from the public
                           AWS terrain tiles (Terrarium encoding)

Usage (from the repo root):

  python3 -m venv scripts/cities/.venv
  scripts/cities/.venv/bin/pip install numpy pillow contourpy
  brew install pmtiles tippecanoe
  scripts/cities/.venv/bin/python scripts/cities/build.py sf astana london
  scripts/cities/.venv/bin/python scripts/cities/build.py astana --contours-only

Then upload public/maps/* to the R2 bucket (see scripts/cities/README.md).
"""

import io
import json
import math
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

import contourpy
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "maps"
CITIES = json.loads((ROOT / "content" / "cities.json").read_text())

BUILDS_INDEX = "https://build-metadata.protomaps.dev/builds.json"
PLANET = "https://build.protomaps.com/{key}"
TERRAIN = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"

MAX_ZOOM = 15  # MapLibre overzooms past this; street detail is complete by z15
DEM_ZOOM = 13  # ~19 m/px at the equator; plenty for 2–10 m contours


def get(url: str, attempts: int = 4):
    # Some of these hosts 403 Python's default user agent, and the terrain
    # bucket occasionally stalls — time out and retry rather than hang.
    request = urllib.request.Request(url, headers={"User-Agent": "arsen.wtf city-map builder"})
    for attempt in range(attempts):
        try:
            return urllib.request.urlopen(request, timeout=30)
        except (TimeoutError, urllib.error.URLError):
            if attempt == attempts - 1:
                raise
            time.sleep(2 ** attempt)


def latest_planet() -> str:
    with get(BUILDS_INDEX) as r:
        builds = json.load(r)
    return PLANET.format(key=builds[-1]["key"])


def extract_basemap(key: str, bbox: list[float], planet: str) -> None:
    out = OUT / f"{key}.pmtiles"
    subprocess.run(
        [
            "pmtiles", "extract", planet, str(out),
            f"--bbox={','.join(map(str, bbox))}",
            f"--maxzoom={MAX_ZOOM}",
        ],
        check=True,
    )
    print(f"  basemap  → {out.name} ({out.stat().st_size / 1e6:.1f} MB)")


# --- elevation --------------------------------------------------------------

def lonlat_to_tile(lon: float, lat: float, z: int) -> tuple[float, float]:
    n = 2**z
    x = (lon + 180) / 360 * n
    y = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def tile_to_lonlat(x: float, y: float, z: int) -> tuple[float, float]:
    n = 2**z
    lon = x / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * y / n))))
    return lon, lat


def fetch_dem(bbox: list[float], z: int) -> tuple[np.ndarray, int, int]:
    """Stitched elevation grid (metres) covering bbox, plus its top-left tile."""
    x0, y0 = (int(v) for v in lonlat_to_tile(bbox[0], bbox[3], z))
    x1, y1 = (int(v) for v in lonlat_to_tile(bbox[2], bbox[1], z))
    rows = []
    for y in range(y0, y1 + 1):
        row = []
        for x in range(x0, x1 + 1):
            with get(TERRAIN.format(z=z, x=x, y=y)) as r:
                px = np.asarray(Image.open(io.BytesIO(r.read())).convert("RGB"), dtype=np.float64)
            row.append(px[..., 0] * 256 + px[..., 1] + px[..., 2] / 256 - 32768)
        rows.append(np.hstack(row))
    return np.vstack(rows), x0, y0


def blur(a: np.ndarray, passes: int = 3) -> np.ndarray:
    """Repeated 3x3 box blur ≈ gaussian. Takes the stair-steps out of the DEM."""
    for _ in range(passes):
        p = np.pad(a, 1, mode="edge")
        a = sum(p[1 + dy : p.shape[0] - 1 + dy, 1 + dx : p.shape[1] - 1 + dx]
                for dy in (-1, 0, 1) for dx in (-1, 0, 1)) / 9
    return a


def build_contours(key: str, bbox: list[float], step: float) -> None:
    dem, tx0, ty0 = fetch_dem(bbox, DEM_ZOOM)
    dem = blur(np.maximum(dem, 0))  # sea floor reads as 0 so the coast is one line

    gen = contourpy.contour_generator(z=dem, line_type="Separate")
    lo = math.ceil(max(dem.min(), step) / step) * step
    features = []
    for level in np.arange(lo, dem.max(), step):
        lines = gen.lines(level)
        for line in lines:
            # tiny closed loops are DEM noise (Astana is flat enough to be
            # mostly noise), not hills
            if len(line) < 16:
                continue
            coords = [
                [round(c, 6) for c in tile_to_lonlat(tx0 + px / 256, ty0 + py / 256, DEM_ZOOM)]
                for px, py in line
            ]
            features.append({
                "type": "Feature",
                "properties": {
                    "ele": int(level),
                    # every 5th line is drawn heavier, like a printed topo map
                    "major": int(round(level / step)) % 5 == 0,
                },
                "geometry": {"type": "LineString", "coordinates": coords},
            })

    out = OUT / f"{key}-contours.pmtiles"
    with tempfile.NamedTemporaryFile("w", suffix=".geojson", delete=False) as f:
        json.dump({"type": "FeatureCollection", "features": features}, f)
        geojson = f.name
    subprocess.run(
        [
            "tippecanoe", "-o", str(out), "--force", "-l", "contours",
            "-Z", "9", "-z", str(MAX_ZOOM),
            "--simplification=4", "--no-tile-size-limit",
            f"--clip-bounding-box={','.join(map(str, bbox))}",
            "--quiet", geojson,
        ],
        check=True,
    )
    print(f"  contours → {out.name} ({len(features)} lines, "
          f"{dem.min():.0f}–{dem.max():.0f} m, {out.stat().st_size / 1e6:.1f} MB)")


def main(args: list[str]) -> None:
    contours_only = "--contours-only" in args
    keys = [a for a in args if not a.startswith("--")] or list(CITIES)
    OUT.mkdir(parents=True, exist_ok=True)
    planet = None if contours_only else latest_planet()
    if planet:
        print(f"planet: {planet}")
    for key in keys:
        city = CITIES[key]
        print(f"{key}:")
        if planet:
            extract_basemap(key, city["bbox"], planet)
        build_contours(key, city["bbox"], city["contourStep"])


if __name__ == "__main__":
    main(sys.argv[1:])

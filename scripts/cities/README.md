# city maps

Data for `/shaders/city`. Each city is two files built from open data:

- `<city>.pmtiles` — streets, water, parks, buildings, cut from the
  [Protomaps](https://protomaps.com) OpenStreetMap planet build
- `<city>-contours.pmtiles` — elevation contours traced from the public AWS
  terrain tiles

Cities (bounds, timezone, starting view, contour spacing) live in
`content/cities.json`, which both this script and the page read.

## build

```sh
brew install pmtiles tippecanoe
python3 -m venv scripts/cities/.venv
scripts/cities/.venv/bin/pip install numpy pillow contourpy
scripts/cities/.venv/bin/python scripts/cities/build.py                 # all cities
scripts/cities/.venv/bin/python scripts/cities/build.py astana          # one city
scripts/cities/.venv/bin/python scripts/cities/build.py --contours-only # contours only
```

Output goes to `public/maps/` (gitignored). In dev the page reads it from
there; nothing else to set up.

## host on cloudflare r2 (once)

1. Create a bucket, e.g. `arsenwtf-maps` (dashboard → R2 → create bucket).
2. Give it a public URL: either a custom domain like `maps.arsen.wtf`
   (bucket → settings → custom domains — best, it's cached at the edge), or the
   `r2.dev` dev URL to start.
3. Allow the site to read it with range requests:
   ```sh
   npx wrangler login
   npx wrangler r2 bucket cors set arsenwtf-maps --file scripts/cities/cors.json
   ```
4. Upload:
   ```sh
   scripts/cities/upload.sh arsenwtf-maps
   ```
5. In Vercel → project → settings → environment variables, set
   `NEXT_PUBLIC_MAP_TILES_URL` to the bucket's public URL (no trailing slash),
   e.g. `https://maps.arsen.wtf`, then redeploy.

## adding a city

Add it to `content/cities.json` (bbox as `[west, south, east, north]`;
`contourStep` in metres — 10 for hilly, 5 for gentle, flat cities look noisy
below 5), run `build.py <key>`, then `upload.sh`.

#!/usr/bin/env bash
# Upload built city maps (public/maps/*.pmtiles) to the R2 bucket.
#   scripts/cities/upload.sh [bucket]        default bucket: arsenwtf-maps
# Needs `npx wrangler login` once.
set -euo pipefail
BUCKET="${1:-arsenwtf-maps}"
cd "$(dirname "$0")/../.."

for file in public/maps/*.pmtiles; do
  key="$(basename "$file")"
  echo "→ $key ($(du -h "$file" | cut -f1))"
  npx wrangler r2 object put "$BUCKET/$key" \
    --file "$file" \
    --content-type application/octet-stream \
    --cache-control "public, max-age=86400" \
    --remote
done

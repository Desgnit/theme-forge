#!/usr/bin/env bash
# Assembles the deployable demo site into marketing/demo-site/ :
# a landing hub plus every theme demo, stripped of dev files.
# Deploy: drag the demo-site folder into https://app.netlify.com/drop
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=marketing/demo-site
PAIRS=$(python3 -c "import json; print(' '.join(t['slug']+':'+t.get('kind','html') for t in json.load(open('marketing/catalog.json'))['themes']))")

rm -rf "$OUT"
mkdir -p "$OUT"
cp marketing/demo-hub-index.html "$OUT/index.html"

for p in $PAIRS; do
  t=${p%%:*}; kind=${p##*:}
  mkdir -p "$OUT/$t"
  if [ "$kind" = "shopify" ]; then
    # Shopify themes demo via their static design preview
    cp -r shopify-themes/"$t"/preview/. "$OUT/$t"/
    continue
  fi
  # ship only what a visitor needs — no sources, no tooling
  cp -r themes/"$t"/. "$OUT/$t"/
  rm -rf "$OUT/$t"/node_modules "$OUT/$t"/src "$OUT/$t"/package.json \
    "$OUT/$t"/package-lock.json "$OUT/$t"/tailwind.config.js \
    "$OUT/$t"/.gitignore "$OUT/$t"/README.md
done

python3 marketing/build-store.py

echo "Demo site assembled at $OUT ($(du -sh "$OUT" | cut -f1))."
echo "Deploy: https://app.netlify.com/drop — drag the demo-site folder in."

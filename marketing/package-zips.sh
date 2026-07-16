#!/usr/bin/env bash
# Builds the sellable product zips into marketing/dist/ .
# Each zip is the complete theme including sources and README —
# exactly what a Gumroad/ThemeForest buyer downloads.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=marketing/dist
PAIRS=$(python3 -c "import json; print(' '.join(t['slug']+':'+t.get('kind','html') for t in json.load(open('marketing/catalog.json'))['themes']))")

rm -rf "$OUT"
mkdir -p "$OUT"

for p in $PAIRS; do
  t=${p%%:*}; kind=${p##*:}
  if [ "$kind" = "shopify" ]; then
    # Shopify themes live in shopify-themes/; the static preview isn't part of the product
    (cd shopify-themes && zip -qr "../$OUT/$t-theme-v1.0.0.zip" "$t" -x "$t/preview/*")
  else
    (cd themes && zip -qr "../$OUT/$t-theme-v1.0.0.zip" "$t" -x "$t/node_modules/*")
  fi
  echo "$(du -h "$OUT/$t-theme-v1.0.0.zip" | cut -f1)  $t-theme-v1.0.0.zip"
done

echo "Product zips ready in $OUT/."

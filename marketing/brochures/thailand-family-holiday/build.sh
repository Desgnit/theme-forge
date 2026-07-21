#!/usr/bin/env bash
# Renders brochure.html to a print-ready A4 PDF using headless Chromium.
# Requires the Playwright Chromium build (or any Chromium/Chrome binary on PATH).
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/opt/pw-browsers/chromium}"
"$CHROME" --headless --no-sandbox --disable-gpu --no-pdf-header-footer \
  --print-to-pdf=thailand-family-holiday-brochure.pdf \
  "file://$PWD/brochure.html"
echo "Wrote thailand-family-holiday-brochure.pdf"

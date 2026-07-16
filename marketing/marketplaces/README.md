# Marketplace launch kit

Everything needed to list the 17 themes for sale. Each marketplace directory
contains one ready-to-paste file per product; `assets/` holds the image sizes
each platform requires. Regenerate after editing copy with:

    python3 marketing/marketplaces/build-listings.py

## Launch order (least friction first)

1. **Gumroad** (`gumroad/`, 17 listings) — instant, no review. Create a free
   account at gumroad.com, then for each file: New product → digital product →
   paste name/description/tags → upload the zip (download it from the
   themes-latest release) → set the price → use the listed cover image.
   Suggested extra: a "Football club bundle — all 10 editions" product at £79.
2. **Etsy** (`etsy/`, 17 listings) — needs a one-time shop setup (~15 min,
   payment + billing details). Each listing file includes an Etsy-legal title
   (≤140 chars), 13 tags (≤20 chars each), and points at
   `assets/etsy/<slug>-main.png` (2000×1500) for the first photo.
3. **Creative Market** (`creative-market/`, 17 listings) — apply for a shop
   (they approve sellers, usually quickly). Category: Web Templates → HTML/CSS.
4. **ThemeForest** (`themeforest/`, 3 items) — human-reviewed; read
   `themeforest/README.md` for the submission strategy (Forgeline first, the
   ten football editions as ONE bundle item, never as separate near-duplicate
   items).

## Product zips

Always ship the zips from the rolling release (rebuilt on every push to main):
https://github.com/Desgnit/theme-forge/releases/tag/themes-latest

## Pricing (from marketing/listings.md)

Forgeline £39 · Sideline £35 · Terrace £35 · other football editions £29 ·
Callout editions £29 · football 10-edition bundle £79. Raise prices once each
product has 2–3 sales/reviews.

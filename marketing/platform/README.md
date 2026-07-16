# Listing automation platform

The goal: add a theme to this repo, push, and have it listed for sale
everywhere possible — no manual work per theme.

## What is (and isn't) automatable

| Channel | Automation | How |
|---|---|---|
| **Etsy** | **Full** — listings created/updated by CI on every push | Official Etsy Open API v3 (`sync-etsy.py`) |
| **Own storefront** | Full — rebuilt by CI on every push | `/store/` page on the demo site; Buy buttons link to the Etsy listings once they exist |
| Gumroad | Not possible server-side | Their API has no create-product endpoint; use `marketing/marketplaces/gumroad/` kits |
| Creative Market | Not possible | No seller API exists |
| ThemeForest | Not possible | No API + mandatory human review of every item |

## One-time setup (the only manual work, ever)

1. Create an Etsy shop at etsy.com/sell (identity + payout details — this is
   the part no software can legally do for you).
2. Create an API app at etsy.com/developers/register.
   Callback URL must be exactly `http://localhost:8642/callback`. Copy the
   keystring. (New apps start with provisional access, which is sufficient
   for managing your own shop.)
3. On your own computer:
   `python3 marketing/platform/etsy-auth.py <KEYSTRING>`
   — approve in the browser; it prints three values.
4. Add them as GitHub repo secrets (repo → Settings → Secrets and variables →
   Actions): `ETSY_API_KEY`, `ETSY_REFRESH_TOKEN`, `ETSY_SHOP_ID`.
5. Optional: secret `ETSY_PUBLISH` = `active` to auto-publish. Without it,
   CI creates **draft** listings for you to approve in the Etsy dashboard —
   recommended for the first batch. Note Etsy charges $0.20 per listing at
   publish time, and renewal fees apply — that's Etsy, not the pipeline.

## How it works after that

Every push to `main`:

1. `package-zips.sh` builds the product zips (theme list comes from
   `marketing/catalog.json` — the single source of truth).
2. `sync-etsy.py` creates a listing for any theme that doesn't have one
   (title, description, price, 13 tags, cover images, the zip as the digital
   file) and updates copy/price on ones that do. Listing ids are tracked in
   `etsy-listings.json` (committed back by CI), so nothing ever duplicates.
3. The demo site and `/store/` page rebuild; store Buy buttons point at the
   Etsy listings.
4. Zips also publish to the GitHub release, demos deploy to GitHub Pages.

## Adding a new theme (the whole workflow)

1. Drop the theme folder into `themes/<slug>/`.
2. Add one entry to `marketing/catalog.json` (slug, title, price, one-liner,
   family, tags) and a `marketing/covers/<slug>-cover.png` (1280×720).
3. Push. Demo, zip, release, store card and Etsy listing all happen in CI.

## Maintenance

- Etsy refresh tokens expire after ~90 days. If the sync step starts failing
  with an auth error, re-run `etsy-auth.py` and update the
  `ETSY_REFRESH_TOKEN` secret. Everything else is hands-off.
- Copy lives in `marketing/catalog.json` + the generators; regenerate the
  manual-marketplace kits with `python3 marketing/marketplaces/build-listings.py`.

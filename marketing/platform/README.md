# Listing automation platform

The goal: add a theme to this repo, push, and have it listed for sale
everywhere possible — no manual work per theme.

## Setup = one command

On your own computer (Python 3.9+ installed, nothing else needed):

```
curl -sO https://raw.githubusercontent.com/Desgnit/theme-forge/main/marketing/platform/setup-wizard.py
python3 setup-wizard.py
```

The wizard installs its own dependencies, connects GitHub, walks you through
Etsy + Gumroad + Creative Market + ThemeForest in one sitting (you just log
in when a browser window opens), and uploads every secret to the repo
itself. When it finishes, the platform is fully live. Re-run it (or
`python3 setup-wizard.py <site>`) whenever a session expires — the pipeline
opens a GitHub issue to tell you, and checks weekly on its own.

The only part it can't do for you is *creating* the seller accounts
(identity, payouts, tax) — have those, or create them when each login page
opens. Everything below is reference detail; the wizard handles all of it.

## What is (and isn't) automatable

| Channel | Automation | How |
|---|---|---|
| **Etsy** | **Full** — listings created/updated by CI on every push | Official Etsy Open API v3 (`sync-etsy.py`) |
| **Own storefront** | Full — rebuilt by CI on every push | `/store/` page on the demo site; Buy buttons link to the Etsy listings once they exist |
| Gumroad | Browser automation (no create API exists) | `sync-browser.py gumroad` — RPA in CI with your captured session |
| Creative Market | Browser automation (no seller API exists) | `sync-browser.py creativemarket` |
| ThemeForest | Browser automation submits; **Envato humans still review** | `sync-browser.py themeforest` — flagship items only, per the duplicate-item policy |

### About the browser-automation (RPA) channels

Gumroad, Creative Market and ThemeForest offer no listing APIs, so the
`sync-marketplaces.yml` workflow drives their seller dashboards in a headless
browser instead. Plain-spoken caveats:

- **Terms of service**: you're automating your own account listing your own
  products, but these sites' terms may restrict automation — use at your own
  judgement.
- **Fragility**: a dashboard redesign can break the scripts. Every step is
  screenshotted and uploaded as a CI artifact (`rpa-screenshots`), so
  breakage is quick to diagnose and fix in `sync-browser.py`. Expect the
  first run against each real site to need a round of selector fixes.
- **Auth**: no passwords are stored. Run
  `python3 marketing/platform/capture-session.py <site>` locally, log in by
  hand (captcha/2FA and all), and save the printed blob as the repo secret it
  names (`GUMROAD_SESSION`, `CREATIVEMARKET_SESSION`, `THEMEFOREST_SESSION`).
  Sessions expire after weeks–months; the workflow tells you when to re-run it.
- ThemeForest publication is gated on Envato's human review regardless — the
  robot uploads and submits, people approve.

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

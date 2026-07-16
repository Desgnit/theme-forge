#!/usr/bin/env python3
"""Generate copy-paste listing kits for Gumroad, Etsy, Creative Market and
ThemeForest from the master copy in marketing/listings.md, plus the image
sizes each marketplace requires (from marketing/covers/).

Run from the repo root:  python3 marketing/marketplaces/build-listings.py
"""
import os
import textwrap

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "marketing", "marketplaces")
COVERS = os.path.join(ROOT, "marketing", "covers")
DEMO = "https://desgnit.github.io/theme-forge"
ZIP = "https://github.com/Desgnit/theme-forge/releases/download/themes-latest/{slug}-theme-v1.0.0.zip"
SHOP_NOTE = "Different colours? See the full range: [YOUR SHOP LINK]"

SHARED_TAGS = ["html template", "tailwind css", "landing page", "small business website"]

FOOTBALL = [
    # slug, name, colours, colour tag word, demo club, est, extra paragraph
    ("terrace", "Terrace", "claret & sky (plus a 5-way colour switcher)", "claret", "Ravenshaw Rovers", 1921,
     "Can't see your colours? Terrace is the any-colour edition: five ready-made "
     "colourways ship in the box (claret, royal, scarlet, forest, black & amber) "
     "switchable with one line of HTML — plus a live preview page — and the README "
     "shows how to hit your exact colours with one CSS block."),
    ("clarion", "Clarion", "royal blue & gold", "royal blue", "Kingsfield Rovers", 1907, None),
    ("vermilion", "Vermilion", "scarlet & gold", "scarlet", "Redbrook Rovers", 1911, None),
    ("evergreen", "Evergreen", "forest green & gold", "green", "Oakhurst Rovers", 1924, None),
    ("amberline", "Amberline", "black & amber", "amber", "Blackwick Rovers", 1899, None),
    ("skyline", "Skyline", "sky blue & gold", "sky blue", "Easthaven Rovers", 1902, None),
    ("tangerine", "Tangerine", "orange & black", "orange", "Seabrook Rovers", 1912, None),
    ("midnight", "Midnight", "navy & sky", "navy", "Northgate Rovers", 1905, None),
    ("canary", "Canary", "yellow & slate", "yellow", "Marshside Rovers", 1926, None),
    ("candystripe", "Candystripe", "red & white stripes", "red and white", "Westport Rovers", 1889,
     "The stripes aren't a gimmick — every dark section wears the candy stripes, "
     "woven into the design the way your fans expect."),
]

CALLOUT = [
    # slug, trade noun, trade tag
    ("callout", "Electrician", "electrician website"),
    ("callout-plumbing", "Plumber", "plumber website"),
    ("callout-building", "Builder", "builder website"),
    ("callout-landscaping", "Landscaper", "landscaper website"),
    ("callout-roofing", "Roofer", "roofer website"),
]

FORGELINE_DESC = """\
Most templates make an electrical wholesaler look like a startup. Forgeline was
designed *from inside the industry*: the demo content is a believable UK
commercial lighting distributor, with product spec tables (IP ratings, lumen
output, efficacy), a downloads tab for datasheets and LDT/IES photometric
files, trade-account CTAs, volume-break pricing and a "send us your bill of
materials" quote flow.

- 8 pages: Home, About, Products (filterable grid), Single Product, Services, Blog, Article, Contact
- HTML + compiled Tailwind CSS — open index.html and it just works, no build step
- Rebrand in minutes: every colour and font is a CSS variable
- Real photography included; product images as clean technical renders
- Vanilla JS only: tabs, filters, gallery, accordion, working demo forms
- WCAG-AA accessibility patterns, tested at iPhone widths, no horizontal scroll anywhere
- Plain-English README covering setup, rebranding and going live

Perfect for: electrical wholesalers, lighting suppliers, manufacturers,
engineering firms, industrial distributors, builders' merchants."""

CALLOUT_DESC = """\
Five pages (Home, Services, Recent Work, About, Free Quote) with a fully
written demo company so you see a real trade business, not lorem ipsum: trust
strip with guarantees, 6 service cards with honest trade copy, project cards
with budgets, review cards ready for your Checkatrade quotes, an areas-covered
strip, and a quote form with job-type dropdown.

- HTML + compiled Tailwind CSS — open index.html and it just works, no build step
- Rebrand in minutes: every colour and font is a CSS variable
- Vanilla JS only, WCAG-AA accessibility patterns, tested at iPhone widths
- Plain-English README covering setup, rebranding and going live"""

SIDELINE_DESC = """\
Junior clubs don't need a fixtures-and-league-table site — they need parents to
find the right team, register in five minutes, and trust the setup. Sideline
is organised around exactly that:

- A **teams directory** with 24 demo teams across U6–U16, filterable by Boys / Girls / Mixed, each card showing league, format (4v4 → 11v11), training night, coach and live space availability
- Registration page with a fees table, sibling discounts and hardship fund — plus a parents' FAQ that answers the questions you get every July
- A volunteers page, because the real shortage is coaches, not players
- Safeguarding built in structurally: welfare contact first on the contact page, no junior players named, photo-consent language modelled
- 8 pages, HTML + compiled Tailwind, vanilla JS, WCAG-AA, iPhone-tested"""

FOOTBALL_DESC = """\
Your club's website shouldn't look like a corporate brochure with a ball
photo. {name} is a complete club site in **{colours}** — the demo club
({club}, est. {est}) wears your end of the colour spectrum so you can picture
your own badge on it immediately.

- **Match centre**: fixtures, results with scorelines and W/D/L badges, and a league table with your club's row highlighted — all plain HTML, edited by copy-paste
- **Live kick-off countdown** on the homepage (set one date attribute)
- **Squad grid** with position filter and player profile page (with a "sponsor this player" revenue CTA)
- Match report layout, club history/honours, academy trials form with parents' FAQ, contact with matchday directions
- A proper **club crest** included as a recolourable SVG — swap in your own badge whenever you're ready
- 9 pages, HTML + compiled Tailwind CSS, no build step, vanilla JS, WCAG-AA patterns, tested at iPhone widths
- Every colour is a CSS variable — matching your exact club colours is a five-minute job, documented in the README

Perfect for: non-league and semi-pro clubs, community clubs, Sunday league
sides, club volunteers who got handed "the website job"."""


def products():
    out = []
    out.append(dict(
        slug="forgeline", price=39,
        title="Forgeline — Industrial & Trade Supplier HTML Template",
        oneliner=("A premium website template that actually understands the trade — "
                  "datasheets, photometry downloads, quote requests and next-day "
                  "delivery messaging, not another generic \"business theme\"."),
        desc=FORGELINE_DESC, demo=f"{DEMO}/forgeline/",
        tags=["industrial website", "trade supplier", "wholesale", "manufacturing", "b2b template"],
        family="industrial"))
    for slug, trade, tag in CALLOUT:
        out.append(dict(
            slug=slug, price=29,
            title=f"Callout — {trade} Website Template (local trades)",
            oneliner=(f"A complete website for a local {trade.lower()} — built around what "
                      "actually wins trade work: reviews, fixed-quote promises, photos of "
                      "real jobs, and a phone number everywhere."),
            desc=CALLOUT_DESC, demo=f"{DEMO}/{slug}/",
            tags=[tag, "tradesman template", "local business", "trade website"],
            family="trades"))
    out.append(dict(
        slug="sideline", price=35,
        title="Sideline — Grassroots Junior Football Club Template",
        oneliner=("The first club website template built for how junior clubs actually "
                  "work — 20+ teams, boys' and girls' pathways, volunteers and "
                  "safeguarding, no \"first team\" your club doesn't have."),
        desc=SIDELINE_DESC, demo=f"{DEMO}/sideline/",
        tags=["football club", "soccer club", "youth sports", "junior football", "grassroots", "sports team website"],
        family="football"))
    for slug, name, colours, colour_tag, club, est, extra in FOOTBALL:
        desc = FOOTBALL_DESC.format(name=name, colours=colours, club=club, est=est)
        if extra:
            desc += "\n\n" + extra
        out.append(dict(
            slug=slug, price=35 if slug == "terrace" else 29,
            title=f"{name} — Football Club HTML Template ({colours.split('(')[0].strip().rstrip(' &')})"
                  if "(" in colours else f"{name} — Football Club HTML Template ({colours})",
            oneliner=(f"A complete football club website in {colours} — fixtures, results, "
                      "league table, squad profiles, match reports and academy trials, "
                      "styled for your colours out of the box."),
            desc=desc, demo=f"{DEMO}/{slug}/",
            tags=["football club template", "soccer website", "sports club", "fixtures",
                  "league table", f"{colour_tag} football", "non-league"],
            family="football"))
    return out


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)


def gumroad(p):
    cross = f"\n\n{SHOP_NOTE}" if p["family"] == "football" else ""
    return f"""# Gumroad listing — {p['title']}

| Field | Value |
|---|---|
| Product type | Digital product (single file) |
| Name | {p['title']} |
| URL slug | /l/{p['slug']} |
| Price | £{p['price']} |
| File to upload | {ZIP.format(slug=p['slug'])} |
| Cover image | marketing/covers/{p['slug']}-cover.png{' + marketing/covers/football-family-sheet.png' if p['family'] == 'football' else ''} |

## Summary (one-liner)

{p['oneliner']}

## Description

{p['desc']}

**Live demo:** {p['demo']}

One licence = one club/site. Grab it again for a second site.{cross}

## Tags

{', '.join(SHARED_TAGS + p['tags'])}
"""


def etsy(p):
    title = f"{p['title']} — HTML + Tailwind, Instant Digital Download"
    if len(title) > 140:
        title = title[:137] + "..."
    tags = []
    for t in p["tags"] + SHARED_TAGS + ["digital download", "website template"]:
        while len(t) > 20:  # drop trailing words rather than cutting mid-word
            t = t.rsplit(" ", 1)[0]
        if t and t not in tags:
            tags.append(t)
    tags = tags[:13]
    return f"""# Etsy listing — {p['title']}

| Field | Value |
|---|---|
| Type | Digital download |
| Title (≤140 chars) | {title} |
| Price | £{p['price']} |
| File to upload | {ZIP.format(slug=p['slug'])} (under 20 MB — fits Etsy's limit) |
| Images | marketing/marketplaces/assets/etsy/{p['slug']}-main.png (first), then marketing/covers/{p['slug']}-cover.png |

## Description

INSTANT DIGITAL DOWNLOAD — no physical item will be shipped.

{p['oneliner']}

{p['desc']}

**Try the live demo before you buy:** {p['demo']}

WHAT YOU RECEIVE
- One zip containing the complete website template (HTML + compiled Tailwind CSS, all images, README)
- Open index.html in any browser — no build tools, no subscriptions
- One licence = one club/site

Questions? Message me and I'll help you get set up.

## Tags (13 max, 20 chars each)

{', '.join(tags)}
"""


def creative_market(p):
    return f"""# Creative Market listing — {p['title']}

| Field | Value |
|---|---|
| Category | Web Templates → HTML/CSS |
| Name | {p['title']} |
| Price | £{p['price']} (list in USD equivalent) |
| File to upload | {ZIP.format(slug=p['slug'])} |
| Preview images | marketing/covers/{p['slug']}-cover.png (first){' + marketing/covers/football-family-sheet.png' if p['family'] == 'football' else ''} |

## Excerpt (short description)

{p['oneliner']}

## Description

{p['desc']}

**Live preview:** {p['demo']}

## Tags

{', '.join(SHARED_TAGS + p['tags'])}
"""


def themeforest_assets(slugs):
    outdir = os.path.join(OUT, "assets", "themeforest")
    os.makedirs(outdir, exist_ok=True)
    for slug in slugs:
        src = os.path.join(COVERS, f"{slug}-cover.png")
        img = Image.open(src).convert("RGB")
        w, h = img.size
        side = min(w, h)
        sq = img.crop(((w - side) // 2, (h - side) // 2, (w + side) // 2, (h + side) // 2))
        sq.resize((80, 80), Image.LANCZOS).save(os.path.join(outdir, f"{slug}-thumbnail-80x80.png"))
        target = 590 / 300
        cw = int(h * target) if w / h > target else w
        ch = int(w / target) if w / h <= target else h
        crop = img.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2))
        crop.resize((590, 300), Image.LANCZOS).save(os.path.join(outdir, f"{slug}-preview-590x300.png"))


def etsy_assets(slugs):
    # Etsy main image: 2000x1500 (4:3), cover centred on a dark canvas
    outdir = os.path.join(OUT, "assets", "etsy")
    os.makedirs(outdir, exist_ok=True)
    for slug in slugs:
        src = os.path.join(COVERS, f"{slug}-cover.png")
        img = Image.open(src).convert("RGB")
        canvas = Image.new("RGB", (2000, 1500), (24, 28, 36))
        scaled = img.resize((2000, int(img.height * 2000 / img.width)), Image.LANCZOS)
        canvas.paste(scaled, (0, (1500 - scaled.height) // 2))
        canvas.save(os.path.join(outdir, f"{slug}-main.png"))


def main():
    ps = products()
    for p in ps:
        write(os.path.join(OUT, "gumroad", f"{p['slug']}.md"), gumroad(p))
        write(os.path.join(OUT, "etsy", f"{p['slug']}.md"), etsy(p))
        write(os.path.join(OUT, "creative-market", f"{p['slug']}.md"), creative_market(p))
    etsy_assets([p["slug"] for p in ps])
    themeforest_assets(["forgeline", "terrace", "sideline"])
    print(f"Wrote {len(ps)} listings x 3 marketplaces + image assets to {OUT}")


if __name__ == "__main__":
    main()

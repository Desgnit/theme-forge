# Boundary — Cricket Club HTML Template

A premium, responsive HTML + Tailwind CSS template for cricket clubs,
junior sections and grassroots teams. Ships with realistic demo content
for a fictional village club — fixtures, results with proper cricket
scorelines, a league table with bonus points, squad profiles with batting
and bowling stats, match reports and junior registration — so buyers see
a real club website, not lorem ipsum.

**No build step is required to use it** — the compiled CSS is included.
You only need Node.js if you want to change the club colours or fonts.

> Boundary is derived from our Terrace football template: same markup,
> classes and JavaScript, rebranded for cricket. The demo club is
> **Longmead Cricket Club** (est. 1894), playing at **The Meadow** in the
> **Wessex Valley League Division One**, in cricket green and gold.

---

## What's included

| File | Page |
|---|---|
| `index.html` | Home — hero with first-ball countdown, match centre, news, table, teams, sponsors |
| `club.html` | Club — history since 1894, honours, the ground, committee |
| `fixtures.html` | Match centre — fixtures / results / league table in accessible tabs |
| `squad.html` | Squad grid with role filter (batters, bowlers, all-rounders, wicket-keepers) |
| `player-single.html` | Player profile — batting/bowling averages, season-by-season record, sponsor CTA |
| `news.html` | News listing with featured match report and newsletter signup |
| `news-single.html` | Match report layout with scoreboard strip and scorecard list |
| `contact.html` | Contact cards, enquiry form, matchday directions, pavilion hire |
| `academy.html` | Juniors — All Stars (5–8), Dynamos (8–11), U13/U15 hardball, registration form, parents' FAQ |

Plus:

- `assets/css/main.css` — compiled, minified stylesheet (~29 KB)
- `assets/js/main.js` — dependency-free vanilla JS (nav, countdown, tabs, filter, accordion, forms)
- `assets/img/` — SVG demo imagery (replace with your match photography)
- `src/input.css` — theme source with all club-colour variables
- `tailwind.config.js`, `package.json` — rebuild tooling

## Quick start

1. Unzip anywhere.
2. Open `index.html` in a browser. That's it — no server needed.
3. To publish, upload the folder (minus `src/`, `node_modules/`,
   `package.json`, `tailwind.config.js` if you like) to any static host:
   Netlify, Vercel, GitHub Pages, cPanel…

## Your club's colours

The default palette is **cricket green & gold**. Every colour and font
resolves to CSS variables declared in the `:root` block of
`assets/css/main.css` (source of truth: `src/input.css`). Change those
values, rebuild, and the whole site is in your colours — **you never
edit HTML to rebrand**:

```css
:root {
  --tc-primary: 22 101 52;     /* cricket green — dark sections, headings */
  --tc-accent: 234 179 8;      /* gold          — buttons, highlights     */
  --tc-win: 22 163 74;         /* W/L/D/T badge colours                   */
  --tc-font-display: "Oswald", ...;
  --tc-font-body: "Inter", ...;
}
```

Colour values are space-separated RGB channels (`22 101 52` = `#166534`)
so Tailwind's opacity modifiers keep working.

> Rebrand note: the Terrace colour-switcher page (`colours.html`) and the
> ready-made colourway stylesheets (`assets/css/clubs/`) were removed in
> Boundary — recolour via the `:root` variables instead.

Rebuild after editing:

```bash
npm install        # once
npm run build      # writes assets/css/main.css
npm run watch      # optional: rebuild on save while you work
```

To change fonts, also update the Google Fonts `<link>` in the `<head>`
of each page, or remove it to use the system-font fallbacks.

## Editing content

- **Club name / crest** — the crest is an inline SVG in the header and
  footer of every page; swap it for your own. Find-and-replace
  `Longmead Cricket Club` (and `Longmead`) across the HTML files for the
  name.
- **First-ball countdown** — set the date on the hero's
  `data-countdown="2026-08-08T13:00:00"` attribute. Once the first ball
  is bowled it shows the message in `data-countdown-done`.
- **League table** — plain HTML table with cricket-style points (win
  points plus batting/bowling bonus points). Mark your own club's row
  with the `data-us` attribute to highlight it.
- **Fixtures & results** — each match is one self-contained `<li>` card;
  copy, paste, edit. Results use cricket scorelines (e.g. "Longmead
  187/6 (40 ov) beat Ashcombe 142 all out") with W/L/D/T `.form-badge`
  classes.
- **Squad roles** — the filter buttons keep their original
  `data-filter` keys (`gk`/`def`/`mid`/`fwd`) so the JavaScript is
  untouched; only the visible labels read Wicket-keepers / Batters /
  Bowlers / All-rounders. Assign players with the matching
  `data-category` attribute.
- **Images** — demo images are placeholders in `assets/img/` (carried
  over from the football theme). Replace with your club's photos (keep
  `width`/`height` attributes to avoid layout shift).
- **Favicon** — `assets/img/favicon.svg`.

## Forms

The junior registration, contact and newsletter forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) that validates input and shows
the success message without sending anything. To go live, point each
`<form>` at your endpoint — Formspree, Netlify Forms, or your club's
system — and remove the `data-demo-form` attribute.

## JavaScript behaviours

All optional, all vanilla, all in `assets/js/main.js`:

- Mobile navigation (Escape to close, `aria-expanded` managed)
- First-ball countdown (days/hours/minutes, updates every 30s)
- Accessible tabs with arrow-key support (fixtures page)
- Squad role filter
- One-open accordion built on native `<details>` (parents' FAQ)
- Scroll-reveal animations (fully disabled under `prefers-reduced-motion`)
- Sticky header shadow, footer year

## Accessibility

Built to WCAG 2.1 AA: semantic landmarks, skip link, visible focus
states, labelled form controls, `aria-current` navigation,
keyboard-operable tabs and accordion, table captions for screen readers,
AA-checked colour contrast, and reduced-motion support.

## Mobile & iPhone

Tested at iPhone viewports (390/375px): no horizontal scroll on any
page, hamburger navigation with Escape-to-close, 16px form inputs (so
iOS Safari never zoom-jumps on focus), and an `apple-touch-icon` for
home-screen bookmarks.

## Browser support

All modern evergreen browsers (Chrome, Edge, Firefox, Safari — last two
versions). No IE11.

## Credits & licence

- [Tailwind CSS](https://tailwindcss.com) (MIT) — build-time only
- [Bitter](https://fonts.google.com/specimen/Bitter) &
  [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) via Google Fonts (OFL)
- Demo photographs from [Unsplash](https://unsplash.com/license) (free
  for commercial use, no attribution required). They are placeholders —
  replace them with your club's own consented photography before launch,
  especially anything showing junior players.
- All demo copy, club names, people and badges are fictional.

Licence per the marketplace you purchased from (single-site licence
unless stated otherwise). Thanks for buying Boundary — see you at The
Meadow.

## Image credits

Photography in `assets/img/` (village cricket at Botany Bay CC, Coopersale CC,
Eastons CC and Hatfield Heath CC), all by **Acabashi**, licensed
**CC BY-SA 4.0**, via Wikimedia Commons:

- `hero-stadium.jpg` — [Hatfield Heath CC v. Netteswell CC on Hatfield Heath village green, Essex, England 50](https://commons.wikimedia.org/wiki/File:Hatfield_Heath_CC_v._Netteswell_CC_on_Hatfield_Heath_village_green,_Essex,_England_50.jpg)
- `news-match.jpg` — [Hatfield Heath CC v. Netteswell CC on Hatfield Heath village green, Essex, England 59](https://commons.wikimedia.org/wiki/File:Hatfield_Heath_CC_v._Netteswell_CC_on_Hatfield_Heath_village_green,_Essex,_England_59.jpg)
- `news-ground.jpg` — [Eastons CC v Epping Foresters CC at Little Easton, Essex, England 034](https://commons.wikimedia.org/wiki/File:Eastons_CC_v_Epping_Foresters_CC_at_Little_Easton,_Essex,_England_034.jpg)
- `news-training.jpg` — [Eastons CC v Epping Foresters CC at Little Easton, Essex, England 035](https://commons.wikimedia.org/wiki/File:Eastons_CC_v_Epping_Foresters_CC_at_Little_Easton,_Essex,_England_035.jpg)
- `academy-pitch.jpg` — [Coopersale CC v. Old Sectonians CC at Coopersale, Essex 23](https://commons.wikimedia.org/wiki/File:Coopersale_CC_v._Old_Sectonians_CC_at_Coopersale,_Essex_23.jpg)
- `news-community.jpg` and `player-9.jpg` (crop) — [Botany Bay CC v Rosaneri CC at Botany Bay, Enfield, London 24](https://commons.wikimedia.org/wiki/File:Botany_Bay_CC_v_Rosaneri_CC_at_Botany_Bay,_Enfield,_London_24.jpg)

`club-history.jpg` (outfield close-up) remains the original Unsplash
placeholder. CC BY-SA 4.0 requires attribution and share-alike for the
images listed above — keep this section if you keep the photos.

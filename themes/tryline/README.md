# Tryline — Rugby League Club HTML Template

A premium, responsive HTML + Tailwind CSS template for rugby league clubs,
junior sections and community sides. Ships with realistic demo content for
a fictional northern club — fixtures, results, a league table with points
difference, squad profiles with tries, goals and appearances, match
reports and junior sign-on registration — so buyers see a real club
website, not lorem ipsum.

**No build step is required to use it** — the compiled CSS is included.
You only need Node.js if you want to rebuild the core stylesheet; the
club's look is set in plain CSS you can edit directly.

---

## What's included

| File | Page |
|---|---|
| `index.html` | Home — hero with matchday countdown, match centre, news, table, teams, sponsors |
| `club.html` | Club — history, honours, the ground, committee |
| `fixtures.html` | Match centre — fixtures / results / league table in accessible tabs |
| `squad.html` | Squad grid with position-group filter (outside backs, halves, props & hookers, back row) |
| `player-single.html` | Player profile — tries, goals and appearances season by season, sponsor CTA |
| `news.html` | News listing with featured match report and newsletter signup |
| `news-single.html` | Match report layout with scoreboard strip and team lists |
| `contact.html` | Contact cards, enquiry form, matchday directions, clubhouse hire |
| `juniors.html` | Juniors — U8s to U16s age groups (tag rugby for the littlest), sign-on form, parents' FAQ |

Plus:

- `assets/css/main.css` — compiled, minified stylesheet (~29 KB)
- `assets/css/skin.css` — Tryline's visual identity layer (see below)
- `assets/js/main.js` — dependency-free vanilla JS (nav, countdown, tabs, filter, accordion, forms)
- `assets/img/` — SVG demo imagery (replace with your own match photography)
- `src/input.css` — theme source with all club-colour variables
- `tailwind.config.js`, `package.json` — rebuild tooling

## Quick start

1. Unzip anywhere.
2. Open `index.html` in a browser. That's it — no server needed.
3. To publish, upload the folder (minus `src/`, `node_modules/`,
   `package.json`, `tailwind.config.js` if you like) to any static host:
   Netlify, Vercel, GitHub Pages, cPanel…

## Your club's colours

The default strip is **maroon & amber**. Every colour and font resolves
to CSS variables, so rebranding never means editing HTML. Two places to
look:

- **`assets/css/skin.css`** — Tryline's identity layer, loaded after
  `main.css` on every page. Plain, commented CSS: the squared corners,
  the diagonal-stripe dark sections, the amber card bars and scoreline
  chips all live here. Edit it freely; no build step needed.
- **`src/input.css`** — the core variables, compiled into `main.css`:

```css
:root {
  --tc-primary: 88 28 40;      /* deep maroon — dark sections, headings */
  --tc-accent: 217 119 6;      /* amber      — buttons, highlights      */
  --tc-win: 22 163 74;         /* W/D/L badge colours                   */
  --tc-font-display: "Barlow Condensed", ...;
  --tc-font-body: "Barlow", ...;
}
```

Colour values are space-separated RGB channels (`88 28 40` = `#581c28`)
so Tailwind's opacity modifiers keep working. Rebuild after editing the
source file:

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
  `Millbrook Raiders` across the HTML files for the name.
- **Matchday countdown** — set the date on the hero's
  `data-countdown="2026-08-09T14:30:00"` attribute. Past the first
  whistle it shows the message in `data-countdown-done`.
- **League table** — plain HTML table with points difference (PF/PA/PD).
  Mark your own club's row with the `data-us` attribute to highlight it.
- **Fixtures & results** — each game is one self-contained `<li>` card;
  copy, paste, edit. W/D/L badges use the `.form-badge` classes.
- **Squad filter** — player cards carry `data-category` (`backs`,
  `halves`, `middles`, `backrow`) matched by the filter buttons'
  `data-filter` values. Rename or extend them together.
- **Images** — demo images are SVGs in `assets/img/`. Replace with your
  photos (keep `width`/`height` attributes to avoid layout shift).
- **Favicon** — `assets/img/favicon.svg`.

## Forms

The sign-on, contact and newsletter forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) that validates input and shows
the success message without sending anything. To go live, point each
`<form>` at your endpoint — Formspree, Netlify Forms, or your club's
system — and remove the `data-demo-form` attribute.

## JavaScript behaviours

All optional, all vanilla, all in `assets/js/main.js`:

- Mobile navigation (Escape to close, `aria-expanded` managed)
- Matchday countdown (days/hours/minutes, updates every 30s)
- Accessible tabs with arrow-key support (fixtures page)
- Squad position-group filter
- One-open accordion built on native `<details>` (juniors FAQ)
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
- [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) &
  [Barlow](https://fonts.google.com/specimen/Barlow) via Google Fonts (OFL)
- Demo photographs from [Unsplash](https://unsplash.com/license) (free
  for commercial use, no attribution required). They are placeholders —
  replace them with your club's own consented photography before launch,
  especially anything showing junior players.
- All demo copy, club names, people and badges are fictional.

Licence per the marketplace you purchased from (single-site licence
unless stated otherwise). Thanks for buying Tryline — up the Raiders.

## Image credits

The following photographs in `assets/img/` are from Wikimedia Commons
(see `marketing/stock/credits.json` in the source repository):

| File | Title | Author | Licence | Source |
| --- | --- | --- | --- | --- |
| `hero-stadium.jpg` | ManlySeaEagles CronullaSharks Tackle | Privatemusings | CC BY-SA 3.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:ManlySeaEagles_CronullaSharks_Tackle.JPG) |
| `news-match.jpg` | Rugby League shirt pull | Jack86mkII | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Rugby_League_shirt_pull.jpg) |
| `news-training.jpg` | Tackle1 | Jack86mkII | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Tackle1.jpg) |
| `news-ground.jpg` | Hull KR vs Hull F.C. 7-9-2025 Second Half Ref and Minchella Confrontation | Hullian111 | CC BY-SA 4.0 | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Hull_KR_vs_Hull_F.C._7-9-2025_Second_Half_Ref_and_Minchella_Confrontation.jpg) |
| `club-history.jpg` | 1963 Challenge Cup Final | Unknown author | Public domain | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:1963_Challenge_Cup_Final.jpeg) |

Remaining photographs (`academy-pitch.jpg`, `news-community.jpg`,
`player-9.jpg`) are Unsplash placeholders as noted above.

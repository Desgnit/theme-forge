# Greenside — Lawn Bowls Club HTML Template

A warm, heritage-styled HTML + Tailwind CSS template for lawn bowls
clubs, bowling greens and community sports clubs. Ships with realistic
demo content for a fictional members' club — fixtures, results with
proper bowls scorelines and rink counts, a league table with shot
aggregates, member profiles, a finals-day report and a free taster
session booking form — so buyers see a real club website, not lorem
ipsum. The copy is written for the club's actual audience: clear,
unhurried and welcoming.

**No build step is required to use it** — the compiled CSS is included.
You only need Node.js if you want to change the club colours or fonts.

> Greenside is derived from our Boundary cricket template: same markup,
> classes and JavaScript, restyled and rewritten for bowls. The demo
> club is **Avonford Bowls Club** (est. 1907), with a six-rink flat
> green and a crown green at **Orchard Lane**, playing in the **Three
> Counties League Division One** — bowling green and heritage tan, with
> Playfair Display serif headings for a county-pavilion feel.

---

## What's included

| File | Page |
|---|---|
| `index.html` | Home — hero with match countdown, match centre, news, table, teams, sponsors |
| `club.html` | Club — history since 1907, county pennants on the honours board, the two greens, committee |
| `fixtures.html` | Match centre — fixtures / results / league table in accessible tabs |
| `squad.html` | Members & Teams grid with team filter (Saturday league, midweek triples, ladies' team, newcomers' roll-up) |
| `player-single.html` | Member profile — a club stalwart's record, honours and rink-sponsor CTA |
| `news.html` | News listing with featured finals-day report and newsletter signup |
| `news-single.html` | Finals-day report layout with scoreboard strip and results list |
| `contact.html` | Contact cards, enquiry form, directions, green fees, open days & clubhouse hire |
| `academy.html` | New Bowlers — free taster sessions, what to wear, equipment loaned, green etiquette, booking form, FAQ |

Plus:

- `assets/css/main.css` — compiled, minified stylesheet (~29 KB)
- `assets/css/skin.css` — the Greenside "heritage" skin, loaded after
  `main.css` (see below)
- `assets/js/main.js` — dependency-free vanilla JS (nav, countdown, tabs, filter, accordion, forms)
- `assets/img/` — demo imagery (replace with your own green and clubhouse photos)
- `src/input.css` — theme source with all club-colour variables
- `tailwind.config.js`, `package.json` — rebuild tooling

## Quick start

1. Unzip anywhere.
2. Open `index.html` in a browser. That's it — no server needed.
3. To publish, upload the folder (minus `src/`, `node_modules/`,
   `package.json`, `tailwind.config.js` if you like) to any static host:
   Netlify, Vercel, GitHub Pages, cPanel…

## Your club's colours

The default palette is **bowling green & heritage tan**. Every colour
and font resolves to CSS variables declared in the `:root` block of
`assets/css/main.css` (source of truth: `src/input.css`). Change those
values, rebuild, and the whole site is in your colours — **you never
edit HTML to rebrand**:

```css
:root {
  --tc-primary: 21 71 52;      /* bowling green — dark sections, headings */
  --tc-accent: 191 155 96;     /* heritage tan  — buttons, highlights     */
  --tc-win: 22 163 74;         /* W/L/D badge colours                     */
  --tc-font-display: "Playfair Display", ...;
  --tc-font-body: "Source Sans 3", ...;
}
```

Colour values are space-separated RGB channels (`21 71 52` = `#154734`)
so Tailwind's opacity modifiers keep working.

Rebuild after editing:

```bash
npm install        # once
npm run build      # writes assets/css/main.css
npm run watch      # optional: rebuild on save while you work
```

To change fonts, also update the Google Fonts `<link>` in the `<head>`
of each page, or remove it to use the system-font fallbacks.

## The Greenside skin (`assets/css/skin.css`)

Greenside layers a small (~80-line) skin stylesheet after `main.css` on
every page. It's what gives the theme its county-pavilion character
without touching the markup:

- generous corner radius (`--tc-radius: 0.75rem`) and warm cream
  section tints (`--tc-board`)
- a slightly larger base font size for comfortable reading
- serif headings in sentence case and italic serif kickers
- fine double-rule borders on cards, like a framed honours certificate
- understated outlined-pill buttons that fill on hover

Delete `skin.css` (and its `<link>`) to fall back to the plain compiled
theme, or edit it freely — it's deliberately short and commented.

## Editing content

- **Club name / crest** — the crest is an inline SVG in the header and
  footer of every page; swap it for your own. Find-and-replace
  `Avonford Bowls Club` (and `Avonford`) across the HTML files for the
  name.
- **Match countdown** — set the date on the hero's
  `data-countdown="2026-08-08T14:00:00"` attribute. Once the match
  starts it shows the message in `data-countdown-done`.
- **League table** — plain HTML table with bowls-style points (two per
  winning rink plus four for the shot aggregate — adjust the footnote to
  match your league's rules). Mark your own club's row with the
  `data-us` attribute to highlight it.
- **Fixtures & results** — each match is one self-contained `<li>` card;
  copy, paste, edit. Results use bowls scorelines (e.g. "Avonford 86
  beat Ledbury 74", home, six rinks) with W/L/D `.form-badge` classes.
- **Member teams** — the filter buttons keep their original
  `data-filter` keys (`gk`/`def`/`mid`/`fwd`) so the JavaScript is
  untouched; only the visible labels read Saturday league / Midweek
  triples / Ladies' team / Newcomers' roll-up. Assign members with the
  matching `data-category` attribute.
- **Images** — demo images are placeholders in `assets/img/` (carried
  over from the cricket theme). Replace with your club's photos (keep
  `width`/`height` attributes to avoid layout shift).
- **Favicon** — `assets/img/favicon.svg`.

## Forms

The taster booking, contact and newsletter forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) that validates input and shows
the success message without sending anything. To go live, point each
`<form>` at your endpoint — Formspree, Netlify Forms, or your club's
system — and remove the `data-demo-form` attribute.

## JavaScript behaviours

All optional, all vanilla, all in `assets/js/main.js`:

- Mobile navigation (Escape to close, `aria-expanded` managed)
- Match countdown (days/hours/minutes, updates every 30s)
- Accessible tabs with arrow-key support (fixtures page)
- Members team filter
- One-open accordion built on native `<details>` (new bowlers' FAQ)
- Scroll-reveal animations (fully disabled under `prefers-reduced-motion`)
- Sticky header shadow, footer year

## Accessibility

Built to WCAG 2.1 AA, with the theme's 55+ core audience in mind:
semantic landmarks, skip link, visible focus states, labelled form
controls, `aria-current` navigation, keyboard-operable tabs and
accordion, table captions for screen readers, AA-checked colour
contrast, a larger base font size, and reduced-motion support.

## Mobile & iPhone

Tested at iPhone viewports (390/375px): no horizontal scroll on any
page, hamburger navigation with Escape-to-close, 16px+ form inputs (so
iOS Safari never zoom-jumps on focus), and an `apple-touch-icon` for
home-screen bookmarks.

## Browser support

All modern evergreen browsers (Chrome, Edge, Firefox, Safari — last two
versions). No IE11.

## Credits & licence

- [Tailwind CSS](https://tailwindcss.com) (MIT) — build-time only
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) &
  [Source Sans 3](https://fonts.google.com/specimen/Source+Sans+3) via
  Google Fonts (OFL)
- Demo photographs from [Unsplash](https://unsplash.com/license) (free
  for commercial use, no attribution required). They are placeholders —
  replace them with your club's own consented photography before launch.
- All demo copy, club names, people and badges are fictional.

Licence per the marketplace you purchased from (single-site licence
unless stated otherwise). Thanks for buying Greenside — the kettle's on.

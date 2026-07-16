# Hedgerow — Farm Shop & Butchery HTML Template

A rustic-premium, responsive HTML + Tailwind CSS template for farm shops,
butcheries, delis, greengrocers and food producers. Ships with realistic
demo content for a fictional Peak District family farm shop so buyers see
their own world, not lorem ipsum — beef boxes, veg box rounds, raw milk
vending and sourdough Fridays included.

**No build step is required to use it** — the compiled CSS is included.
You only need Node.js if you want to change the brand colours or fonts.

---

## What's included

| File | Page |
|---|---|
| `index.html` | Home — hero, in-season strip, shop sections, opening hours, featured produce, farm story, farm notes, CTA |
| `about.html` | Our Farm — four generations, how we farm, timeline, the family |
| `products.html` | The Shop — produce grid with shop-section filter and pagination |
| `product-single.html` | Single product — a beef box with provenance table, cooking notes tab and reserve form |
| `services.html` | Beyond the Shop — veg box rounds, hampers, counter orders, café corner, group visits |
| `blog.html` | Farm Notes listing with featured post and newsletter signup |
| `blog-single.html` | Farm note layout with author box and related posts |
| `contact.html` | Visit Us — contact cards, order enquiry form, map placeholder, FAQ accordion |

Plus:

- `assets/css/main.css` — compiled, minified stylesheet (~26 KB)
- `assets/css/skin.css` — the rustic-premium skin: cream paper, offset
  hand-drawn borders, kraft produce labels (plain CSS, edit freely)
- `assets/js/main.js` — dependency-free vanilla JS (nav, tabs, accordion, filter, gallery, forms)
- `assets/img/` — SVG demo imagery (replace with your photography)
- `src/input.css` — theme source with all brand variables
- `tailwind.config.js`, `package.json` — rebuild tooling

## Quick start

1. Unzip anywhere.
2. Open `index.html` in a browser. That's it — no server needed.
3. To publish, upload the folder (minus `src/`, `node_modules/`,
   `package.json`, `tailwind.config.js` if you like) to any static host:
   Netlify, Vercel, GitHub Pages, cPanel, S3…

## Rebranding — colours & fonts

Every colour and font in the theme resolves to CSS variables declared at the
top of `src/input.css`. Change those values, rebuild, and the whole site
updates — **you never edit HTML to rebrand**.

```css
:root {
  --fl-primary: 61 46 33;    /* soil brown     — headings, dark sections */
  --fl-accent: 101 163 13;   /* hedgerow green — buttons, highlights     */
  --fl-font-display: "Fraunces", ...;
  --fl-font-body: "Inter", ...;
  --fl-radius: 0.625rem;     /* corner rounding across cards & buttons   */
}
```

Colour values are space-separated RGB channels (`61 46 33` = `#3d2e21`) so
Tailwind's opacity modifiers keep working.

The cream page tint, offset borders and kraft-label chips live in
`assets/css/skin.css`, loaded after `main.css` on every page. It overrides
the paper/board/line variables and needs no build step — edit and refresh.
Delete the `skin.css` link to fall back to the plain compiled theme.

Rebuild after editing `src/input.css`:

```bash
npm install        # once
npm run build      # writes assets/css/main.css
npm run watch      # optional: rebuild on save while you work
```

To change fonts, also update the Google Fonts `<link>` in the `<head>` of
each page (a find-and-replace across the eight HTML files takes seconds),
or remove it entirely to use the system-font fallbacks. The theme ships
with Fraunces (display) and Inter (body).

## Editing content

- **Business name / contact details** — appear in the top bar, header and
  footer of every page. Find-and-replace `Hedgerow Farm Shop`,
  `01629 640 213` and `shop@hedgerowfarmshop.co.uk` across all HTML files.
- **Opening hours** — in the utility bar, home-page hours section, footer
  and contact FAQ. Search for `Tue` to catch every instance.
- **Logo** — the leaf mark is an inline SVG in the header and footer of
  each page; swap it for your own `<img>` or SVG mark.
- **Images** — demo images are SVGs in `assets/img/`. Replace them with
  your photos (keep the same filenames, or update the `src` attributes).
  Keep `width`/`height` attributes to avoid layout shift.
- **Shop sections** — the filter buttons on `products.html` pair with each
  card's `data-category` attribute. Rename a section by changing the button
  text *and* its `data-filter` value *and* the matching `data-category`
  values together.
- **Favicon** — `assets/img/favicon.svg`.

## Forms

The order enquiry, reserve-a-box and newsletter forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) that validates input and shows
the success message without sending anything. To go live, point each
`<form>` at your endpoint — Formspree, Netlify Forms, Basin, or your own
CRM — and remove the `data-demo-form` attribute.

## JavaScript behaviours

All optional, all vanilla, all in `assets/js/main.js`:

- Mobile navigation (Escape to close, `aria-expanded` managed)
- Sticky header shadow on scroll
- Scroll-reveal animations (fully disabled under `prefers-reduced-motion`)
- Accessible tabs with arrow-key support (product page)
- One-open accordion built on native `<details>` (contact FAQ)
- Client-side shop-section filter demo (The Shop page)
- Product image gallery thumbnails

## Accessibility

Built to WCAG 2.1 AA: semantic landmarks, skip link, visible focus states,
labelled form controls, `aria-current` navigation, keyboard-operable tabs
and accordion, AA-checked colour contrast, and reduced-motion support.

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
- [Fraunces](https://fonts.google.com/specimen/Fraunces) &
  [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts (OFL)
- Demo photographs from [Unsplash](https://unsplash.com/license) (free
  for commercial use, no attribution required); produce images are
  original SVG renders included with the theme.
- All demo copy, business names and people are fictional.

Licence per the marketplace you purchased from (single-site licence unless
stated otherwise). Thanks for buying Hedgerow — grow something good.

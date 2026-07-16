# Vanguard — Man & Van / Removals HTML Template

A premium, responsive HTML + Tailwind CSS template for removals firms and
man-and-van operators, shipped with a complete demo company (Vanguard
Removals, Reading). Five pages: Home, Services, Recent moves, About and a
quote-request page — built around what wins moving work: ballpark prices
upfront, goods-in-transit insurance on show, real moves with real numbers,
and a phone number everywhere.

**No build step is required** — the compiled CSS is included. The visual
identity lives in two places: brand variables (`:root` in
`assets/css/main.css`, source in `src/input.css`) and a small skin layer
in `assets/css/skin.css` — dashed route-line accents, arrow-tipped
buttons, green checklist ticks — which loads after `main.css` on every
page and can be edited freely without Node. Node.js is only needed to
recompile `main.css` (`npm install && npm run build`). Fonts are Chivo
(display) + Inter (body) via Google Fonts.

Editing: find-and-replace **Vanguard Removals**, **0118 496 0342** and
**vanguardremovals.co.uk**; swap the photos in `assets/img/` for your own
vans and crews (keep width/height attributes); paste your real reviews
over the demo ones. Forms use a demo handler (`data-demo-form` in
`assets/js/main.js`) — point them at Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all companies, people, reviews,
prices and phone numbers are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Vanguard.

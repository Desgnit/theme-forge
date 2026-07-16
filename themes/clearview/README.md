# Clearview — Window Cleaning / Recurring Round HTML Template

A light, airy HTML + Tailwind CSS template for window cleaners and other
round-based local services, shipped with a complete demo company
(Clearview Window Cleaning, Norwich — a father-and-daughter team). Five
pages: Home, Services, Rounds & recent work, About and a join-the-round
page — built around what wins round work: reliability, "we're in your
street every 4 weeks", night-before texts, camera-proof gutter clears
and pay-online-after-each-clean convenience.

**No build step is required** — the compiled CSS is included, and the
Clearview look (sky palette, Nunito Sans, pill buttons, soft shadows,
dotted dividers) lives in `assets/css/skin.css`, loaded after
`main.css`. Tweak the skin freely without rebuilding. Node.js is only
needed for deeper changes (edit `src/input.css`, then
`npm install && npm run build`). Every colour is a CSS variable.

Editing: find-and-replace **Clearview Window Cleaning**, **01603 496 118**
and **clearviewwindows.co.uk**; swap the photos in `assets/img/` for your
own before/after shots (keep width/height attributes); paste your real
reviews over the demo ones; update the round-area chips and price guide.
Forms use a demo handler (`data-demo-form` in `assets/js/main.js`) —
point them at Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all companies, people, reviews,
prices and numbers are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Clearview.

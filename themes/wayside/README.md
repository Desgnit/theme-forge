# Wayside — Caravan & Camping Site HTML Template

A premium, responsive HTML + Tailwind CSS template for caravan parks and
campsites, shipped with a complete demo site (Wayside Meadow Caravan &
Camping, on the North Yorkshire coast near Whitby). Five pages: Home,
Pitches & Prices, The Site & Around, About and a booking-enquiry page —
built around what fills a campsite: clear pitch prices by season, honest
facilities, photos of the place and directions that stop caravans getting
stuck in the lane.

**No build step is required** — the compiled CSS is included. Node.js is
only needed to change colours/fonts (edit `src/input.css`, then
`npm install && npm run build`). Every colour is a CSS variable, and the
outdoorsy identity (contour-line hero bands, cream boards, signpost
kickers, badge-style price tags) lives in `assets/css/skin.css`, loaded
after `main.css` on every page.

Editing: find-and-replace **Wayside Meadow**, **01947 896 043** and
**waysidemeadow.co.uk**; put your own prices in the season table on
`services.html`; swap the photos in `assets/img/` for your meadow, pitches
and views (keep width/height attributes); paste your real reviews over the
demo ones. Forms use a demo handler (`data-demo-form` in
`assets/js/main.js`) — point them at Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all companies, people, reviews,
prices and places are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Wayside.

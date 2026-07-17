# Showroom — Mobile Car Valeting / Detailing HTML Template

A premium, responsive HTML + Tailwind CSS template for mobile valeting
and detailing businesses, shipped with a complete demo company
(Showroom Mobile Valeting, Milton Keynes). Five pages: Home, Packages,
Recent details, About and a booking page — built around what wins
detailing work: package prices up front, before-and-after proof,
reviews and a phone number everywhere.

The visual identity is a dark automotive gloss: gloss-black hero, CTA
and footer bands with a diagonal paint-sheen gradient, cyan edge-glow
on cards, squared-off corners and prices set on number-plate-style
"spec plates". The skin lives in `assets/css/skin.css` (loaded after
`assets/css/main.css`) so it is easy to tune or strip back.

**No build step is required** — the compiled CSS is included. Node.js is
only needed to change base colours/fonts (edit `src/input.css`, then
`npm install && npm run build`). Every colour is a CSS variable; the
Showroom palette and the Saira/Inter font pairing are set in the
`:root` block of `assets/css/main.css` and in `assets/css/skin.css`.

Editing: find-and-replace **Showroom Mobile Valeting**, **01908 550 412**
and **showroomvaleting.co.uk**; swap the photos in `assets/img/` for
your own before-and-after shots (keep width/height attributes); paste
your real reviews over the demo ones. Forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) — point them at
Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all companies, people, reviews
and prices are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Showroom.

## Image credits

- `assets/img/hero.jpg` — "A person operates a pressure washer to clean a black car, surrounded by bright sunlight at an outdoor car wash" by Shixart1985, CC BY 2.0, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:A_person_operates_a_pressure_washer_to_clean_a_black_car,_surrounded_by_bright_sunlight_at_an_outdoor_car_wash.jpg)
- `assets/img/house-white.jpg` — "Car washing activity at a residential driveway" by Shixart1985, CC BY 2.0, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Car_washing_activity_at_a_residential_driveway.jpg)

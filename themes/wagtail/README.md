# Wagtail — Dog Groomer / Pet Care HTML Template

A warm, responsive HTML + Tailwind CSS template for dog groomers and pet
care businesses, shipped with a complete demo company (Wagtail Dog
Grooming, Chester). Five pages: Home, Services & prices, Fresh trims
(before/after gallery), About and a booking-request page — built around
what wins grooming work: clear prices by dog size, owner reviews, calm
one-dog-at-a-time trust signals and a phone number everywhere.

**No build step is required** — the compiled CSS is included, and the
visual identity (cocoa/apricot palette, Quicksand + Nunito, extra-round
corners, paw-print bullets) lives in CSS variables plus a small
`assets/css/skin.css` overlay loaded after `main.css`. Node.js is only
needed if you change the Tailwind source (`src/input.css`, then
`npm install && npm run build`); tweak `skin.css` freely with no build.

Editing: find-and-replace **Wagtail Dog Grooming**, **01244 470 213**
and **wagtailgrooming.co.uk**; swap the placeholder photos in
`assets/img/` for your own dog photos (keep the width/height
attributes); paste your real reviews over the demo ones; adjust the
size/coat prices on `services.html` and the home-page price guide. The
booking form uses a demo handler (`data-demo-form` in
`assets/js/main.js`) — point it at Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. All companies, people,
dogs, reviews and prices are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Wagtail.

## Image credits

- `assets/img/hero.jpg` — "Dog Stylin'" by japanese_craft_construction, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Dog_Stylin%27_(3406880422).jpg
- `assets/img/about.jpg` — "Dog Grooming, Gospel Oak" by Simon from London, United Kingdom, CC BY 2.0, https://commons.wikimedia.org/wiki/File:Dog_Grooming,_Gospel_Oak_(51583702101).jpg
- `assets/img/house-white.jpg` — "American Eskimo — GCH Anana's Look Into The Future CGC" by Pets Adviser from Brooklyn, USA, CC BY 2.0, https://commons.wikimedia.org/wiki/File:American_Eskimo-10-GCH-Anana%27s_Look_Into_The_Future_CGC_01_(16583766991).jpg
- `assets/img/house-modern.jpg` — "2014 Westminster Kennel Club Dog Show" by Pets Adviser from Brooklyn, USA, CC BY 2.0, https://commons.wikimedia.org/wiki/File:2014_Westminster_Kennel_Club_Dog_Show_(12452143744).jpg
- `assets/img/tools-wall.jpg` — "2014 Westminster Kennel Club Dog Show" by Pets Adviser from Brooklyn, USA, CC BY 2.0, https://commons.wikimedia.org/wiki/File:2014_Westminster_Kennel_Club_Dog_Show_(12451534873).jpg

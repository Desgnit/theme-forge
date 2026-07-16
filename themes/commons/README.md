# Commons — Village Hall / Community Centre HTML Template

A premium, responsive HTML + Tailwind CSS template for village halls,
community centres and church halls, shipped here with a complete demo
venue (Elmsworth Village Hall, a charity-run 1928 hall in the
Cotswolds). Five pages: Home, Hire the Hall, What's On, About and a
booking-enquiry page — built around what a hall website actually needs:
rooms and rates, the weekly clubs, accessibility details and a booking
contact everywhere.

**No build step is required** — the compiled CSS is included. Node.js is
only needed to change colours/fonts (edit `src/input.css`, then
`npm install && npm run build`). Every colour is a CSS variable.

Editing: find-and-replace **Elmsworth Village Hall**, **01632 960 428**
and **elmsworthvillagehall.org.uk**; replace the charity number
placeholder with your registered charity number; swap the photos in
`assets/img/` for your own hall photos (keep width/height attributes);
put your real clubs, rates and events over the demo ones. Forms use a
demo handler (`data-demo-form` in `assets/js/main.js`) — point them at
Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all halls, people, clubs,
reviews and numbers are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Commons.

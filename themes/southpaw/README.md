# Southpaw — Boxing & Martial Arts Gym HTML Template

A dark, punchy, responsive HTML + Tailwind CSS template for boxing and
martial arts gyms, shipped with a complete demo club (Southside Boxing
Academy, Salford — England Boxing affiliated, est. 2011). Five pages:
Home, Classes & Timetable, Our Fighters, About and a first-session
booking page — built around what fills a gym: a free first session,
a clear weekly timetable, honest pricing and coaches people trust.

**No build step is required** — the compiled CSS is included, and the
visual identity (near-black surfaces, fight-red accents, square corners,
oversized Anton display type) lives in `assets/css/skin.css`, a small
override layer loaded after `main.css` on every page. Tweak the skin
directly, or edit the CSS variables in `src/input.css` and rebuild with
`npm install && npm run build`.

Editing: find-and-replace **Southside Boxing Academy**, **0161 496 0871**
and **southsideboxing.co.uk**; update the timetable lines and membership
prices on `services.html`; swap the photos in `assets/img/` for your own
gym shots (keep width/height attributes); paste your members' real words
over the demo stories. Forms use a demo handler (`data-demo-form` in
`assets/js/main.js`) — point them at Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all clubs, people, results
and stories are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Southpaw.

## Image credits

All photographs in `assets/img/` (`hero.jpg`, `about.jpg`,
`house-white.jpg`, `house-modern.jpg`, `tools-wall.jpg`) are sourced
from [Unsplash](https://unsplash.com/license) (free for commercial use,
no attribution required). Individual author records are not tracked in
`marketing/stock/credits.json` for the fitness collection; the images
correspond to the stock files `boxing-training.jpg`,
`gym-moody-equipment.jpg`, `team-high-five.jpg`, `athlete-chalk.jpg`
and `crossfit-tire.jpg` in `marketing/stock/fitness/`.

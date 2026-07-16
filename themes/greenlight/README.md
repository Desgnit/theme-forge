# Greenlight — Driving Instructor / Driving School HTML Template

A premium, responsive HTML + Tailwind CSS template for driving
instructors and small driving schools, shipped with a complete demo
business (Greenlight Driving School, Leicester — a DVSA ADI Grade A
instructor with manual and automatic cars). Five pages: Home, Lessons &
prices, Recent passes, About and a lesson-booking page — built around
what wins learners: prices up front, a first-time pass rate, a pass
photo wall and a calm, confidence-building voice.

**No build step is required** — the compiled CSS is included. The visual
identity lives in two layers: brand colours and the Rubik type ramp are
CSS variables in `assets/css/main.css` (source: `src/input.css`, rebuilt
with `npm install && npm run build`), and the Greenlight look — the
traffic-light kicker dots, green progress-bar underlines, L-plate stat
badges, pill buttons and mint section tints — is a small override file,
`assets/css/skin.css`, loaded after `main.css` on every page.

Editing: find-and-replace **Greenlight Driving School**, **Marcus
Bell**, **0116 496 0210** and **greenlightdriving.co.uk**; swap the
photos in `assets/img/` for your own pass photos (keep width/height
attributes); paste your real learner reviews over the demo ones; and put
your own areas and test centres in the footer. Forms use a demo handler
(`data-demo-form` in `assets/js/main.js`) — point them at
Formspree/Netlify Forms to go live.

Tested at iPhone widths (390/375px, no horizontal scroll), WCAG-AA
patterns throughout, apple-touch-icon included. Demo photographs from
[Unsplash](https://unsplash.com/license); all businesses, people, pass
rates and reviews are fictional placeholder content.

Licence per the marketplace you purchased from. Thanks for buying Greenlight.

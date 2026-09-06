# Sports Social Marketing — proof-of-concept website

A static proof of concept for **sportssocialmarketing.com**, built to show Anthony
Cooper what his portfolio could look like presented as a company rather than a
personal profile.

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | Home — hero, client logo wall, growth numbers, services, Football Content Awards, approach, six case studies, references, objection handling, sectors, founder, insights, contact |
| `work.html` | All nine case studies in full, with results and named references |
| `contact.html` | Contact details, engagement models and enquiry form |
| `assets/css/site.css` | The whole design system — colours, type and components live in the `:root` block at the top |
| `assets/css/fonts.css` | Self-hosted Anton + Inter (SIL Open Font License 1.1) |
| `assets/js/site.js` | Mobile nav, scroll reveals, stat count-up, demo form handler |
| `assets/img/` | Founder photo, awards photo and the client logo tiles |
| `build-single-file.py` | Bundles all three pages into one self-contained HTML file in `dist/` |

No build step and no dependencies for the site itself. Open `index.html` in a
browser, or drop the folder on any host.

    python3 build-single-file.py   # -> dist/sports-social-marketing.html (one file, ~950 KB)

## The pitch the page makes

The whole page is built to answer objections before they're raised:

1. **Credibility first** — real client marks and hard numbers above the fold.
2. **Proof over promises** — every case study carries a result and, where one
   exists, a named reference.
3. **Objection handling** — a dedicated section answering "we already have a
   social team", "agencies are expensive", "you don't know our sport", "we've
   been burned before", "will it make money", "how fast".
4. **A low-commitment first step** — a fixed-scope, fixed-price audit, repeated
   in ten calls to action plus a sticky mobile bar.

## Where the content came from

| Claim on the page | Source |
| --- | --- |
| 210M+ unique users | Reported figure for the combined Snack Media / GiveMeSport audience at acquisition (SBC News, SportBusiness, May 2020) |
| GiveMeSport = biggest global sports publisher on Facebook | Same acquisition coverage |
| 5B+ SPORTbible video views, 1,000+ channels | Anthony's own LinkedIn summary |
| 2B+ subscribers (TheSoul), 20M users (FUTBIN), 50M+ annual reach (FCA) | anthonycooper.journoportfolio.com |
| 2× social video, ~50% workload cut | Nick Callow's testimonial, quoted verbatim |
| 1M+ votes in a year | Snack Media, "Football Content Awards 2020 surpasses 1 million votes" |
| FCA history, 500+ guests, venues, partners | footballcontentawards.com/about |
| All eight testimonials | Quoted verbatim from the portfolio, names and titles intact |

**Anthony should sanity-check the 5B+ views and 1,000+ channels figures** before
this goes live — they come from his own LinkedIn rather than a published source,
and they're the two biggest numbers on the page.

## Before this goes live

- **Domain and email.** `hello@sportssocialmarketing.com` is a placeholder — it
  needs setting up, or swapping for a real inbox. The phone number is the one
  already published on the current portfolio site.
- **The contact forms are inert.** They show a "demo only" message on submit.
  Wire them to a form handler (or to Contact Form 7 / Gravity Forms if this
  becomes a WordPress theme).
- **Image rights.** The client logo tiles and the awards ceremony photo are
  lifted from Anthony's own portfolio and from footballcontentawards.com. The
  founder photo and the awards photo are FCA event photography — get the
  photographer's sign-off, and check each brand is happy to be named as a client
  before publishing.
- **Insight articles are sample titles**, marked as such on the page. Either
  write them or drop the section.
- **Analytics, sitemap and robots.txt** are not included.

## Rebranding

Every colour, font and radius is a CSS custom property in the `:root` block of
`assets/css/site.css`. Changing `--accent` changes the whole site's accent
colour; nothing in the HTML carries a hard-coded colour.

# Sheffield Tigers RUFC — club website

A complete, responsive website for Sheffield Tigers RUFC, the rugby union
club at Dore Moor, Sheffield (est. 1932). Built on the Tryline club
template (HTML + Tailwind CSS) and fully rebranded: black & gold colours,
a newly designed tiger crest, rugby-union content throughout (National
League 2 North fixtures, 15-man squad numbering, union scoring), and the
club's Dore Moor home.

**No build step is required** — open `index.html` in a browser, or upload
the folder to any static host. Node is only needed to rebuild the core
stylesheet (`npm install && npm run build`).

## Pages

| File | Page |
|---|---|
| `index.html` | Home — poster hero, match centre with countdown, news, league table, teams, sponsors |
| `club.html` | The club — history since 1932, honours, **the new badge**, Dore Moor, committee |
| `fixtures.html` | Match centre — fixtures / results / National League 2 North table in accessible tabs |
| `squad.html` | 1st XV squad grid with union position filters (back three, half-backs, front row, locks & back row) |
| `player-single.html` | Player profile — apps, tries and points season by season |
| `news.html` | News listing with featured match report |
| `news-single.html` | Match report with scoreboard strip and full 15-man team lists |
| `juniors.html` | Juniors — minis to Colts, Sunday rugby, sign-on form, parents' FAQ |
| `contact.html` | Contact, enquiry form, directions to Dore Moor, clubhouse hire |

## The new crest

Designed for this site as pure SVG (no font or image dependencies):

- `assets/img/crest.svg` — full crest: geometric gold tiger head on a
  black shield edged in gold, tiger-stripe field, "EST. 1932" banner.
  Showcased on the club page.
- `assets/img/favicon.svg` — compact crest (no banner) used as the
  favicon and inlined in the header/footer of every page.
- `assets/img/apple-touch-icon.png` — 180×180 raster export for
  home-screen bookmarks.

Colours: tiger black `#17181c` and amber gold `#f59e0b`, matching the
site palette in `assets/css/skin.css` / `src/input.css`.

## Colours

The identity lives in CSS variables. `assets/css/skin.css` (loaded after
the compiled `main.css`, no rebuild needed) overrides the palette to
black & gold; `src/input.css` carries the same values for anyone
rebuilding from source.

## Demo content

All fixtures, results, people, statistics and sponsors are illustrative
demo content, not real club data. Photographs are the Tryline template's
licensed placeholder images (see the repository's
`marketing/stock/credits.json`) — replace with the club's own consented
photography before a real launch, especially anything showing juniors.

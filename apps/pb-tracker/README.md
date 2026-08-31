# Hyrox Tracker

A phone-first web app for logging every line of the coach's Client PB Tracker sheet —
times, watts, lifts and one-minute tests — then seeing your personal bests,
your progress graphs, medals for your top three efforts and a single fitness
score out of 100.

It is a static site: HTML, CSS and plain JavaScript, no build step and no
framework. Open `index.html` and it works, entirely on-device. Optionally,
connect a free Supabase project and it becomes a synced, signed-in app whose
history follows you between devices — with read-only access for a coach you
invite. Each entry form carries a small pictogram of the movement, and every
list uses the sheet's own wording, so the app and the printed tracker always
agree line for line.

---

## Using it

**On your phone (the way it is meant to be used)**

1. Open the app's URL in Chrome or Safari.
2. Chrome: menu → *Add to Home screen*. Safari: share → *Add to Home Screen*.
3. It then opens full screen like any other app, and works with no signal —
   handy in a gym basement.

**On a laptop** — same URL, or open `index.html` straight off disk.

### The four screens

| Screen | What it does |
| --- | --- |
| **Log** | Every activity as a tap target, grouped by the five sections of the sheet. Two taps from opening the app to typing a result. |
| **PBs** | All 23 rows of the tracker with your best, the date, a mini trend line. Tap a row for its full page. |
| **Score** | Overall fitness score, a score per section and a score per activity, plus what to work on next. |
| **History** | Everything you have logged, newest first, medals and all. |

An activity's own page has the progress graph, the top-three podium, the full
history with medals, and what you need to hit to reach the next band.

### Entering results

- **Times** can be typed as `8:42`, `1:02:33`, `8:42.4`, or as plain seconds
  (`522`). The app echoes back how it read your input before you save.
- **2km row and ski** — enter the total time only. The 500m pace row fills
  itself in.
- **5km run** — the five 1km splits are optional, and filling all five fills
  in the total for you.
- Everything else is one number.

Log a new best and the app tells you straight away.

---

## The plan start date

The cog screen holds a **plan start date** (set for 7 September out of the
box). Until then the Log screen carries a **Baseline test week** card
tracking the four tests the coach wants first — 5km run, 2km ski, 2km row and
the 20-minute bike — ticking them off as they are logged. Afterwards, any
activity with entries on both sides of the date shows your gain on the
pre-plan baseline. Clear the date and the plan features disappear.

The Data screen also exports a **CSV** of every entry, for a spreadsheet or
for sending numbers on in bulk.

## Sync and coach access (optional)

Out of the box nothing leaves the device. The **Sync & coach** card on the
Data screen connects a [Supabase](https://supabase.com) project (free tier is
fine): sign in by emailed code or magic link, and the app then syncs on
start, shortly after every change, and on demand. Two devices reconcile by
"newest write wins", deletes included, and a device with a wrong clock can
lose a conflict but can never be skipped.

Coach access is invitation-only: the athlete mints a one-use code, the coach
redeems it, and gets a read-only **Your athletes** screen. The athlete can
revoke it any time.

Setup is a one-time ten minutes: see [`supabase/SETUP.md`](supabase/SETUP.md).
The schema, security rules and conflict handling live in
[`supabase/schema.sql`](supabase/schema.sql) — the anon key the browser holds
is public by design, and row-level security is what keeps rows private.

## Where your data lives

Entries are saved in the browser's own storage on the device you logged them
on. Nothing is uploaded anywhere, there is no account and no server to lose
them to.

That has one consequence worth knowing: **the data does not follow you between
phones or browsers by itself**. Clearing your browsing data, or the phone
reclaiming storage from a site you have not opened in months, will take it
with it. So:

- The app asks the browser to mark its data as permanent (`navigator.storage
  .persist()`), which stops routine eviction on Android and desktop Chrome.
- **Data & backup** (the cog, top right) saves a `.json` file of
  everything. That file is the backup, and it is also how you move your
  history to a new phone — download on the old one, then *Restore → Merge in*
  on the new one. Merge keeps what is already there and adds anything missing,
  so restoring twice is harmless.

Do a backup after any session you would be annoyed to lose.

---

## How the score works

Every **scored** activity sits on a 0–100 scale between two benchmarks: the 0
end is a fit-but-untrained adult completing the test, the 100 end is a strong
competitive hybrid athlete. A **section** scores the average of the activities
you have logged in it. The **overall** score is the average of the sections
with any data, so the five sections carry equal weight and the eight
one-minute tests cannot drown out the 5km run.

Bands: Foundation (0–34), Developing (35–54), Strong (55–74), Advanced
(75–89), Elite (90+).

Pace per 500m and the 1km splits get PBs, graphs and medals but are **not
scored** — they are the same effort as their parent activity, so counting them
would be double-marking one row.

### The benchmarks

They are general hybrid-fitness reference points for an adult of roughly 80kg,
not a clinical measure, and they take no account of bodyweight, age or sex.
Treat the score as a way to compare you against you.

| Activity | 0 points | 100 points |
| --- | --- | --- |
| Average watts, 20 min bike | 80 W | 330 W |
| 2km Row | 10:00 | 6:20 |
| 2km Ski | 11:00 | 7:10 |
| 5km Run | 40:00 | 18:00 |
| 3RM Back Squat | 50 kg | 180 kg |
| 3RM Bench Press | 30 kg | 130 kg |
| 3RM Deadlift | 60 kg | 220 kg |
| 3RM Strict Press | 20 kg | 85 kg |
| 60s Max Ski | 12 cal | 34 cal |
| 60s Max Row | 12 cal | 36 cal |
| 60s Wall Balls | 12 reps | 40 reps |
| 60s Burpee Broad Jumps | 12 m | 45 m |
| 60s Walking Lunges | 15 m | 70 m |
| 60s Sled Pull | 15 m | 80 m |
| 60s Sled Push | 12 m | 60 m |
| Dead Hang | 20 s | 180 s |

**Changing them** is one edit: the `bench: [zero, hundred]` pair on each metric
in `assets/js/data.js`. Times are in seconds. The ordering carries the
direction, so a faster time and a heavier lift are handled by the same line of
maths — put the worse value first either way.

---

## Getting a copy out of the repo

`python3 tools/bundle.py` inlines the stylesheet and every script into a
single `dist/pb-tracker.html` — one file, no dependencies, still saves your
entries. Handy for emailing the app to someone or keeping a copy on a USB
stick. `--fragment` does the same without the outer `<html>` wrapper, for
hosts that supply their own document shell.

## The files

```
index.html               app shell, header and tab bar
supabase/schema.sql      tables, security rules, conflict handling
supabase/SETUP.md        the one-time setup walkthrough
manifest.webmanifest     home-screen install metadata
sw.js                    service worker: caches the shell so it runs offline
assets/css/app.css       the whole stylesheet
assets/js/art.js         the exercise pictograms
assets/js/data.js        the 23 tracker rows, their units and benchmarks
assets/js/format.js      parsing and display of times and numbers
assets/js/store.js       localStorage: entries, PBs, medals, backup/restore
assets/js/score.js       the 0-100 scoring
assets/js/chart.js       the SVG progress graphs, no chart library
assets/js/sync.js        optional Supabase sync + coach access
assets/js/app.js         screens, routing, forms
tools/make-icons.py      regenerates the app icons (no image library needed)
```

Adding a row to the tracker means adding one entry to `METRICS` in
`assets/js/data.js` and, if it needs its own log card, one to `FORMS`. Every
screen picks it up from there.

## Deploying

The repo's `marketing/build-demos.sh` copies this folder into the demo site as
`pb-tracker/`, so it publishes to GitHub Pages with everything else on a push
to `main`. Any static host works just as well — it is a folder of files.

The service worker only registers over http(s), so opening `index.html` from
disk works but will not cache for offline use. To try that locally:

```sh
cd apps/pb-tracker && python3 -m http.server 8777
# then open http://localhost:8777
```

## Tests

`python3 tests/test_pb_tracker.py` from the repo root checks the catalogue,
benchmarks, manifest and service worker shell list stay consistent.

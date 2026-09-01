/* Client PB Tracker — activity catalogue, units and benchmarks.
 *
 * Every row on the paper tracker exists here as a "metric". Metrics that are
 * arithmetic consequences of another entry (pace per 500m) or components of it
 * (1km splits) are marked derived: they get PBs, medals and graphs like any
 * other metric, but they are left out of the fitness score so a single effort
 * cannot be counted twice.
 *
 * bench: [value worth 0 points, value worth 100 points]. Ordering encodes the
 * direction, so one interpolation covers "faster is better" and "more is
 * better" alike. Numbers are hybrid-fitness reference points for an adult of
 * roughly 80kg: the 0 end is a fit-but-untrained adult completing the test,
 * the 100 end is a strong competitive hybrid athlete. See README.md before
 * treating them as gospel — they are one edit away from being yours.
 */
(function (PB) {
  "use strict";

  var SECTIONS = [
    { id: "bike", n: 1, name: "Indoor Bike", icon: "bike" },
    { id: "ergs", n: 2, name: "Ergs", icon: "erg" },
    { id: "run", n: 3, name: "5km Run", icon: "run" },
    { id: "strength", n: 4, name: "Strength", sub: "3RM", icon: "strength" },
    { id: "tests", n: 5, name: "60 Second Tests & Static", icon: "pulse" },
    { id: "body", n: 6, name: "Bodyweight", icon: "scale" }
  ];

  var METRICS = [
    { id: "bike20_watts", section: "bike", name: "Average Watts - 20 Minutes Indoor Bike", short: "20min Bike", unit: "watts", bench: [80, 330] },

    { id: "row2k_total", section: "ergs", name: "2km Row (Total Time)", short: "2km Row", unit: "time", bench: [600, 380] },
    { id: "row2k_pace", section: "ergs", name: "2km Row (Pace per 500m)", unit: "pace", derived: "row2k_total" },
    { id: "ski2k_total", section: "ergs", name: "2km Ski (Total Time)", short: "2km Ski", unit: "time", bench: [650, 415] },
    { id: "ski2k_pace", section: "ergs", name: "2km Ski (Pace per 500m)", unit: "pace", derived: "ski2k_total" },

    { id: "run5k_total", section: "run", name: "5km Run (Total Time)", short: "5km Run", unit: "time", bench: [2400, 1080] },
    { id: "run5k_s1", section: "run", name: "5km Run (1km Split 1)", unit: "time", derived: "run5k_total" },
    { id: "run5k_s2", section: "run", name: "5km Run (1km Split 2)", unit: "time", derived: "run5k_total" },
    { id: "run5k_s3", section: "run", name: "5km Run (1km Split 3)", unit: "time", derived: "run5k_total" },
    { id: "run5k_s4", section: "run", name: "5km Run (1km Split 4)", unit: "time", derived: "run5k_total" },
    { id: "run5k_s5", section: "run", name: "5km Run (1km Split 5)", unit: "time", derived: "run5k_total" },

    { id: "squat_3rm", section: "strength", name: "3RM Back Squat", unit: "kg", bench: [50, 180] },
    { id: "bench_3rm", section: "strength", name: "3RM Bench Press", unit: "kg", bench: [30, 130] },
    { id: "deadlift_3rm", section: "strength", name: "3RM Deadlift", unit: "kg", bench: [60, 220] },
    { id: "press_3rm", section: "strength", name: "3RM Strict Press", unit: "kg", bench: [20, 85] },

    { id: "ski60_cals", section: "tests", name: "60s Max Ski (Calories)", unit: "cals", bench: [12, 34] },
    { id: "row60_cals", section: "tests", name: "60s Max Cals Row", unit: "cals", bench: [12, 36] },
    { id: "wallball60", section: "tests", name: "60s Max Wall Balls", unit: "reps", bench: [12, 40] },
    { id: "burpee60_m", section: "tests", name: "1 Minute Max Distance Burpee Broad Jumps", unit: "m", bench: [1, 35] },
    { id: "lunge60_m", section: "tests", name: "1 Minute Max Distance Walking Lunges", unit: "m", bench: [7, 37] },
    { id: "sledpull60_m", section: "tests", name: "1 Minute Max Distance Sled Pull", unit: "m", bench: [3, 25] },
    { id: "sledpush60_m", section: "tests", name: "1 Minute Max Distance Sled Push", unit: "m", bench: [5, 45] },
    { id: "deadhang", section: "tests", name: "Dead Hang (Max Time)", unit: "time_up", bench: [10, 130] },

    /* Neutral: no direction is "better", so it gets a chart and a latest
     * value but no PB, no medals and no score of its own. What it does do is
     * scale the strength benchmarks, which are written for 80kg. */
    { id: "bodyweight", section: "body", name: "Bodyweight", unit: "kg", neutral: true }
  ];

  /* Units: how a value is typed, drawn and compared. */
  var UNITS = {
    watts: { suffix: "W", better: "higher", input: "number", step: "1", hint: "Average watts over the 20 minutes" },
    kg: { suffix: "kg", better: "higher", input: "number", step: "0.5", hint: "Heaviest 3-rep set, in kg" },
    cals: { suffix: "cal", better: "higher", input: "number", step: "1", hint: "Calories on the monitor after 60 seconds" },
    reps: { suffix: "reps", better: "higher", input: "number", step: "1", hint: "Good reps in 60 seconds" },
    m: { suffix: "m", better: "higher", input: "number", step: "0.5", hint: "Distance covered, in metres" },
    time: { better: "lower", input: "time", hint: "mm:ss (e.g. 8:42)" },
    pace: { suffix: "/500m", better: "lower", input: "time", hint: "mm:ss per 500m" },
    time_up: { better: "higher", input: "time", hint: "mm:ss (e.g. 1:45)" }
  };

  /* The Log menu: one card per card-tap, in tracker order. */
  var FORMS = [
    {
      id: "bike20", section: "bike", art: "bike", title: "Average Watts - 20 Minutes Indoor Bike",
      blurb: "Ride 20 minutes, enter the average watts from the bike's screen.",
      fields: [{ metric: "bike20_watts", label: "Average watts", required: true }]
    },
    {
      id: "row2k", section: "ergs", art: "row", title: "2km Row",
      blurb: "Damper on 4–6 (it changes the feel, not the score). Enter the total time — the 500m pace is worked out for you.",
      fields: [{ metric: "row2k_total", label: "Total time", required: true }],
      derive: { from: "row2k_total", metric: "row2k_pace", divide: 4 }
    },
    {
      id: "ski2k", section: "ergs", art: "ski", title: "2km Ski",
      blurb: "Damper on 4–6 (it changes the feel, not the score). Enter the total time — the 500m pace is worked out for you.",
      fields: [{ metric: "ski2k_total", label: "Total time", required: true }],
      derive: { from: "ski2k_total", metric: "ski2k_pace", divide: 4 }
    },
    {
      id: "run5k", section: "run", art: "run", title: "5km Run",
      blurb: "Splits are optional. Fill all five and the total fills itself in.",
      fields: [
        { metric: "run5k_total", label: "Total time", required: true },
        { metric: "run5k_s1", label: "1km split 1" },
        { metric: "run5k_s2", label: "1km split 2" },
        { metric: "run5k_s3", label: "1km split 3" },
        { metric: "run5k_s4", label: "1km split 4" },
        { metric: "run5k_s5", label: "1km split 5" }
      ],
      sumTo: { metric: "run5k_total", from: ["run5k_s1", "run5k_s2", "run5k_s3", "run5k_s4", "run5k_s5"] }
    }
  ];

  /* Strength and the 60s tests are one field each — generate their forms. */
  var STRENGTH_ART = { squat_3rm: "squat", bench_3rm: "bench", deadlift_3rm: "deadlift", press_3rm: "press" };
  Object.keys(STRENGTH_ART).forEach(function (id) {
    var m = METRICS.filter(function (x) { return x.id === id; })[0];
    FORMS.push({
      id: id, section: "strength", title: m.name, art: STRENGTH_ART[id],
      blurb: "Heaviest set of three, taken to a full lockout.",
      fields: [{ metric: id, label: "Weight", required: true }]
    });
  });
  var TEST_ART = {
    ski60_cals: "ski", row60_cals: "row", wallball60: "wallball", burpee60_m: "burpee",
    lunge60_m: "lunge", sledpull60_m: "sledpull", sledpush60_m: "sledpush", deadhang: "hang"
  };
  Object.keys(TEST_ART).forEach(function (id) {
    var m = METRICS.filter(function (x) { return x.id === id; })[0];
    FORMS.push({
      id: id, section: "tests", title: m.name, art: TEST_ART[id],
      blurb: id === "deadhang" ? "Hang from the bar until you drop off."
        : id === "sledpush60_m" ? "One all-out minute at race load — 152kg including the sled. Different weight? Say so in the note."
        : id === "sledpull60_m" ? "One all-out minute at race load — 103kg including the sled. Different weight? Say so in the note."
        : id === "lunge60_m" ? "One all-out minute, bodyweight — no sandbag."
        : "One all-out minute.",
      fields: [{ metric: id, label: "Result", required: true }]
    });
  });

  FORMS.push({
    id: "bodyweight", section: "body", title: "Bodyweight", art: "scale",
    blurb: "Weigh in whenever you like — same scales, same time of day reads truest. Your strength scores adjust to it.",
    fields: [{ metric: "bodyweight", label: "Weight", required: true }]
  });

  /* One short "how to do it" video per activity — the shortest solid
   * technique clip we could find from a reputable coach, official Concept2
   * clips for the ergs. Every id was checked live before shipping; watch
   * URLs play Shorts and full videos alike. */
  var VIDEOS = {
    bike20: ["UZKbytEQJAU", "Street Parking"],
    row2k: ["QPvYrfyGHi8", "Concept2"],
    ski2k: ["B0lIgT5PHc8", "Concept2"],
    run5k: ["sScNDZu2MWk", "James Dunne"],
    squat_3rm: ["gcNh17Ckjgg", "Jeremy Ethier"],
    bench_3rm: ["0cXAp6WhSj4", "Jeremy Ethier"],
    deadlift_3rm: ["8np3vKDBJfc", "Jeremy Ethier"],
    press_3rm: ["zoN5EH50Dro", "DeltaBolic"],
    ski60_cals: ["B0lIgT5PHc8", "Concept2"],
    row60_cals: ["QPvYrfyGHi8", "Concept2"],
    wallball60: ["i3X-IG9sBJQ", "Core Blend Training"],
    burpee60_m: ["eQFmJjdRSDI", "GoodLife Fitness"],
    lunge60_m: ["XYspYu9VFHo", "Core Blend Training"],
    sledpull60_m: ["1iDS8Xgx-nw", "Core Blend Training"],
    sledpush60_m: ["IVv_WDafLO4", "Core Blend Training"],
    deadhang: ["OT-wTpxP9uo", "Flow Motion Fitness"]
  };

  /* Official Hyrox race loads, 2025/26 season — identical at every event,
   * Manchester included. Men open / women open first, pro in brackets. */
  /* Shown on the entry forms. Men's open loads, since that is the division
   * being trained for — every division is in the standards card. */
  var RACE = {
    wallball60: "In the race (men's open): 100 wall balls, 6kg ball to a 3.0m target.",
    sledpush60_m: "In the race (men's open): 50m sled push at 152kg including the sled.",
    sledpull60_m: "In the race (men's open): 50m sled pull at 103kg including the sled.",
    lunge60_m: "In the race (men's open): 100m of walking lunges with a 20kg sandbag.",
    burpee60_m: "In the race: 80m of burpee broad jumps, bodyweight.",
    ski2k: "In the race: station 1 is 1,000m on the SkiErg.",
    row2k: "In the race: station 5 is 1,000m on the RowErg.",
    run5k: "In the race: 8 × 1km runs, one between each station."
  };

  /* Built-in timing. Stopwatch forms fill their time fields when stopped —
   * the 5km run's Lap button drops each 1km split into its box as you pass.
   * Countdown forms run the test clock (beeps over the last three seconds)
   * and then hand focus to the result box. */
  var TIMERS = {
    row2k: { mode: "stopwatch", fill: "row2k_total" },
    ski2k: { mode: "stopwatch", fill: "ski2k_total" },
    run5k: { mode: "stopwatch", fill: "run5k_total", laps: ["run5k_s1", "run5k_s2", "run5k_s3", "run5k_s4", "run5k_s5"] },
    deadhang: { mode: "stopwatch", fill: "deadhang" },
    bike20: { mode: "countdown", seconds: 1200 },
    ski60_cals: { mode: "countdown", seconds: 60 },
    row60_cals: { mode: "countdown", seconds: 60 },
    wallball60: { mode: "countdown", seconds: 60 },
    burpee60_m: { mode: "countdown", seconds: 60 },
    lunge60_m: { mode: "countdown", seconds: 60 },
    sledpull60_m: { mode: "countdown", seconds: 60 },
    sledpush60_m: { mode: "countdown", seconds: 60 }
  };

  FORMS.forEach(function (f) {
    var v = VIDEOS[f.id];
    if (v) f.video = { url: "https://www.youtube.com/watch?v=" + v[0], by: v[1] };
    if (RACE[f.id]) f.race = RACE[f.id];
    if (TIMERS[f.id]) f.timer = TIMERS[f.id];
    /* heavy triples need clock-watched rest, not guesswork */
    if (f.section === "strength") f.rest = [120, 180, 300];
  });

  /* The full station list for the reference card — includes stations the
   * tracker sheet does not test, like the farmers carry. */
  PB.RACE_STANDARDS = [
    ["1. SkiErg", "1,000m"],
    ["2. Sled Push", "50m — 152kg men open · 102kg women open (pro 202 / 152)"],
    ["3. Sled Pull", "50m — 103kg men open · 78kg women open (pro 153 / 103)"],
    ["4. Burpee Broad Jumps", "80m, bodyweight"],
    ["5. RowErg", "1,000m"],
    ["6. Farmers Carry", "200m — 2×24kg men open · 2×16kg women open (pro 2×32 / 2×24)"],
    ["7. Sandbag Lunges", "100m — 20kg men open · 10kg women open (pro 30 / 20)"],
    ["8. Wall Balls", "100 reps men open · 75 reps women open — 6kg/3.0m men, 4kg/2.7m women (pro 9kg / 6kg)"]
  ];

  var byId = {};
  METRICS.forEach(function (m) {
    /* name  = the row exactly as it reads on Ian's paper tracker — shown
               verbatim on every list so the app and the sheet always agree
       short = what the row is called inside a sentence */
    m.list = m.name;
    m.short = m.short || m.name;
    m.better = UNITS[m.unit].better;
    m.scored = !m.derived && !m.neutral;
    byId[m.id] = m;
  });

  /* The four tests the coach wants filled in before the plan starts —
   * "Most important is the running 5k, ski 2k and row 2k. Also 20min bike." */
  PB.BASELINE = ["run5k_total", "ski2k_total", "row2k_total", "bike20_watts"];

  PB.SECTIONS = SECTIONS;
  PB.METRICS = METRICS;
  PB.UNITS = UNITS;
  PB.FORMS = FORMS;
  PB.metric = function (id) { return byId[id]; };
  PB.section = function (id) {
    return SECTIONS.filter(function (s) { return s.id === id; })[0];
  };
  PB.metricsIn = function (sectionId) {
    return METRICS.filter(function (m) { return m.section === sectionId; });
  };
  PB.form = function (id) {
    return FORMS.filter(function (f) { return f.id === id; })[0];
  };
  /* The pictogram for a metric is the one on the form that logs it. */
  PB.artFor = function (metricId) {
    var f = FORMS.filter(function (x) {
      return x.fields.some(function (fl) { return fl.metric === metricId; });
    })[0];
    return f ? f.art : "";
  };
})(window.PB = window.PB || {});

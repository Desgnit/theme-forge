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
    { id: "tests", n: 5, name: "60 Second Tests & Static", icon: "pulse" }
  ];

  var METRICS = [
    { id: "bike20_watts", section: "bike", name: "Average Watts - 20 Minutes Indoor Bike", short: "20min Bike", unit: "watts", bench: [80, 330] },

    { id: "row2k_total", section: "ergs", name: "2km Row (Total Time)", short: "2km Row", unit: "time", bench: [600, 380] },
    { id: "row2k_pace", section: "ergs", name: "2km Row (Pace per 500m)", unit: "pace", derived: "row2k_total" },
    { id: "ski2k_total", section: "ergs", name: "2km Ski (Total Time)", short: "2km Ski", unit: "time", bench: [660, 430] },
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
    { id: "burpee60_m", section: "tests", name: "1 Minute Max Distance Burpee Broad Jumps", unit: "m", bench: [12, 45] },
    { id: "lunge60_m", section: "tests", name: "1 Minute Max Distance Walking Lunges", unit: "m", bench: [15, 70] },
    { id: "sledpull60_m", section: "tests", name: "1 Minute Max Distance Sled Pull", unit: "m", bench: [15, 80] },
    { id: "sledpush60_m", section: "tests", name: "1 Minute Max Distance Sled Push", unit: "m", bench: [12, 60] },
    { id: "deadhang", section: "tests", name: "Dead Hang (Max Time)", unit: "time_up", bench: [20, 180] }
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
      blurb: "Enter the total time — the 500m pace is worked out for you.",
      fields: [{ metric: "row2k_total", label: "Total time", required: true }],
      derive: { from: "row2k_total", metric: "row2k_pace", divide: 4 }
    },
    {
      id: "ski2k", section: "ergs", art: "ski", title: "2km Ski",
      blurb: "Enter the total time — the 500m pace is worked out for you.",
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
      blurb: id === "deadhang" ? "Hang from the bar until you drop off." : "One all-out minute.",
      fields: [{ metric: id, label: "Result", required: true }]
    });
  });

  var byId = {};
  METRICS.forEach(function (m) {
    /* name  = the row exactly as it reads on Ian's paper tracker — shown
               verbatim on every list so the app and the sheet always agree
       short = what the row is called inside a sentence */
    m.list = m.name;
    m.short = m.short || m.name;
    m.better = UNITS[m.unit].better;
    m.scored = !m.derived;
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

/* Fitness scoring.
 *
 * Each scored metric maps onto 0-100 by linear interpolation between its two
 * benchmark values. A section scores the average of its logged metrics, and
 * the overall score averages the sections that have any data — so the five
 * pillars of the tracker weigh equally and eight one-minute tests cannot
 * drown out a 5km run. Derived rows (pace, splits) are deliberately not
 * scored: they are the same effort counted twice. */
(function (PB) {
  "use strict";

  var BANDS = [
    { min: 90, name: "Elite", cls: "band-elite" },
    { min: 75, name: "Advanced", cls: "band-advanced" },
    { min: 55, name: "Strong", cls: "band-strong" },
    { min: 35, name: "Developing", cls: "band-developing" },
    { min: 0, name: "Foundation", cls: "band-foundation" }
  ];

  function band(score) {
    for (var i = 0; i < BANDS.length; i++) if (score >= BANDS[i].min) return BANDS[i];
    return BANDS[BANDS.length - 1];
  }

  /* The strength benchmarks are written for an 80kg athlete. Once a
   * bodyweight is logged, they scale to it — a 70kg athlete is not asked to
   * move 80kg numbers to earn the same score. Clamped so a wild reading
   * cannot distort the scale, and everything downstream (scores, levels,
   * "next band at") follows automatically because it all comes through here. */
  function effectiveBench(metric) {
    if (!metric.bench) return null;
    if (metric.section !== "strength") return metric.bench;
    var bw = PB.store.best("bodyweight");
    if (!bw) return metric.bench;
    var scale = Math.max(0.75, Math.min(1.25, bw.value / 80));
    return [metric.bench[0] * scale, metric.bench[1] * scale];
  }

  function scoreValue(metric, value) {
    var bench = effectiveBench(metric);
    if (!bench || value == null) return null;
    var zero = bench[0], hundred = bench[1];
    var pct = ((zero - value) / (zero - hundred)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  /* What value would be needed to hit a target score — powers "next band at". */
  function valueForScore(metric, target) {
    var bench = effectiveBench(metric);
    if (!bench) return null;
    var zero = bench[0], hundred = bench[1];
    return zero - (target / 100) * (zero - hundred);
  }

  /* Scores a set of entries directly, rather than whatever is in the store —
   * this is what lets the score be replayed as it stood on any past day. */
  function overallFor(entries) {
    var bestOf = {};
    entries.forEach(function (e) {
      var metric = PB.metric(e.metric);
      if (!metric || !metric.scored) return;
      if (PB.store.isBetter(metric, e.value, bestOf[e.metric])) bestOf[e.metric] = e.value;
    });
    var sectionScores = [];
    PB.SECTIONS.forEach(function (s) {
      var got = PB.metricsIn(s.id).filter(function (m) { return m.scored && bestOf[m.id] != null; })
        .map(function (m) { return scoreValue(m, bestOf[m.id]); });
      if (got.length) {
        sectionScores.push(got.reduce(function (a, v) { return a + v; }, 0) / got.length);
      }
    });
    if (!sectionScores.length) return null;
    return Math.round(sectionScores.reduce(function (a, v) { return a + v; }, 0) / sectionScores.length);
  }

  /* One point per day you logged on, each showing the score you held that day. */
  function history() {
    var all = PB.store.load().entries.slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var days = [];
    all.forEach(function (e) { if (days[days.length - 1] !== e.date) days.push(e.date); });
    var out = [];
    days.forEach(function (day) {
      var upTo = all.filter(function (e) { return e.date <= day; });
      var v = overallFor(upTo);
      if (v != null) out.push({ date: day, value: v });
    });
    return out;
  }

  function metricScore(metricId) {
    var metric = PB.metric(metricId);
    if (!metric.scored) return null;
    var b = PB.store.best(metricId);
    if (!b) return { metric: metric, logged: false, score: null };
    var s = scoreValue(metric, b.value);
    return { metric: metric, logged: true, best: b, score: s, band: band(s) };
  }

  function sectionScore(sectionId) {
    var rows = PB.metricsIn(sectionId)
      .filter(function (m) { return m.scored; })
      .map(function (m) { return metricScore(m.id); });
    var done = rows.filter(function (r) { return r.logged; });
    var score = done.length
      ? Math.round(done.reduce(function (a, r) { return a + r.score; }, 0) / done.length)
      : null;
    return {
      section: PB.section(sectionId), rows: rows, logged: done.length,
      total: rows.length, score: score, band: score == null ? null : band(score)
    };
  }

  function overall() {
    var sections = PB.SECTIONS.map(function (s) { return sectionScore(s.id); });
    var done = sections.filter(function (s) { return s.score != null; });
    var score = done.length
      ? Math.round(done.reduce(function (a, s) { return a + s.score; }, 0) / done.length)
      : null;
    var logged = sections.reduce(function (a, s) { return a + s.logged; }, 0);
    var total = sections.reduce(function (a, s) { return a + s.total; }, 0);
    return {
      score: score, band: score == null ? null : band(score),
      sections: sections, logged: logged, total: total,
      complete: logged === total
    };
  }

  /* Change between the first and the best effort, as a signed percentage. */
  function improvement(metricId) {
    var all = PB.store.entriesFor(metricId);
    if (all.length < 2) return null;
    var first = all[0].value;
    var b = PB.store.best(metricId);
    if (!first || !b) return null;
    var metric = PB.metric(metricId);
    var delta = metric.better === "lower" ? (first - b.value) / first : (b.value - first) / first;
    return Math.round(delta * 1000) / 10;
  }

  /* The single biggest score gain available right now — used to nudge the
   * next session towards whatever is holding the overall number down. */
  function weakestLogged() {
    var rows = PB.METRICS.filter(function (m) { return m.scored; })
      .map(function (m) { return metricScore(m.id); })
      .filter(function (r) { return r.logged; })
      .sort(function (a, b) { return a.score - b.score; });
    return rows[0] || null;
  }

  function nextUnlogged() {
    var rows = PB.METRICS.filter(function (m) { return m.scored; })
      .map(function (m) { return metricScore(m.id); })
      .filter(function (r) { return !r.logged; });
    return rows[0] || null;
  }

  /* Beginner / Average / Elite marks for one activity, read straight off the
   * same 0-100 scale the score uses, so this card and the score can never
   * disagree. Values are rounded to what someone would actually say out
   * loud: times to 5 seconds, kilos to 2.5, watts to 5. */
  var LEVELS = [["Beginner", 20], ["Average", 50], ["Elite", 90]];

  function roundLevel(metric, v) {
    if (PB.isTime(metric.unit)) return Math.round(v / 5) * 5;
    if (metric.unit === "kg") return Math.round(v / 2.5) * 2.5;
    if (metric.unit === "watts") return Math.round(v / 5) * 5;
    return Math.round(v);
  }

  function levels(metricId) {
    var metric = PB.metric(metricId);
    if (!metric.scored) return null;
    var ms = metricScore(metricId);
    var rows = LEVELS.map(function (lv) {
      return { name: lv[0], at: lv[1], value: roundLevel(metric, valueForScore(metric, lv[1])) };
    });
    if (ms && ms.logged) {
      var nearest = rows.reduce(function (a, r) {
        return Math.abs(r.at - ms.score) < Math.abs(a.at - ms.score) ? r : a;
      }, rows[0]);
      nearest.here = true;
    }
    return rows;
  }

  PB.score = {
    BANDS: BANDS, band: band, scoreValue: scoreValue, valueForScore: valueForScore,
    levels: levels,
    metricScore: metricScore, sectionScore: sectionScore, overall: overall,
    overallFor: overallFor, history: history,
    improvement: improvement, weakestLogged: weakestLogged, nextUnlogged: nextUnlogged
  };
})(window.PB = window.PB || {});

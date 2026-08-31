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

  function scoreValue(metric, value) {
    if (!metric.bench || value == null) return null;
    var zero = metric.bench[0], hundred = metric.bench[1];
    var pct = ((zero - value) / (zero - hundred)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  /* What value would be needed to hit a target score — powers "next band at". */
  function valueForScore(metric, target) {
    if (!metric.bench) return null;
    var zero = metric.bench[0], hundred = metric.bench[1];
    return zero - (target / 100) * (zero - hundred);
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

  PB.score = {
    BANDS: BANDS, band: band, scoreValue: scoreValue, valueForScore: valueForScore,
    metricScore: metricScore, sectionScore: sectionScore, overall: overall,
    improvement: improvement, weakestLogged: weakestLogged, nextUnlogged: nextUnlogged
  };
})(window.PB = window.PB || {});

/* Dependency-free SVG progress chart.
 *
 * The y axis is flipped for time-based metrics, so on every graph in the app
 * "up and to the right" means you got better — no reading the axis twice. */
(function (PB) {
  "use strict";

  var W = 340, H = 170, PAD_L = 44, PAD_R = 10, PAD_T = 14, PAD_B = 26;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function niceTicks(min, max, count) {
    if (min === max) return [min];
    var step = (max - min) / (count - 1), out = [];
    for (var i = 0; i < count; i++) out.push(min + step * i);
    return out;
  }

  function render(metricId) {
    var metric = PB.metric(metricId);
    var entries = PB.store.entriesFor(metricId);
    if (!entries.length) {
      return '<p class="chart-empty">No entries yet. Log this activity and your progress line starts here.</p>';
    }
    if (entries.length === 1) {
      return '<p class="chart-empty">One entry so far — <strong>' +
        esc(PB.formatFull(metric.unit, entries[0].value)) +
        "</strong>. Log it again to draw a progress line.</p>";
    }

    var values = entries.map(function (e) { return e.value; });
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = max - min || Math.max(max * 0.1, 1);
    var lo = min - span * 0.18, hi = max + span * 0.18;
    var betterUp = metric.better === "higher";

    var x = function (i) { return PAD_L + (i / (entries.length - 1)) * (W - PAD_L - PAD_R); };
    var y = function (v) {
      var t = (v - lo) / (hi - lo);            // 0 at lo, 1 at hi
      if (!betterUp) t = 1 - t;                 // flip so better is always higher
      return H - PAD_B - t * (H - PAD_T - PAD_B);
    };

    var pts = entries.map(function (e, i) { return [x(i), y(e.value)]; });
    var line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = line + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (H - PAD_B) +
      " L" + pts[0][0].toFixed(1) + " " + (H - PAD_B) + " Z";

    var bestEntry = PB.store.best(metricId);
    var svg = ['<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Progress chart for ' +
      esc(metric.name) + '">'];

    svg.push('<defs><linearGradient id="cg-' + metricId + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.30"/>' +
      '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>');

    var timeAxis = PB.isTime(metric.unit);
    var seen = {};
    niceTicks(lo, hi, 4).forEach(function (v) {
      var at = timeAxis && span > 20 ? Math.round(v) : v;   // whole seconds once the range is wide
      var label = PB.formatValue(metric.unit, at);
      if (seen[label]) return;
      seen[label] = true;
      var yy = y(v).toFixed(1);
      svg.push('<line class="grid" x1="' + PAD_L + '" y1="' + yy + '" x2="' + (W - PAD_R) + '" y2="' + yy + '"/>');
      svg.push('<text class="axis" x="' + (PAD_L - 6) + '" y="' + (Number(yy) + 3.5) +
        '" text-anchor="end">' + esc(label) + "</text>");
    });

    svg.push('<path class="area" d="' + area + '" fill="url(#cg-' + metricId + ')"/>');
    svg.push('<path class="line" d="' + line + '"/>');

    entries.forEach(function (e, i) {
      var isBest = bestEntry && e.id === bestEntry.id;
      svg.push('<circle class="dot' + (isBest ? " dot-best" : "") + '" cx="' + pts[i][0].toFixed(1) +
        '" cy="' + pts[i][1].toFixed(1) + '" r="' + (isBest ? 5 : 3.2) + '"><title>' +
        esc(PB.formatFull(metric.unit, e.value) + " — " + PB.formatDate(e.date)) + "</title></circle>");
    });

    var bi = entries.map(function (e) { return e.id; }).indexOf(bestEntry.id);
    if (bi >= 0) {
      var lx = Math.min(Math.max(pts[bi][0], PAD_L + 18), W - PAD_R - 18);
      svg.push('<text class="best-label" x="' + lx.toFixed(1) + '" y="' +
        Math.max(pts[bi][1] - 9, 10).toFixed(1) + '" text-anchor="middle">' +
        esc(PB.formatFull(metric.unit, bestEntry.value)) + "</text>");
    }

    svg.push('<text class="axis" x="' + PAD_L + '" y="' + (H - 8) + '">' + esc(PB.formatDate(entries[0].date)) + "</text>");
    svg.push('<text class="axis" x="' + (W - PAD_R) + '" y="' + (H - 8) + '" text-anchor="end">' +
      esc(PB.formatDate(entries[entries.length - 1].date)) + "</text>");
    svg.push("</svg>");

    var caption = betterUp
      ? "Higher is better — the line rising means you are improving."
      : "Faster is better — the axis is flipped, so a rising line means quicker times.";
    return svg.join("") + '<p class="chart-caption">' + caption + "</p>";
  }

  /* Tiny inline trend line for list rows. */
  function spark(metricId) {
    var entries = PB.store.entriesFor(metricId);
    if (entries.length < 2) return "";
    var metric = PB.metric(metricId);
    var vals = entries.map(function (e) { return e.value; });
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var range = max - min || 1;
    var betterUp = metric.better === "higher";
    var d = entries.map(function (e, i) {
      var t = (e.value - min) / range;
      if (!betterUp) t = 1 - t;
      var px = (i / (entries.length - 1)) * 52;
      var py = 16 - t * 13 - 1.5;
      return (i ? "L" : "M") + px.toFixed(1) + " " + py.toFixed(1);
    }).join(" ");
    return '<svg class="spark" viewBox="0 0 52 18" aria-hidden="true"><path d="' + d + '"/></svg>';
  }

  PB.chart = { render: render, spark: spark };
})(window.PB = window.PB || {});

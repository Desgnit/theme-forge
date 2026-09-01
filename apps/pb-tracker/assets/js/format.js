/* Value parsing and display. Times are stored as seconds throughout, so a
 * 2km row and a dead hang share one comparison path. */
(function (PB) {
  "use strict";

  var isTime = function (unit) { return unit === "time" || unit === "pace" || unit === "time_up"; };

  /* Accepts "8:42", "8:42.4", "1:02:33" or a plain number of seconds.
   * Returns null when the text is not a usable value. */
  function parseTime(text) {
    var s = String(text).trim();
    if (!s) return null;
    /* Phone number-pads have no colon, so the dot stands in for it:
     * "9.09" means 9:09. Two digits after the dot, reading as valid
     * seconds — a genuine decimal like "45.5" still means seconds. */
    var dotted = s.match(/^(\d{1,3})\.([0-5]\d)$/);
    if (dotted) return Number(dotted[1]) * 60 + Number(dotted[2]);
    if (!/^\d+(:[0-5]?\d){0,2}(\.\d+)?$/.test(s)) return null;
    var parts = s.split(":").map(parseFloat);
    if (parts.some(isNaN)) return null;
    var secs = 0;
    parts.forEach(function (p) { secs = secs * 60 + p; });
    return secs > 0 ? Math.round(secs * 10) / 10 : null;
  }

  function parseValue(unit, text) {
    if (isTime(unit)) return parseTime(text);
    var s = String(text).trim().replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = parseFloat(s);
    return n > 0 ? n : null;
  }

  function formatTime(secs) {
    if (secs == null || isNaN(secs)) return "—";
    var t = Math.round(secs * 10) / 10;
    var h = Math.floor(t / 3600);
    var m = Math.floor((t % 3600) / 60);
    var s = t % 60;
    var frac = Math.round((s - Math.floor(s)) * 10);
    var ss = String(Math.floor(s));
    if (ss.length < 2) ss = "0" + ss;
    var out = (h ? h + ":" + (m < 10 ? "0" + m : m) : String(m)) + ":" + ss;
    if (frac) out += "." + frac;
    return out;
  }

  /* Display value without its unit — for tables that carry the unit in a header. */
  function formatValue(unit, v) {
    if (v == null || isNaN(v)) return "—";
    if (isTime(unit)) return formatTime(v);
    return String(Math.round(v * 10) / 10);
  }

  /* Display value with its unit, e.g. "1:42/500m", "142.5kg". */
  function formatFull(unit, v) {
    if (v == null || isNaN(v)) return "—";
    var suffix = (PB.UNITS[unit] || {}).suffix || "";
    var body = formatValue(unit, v);
    if (!suffix) return body;
    return unit === "kg" || unit === "m" || unit === "watts" ? body + suffix : body + (unit === "pace" ? "" : " ") + suffix;
  }

  /* "3 days ago" style, kept short enough for a phone row. */
  function relativeDay(iso) {
    var d = PB.dayDiff(iso, PB.today());
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7) return d + " days ago";
    if (d < 14) return "Last week";
    if (d < 60) return Math.round(d / 7) + " weeks ago";
    return Math.round(d / 30) + " months ago";
  }

  function formatDate(iso) {
    var p = String(iso).split("-");
    if (p.length !== 3) return iso;
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return Number(p[2]) + " " + months[Number(p[1]) - 1] + " " + p[0];
  }

  function today() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function dayDiff(a, b) {
    return Math.round((Date.parse(b + "T00:00:00") - Date.parse(a + "T00:00:00")) / 86400000);
  }

  PB.isTime = isTime;
  PB.parseTime = parseTime;
  PB.parseValue = parseValue;
  PB.formatTime = formatTime;
  PB.formatValue = formatValue;
  PB.formatFull = formatFull;
  PB.formatDate = formatDate;
  PB.relativeDay = relativeDay;
  PB.today = today;
  PB.dayDiff = dayDiff;
})(window.PB = window.PB || {});

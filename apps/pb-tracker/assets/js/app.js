/* Screens, routing and interaction. Hash routes keep the whole thing a single
 * static file set — no build step, no server, back button works. */
(function (PB) {
  "use strict";

  var view, toastEl;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var ICONS = {
    bike: '<circle cx="6" cy="17" r="4"/><circle cx="18" cy="17" r="4"/><path d="M6 17 10 8h5l3 9M9 8h6"/>',
    erg: '<path d="M3 18h7l4-6 3 2 4-6"/><circle cx="9" cy="7" r="2.4"/><path d="M6 12l4-3"/>',
    run: '<circle cx="15" cy="4.5" r="2.2"/><path d="M13 21l2-6-3-3 1-5 4 3 3 1M9 21l3-5M6 11l3-2"/>',
    strength: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
    pulse: '<path d="M2 12h4l3-7 4 14 3-7h6"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M10 18h4M9 21h6"/>'
  };

  function icon(name, cls) {
    return '<svg class="icon ' + (cls || "") + '" viewBox="0 0 24 24" aria-hidden="true">' +
      (ICONS[name] || "") + "</svg>";
  }

  function medalBadge(pos) {
    if (!pos) return "";
    var label = ["", "1st", "2nd", "3rd"][pos];
    return '<span class="medal m' + pos + '" title="' + label + ' best">' + pos + "</span>";
  }

  function go(hash) { location.hash = hash; }

  /* Handing the viewer a file.
   *
   * Served as an ordinary page — GitHub Pages, a local server, the single-file
   * build — a blob link downloads it. Inside the claude.ai artifact viewer
   * that link is inert by design, and the host mediates saves instead, so ask
   * it and fall back only when it is not there. Either way the clipboard
   * button on the same screen is a second route out. */
  var downloadsReady = (window.claude && typeof window.claude.use === "function")
    ? window.claude.use("downloads").catch(function () { return null; })
    : Promise.resolve(null);

  function blobDownload(filename, text) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function saveFile(filename, text) {
    downloadsReady.then(function (downloads) {
      if (!downloads) { blobDownload(filename, text); return; }
      downloads.save({ filename: filename, data: text }).then(function () {
        toast("<div><strong>Backup saved</strong><span>" + esc(filename) + "</span></div>");
      }, function (err) {
        var code = err && err.code;
        if (code === "declined") return;
        if (code === "rate_limited") {
          toast("<div><strong>Try that again in a moment</strong><span>A save is already waiting</span></div>");
          return;
        }
        toast('<div><strong>Could not save the file here</strong>' +
          "<span>Use Copy to clipboard instead</span></div>");
      });
    });
  }

  function toast(html, kind) {
    toastEl.className = "toast show " + (kind || "");
    toastEl.innerHTML = html;
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.className = "toast"; }, 4200);
  }

  /* ---------------------------------------------------------------- Log menu */

  /* Days from today to the plan start; negative once it has begun. */
  function daysToPlan() {
    var start = PB.store.athlete().planStart;
    if (!start) return null;
    return PB.dayDiff(PB.today(), start);
  }

  /* The card the coach's message asks for: get the key baselines logged
   * before the plan begins. Shown through test week and the first week. */
  function baselineCard() {
    var d = daysToPlan();
    if (d === null || d < -6) return "";
    var rows = PB.BASELINE.map(function (id) {
      var m = PB.metric(id);
      var b = PB.store.best(id);
      var formId = (PB.FORMS.filter(function (f) {
        return f.fields.some(function (x) { return x.metric === id; });
      })[0] || {}).id;
      return '<a class="base-row' + (b ? " done" : "") + '" href="#/log/' + formId + '">' +
        '<span class="base-tick">' + (b ? "✓" : "") + "</span>" +
        '<span class="base-name">' + esc(m.short) + "</span>" +
        '<span class="base-val">' + (b ? esc(PB.formatFull(m.unit, b.value)) : "log it") + "</span></a>";
    });
    var left = PB.BASELINE.filter(function (id) { return !PB.store.best(id); }).length;
    var when = d > 1 ? "Plan starts in " + d + " days"
      : d === 1 ? "Plan starts tomorrow"
        : d === 0 ? "The plan starts today"
          : "The plan has started";
    var line = left === 0 ? "All four baselines are in — ready to go."
      : when + " — " + (left === PB.BASELINE.length ? "get these baselines logged first." :
        left + " baseline" + (left === 1 ? "" : "s") + " still to log.");
    return '<section class="card baseline-card"><h2 class="card-head">' + icon("pulse") +
      'Baseline test week</h2><p class="body">' + esc(line) + "</p>" +
      '<div class="base-rows">' + rows.join("") + "</div>" +
      '<p class="fine">These four are what the coach wants before day one. Change the start date from the cog.</p></section>';
  }

  function viewLogMenu() {
    var html = ['<header class="screen-head"><h1>Log an activity</h1>' +
      '<p class="sub">Pick what you did. Two taps and you are done.</p></header>'];
    html.push(baselineCard());

    PB.SECTIONS.forEach(function (s) {
      var forms = PB.FORMS.filter(function (f) { return f.section === s.id; });
      html.push('<section class="block"><h2 class="block-head">' + icon(s.icon) +
        '<span class="num">' + s.n + ".</span> " + esc(s.name) +
        (s.sub ? ' <em>(' + esc(s.sub) + ")</em>" : "") + "</h2><div class=\"tiles\">");
      forms.forEach(function (f) {
        var primary = f.fields[0].metric;
        var b = PB.store.best(primary);
        html.push('<a class="tile" href="#/log/' + f.id + '">' +
          PB.art(f.art, "art-tile") +
          '<span class="tile-name">' + esc(f.title) + "</span>" +
          '<span class="tile-pb">' + (b ? "PB " + esc(PB.formatFull(PB.metric(primary).unit, b.value)) : "No entry yet") + "</span>" +
          '<span class="tile-go">+</span></a>');
      });
      html.push("</div></section>");
    });

    html.push('<section class="card standards"><h2 class="card-head">Hyrox race standards</h2>' +
      '<p class="body">The eight stations as they run on race day — same loads at every event, Manchester included. Open division first, pro in brackets.</p><ul class="standards-list">');
    PB.RACE_STANDARDS.forEach(function (row) {
      html.push('<li><strong>' + esc(row[0]) + "</strong><span>" + esc(row[1]) + "</span></li>");
    });
    html.push('</ul><p class="fine">1km of running between every station. Wall ball reps: 100 men open, 75 women open.</p></section>');
    return html.join("");
  }

  /* ------------------------------------------------------------------ Timer */

  /* Elapsed time is always computed from wall-clock timestamps, never by
   * counting ticks — a phone that throttles a background tab or dims the
   * screen still produces the right time. A screen wake lock is requested
   * while running, where the browser offers one. */
  var timer = { state: "idle", raf: 0, wakeLock: null, audio: null };

  function timerBeep(freq, dur) {
    try {
      timer.audio = timer.audio || new (window.AudioContext || window.webkitAudioContext)();
      var osc = timer.audio.createOscillator();
      var gain = timer.audio.createGain();
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(timer.audio.destination);
      osc.start();
      osc.stop(timer.audio.currentTime + dur);
    } catch (e) { /* no sound is fine */ }
  }

  function timerBuzz(ms) {
    if (navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { /* optional */ } }
  }

  function timerWake(on) {
    if (on && navigator.wakeLock && navigator.wakeLock.request) {
      navigator.wakeLock.request("screen").then(function (l) { timer.wakeLock = l; }, function () {});
    } else if (!on && timer.wakeLock) {
      timer.wakeLock.release().catch(function () {});
      timer.wakeLock = null;
    }
  }

  function timerStopTicking() {
    cancelAnimationFrame(timer.raf);
    timer.state = "idle";
    timerWake(false);
  }

  function fillField(metricId, secs) {
    var el = document.querySelector('[name="' + metricId + '"]');
    if (!el) return;
    el.value = PB.formatTime(Math.round(secs * 10) / 10);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function timerCard(f) {
    if (!f.timer) return "";
    var cd = f.timer.mode === "countdown";
    var label = cd ? (f.timer.seconds >= 120 ? Math.round(f.timer.seconds / 60) + " minute countdown" : f.timer.seconds + "s countdown") : "stopwatch";
    return '<section class="card timer-card"><h2 class="card-head">Timer <span class="timer-kind">' + esc(label) + "</span></h2>" +
      '<div class="timer-display" id="timer-display">' + (cd ? esc(PB.formatTime(f.timer.seconds)) : "0:00.0") + "</div>" +
      '<p class="timer-note" id="timer-note">' +
      esc(cd ? "Start it, go all out until the beeps, then type your result below."
        : (f.timer.laps ? "Tap Lap as you pass each kilometre — the splits and total fill themselves in."
          : "Stop it and the time drops straight into the box below.")) + "</p>" +
      '<div class="btn-row"><button type="button" class="btn btn-primary" id="timer-main">Start</button>' +
      '<button type="button" class="btn" id="timer-side" hidden>Lap</button></div></section>';
  }

  function wireTimer(f) {
    if (!f.timer) return;
    var cd = f.timer.mode === "countdown";
    var display = document.getElementById("timer-display");
    var note = document.getElementById("timer-note");
    var main = document.getElementById("timer-main");
    var side = document.getElementById("timer-side");
    var startTs = 0, lastLapTs = 0, lapIndex = 0, lastWholeSecond = -1;

    function show(secs, tenths) {
      display.textContent = PB.formatTime(tenths ? Math.round(secs * 10) / 10 : Math.max(0, Math.ceil(secs)));
    }

    function tick() {
      if (timer.state !== "running") return;
      var elapsed = (Date.now() - startTs) / 1000;
      if (cd) {
        var left = f.timer.seconds - elapsed;
        // one cue per second boundary: short beeps into the finish, long one at zero
        var whole = Math.ceil(left);
        if (whole !== lastWholeSecond && whole <= 3 && whole >= 1) { timerBeep(880, 0.12); timerBuzz(60); }
        lastWholeSecond = whole;
        if (left <= 0) {
          timerStopTicking();
          timerBeep(1318, 0.7);
          timerBuzz([120, 80, 240]);
          display.textContent = "0:00";
          note.textContent = "Time! Type your result below.";
          main.textContent = "Start again";
          side.hidden = true;
          var first = document.querySelector("#entry-form input");
          if (first) first.focus();
          return;
        }
        show(left, left < 10);
      } else {
        show(elapsed, true);
      }
      timer.raf = requestAnimationFrame(tick);
    }

    function begin() {
      startTs = Date.now();
      lastLapTs = startTs;
      lapIndex = 0;
      lastWholeSecond = -1;
      timer.state = "running";
      timerWake(true);
      timerBeep(660, 0.15);
      main.textContent = cd ? "Cancel" : "Stop" + (f.timer.fill ? " & fill in" : "");
      if (f.timer.laps) {
        side.hidden = false;
        side.textContent = "Lap";
        note.textContent = "Lap 1 of " + f.timer.laps.length + " — tap Lap as you pass 1km.";
      }
      tick();
    }

    function finishStopwatch() {
      var elapsed = (Date.now() - startTs) / 1000;
      timerStopTicking();
      show(elapsed, true);
      if (f.timer.laps && lapIndex > 0 && lapIndex < f.timer.laps.length) {
        // stopped mid-run: the final stretch is the last split
        fillField(f.timer.laps[lapIndex], (Date.now() - lastLapTs) / 1000);
      }
      if (f.timer.fill) fillField(f.timer.fill, elapsed);
      note.textContent = "In the box. Check it, add the date, save.";
      main.textContent = "Start again";
      side.hidden = true;
      timerBuzz(150);
    }

    main.onclick = function () {
      if (timer.state === "running") {
        if (cd) {
          timerStopTicking();
          show(f.timer.seconds);
          note.textContent = "Cancelled — nothing recorded.";
          main.textContent = "Start";
        } else {
          finishStopwatch();
        }
      } else {
        if (cd) show(f.timer.seconds);
        begin();
      }
    };

    side.onclick = function () {
      if (timer.state !== "running" || !f.timer.laps) return;
      var now = Date.now();
      fillField(f.timer.laps[lapIndex], (now - lastLapTs) / 1000);
      lastLapTs = now;
      lapIndex++;
      timerBeep(880, 0.1);
      timerBuzz(60);
      if (lapIndex >= f.timer.laps.length) {
        finishStopwatch();
      } else {
        note.textContent = "Lap " + (lapIndex + 1) + " of " + f.timer.laps.length + " — split " + lapIndex + " is in.";
      }
    };
  }

  /* A one-tap "watch how it's done" link. Opens in the YouTube app or a new
   * tab — never inside the tracker, so a half-typed entry is not lost. */
  function videoLink(f) {
    if (!f || !f.video) return "";
    return '<a class="video-link" href="' + esc(f.video.url) + '" target="_blank" rel="noopener">' +
      '<span class="video-play">▶</span> How to do it — short video <span class="video-by">' +
      esc(f.video.by) + "</span></a>";
  }

  /* ------------------------------------------------------------- Entry form */

  function viewForm(formId) {
    var f = PB.form(formId);
    if (!f) return notFound();
    var s = PB.section(f.section);

    var html = ['<header class="screen-head form-head"><a class="back" href="#/log">Back</a>' +
      '<div class="head-with-art"><div><h1>' + esc(f.title) + '</h1><p class="sub">' + esc(f.blurb) + "</p></div>" +
      PB.art(f.art, "art-form") + "</div>" + videoLink(f) + "</header>"];
    if (f.race) html.push('<p class="race-line">' + esc(f.race) + "</p>");
    var formLevels = PB.score.levels(f.fields[0].metric);
    if (formLevels) {
      var mainMetric = PB.metric(f.fields[0].metric);
      html.push('<p class="levels-line">' + formLevels.map(function (row) {
        return esc(row.name) + " " + esc(PB.formatFull(mainMetric.unit, row.value));
      }).join(" · ") + "</p>");
    }
    html.push(timerCard(f));

    html.push('<form class="card form" id="entry-form" novalidate>');
    var grouped = f.sumTo ? f.sumTo.from : [];
    var openedGrid = false;
    f.fields.forEach(function (fld) {
      var m = PB.metric(fld.metric);
      var u = PB.UNITS[m.unit];
      var inGrid = grouped.indexOf(fld.metric) >= 0;
      if (inGrid && !openedGrid) { html.push('<div class="split-grid">'); openedGrid = true; }
      html.push('<label class="field' + (inGrid ? " field-tight" : "") + '" for="fi-' + fld.metric + '">' +
        '<span class="field-label">' + esc(fld.label) +
        (fld.required ? "" : ' <em class="opt">optional</em>') + "</span>" +
        '<span class="field-input">' +
        '<input id="fi-' + fld.metric + '" name="' + fld.metric + '" type="text" ' +
        'inputmode="' + (u.input === "time" ? "numeric" : "decimal") + '" ' +
        'autocomplete="off" placeholder="' + esc(u.input === "time" ? "mm:ss" : "0") + '">' +
        (u.suffix && u.suffix !== "/500m" ? '<span class="unit">' + esc(u.suffix) + "</span>" : "") +
        "</span>" +
        '<span class="hint" data-hint="' + fld.metric + '">' + esc(inGrid ? "" : u.hint) + "</span></label>");
    });
    if (openedGrid) html.push("</div>");

    if (f.derive) {
      html.push('<p class="derived" id="derived-out">Pace per 500m fills in automatically.</p>');
    }

    html.push('<label class="field"><span class="field-label">Date</span>' +
      '<span class="field-input"><input type="date" name="date" value="' + PB.today() + '" max="' + PB.today() + '"></span></label>');
    html.push('<label class="field"><span class="field-label">Note <em class="opt">optional</em></span>' +
      '<span class="field-input"><input type="text" name="note" maxlength="120" placeholder="How it felt, conditions, kit"></span></label>');

    html.push('<p class="form-error" id="form-error" hidden></p>');
    html.push('<button class="btn btn-primary" type="submit">Save entry</button>');
    html.push("</form>");

    var primary = f.fields[0].metric;
    var b = PB.store.best(primary);
    if (b) {
      html.push('<div class="card note-card"><span class="label">Current PB</span>' +
        '<strong class="big">' + esc(PB.formatFull(PB.metric(primary).unit, b.value)) + "</strong>" +
        '<span class="muted">' + esc(PB.formatDate(b.date)) + " · " + esc(PB.relativeDay(b.date)) + "</span>" +
        '<a class="link" href="#/activity/' + primary + '">See progress</a></div>');
    }
    html.push('<p class="fine">' + esc(s.name) + " · " + (s.sub ? esc(s.sub) + " · " : "") +
      "Times can be typed as 8:42, or as plain seconds.</p>");
    return html.join("");
  }

  function wireForm(formId) {
    var f = PB.form(formId);
    var form = document.getElementById("entry-form");
    if (!f || !form) return;
    wireTimer(f);

    function raw(metricId) {
      var el = form.querySelector('[name="' + metricId + '"]');
      return el ? el.value.trim() : "";
    }

    function echo() {
      f.fields.forEach(function (fld) {
        var m = PB.metric(fld.metric);
        fld.hintless = f.sumTo && f.sumTo.from.indexOf(fld.metric) >= 0;
        var hint = form.querySelector('[data-hint="' + fld.metric + '"]');
        var text = raw(fld.metric);
        if (!hint) return;
        var base = fld.hintless ? "" : PB.UNITS[m.unit].hint;
        if (!text) { hint.textContent = base; hint.className = "hint"; return; }
        var v = PB.parseValue(m.unit, text);
        if (v == null) {
          hint.textContent = "Not a valid entry — " + PB.UNITS[m.unit].hint;
          hint.className = "hint bad";
        } else {
          /* Only speak up when the app read something other than what was
             typed — "8:42" needs no commentary, "522" does. */
          var shown = PB.formatValue(m.unit, v);
          hint.textContent = shown === text ? base : "Reads as " + PB.formatFull(m.unit, v);
          hint.className = shown === text ? "hint" : "hint good";
        }
      });

      if (f.derive) {
        var out = document.getElementById("derived-out");
        var total = PB.parseValue(PB.metric(f.derive.from).unit, raw(f.derive.from));
        out.textContent = total == null
          ? "Pace per 500m fills in automatically."
          : "Pace per 500m: " + PB.formatFull("pace", total / f.derive.divide);
      }

      if (f.sumTo) {
        var parts = f.sumTo.from.map(function (id) { return PB.parseValue("time", raw(id)); });
        var totalEl = form.querySelector('[name="' + f.sumTo.metric + '"]');
        if (parts.every(function (p) { return p != null; }) && totalEl && !totalEl.dataset.touched) {
          totalEl.value = PB.formatTime(parts.reduce(function (a, b) { return a + b; }, 0));
          echoOne(f.sumTo.metric);
        }
      }
    }

    function echoOne(metricId) {
      var m = PB.metric(metricId);
      var hint = form.querySelector('[data-hint="' + metricId + '"]');
      var v = PB.parseValue(m.unit, raw(metricId));
      if (hint && v != null) {
        var shown = PB.formatValue(m.unit, v);
        var same = shown === raw(metricId);
        hint.textContent = same ? "" : "Reads as " + PB.formatFull(m.unit, v);
        hint.className = same ? "hint" : "hint good";
      }
    }

    form.addEventListener("input", function (e) {
      if (e.target.name === (f.sumTo && f.sumTo.metric)) e.target.dataset.touched = "1";
      echo();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("form-error");
      var values = {}, problem = null;

      f.fields.forEach(function (fld) {
        var m = PB.metric(fld.metric);
        var text = raw(fld.metric);
        if (!text) {
          if (fld.required) problem = problem || (fld.label + " is needed to save this entry.");
          return;
        }
        var v = PB.parseValue(m.unit, text);
        if (v == null) { problem = problem || (fld.label + " is not a value we can read. " + PB.UNITS[m.unit].hint + "."); return; }
        values[fld.metric] = v;
      });

      var date = form.querySelector('[name="date"]').value || PB.today();
      if (date > PB.today()) problem = problem || "That date is in the future.";

      if (problem) {
        err.textContent = problem;
        err.hidden = false;
        return;
      }
      err.hidden = true;

      if (f.derive && values[f.derive.from] != null) {
        values[f.derive.metric] = Math.round((values[f.derive.from] / f.derive.divide) * 10) / 10;
      }

      var note = form.querySelector('[name="note"]').value.trim();
      var res = PB.store.addSession(values, date, note);

      var scoredPrs = res.prs.filter(function (id) { return PB.metric(id).scored; });
      var msg = res.prs.length
        ? icon("trophy") + "<div><strong>New personal best</strong><span>" +
          esc(res.prs.map(function (id) { return PB.metric(id).short; }).join(" · ")) + "</span></div>"
        : "<div><strong>Entry saved</strong><span>" + esc(f.title) + " · " + esc(PB.formatDate(date)) + "</span></div>";
      toast(msg, res.prs.length ? "pb" : "");
      go("#/activity/" + f.fields[0].metric);
      void scoredPrs;
    });

    echo();
  }

  /* ------------------------------------------------------------------- PBs */

  function viewPBs() {
    var html = ['<header class="screen-head"><h1>Personal bests</h1>' +
      '<p class="sub">Every line of the tracker. Tap one for its graph and history.</p></header>'];

    PB.SECTIONS.forEach(function (s) {
      html.push('<section class="block"><h2 class="block-head">' + icon(s.icon) +
        '<span class="num">' + s.n + ".</span> " + esc(s.name) +
        (s.sub ? ' <em>(' + esc(s.sub) + ")</em>" : "") + "</h2>");
      html.push('<div class="rows">');
      PB.metricsIn(s.id).forEach(function (m) {
        var b = PB.store.best(m.id);
        var count = PB.store.entriesFor(m.id).length;
        html.push('<a class="row" href="#/activity/' + m.id + '">' +
          '<span class="row-main"><span class="row-name">' + esc(m.list) +
          (m.derived ? ' <em class="tag">auto</em>' : "") + "</span>" +
          '<span class="row-meta">' + (b ? esc(PB.formatDate(b.date)) + " · " + count + (count === 1 ? " entry" : " entries") : "Not logged yet") + "</span></span>" +
          PB.chart.spark(m.id) +
          '<span class="row-val">' + (b ? esc(PB.formatFull(m.unit, b.value)) : "—") + "</span>" +
          '<span class="row-arrow">›</span></a>');
      });
      html.push("</div></section>");
    });
    if (PB.store.totalEntries()) {
      html.push('<button class="btn" type="button" data-share="all">Share my personal bests</button>');
    }
    return html.join("");
  }

  /* -------------------------------------------------------- Activity detail */

  function viewActivity(metricId) {
    var m = PB.metric(metricId);
    if (!m) return notFound();
    var s = PB.section(m.section);
    var entries = PB.store.entriesFor(metricId).slice().reverse();
    var ranked = PB.store.ranked(metricId);
    var ms = PB.score.metricScore(metricId);
    var imp = PB.score.improvement(metricId);

    var html = ['<header class="screen-head form-head"><a class="back" href="#/pbs">Back</a>' +
      '<div class="head-with-art"><div><h1>' + esc(m.name) + '</h1><p class="sub">' + esc(s.name) +
      (m.derived ? " · worked out from your " + esc(PB.metric(m.derived).name) : "") + "</p></div>" +
      PB.art(PB.artFor(m.derived || metricId), "art-form") + "</div></header>"];

    var b = ranked[0];
    html.push('<div class="card hero-stat">' +
      '<div><span class="label">Personal best</span><strong class="big">' +
      (b ? esc(PB.formatFull(m.unit, b.value)) : "—") + "</strong>" +
      '<span class="muted">' + (b ? esc(PB.formatDate(b.date)) + " · " + esc(PB.relativeDay(b.date)) : "Nothing logged yet") + "</span></div>" +
      (ms && ms.logged
        ? '<div class="score-chip ' + ms.band.cls + '"><strong>' + ms.score + "</strong><span>/100 · " + esc(ms.band.name) + "</span></div>"
        : (m.derived ? '<div class="score-chip muted-chip"><strong>—</strong><span>not scored</span></div>' : "")) +
      "</div>");

    if (imp != null) {
      html.push('<p class="improve ' + (imp >= 0 ? "up" : "down") + '">' +
        (imp >= 0 ? "▲ " + imp + "% better" : "▼ " + Math.abs(imp) + "% off") +
        " than your first logged effort.</p>");
    }

    var planStart = PB.store.athlete().planStart;
    if (planStart) {
      var pre = PB.store.entriesFor(metricId).filter(function (e) { return e.date < planStart; });
      var post = PB.store.entriesFor(metricId).filter(function (e) { return e.date >= planStart; });
      if (pre.length && post.length) {
        var sign = m.better === "lower" ? 1 : -1;
        var preBest = pre.slice().sort(function (a, x) { return sign * (a.value - x.value); })[0].value;
        var postBest = post.slice().sort(function (a, x) { return sign * (a.value - x.value); })[0].value;
        var delta = m.better === "lower" ? (preBest - postBest) / preBest : (postBest - preBest) / preBest;
        delta = Math.round(delta * 1000) / 10;
        html.push('<p class="improve ' + (delta >= 0 ? "up" : "down") + '">' +
          (delta >= 0 ? "▲ " + delta + "% on" : "▼ " + Math.abs(delta) + "% off") +
          " your pre-plan baseline of " + esc(PB.formatFull(m.unit, preBest)) + ".</p>");
      }
    }

    html.push('<section class="card"><h2 class="card-head">Progress</h2>' + PB.chart.render(metricId) + "</section>");

    if (ranked.length) {
      html.push('<section class="card"><h2 class="card-head">Top efforts</h2><ol class="podium">');
      ranked.slice(0, 3).forEach(function (e, i) {
        html.push('<li class="podium-row">' + medalBadge(i + 1) +
          '<span class="podium-val">' + esc(PB.formatFull(m.unit, e.value)) + "</span>" +
          '<span class="podium-date">' + esc(PB.formatDate(e.date)) + "</span></li>");
      });
      html.push("</ol>");
      if (ms && ms.logged && ms.score < 100) {
        var nextBand = PB.score.BANDS.filter(function (x) { return x.min > ms.score; }).sort(function (a, c) { return a.min - c.min; })[0];
        if (nextBand) {
          var need = PB.score.valueForScore(m, nextBand.min);
          html.push('<p class="fine">Hit ' + esc(PB.formatFull(m.unit, need)) +
            " to move up to <strong>" + esc(nextBand.name) + "</strong>.</p>");
        }
      }
      html.push("</section>");
    }

    html.push('<section class="card"><h2 class="card-head">History <span class="count">' + entries.length + "</span></h2>");
    if (!entries.length) {
      html.push('<p class="empty">Nothing logged yet. <a class="link" href="#/log">Log this activity</a>.</p>');
    } else {
      html.push('<ul class="history">');
      entries.forEach(function (e) {
        html.push('<li class="hist-row" data-entry="' + e.id + '">' +
          '<span class="hist-medal">' + (medalBadge(PB.store.medal(e)) || '<span class="medal blank"></span>') + "</span>" +
          '<span class="hist-main"><strong>' + esc(PB.formatFull(m.unit, e.value)) + "</strong>" +
          '<span class="muted">' + esc(PB.formatDate(e.date)) +
          (e.note ? " · " + esc(e.note) : "") + "</span></span>" +
          '<a class="icon-btn" href="#/edit/' + e.id + '" aria-label="Edit this entry">✎</a>' +
          '<button class="icon-btn" data-delete="' + e.id + '" aria-label="Delete this entry">✕</button></li>');
      });
      html.push("</ul>");
    }
    html.push("</section>");

    var lv = PB.score.levels(metricId);
    if (lv) {
      html.push('<section class="card"><h2 class="card-head">Where you stand</h2><ul class="levels-list">');
      lv.forEach(function (row) {
        html.push('<li class="' + (row.here ? "here" : "") + '"><span class="lvl-name">' + esc(row.name) + "</span>" +
          '<span class="lvl-val">' + esc(PB.formatFull(m.unit, row.value)) + "</span>" +
          (row.here ? '<span class="lvl-you">you are here</span>' : "") + "</li>");
      });
      html.push('</ul><p class="fine">Reference marks for a male open-division athlete — the same scale the score uses. Log an entry and your nearest mark lights up.</p></section>');
    }

    var parentForm = PB.FORMS.filter(function (f) {
      return f.fields.some(function (x) { return x.metric === metricId; });
    })[0];
    if (parentForm && parentForm.video) html.push(videoLink(parentForm));
    if (parentForm) html.push('<a class="btn btn-primary" href="#/log/' + parentForm.id + '">Log a new ' + esc(m.short) + "</a>");
    if (ranked.length) html.push('<button class="btn" type="button" data-share="' + metricId + '">Share this PB</button>');
    return html.join("");
  }

  /* ------------------------------------------------------------ Edit entry */

  function viewEdit(entryId) {
    var entry = PB.store.load().entries.filter(function (e) { return e.id === entryId; })[0];
    if (!entry) return notFound();
    var m = PB.metric(entry.metric);
    var u = PB.UNITS[m.unit];

    return '<header class="screen-head"><a class="back" href="#/activity/' + entry.metric + '">Back</a>' +
      "<h1>Edit entry</h1><p class=\"sub\">" + esc(m.name) + "</p></header>" +
      '<form class="card form" id="edit-form" novalidate>' +
      '<label class="field" for="edit-value"><span class="field-label">Result</span>' +
      '<span class="field-input"><input id="edit-value" type="text" ' +
      'inputmode="' + (u.input === "time" ? "numeric" : "decimal") + '" autocomplete="off" value="' +
      esc(PB.formatValue(m.unit, entry.value)) + '">' +
      (u.suffix && u.suffix !== "/500m" ? '<span class="unit">' + esc(u.suffix) + "</span>" : "") +
      '</span><span class="hint" id="edit-hint">' + esc(u.hint) + "</span></label>" +
      '<label class="field"><span class="field-label">Date</span>' +
      '<span class="field-input"><input type="date" id="edit-date" value="' + esc(entry.date) +
      '" max="' + PB.today() + '"></span></label>' +
      '<label class="field"><span class="field-label">Note <em class="opt">optional</em></span>' +
      '<span class="field-input"><input type="text" id="edit-note" maxlength="120" value="' + esc(entry.note) + '"></span></label>' +
      '<p class="form-error" id="edit-error" hidden></p>' +
      '<button class="btn btn-primary" type="submit">Save changes</button>' +
      '<button class="btn btn-danger" type="button" id="edit-delete">Delete this entry</button></form>' +
      (m.derived ? '<p class="fine">This row was worked out from your ' + esc(PB.metric(m.derived).name) +
        ". Editing it here changes this row only.</p>" : "");
  }

  function wireEdit(match) {
    var entryId = match[1];
    var entry = PB.store.load().entries.filter(function (e) { return e.id === entryId; })[0];
    if (!entry) return;
    var m = PB.metric(entry.metric);
    var form = document.getElementById("edit-form");
    var input = document.getElementById("edit-value");
    var hint = document.getElementById("edit-hint");

    input.addEventListener("input", function () {
      var v = PB.parseValue(m.unit, input.value.trim());
      if (!input.value.trim()) { hint.textContent = PB.UNITS[m.unit].hint; hint.className = "hint"; return; }
      if (v == null) { hint.textContent = "Not a valid entry — " + PB.UNITS[m.unit].hint; hint.className = "hint bad"; return; }
      var shown = PB.formatValue(m.unit, v);
      hint.textContent = shown === input.value.trim() ? PB.UNITS[m.unit].hint : "Reads as " + PB.formatFull(m.unit, v);
      hint.className = shown === input.value.trim() ? "hint" : "hint good";
    });

    document.getElementById("edit-delete").onclick = function () {
      if (!confirm("Delete this entry? It cannot be undone.")) return;
      PB.store.deleteEntry(entryId);
      go("#/activity/" + entry.metric);
      toast("<div><strong>Entry deleted</strong></div>");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = document.getElementById("edit-error");
      var v = PB.parseValue(m.unit, input.value.trim());
      var date = document.getElementById("edit-date").value || entry.date;
      if (v == null) {
        err.textContent = "That result is not a value we can read. " + PB.UNITS[m.unit].hint + ".";
        err.hidden = false;
        return;
      }
      if (date > PB.today()) { err.textContent = "That date is in the future."; err.hidden = false; return; }
      PB.store.updateEntry(entryId, v, date, document.getElementById("edit-note").value.trim());
      go("#/activity/" + entry.metric);
      toast("<div><strong>Entry updated</strong><span>" + esc(PB.formatFull(m.unit, v)) + "</span></div>");
    });
  }

  /* ----------------------------------------------------------------- Share */

  /* A plain-text card: the phone share sheet takes it, and anything without
   * one falls back to the clipboard. */
  function shareText(metricId) {
    var name = PB.store.athlete().name;
    var lines = [];
    if (metricId) {
      var m = PB.metric(metricId);
      var ranked = PB.store.ranked(metricId).slice(0, 3);
      lines.push((name ? name + " — " : "") + m.name);
      ranked.forEach(function (e, i) {
        lines.push(["1st", "2nd", "3rd"][i] + "  " + PB.formatFull(m.unit, e.value) + "  (" + PB.formatDate(e.date) + ")");
      });
      var ms = PB.score.metricScore(metricId);
      if (ms && ms.logged) lines.push("Score " + ms.score + "/100 · " + ms.band.name);
    } else {
      var o = PB.score.overall();
      lines.push((name ? name + " — " : "") + "Hyrox Tracker");
      if (o.score != null) lines.push("Fitness score " + o.score + "/100 · " + o.band.name);
      lines.push("");
      PB.SECTIONS.forEach(function (s) {
        var rows = PB.metricsIn(s.id).filter(function (mm) { return PB.store.best(mm.id); });
        if (!rows.length) return;
        lines.push(s.name.toUpperCase());
        rows.forEach(function (mm) {
          var b = PB.store.best(mm.id);
          lines.push("  " + mm.list + ": " + PB.formatFull(mm.unit, b.value) + " (" + PB.formatDate(b.date) + ")");
        });
        lines.push("");
      });
    }
    return lines.join("\n").trim();
  }

  function share(metricId) {
    var text = shareText(metricId);
    var title = metricId ? PB.metric(metricId).name : "My personal bests";
    if (navigator.share) {
      navigator.share({ title: title, text: text }).catch(function () { /* dismissed */ });
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        toast("<div><strong>Copied</strong><span>Paste it into a message</span></div>");
      }, function () { prompt("Copy your bests:", text); });
      return;
    }
    prompt("Copy your bests:", text);
  }

  /* ----------------------------------------------------------------- Score */

  function ring(score) {
    var r = 52, c = 2 * Math.PI * r;
    var arc = '<circle class="ring-bg" cx="60" cy="60" r="' + r + '"/>';
    if (score) {                       /* a rounded cap on a zero-length arc draws a stray dot */
      arc += '<circle class="ring-fg" cx="60" cy="60" r="' + r + '" stroke-dasharray="' +
        (c * (score / 100)).toFixed(1) + " " + c.toFixed(1) + '"/>';
    }
    return '<svg class="ring" viewBox="0 0 120 120" aria-hidden="true">' + arc + "</svg>";
  }

  function viewScore() {
    var o = PB.score.overall();
    var html = ['<header class="screen-head"><h1>Fitness score</h1>' +
      '<p class="sub">One number out of 100, built from the five sections of the tracker.</p></header>'];

    html.push('<section class="card score-hero">' + ring(o.score) +
      '<div class="score-hero-body"><strong class="score-num">' + (o.score == null ? "—" : o.score) + "</strong>" +
      '<span class="score-of">out of 100</span>' +
      (o.band ? '<span class="band ' + o.band.cls + '">' + esc(o.band.name) + "</span>" : "") +
      '<span class="muted">' + o.logged + " of " + o.total + " scored activities logged" +
      (o.complete ? " — full picture" : " — the rest are not counted yet") + "</span></div></section>");

    if (PB.score.history().length > 1) {
      html.push('<section class="card"><h2 class="card-head">Score over time</h2>' +
        PB.chart.scoreTrend() + "</section>");
    }

    var weak = PB.score.weakestLogged();
    var next = PB.score.nextUnlogged();
    if (next || weak) {
      html.push('<section class="card next-up"><h2 class="card-head">What moves the number</h2><ul class="nudges">');
      if (next) html.push('<li><span class="nudge-tag">Untested</span><a class="link" href="#/log">' +
        esc(next.metric.list) + "</a> — no score until you log it.</li>");
      if (weak) html.push('<li><span class="nudge-tag">Weakest</span><a class="link" href="#/activity/' +
        weak.metric.id + '">' + esc(weak.metric.list) + "</a> — scoring " + weak.score + "/100.</li>");
      html.push("</ul></section>");
    }

    html.push('<div class="sec-grid">');
    o.sections.forEach(function (sec) {
      html.push('<section class="card sec-card"><h2 class="card-head">' + icon(sec.section.icon) +
        esc(sec.section.name) + '<span class="sec-score">' +
        (sec.score == null ? "—" : sec.score) + "</span></h2>");
      html.push('<div class="bar"><span style="width:' + (sec.score || 0) + '%"></span></div>');
      html.push('<p class="fine">' + sec.logged + " of " + sec.total + " logged" +
        (sec.band ? " · " + esc(sec.band.name) : "") + "</p>");
      html.push('<ul class="score-rows">');
      sec.rows.forEach(function (r) {
        html.push('<li><a href="#/activity/' + r.metric.id + '"><span class="sr-name">' + esc(r.metric.list) + "</span>" +
          '<span class="sr-val">' + (r.logged ? esc(PB.formatFull(r.metric.unit, r.best.value)) : "—") + "</span>" +
          '<span class="sr-score ' + (r.logged ? r.band.cls : "band-none") + '">' +
          (r.logged ? r.score : "·") + "</span></a></li>");
      });
      html.push("</ul></section>");
    });
    html.push("</div>");

    html.push('<section class="card"><h2 class="card-head">How this is worked out</h2>' +
      '<p class="body">Every scored activity sits on a 0–100 scale between a starting benchmark and a strong one. ' +
      "A section is the average of the activities you have logged in it, and the overall score is the average of the sections that have any data — so the five sections carry equal weight and the eight one-minute tests cannot drown out the 5km run.</p>" +
      '<p class="body">Pace per 500m and the 1km splits are shown, graphed and medalled, but not scored: they are the same effort as their parent activity, so counting them would double up.</p>' +
      '<p class="fine">Benchmarks are general hybrid-fitness reference points, not a clinical measure. They are listed in the README if you want to tune them.</p></section>');
    return html.join("");
  }

  /* --------------------------------------------------------------- History */

  function viewHistory() {
    var sessions = PB.store.recentSessions(80);
    var html = ['<header class="screen-head"><h1>History</h1>' +
      '<p class="sub">Everything you have logged, newest first.</p></header>'];

    if (!sessions.length) {
      return html.join("") + '<div class="card empty-card">' + icon("trophy", "big-icon") +
        "<p>Nothing logged yet.</p><a class=\"btn btn-primary\" href=\"#/log\">Log your first activity</a></div>";
    }

    sessions.forEach(function (g) {
      var lead = g.entries[0];
      html.push('<article class="card sess"><div class="sess-head"><strong>' +
        esc(PB.formatDate(g.date)) + '</strong><span class="muted">' + esc(PB.relativeDay(g.date)) + "</span>" +
        '<button class="icon-btn" data-del-session="' + g.session + '" aria-label="Delete this session">✕</button></div>');
      html.push('<ul class="sess-rows">');
      g.entries.forEach(function (e) {
        var m = PB.metric(e.metric);
        html.push("<li>" + (medalBadge(PB.store.medal(e)) || '<span class="medal blank"></span>') +
          '<a class="sess-name" href="#/activity/' + e.metric + '">' + esc(m.list) + "</a>" +
          '<span class="sess-val">' + esc(PB.formatFull(m.unit, e.value)) + "</span></li>");
      });
      html.push("</ul>");
      if (g.note) html.push('<p class="sess-note">' + esc(g.note) + "</p>");
      html.push("</article>");
      void lead;
    });
    return html.join("");
  }

  /* One delegated handler for the whole app — screens are re-rendered often,
   * so per-render listeners would stack up. */
  function wireDeletes() {
    view.addEventListener("click", function (e) {
      var one = e.target.closest("[data-delete]");
      if (one) {
        if (!confirm("Delete this entry? It cannot be undone.")) return;
        PB.store.deleteEntry(one.getAttribute("data-delete"));
        render();
        toast("<div><strong>Entry deleted</strong></div>");
        return;
      }
      var drop = e.target.closest("[data-drop-coach]");
      if (drop) {
        if (!confirm("Remove this coach's access to your data?")) return;
        PB.sync.dropCoach(drop.getAttribute("data-drop-coach")).then(function () {
          render();
          toast("<div><strong>Access removed</strong></div>");
        }, function () {
          toast("<div><strong>Could not remove access</strong><span>Try again when you are online</span></div>");
        });
        return;
      }
      var sh = e.target.closest("[data-share]");
      if (sh) {
        var target = sh.getAttribute("data-share");
        share(target === "all" ? null : target);
        return;
      }
      var sess = e.target.closest("[data-del-session]");
      if (sess) {
        if (!confirm("Delete every entry logged in this session?")) return;
        PB.store.deleteSession(sess.getAttribute("data-del-session"));
        render();
        toast("<div><strong>Session deleted</strong></div>");
      }
    });
  }

  /* ------------------------------------------------------------------ Data */

  function syncCard() {
    var st = PB.sync.status();
    var html = ['<section class="card"><h2 class="card-head">Sync &amp; coach</h2>'];

    /* The claude.ai artifact viewer sandboxes network calls, so sync cannot
     * run there — say so instead of failing mysteriously. */
    if (window.claude && typeof window.claude.use === "function") {
      html.push('<p class="body">Sync is not available in this preview — the page cannot reach the internet from here. ' +
        "Use the app from its own web address (or installed on your home screen) and this section lights up.</p></section>");
      return html.join("");
    }

    if (!st.configured) {
      html.push('<p class="body">Optional: connect a Supabase project and your entries follow you between ' +
        "devices, behind a sign-in so only you (and a coach you invite) can see them. " +
        "Without it the app keeps working on this device alone.</p>" +
        '<label class="field"><span class="field-label">Project URL</span>' +
        '<span class="field-input"><input type="url" id="sync-url" placeholder="https://xxxx.supabase.co" autocomplete="off"></span></label>' +
        '<label class="field"><span class="field-label">Anon key</span>' +
        '<span class="field-input"><input type="text" id="sync-key" placeholder="eyJ…" autocomplete="off"></span></label>' +
        '<p class="form-error" id="sync-error" hidden></p>' +
        '<button class="btn" id="sync-connect">Connect</button>' +
        '<p class="fine">Setting the project up takes ten minutes once — the steps are in supabase/SETUP.md in the repo.</p>');
    } else if (!st.signedIn) {
      html.push('<p class="body">Sign in and your entries follow you between devices — only you, and a coach you invite, can see them.</p>' +
        '<label class="field"><span class="field-label">Email</span>' +
        '<span class="field-input"><input type="email" id="sync-email" inputmode="email" autocomplete="email" placeholder="you@example.com"></span></label>' +
        '<button class="btn btn-primary" id="sync-request">Email me a sign-in link</button>' +
        '<div id="sync-code-wrap" hidden><p class="body">Check your email on this device and tap the link — that signs you in here. ' +
        "If the email shows a code instead, type it below.</p>" +
        '<label class="field"><span class="field-label">Code from the email <em class="opt">if shown</em></span>' +
        '<span class="field-input"><input type="text" id="sync-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></span></label>' +
        '<button class="btn" id="sync-verify">Sign in with the code</button></div>' +
        '<p class="form-error" id="sync-error" hidden></p>' +
        '<button class="btn btn-ghost" id="sync-disconnect">Turn sync off on this device</button>');
    } else {
      html.push('<p class="body">Signed in as <strong>' + esc(st.email) + "</strong>.</p>" +
        '<p class="fine" id="sync-status-line">' + esc(syncStatusLine(st)) + "</p>" +
        (st.lastError ? '<p class="form-error">' + esc(st.lastError) + "</p>" : "") +
        '<button class="btn" id="sync-now">Sync now</button>' +
        '<div class="btn-row"><button class="btn btn-ghost" id="sync-signout">Sign out</button>' +
        '<button class="btn btn-ghost" id="sync-disconnect">Disconnect</button></div>');
      html.push('<h2 class="card-head" style="margin-top:16px">Coach access</h2>' +
        '<p class="body">A coach sees your entries and scores, read-only. Make a code, send it to them, done.</p>' +
        '<div id="coach-list" class="fine">Checking who can see your data…</div>' +
        '<button class="btn" id="invite-create">Create an invite code for your coach</button>' +
        '<p class="body" id="invite-out" hidden></p>' +
        '<label class="field"><span class="field-label">Coaching someone? Enter their code</span>' +
        '<span class="field-input"><input type="text" id="redeem-code" placeholder="ABCD-EFGH" autocomplete="off" style="text-transform:uppercase"></span></label>' +
        '<button class="btn" id="invite-redeem">Link me to this athlete</button>' +
        '<p class="form-error" id="coach-error" hidden></p>' +
        '<div id="athlete-link"></div>');
    }
    html.push("</section>");
    return html.join("");
  }

  function syncStatusLine(st) {
    var when = st.busy ? "Syncing…"
      : st.lastSync ? "Last synced " + PB.relativeDay(st.lastSync.slice(0, 10)).toLowerCase()
        : "Not synced yet";
    var queue = st.pending === 0 ? "nothing waiting to upload"
      : st.pending + " change" + (st.pending === 1 ? "" : "s") + " waiting to upload";
    return when + " · " + queue;
  }

  function viewData() {
    var a = PB.store.athlete();
    return '<header class="screen-head"><a class="back" href="#/pbs">Back</a><h1>Data &amp; backup</h1>' +
      '<p class="sub">Entries live on this device; connect sync below and they follow you.</p></header>' +
      syncCard() +
      '<section class="card"><h2 class="card-head">Your name</h2>' +
      '<label class="field"><span class="field-input"><input type="text" id="athlete-name" maxlength="40" ' +
      'placeholder="Shown at the top of the app" value="' + esc(a.name) + '"></span></label>' +
      '<label class="field"><span class="field-label">Plan start date</span>' +
      '<span class="field-input"><input type="date" id="plan-start" value="' + esc(a.planStart) + '"></span>' +
      '<span class="hint">Everything logged before this date counts as your baseline. Clear it to switch the plan features off.</span></label>' +
      '<button class="btn" id="save-name">Save</button></section>' +
      '<section class="card"><h2 class="card-head">Back up</h2>' +
      '<p class="body">' + PB.store.totalEntries() + " entries stored on this device. Download a copy before you clear your browser data or change phone — a backup file is the only way to move your history to another phone or browser.</p>" +
      '<p class="fine" id="storage-status">Checking storage…</p>' +
      '<button class="btn" id="export-btn">Download backup file</button>' +
      '<button class="btn" id="csv-btn">Download as CSV (for a spreadsheet)</button>' +
      '<button class="btn" id="copy-btn">Copy to clipboard</button></section>' +
      '<section class="card"><h2 class="card-head">Restore</h2>' +
      '<p class="body">Load a backup file. Merge keeps what is here and adds anything missing; replace wipes first.</p>' +
      '<input type="file" id="import-file" accept="application/json,.json">' +
      '<div class="btn-row"><button class="btn" id="import-merge">Merge in</button>' +
      '<button class="btn btn-ghost" id="import-replace">Replace everything</button></div></section>' +
      '<section class="card danger"><h2 class="card-head">Start again</h2>' +
      '<p class="body">Deletes every entry on this device. There is no undo.</p>' +
      '<button class="btn btn-danger" id="clear-btn">Delete all my data</button></section>' +
      '<p class="fine">Hyrox Tracker · works offline · add it to your home screen from your browser menu.</p>';
  }

  function wireData() {
    var $ = function (id) { return document.getElementById(id); };

    PB.store.storageReport(function (r) {
      var el = $("storage-status");
      if (!el) return;
      el.textContent = "Using " + r.usageKB + " KB · " + (
        r.persisted === true ? "the browser has marked this data as permanent."
          : r.persisted === false ? "stored normally — the browser could clear it if the phone runs very low on space, so keep a backup."
            : "stored in this browser.");
    });

    $("save-name").onclick = function () {
      PB.store.setName($("athlete-name").value.trim());
      PB.store.setPlanStart($("plan-start").value);
      PB.sync.pushProfile().then(null, function () { /* offline is fine */ });
      paintHeader();
      toast("<div><strong>Name saved</strong></div>");
    };

    $("export-btn").onclick = function () {
      saveFile("pb-tracker-" + PB.today() + ".json", PB.store.exportJSON());
    };

    $("csv-btn").onclick = function () {
      var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
      var lines = ["date,section,activity,result,unit,note"];
      PB.store.live().slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; })
        .forEach(function (e) {
          var m = PB.metric(e.metric);
          lines.push([e.date, q(PB.section(m.section).name), q(m.name),
            q(PB.formatValue(m.unit, e.value)), q((PB.UNITS[m.unit].suffix || "time").replace("/500m", "per 500m")),
            q(e.note)].join(","));
        });
      saveFile("pb-tracker-" + PB.today() + ".csv", lines.join("\r\n"));
    };

    $("copy-btn").onclick = function () {
      var text = PB.store.exportJSON();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          toast("<div><strong>Copied</strong><span>Paste it somewhere safe</span></div>");
        });
      } else {
        prompt("Copy your backup:", text);
      }
    };

    function doImport(mode) {
      var file = $("import-file").files[0];
      if (!file) { toast("<div><strong>Choose a backup file first</strong></div>"); return; }
      if (mode === "replace" && !confirm("Replace everything on this device with the file?")) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var n = PB.store.importJSON(String(reader.result), mode);
          render();
          toast("<div><strong>Restored</strong><span>" + n + " entries read</span></div>");
        } catch (err) {
          toast("<div><strong>Could not read that file</strong><span>" + esc(err.message) + "</span></div>");
        }
      };
      reader.readAsText(file);
    }
    $("import-merge").onclick = function () { doImport("merge"); };
    $("import-replace").onclick = function () { doImport("replace"); };

    $("clear-btn").onclick = function () {
      if (!confirm("Delete every entry on this device?")) return;
      if (!confirm("Really delete everything? Download a backup first if you are not sure.")) return;
      PB.store.clearAll();
      render();
      paintHeader();
      toast("<div><strong>All data deleted</strong></div>");
    };
  }

  /* ---------------------------------------------------------- First run */

  /* The front door on a fresh device: sign in, or carry on without an
   * account. Uses the same field ids as the Data screen's sync card, so
   * wireSync drives both. */
  function viewWelcome() {
    return '<div class="welcome">' + PB.art("run", "art-welcome") +
      '<h1 class="welcome-title">Hyrox Tracker</h1>' +
      '<p class="welcome-sub">Log your times, watts and lifts. Medal your best three efforts. Score your fitness out of 100.</p>' +
      '<section class="card welcome-card">' +
      '<h2 class="card-head">Sign in</h2>' +
      '<p class="body">Your entries back up and follow you to any device. First time? Signing in creates your account — no password to remember.</p>' +
      '<label class="field"><span class="field-label">Email</span>' +
      '<span class="field-input"><input type="email" id="sync-email" inputmode="email" autocomplete="email" placeholder="you@example.com"></span></label>' +
      '<button class="btn btn-primary" id="sync-request">Email me a sign-in link</button>' +
      '<div id="sync-code-wrap" hidden><p class="body">Check your email on this device and tap the link — that signs you in here. ' +
      "If the email shows a code instead, type it below.</p>" +
      '<label class="field"><span class="field-label">Code from the email <em class="opt">if shown</em></span>' +
      '<span class="field-input"><input type="text" id="sync-code" inputmode="numeric" autocomplete="one-time-code" maxlength="8"></span></label>' +
      '<button class="btn" id="sync-verify">Sign in with the code</button></div>' +
      '<p class="form-error" id="sync-error" hidden></p></section>' +
      '<button class="btn btn-ghost" id="welcome-skip">Use without an account for now</button>' +
      '<p class="fine">Without an account everything still works — your entries just live on this device only. You can sign in any time from the top-right of the app.</p></div>';
  }

  function wireWelcome() {
    wireSync();
    var skip = document.getElementById("welcome-skip");
    if (skip) skip.onclick = function () {
      PB.store.setWelcomeDone(true);
      go("#/log");
    };
  }

  function wireSync() {
    var $ = function (id) { return document.getElementById(id); };
    var fail = function (box) {
      return function (err) {
        var el = $(box);
        if (!el) return;
        var msg = err.message || "That did not work — try again.";
        if (/rate limit/i.test(msg)) {
          msg = "The email service has sent its few allowed emails this hour. Wait a little and press the button again — your entries keep saving on this device meanwhile.";
        }
        el.textContent = msg;
        el.hidden = false;
      };
    };

    if ($("sync-connect")) {
      $("sync-connect").onclick = function () {
        try {
          PB.sync.setConfig($("sync-url").value, $("sync-key").value);
          render();
        } catch (err) { fail("sync-error")(err); }
      };
    }
    if ($("sync-request")) {
      $("sync-request").onclick = function () {
        var email = $("sync-email").value.trim();
        if (!email) { fail("sync-error")(new Error("Enter your email first.")); return; }
        $("sync-request").disabled = true;
        PB.sync.requestCode(email).then(function () {
          $("sync-code-wrap").hidden = false;
          $("sync-error").hidden = true;
          $("sync-request").disabled = false;
          $("sync-request").textContent = "Email me another link";
          toast("<div><strong>Email sent</strong><span>Tap the link in it on this device</span></div>");
        }, function (err) { $("sync-request").disabled = false; fail("sync-error")(err); });
      };
    }
    if ($("sync-verify")) {
      $("sync-verify").onclick = function () {
        PB.sync.verifyCode($("sync-email").value.trim(), $("sync-code").value).then(function () {
          PB.sync.pushProfile();
          PB.store.setWelcomeDone(true);
          go("#/log");
          toast("<div><strong>Signed in</strong><span>This device now syncs</span></div>");
        }, fail("sync-error"));
      };
    }
    if ($("sync-now")) {
      $("sync-now").onclick = function () {
        PB.sync.syncNow().then(function (r) {
          render();
          if (r) toast("<div><strong>Synced</strong><span>" + r.pulled + " in, " + r.pushed + " out</span></div>");
        }, function () { render(); });
      };
    }
    if ($("sync-signout")) $("sync-signout").onclick = function () { PB.sync.signOut(); render(); };
    if ($("sync-disconnect")) {
      $("sync-disconnect").onclick = function () {
        if (!confirm("Disconnect? Entries stay on this device and on the server; this device just stops syncing.")) return;
        PB.sync.disconnect();
        render();
      };
    }

    if ($("coach-list")) {
      PB.sync.myCoaches().then(function (coaches) {
        var el = $("coach-list");
        if (!el) return;
        el.innerHTML = coaches.length
          ? "Can see your data: " + coaches.map(function (c) {
              return esc(c.name) + ' <button class="linkish" data-drop-coach="' + c.id + '">remove</button>';
            }).join(" · ")
          : "Nobody else can see your data yet.";
      }, function () { var el = $("coach-list"); if (el) el.textContent = "Could not check coach access just now."; });

      PB.sync.myAthletes().then(function (athletes) {
        var el = $("athlete-link");
        if (el && athletes.length) {
          el.innerHTML = '<a class="btn" href="#/coach">You coach ' + athletes.length +
            (athletes.length === 1 ? " athlete" : " athletes") + " — see their PBs</a>";
        }
      }, function () {});

      $("invite-create").onclick = function () {
        PB.sync.createInvite().then(function (code) {
          var out = $("invite-out");
          out.hidden = false;
          out.innerHTML = "Send your coach this code: <strong class=\"big\">" + esc(code) +
            "</strong><br><span class=\"muted\">It works once and expires in a week.</span>";
        }, fail("coach-error"));
      };
      $("invite-redeem").onclick = function () {
        var code = $("redeem-code").value.trim();
        if (!code) { fail("coach-error")(new Error("Enter the code the athlete sent you.")); return; }
        PB.sync.redeemInvite(code).then(function () {
          render();
          toast("<div><strong>Linked</strong><span>Their PBs are on the coach screen</span></div>");
        }, fail("coach-error"));
      };
    }
  }

  /* ---------------------------------------------------------------- Coach */

  function viewCoach() {
    return '<header class="screen-head"><a class="back" href="#/data">Back</a><h1>Your athletes</h1>' +
      '<p class="sub">Read-only: their entries, bests and scores as they stand.</p></header>' +
      '<div id="coach-body" class="card"><p class="empty">Fetching your athletes…</p></div>';
  }

  function wireCoach() {
    PB.sync.myAthletes().then(function (athletes) {
      var el = document.getElementById("coach-body");
      if (!el) return;
      if (!athletes.length) {
        el.innerHTML = '<p class="empty">No athletes yet. When one sends you an invite code, enter it on the Data screen.</p>';
        return;
      }
      el.innerHTML = '<div class="rows">' + athletes.map(function (a) {
        return '<a class="row" href="#/coach/' + a.id + '"><span class="row-main"><span class="row-name">' +
          esc(a.name) + "</span></span><span class=\"row-arrow\">›</span></a>";
      }).join("") + "</div>";
    }, function (err) {
      var el = document.getElementById("coach-body");
      if (el) el.innerHTML = '<p class="empty">' + esc(err.message) + "</p>";
    });
  }

  function viewAthlete() {
    return '<header class="screen-head"><a class="back" href="#/coach">Back</a><h1 id="ath-name">Athlete</h1>' +
      '<p class="sub">Their tracker, read-only.</p></header><div id="ath-body"><div class="card"><p class="empty">Fetching…</p></div></div>';
  }

  function wireAthlete(match) {
    var athleteId = match[1];
    PB.sync.myAthletes().then(function (athletes) {
      var who = athletes.filter(function (a) { return a.id === athleteId; })[0];
      var nameEl = document.getElementById("ath-name");
      if (who && nameEl) nameEl.textContent = who.name;
    }, function () {});
    PB.sync.athleteEntries(athleteId).then(function (rows) {
      var el = document.getElementById("ath-body");
      if (!el) return;
      rows = rows || [];
      var bestOf = {};
      rows.forEach(function (r) {
        var m = PB.metric(r.metric);
        if (!m) return;
        var b = bestOf[r.metric];
        if (!b || PB.store.isBetter(m, r.value, b.value)) bestOf[r.metric] = r;
      });
      var overall = PB.score.overallFor(rows);
      var html = ['<div class="card hero-stat"><div><span class="label">Overall score</span>' +
        '<strong class="big">' + (overall == null ? "—" : overall + "/100") + "</strong>" +
        '<span class="muted">' + rows.length + " entries logged</span></div></div>"];
      PB.SECTIONS.forEach(function (sec) {
        html.push('<section class="block"><h2 class="block-head">' + icon(sec.icon) +
          '<span class="num">' + sec.n + ".</span> " + esc(sec.name) + "</h2><div class=\"rows\">");
        PB.metricsIn(sec.id).forEach(function (m) {
          var b = bestOf[m.id];
          html.push('<span class="row"><span class="row-main"><span class="row-name">' + esc(m.name) + "</span>" +
            '<span class="row-meta">' + (b ? esc(PB.formatDate(b.date)) : "Not logged") + "</span></span>" +
            '<span class="row-val">' + (b ? esc(PB.formatFull(m.unit, b.value)) : "—") + "</span></span>");
        });
        html.push("</div></section>");
      });
      el.innerHTML = html.join("");
    }, function (err) {
      var el = document.getElementById("ath-body");
      if (el) el.innerHTML = '<div class="card"><p class="empty">' + esc(err.message) + "</p></div>";
    });
  }

  function notFound() {
    return '<header class="screen-head"><h1>Not found</h1></header>' +
      '<div class="card empty-card"><p>That screen does not exist.</p>' +
      '<a class="btn btn-primary" href="#/log">Go to the log</a></div>';
  }

  /* ---------------------------------------------------------------- Router */

  var ROUTES = [
    { re: /^#\/log\/([\w-]+)$/, render: function (m) { return viewForm(m[1]); }, wire: function (m) { wireForm(m[1]); }, tab: "log" },
    { re: /^#\/log$/, render: viewLogMenu, tab: "log" },
    { re: /^#\/pbs$/, render: viewPBs, tab: "pbs" },
    { re: /^#\/activity\/([\w-]+)$/, render: function (m) { return viewActivity(m[1]); }, tab: "pbs" },
    { re: /^#\/score$/, render: viewScore, tab: "score" },
    { re: /^#\/history$/, render: viewHistory, tab: "history" },
    { re: /^#\/edit\/([\w-]+)$/, render: function (m) { return viewEdit(m[1]); }, wire: wireEdit, tab: "pbs" },
    { re: /^#\/coach$/, render: viewCoach, wire: wireCoach, tab: "" },
    { re: /^#\/coach\/([\w-]+)$/, render: viewAthlete, wire: wireAthlete, tab: "" },
    { re: /^#\/welcome$/, render: viewWelcome, wire: wireWelcome, tab: "" },
    { re: /^#\/data$/, render: viewData, wire: function (m) { wireData(m); wireSync(); }, tab: "" }
  ];

  function render() {
    var hash = location.hash || "#/log";
    var route = null, match = null;
    for (var i = 0; i < ROUTES.length; i++) {
      match = hash.match(ROUTES[i].re);
      if (match) { route = ROUTES[i]; break; }
    }
    if (!route) { view.innerHTML = notFound(); return; }

    timerStopTicking(); // navigating away abandons a running timer cleanly
    view.innerHTML = route.render(match);
    view.scrollTop = 0;
    window.scrollTo(0, 0);
    if (route.wire) route.wire(match);

    [].forEach.call(document.querySelectorAll(".tab"), function (t) {
      var on = t.getAttribute("data-tab") === route.tab;
      t.classList.toggle("on", on);
      if (on) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current");
    });
  }

  function paintHeader() {
    var o = PB.score.overall();
    var name = PB.store.athlete().name;
    document.getElementById("header-name").textContent = name ? name : "Hyrox Tracker";
    document.getElementById("header-score").textContent = o.score == null ? "—" : o.score;

    /* Top-right button: says what it does. Signed out it is the way in;
     * signed in it is the settings screen. */
    var corner = document.getElementById("header-gear");
    if (corner) {
      var st = PB.sync.status();
      if (st.configured && !st.signedIn) {
        corner.className = "head-gear head-signin";
        corner.setAttribute("href", "#/welcome");
        corner.setAttribute("aria-label", "Sign in");
        corner.textContent = "Sign in";
      } else {
        corner.className = "head-gear";
        corner.setAttribute("href", "#/data");
        corner.setAttribute("aria-label", "Settings, data and backup");
        corner.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/>' +
          '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
      }
    }
  }

  function start() {
    view = document.getElementById("view");
    toastEl = document.getElementById("toast");
    PB.sync.handleRedirect();
    if (!location.hash) location.hash = "#/log";
    /* Fresh device, sync available, never been asked: the front door is the
     * sign-in screen. Anyone who chose "use without an account" is not asked
     * again, and a direct link to a specific screen is respected. */
    var st0 = PB.sync.status();
    if (st0.configured && !st0.signedIn && !PB.store.athlete().welcomeDone &&
      (location.hash === "#/log" || location.hash === "#/")) {
      location.hash = "#/welcome";
    }
    window.addEventListener("hashchange", render);
    wireDeletes();
    PB.store.onChange(paintHeader);
    PB.store.onChange(function () {
      // only schedule an upload when there is actually something to send —
      // sync's own bookkeeping also lands here and must not re-trigger it
      if (PB.sync.status().pending > 0) PB.sync.syncSoon();
    });
    PB.sync.onStatus(function (st) {
      var line = document.getElementById("sync-status-line");
      if (line) line.textContent = syncStatusLine(st);
    });
    PB.store.requestPersistence();
    if (PB.sync.signedIn()) {
      PB.sync.syncNow().then(function () { render(); }, function () {});
    }
    paintHeader();
    render();

    if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
      navigator.serviceWorker.register("sw.js").catch(function () { /* offline support is a bonus */ });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(window.PB = window.PB || {});

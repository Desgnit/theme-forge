/* Local data store. Everything lives in this browser's localStorage — no
 * account, no server, works with the phone in aeroplane mode in a gym
 * basement. Export from the Data screen is the backup. */
(function (PB) {
  "use strict";

  var KEY = "pbtracker.v1";
  var state = null;
  var listeners = [];

  function blank() {
    return { version: 2, athlete: { name: "", planStart: "2026-09-07" }, entries: [], sync: {} };
  }

  function now() { return new Date().toISOString(); }

  /* Entries carry an `updated` stamp and deletes are tombstones rather than
   * removals, so two devices can be reconciled without either losing a
   * deletion. Everything that reads entries goes through live(). */
  function migrate(st) {
    if (!st.entries) st.entries = [];
    if (!st.athlete) st.athlete = { name: "" };
    if (st.athlete.planStart === undefined) st.athlete.planStart = "2026-09-07";
    if (!st.sync) st.sync = {};
    st.entries.forEach(function (e) {
      if (!e.updated) e.updated = new Date(e.date + "T12:00:00").toISOString();
      if (e.deleted === undefined) e.deleted = false;
    });
    st.version = 2;
    return st;
  }

  function live() {
    return load().entries.filter(function (e) { return !e.deleted; });
  }

  function load() {
    if (state) return state;
    try {
      var raw = localStorage.getItem(KEY);
      state = raw ? JSON.parse(raw) : blank();
    } catch (e) {
      state = blank();
    }
    migrate(state);
    return state;
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      alert("Could not save — this browser's storage is full or blocked.");
    }
    listeners.forEach(function (fn) { fn(); });
  }

  function onChange(fn) { listeners.push(fn); }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* Best-first ordering: better value wins, and an equal value set earlier
   * outranks the same value set later — you got there first. */
  function rankSort(metric) {
    var sign = metric.better === "lower" ? 1 : -1;
    return function (a, b) {
      if (a.value !== b.value) return sign * (a.value - b.value);
      return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
    };
  }

  function entriesFor(metricId) {
    return live()
      .filter(function (e) { return e.metric === metricId; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  /* Entries for a metric, best first. */
  function ranked(metricId) {
    return entriesFor(metricId).slice().sort(rankSort(PB.metric(metricId)));
  }

  function best(metricId) { return ranked(metricId)[0] || null; }

  /* 1, 2, 3 for the medal positions, 0 for everything else. */
  function medal(entry) {
    var pos = ranked(entry.metric).findIndex(function (e) { return e.id === entry.id; });
    return pos >= 0 && pos < 3 ? pos + 1 : 0;
  }

  function isBetter(metric, a, b) {
    if (b == null) return true;
    return metric.better === "lower" ? a < b : a > b;
  }

  /* Writes one logged session. values is {metricId: number}. Returns the list
   * of metric ids that became a new personal best. */
  function addSession(values, date, note) {
    var st = load();
    var session = uid();
    var prs = [];
    Object.keys(values).forEach(function (metricId) {
      var v = values[metricId];
      if (v == null || isNaN(v)) return;
      var metric = PB.metric(metricId);
      var previous = best(metricId);
      if (isBetter(metric, v, previous && previous.value)) prs.push(metricId);
      st.entries.push({
        id: uid(), session: session, metric: metricId,
        value: v, date: date, note: note || "", updated: now(), deleted: false
      });
    });
    save();
    return { session: session, prs: prs };
  }

  function updateEntry(id, value, date, note) {
    var e = load().entries.filter(function (x) { return x.id === id; })[0];
    if (!e) return false;
    e.value = value;
    e.date = date;
    e.note = note || "";
    e.updated = now();
    save();
    return true;
  }

  function deleteEntry(id) {
    load().entries.forEach(function (e) {
      if (e.id === id) { e.deleted = true; e.updated = now(); }
    });
    save();
  }

  /* Deletes every metric written by one trip to the log screen — a 5km run
   * and its splits go together. */
  function deleteSession(session) {
    load().entries.forEach(function (e) {
      if (e.session === session) { e.deleted = true; e.updated = now(); }
    });
    save();
  }

  /* Newest sessions first, grouped, for the activity feed. */
  function recentSessions(limit) {
    var groups = {};
    live().forEach(function (e) {
      var g = groups[e.session] || (groups[e.session] = { session: e.session, date: e.date, note: e.note, entries: [] });
      g.entries.push(e);
      if (e.note && !g.note) g.note = e.note;
    });
    return Object.keys(groups).map(function (k) { return groups[k]; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? 1 : -1;
        return a.session < b.session ? 1 : -1;
      })
      .slice(0, limit || 50);
  }

  function totalEntries() { return live().length; }

  function athlete() { return load().athlete; }

  function setName(name) {
    load().athlete.name = name;
    save();
  }

  /* The date the training plan begins. Everything logged before it is the
   * baseline; clear it and the plan features simply disappear. */
  function setPlanStart(date) {
    load().athlete.planStart = /^\d{4}-\d{2}-\d{2}$/.test(date || "") ? date : "";
    save();
  }

  /* True once the person has been through the first-run sign-in screen —
   * by signing in or by choosing to carry on without an account. It is a
   * "seen it" flag, so signing out later does not bring the screen back. */
  function setWelcomeDone(done) {
    load().athlete.welcomeDone = !!done;
    save();
  }

  function exportJSON() {
    return JSON.stringify(load(), null, 2);
  }

  /* Merge keeps both sets and drops exact duplicates; replace overwrites. */
  function importJSON(text, mode) {
    var data = JSON.parse(text);
    if (!data || !Array.isArray(data.entries)) throw new Error("Not a tracker backup file.");
    var clean = data.entries.filter(function (e) {
      return e && PB.metric(e.metric) && typeof e.value === "number" && /^\d{4}-\d{2}-\d{2}$/.test(e.date);
    }).map(function (e) {
      return {
        id: e.id || uid(), session: e.session || uid(), metric: e.metric,
        value: e.value, date: e.date, note: e.note || "",
        updated: e.updated || now(), deleted: !!e.deleted
      };
    });
    var st = load();
    if (mode === "replace") {
      st.entries = clean;
    } else {
      var seen = {};
      st.entries.forEach(function (e) { seen[e.metric + "|" + e.date + "|" + e.value] = true; });
      clean.forEach(function (e) {
        var k = e.metric + "|" + e.date + "|" + e.value;
        if (e.deleted || seen[k]) return;
        seen[k] = true;
        st.entries.push(e);
      });
    }
    if (data.athlete && data.athlete.name && !st.athlete.name) st.athlete.name = data.athlete.name;
    save();
    return clean.length;
  }

  /* Ask the browser not to evict this data when storage runs low. Silent
   * where unsupported — the entries still save either way. */
  function requestPersistence() {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(function (already) {
        if (!already) navigator.storage.persist();
      }).catch(function () {});
    }
  }

  function storageReport(cb) {
    var out = { persisted: null, usageKB: Math.round(JSON.stringify(load()).length / 1024 * 10) / 10 };
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(function (p) { out.persisted = p; cb(out); }, function () { cb(out); });
    } else cb(out);
  }

  function clearAll() {
    state = blank();
    save();
  }

  /* --- the hooks the sync layer needs ------------------------------------ */

  /* Everything changed since a timestamp, tombstones included. */
  function changedSince(iso) {
    return load().entries.filter(function (e) { return !iso || e.updated > iso; });
  }

  /* Applies rows from elsewhere. Last write wins, compared on `updated`, so
   * the same rows can be applied twice with no effect. Returns how many
   * actually changed anything. */
  function applyRemote(rows) {
    var st = load();
    var byId = {};
    st.entries.forEach(function (e) { byId[e.id] = e; });
    var changed = 0;
    rows.forEach(function (r) {
      if (!r || !r.id || !PB.metric(r.metric)) return;
      var incoming = {
        id: r.id, session: r.session || r.id, metric: r.metric,
        value: Number(r.value), date: r.date, note: r.note || "",
        updated: r.updated, deleted: !!r.deleted
      };
      if (isNaN(incoming.value) || !/^\d{4}-\d{2}-\d{2}$/.test(incoming.date)) return;
      var mine = byId[r.id];
      if (!mine) { st.entries.push(incoming); byId[r.id] = incoming; changed++; return; }
      if (incoming.updated > mine.updated) {
        Object.keys(incoming).forEach(function (k) { mine[k] = incoming[k]; });
        changed++;
      }
    });
    if (changed) save();
    return changed;
  }

  function syncState() { return load().sync; }

  function setSyncState(patch) {
    var sync = load().sync;
    Object.keys(patch).forEach(function (k) {
      if (patch[k] === null) delete sync[k]; else sync[k] = patch[k];
    });
    save();
  }

  PB.store = {
    load: load, save: save, onChange: onChange,
    entriesFor: entriesFor, ranked: ranked, best: best, medal: medal,
    addSession: addSession, updateEntry: updateEntry,
    deleteEntry: deleteEntry, deleteSession: deleteSession,
    recentSessions: recentSessions, totalEntries: totalEntries,
    athlete: athlete, setName: setName, setPlanStart: setPlanStart,
    setWelcomeDone: setWelcomeDone,
    exportJSON: exportJSON, importJSON: importJSON, clearAll: clearAll,
    requestPersistence: requestPersistence, storageReport: storageReport,
    changedSince: changedSince, applyRemote: applyRemote,
    syncState: syncState, setSyncState: setSyncState, live: live,
    isBetter: isBetter
  };
})(window.PB = window.PB || {});

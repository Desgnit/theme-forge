/* Cloud sync against a Supabase project.
 *
 * Plain fetch against Supabase's REST and auth endpoints — no SDK, so the
 * app stays a handful of small files with nothing to build. The app remains
 * local-first: every screen reads localStorage, and this file reconciles
 * that store with the `entries` table when it can. Offline it simply stays
 * quiet and catches up next time.
 *
 * Reconciliation: rows carry the writing device's `updated` stamp and the
 * newest write wins, on the server (a trigger discards stale updates) and
 * locally (applyRemote does the same), so sync order cannot resurrect a
 * deleted entry or undo a newer edit. Pulls are watermarked on the server's
 * own clock (server_updated), so a device with a wrong clock can lose a
 * conflict but can never be skipped over.
 *
 * Security lives in the database, not here: the anon key in this file's
 * config is public by design, and row-level security ties every row to the
 * signed-in user, with read-only access for a linked coach. See
 * supabase/schema.sql. */
(function (PB) {
  "use strict";

  var listeners = [];
  var timer = null;
  var busy = false;

  function st() { return PB.store.syncState(); }

  function emit() { listeners.forEach(function (fn) { fn(status()); }); }

  function config() {
    var s = st();
    return s.url && s.anonKey ? { url: s.url, anonKey: s.anonKey } : null;
  }

  function setConfig(url, anonKey) {
    url = String(url || "").trim().replace(/\/+$/, "");
    anonKey = String(anonKey || "").trim();
    if (!/^https:\/\/[\w.-]+$/.test(url)) throw new Error("That does not look like a project URL (https://xxxx.supabase.co).");
    if (anonKey.split(".").length !== 3) throw new Error("That does not look like an anon key.");
    PB.store.setSyncState({ url: url, anonKey: anonKey, lastError: null });
    emit();
  }

  function disconnect() {
    PB.store.setSyncState({
      url: null, anonKey: null, access: null, refresh: null, exp: null,
      userId: null, email: null, lastPull: null, lastPush: null, lastSync: null, lastError: null
    });
    emit();
  }

  function signedIn() {
    var s = st();
    return s.userId ? { userId: s.userId, email: s.email } : null;
  }

  /* --------------------------------------------------------------- fetch */

  function req(path, opts) {
    var c = config();
    if (!c) return Promise.reject(new Error("Sync is not set up yet."));
    opts = opts || {};
    var headers = { apikey: c.anonKey, "Content-Type": "application/json" };
    if (opts.auth !== false && st().access) headers.Authorization = "Bearer " + st().access;
    Object.keys(opts.headers || {}).forEach(function (k) { headers[k] = opts.headers[k]; });
    return fetch(c.url + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (res) {
      if (res.status === 204) return null;
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON error body */ }
        if (!res.ok) {
          var msg = (data && (data.msg || data.message || data.error_description || data.hint)) ||
            ("The server said no (" + res.status + ").");
          var err = new Error(msg);
          err.status = res.status;
          throw err;
        }
        return data;
      });
    });
  }

  /* Runs a request with a fresh token, refreshing once if it is stale. */
  function authed(path, opts) {
    var s = st();
    if (!s.userId) return Promise.reject(new Error("Sign in first."));
    var stale = !s.exp || Date.now() / 1000 > s.exp - 60;
    var ready = stale ? refreshToken() : Promise.resolve();
    return ready.then(function () { return req(path, opts); }).then(null, function (err) {
      if (err && err.status === 401) {
        return refreshToken().then(function () { return req(path, opts); });
      }
      throw err;
    });
  }

  /* ---------------------------------------------------------------- auth */

  function jwtPayload(token) {
    try {
      var body = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(body));
    } catch (e) { return {}; }
  }

  function keepSession(data) {
    var payload = jwtPayload(data.access_token);
    PB.store.setSyncState({
      access: data.access_token,
      refresh: data.refresh_token,
      exp: payload.exp || (Date.now() / 1000 + (data.expires_in || 3600)),
      userId: (data.user && data.user.id) || payload.sub,
      email: (data.user && data.user.email) || payload.email || "",
      lastError: null
    });
    emit();
  }

  function requestCode(email) {
    return req("/auth/v1/otp", { method: "POST", auth: false, body: { email: email, create_user: true } });
  }

  function verifyCode(email, code) {
    return req("/auth/v1/verify", {
      method: "POST", auth: false,
      body: { type: "email", email: email, token: String(code).trim() }
    }).then(function (data) {
      keepSession(data);
      return syncNow();
    });
  }

  /* A magic-link click lands back on the app with tokens in the URL hash.
   * Call before the router reads the hash. Returns true when it signed in. */
  function handleRedirect() {
    var h = location.hash || "";
    if (h.indexOf("access_token=") < 0) return false;
    var params = {};
    h.replace(/^#\/?/, "").split("&").forEach(function (pair) {
      var kv = pair.split("=");
      params[kv[0]] = decodeURIComponent(kv[1] || "");
    });
    if (!params.access_token || !config()) return false;
    keepSession({ access_token: params.access_token, refresh_token: params.refresh_token, expires_in: params.expires_in });
    location.hash = "#/data";
    syncSoon();
    return true;
  }

  function refreshToken() {
    var s = st();
    if (!s.refresh) return Promise.reject(new Error("Signed out."));
    return req("/auth/v1/token?grant_type=refresh_token", {
      method: "POST", auth: false, body: { refresh_token: s.refresh }
    }).then(keepSession, function (err) {
      if (err && (err.status === 400 || err.status === 401 || err.status === 403)) {
        PB.store.setSyncState({ access: null, refresh: null, exp: null, userId: null, email: null });
        emit();
        throw new Error("Your sign-in expired — sign in again.");
      }
      throw err;
    });
  }

  function signOut() {
    PB.store.setSyncState({
      access: null, refresh: null, exp: null, userId: null, email: null,
      lastPull: null, lastPush: null, lastSync: null, lastError: null
    });
    emit();
  }

  /* ---------------------------------------------------------------- sync */

  function pull() {
    var s = st();
    var q = "/rest/v1/entries?select=id,session,metric,value,date,note,updated,deleted,server_updated" +
      "&user_id=eq." + s.userId + "&order=server_updated.asc&limit=1000";
    if (s.lastPull) q += "&server_updated=gt." + encodeURIComponent(s.lastPull);
    return authed(q).then(function (rows) {
      rows = rows || [];
      var applied = PB.store.applyRemote(rows);
      if (rows.length) {
        PB.store.setSyncState({ lastPull: rows[rows.length - 1].server_updated });
      }
      // a full page means there is more where that came from
      return rows.length === 1000 ? pull().then(function (n) { return applied + n; }) : applied;
    });
  }

  function push() {
    var s = st();
    var rows = PB.store.changedSince(s.lastPush).map(function (e) {
      return {
        id: e.id, user_id: s.userId, session: e.session, metric: e.metric,
        value: e.value, date: e.date, note: e.note, updated: e.updated, deleted: e.deleted
      };
    });
    if (!rows.length) return Promise.resolve(0);
    var mark = new Date().toISOString();
    return authed("/rest/v1/entries", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: rows
    }).then(function () {
      PB.store.setSyncState({ lastPush: mark });
      return rows.length;
    });
  }

  function syncNow() {
    if (!config() || !signedIn()) return Promise.resolve(null);
    if (busy) return Promise.resolve(null);
    busy = true;
    emit();
    return pull().then(function (pulled) {
      return push().then(function (pushed) {
        PB.store.setSyncState({ lastSync: new Date().toISOString(), lastError: null });
        busy = false;
        emit();
        return { pulled: pulled, pushed: pushed };
      });
    }).then(null, function (err) {
      busy = false;
      PB.store.setSyncState({ lastError: err.message || "Sync failed." });
      emit();
      throw err;
    });
  }

  /* Batches the burst of saves a logging session makes into one sync. */
  function syncSoon() {
    if (!config() || !signedIn()) return;
    clearTimeout(timer);
    timer = setTimeout(function () {
      syncNow().then(null, function () { /* status already carries the error */ });
    }, 2500);
  }

  function status() {
    var s = st();
    return {
      configured: !!config(),
      signedIn: !!s.userId,
      email: s.email || "",
      busy: busy,
      lastSync: s.lastSync || null,
      pending: config() && s.userId ? PB.store.changedSince(s.lastPush).length : 0,
      lastError: s.lastError || null
    };
  }

  /* --------------------------------------------------------------- coach */

  function inviteCode() {
    var abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    var out = "";
    for (var i = 0; i < 8; i++) out += abc[Math.floor(Math.random() * abc.length)];
    return out.slice(0, 4) + "-" + out.slice(4);
  }

  /* The athlete mints a code; whoever redeems it becomes a read-only coach. */
  function createInvite() {
    var code = inviteCode();
    return authed("/rest/v1/coach_invites", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: { code: code, athlete_id: st().userId }
    }).then(function () { return code; });
  }

  function redeemInvite(code) {
    return authed("/rest/v1/rpc/redeem_coach_invite", {
      method: "POST",
      body: { invite_code: String(code).trim().toUpperCase() }
    });
  }

  function myCoaches() {
    return authed("/rest/v1/coach_links?select=coach_id&athlete_id=eq." + st().userId)
      .then(function (links) { return withNames(links || [], "coach_id"); });
  }

  function myAthletes() {
    return authed("/rest/v1/coach_links?select=athlete_id&coach_id=eq." + st().userId)
      .then(function (links) { return withNames(links || [], "athlete_id"); });
  }

  function withNames(links, key) {
    if (!links.length) return Promise.resolve([]);
    var ids = links.map(function (l) { return l[key]; });
    return authed("/rest/v1/profiles?select=id,name&id=in.(" + ids.join(",") + ")")
      .then(function (profiles) {
        var names = {};
        (profiles || []).forEach(function (p) { names[p.id] = p.name; });
        return ids.map(function (id) { return { id: id, name: names[id] || "Unnamed athlete" }; });
      });
  }

  function dropCoach(coachId) {
    return authed("/rest/v1/coach_links?coach_id=eq." + coachId + "&athlete_id=eq." + st().userId,
      { method: "DELETE", headers: { Prefer: "return=minimal" } });
  }

  function athleteEntries(athleteId) {
    return authed("/rest/v1/entries?select=metric,value,date,note,updated,deleted" +
      "&user_id=eq." + athleteId + "&deleted=eq.false&order=date.asc&limit=5000");
  }

  /* The signed-in user's display name, mirrored for coaches to see. */
  function pushProfile() {
    if (!config() || !signedIn()) return Promise.resolve();
    return authed("/rest/v1/profiles", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: { id: st().userId, name: PB.store.athlete().name || "" }
    });
  }

  PB.sync = {
    config: config, setConfig: setConfig, disconnect: disconnect,
    signedIn: signedIn, requestCode: requestCode, verifyCode: verifyCode,
    handleRedirect: handleRedirect, signOut: signOut,
    syncNow: syncNow, syncSoon: syncSoon, status: status,
    onStatus: function (fn) { listeners.push(fn); },
    createInvite: createInvite, redeemInvite: redeemInvite,
    myCoaches: myCoaches, myAthletes: myAthletes, dropCoach: dropCoach,
    athleteEntries: athleteEntries, pushProfile: pushProfile
  };
})(window.PB = window.PB || {});

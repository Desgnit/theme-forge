/* Offline shell. The app is a handful of static files and all data lives in
 * localStorage, so caching the shell is enough to make the whole thing work
 * with no signal — which is the normal state of affairs in a gym. */
var CACHE = "pb-tracker-v3";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/css/app.css",
  "./assets/js/art.js",
  "./assets/js/data.js",
  "./assets/js/format.js",
  "./assets/js/store.js",
  "./assets/js/score.js",
  "./assets/js/config.js",
  "./assets/js/sync.js",
  "./assets/js/chart.js",
  "./assets/js/app.js",
  "./assets/img/favicon.svg",
  "./assets/img/icon-192.png",
  "./assets/img/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () {
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

/* Network first so a redeploy is picked up, cache as the fallback. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || e.request.url.indexOf("http") !== 0) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, copy); }).catch(function () {});
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match("./index.html");
      });
    })
  );
});

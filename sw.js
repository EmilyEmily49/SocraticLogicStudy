// Offline cache. Bump VERSION whenever app files change.
const VERSION = "sls-v7";
const FILES = ["./", "index.html", "css/styles.css", "js/data.js", "js/logic.js", "js/cast.js", "js/score.js", "js/goose.js", "js/firebase-config.js", "js/backend.js", "js/app.js", "manifest.json",
  "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// Network first (so updates arrive), falling back to cache when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Only cache the app itself, Google Fonts, and the Firebase SDK files — never live account/database traffic.
  const cacheable = url.origin === location.origin || /(^|\.)(gstatic|googleapis)\.com$/.test(url.hostname) && !/firestore|identitytoolkit|securetoken/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(
    fetch(e.request).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});

/* Offline cache for the app shell.
   Bump CACHE when you ship new data files so clients pick them up. */
const CACHE = "kwizlocal-v3";

/* Workers Static Assets answers /index.html with a 307 to /, and a redirect
   inside cache.addAll can abort the whole install. "./" alone is enough —
   every static host we target serves index.html at the root. */
const ASSETS = [
  "./",
  "./styles.css",
  "./data.js",
  "./deep.js",
  "./vocab.js",
  "./verbs.js",
  "./sentences.js",
  "./engine.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) {
        return caches.delete(k);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Cache-first for our own files, network-first fallback for everything else.
   A hash route never hits the network, so this stays fast offline. */
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match("./");
      });
    })
  );
});

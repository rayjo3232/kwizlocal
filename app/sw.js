/* Offline cache for the app shell.

   Bump CACHE on every release. The name is the only thing that makes the
   browser treat the new files as new — without a bump, cache-first would
   serve the previous build forever. */

const CACHE = "kwizlocal-v30-mastery";

/* Workers Static Assets answers /index.html with a 307 to /, and a redirect
   inside cache.addAll can abort the whole install. "./" alone is enough —
   every static host we target serves index.html at the root. */
const ASSETS = [
  "./",
  "./styles.css",
  "./data.js",
  "./extra.js",
  "./deep.js",
  "./zh.js",
  "./vocab.js",
  "./gloss.js",
  "./distract.js",
  "./verbs.js",
  "./sentences.js",
  "./curriculum.js",
  "./answer-matcher.js",
  "./engine.js",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./fonts/InterVariable.woff2",
  "./fonts/Lora-Regular-subset-latin-latin-extended.woff2",
  "./fonts/Lora-Italic-subset-latin-latin-extended.woff2",
  "./fonts/Lora-Bold-subset-latin-latin-extended.woff2",
  "./fonts/Poppins-Bold.woff2",
  "./fonts/Poppins-ExtraBold.woff2"
];

let cachePromise = null;

/* Open once. Every read must go through this handle rather than the global
   caches.match(), which searches every cache bucket on the origin — including
   the previous version's, which is exactly how a stale app.js survives an
   update. */
function currentCache() {
  if (!cachePromise) cachePromise = caches.open(CACHE);
  return cachePromise;
}

self.addEventListener("install", function (e) {
  e.waitUntil(
    currentCache().then(function (c) {
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
    }).then(function () {
      /* Tell open pages a new build is live so they can reload themselves. */
      return self.clients.matchAll({ type: "window" });
    }).then(function (clients) {
      clients.forEach(function (client) {
        client.postMessage({ type: "SW_UPDATED", version: CACHE });
      });
    })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  const isShell = e.request.mode === "navigate" ||
    url.pathname === "/" ||
    url.pathname.endsWith(".html");

  if (isShell) {
    /* Network-first for the HTML shell: while online you always get the
       current index.html, which is what points at the current app.js. */
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.status === 200) {
          const copy = res.clone();
          currentCache().then(function (c) { c.put("./", copy); });
        }
        return res;
      }).catch(function () {
        return currentCache().then(function (c) {
          return c.match("./").then(function (hit) {
            return hit || c.match(e.request);
          });
        });
      })
    );
    return;
  }

  /* Cache-first for everything else — but only inside the current version. */
  e.respondWith(
    currentCache().then(function (c) {
      return c.match(e.request).then(function (hit) {
        if (hit) return hit;
        return fetch(e.request).then(function (res) {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            c.put(e.request, copy);
          }
          return res;
        });
      });
    })
  );
});

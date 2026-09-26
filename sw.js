// Harry Potter Book Club — offline service worker
// Precaches the app shell (page, manifest, icons, the five home-hero plates and
// the five house crests) so the app works offline after the first online visit.
// Cross-origin requests (Google Fonts, future audio streams) and audio/video
// files are never intercepted. On activate only caches whose name starts with
// 'hp-' are deleted: every joe-ray-sites app is served from this ONE origin, so
// a sibling app's caches must be left alone. Bump CACHE on every change (both
// copies: root sw.js and publish/sw.js must stay byte-identical).
const CACHE = 'hp-v6';
const PRECACHE = [
  "./",
  "index.html",
  "manifest.json",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/apple-touch-icon.png",
  "assets/hero-viaduct.webp",
  "assets/hero-gringotts.webp",
  "assets/hero-hogwarts-dusk.webp",
  "assets/hero-hogwarts-snow.webp",
  "assets/hero-ollivanders.webp",
  "assets/hero-feast.webp",
  "assets/hero-stairs.webp",
  "assets/hero-gryffindor-room.webp",
  "assets/hero-knight-bus.webp",
  "assets/hero-quidditch.webp",
  "assets/hero-ministry.webp",
  "assets/hero-requirement.webp",
  "assets/hero-cave.webp",
  "assets/hero-slytherin-room.webp",
  "assets/crest-hogwarts.webp",
  "assets/crest-gryffindor.webp",
  "assets/crest-hufflepuff.webp",
  "assets/crest-ravenclaw.webp",
  "assets/crest-slytherin.webp"
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      // per-URL add: a missing file (e.g. a crest not yet supplied) skips, it does not fail the install
      Promise.all(PRECACHE.map((url) =>
        cache.add(url).catch((err) => console.warn('[sw] precache skip', url, err))
      ))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith('hp-') && k !== CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // fonts, Drive audio: never intercepted
  if (/\.(mp3|m4a|mp4|webm|ogg|wav)$/i.test(url.pathname)) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') {
          return caches.match('index.html').then((page) => page || caches.match('./'));
        }
        return cached || Response.error();
      });
    })
  );
});

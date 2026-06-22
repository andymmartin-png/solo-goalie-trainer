// Minimal app-shell service worker for offline use + installability.
// Cache-first for same-origin assets, network-first for navigations so the
// app updates when online but still loads on the field without a connection.

const CACHE = 'sgt-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request('./', { cache: 'reload' })).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Network-first: fall back to the cached app shell when offline.
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Cache-first for static assets, populating the cache as we go.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});

/**
 * Elango Surfers — Service Worker
 * Caches all game assets for offline play.
 * Strategy: Cache-first for static assets, network-first for HTML.
 */

const CACHE_NAME = 'elango-surfers-v1';
const ASSET_BASE = self.registration ? self.registration.scope : './';

// Pre-cache list (relative to scope) — core shell files
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for static assets, network-first for HTML
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Skip cross-origin requests (Supabase API, etc.)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for navigation (HTML) — so users get updates when online
  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache a copy of the latest HTML
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./')))
    );
    return;
  }

  // Cache-first for everything else (JS, CSS, images, audio, fonts)
  event.respondWith(
    caches.match(req)
      .then((cached) => {
        if (cached) return cached;

        // Not in cache — fetch, cache, and return
        return fetch(req)
          .then((res) => {
            // Only cache successful responses
            if (!res || res.status !== 200 || res.type === 'opaque') return res;

            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            return res;
          })
          .catch(() => {
            // Offline and not cached — nothing we can do
            return cached;
          });
      })
  );
});
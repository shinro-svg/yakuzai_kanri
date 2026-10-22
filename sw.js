const CACHE_NAME = 'pharma-stock-pwa-v0914-config-cache-fix';
const APP_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './app-config.js?v=0914'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  // Keep the application shell network-first, including index.html, so new versions appear promptly.
  if (event.request.mode === 'navigate' || /index\.html$/.test(url.pathname)) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  // The config URL has a version query (app-config.js?v=0914), ensuring updates don't reuse a stale config.
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request, { cache: 'no-store' }).then(response => {
    const copy = response.clone();
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./app-config.js?v=0914').then(config => config || caches.match('./index.html')))));
});

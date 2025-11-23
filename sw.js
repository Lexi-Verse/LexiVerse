// sw.js - Minimal Service Worker to enable PWA Install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('lexiverse-store').then((cache) => cache.addAll([
      './index.html',
      './logotranslator.png',
    ])),
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request)),
  );
});
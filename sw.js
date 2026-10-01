// Service Worker для Полигон 3D v5 (Камера 360°)
const CACHE_NAME = 'poligon-3d-v5';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Always fetch fresh network copies in test environment
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});

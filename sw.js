// Service Worker для тестового полигона Survival Game Test
const CACHE_NAME = 'survival-test-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Network first for test environment to always get latest changes
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

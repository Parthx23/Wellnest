const CACHE_NAME = 'wellnest-v1';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/store.js',
  './js/router.js',
  './js/plant.js',
  './js/voice.js',
  './js/orbit.js',
  './js/pages/onboarding.js',
  './js/pages/dashboard.js',
  './js/pages/history.js',
  './js/pages/insights.js',
  './js/pages/settings.js',
  './manifest.json',
  './favicon.ico',
  './icons/0001-9118036015437569928.png',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          // Cache dynamic requests if they are valid GET requests
          if (event.request.method === 'GET' && event.request.url.startsWith('http')) {
            cache.put(event.request, fetchRes.clone());
          }
          return fetchRes;
        });
      });
    }).catch(() => {
      // Fallback to index.html for SPA navigation
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});

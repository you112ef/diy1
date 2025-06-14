const CACHE_NAME = 'my-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add other important static assets here, e.g., CSS, JS, main images
  // For now, we'll keep it minimal and let the runtime caching handle most things.
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event: Caches core assets.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event: Cleans up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Implements caching strategies.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    // Strategy: Network-first, then Cache for navigation requests (HTML pages)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful, clone the response, cache it, and return it
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve the request from the cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || new Response("You are offline and this page hasn't been cached.", {
              status: 404,
              statusText: "Offline Page Not Found",
              headers: {'Content-Type': 'text/plain'}
            });
          });
        })
    );
  } else if (
    event.request.destination === 'style' ||
    event.request.destination === 'script' ||
    event.request.destination === 'font' || // Added font
    event.request.destination === 'image'
  ) {
    // Strategy: Cache-first, then Network for static assets (CSS, JS, fonts, images)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // If fetched successfully, clone, cache, and return
          if (fetchResponse.ok) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        });
      })
    );
  } else {
    // Strategy: Network-first, then Cache for other requests (e.g., API calls, manifest)
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful and a GET request, clone, cache, and return
          // Avoid caching non-GET requests or responses that are not ok
          if (response.ok && event.request.method === 'GET') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache.
          // For API calls, this might return stale data, which may or may not be desired.
          return caches.match(event.request).then((cachedResponse) => {
            // If not in cache either, provide a generic offline response for non-document requests
            return cachedResponse || new Response(JSON.stringify({ error: "Offline and resource not available in cache" }), {
              status: 503, // Service Unavailable
              statusText: "Offline Resource Not Cached",
              headers: {'Content-Type': 'application/json'}
            });
          });
        })
    );
  }
});

const CACHE_NAME = 'bolt-app-cache-v1';
// Add essential assets that are unhashed or known paths.
// Dynamic assets (like Vite's hashed JS/CSS) require more advanced strategies (e.g., Workbox or build-time integration).
const urlsToCache = [
  '/',
  '/favicon.svg', // Example of a root asset
  // Consider adding main CSS/JS bundles if their names are predictable or use a tool to inject them.
  // For now, keeping it minimal.
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching initial assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache initial assets:', err);
      })
  );
});

self.addEventListener('activate', event => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated and old caches cleaned.');
      return self.clients.claim(); // Take control of all open clients
    })
  );
});

self.addEventListener('fetch', event => {
  // Network first, then cache for navigation requests.
  // Cache first for other requests.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If response is valid, cache it
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try to serve from cache
          return caches.match(event.request)
                   .then(response => response || caches.match('/')); // Fallback to root or an offline page
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // Not in cache - fetch from network
          return fetch(event.request).then(
            networkResponse => {
              // If response is valid, cache it
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            }
          ).catch(() => {
            // Network fetch failed, potentially return a fallback for specific asset types if needed
            // e.g., an offline image placeholder
          });
        })
    );
  }
});

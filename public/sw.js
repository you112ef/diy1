const CACHE_NAME = 'bolt-pwa-cache-v1';
// Important: These asset paths need to match your actual build output.
// '/css/app.css' and '/js/app.js' are placeholders.
// You might need to include specific hashes or full paths if your build system generates them.
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  // Placeholder: Replace with actual path to global CSS bundle if it exists
  // For Remix, CSS is often handled via links in app/root.tsx, which might be cached at runtime.
  // If you have a specific global bundle not covered by runtime caching, add it here.
  // '/css/app.css',
  // Placeholder: Replace with actual path to main JS bundle if it exists
  // Remix JS bundles are typically more complex and include hashes.
  // These are usually better handled by runtime caching or more sophisticated SW generation tools.
  // '/js/app.js'
];

// Install event: Precaching core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching core assets:', CORE_ASSETS);
        return cache.addAll(CORE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Precaching failed:', error);
      })
  );
});

// Activate event: Cache management (deleting old caches)
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Ensure new SW takes control immediately
});

// Fetch event: Serving from cache or network (Cache-first, then network with runtime caching)
self.addEventListener('fetch', (event) => {
  // We only want to handle GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse; // Return original response if it's not cacheable (e.g. opaque, error)
          }

          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              console.log('[Service Worker] Caching new asset:', event.request.url);
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        }).catch(error => {
          console.error('[Service Worker] Network fetch failed:', error, event.request.url);
          // Optionally, return a generic offline page here if you have one.
          // For now, just let the browser handle the error.
          // return new Response("Network error occurred", { status: 408, headers: { 'Content-Type': 'text/plain' } });
          throw error;
        });
      })
  );
});

const CACHE_NAME = 'elimuai-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/courses',
  '/api/user/profile',
  '/api/achievements',
  '/api/translations/en'
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network
  CACHE_FIRST: 'cache-first',
  // Network first, then cache
  NETWORK_FIRST: 'network-first',
  // Cache only
  CACHE_ONLY: 'cache-only',
  // Network only
  NETWORK_ONLY: 'network-only',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache critical API data
      caches.open(API_CACHE).then(async cache => {
        console.log('Caching API endpoints...');
        for (const endpoint of API_ENDPOINTS) {
          try {
            const response = await fetch(endpoint);
            if (response.ok) {
              await cache.put(endpoint, response);
            }
          } catch (error) {
            console.log(`Failed to cache ${endpoint}:`, error);
          }
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ success: false, message: 'You are offline' }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          event.waitUntil(updateCache(event.request));
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseClone));
            }
            return response;
          })
          .catch(() => {
            // If offline and requesting HTML, show offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Update cache in background
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response);
    }
  } catch (error) {
    // Network error, ignore
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'ElimuAI', options)
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background sync for offline actions (future feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Sync offline progress when back online
  console.log('ElimuAI: Syncing offline progress');
}

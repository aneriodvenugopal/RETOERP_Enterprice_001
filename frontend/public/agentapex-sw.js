// AgentApex Service Worker for PWA
const CACHE_NAME = 'agentapex-v1';
const OFFLINE_URL = '/agentapex';

// Assets to cache for offline use
const ASSETS_TO_CACHE = [
  '/agentapex',
  '/agentapex/',
  '/agentapex-manifest.json',
  '/agentapex-icon-192.png',
  '/agentapex-icon-512.png',
  '/agentapex-apple-touch-icon.png'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[AgentApex SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[AgentApex SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[AgentApex SW] Activating...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[AgentApex SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Only handle agentapex routes
  if (!event.request.url.includes('/agentapex') && 
      !event.request.url.includes('/api/agentapex')) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // For API requests - network only
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'No network connection' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // For page requests - network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache, return the offline page
          return caches.match(OFFLINE_URL);
        });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[AgentApex SW] Push received');
  
  let data = { title: 'AgentApex', body: 'New notification', icon: '/agentapex-icon-192.png' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message,
    icon: '/agentapex-icon-192.png',
    badge: '/agentapex-icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/agentapex',
      dateOfArrival: Date.now()
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'AgentApex', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[AgentApex SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/agentapex';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url.includes('/agentapex') && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[AgentApex SW] Service Worker loaded');

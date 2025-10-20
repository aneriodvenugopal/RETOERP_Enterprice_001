/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'retoerp-pwa-v1';
const urlsToCache = [
  '/',
  '/pwa/login',
  '/pwa/dashboard',
  '/pwa/notifications',
  '/pwa/profile',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
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
  
  self.clients.claim();
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            
            // Return offline page if available
            return caches.match('/pwa/offline');
          });
      })
  );
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  let notificationData = {
    title: 'RETOERP Notification',
    body: 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'retoerp-notification',
    requireInteraction: false,
    data: {
      url: '/pwa/notifications',
      timestamp: new Date().toISOString()
    }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        title: payload.title || notificationData.title,
        body: payload.message || payload.body || notificationData.body,
        icon: payload.icon || notificationData.icon,
        badge: notificationData.badge,
        tag: payload.tag || notificationData.tag,
        requireInteraction: payload.priority === 'high',
        data: {
          url: payload.action_url || '/pwa/notifications',
          notification_id: payload.id,
          type: payload.type,
          timestamp: new Date().toISOString()
        },
        actions: payload.actions || []
      };
    } catch (error) {
      console.error('[Service Worker] Failed to parse notification:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/pwa/dashboard';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync Handler (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncLeads());
  } else if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

// Helper: Sync Leads
async function syncLeads() {
  try {
    const cache = await caches.open('retoerp-offline-data');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/leads')) {
        const response = await cache.match(request);
        const data = await response.json();
        
        // Try to send to server
        await fetch(request.url, {
          method: request.method,
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Delete from cache after successful sync
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Helper: Sync Notifications
async function syncNotifications() {
  try {
    const response = await fetch('/api/in-app-notifications/unread-count');
    const data = await response.json();
    
    // Update badge
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(data.unread_count);
    }
  } catch (error) {
    console.error('[Service Worker] Notification sync failed:', error);
  }
}

// Message Handler (for communication with app)
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }
});

console.log('[Service Worker] Loaded successfully');

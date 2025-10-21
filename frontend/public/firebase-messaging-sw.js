// Firebase Cloud Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyC_REPLACE_WITH_YOUR_API_KEY",
  authDomain: "retoerp-REPLACE.firebaseapp.com",
  projectId: "retoerp-REPLACE",
  storageBucket: "retoerp-REPLACE.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:REPLACE"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification.title || 'RETOERP Notification';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'open' || !event.action) {
    // Open the app
    const urlToOpen = event.notification.data?.url || '/dashboard';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              client.focus();
              client.navigate(urlToOpen);
              return;
            }
          }
          // If app is not open, open new window
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

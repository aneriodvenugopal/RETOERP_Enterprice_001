import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import "@/styles/glassmorphism.css";
import App from "@/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any old service workers from different domains
      const registrations = await navigator.serviceWorker.getRegistrations();
      const currentOrigin = window.location.origin;
      
      for (const registration of registrations) {
        // If service worker is from a different domain (like old emergent domain), unregister it
        if (registration.scope && !registration.scope.startsWith(currentOrigin)) {
          console.log('Unregistering old service worker from different domain:', registration.scope);
          await registration.unregister();
        }
      }
      
      // Now register the new service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available, prompt user to refresh
            if (confirm('New version available! Reload to update?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });
    } catch (error) {
      console.log('Service Worker registration failed:', error);
      // Don't show error to user, just log it
    }
  });
  
  // Handle service worker controller change
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

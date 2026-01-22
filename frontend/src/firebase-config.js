// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase config for RealApex
const firebaseConfig = {
  apiKey: "AIzaSyBLdLj5EGwRxHbsCqEbngRWbEFn4RUHQdI",
  authDomain: "exlainerp-5ff78.firebaseapp.com",
  projectId: "exlainerp-5ff78",
  storageBucket: "exlainerp-5ff78.firebasestorage.app",
  messagingSenderId: "999459364917",
  appId: "1:999459364917:web:ab67804d48b20e288bd17c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging = null;

try {
  messaging = getMessaging(app);
} catch (error) {
  console.log('Firebase messaging not supported:', error);
}

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      
      // Get FCM token
      if (messaging) {
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
        });
        
        if (token) {
          console.log('FCM Token:', token);
          return token;
        } else {
          console.log('No registration token available');
          return null;
        }
      }
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        resolve(payload);
      });
    }
  });

export { messaging };

# Firebase Push Notifications Setup Guide

## Complete Implementation - Telugu & English

---

## Step 1: Create Firebase Project (5 minutes)

### 1.1 Go to Firebase Console
```
URL: https://console.firebase.google.com/
```

### 1.2 Create New Project
1. Click "Add Project"
2. Enter Project Name: **RETOERP**
3. Click Continue
4. Disable Google Analytics (optional for now)
5. Click "Create Project"
6. Wait 30 seconds
7. Click "Continue"

---

## Step 2: Register Web App (3 minutes)

### 2.1 Add Web App
1. On Firebase dashboard, click **Web icon** (</>)
2. App nickname: **RETOERP Web**
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"

### 2.2 Get Firebase Config
You'll see something like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-xxxxxxxxxxxxxxxxxxx",
  authDomain: "retoerp-xxxxx.firebaseapp.com",
  projectId: "retoerp-xxxxx",
  storageBucket: "retoerp-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

**COPY THIS - You'll need it!**

---

## Step 3: Enable Cloud Messaging (2 minutes)

### 3.1 Enable FCM
1. In Firebase Console, go to **Build** → **Cloud Messaging**
2. Click on **Web configuration**
3. Click **Generate key pair** under "Web Push certificates"
4. Copy the **VAPID Key** (starts with "B...")

**Example:**
```
BPxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 4: Update Frontend Code (5 minutes)

### 4.1 Update firebase-config.js

Open `/app/frontend/src/firebase-config.js` and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY_HERE",  // Replace
  authDomain: "YOUR_AUTH_DOMAIN",      // Replace
  projectId: "YOUR_PROJECT_ID",        // Replace
  storageBucket: "YOUR_STORAGE_BUCKET", // Replace
  messagingSenderId: "YOUR_SENDER_ID", // Replace
  appId: "YOUR_APP_ID"                 // Replace
};
```

### 4.2 Update VAPID Key

In the same file, find:

```javascript
vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE'
```

Replace with your actual VAPID key.

### 4.3 Update Service Worker

Open `/app/frontend/public/firebase-messaging-sw.js` and update the same config.

---

## Step 5: Install Firebase SDK (2 minutes)

```bash
cd /app/frontend
yarn add firebase
```

---

## Step 6: Test Notifications (5 minutes)

### 6.1 Restart Frontend
```bash
sudo supervisorctl restart frontend
```

### 6.2 Test in Browser
1. Open http://localhost:3000
2. Login to the app
3. Browser will ask: "Allow notifications?"
4. Click **Allow**
5. Check browser console - you should see FCM token

### 6.3 Send Test Notification

Go to Firebase Console:
1. **Build** → **Cloud Messaging**
2. Click **Send your first message**
3. Notification title: "Test Notification"
4. Notification text: "RETOERP is working!"
5. Click **Send test message**
6. Paste your FCM token (from browser console)
7. Click **Test**

You should receive the notification! ✅

---

## Step 7: Backend Integration (Already Done!)

The following are already implemented:

✅ `/api/notifications/save-fcm-token` - Save FCM tokens
✅ `notificationService.js` - Frontend service
✅ `firebase-messaging-sw.js` - Service worker
✅ Auto-initialize on login

---

## Usage in Your App

### Send Notification from Backend

```python
# Backend - routes/notifications.py

import requests

async def send_push_notification(user_id: str, title: str, body: str, data: dict = {}):
    """Send push notification to user"""
    
    db = request.app.state.db
    
    # Get user's FCM token
    user = await db.users.find_one({"id": user_id})
    
    if not user or not user.get('fcm_token'):
        return {"success": False, "reason": "No FCM token"}
    
    # Firebase Server Key (get from Firebase Console → Project Settings → Cloud Messaging)
    server_key = "YOUR_FIREBASE_SERVER_KEY"
    
    url = "https://fcm.googleapis.com/fcm/send"
    
    headers = {
        "Authorization": f"Bearer {server_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "to": user['fcm_token'],
        "notification": {
            "title": title,
            "body": body,
            "icon": "/icon-192.png",
            "click_action": "/"
        },
        "data": data
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    return response.json()

# Example usage:
await send_push_notification(
    user_id="user_123",
    title="New Booking!",
    body="Customer booked Plot #42",
    data={"url": "/bookings/123", "type": "booking"}
)
```

---

## Common Notification Triggers

### 1. New Lead
```python
@router.post("/leads")
async def create_lead(...):
    # ... create lead logic ...
    
    # Notify sales team
    await send_push_notification(
        sales_person_id,
        "New Lead Assigned",
        f"Lead from {lead_name} - {phone}",
        {"url": f"/leads/{lead_id}"}
    )
```

### 2. Payment Received
```python
@router.post("/payments")
async def record_payment(...):
    # ... payment logic ...
    
    # Notify admin
    await send_push_notification(
        admin_id,
        "Payment Received",
        f"₹{amount} from {customer_name}",
        {"url": f"/bookings/{booking_id}"}
    )
```

### 3. Booking Confirmation
```python
@router.post("/bookings")
async def create_booking(...):
    # ... booking logic ...
    
    # Notify customer
    await send_push_notification(
        customer_id,
        "Booking Confirmed!",
        f"Your booking for Plot #{plot_number} is confirmed",
        {"url": f"/customer/bookings/{booking_id}"}
    )
```

---

## Cost (FREE!)

```
Firebase Cloud Messaging:
- Messages: UNLIMITED and FREE
- Storage: 1GB free
- Bandwidth: 10GB/month free

No credit card required!
```

---

## Testing Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Cloud Messaging enabled
- [ ] VAPID key generated
- [ ] Frontend config updated
- [ ] Service worker updated
- [ ] Firebase SDK installed
- [ ] Frontend restarted
- [ ] Notification permission granted
- [ ] Test notification received
- [ ] FCM token saved in database
- [ ] Backend can send notifications

---

## Troubleshooting

### Issue 1: "Firebase not initialized"
**Solution:** Check firebase-config.js has correct credentials

### Issue 2: "Permission denied"
**Solution:** User needs to click "Allow" on notification prompt

### Issue 3: "No FCM token"
**Solution:** Check browser console for errors, ensure VAPID key is correct

### Issue 4: "Service worker not registered"
**Solution:** Clear browser cache, reload page

### Issue 5: "Notifications not showing"
**Solution:** 
- Check if browser supports notifications
- Check if site is on HTTPS (required for notifications)
- Check browser notification settings

---

## Production Deployment Notes

1. **HTTPS Required:** Notifications only work on HTTPS
2. **Service Worker:** Must be at `/firebase-messaging-sw.js`
3. **Permissions:** Ask users to enable notifications at right time
4. **Token Refresh:** FCM tokens can expire, handle token refresh
5. **Cross-Browser:** Test on Chrome, Firefox, Edge, Safari

---

## Browser Support

✅ **Chrome** (Desktop & Android): Full support
✅ **Firefox** (Desktop & Android): Full support
✅ **Edge** (Desktop): Full support
✅ **Opera** (Desktop & Android): Full support
✅ **Samsung Internet** (Android): Full support
❌ **Safari** (iOS): No support for web push (use native app)
✅ **Safari** (macOS): Limited support

---

## Next Steps

1. Complete Firebase setup (follow steps above)
2. Test notifications work
3. Implement notification triggers in your app:
   - New leads → Notify sales team
   - Payments → Notify admin
   - Bookings → Notify customer
   - OTP → Send via notification (FREE vs SMS ₹0.40)
4. Add notification preferences in user settings
5. Create notification history page

---

**ఈ setup complete అయిన తర్వాత, మీరు unlimited FREE notifications పంపించవచ్చు! SMS కంటే చాలా savings! 💰**

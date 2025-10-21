# Firebase Push Notifications Setup Guide

## Overview
The RETOERP application now has complete Firebase Cloud Messaging (FCM) integration for push notifications. This guide will help you set up Firebase for your application.

## Features Implemented

### Backend
- ✅ Firebase Admin SDK integrated
- ✅ Centralized notification service (`firebase_notification_service.py`)
- ✅ Send notifications to single user
- ✅ Send notifications to multiple users (multicast)
- ✅ Send notifications to topics (broadcast)
- ✅ Automatic in-app + push notification for all events
- ✅ Graceful fallback if Firebase not configured

### Frontend
- ✅ Firebase Web SDK configured (`firebase-config.js`)
- ✅ Service worker for background messages (`firebase-messaging-sw.js`)
- ✅ Notification service (`notificationService.js`)
- ✅ Auto-request permission and save FCM token
- ✅ Foreground message handling

### Notification Points
Push notifications are sent for:
1. **Referral Rewards** - When someone joins using your referral code
2. **Share Rewards** - When someone captures a lead from your shared content
3. **Resale Requests** - When customers request resale (to admins)
4. **Resale Approvals** - When admin approves resale (to customer & interested users)
5. **New Leads** - When a new lead is created
6. **Bookings** - When bookings are created/updated
7. **Project Updates** - Project-related notifications
8. **Customer Inquiries** - Contact form submissions

---

## Setup Instructions

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `retoerp` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

### Step 2: Add Web App to Firebase Project

1. In Firebase Console, click the **Web** icon `</>`
2. Register app with nickname: `RETOERP Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the Firebase config object** - you'll need this for frontend

### Step 3: Enable Cloud Messaging

1. In Firebase Console, go to **Build → Cloud Messaging**
2. Click on "Web configuration"
3. Under "Web Push certificates", click "Generate key pair"
4. **Copy the VAPID key** - you'll need this

### Step 4: Generate Service Account Key (for Backend)

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service accounts** tab
3. Click "Generate new private key"
4. Click "Generate key" - a JSON file will be downloaded
5. **Save this file securely** - this contains admin credentials

---

## Configuration

### Backend Configuration

**Option 1: Using JSON File (Recommended for Development)**

1. Save the downloaded service account JSON file to a secure location
2. Update `/app/backend/.env`:

```bash
FIREBASE_CREDENTIALS=/path/to/your/serviceAccountKey.json
```

**Option 2: Using JSON String (Recommended for Production)**

1. Open the downloaded service account JSON file
2. Copy the entire JSON content (one line)
3. Update `/app/backend/.env`:

```bash
FIREBASE_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

**Example `.env` file:**
```bash
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY=sk-emergent-xxxxx

# Firebase Admin SDK Credentials (choose one option)
FIREBASE_CREDENTIALS=/app/backend/firebase-service-account.json
# OR
# FIREBASE_CREDENTIALS={"type":"service_account","project_id":"retoerp-12345",...}
```

### Frontend Configuration

1. Open `/app/frontend/src/firebase-config.js`
2. Replace the placeholder config with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "retoerp-xxxxx.firebaseapp.com",
  projectId: "retoerp-xxxxx",
  storageBucket: "retoerp-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

3. Replace the VAPID key:

```javascript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_ACTUAL_VAPID_KEY_FROM_FIREBASE_CONSOLE'
});
```

### Service Worker Configuration

1. Open `/app/frontend/public/firebase-messaging-sw.js`
2. Update the Firebase config (same as above)

---

## Testing Push Notifications

### 1. Test Backend Service

You can test if Firebase is configured correctly:

```python
# In Python console
from services.firebase_notification_service import FirebaseNotificationService

# Check if Firebase is available
print(FirebaseNotificationService.is_available())
# Should print: True
```

### 2. Test Notification Sending

Login to the application and:

1. **Test Referral Notifications:**
   - Create a referral and complete it
   - Check if notification appears (both in-app and push)

2. **Test Share Notifications:**
   - Share an article
   - When someone captures a lead from your share, you'll get notification

3. **Test Resale Notifications:**
   - As customer, request a property resale
   - Admin will get notification
   - As admin, approve the resale
   - All interested users in that project will get notification

### 3. Test in Different Scenarios

**Test Browser Permission:**
- First visit → Browser asks for notification permission
- Grant permission → FCM token saved to database
- Check browser console → Should see "FCM Token: ..."

**Test Foreground Messages:**
- Keep browser open
- Trigger a notification event
- Should see toast notification

**Test Background Messages:**
- Close browser/tab
- Trigger a notification event
- Should see OS-level notification

---

## Troubleshooting

### Backend Issues

**Issue: "Firebase not configured. Skipping push notification."**
- Check if `FIREBASE_CREDENTIALS` is set in `.env`
- Verify the JSON file path or JSON string is correct
- Check backend logs for initialization errors

**Issue: Notifications not sending**
- Verify Firebase service account has Cloud Messaging permissions
- Check if users have `fcm_token` saved in database
- Review backend logs for detailed error messages

### Frontend Issues

**Issue: "Firebase messaging not supported"**
- Ensure HTTPS is enabled (required for service workers)
- Check if browser supports Web Push API
- Verify service worker is registered

**Issue: Permission denied**
- User manually blocked notifications
- Clear browser data and try again
- Check browser notification settings

**Issue: Token not saved**
- Check if Firebase config is correct
- Verify VAPID key is correct
- Check browser console for errors

---

## Production Deployment Checklist

- [ ] Firebase project created
- [ ] Service account key generated and secured
- [ ] Backend `.env` configured with credentials
- [ ] Frontend `firebase-config.js` updated with actual config
- [ ] VAPID key updated in frontend
- [ ] Service worker config updated
- [ ] HTTPS enabled (required for service workers)
- [ ] Test notifications in production environment
- [ ] Monitor Firebase usage and quotas
- [ ] Set up Firebase budget alerts

---

## Firebase Quotas (Free Tier - Spark Plan)

- **Cloud Messaging:** Unlimited messages
- **Cloud Firestore:** Not used in this implementation
- **Authentication:** Not used (using custom auth)
- **Storage:** Not used

The free tier is sufficient for development and moderate production use. For high-volume production, consider upgrading to Blaze plan.

---

## Security Best Practices

1. **Never commit service account JSON to git**
   - Add to `.gitignore`
   - Use environment variables in production

2. **Restrict service account permissions**
   - Only grant Cloud Messaging permissions
   - Use separate keys for dev/staging/prod

3. **Validate FCM tokens**
   - Tokens can expire - handle gracefully
   - Remove invalid tokens from database

4. **Rate limiting**
   - Implement rate limits on notification sending
   - Prevent spam/abuse

---

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com/)

For RETOERP implementation issues:
- Check backend logs: `tail -f /var/log/supervisor/backend.*.log`
- Check browser console for frontend errors
- Verify all configuration steps completed

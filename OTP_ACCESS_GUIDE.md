# OTP Access Guide for RETOERP

## How to Get Your OTP (Development Mode)

Since we're using **MOCK SMS provider** for development, the OTP is not sent to your actual phone. Here are **3 ways** to get your OTP:

---

## ✅ Method 1: ON-SCREEN DISPLAY (Easiest - Recommended)

After entering your phone number and clicking "Send OTP", the OTP will be **displayed on the screen** in a yellow box.

**Steps:**
1. Go to login page
2. Enter phone number
3. Click "Send OTP"
4. **Look for the yellow box** that appears
5. OTP will be shown in large numbers
6. Click "Click to auto-fill OTP" button to automatically fill it

**Screenshot Example:**
```
┌─────────────────────────────────────┐
│  🔧 Development Mode                │
│  Your OTP (in production, this      │
│  will be sent via SMS):             │
│                                      │
│  ┌───────────────────────────────┐ │
│  │        123456                  │ │
│  └───────────────────────────────┘ │
│                                      │
│  [Click to auto-fill OTP]          │
└─────────────────────────────────────┘
```

---

## ✅ Method 2: BROWSER CONSOLE (For Developers)

**Steps:**
1. Open login page
2. Press **F12** (or Right-click → Inspect)
3. Go to **Console** tab
4. Enter phone number and click "Send OTP"
5. Look for: `📱 [MOCK SMS] To: 9908290239`
6. OTP will be shown: `Message: Your RETOERP verification code is: 123456`

**Example Console Output:**
```
📱 [MOCK SMS] To: 9908290239
   Message: Your RETOERP verification code is: 123456. Valid for 10 minutes.
```

---

## ✅ Method 3: BACKEND LOGS (For Advanced Users)

**Steps:**
1. Open terminal/command prompt
2. Run: `tail -f /var/log/supervisor/backend.out.log`
3. Enter phone number on login page
4. Click "Send OTP"
5. Look for the same message in logs

**Example Terminal Output:**
```bash
$ tail -f /var/log/supervisor/backend.out.log
📱 [MOCK SMS] To: 9908290239
   Message: Your RETOERP verification code is: 123456. Valid for 10 minutes.
```

---

## 🚀 For Production (Real SMS)

When you're ready to go live with actual SMS delivery:

### Step 1: Get MSG91 API Credentials
1. Sign up at: https://msg91.com/
2. Get your **Auth Key** from dashboard
3. Create a **Sender ID** (e.g., "RETORP")

### Step 2: Update Backend .env File
```bash
# Open .env file
nano /app/backend/.env

# Add these lines:
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key_here
MSG91_SENDER_ID=RETORP

# Save and exit
```

### Step 3: Restart Backend
```bash
sudo supervisorctl restart backend
```

### Step 4: Test Real SMS
- Now OTP will be sent to actual phone numbers
- You'll receive SMS on your mobile
- No more mock messages in console

---

## 📧 Email OTP (Alternative Option)

If you want to receive OTP via email instead:

### Update the Login Flow:
1. We can add email-based OTP as an alternative
2. User enters email instead of phone
3. OTP sent to email inbox
4. Would you like me to implement this?

---

## Troubleshooting

### ❌ Not seeing OTP on screen?
- Make sure you're on the latest version
- Clear browser cache and refresh
- Check browser console for errors

### ❌ Console shows no message?
- Make sure backend is running: `sudo supervisorctl status backend`
- Check if you have console filters enabled (clear all filters)
- Look for any error messages in red

### ❌ OTP expired?
- OTP is valid for 10 minutes only
- Request a new OTP if expired
- Check system clock is correct

### ❌ Wrong OTP error?
- Make sure you copied the complete 6-digit code
- OTP is case-sensitive (though we only use numbers)
- Try requesting a new OTP

---

## Quick Test Example

Let's test with Tenant Admin:

1. **Go to:** http://localhost:3000/login
2. **Enter Phone:** 9908290239
3. **Click:** "Send OTP"
4. **See Yellow Box:** OTP displayed (e.g., 123456)
5. **Click:** "Click to auto-fill OTP" OR manually type it
6. **Click:** "Verify & Login"
7. **Success!** You're logged in as Tenant Admin

---

## Development vs Production

| Feature | Development (Now) | Production (Later) |
|---------|------------------|-------------------|
| SMS Provider | Mock (Console) | MSG91 (Real SMS) |
| OTP Display | On-screen + Console | Sent to phone only |
| Cost | Free | ~₹0.50-1 per SMS |
| Setup | Ready to use | Need API credentials |
| Testing | Instant | Requires real phone |

---

## Summary

**Easiest Way:** Just look at the screen after clicking "Send OTP" - the OTP will be displayed in a **yellow box**! You can even click a button to auto-fill it.

**For Production:** Update 3 lines in .env file with MSG91 credentials and restart backend.

Need help setting up real SMS? Let me know!

---

Last Updated: 2025
System: RETOERP

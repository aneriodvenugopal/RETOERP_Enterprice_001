# Google Calendar Integration - Setup Guide / సెటప్ గైడ్

## 🔧 Fix for "Connect Google" Button Issue

### **Problem / సమస్య:**
When you click "Connect Google" button, you see JSON text instead of Google login page.

మీరు "Connect Google" బటన్ క్లిక్ చేస్తే, Google login page బదులు JSON text కనిపిస్తుంది.

### **Cause / కారణం:**
Google OAuth credentials are not configured in backend.

Backend లో Google OAuth credentials configure చేయలేదు.

---

## ✅ Solution / పరిష్కారం

### **Step 1: Get Google OAuth Credentials**

#### **English Instructions:**

1. **Go to Google Cloud Console:**
   - Open: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create or Select Project:**
   - Click on project dropdown (top left)
   - Click "New Project"
   - Name: "RETOERP Calendar"
   - Click "Create"

3. **Enable APIs:**
   - Go to: **APIs & Services** → **Library**
   - Search "Google Calendar API"
   - Click on it → Click "Enable"
   - Go back and search "Google People API"
   - Click on it → Click "Enable"

4. **Create OAuth Credentials:**
   - Go to: **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS**
   - Select **OAuth client ID**
   
5. **Configure OAuth Consent Screen** (if first time):
   - Click "Configure Consent Screen"
   - Choose "External"
   - Fill in:
     - App name: RETOERP
     - User support email: your email
     - Developer email: your email
   - Click "Save and Continue"
   - Skip Scopes → Click "Save and Continue"
   - Skip Test Users → Click "Save and Continue"

6. **Create OAuth Client:**
   - Application type: **Web application**
   - Name: RETOERP Calendar Integration
   - **Authorized redirect URIs:**
     ```
     https://retoerp-1.preview.emergentagent.com/api/auth/google/callback
     ```
   - Click **CREATE**

7. **Copy Credentials:**
   - You'll see Client ID and Client Secret
   - **Copy both** - you'll need them next

---

#### **తెలుగు సూచనలు:**

1. **Google Cloud Console కి వెళ్ళండి:**
   - ఓపెన్ చేయండి: https://console.cloud.google.com/
   - మీ Google account తో sign in అవ్వండి

2. **Project Create చేయండి:**
   - Project dropdown (పైన ఎడమ వైపు) click చేయండి
   - "New Project" click చేయండి
   - Name: "RETOERP Calendar"
   - "Create" click చేయండి

3. **APIs Enable చేయండి:**
   - **APIs & Services** → **Library** కి వెళ్ళండి
   - "Google Calendar API" search చేయండి
   - దాన్ని click చేసి → "Enable" click చేయండి
   - వెనక్కి వెళ్లి "Google People API" search చేయండి
   - దాన్ని కూడా enable చేయండి

4. **OAuth Credentials Create చేయండి:**
   - **APIs & Services** → **Credentials** కి వెళ్ళండి
   - **+ CREATE CREDENTIALS** click చేయండి
   - **OAuth client ID** select చేయండి

5. **OAuth Consent Screen Configure చేయండి** (మొదటిసారి అయితే):
   - "Configure Consent Screen" click చేయండి
   - "External" choose చేయండి
   - Fill చేయండి:
     - App name: RETOERP
     - User support email: మీ email
     - Developer email: మీ email
   - "Save and Continue" click చేయండి
   - Scopes skip చేయండి → "Save and Continue"
   - Test Users skip చేయండి → "Save and Continue"

6. **OAuth Client Create చేయండి:**
   - Application type: **Web application**
   - Name: RETOERP Calendar Integration
   - **Authorized redirect URIs:**
     ```
     https://retoerp-1.preview.emergentagent.com/api/auth/google/callback
     ```
   - **CREATE** click చేయండి

7. **Credentials Copy చేయండి:**
   - మీకు Client ID మరియు Client Secret కనిపిస్తాయి
   - **రెండూ copy చేయండి** - తర్వాత అవసరం

---

### **Step 2: Add Credentials to Backend**

#### **English:**

1. **SSH/Terminal Access:**
   ```bash
   # Connect to your server
   cd /app/backend
   ```

2. **Edit .env file:**
   ```bash
   nano .env
   # or
   vi .env
   ```

3. **Find these lines:**
   ```
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   ```

4. **Replace with your credentials:**
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
   ```

5. **Save file:**
   - If using nano: Press `Ctrl+X`, then `Y`, then `Enter`
   - If using vi: Press `Esc`, type `:wq`, press `Enter`

6. **Restart Backend:**
   ```bash
   sudo supervisorctl restart backend
   ```

7. **Verify:**
   ```bash
   # Check if backend started successfully
   sudo supervisorctl status backend
   ```

---

#### **తెలుగు:**

1. **Server కి Connect అవ్వండి:**
   ```bash
   cd /app/backend
   ```

2. **.env file edit చేయండి:**
   ```bash
   nano .env
   ```

3. **ఈ lines find చేయండి:**
   ```
   GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
   ```

4. **మీ credentials తో replace చేయండి:**
   ```
   GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
   ```

5. **File save చేయండి:**
   - `Ctrl+X` press చేయండి
   - `Y` press చేయండి
   - `Enter` press చేయండి

6. **Backend Restart చేయండి:**
   ```bash
   sudo supervisorctl restart backend
   ```

---

### **Step 3: Test**

#### **English:**

1. **Login to RETOERP:**
   - Go to: https://retoerp-1.preview.emergentagent.com/login
   - Login with your credentials

2. **Go to Calendar Page:**
   - Navigate to: `/calendar`
   - Or type: `https://retoerp-1.preview.emergentagent.com/calendar`

3. **Connect Google:**
   - Click "Connect Google" button
   - You should see Google's login page (not JSON!)
   - Sign in with your Gmail account
   - Grant calendar permissions
   - You'll be redirected back to RETOERP

4. **Verify Connection:**
   - You should see "Google Connected" green badge
   - Blue banner should disappear
   - You can now schedule site visits!

---

#### **తెలుగు:**

1. **RETOERP కి Login అవ్వండి:**
   - వెళ్ళండి: https://retoerp-1.preview.emergentagent.com/login
   - మీ credentials తో login అవ్వండి

2. **Calendar Page కి వెళ్ళండి:**
   - `/calendar` కి navigate చేయండి
   - లేదా type చేయండి: `https://retoerp-1.preview.emergentagent.com/calendar`

3. **Google Connect చేయండి:**
   - "Connect Google" button click చేయండి
   - ఇప్పుడు Google login page కనిపించాలి (JSON కాదు!)
   - మీ Gmail account తో sign in అవ్వండి
   - Calendar permissions ఇవ్వండి
   - మీరు RETOERP కి redirect అవుతారు

4. **Connection Verify చేయండి:**
   - "Google Connected" green badge కనిపించాలి
   - Blue banner disappear అవుతుంది
   - ఇప్పుడు మీరు site visits schedule చేయవచ్చు!

---

## 🎯 What You Can Do After Setup

### **English:**

**Schedule Site Visit:**
1. Click on a lead or use schedule button
2. Fill in details:
   - Type: Site Visit
   - Date & Time
   - Duration
   - Notes
   - Check "Add Google Meet" for video
3. Click "Schedule Visit"

**Automatic Actions:**
- ✅ Event created in your Google Calendar
- ✅ Google Meet link generated
- ✅ Email invite sent to client
- ✅ Syncs to your phone
- ✅ Reminder set for 1 hour before

**View Scheduled Visits:**
- 🔴 Previous Leads - Overdue visits
- 🟡 Today's Leads - Today's schedule
- 🟢 Future Leads - Upcoming visits

---

### **తెలుగు:**

**Site Visit Schedule చేయడం:**
1. Lead మీద click చేయండి లేదా schedule button use చేయండి
2. Details fill చేయండి:
   - Type: Site Visit
   - Date & Time
   - Duration
   - Notes
   - Video కోసం "Add Google Meet" check చేయండి
3. "Schedule Visit" click చేయండి

**Automatic Actions:**
- ✅ మీ Google Calendar లో event create అవుతుంది
- ✅ Google Meet link generate అవుతుంది
- ✅ Client కి email invite వెళుతుంది
- ✅ మీ phone లో sync అవుతుంది
- ✅ 1 hour ముందు reminder set అవుతుంది

**Scheduled Visits చూడడం:**
- 🔴 Previous Leads - Overdue visits
- 🟡 Today's Leads - నేటి schedule
- 🟢 Future Leads - భవిష్యత్ visits

---

## ❓ Common Issues / సాధారణ సమస్యలు

### **Issue 1: "Redirect URI mismatch"**

**Solution:**
- Go back to Google Cloud Console
- Edit OAuth client
- Make sure redirect URI is exactly:
  ```
  https://retoerp-1.preview.emergentagent.com/api/auth/google/callback
  ```
- No spaces, exact match required

### **Issue 2: "API not enabled"**

**Solution:**
- Go to APIs & Services → Library
- Enable Google Calendar API
- Enable Google People API

### **Issue 3: Still showing JSON**

**Solution:**
- Check if .env file was saved correctly
- Restart backend: `sudo supervisorctl restart backend`
- Clear browser cache
- Try again

---

## 📞 Need Help? / సహాయం కావాలా?

**If you're stuck:**
1. Share screenshot of the issue
2. Check backend logs: `tail -f /var/log/supervisor/backend.out.log`
3. Check if credentials are in .env: `grep GOOGLE_CLIENT_ID /app/backend/.env`

**Common mistakes:**
- Forgetting to enable APIs
- Wrong redirect URI
- Not restarting backend after .env changes
- Copying credentials with extra spaces

---

**Next Steps After Setup:**
1. Test scheduling a visit
2. Check if it appears in your Google Calendar
3. Try the Google Meet link
4. Verify client receives email invite

**Everything will work automatically once credentials are added!** 🚀

---

**Created:** November 1, 2024  
**Status:** Waiting for Google OAuth credentials  
**Fix Time:** 10-15 minutes

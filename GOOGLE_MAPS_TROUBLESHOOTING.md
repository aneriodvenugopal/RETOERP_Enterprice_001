# Google Maps Troubleshooting Guide

## ❌ Error: "This page can't load Google Maps correctly"

### 🔍 Common Causes:

1. **Billing Not Enabled** (Most Common)
2. **Domain Restrictions**
3. **API Not Enabled**
4. **Daily Quota Exceeded**

---

## ✅ Solution Steps:

### **Step 1: Enable Billing (REQUIRED)**

Google Maps requires billing to be enabled even for free tier usage.

**Action Required:**
1. Go to: https://console.cloud.google.com/billing
2. Select your project: `IncomeLands-App`
3. Click **"Link a billing account"**
4. Add credit/debit card (will NOT be charged in free tier)
5. Enable billing

**Free Tier Includes:**
- ₹5,70,000 (~$6,800) free credit per month
- Covers ~3.25 million map loads
- No charges until you exceed this limit

⚠️ **Without billing enabled, maps will NOT load even with valid API key**

---

### **Step 2: Add Domain to API Restrictions**

Your API key needs to allow your domain.

**Current Domain:**
```
https://retoerp-advisory.preview.emergentagent.com/*
```

**Action Required:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key: `AIzaSyA0_bXgS462aA-eas28mt7uWlNFiv0NagY`
3. Under "Application restrictions" → "HTTP referrers"
4. Add these referrers:
   ```
   https://retoerp-advisory.preview.emergentagent.com/*
   https://*.emergentagent.com/*
   http://localhost:3000/*
   ```
5. Click **"Save"**

---

### **Step 3: Verify APIs Enabled**

Make sure these APIs are enabled:

1. Go to: https://console.cloud.google.com/apis/library
2. Search and enable:
   - ✅ **Maps JavaScript API** (already enabled)
   - ✅ **Places API** (for location autocomplete)
   - ✅ **Geocoding API** (optional, for address conversion)

---

### **Step 4: Check Browser Console**

Open browser DevTools (F12) and look for specific error:

**Error: "Google Maps JavaScript API error: ApiNotActivatedMapError"**
→ Solution: Enable billing

**Error: "Google Maps JavaScript API error: RefererNotAllowedMapError"**
→ Solution: Add domain to HTTP referrers

**Error: "Google Maps JavaScript API error: InvalidKeyMapError"**
→ Solution: Check if API key is correct

---

## 🔧 Quick Test:

Open this URL in browser (replace YOUR_KEY):
```
https://maps.googleapis.com/maps/api/js?key=AIzaSyA0_bXgS462aA-eas28mt7uWlNFiv0NagY&callback=initMap
```

**If it loads:** API key is valid ✅  
**If error:** Check the error message for specific issue ❌

---

## 💰 Cost Estimation:

For IncomeLands with 1,000 active users:
- **Free credit:** ₹5,70,000/month
- **Usage:** ~50,000 map loads/month
- **Cost:** ₹0 (well within free tier)

**Even for 10,000 users:**
- Usage: ~500,000 map loads/month
- Cost: ₹0 (still within free tier!)

---

## 📞 Need Help?

**If maps still don't load after following above steps:**
1. Share the browser console error
2. I'll help diagnose the specific issue

**Google Support:**
- Email: maps-support@google.com
- Docs: https://developers.google.com/maps/documentation

---

## ⚡ Temporary Fallback:

While you enable billing, I've added a fallback:
- Shows static location picker
- User can enter address manually
- We'll enable full maps once billing is set up

---

**Most Important: Enable billing in Google Cloud Console!** 💳

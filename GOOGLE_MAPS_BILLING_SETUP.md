# Google Maps Billing Setup Guide - IncomeLands

## Issue: "For development purposes only" Watermark

This watermark appears when Google Maps API billing is not properly configured.

## Solution Steps

### Step 1: Enable Billing in Google Cloud Console

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/billing

2. **Select Your Project**
   - Click on the project dropdown at the top
   - Select the project that contains your API key

3. **Link Billing Account**
   - Click "Link a billing account"
   - If you don't have one, click "Create Billing Account"
   - Enter your credit card details (No charges initially - Google provides $200 free credit per month)

4. **Enable Billing**
   - Once billing account is linked, ensure it's ACTIVE
   - Status should show "Billing: Active"

### Step 2: Enable Required APIs

1. **Go to APIs & Services > Library**
   - Visit: https://console.cloud.google.com/apis/library

2. **Enable the following APIs:**
   - ✅ Maps JavaScript API
   - ✅ Places API (for location search/autocomplete)
   - ✅ Geocoding API (for address to lat/lng conversion)
   - ✅ Geolocation API (optional, for user location)

3. **Click "Enable" for each API**

### Step 3: Configure API Key Restrictions

1. **Go to APIs & Services > Credentials**
   - Visit: https://console.cloud.google.com/apis/credentials

2. **Click on your API Key**

3. **Application Restrictions:**
   - Select "HTTP referrers (websites)"
   - Add your domains:
     ```
     https://land-atlas.preview.emergentagent.com/*
     http://localhost:3000/*
     ```

4. **API Restrictions:**
   - Select "Restrict key"
   - Choose:
     - Maps JavaScript API
     - Places API
     - Geocoding API

5. **Save Changes**

### Step 4: Verify Setup

1. **Clear Browser Cache**
   - Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard Refresh Your App**
   - Chrome: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

3. **Check for Watermark**
   - If still showing, wait 5-10 minutes for changes to propagate

### Step 5: If Issues Persist

1. **Regenerate API Key**
   - Go to Credentials page
   - Click on your API key
   - Click "Regenerate Key"
   - Update `.env` file with new key
   - Restart frontend: `sudo supervisorctl restart frontend`

2. **Check API Quotas**
   - Visit: https://console.cloud.google.com/apis/api/maps-backend.googleapis.com/quotas
   - Ensure no quotas are exceeded

3. **Check Browser Console**
   - Press F12
   - Go to "Console" tab
   - Look for Google Maps errors
   - Common errors:
     - `InvalidKeyMapError`: API key issue
     - `RefererNotAllowedMapError`: Domain not whitelisted
     - `ApiNotActivatedMapError`: API not enabled

## Cost Information

### Google Maps Free Tier (Monthly):
- **$200 Free Credit** (equivalent to ₹16,500)
- Refreshes every month

### Usage Estimates for IncomeLands:
- **Maps JavaScript API**: $7 per 1,000 loads
  - $200 credit = ~28,000 map loads/month
  
- **Places Autocomplete**: $17 per 1,000 requests
  - $200 credit = ~11,700 searches/month

- **Geocoding API**: $5 per 1,000 requests
  - $200 credit = ~40,000 geocodes/month

**For a small-to-medium app with 100-500 users/day, you'll likely stay within free tier.**

## Optimization Tips to Stay Within Free Tier

1. **Lazy Load Maps**: Only load map when user clicks "Map View"
2. **Cache Geocoding Results**: Don't geocode the same address twice
3. **Debounce Autocomplete**: Wait 300ms before making API calls
4. **Use Static Maps for Thumbnails**: Instead of interactive maps in list view

## Emergency Fallback (If Billing Can't Be Enabled)

IncomeLands app now supports **Manual Coordinate Entry**:

1. When Google Maps error shows, click "Enter Coordinates Manually"
2. Get coordinates from Google Maps website:
   - Right-click on location → "What's here?"
   - Copy latitude and longitude
3. Paste in IncomeLands app
4. Location will be set without using API

## Support

If you continue facing issues:
1. Check Google Cloud Console Status: https://status.cloud.google.com/
2. Review API usage: https://console.cloud.google.com/apis/dashboard
3. Contact Google Cloud Support: https://cloud.google.com/support

---

**Note**: After enabling billing, it may take 5-10 minutes for changes to propagate globally.

**Current API Key**: AIzaSyA0_bXgS462aA-eas28mt7uWlNFiv0NagY
**Project**: RETOERP IncomeLands

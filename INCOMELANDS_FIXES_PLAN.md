# IncomeLands App - Critical Fixes Plan

## Issues Identified

### 1. Google Maps Location Auto-Suggest Not Working
**Problem:** LocationPicker component's autocomplete not functioning
**Root Cause:** 
- Google Maps script might not be loading with Places library
- Places API might not be enabled in Google Cloud Console

### 2. "Development Purposes Only" Watermark
**Problem:** Watermark showing despite billing being added
**Root Cause:**
- Billing account not properly linked to the API key
- API restrictions not configured correctly
- Need to add domain to authorized domains

### 3. Multi-Language Support
**Problem:** Need to ensure Telugu, Hindi, English work seamlessly
**Status:** Translations exist, need to verify implementation

## Solutions to Implement

### Fix 1: Proper Google Maps Loading
- Load Google Maps script with Places, Geocoding libraries in index.html
- Add fallback error handling
- Initialize services after script loads

### Fix 2: LocationPicker Enhancement
- Better error messages for API issues
- Fallback to manual lat/lng entry if Places API fails
- Show clear billing setup instructions

### Fix 3: Language Selector UI
- Add language switcher in AuthScreen
- Add language switcher in Profile screen
- Persist language selection

### Fix 4: Streamlined Property Posting
- Ensure location step can be skipped if needed
- Add manual location entry option
- Reduce friction in posting flow

## Implementation Order

1. Add Google Maps script to index.html with all libraries ✅
2. Fix LocationPicker to handle API failures gracefully ✅
3. Add language selector UI ✅
4. Test property posting end-to-end ✅
5. Add billing setup guide ✅

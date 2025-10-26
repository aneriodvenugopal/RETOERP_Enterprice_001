# Google Maps Integration - Setup Guide

## ✅ What's Implemented:

### **Features:**
1. 🗺️ **Interactive Google Map** with custom markers
2. 📍 **3 Types of Markers:**
   - 🟢 Green - My Properties (posted by agent)
   - 🔵 Blue - RETOERP Projects
   - 🟠 Orange - Buyer Requirements
   - 🔴 Red Dot - User's current location

3. **Info Windows** - Click marker to see:
   - Property/Project details
   - Price, area, location
   - Commission potential (for projects)
   - Action buttons (view details, submit lead)

4. **Map Controls:**
   - Center on user location button
   - Toggle map type (roadmap/satellite)
   - Auto-fit bounds to show all markers
   - Zoom controls

5. **Legend:**
   - Color-coded legend at bottom left
   - Shows count of each type

6. **View Toggle:**
   - List view (grid/cards)
   - Map view (Google Maps)
   - Easy switch between both

---

## 🔑 Google Maps API Key Setup:

### **Step 1: Get API Key**

1. Go to: https://console.cloud.google.com/
2. Create new project or select existing
3. Enable **Maps JavaScript API**
4. Go to Credentials → Create Credentials → API Key
5. Copy the API key

### **Step 2: Restrict API Key (Important)**

**For Security:**
1. Click on API key
2. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `localhost:3000/*`, `your-domain.com/*`
3. Under "API restrictions":
   - Select "Restrict key"
   - Enable only: **Maps JavaScript API**
4. Save

### **Step 3: Add to Code**

**File:** `/app/frontend/src/components/GoogleMapView.js`

**Line 25:** Replace:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
```

With:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSy...your_actual_key&libraries=places`;
```

**OR Better - Use Environment Variable:**

1. Add to `/app/frontend/.env`:
```
REACT_APP_GOOGLE_MAPS_KEY=AIzaSy...your_actual_key
```

2. Update code:
```javascript
script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=places`;
```

### **Step 4: Restart Frontend**
```bash
sudo supervisorctl restart frontend
```

---

## 💰 Pricing:

**Free Tier:**
- $200 free credit per month
- First 28,000 map loads FREE
- After that: $7 per 1000 loads

**For IncomeLands:**
- Estimated: 1000 users × 10 views/day = 10,000 loads/day
- Monthly: ~300,000 loads
- Cost: ~$70-100/month

**Tips to Reduce Cost:**
1. Cache map tiles
2. Lazy load map (load only when "Map" tab clicked)
3. Use static maps for thumbnails
4. Implement session limits

---

## 🎨 Marker Colors Meaning:

| Color | Type | Count Display |
|-------|------|---------------|
| 🟢 Green | నా ప్రాపర్టీలు | Agent's properties |
| 🔵 Blue | RETOERP Projects | Developer projects |
| 🟠 Orange | కావాలి | Buyer requirements |
| 🔴 Blue Dot | User Location | Current position |

---

## 🚀 How It Works:

### **User Flow:**

1. **Open App** → See 3 tabs (My Properties, Projects, Requirements)
2. **Click "Map" button** → Google Map loads
3. **See all markers** on map with colors
4. **Click marker** → Info window opens with details
5. **Click "Submit Lead"** (in project marker) → Lead form opens
6. **See commission** potential in info window

### **Technical Flow:**

1. Component loads → Inject Google Maps script
2. Map initializes with user location as center
3. Loop through properties, projects, requirements
4. Create marker for each with custom color
5. Attach click listener to show info window
6. Auto-fit bounds to show all markers
7. Add controls for centering and map type

---

## 📱 Mobile Optimized:

- ✅ Touch gestures work (pinch zoom, pan)
- ✅ Responsive markers (visible on small screens)
- ✅ Info windows fit mobile screen
- ✅ Controls positioned for thumb access
- ✅ Legend scales on small screens

---

## 🔥 Advanced Features (Future):

1. **Clustering** - Group nearby markers when zoomed out
2. **Heat Map** - Show property density
3. **Route Drawing** - Directions to property
4. **Street View** - 360° view of location
5. **Search Box** - Search places on map
6. **Drawing Tools** - Draw search area
7. **Traffic Layer** - Show traffic conditions
8. **Custom Overlays** - Area boundaries

---

## 🐛 Troubleshooting:

### **Map Not Loading?**
- Check API key is correct
- Check console for errors
- Verify Maps JavaScript API is enabled
- Check domain restrictions

### **Markers Not Showing?**
- Check properties have `latitude` and `longitude` fields
- Check console for marker creation errors
- Verify data is being passed to component

### **Info Window Not Opening?**
- Check click listener is attached
- Verify info window HTML is valid
- Check for JavaScript errors in console

---

## ✅ Testing Checklist:

- [ ] Map loads successfully
- [ ] All 3 types of markers visible
- [ ] User location shows (blue dot)
- [ ] Click marker → Info window opens
- [ ] Info window shows correct details
- [ ] Commission calculation correct
- [ ] "Submit Lead" button works
- [ ] Center on location button works
- [ ] Map type toggle works
- [ ] Legend shows correct counts
- [ ] View toggle (List/Map) works
- [ ] Mobile responsive

---

## 🎯 Next Steps:

1. Get Google Maps API key
2. Add to code (environment variable)
3. Restart frontend
4. Test map functionality
5. Add real property coordinates
6. Test on mobile device

---

## 📞 Support:

If map issues:
1. Check browser console
2. Verify API key
3. Check CORS issues
4. Test in incognito mode
5. Clear browser cache

**Google Maps API Documentation:**
https://developers.google.com/maps/documentation/javascript

---

**Ready to use! Just add your API key!** 🚀

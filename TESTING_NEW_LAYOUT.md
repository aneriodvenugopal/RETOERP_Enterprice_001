# 🧪 Testing Guide - New Enhanced Layout System

## Step 1: Login First
1. Open browser: http://localhost:3000/login
2. Login with: 9908290239 (your tenant login)

---

## Step 2: Test Enhanced Layout Editor

### Option A: Create New Layout
1. Go to: http://localhost:3000/layouts/enhanced/new
2. You should see:
   - Left panel with drawing tools (Rectangle, Square, Triangle, Circle, Polygon)
   - Center area for drawing
   - Right panel appears when you select a plot

### Option B: Edit Existing Layout (if you have layouts)
1. Go to: http://localhost:3000/layouts
2. Find your layout
3. Change URL from `/layout-editor/{id}` to `/layouts/enhanced/{id}`
4. Example: http://localhost:3000/layouts/enhanced/your-layout-id

---

## Step 3: Test Drawing Tools

### Draw a Rectangle:
1. Click "Rectangle" button in left panel
2. Click once on canvas (first corner)
3. Click again (opposite corner)
4. Rectangle plot is created!

### Draw a Circle:
1. Click "Circle" button
2. Click once (center point)
3. Click again (radius point)
4. Circle plot is created!

### Draw a Triangle:
1. Click "Triangle" button
2. Click 3 times on canvas
3. Triangle is created!

---

## Step 4: Test Undo/Redo

1. Draw a plot (any shape)
2. Press Ctrl+Z (or click Undo button) → Plot disappears
3. Press Ctrl+Y (or click Redo button) → Plot comes back

---

## Step 5: Test Side Panel Editing

1. Draw a plot (any shape)
2. Click on it in the left plot list
3. Right panel opens with:
   - Plot Name field
   - Area field
   - Price field
   - Status dropdown
   - Block field
   - Facing dropdown
4. Change values
5. Click "Update Plot"
6. Changes saved!

---

## Step 6: Test Public Viewer (Website)

### If you have a project with layout:
1. **Logout** (or open incognito window)
2. Go to: http://localhost:3000/public/project/{your-project-id}
3. Scroll down to "Interactive Layout Plan" section
4. You should see:
   - Search box at top
   - Filter buttons (All/Available/Booked/Sold)
   - Stats bar showing counts
   - Zoom controls on right
   - Legend on bottom-left
   - Full-screen map with plots

### If layout not showing:
1. Make sure you saved the layout in step 2
2. Make sure project has layout linked
3. Check layout has plots drawn

---

## Step 7: Test Plot Booking Flow (Public)

1. On public page (step 6)
2. Click on any green (available) plot
3. Floating card appears showing:
   - Plot name
   - Area
   - Price
   - Block
   - Facing
   - "Book Now" button
4. Click "Book Now"
5. Fill the form:
   - Name
   - Phone
   - Email (optional)
   - Message (optional)
6. Click "Submit Enquiry"
7. Success message appears!

---

## Step 8: Test Search & Filter (Public)

1. In search box, type a plot number (e.g., "Plot 5")
2. Only that plot highlights
3. Click "Available" filter → Only green plots show
4. Click "Sold" filter → Only red plots show
5. Click "All" → All plots show

---

## Step 9: Test Zoom Controls (Public)

1. Click "+" button → Map zooms in
2. Click "-" button → Map zooms out
3. Click fullscreen icon → Map goes fullscreen
4. Press Esc to exit fullscreen

---

## Quick URLs Reference:

**Admin Pages (Need Login):**
- New Layout: http://localhost:3000/layouts/enhanced/new
- Edit Layout: http://localhost:3000/layouts/enhanced/{layout-id}

**Public Pages (No Login):**
- View Project: http://localhost:3000/public/project/{project-id}

---

## If Something Doesn't Work:

### Frontend Errors:
```bash
# Check frontend logs
tail -f /var/log/supervisor/frontend.err.log
```

### Backend Errors:
```bash
# Check backend logs
tail -f /var/log/supervisor/backend.err.log
```

### Browser Console:
1. Press F12 in browser
2. Go to Console tab
3. Check for errors

---

## Expected Results:

✅ Enhanced editor loads with tools
✅ Can draw multiple shapes
✅ Undo/Redo works
✅ Side panel editing works
✅ Public viewer shows on website
✅ Booking form works
✅ Search/filter works
✅ Zoom works

---

## Screenshots to Verify:

**Enhanced Editor Should Look Like:**
```
┌──────────────────────────────────────┐
│ [<] Layout Name  [Undo][Redo] [Save] │
├──────┬───────────────────────────────┤
│TOOLS │    CANVAS                     │
│ □Rect│    (Draw here)                │
│ △Tri │                                │
│ ○Circ│                                │
│      │                                │
│PLOTS │                                │
│Plot1 │                                │
│Plot2 │                                │
└──────┴───────────────────────────────┘
```

**Public Viewer Should Look Like:**
```
┌─────────────────────────────────────┐
│ [Search...] [All][Available][Sold]  │
│ Stats: Available: 5 | Booked: 2    │
├─────────────────────────────────────┤
│                              [+]    │
│      MAP WITH PLOTS          100%   │
│      (Click plots)           [-]    │
│                              [□]    │
│                                     │
│ [Legend]                            │
└─────────────────────────────────────┘
```

---

## Need Help?

If you see errors or something doesn't work:
1. Check browser console (F12)
2. Check logs (commands above)
3. Share screenshot of error
4. Tell me which step failed

Happy Testing! 🎉

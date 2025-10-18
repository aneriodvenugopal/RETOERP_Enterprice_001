# Ocean Theme + Layout Viewer Implementation Plan

## Phase 1: Ocean Theme Pages (Priority 1)
- [x] Login Page
- [x] Register Page
- [ ] Main Dashboard (Tenant/Super Admin/Staff)
- [ ] Customer Dashboard
- [ ] Projects Page
- [ ] Bookings Page
- [ ] Reports & Analytics
- [ ] Users Management

## Phase 2: Interactive Layout Viewer (Priority 2)

### Backend Components
1. **Models**
   - PropertyLayout (stores SVG, coordinates, metadata)
   - LayoutPlot (individual plot data linked to properties)

2. **API Routes**
   - GET /api/projects/{id}/layout - Get project layout
   - POST /api/projects/{id}/layout - Upload/update layout
   - GET /api/public/projects/{id}/layout - Public shareable link
   - PATCH /api/projects/{id}/layout/plots/{plotId} - Update plot status

3. **Services**
   - LayoutService (SVG processing, coordinate mapping)

### Frontend Components
1. **InteractiveLayoutViewer.js**
   - SVG rendering with zoom/pan
   - Color-coded plots (Available=green, Booked=blue, Blocked=red, Sold=gray)
   - Click to show plot details modal
   - Status legend

2. **LayoutUploader.js**
   - SVG file upload
   - Coordinate mapping tool
   - Plot ID assignment

3. **PublicLayoutView.js**
   - Read-only public view
   - No authentication required
   - Shareable link generation

### Features
- SVG-based visualization (supports any layout shape)
- Real-time plot status updates
- Shareable public links per project
- Mobile responsive
- Print-friendly
- Export as image

## Implementation Order
1. Ocean theme for Dashboard pages (2-3 hours)
2. Backend layout APIs (1 hour)
3. Interactive Layout Viewer component (2 hours)
4. Public layout view (30 mins)
5. Testing & refinement (1 hour)

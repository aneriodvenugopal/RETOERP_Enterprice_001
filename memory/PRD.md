# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant Agentic AI workflow for the RealApex platform. Core app is AgentApex - a mobile-first PWA for real estate agents with property management, lead tracking, followup management, and AI-powered WhatsApp sales assistant.

## Architecture
- **Backend**: FastAPI (Python) | **Frontend**: React (CRA) - Mobile-first PWA
- **Database**: MongoDB | **Storage**: Emergent Object Storage
- **APIs**: Meta WhatsApp Cloud API, Google Places Autocomplete, OpenAI/Claude via Emergent LLM Key
- **Theme**: Navy blue (#1a365d) with shield logo branding

---

## Completed Features

### Phase 4 - Dashboard Redesign & PWA Fixes (2026-04-03)
- **Dashboard Redesign**: Navy blue theme (#1a365d), 2x2 stat grid, colored menu icons matching reference design
- **Logo Update**: Generated new shield+building+arrows logo icons (192, 512, maskable versions)
- **Property Search Relocation**: Removed from dashboard menu → # icon in header for Property ID search
- **PWA Manifest Fix**: Static `<link rel="manifest">` tag (replaced document.write for PWABuilder compatibility)
- **Icon Sizes Fix**: Resized 1024x1024 to proper 512x512 and 192x192 to match manifest declarations
- **Service Worker**: Added agentapex-sw.js with network-first caching strategy
- **Meta WhatsApp Fix Attempt**: WABA account restricted by Meta - user must resolve via Business Support Home

### Phase 3 - Attachments & Radius Search (2026-03-31)
- **#21 Property Edit FAB + Attachments**: Floating + button, bottom sheet with Gallery/Document/Notes/Video options
- **#24 Radius Search**: Radius slider 1-50km, badge on map, dashed circle, quick-select buttons
- PropertyUpdate model for partial updates

### Phase 2 - Property ID & Share System (2026-03-31)
- Property ID system: AX-P-10001 format, auto-increment
- Canvas-based share card image (html-to-image + QR code)
- Property Search by ID (public route, no auth)
- Image management (reorder, delete, set cover)
- Privacy Policy for AgentApex (Play Store ready)

### Phase 1 - Core Systems (2026-03-31)
- Property Sharing with agent branding
- Followup System (Active/Hidden, search, bulk add, notes)
- Lead Pipeline (Cold/Warm/Hot)
- Profile photo upload + designation
- WhatsApp App Invite

### Previously Completed
- AgentApex PWA with OTP login, Property CRUD, Map Search
- 7-Agent AI WhatsApp Sales Engine, Meta WhatsApp API
- Object Storage, Admin panel, Requirements, Favorites

---

## Remaining Tasks

### Active (User-confirmed):
| # | Priority | Feature | Status |
|---|---|---|---|
| 1 | HIGH | Mobile app overall UI improvements | IN PROGRESS (Dashboard done) |
| 19 | MED | Connect realapex.in with agentapex.in/.com | PENDING |
| 20 | MED | WhatsApp-style chat interface for property notes | PENDING |
| 22 | MED | Toggle to hide additional info from customers | PENDING |
| 23 | MED | Image editing - crop feature | PENDING |
| 25 | LOW | Audio-based property posting | PENDING |
| 26 | LOW | Realapex projects show with icon | PENDING |
| 27 | LOW | Notifications module | PENDING |

### Pending Bug Fixes (from last session):
| Issue | Status |
|---|---|
| Followup "+" native contacts API | Code updated, not verified on mobile |
| Property Share Card design match | Code updated, needs mobile testing |
| Multiple document upload | Code updated, needs verification |

### Ignored by user: 15, 16, 17, 18

### Blocked:
- WhatsApp message sending (Meta WABA account restricted - user must visit Business Support Home)

---

## Key API Endpoints
- `GET /api/agentapex/properties/search-by-id?property_id=AX-P-10001` (PUBLIC)
- `GET /api/agentapex/properties?latitude=X&longitude=Y&radius_km=Z`
- `PUT /api/agentapex/properties/{id}` (partial update via PropertyUpdate model)
- All followup, lead, profile, share-data endpoints

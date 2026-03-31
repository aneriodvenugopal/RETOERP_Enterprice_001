# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant Agentic AI workflow for the RealApex platform. Core app is AgentApex - a mobile-first PWA for real estate agents with property management, lead tracking, followup management, and AI-powered WhatsApp sales assistant.

## Architecture
- **Backend**: FastAPI (Python) | **Frontend**: React (CRA) - Mobile-first PWA
- **Database**: MongoDB | **Storage**: Emergent Object Storage
- **APIs**: Meta WhatsApp Cloud API, Google Places Autocomplete, OpenAI/Claude via Emergent LLM Key

---

## Completed Features

### Phase 3 - Attachments & Radius Search (2026-03-31)
- **#21 Property Edit FAB + Attachments**: Floating + button → bottom sheet with Gallery/Document/Notes/Video options. Notes section with add/delete. Notes stored as array.
- **#24 Radius Search**: Radius slider 1-50km, badge on map "X km radius | N found", dashed circle, quick-select buttons (5/10/20/50km), null coordinate handling.
- PropertyUpdate model for partial updates (only send changed fields)

### Phase 2 - Property ID & Share System (2026-03-31)
- Property ID system: AX-P-10001 format, auto-increment from 10001
- Canvas-based share card image (html-to-image + QR code)
- Property Search by ID (public route, no auth)
- Image management (reorder, delete, set cover)
- Contact NOT shown in share cards
- Privacy Policy for AgentApex (Play Store ready)
- Play Store publishing guide

### Phase 1 - Core Systems (2026-03-31)
- Property Sharing with agent branding
- Followup System (Active/Hidden, search, bulk add, notes)
- Lead Pipeline (Cold→Warm→Hot)
- Profile photo upload + designation
- Multiple image upload fix, map points fix
- WhatsApp App Invite

### Previously Completed
- AgentApex PWA with OTP login, Property CRUD, Map Search
- 7-Agent AI WhatsApp Sales Engine, Meta WhatsApp API
- Object Storage, Admin panel, Requirements, Favorites, Voice posting

---

## Remaining Tasks

### Active (User-confirmed):
| # | Priority | Feature | Status |
|---|---|---|---|
| 1 | HIGH | Mobile app overall UI improvements | PENDING |
| 19 | MED | Connect realapex.in with agentapex.in/.com | PENDING |
| 20 | MED | WhatsApp-style chat interface for property notes | PENDING |
| 22 | MED | Toggle to hide additional info from customers | PENDING |
| 23 | MED | Image editing - crop feature | PENDING |
| 25 | LOW | Audio-based property posting | PENDING |
| 26 | LOW | Realapex projects show with icon | PENDING |
| 27 | LOW | Notifications module | PENDING |

### Ignored by user: 15, 16, 17, 18

### Blocked:
- WhatsApp message sending (Meta phone PENDING status)
- PropertyEdit.js Google Places mid-edit cleanup

---

## Key API Endpoints
- `GET /api/agentapex/properties/search-by-id?property_id=AX-P-10001` (PUBLIC)
- `GET /api/agentapex/properties?latitude=X&longitude=Y&radius_km=Z`
- `PUT /api/agentapex/properties/{id}` (partial update via PropertyUpdate model)
- `PUT /api/agentapex/properties/{id}/cover-image?index=N`
- `PUT /api/agentapex/properties/{id}/reorder-images`
- `DELETE /api/agentapex/properties/{id}/images/{index}`
- All followup, lead, profile, share-data endpoints

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

### Phase 5 - WhatsApp Webhook & API Fix (2026-04-14 to 2026-04-16)
- **Webhook GET Verification**: Fixed to return plain text challenge. `PlainTextResponse` HTTP 200/403
- **Duplicate Message Protection**: In-memory TTL cache deduplicates by `message_id` (5min window)
- **Bot Loop Prevention**: Ignores messages from own WhatsApp number
- **Rate Limiting**: Per-phone 5-second cooldown to prevent rapid-fire event floods
- **POST Always Returns 200**: Prevents Meta retry storms that consume credits
- **WhatsApp API FIXED**: Resolved BSP permission issue. Messages now sending successfully via `+91 63093 56590` (Phone ID: `963130426884425`)
- **Template Integration**: `follow_up_template` (4 params: name/agent/city/area), `leadintroductiontemplate` (4 params), `otp_1` (1 param)
- **API Endpoints**: `/send-followup`, `/send-introduction`, `/approved-templates`
- **API Version**: Updated to v21.0
- **Webhook Auto-configured via API**: `https://realapex.in/api/whatsapp/webhook` subscribed to `messages` field
- **Leads Page Template Buttons**: Updated from old deleted app templates to new approved templates (follow_up_template, leadintroductiontemplate)

### Phase 6 - Sales Engine Rewrite (2026-04-16)
- **Complete AI rewrite**: Replaced 7-agent question-machine with single DB-first Sales Engine
- **Flow**: User message → Parse location/budget → DB search → Match? Show projects + close → No match? Max 3 questions → Lead capture
- **Features**: Location extraction (50+ Indian cities/areas), budget parsing (lakhs/crores), property type detection, option selection (call/visit/details), site visit scheduling, exit detection
- **Rules enforced**: Max 3 questions, never repeat, DB check first, fast conversion
- WABA: `25977390118562175` (Eloniot Software Solutions)
- Phone: `+91 63093 56590` (ID: `963130426884425`, GREEN quality)
- System User: `REALAPEX_Admin1` (ID: `61580667278343`)

---

## Key API Endpoints
- `GET /api/agentapex/properties/search-by-id?property_id=AX-P-10001` (PUBLIC)
- `GET /api/agentapex/properties?latitude=X&longitude=Y&radius_km=Z`
- `PUT /api/agentapex/properties/{id}` (partial update via PropertyUpdate model)
- `GET /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...` (Meta verification - returns plain text)
- `POST /api/whatsapp/webhook` (Meta event receiver - dedup + rate limited)
- All followup, lead, profile, share-data endpoints

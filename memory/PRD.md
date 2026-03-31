# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant Agentic AI workflow for the RealApex platform. Core app is AgentApex - a mobile-first PWA for real estate agents that provides property management, lead tracking, followup management, and AI-powered WhatsApp sales assistant.

## Architecture
- **Backend**: FastAPI (Python)
- **Frontend**: React (CRA) - Mobile-first PWA
- **Database**: MongoDB
- **Storage**: Emergent Object Storage for images/files
- **APIs**: Meta WhatsApp Cloud API, Google Places Autocomplete, OpenAI/Claude via Emergent LLM Key

## Core Systems (First Principles)
1. **Property Sharing** - Agents share properties → Leads come
2. **Followup System** - Followup → Conversion
3. **Lead Tracking** - Cold → Warm → Hot

---

## What's Been Implemented

### Phase 2 - Property ID & Share System (Completed 2026-03-31)

#### Property ID System (#new)
- Auto-generated unique IDs: `AX-P-10001` (Plot), `AX-V-10002` (Villa), `AX-A-10003` (Apartment), `AX-C-10004` (Commercial), `AX-F-10005` (Farm), `AX-H-10006` (House)
- Atomic counter starting from 10001
- Migration endpoint for existing properties
- Property ID shown on: detail page badge, MyProperties cards, share card

#### Property Share Card (#3, #4)
- Canvas-based image generation (html-to-image)
- Card layout: Property image → Title banner → Details grid → Agent branding → QR code → Footer
- Agent info: name, profile photo, "AgentApex Property Advisor" designation
- QR code for Play Store download
- **Contact details NOT shown** — footer says "Search Property ID in AgentApex App"
- "Share via WhatsApp" and "Download Card" buttons

#### Property Search by ID (#new)
- Public route `/agentapex/search-property` (no auth required)
- Enter AX-P-10001 → View property + agent branding
- "Request Contact Details" button → Creates lead (ensures app installs & lead tracking)

#### Property Image Management (#23 partial)
- Set cover image (star icon)
- Delete individual images
- Drag-to-reorder images
- "Images" button on PropertyDetail for owners

### Phase 1 - Core Systems (Completed 2026-03-31)

#### System 1: Property Sharing
- WhatsApp sharing with agent branding template (no contact details)
- `GET /api/agentapex/properties/{id}/share-data` returns property + agent info

#### System 2: Followup System (#5, #6, #7, #8)
- Active/Hidden tabs with counts
- Search contacts by name, phone, location
- Add single + bulk contacts
- Follow-up notes with status tracking
- Phone contact import (Contact Picker API)

#### System 3: Lead Pipeline (#11)
- Cold → Warm → Hot pipeline with stats cards and filter tabs
- Status change drawer, property enrichment on lead cards

#### Profile (#2, #9)
- Profile photo upload via Object Storage + designation field
- WhatsApp App Invite card

#### Bug Fixes
- #10: Multiple document/image upload ✅
- #12: Map points with invalid coordinates filtered ✅

### Previously Completed
- AgentApex mobile-first PWA with OTP login
- Property CRUD, Map Search with Google Places Autocomplete
- 7-Agent AI WhatsApp Sales Engine
- Meta WhatsApp Cloud API integration
- Emergent Object Storage, Admin panel
- Requirements/buyer posting, Favorites, Voice property posting

---

## Prioritized Backlog

### P1 - Next Phase
- #1: Mobile app overall UI improvements
- #15: Multiple owners option in property edit
- #16: Password protection to view owner contacts
- #17: Verified property system (admin side)
- #19: Connect realapex.in with agentapex.in/.com
- #20: WhatsApp-style chat interface for property notes
- #24: Radius filtering in map search

### P2 - Future
- #18: Complaint/Enquiry module
- #21: Attachments (gallery/documents/notes)
- #22: Private Info toggle
- #25: Audio-based property posting
- #26: Realapex projects icon
- #27: Notifications module

### P3 - Infrastructure
- Agent Dashboard UI, Redis/Celery migration, API Route Conflict

---

## Known Issues
- WhatsApp message sending from /leads page: BLOCKED (Meta phone PENDING)
- PropertyEdit.js: Mid-edit state from Google Places migration

## Key API Endpoints
- `GET /api/agentapex/properties/search-by-id?property_id=AX-P-10001` (PUBLIC)
- `GET /api/agentapex/properties/{id}/share-data`
- `PUT /api/agentapex/properties/{id}/cover-image?index=0`
- `PUT /api/agentapex/properties/{id}/reorder-images`
- `DELETE /api/agentapex/properties/{id}/images/{index}`
- `POST /api/agentapex/migrate/property-ids`
- All followup, lead, profile endpoints from Phase 1

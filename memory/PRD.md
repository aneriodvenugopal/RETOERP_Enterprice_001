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

### Phase 1 - Core Systems (Completed 2026-03-31)

#### System 1: Property Sharing (#3, #4)
- Property share card with agent name, photo, designation, contact number
- WhatsApp sharing with agent branding template
- `GET /api/agentapex/properties/{id}/share-data` returns property + agent info
- Share text includes: Property type, price, area, location, agent details

#### System 2: Followup System (#5, #6, #7, #8)
- Active/Hidden tabs with counts
- Search contacts by name, phone, location
- Add single contact form (name, phone, location, notes)
- Bulk add multiple contacts at once
- Add follow-up notes with status (Interested/Not Interested/Reschedule/Follow-up Again)
- Schedule next follow-up date/time
- Move contacts between Active/Hidden tabs
- Delete contacts
- Followup history tracking
- Phone contact import (via Contact Picker API)

#### System 3: Lead Pipeline (#11)
- Cold → Warm → Hot pipeline UI
- Pipeline stats cards (Hot/Warm/Cold/New/Closed)
- Search leads by name, phone, location
- Filter tabs (All/New/Contacted/Hot/Warm/Cold/Closed)
- Status change drawer with one-tap status update
- Property info enrichment on lead cards
- Call/WhatsApp quick actions

#### Profile Enhancement (#2, #9)
- Profile photo upload via Object Storage
- Designation field (e.g., Property Consultant)
- Stats row (Properties/Leads/Follow-ups)
- WhatsApp App Invite card with branding message
- Share icon in header for quick invite

#### Bug Fixes
- #10: Multiple document/image upload now works (was single only)
- #12: Map points with invalid/zero coordinates filtered out

### Previously Completed
- AgentApex mobile-first PWA with OTP login
- Property CRUD (Post, Edit, Delete, Images, Documents)
- Map Search with Google Places Autocomplete
- 7-Agent AI WhatsApp Sales Engine
- Meta WhatsApp Cloud API integration
- Emergent Object Storage for property images
- Admin panel for tenant management
- Requirements/buyer posting system
- Favorites system
- Voice property posting

---

## Prioritized Backlog

### P1 - Next Phase (Medium Priority)
- #1: Mobile app overall UI improvements
- #15: Multiple owners option in property edit
- #16: Password protection to view owner contacts
- #17: Verified property system (admin side)
- #19: Connect realapex.in with agentapex.in/.com
- #20: WhatsApp-style chat interface for property notes
- #24: Radius filtering in map search

### P2 - Future (Low-Medium Priority)
- #18: Complaint/Enquiry module for agents
- #21: + icon attach gallery/documents/notes
- #22: Private Info toggle (hide additional info from customers)
- #23: Property images editing (crop/reorder)
- #25: Audio-based property posting
- #26: Realapex projects show with icon
- #27: Separate notifications module (Interested Areas/Notifications/Requirements)

### P3 - Infrastructure
- Agent Dashboard UI (human agents monitor/takeover AI conversations)
- Scalability Refactor (Redis/Celery migration)
- API Route Conflict resolution (customer_payments.py vs stripe_payments.py)

---

## Known Issues
- WhatsApp message sending from frontend /leads page: BLOCKED - Meta phone number in PENDING status
- PropertyEdit.js: May have mid-edit state from Google Places Autocomplete migration

## API Endpoints (AgentApex)
- `POST /api/agentapex/auth/send-otp` - Send OTP
- `POST /api/agentapex/auth/verify-otp` - Verify OTP & get token
- `GET /api/agentapex/auth/me` - Get current user
- `PUT /api/agentapex/auth/profile` - Update profile (name, email, designation)
- `POST /api/agentapex/auth/profile-image` - Upload profile photo
- `GET /api/agentapex/properties` - List properties
- `POST /api/agentapex/properties` - Create property
- `GET /api/agentapex/properties/{id}` - Get property detail
- `POST /api/agentapex/properties/{id}/images` - Upload multiple images
- `GET /api/agentapex/properties/{id}/share-data` - Get share card data
- `GET /api/agentapex/leads` - Get leads with property enrichment
- `GET /api/agentapex/leads/stats` - Get pipeline stats
- `PUT /api/agentapex/leads/{id}/status` - Update lead status
- `GET /api/agentapex/followups` - Get followups (filter: hidden, search)
- `POST /api/agentapex/followups` - Create followup
- `POST /api/agentapex/followups/bulk` - Bulk add contacts
- `PUT /api/agentapex/followups/{id}` - Update followup note
- `PUT /api/agentapex/followups/{id}/toggle-hidden` - Toggle Active/Hidden
- `DELETE /api/agentapex/followups/{id}` - Delete followup

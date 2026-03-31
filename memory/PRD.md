# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant "Agentic AI workflow" for RealApex platform - an AI-powered WhatsApp real estate sales assistant that handles customer inquiries, property availability, site visits, and bookings.

Additionally, the AgentApex mobile app requires continuous UI/UX improvements for better user experience.

---

## Completed Features

### March 14, 2026

#### 1. RealApex Public Layout View - Bug Fixes ✅
- **Plot Data Enrichment**: Backend API now enriches plot data with property-level details (videos, images, location)
- **Video URL Support**: Added support for single `video_url` and `youtube_url` fields in addition to arrays
- **Mobile Responsive Modal**: Fixed property details popup to be responsive on small screens
  - Tabs now horizontally scrollable
  - Proper padding and font sizes for mobile
  - Max-width constrained with viewport percentage
- **Fixed typo**: `playingVideoIndexIndex` → `playingVideoIndex`
- **Removed duplicate route**: Cleaned up duplicate `/public/projects/{project_id}/layout` endpoint

#### 2. AgentApex - Multiple Document Upload UI ✅
- Improved "My Properties → Edit" document upload UI
- Clear "Add Documents" button with upload icon
- "Click here to upload" prompt in empty state
- File type hints (PDF, DOC, DOCX, JPG, PNG)
- Loading state during upload
- Same improvements for Photos section

#### 3. Demo Guide Recurring Bug Fix ✅
- Fixed issue where demo guide was showing on every visit
- Now uses direct localStorage check instead of context function
- Added proper dependency to useEffect

### December 13, 2025

#### 1. Demo/Onboarding Guide for AgentApex ✅
- **Auto-show for new users** on Dashboard
- **Help button (?)** on each page header
- **Next, Previous, Skip** navigation
- **Progress indicator** (step 1/5, etc.)
- **Screen-specific guides**:
  - Dashboard: 5 steps (Welcome, Quick Actions, Post Property, Map Search, Navigation)
  - Post Property: 6 steps (How to post, Type selection, Facing, Price, Location, Submit)
  - Map Search: 5 steps (Search, Toggle modes, Markers, Filters)
  - Requirements: 4 steps (Add requirement, Details, Map visibility)
  - My Properties: 3 steps (Edit, Status)

#### 2. Post Property UI/UX - WhatsApp Chat Style ✅
- **Inline buttons** - Plot/Land buttons immediately after question (not at bottom)
- **Unit buttons first** - Lakhs/Crores and Sq.Yards/Sq.Ft as buttons before input field
- **Chat bubble format** - Questions and answers as chat messages
- **Facing options** for Plot/Land (8 directions)
- **Corner property** checkbox
- **Location step clear** - "Confirm This Location" distinct from POST PROPERTY
- **POST PROPERTY button** - Big green button with summary after location confirm

#### 3. Google-style Map Search ✅
- Auto-suggest from 2 characters
- **Bold matching text** in results (e.g., "**Aliya**ar")
- Location icon + Main text + Secondary text format
- Popular Telugu areas added

#### 4. WhatsApp AI Simulator ✅
- Created `/whatsapp-simulator` page for testing AI agents
- **Reset Conversation** button to re-enable AI when stuck in human_handoff mode
- Fixed "Processing..." issue

#### 5. Post Requirements UI Improvements ✅
- Facing options for Plot/Land
- Corner Plot checkbox
- Lakhs/Crores buttons (not dropdown)
- Full-width input fields
- Bigger fonts for basic education users

---

## In Progress

### P0: WhatsApp Agentic AI Workflow
- **Status**: Webhook working, AI agents partially implemented
- **Blocker**: Leonas API key authentication failing (`realai-whatsapp` key invalid)
- **Requires**: User to provide correct API key from Leonas dashboard (https://wapp.leonas.in/)

### P1: Property Search - Lat/Lng Radius Filtering
- **Status**: NOT STARTED
- **What**: Update `GET /api/properties` to filter by lat/lng radius (20km default)
- **Blocked on**: Google Places integration (now complete)

---

## Completed Features (Continued)

### March 29, 2026

#### AI Response Length Optimization ✅
- Made ALL agent prompts enforce strict 1-2 line, 15-word max replies
- Updated: GreetingAgent, QualificationAgent, InventoryAgent, SiteVisitAgent, BookingAgent, PaymentAgent, KnowledgeAgent
- Reduces AI costs (~₹0.05-0.10/reply instead of ₹0.15-0.30)
- Users can read replies instantly on WhatsApp

#### WhatsApp Production Number Migration ✅
- Updated credentials: Phone +91 96667 06535, REALAPEX Lead Followup
- New permanent token, Phone Number ID: 1052779364584074, WABA ID: 921719600754274
- Production secrets need "Relaunch to update" in Emergent dashboard
- Fixed Google Places autocomplete on 4 pages: `/agentapex/search`, `/agentapex/interest-areas`, `/agentapex/requirements`, `/agentapex/property-edit`
- **Root cause**: Manual Google Places initialization ran once on mount without retry. If API loaded after component mount, autocomplete never worked.
- **Fix**: Replaced manual initialization with reusable `useGooglePlacesAutocomplete` hook (polling-based init, 20 retries at 500ms)
- **Safety timeout**: Added 2-second timeout for `getPlacePredictions` callback (prevents infinite spinner when API key is domain-restricted)
- **Smart fallback**: If Google Places returns empty (timeout/error), automatically falls back to Nominatim (OpenStreetMap)
- **India restricted**: All searches use `componentRestrictions: { country: 'in' }` and `types: ['geocode']`
- **Tested**: All 4 pages pass - autocomplete dropdown appears, location selection works, lat/lng set correctly


### March 31, 2026

#### Property Image Upload Fix ✅
- Fixed: Upload response returns both `url` and `file_url` (frontend was reading undefined `data.url`)
- Frontend uses `data.url || data.file_url` for robustness
- Added: **Emergent Object Storage** - images persist across pod redeployments
- Upload saves to object storage + local disk; serve checks local first then object storage

#### Layout View Location Fix ✅
- PublicLayoutView uses `selectedPlot?.latitude` first, falls back to `project?.latitude`
- Map embed and direction buttons use correct per-plot coordinates

#### AI Location & Link Sharing ✅
- Knowledge retriever includes location, city, state, lat/lng, Google Maps links per plot
- AI shares layout links, project links, plot status summary, and Google Maps directions

#### Confirm This Location Button Removed ✅
- Removed confusing "Confirm This Location" from Post Property page
- Only green "POST PROPERTY" button remains (handles reverse geocode + posting in one click)

---

## Backlog / Future Tasks

### P0 (High Priority)
1. **Obtain correct Leonas API credentials**
   - User must login to https://wapp.leonas.in/ with provided credentials
   - Get correct API key and verify phone_number_id

### P1 (Medium Priority)
1. **Agent Dashboard UI** - Human agents can view AI-led conversations
2. **Module Permissions Frontend** - Connect `useModules` hook to UI
3. **Complete AI Agents Implementation**:
   - GreetingAgent ✅
   - QualificationAgent (partial)
   - InventoryAgent (stub)
   - KnowledgeAgent (stub)
   - SiteVisitAgent (stub)
   - BookingAgent (stub)
   - PaymentAgent (stub)

### P2 (Lower Priority)
1. **Redis/Celery for Scalability** - Replace in-memory conversation state
2. **Whisper Integration** - Voice note processing
3. **Google Calendar Sync** - Site visit scheduling
4. **API Route Conflict** - customer_payments.py vs stripe_payments.py

---

## Code Architecture

```
/app/
├── backend/
│   ├── services/whatsapp_agentic/   # AI workflow
│   │   ├── orchestrator.py          # AI Orchestrator
│   │   ├── agents.py                # AI Agents
│   │   ├── knowledge_retriever.py   # RAG system
│   │   ├── leonas_client.py         # WhatsApp sender
│   │   └── state_machine.py         # Conversation states
│   └── routes/
│       └── whatsapp_webhook.py      # Webhook + Simulator endpoints
└── frontend/
    └── src/agentapex/
        ├── components/DemoGuide.js  # NEW: Onboarding guide
        ├── pages/QuickPropertyPost.js # Chat-style posting
        ├── pages/MapSearch.js       # Google-style search
        └── pages/Requirements.js    # Requirements posting
```

---

## Test Credentials
- **Super Admin**: superadmin@realapex.in / admin123
- **Tenant Admin**: rajam@retoerp.com / 12345678
- **AgentApex User**: Phone 9999999999, Demo OTP shown on screen

---

## 3rd Party Integrations
- **Anthropic Claude** - AI responses (Emergent LLM Key)
- **OpenAI GPT** - AI responses (Emergent LLM Key)
- **Leonas IT Solutions** - WhatsApp BSP (User API Key - BLOCKED)
- **Razorpay/PayU/Stripe** - Payments (User API Keys)

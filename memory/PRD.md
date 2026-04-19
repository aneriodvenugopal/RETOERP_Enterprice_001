# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant Agentic AI workflow for the RealApex platform. Core app is AgentApex - a mobile-first PWA for real estate agents with property management, lead tracking, followup management, and AI-powered WhatsApp sales assistant.

## Architecture
- **Backend**: FastAPI (Python) | **Frontend**: React (CRA) - Mobile-first PWA
- **Database**: MongoDB | **Storage**: Emergent Object Storage
- **APIs**: Meta WhatsApp Cloud API, Google Places Autocomplete
- **WhatsApp AI**: Gemini 2.5 Flash-Lite (primary, cost-optimized) + GPT-4o-mini (fallback for complex reasoning)
- **Theme**: Navy blue (#1a365d) with shield logo branding

---

## Completed Features

### Phase 8 - Auto Follow-up Feature (2026-04-19)
- **Auto Follow-up Service**: Background scheduler (every 30 min) finds leads who showed interest but didn't reply
- **Free-form only**: Sends within 24h Customer Service Window, NO templates (zero cost for messages)
- **Gemini-powered**: Personalized, warm follow-up messages with lead name, conversation context, project data
- **Multi-tenant**: Uses correct tenant's project data for each lead
- **One follow-up per lead per 24h**: No spam, dedup via `whatsapp_followups` collection
- **API Endpoints**: `/followup/run` (batch), `/followup/pending` (preview), `/followup/history`, `/followup/send-one` (manual)
- **Files**: `auto_followup.py` (new), `whatsapp_webhook.py` (endpoints), `server.py` (scheduler)

### Phase 7 - Dual-LLM WhatsApp AI (2026-04-19)
- **Removed Emergent LLM Key** from WhatsApp automation, replaced with user's own API keys
- **LLM Router**: Smart routing - Gemini 2.5 Flash-Lite (primary, $0.10/$0.40 per M tokens) + GPT-4o-mini (fallback for complex reasoning)
- **RealApex Property Expert** personality: Warm, empathetic, Telugu-English mix, privacy-strict
- **RAG Integration**: Pulls tenant's project data, layouts, pricing, amenities, FAQs from database
- **Location Highlights**: Hyderabad areas with RRR, Metro, HMDA, Airport proximity info
- **Cost Tracking**: Per-request cost estimation and LLM stats via `/api/whatsapp/webhook-health`
- **Fault Tolerance**: If one LLM fails, automatically falls back to the other
- **Multi-tenant**: Uses only current tenant's data for responses
- **BUG FIX**: Fixed "stuck conversation" bug - conversations with questions_asked >= 3 were permanently stuck returning "expert will call" on every message. Added stale conversation reset: after lead capture, next message starts fresh conversation.
- **BUG FIX**: Fixed "no project data" bug - WhatsApp webhook was connecting to wrong tenant (empty data). Added smart tenant identification: finds tenant with most projects/properties + auto-creates WABA→tenant mapping.
- **Tenant Mapping API**: `GET/POST /api/whatsapp/tenant-mapping` to view/configure which tenant handles WhatsApp messages.
- **Files**: `llm_router.py` (new), `sales_engine.py` (rewritten), `orchestrator.py` (updated), `whatsapp_webhook.py` (smart tenant ID + context reset + mapping API)

### Phase 6 - Sales Engine Rewrite (2026-04-16)
- **Complete AI rewrite**: Replaced 7-agent question-machine with single DB-first Sales Engine
- **Flow**: User message -> Parse location/budget -> DB search -> Match? Show projects + close -> No match? Max 3 questions -> Lead capture
- **Features**: Location extraction (50+ Indian cities/areas), budget parsing (lakhs/crores), property type detection, option selection (call/visit/details), site visit scheduling, exit detection

### Phase 5 - WhatsApp Webhook & API Fix (2026-04-14 to 2026-04-16)
- **Webhook GET Verification**: Fixed to return plain text challenge
- **Duplicate Message Protection**: In-memory TTL cache deduplicates by message_id
- **Bot Loop Prevention**: Ignores messages from own WhatsApp number
- **Rate Limiting**: Per-phone 5-second cooldown
- **Template Integration**: `follow_up_template`, `leadintroductiontemplate`, `otp_1`
- **API Version**: v21.0, Webhook auto-configured

### Phase 4 - Dashboard Redesign & PWA Fixes (2026-04-03)
- Dashboard Redesign, Logo Update, Property Search Relocation, PWA Manifest Fix, Service Worker

### Phase 3 - Attachments & Radius Search (2026-03-31)
- Property Edit FAB + Attachments, Radius Search 1-50km

### Phase 2 - Property ID & Share System (2026-03-31)
- Property ID system (AX-P-10001), Canvas share cards, QR code, Privacy Policy

### Phase 1 - Core Systems (2026-03-31)
- Property Sharing, Followup System, Lead Pipeline, Profile photo, WhatsApp Invite

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

### In Progress (BLOCKED):
- New WhatsApp Templates (`property_info_update`, `property_followup_update`, `otp_verification_code`, `callback_confirmation`) — Waiting Meta approval

### Upcoming:
- P1: Map radius filtering verification
- P1: Sales Engine enhancements (Auto recommendation, Price negotiation, Urgency messaging)

### Pending Bug Fixes:
| Issue | Status |
|---|---|
| Followup "+" native contacts API | Code updated, not verified on mobile |
| Property Share Card design match | Code updated, needs mobile testing |
| Multiple document upload | Code updated, needs verification |

---

## Key API Endpoints
- `GET /api/whatsapp/webhook-health` (Returns version, LLM engine info, and usage stats)
- `GET /api/whatsapp/webhook` (Meta verification)
- `POST /api/whatsapp/webhook` (Message receiving)
- `POST /api/whatsapp/simulate?phone=X&message=Y` (Test simulator, requires auth)
- `POST /api/whatsapp/simulate/reset/{phone}` (Reset conversation)
- `POST /api/whatsapp/send-followup` / `send-introduction`
- All property, followup, lead, profile endpoints

## WhatsApp Configuration
- WABA: `25977390118562175` (Eloniot Software Solutions)
- Phone: `+91 63093 56590` (ID: `963130426884425`, GREEN quality)
- System User: `REALAPEX_Admin1` (ID: `61580667278343`)

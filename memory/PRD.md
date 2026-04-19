# RealApex Platform - Product Requirements Document

## Original Problem Statement
Build a production-ready, multi-tenant Agentic AI workflow for the RealApex platform. Core app is AgentApex - a mobile-first PWA for real estate agents with property management, lead tracking, followup management, and AI-powered WhatsApp sales assistant.

## Architecture
- **Backend**: FastAPI (Python) | **Frontend**: React (CRA) - Mobile-first PWA
- **Database**: MongoDB | **Storage**: Emergent Object Storage
- **APIs**: Meta WhatsApp Cloud API, Google Places Autocomplete
- **WhatsApp AI**: Gemini 2.5 Flash-Lite (primary) + GPT-4o-mini (fallback)
- **CRM**: Rule-based intent scoring (Cold/Warm/Hot) + Gemini only for Warm/Hot
- **Theme**: Navy blue (#1a365d) with shield logo branding

---

## Completed Features

### Phase 9 - WhatsApp CRM Lead System (2026-04-19)
- **Instant Lead Creation**: Every first WhatsApp message creates CRM lead with phone, message, source, score
- **Rule-based Intent Scoring** (zero AI cost): Cold/Warm/Hot based on keyword matching
- **Structured CRM Extraction**: Name, property type, location, budget, purpose, timeline — all rule-based
- **Property Categories**: Plot, Flat, Apartment, Villa, Farm Land, Commercial, House, Agricultural Land, Venture Unit
- **Hot Lead Alerts**: Instant admin notification for high-intent leads
- **CRM Dashboard**: `/crm/dashboard` — new leads, warm/hot counts, calls needed, site visits
- **CRM Leads API**: `/crm/leads?score=hot` — filterable lead list
- **30-day Auto Archive**: `/crm/archive-stale` — cleans old conversations, keeps CRM data
- **Daily Metrics Tracking**: `crm_daily_metrics` collection tracks all conversion events
- **Cost optimization**: Cold leads get NO Gemini cost, only Warm/Hot trigger AI

### Phase 8 - Auto Follow-up Feature (2026-04-19)
- Background scheduler (every 30 min), free-form messages within 24h window
- Gemini-powered personalized follow-ups, one per lead per 24h
- API: `/followup/run`, `/followup/pending`, `/followup/history`, `/followup/send-one`

### Phase 7 - Dual-LLM + Memory + Project Search (2026-04-19)
- Gemini 2.5 Flash-Lite primary + GPT-4o-mini fallback
- Full long-term conversation memory (last 5 messages to LLM, old summarized)
- Smart project name search (fuzzy/partial/token matching)
- Plot availability table with status icons
- Links use realapex.in (not emergent)
- Smart tenant identification + auto WABA mapping
- Stale conversation reset after lead capture

### Phases 1-6 (Earlier)
- Core PWA, Property CRUD, Lead Pipeline, Followup System
- WhatsApp Webhook, Meta API, Template Integration
- Sales Engine, Dashboard Redesign, PWA fixes

---

## Key API Endpoints
- `GET /api/whatsapp/crm/dashboard` — CRM metrics (auth required)
- `GET /api/whatsapp/crm/leads?score=hot` — CRM leads (auth required)
- `POST /api/whatsapp/crm/archive-stale?days=30` — Archive old conversations
- `POST /api/whatsapp/followup/run?dry_run=true` — Auto follow-up batch
- `GET /api/whatsapp/followup/pending` — Preview pending follow-ups
- `GET /api/whatsapp/tenant-mapping` — View/configure tenant mapping
- `POST /api/whatsapp/webhook` — Meta event receiver
- `GET /api/whatsapp/webhook-health` — Health check with LLM stats

## WhatsApp Configuration
- WABA: `25977390118562175` (Eloniot Software Solutions)
- Phone: `+91 63093 56590` (ID: `963130426884425`)

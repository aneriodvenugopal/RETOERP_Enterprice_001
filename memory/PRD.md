# RETOERP - Real Estate ERP SaaS Platform

## Original Problem Statement
Build a comprehensive Real Estate ERP (RETOERP) SaaS platform for the Indian real estate market, featuring:
- Multi-tenant architecture with RBAC
- Project financial management
- Custom fields system
- AI documentation hub
- Sophisticated layout drawing tool with public sharing

## User Personas
1. **Super Admin**: Platform administrator managing all tenants
2. **Tenant Admin**: Real estate company administrator
3. **Staff/Agent**: Sales and property management staff
4. **Customer**: End buyers viewing and booking properties

## Core Requirements
- Multi-level access control (Super Admin > Tenant Admin > Staff > Customer)
- Project-centric layout management with "Quick Draw" editor
- Public shareable layout views
- Slug-based dynamic category system for master data
- Lead management with follow-up tracking
- Property/plot management with status tracking

---

## What's Been Implemented (As of Jan 12, 2026)

### Phase 0: Core Platform
- [x] Authentication system (OTP + Password login)
- [x] Multi-tenant architecture
- [x] Role-Based Access Control (RBAC)
- [x] User management
- [x] Tenant management

### Phase 1: Project & Layout Management
- [x] Project CRUD operations
- [x] Layout Editor with Quick Draw mode
- [x] Plot drawing with polygon support
- [x] Plot status management (Available, Booked, Blocked, Sold)
- [x] **Public Layout View** - Full-screen shareable view
- [x] **Dynamic ViewBox calculation** - Plot alignment fix (Jan 12, 2026)
- [x] **Plot click modal** - Shows plot details, pricing, amenities
- [x] Status colors standardized across editor and public view

### Phase 1.1: Slug-Based Category System
- [x] MasterCategory model and routes
- [x] Cascading categories (System > Tenant > Project)
- [x] Seed data populated:
  - Lead Sources: Website, IncomeLands App, Walk-in, Referral, Facebook, Google Ads, Phone Call, Email, Agent
  - Lead Statuses: New, Contacted, Interested, Site Visit Scheduled, Negotiation, Converted, Lost
  - Property Statuses: Available, Blocked, Booked, Sold, Resale
  - Property Types: Residential, Commercial, Agricultural, Industrial
  - Payment Modes: Cash, Bank Transfer, Cheque, UPI

### Phase 1.2: Lead Management
- [x] Lead model with source and status tracking
- [x] Lead follow-up model
- [x] Lead conversion workflow
- [x] Lead assignment to staff

### Phase 1.3: Financial System
- [x] Payment tracking
- [x] Bank account management
- [x] Commission tracking models

### Other Features
- [x] SMS integration (MSG91)
- [x] AI Agents integration (OpenAI via Emergent LLM Key)
- [x] Google OAuth integration
- [x] Razorpay integration (configured, not fully tested)

---

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Verify all UI bug fixes (pin size, labels, modal click) across all layouts
- [ ] Create comprehensive test suite for layout editor

### P1 - High Priority
- [ ] Site Visit Management module
- [ ] Booking + Queue System (waitlist for plots)
- [ ] Customer Database enhancement

### P2 - Medium Priority
- [ ] Resale/Release System with auto-marketing
- [ ] Strict EMI Payment module
- [ ] Receipt Generation
- [ ] Vendor Management module

### P3 - Lower Priority
- [ ] Organic Referral & Wallet System
- [ ] Festival Greeting automation (cron jobs)
- [ ] Google Calendar integration for site visits
- [ ] Complaint System

### P4 - Future/Backlog
- [ ] SaaS marketing pages
- [ ] Tenant-specific public pages
- [ ] Project landing pages with custom domains
- [ ] React Native mobile app
- [ ] AI Voice Assistant

---

## Technical Architecture

```
/app/
├── backend/
│   ├── models/       (Pydantic models)
│   ├── routes/       (FastAPI routes)
│   ├── services/     (Business logic)
│   ├── middleware/   (Auth, etc.)
│   └── utils/        (Helpers)
├── frontend/
│   └── src/
│       ├── pages/    (React pages)
│       ├── components/ui/  (Shadcn components)
│       ├── contexts/ (Auth context)
│       └── services/ (API services)
└── memory/           (PRD, CHANGELOG, etc.)
```

## Key Integrations
- **MongoDB**: Primary database
- **OpenAI GPT-4o**: AI features via Emergent LLM Key
- **MSG91**: SMS service (MOCKED in development)
- **Razorpay**: Payment gateway (configured)
- **Google OAuth**: Social login

## Test Credentials
- **Super Admin**: superadmin@retoerp.com / admin123
- **Tenant Admin**: rajam@retoerp.com / 12345678

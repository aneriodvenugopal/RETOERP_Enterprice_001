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

### Phase 1.4: Document Locker (NEW - Jan 12, 2026)
- [x] Physical location master (e.g., OFFICE-STORAGE-1, SITE-OFFICE-RACK-A)
- [x] Document upload (PDF, JPG, PNG, DOC, DOCX)
- [x] Customer details (Name, Mobile - required; Email - optional)
- [x] Manual keyword tagging for search
- [x] Auto-generated physical code (e.g., OFFICE-STORAGE-1-001)
- [x] Physical location visible to Admin/Accountant only
- [x] Search by customer name, mobile, keyword
- [x] Email sharing (manual, no tracking)
- **NO AI, NO automation, NO smart features**

### Phase 1.6: Site Visit Management (NEW - Jan 12, 2026)
- [x] Schedule visits with project, visitor, date/time, assigned staff
- [x] Visit workflow: scheduled -> confirmed -> in_progress -> completed/cancelled
- [x] Visit outcomes: interested, not_interested, needs_followup, booking_initiated, negotiating
- [x] View today's visits and upcoming visits
- [x] Filter by project, status, date range
- [x] Statistics: by status, by outcome, conversion rate
- [x] No-show tracking
- [x] Reschedule support (creates new visit)

### Phase 1.7: Booking Queue System (NEW - Jan 12, 2026)
- [x] Add customers to waitlist for properties
- [x] Queue position management (priority-based)
- [x] Queue workflow: waiting -> notified -> converted/expired/skipped
- [x] Notify customer when property available (48-hour deadline)
- [x] Record customer response (interested/not interested)
- [x] Move up in queue (admin only)
- [x] Cancel/expire queue entries
- [x] Statistics: by status, conversion rate, properties with queue

### Phase 2.1: Customer Database Enhancement (NEW - Jan 12, 2026)
- [x] Full CRUD operations for customers
- [x] Indian Real Estate specific fields (Aadhar, PAN, NRI, Passport)
- [x] Search by name, phone, email
- [x] Filter by status, NRI
- [x] Tags management (add/remove)
- [x] Wallet management (credit/debit with admin controls)
- [x] Purchase history view (bookings, payments)
- [x] Convert lead to customer
- [x] Statistics: total, by status, NRI count, wallet balance

### Phase 2.2: Resale/Release System (NEW - Jan 12, 2026)
- [x] **Property Release** - Return properties to inventory
  - Release reasons: booking_cancelled, payment_default, customer_request, legal_issue
  - Track refund/deduction amounts
  - Notify booking queue when property available
- [x] **Property Resale** - Customer-initiated property sales
  - Approval workflow: pending_approval -> approved -> listed -> sold
  - Commission tracking (configurable percentage)
  - Seller information and pricing management
- [x] **Inquiry Management** - Track buyer inquiries on resale properties
- [x] **Auto-notifications** - Notify interested parties in booking queue
- [x] Statistics: by status, total commission earned
- [x] Full CRUD APIs with authentication

### Phase 2.3: Strict EMI Payment Module (NEW - Jan 12, 2026)
- [x] **EMI Schedule Creation** - Create payment schedules for bookings
  - Configurable down payment and monthly installments
  - Automatic due date calculation
  - Configurable late fee percentage (default 2% per month)
- [x] **Payment Tracking** - Track payments against EMI schedules
  - Status: pending, paid, partial, overdue, waived
  - Payment method tracking (cash, bank_transfer, upi, cheque, razorpay)
  - Receipt number generation
- [x] **Late Fee Management** - Automatic late fee calculation
  - Days overdue tracking
  - Late fee waiver (full or partial) by admin
  - Waiver reason logging
- [x] **Overdue Detection** - Real-time overdue status updates
  - Automatic late fee recalculation
  - Overdue EMI listing with customer details
- [x] **Due Soon Alerts** - EMIs due within specified days
- [x] **Statistics Dashboard** - Collection metrics
  - Total EMIs, collected, pending, overdue
  - Collection rate percentage
  - Late fees accumulated
  - By status breakdown
- [x] Full CRUD APIs with authentication

### Phase 2.4: Receipt Generation (NEW - Jan 12, 2026)
- [x] **Payment Receipt PDF** - Professional PDF receipts for all payments
  - Company branding with logo/header
  - Customer and property details
  - Payment breakdown with late fees if applicable
  - Amount in words (Indian format - Lakhs, Crores)
  - Receipt number and date
  - Digital signature area
- [x] **EMI Schedule PDF** - Downloadable EMI schedule documents
  - Payment progress summary
  - Full installment list with status
  - Color-coded status (paid=green, overdue=red)
- [x] **Receipt History** - Track all generated receipts
- [x] **Regenerate Receipt** - Create new receipt number if needed

### Phase 2.5: Vendor Management (NEW - Jan 12, 2026)
- [x] **Vendor Directory** - Full CRUD for vendors
  - Categories: construction, electrical, plumbing, interior, etc.
  - Contact details, bank info, GSTIN/PAN
  - Status: active, inactive, blacklisted
  - Rating system
- [x] **Bill Management** - Track vendor invoices
  - Bill number, dates, amounts with tax
  - Status: pending, partial, paid, overdue
  - Automatic overdue detection
- [x] **Payment Recording** - Record payments to vendors
  - Multiple payment methods
  - Reference/transaction tracking
  - Automatic bill status updates
- [x] **Statistics Dashboard**
  - Total billed, paid, outstanding
  - Overdue count and amount
  - By category breakdown
  - Monthly payment tracking

### Other Features
- [x] SMS integration (MSG91 - MOCKED)
- [x] AI Agents integration (OpenAI via Emergent LLM Key)
- [x] Google OAuth integration
- [x] Razorpay integration (configured, not fully tested)

---

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Fix plot mapping misalignment between editor and public view
- [x] Document Locker with physical location mapping
- [x] Festival Greetings system

### P1 - High Priority (Completed)
- [x] Site Visit Management module - Schedule, assign, track visits
- [x] Booking + Queue System - Waitlist for properties

### P2 - Medium Priority
- [x] Customer Database enhancement - Full CRUD, search, wallet, purchase history
- [x] Resale/Release System with auto-notifications
- [x] Strict EMI Payment module with late fees
- [x] Receipt Generation (PDF) - Payment & EMI schedule PDFs
- [x] Vendor Management module - Directory, bills, payments

### P3 - Lower Priority
- [x] Organic Referral & Wallet System (Completed Jan 12, 2026)
- [x] Google Calendar integration for site visits (Completed Jan 12, 2026)
- [x] Complaint System (Completed Jan 12, 2026)

### P4 - Future/Backlog
- [x] Festival Greetings Automation - Backend cron job for Jan 26 & Aug 15 (Completed Jan 12, 2026)
- [ ] Finance Module - Banking/Cash Accounts (Already exists - `/bank-accounts`, `/financials`)
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
│   │   ├── document_locker.py (NEW)
│   │   └── festival_greeting.py (NEW)
│   ├── routes/       (FastAPI routes)
│   │   ├── document_locker.py (NEW)
│   │   └── festival_greetings.py (NEW)
│   ├── services/     (Business logic)
│   ├── middleware/   (Auth, etc.)
│   └── utils/        (Helpers)
├── frontend/
│   └── src/
│       ├── pages/    (React pages)
│       │   ├── DocumentLocker.js (NEW)
│       │   └── FestivalGreetings.js (NEW)
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

## Test Reports
- `/app/test_reports/iteration_1.json` - Layout features
- `/app/test_reports/iteration_2.json` - Document Locker, Festival Greetings
- `/app/test_reports/iteration_3.json` - Site Visits, Booking Queue (30/30 tests passed)
- `/app/test_reports/iteration_4.json` - Resale/Release System (17/17 tests passed)
- `/app/test_reports/iteration_5.json` - EMI Payment Module (22/22 tests passed)
- `/app/test_reports/iteration_6.json` - Receipt Generation & Vendor Management (24/24 tests passed)
- `/app/test_reports/iteration_8.json` - Complaint System & Referral/Wallet (33/34 tests passed)

## New Routes Added (Jan 12, 2026)
- `/document-locker` - Document storage with physical location mapping
- `/festival-greetings` - Republic Day & Independence Day greetings
- `/site-visits` - Site visit management
- `/booking-queue` - Property waitlist management
- `/customers-management` - Customer database with wallet
- `/resale-release` - Resale/Release management system
- `/emi-payments` - EMI payment tracking and management
- `/vendor-management` - Vendor directory, bills, and payments
- `/complaints` - Customer complaint management system (NEW)
- `/referral-wallet` - Referral program & customer wallet (NEW)

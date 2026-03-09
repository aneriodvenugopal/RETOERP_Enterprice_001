# RealApex - Infrastructure for Real Estate Operations

## Original Problem Statement
Build a comprehensive Real Estate ERP (RealApex) SaaS platform for the Indian real estate market, featuring:
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

## What's Been Implemented (As of December 6, 2026)

### NEW: AgentApex Mobile Property App Integration (December 6, 2026)
- [x] **AgentApex Mobile App** (`/agentapex`) - Mobile-first property management app
  - OTP-based authentication (separate from RealApex auth)
  - Dashboard with stats (Properties, Leads, Follow-ups, Saved)
  - Property posting with map location
  - Lead management
  - Follow-ups tracking
  - Favorites/Saved properties
  - Requirements posting
  - Document management per property
  - Voice property posting (Whisper integration)
  - AI Area Intelligence (GPT-4o integration)
  - Instagram-style bottom navigation
  - [x] **Bug Fixes (Mar 7, 2026)**:
    - Dropdown mandatory validation in property post chat
    - Navigation URL prefix fixes in MyProperties.js
    - Documents page routing verified working
  - [x] **Enhancements (Mar 8, 2026)**:
    - MapSearch: Price markers on map (₹50L, ₹85L format) - clickable with popup
    - Property Post: Plot on left, Land on right (Land more common)
    - Property Post: Faster animation delays (200ms/300ms vs 400ms/600ms)
    - Property Post: Better touch feedback with framer-motion
    - Follow-up Module: Complete revamp with multiple statuses
      - Status options: Interested, Not Interested, Reschedule, Follow-up Again
      - Notes/feedback per follow-up
      - Reschedule with date/time picker
      - Follow-up history view
      - Location/area field for contacts
    - Contact Reveal Payment: Razorpay integration
      - Non-owners see "View Contact ₹X" button
      - Payment flow with Razorpay checkout
      - Contact revealed after successful payment
      - Already-paid users see contact directly
    - **Interest Areas (Saved Locations)**:
      - Save favorite locations for property alerts
      - Set radius (2, 5, 10, 20 km) and property types
      - Min/Max price filters
      - Toggle notifications per area
      - Max 10 interest areas per user
    - **Notifications System**:
      - Auto-notify when new properties match interest areas
      - Unread badge on Dashboard menu
      - Mark as read / Mark all read
      - Click notification to view property
    - **Requirements with Location**:
      - Buyer requirements can now have lat/lng coordinates
      - Show as blue markers on MapSearch (Wanted tab)
  - [x] **Map Enhancements (Mar 8, 2026)**:
    - My Location button (Crosshair icon) to center on user's current location
    - Auto-request location permission on app load
    - LocationContext auto-requests location when permission is 'prompt' or 'granted'
    - Default fallback to Hyderabad coordinates if location unavailable
  - [x] **Share App Feature**:
    - Web Share API integration for native mobile sharing
    - Clipboard fallback for unsupported browsers
    - Share menu item in Dashboard
- [x] **YouTube Content Generator (Mar 8, 2026)** (`/realapex-demos`)
  - AI-powered YouTube script generation using Claude
  - 6 content categories: Property Tips, Area Reviews, Market Updates, Investment Guide, Legal Tips, Success Stories
  - Tone options: Professional, Friendly, Motivational
  - Language support: English, Hindi, Telugu, Hinglish
  - Emotional Intelligence toggle for storytelling hooks
  - Content history with Copy/View/Delete actions
  - **Publish as SEO Article** feature with custom slug
  - FREE for users (uses Emergent LLM Key)
- [x] **SEO Articles Pages (Mar 8, 2026)** (`/articles`)
  - Public articles listing page with category filters
  - Single article view with metadata, content, and share buttons
  - Markdown-like rendering for headings, lists, paragraphs
  - SEO meta tags (og:title, og:description, twitter:card)
  - CTA sections promoting AgentApex
- [x] **Follow-ups UI Polish (Mar 8, 2026)**
  - Improved Add Note sheet with proper input styling
  - Better date/time picker styling with rounded corners
  - Gradient button with hover effects
- [x] **UI Fixes - Sticky Buttons (Mar 9, 2026)**
  - Interest Areas form: Sticky "Save & Get Alerts" button always visible at bottom
  - Documents upload form: Sticky "Upload Document" button always visible
  - Fixed drawer max-height from 90vh to 85vh for better mobile viewing
  - Added Leaflet marker CSS for better visibility and hover effects
- [x] **PWA Install Prompt (Mar 9, 2026)**
  - Install banner shows on Dashboard for mobile users
  - "Install" and "Later" options
  - iOS detection with specific instructions ("Tap Share → Add to Home Screen")
  - Auto-hides if already installed in standalone mode
- [x] **SaaS Admin Module Permissions (Mar 9, 2026)**
  - Super admin can enable/disable modules for each tenant
  - 26 modules organized by category (Core, Sales, Finance, Communication, Tools, Marketing, Support)
  - Toggle switches for individual modules and bulk enable/disable per category
  - Core modules (Dashboard, Settings) always enabled
  - API endpoints: `/api/saas-admin/modules`, `/api/saas-admin/tenants/{id}/modules`, `/api/saas-admin/my-modules`
  - Admin UI at `/admin/tenants/{id}/modules` with gear icon in tenant list
- [x] **AgentApex Admin Module** (`/admin/agentapex`) - SaaS admin management
  - Overview tab with user/property/lead/requirement stats
  - Users tab with search and table view
  - Properties tab with search and filtering
  - Leads tab with status management
  - [x] **Settings tab (Mar 8, 2026)**: Contact reveal pricing
    - Dynamic contact view price setting (default ₹10)
    - Enable/disable toggle
    - Settings saved to database
- [x] **AgentApex Backend APIs** (`/api/agentapex/*`)
  - Auth: send-otp, verify-otp, me, profile
  - Properties: CRUD, images, documents
  - Leads: create, list, status update
  - Follow-ups: CRUD
  - Favorites: add, remove, list
  - Requirements: CRUD
  - Conversation flow for guided property posting
  - Admin endpoints for user/lead/stats management
- [x] **Separate MongoDB Collections**: agentapex_users, agentapex_properties, agentapex_leads, agentapex_followups, agentapex_favorites, agentapex_requirements, agentapex_files, agentapex_conversations

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
- [x] Site Visit SMS/WhatsApp/Email Reminders (Completed Jan 12, 2026)
- [x] Global Header with User Info & Logout (Completed Jan 12, 2026)
- [x] Dashboard Stats with Real Data (Completed Jan 12, 2026)
- [x] UI Enhancement: Clickable Stat Cards across all pages (Completed Jan 12, 2026)
- [x] UI Enhancement: Click-to-filter functionality (Completed Jan 12, 2026)
- [x] UI Enhancement: Clickable phone/email links (Completed Jan 12, 2026)
- [x] UI Enhancement: Better hover effects on list rows (Completed Jan 12, 2026)
- [x] Brand Name Change: RETOERP → ExlainERP → RealApex (Completed Jan 22, 2026)
- [x] Custom Logo: RealApex logo with building/pyramid icon integrated (Completed Jan 22, 2026)
- [x] Logo Icon Fixed: Building2 icon for real estate (Completed Jan 12, 2026)
- [x] SaaS Marketing Landing Page at /saas (Completed Jan 12, 2026)
- [x] Demo Request Backend API: POST /api/public/demo-request (Completed Jan 12, 2026)
- [x] Contact Inquiry Backend API: POST /api/public/contact-inquiry (Completed Jan 12, 2026)
- [x] Tenant Public Pages at /t/{tenantId} (Completed Jan 12, 2026)
- [x] **Payments Dashboard** - Comprehensive payment tracking dashboard (Completed Jan 12, 2026)
  - Overview stats: Total Collection, Pending Amount, Overdue, Late Fees
  - Collection Target progress tracking
  - Tabs: Overview, Overdue, Due Soon, By Project
  - EMI Status Breakdown chart
  - Quick Actions for collections
- [x] **Commission Analytics Dashboard** - Enhanced commission tracking system (Completed Jan 12, 2026)
  - Overview stats: Total Commission, This Month, YTD, Pending Payout
  - TDS (Tax Deducted at Source @ 5%) tracking for Indian compliance
  - Monthly/Quarterly trends charts
  - Top performers leaderboard
  - Project-wise commission breakdown
  - Staff performance details
  - Commission by Type (Direct vs Gap)
- [x] **Project Landing Pages** - Public pages for each project (Completed Jan 12, 2026)
  - Accessible at `/p/{project_id}` without authentication
  - Hero section with project name, location, type, description
  - Stats bar: Starting Price, Total Units, Available, Status
  - Availability progress bar with color-coded segments
  - Tabs: Overview, Properties, Amenities
  - Property grid with filter by status and view modes (grid/list)
  - Property detail modal on click
  - Inquiry form that creates leads automatically
  - Developer info with link to tenant page
  - TenantPublicPage projects now link to project pages
- [x] **SEO Optimization** - Complete SEO implementation for public pages (Completed Jan 12, 2026)
  - Static meta tags in index.html (fallback for SSR-less React)
  - Open Graph tags for Facebook/LinkedIn sharing
  - Twitter Card tags for Twitter sharing
  - Meta description and keywords
  - SEOHead component with react-helmet-async
  - JSON-LD structured data generators for projects, organizations, properties
  - FAQ structured data for landing page
  - Breadcrumb structured data
- [x] **Enhanced Authentication** - Hybrid auth system (Completed Jan 13, 2026)
  - Phone + Password login (primary) - Working ✅
  - Google OAuth integration (Emergent-managed) - Working ✅
  - Forgot Password flow with OTP - Working ✅
  - JWT tokens with session management - Working ✅
  - AuthCallback component for OAuth redirect handling
  - Proper redirect URL to /auth/callback for Google OAuth
  - **Remember Me functionality** - 30-day session persistence ✅

- [x] **Stripe Payment Gateway Integration** (Completed Jan 13, 2026)
  - Payment packages: booking_token (₹50,000), booking_advance (₹1,00,000), emi_standard, custom
  - Stripe Checkout integration via emergentintegrations library
  - Payment transaction tracking in MongoDB
  - Stripe Payments admin page at /stripe-payments
  - Payment Success/Cancelled pages with polling status
  - PaymentButton reusable component for initiating payments
  - Webhook endpoint at /api/webhook/stripe
  - **Dashboard Integration**: Stripe Payments card in Dashboard navigation ✅
  - **Bookings Integration**: "Pay Online" tab with quick payment options ✅
    - Pay ₹50,000 Token button
    - Pay ₹1,00,000 Advance button
    - Custom amount payment
    - Pay Full Pending Amount button

- [x] **Email Notifications (Resend Integration)** (Completed Jan 14, 2026)
  - Resend email provider integration with mock fallback
  - 8 email templates: welcome, otp, password_reset, booking_confirmation, payment_confirmation, payment_reminder, site_visit, lead_inquiry
  - Email Management admin page at /email-management
  - Dashboard card for quick access
  - Features:
    - Send test emails with any template
    - Preview email templates
    - Email logs with pagination
    - Email statistics dashboard
    - Mock mode warning banner when API key not configured
  - Backend integration: password reset now sends email + SMS

- [x] **SaaS Subscription & Billing (Stripe)** (Completed Jan 14, 2026)
  - 3 subscription packages: Starter (₹999), Pro (₹2,999), Enterprise (₹9,999)
  - Stripe checkout for subscription payments
  - Invoice history tracking
  - Subscription management (cancel at period end, reactivate)
  - Billing page at /billing with usage metrics
  - Dashboard card for quick access
  - Features:
    - Current plan status with usage progress bars
    - Monthly and yearly billing options (17% savings)
    - Package comparison with feature checkmarks
    - Automatic credit reset on subscription activation
    - Payment confirmation emails

- [x] **SaaS Usage Limits Enforcement** (Completed Jan 16, 2026)
  - Middleware enforcement for projects, users, properties, and leads
  - Returns 403 with LIMIT_EXCEEDED code when limits exceeded
  - Error response includes: code, message, limit_type, current_usage, limit, upgrade_url
  - Subscription package limits:
    - Starter: 3 projects, 2 users, 50 properties, 100 leads/month
    - Pro: 15 projects, 10 users, 500 properties, 500 leads/month
    - Enterprise: Unlimited
  - Frontend UsageLimitBanner component for displaying limit errors
  - Usage warning banners for near-limit scenarios (80%+)
  - GET /api/subscriptions/usage-check endpoint for pre-flight checks

- [x] **Block Location Editor** (Completed Jan 15, 2026)
  - Admin page at /block-locations for configuring GPS coordinates per block
  - Projects sidebar with search functionality
  - Block cards showing location status (Set/Pending)
  - Google Places Autocomplete for location search
  - Manual lat/lng input fields
  - Embedded Google Maps preview in edit mode
  - Progress tracking: Total Blocks, Locations Set, Completion %
  - Location hierarchy: property > block > project
  - Certified Property Page shows "Source: block" badge when inheriting from block
  - Features:
    - Edit mode with Save/Cancel buttons
    - Save All Locations bulk action
    - "View Public Page" link to project page
    - Location Hierarchy info banner

- [x] **Property Certified Settings** (Completed Jan 17, 2026)
  - Admin page at /property/:propertyId/settings for per-property configuration
  - Location Tab: Override block/project location with property-specific GPS
  - Images Tab: Add property-specific images via URL (fallback to project images)
  - Videos Tab: Add property-specific videos/YouTube links (fallback to project videos)
  - Certify Property button to mark property as verified
  - Preview button to view public certified page
  - Location hierarchy display (Property > Block > Project)
  - Toggle switch to enable/disable property-specific location
  - Google Maps preview for location verification

- [x] **PDF Generation Service** (Completed Jan 17, 2026)
  - Professional PDF generation using reportlab library
  - Booking Confirmation Letter - Full booking details with payment schedule
  - Payment Receipt - Transaction receipt with amount in words
  - Payment Schedule/EMI Statement - Installment breakdown with status
  - Property Allotment Letter - Formal allotment document
  - Customer Statement - Account summary with all transactions
  - Company branding (name, address, phone, email) from tenant settings
  - APIs: GET /api/pdf/booking-confirmation/:id, /payment-receipt/:id, /payment-schedule/:id, /allotment-letter/:id
  - Download buttons in Bookings page (Details dialog)
  - Download buttons in Customer Dashboard (Properties and Payments)

- [x] **File Upload Service** (Completed Jan 17, 2026)
  - Comprehensive file upload system for property media, customer documents, agreements
  - Supported file types: Images (jpg, png, webp, gif), Documents (pdf, doc, docx, xls, xlsx), Videos (mp4, webm, mov)
  - File validation with type and size limits (Images: 10MB, Documents: 20MB, Videos: 100MB)
  - Automatic thumbnail generation for images
  - Upload contexts: property_media, customer_document, agreement, payment_proof, project_media, profile, general
  - Security: Path traversal protection, authentication required on all endpoints
  - APIs: 
    - POST /api/files/upload - Single file upload
    - POST /api/files/upload/multiple - Multiple files (up to 10)
    - GET /api/files/ - List files with filters
    - GET /api/files/{context}/{tenant_id}/{filename} - Serve files
    - DELETE /api/files/{file_id} - Soft delete
    - GET /api/files/property/{property_id} - Get property media
    - GET /api/files/customer/{customer_id} - Get customer documents
  - FileUploader.js React component with drag-and-drop support
  - FileGallery.js component for displaying uploaded files
  - Integration in PropertyCertifiedSettings page for property images

- [x] **Unified Customer Login (First Principles)** (Completed Jan 19, 2026)
  - Single login page for all users (staff, admin, customers)
  - Phone + OTP login now works for BOTH registered users AND property buyers (customers)
  - `/api/auth/send-otp` checks both `users` and `customers` collections
  - `/api/auth/verify-otp` returns `account_type: "customer"` for property buyers
  - Customers automatically redirected to `/customer-dashboard`
  - PrivateRoute updated to allow customer portal sessions
  - AuthContext updated to handle customer sessions without breaking regular auth
  - Customer Dashboard shows: Portfolio value, pending payments, bookings, properties, payment schedules, resale requests

- [x] **Project Pricing Configuration** (Completed Jan 17, 2026)
  - Project-level pricing settings for Indian real estate
  - Unit types: sq.yard, sq.ft, acre, gunta, cent, bigha, marla, kanal, plot, unit
  - Base price per unit with flexible unit selection
  - Booking amount: Fixed OR Percentage of total (with min/max limits)
  - Additional charges: Both fixed amount AND percentage options
  - Quick-add presets: Registration, Stamp Duty, GST, Documentation Fee, etc.
  - Property-level override: Premium/discount for corner plots, road-facing
  - Real-time price calculator with breakdown
  - Apply to all properties in project
  - APIs:
    - GET /api/project-pricing/unit-types - Available unit types
    - GET /api/project-pricing/charge-presets - Preset charges
    - GET /api/project-pricing/project/{id} - Get pricing config
    - POST /api/project-pricing/project/{id} - Create/update config
    - PATCH /api/project-pricing/project/{id} - Partial update
    - POST/DELETE /api/project-pricing/project/{id}/charges - Manage charges
    - GET /api/project-pricing/property/{id}/breakdown - Price breakdown
    - POST /api/project-pricing/project/{id}/apply-to-properties - Bulk apply
  - Frontend: /projects/:projectId/pricing

- [x] **Voters Data Import Tool** (Completed Jan 24, 2026)
  - PDF file upload with browse option
  - Village and Ward mapping interface  
  - Column-based PDF extraction for Ward Photo Voter List format
  - Automatic data extraction: EPIC No, Name, Father/Husband Name, Age, Gender, House Number, Ward
  - Multi-ward support with dynamic URLs: `/voterslist/{village}/ward/{ward_no}`
  - Stats dashboard showing total voters, gender distribution
  - View and manage imported data by ward
  - Delete/replace functionality per village/ward
  - APIs:
    - POST /api/voters/upload-pdf - Upload and process PDF
    - GET /api/voters/villages - List available villages
    - GET /api/voters/wards - List wards for village
    - GET /api/voters/stats - Get voter statistics
    - DELETE /api/voters/clear - Clear voter data
  - Frontend: /voters-import (Import tool), /voterslist/{village}/ward/{wardNo} (View list)
  - Extracted 960 voters from Ward 1 PDF (out of 974), 889 voters from Ward 13 PDF (up from 314)

- [x] **Voters List Enhanced Features** (Completed Jan 24, 2026)
  - **Missing Records Detection**: After PDF import, shows incomplete records count
  - **Bulk Update Screen** (`/voters-bulk-update`):
    - Filter by ward and status (all, incomplete, complete, missing_name, missing_age)
    - Shows records with missing fields highlighted
    - Shows which fields are missing per record
    - Status badges: Complete (green), Partial (yellow), Incomplete (red)
    - Edit modal to update all voter fields
    - Add new voter manually
  - **Admin Settings Page** (`/voters-admin`):
    - Ward-wise visibility toggle (Show/Hide from users)
    - Ward-wise export enable/disable
    - View ward voter counts
    - Delete ward data
    - Status indicators (Active/Hidden)
  - **Ward Access Control**:
    - One User = One Ward model support
    - Admin can toggle ward visibility for regular users
    - Hidden wards only visible to admins
  - **Ward-wise Export Control**:
    - Enable/disable Excel export per ward
    - Export blocked returns 403 error
  - New APIs:
    - GET /api/voters/admin/settings - Get all ward settings
    - POST /api/voters/admin/ward-settings - Update ward visibility/export
    - GET /api/voters/visible-wards - Get visible wards for users
    - GET /api/voters/incomplete-stats - Stats for incomplete records
    - GET /api/voters/list-with-status - List voters with completeness status
    - PUT /api/voters/update-full/{epic_no} - Update all voter fields
  - Frontend pages:
    - `/voterslist-import` - Ward-wise import (shows incomplete count)
    - `/voters-bulk-update` - View and update incomplete records
    - `/voters-admin` - Super admin ward settings

- [x] **Booking System Bug Fixes** (Completed Jan 27, 2026)
  - **Property Loading Fix**: Fixed property dropdown not loading when project is selected
    - Root cause: Incorrect status filter using `status_id.includes('available')` instead of UUID matching
    - Solution: Fetch property statuses and match by `slug === 'available'`
    - Files updated: `frontend/src/pages/Bookings.js` (handleProjectChange function)
  - **Bank Account Selection for Payments**: Added bank account selection to payment recording
    - New "Receive Payment To" dropdown in Record Payment tab
    - Bank account balance automatically updated when payment is recorded
    - Transaction record created for audit trail
    - Validation message when no bank accounts configured
    - Files updated: `frontend/src/pages/Bookings.js`, `backend/routes/bookings.py`, `backend/models/payment.py`

- [x] **Customer Dashboard Enhancements** (Completed Jan 30, 2026)
  - **Enhanced "My Properties" View**: Complete redesign with better UX
    - Property cards with gradient backgrounds and status badges
    - Payment progress bars showing paid vs total amount
    - Financial summary: Total Value, Paid Amount, Pending
    - Property details grid: Area, Facing
    - Quick actions: View Allotment Letter, Schedule PDF, View Payment Schedule
    - Resale request status display
  - **"Pay Now" Button Integration**: Online payment for EMI schedules
    - New backend endpoint: `POST /api/bookings/pay-now`
    - Creates Stripe checkout session for pending installments
    - Shows Pay Now button on pending/overdue schedules
    - Status check endpoint: `GET /api/bookings/schedule/{id}/pay-status`
  - **Project Detail Link to Pricing**: Added "Pricing Settings" button
    - Quick navigation from ProjectDetail to ProjectPricingSettings
    - Green button with DollarSign icon next to Share Layout button
  - Files updated:
    - `frontend/src/pages/CustomerDashboard.js` (My Properties, Payment Schedule tabs)
    - `frontend/src/pages/ProjectDetail.js` (Pricing Settings button)
    - `backend/routes/bookings.py` (pay-now, pay-status endpoints)

- [x] **Marketing Agents Management System** (Completed Jan 30, 2026)
  - **Full Agent Management**:
    - Add/Edit/Disable/Delete marketing agents
    - Track agent status (active/inactive/terminated)
    - Store bank details (account, IFSC, UPI) for payments
    - Commission rate configuration per agent
  - **Commission Tracking**:
    - Record sales attributed to agents
    - Automatic commission calculation based on rate
    - Track paid vs due amounts
    - Project-wise sales breakdown
  - **Payment Management**:
    - Record commission payments with receipt numbers
    - Payment modes: UPI, Cash, Bank Transfer, Cheque
    - Bank account integration for fund deduction
    - Payment history per agent
  - **Dashboard Stats**:
    - Total agents, active count
    - Total commission earned/paid/due
    - This month sales and commission
  - **API Endpoints**:
    - `GET /api/marketing-agents/` - List agents with stats
    - `GET /api/marketing-agents/stats` - Overview statistics
    - `POST /api/marketing-agents/` - Create agent
    - `PUT /api/marketing-agents/{id}` - Update agent
    - `DELETE /api/marketing-agents/{id}` - Soft delete
    - `GET /api/marketing-agents/{id}/sales` - Agent's sales list
    - `GET /api/marketing-agents/{id}/sales/by-project` - Project breakdown
    - `GET /api/marketing-agents/{id}/payments` - Payment history
    - `POST /api/marketing-agents/payments` - Record payment
  - **Files Created/Updated**:
    - `backend/routes/marketing_agents.py` (New - Complete CRUD + Commission APIs)
    - `frontend/src/pages/MarketingAgentsManagement.js` (New - Full UI)
    - `frontend/src/App.js` (Route added)
    - `frontend/src/pages/Dashboard.js` (Link updated)

- [x] **WhatsApp Auto-Reply System** (Completed Jan 30, 2026)
  - **Auto-Reply Features**:
    - Keyword-based intent detection (price, location, visit, availability, payment)
    - Multi-language support (English, Telugu, Hindi)
    - Business hours aware (10 AM - 6 PM IST)
    - After-hours auto-response
  - **Lead Capture**:
    - Automatic lead creation from WhatsApp messages
    - Intent tracking for analytics
    - Phone number deduplication
  - **Templates**:
    - Welcome message, After hours, Price inquiry
    - Site visit scheduling, Availability info
    - Payment options, Lead captured confirmation
  - **API Endpoints**:
    - `POST /api/whatsapp/webhook` - Incoming message handler
    - `GET /api/whatsapp/auto-reply/templates` - View templates
    - `GET /api/whatsapp/messages` - Message history
    - `GET /api/whatsapp/stats` - Messaging statistics
  - **Files Created**:
    - `backend/services/whatsapp_auto_reply.py` (Auto-reply logic)
    - `backend/routes/push_notifications.py` (WhatsApp webhook routes)

- [x] **Web Push Notification Service** (Completed Jan 30, 2026)
  - **Push Subscription Management**:
    - Save/remove browser push subscriptions
    - Multi-device support per user
    - Subscription expiry handling
  - **Notification Features**:
    - Send push with title, body, icon, actions
    - SMS fallback when push fails
    - Quiet hours configuration
    - Notification preferences per user
  - **API Endpoints**:
    - `GET /api/push-notifications/vapid-public-key` - Get VAPID key
    - `POST /api/push-notifications/subscribe` - Save subscription
    - `POST /api/push-notifications/unsubscribe` - Remove subscription
    - `GET /api/push-notifications/preferences` - Get user preferences
    - `PUT /api/push-notifications/preferences` - Update preferences
    - `POST /api/push-notifications/send` - Send notification (admin)
    - `POST /api/push-notifications/test` - Test push
  - **Files Created**:
    - `backend/services/web_push_service.py` (Push + SMS fallback)
    - `backend/routes/push_notifications.py` (Push notification routes)

- [x] **Booking UI Wizard-Based Flow** (Completed Jan 31, 2026)
  - **4-Step Booking Wizard**:
    - Step 1: Customer Selection (Search existing or Create new)
    - Step 2: Property Selection (Project dropdown + visual property cards)
    - Step 3: Payment Plan (Full/EMI/Custom with auto EMI calculation)
    - Step 4: Review & Confirm
  - **Quick Payment Modal**:
    - Phone number search → Auto-fetch bookings
    - Select booking → Enter amount → Select bank → Record (3 clicks!)
    - Floating green button always accessible on Bookings page
  - **UI Improvements**:
    - Progress indicators showing current step
    - Visual property selection cards with price and area
    - EMI calculator built-in
    - Confirmation summary before booking creation
  - **Files Created**:
    - `frontend/src/components/BookingWizard.js` (4-step wizard)
    - `frontend/src/components/QuickPayment.js` (Fast payment recording)
  - **Files Updated**:
    - `frontend/src/pages/Bookings.js` (Integrated wizard + quick payment)

- [x] **Marketing Agents Flow Tested** (Completed Jan 31, 2026)
  - Created test agent: "Raju Kumar" (9876543210)
  - Recorded sale: ₹15,00,000 → Commission: ₹37,500 (2.5%)
  - Recorded payment: ₹15,000 via UPI
  - Verified stats display correctly on dashboard

- [x] **Property Categories System Fixed & Seeded** (Completed Jan 31, 2026)
  - **Master Categories (8 categories, 30 subcategories)**:
    1. Residential Plots: Villa, Independent House, Gated Community, Farm House
    2. Commercial Plots: Shop, Office Space, Warehouse, Industrial
    3. Agricultural Land: Farm Land, Orchard, Plantation
    4. Mixed Use: Residential+Commercial, Live-Work Spaces
    5. Premium/Luxury: Lake View, Hill View, Highway Facing, Corner Plots
    6. Layout Types: DTCP, HMDA, LP, RERA, Panchayat Approved
    7. By Facing: East, North, West, South
    8. By Size: Small, Medium, Large, Extra Large
  - **Tenant Categories (Custom)**:
    - Premium Ventures: Lake Front Premium, Hill View Premium
  - **API Fixes**:
    - Added `/property-categories/` prefix to all routes
    - Fixed MongoDB `_id` serialization issues
    - Fixed frontend API path mismatches
  - **Files Updated**:
    - `backend/routes/property_categories.py` (Complete rewrite with prefix)
    - `backend/scripts/seed_property_categories.py` (New seed script)
    - `frontend/src/pages/admin/MasterCategoryManagement.js` (API paths fixed)
    - `frontend/src/pages/admin/TenantCategoryManagement.js` (API paths fixed)

- [x] **Property Edit Tabbed UI** (Completed Feb 3, 2026)
  - **5-Tab Edit Modal** (Mirrors frontend customer view exactly):
    - Details Tab: Plot Number, Block, Area, Unit, Facing, Dimensions, Status, Legal & Certification
    - Gallery Tab: Upload property images, set cover image, remove images
    - Videos Tab: Add YouTube URLs, preview thumbnails, manage video list
    - Location Tab: GPS coordinates (lat/long), Google Maps embed, get current location
    - Pricing Tab: Total price, price per sq.ft, booking amount, "Contact for Price" toggle
  - **UX Improvements**:
    - Admin edit UI matches frontend tabs exactly - "What you see is what you edit"
    - Preview mode shows customer view before saving
    - Image upload with drag-and-drop support
    - YouTube thumbnail auto-extraction
    - Live Google Maps preview for coordinates
  - **Backend Updates**:
    - `PropertyUpdate` model extended with new fields (property_images, property_videos, latitude, longitude, booking_amount, contact_for_price, certification fields)
    - `Property` model updated with booking_amount and contact_for_price fields
  - **Files Created**:
    - `frontend/src/components/PropertyEditTabs.js` (New tabbed edit component)
  - **Files Updated**:
    - `frontend/src/pages/ProjectDetail.js` (Integrated PropertyEditTabs)
    - `backend/models/property.py` (Extended models)

- [x] **SMS & WhatsApp DLT Templates** (Completed Feb 3, 2026)
  - **17 SMS Templates** for DLT approval:
    - OTP, Token Payment, Booking Confirmed, Payment Received/Reminder/Overdue
    - EMI Reminder/Received, Site Visit Scheduled/Reminder
    - Lead Welcome, Document Request/Ready
    - Staff Lead Assignment, Staff Follow-up Reminder
    - Project Launch, Special Offer
  - **16 WhatsApp Business Templates**:
    - Same categories as SMS but with rich formatting
    - Line breaks for better readability
    - No emojis (often rejected by DLT)
  - **Template Best Practices**:
    - Single variable per logical unit
    - No consecutive variables
    - Clear purpose statement
    - ELNIOT SOFTWARE signature
    - Indian format (Rs. not ₹)
  - **Files Created**:
    - `/app/memory/WHATSAPP_DLT_TEMPLATES.md` (Formatted templates)
    - `/app/memory/SMS_WHATSAPP_TEMPLATES_PLAIN.md` (Plain text with samples)


### P4 - Future/Backlog
- [x] Festival Greetings Automation - Backend cron job for Jan 26 & Aug 15 (Completed Jan 12, 2026)
- [x] SaaS marketing pages - /saas landing page (Completed Jan 12, 2026)
- [x] Tenant-specific public pages - /t/{tenant_id} (Completed Jan 12, 2026)
- [x] Project landing pages - /p/{project_id} (Completed Jan 12, 2026)
- [ ] Finance Module - Banking/Cash Accounts (Already exists - `/bank-accounts`, `/financials`)
- [ ] Custom domain support for tenant/project pages
- [ ] React Native mobile app
- [ ] AI Voice Assistant

### Pending/Upcoming Tasks
- [x] **P1: Customer Self-Service Portal** - Completed Jan 17, 2026
- [ ] **P1: Reports & Export Module** - Export data to Excel/PDF
- [ ] **P1: Audit Trail** - System-wide activity logging

### Blocked Items
- [ ] Real Email Integration - Waiting for `RESEND_API_KEY` (Currently in MOCK mode)
- [ ] Real SMS Integration - Waiting for DLT template approval
- [ ] WhatsApp Business API - Needs Meta Business credentials

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
- **Super Admin**: superadmin@realapex.com / admin123
- **Tenant Admin (phone)**: 9908290239 / 12345678
- **Tenant Admin (email)**: rajam@retoerp.com / 12345678

## Test Reports
- `/app/test_reports/iteration_32.json` - SEO Articles & UI Polish (Mar 8, 2026) - 100% frontend, 83% backend (1 minor fix applied)
- `/app/test_reports/iteration_31.json` - P0/P1/P2 Fixes: YouTube Content, Bank Accounts, Map Location (Mar 8, 2026) - 100% pass
- `/app/test_reports/iteration_29.json` - Interest Areas & Notifications (Mar 8, 2026) - 100% pass, 10/10 pytest tests
- `/app/test_reports/iteration_28.json` - AgentApex Enhancements (Mar 8, 2026) - 100% pass
- `/app/test_reports/iteration_27.json` - AgentApex Bug Fixes (Mar 7, 2026) - 100% pass
- `/app/test_reports/iteration_1.json` - Layout features
- `/app/test_reports/iteration_2.json` - Document Locker, Festival Greetings
- `/app/test_reports/iteration_3.json` - Site Visits, Booking Queue (30/30 tests passed)
- `/app/test_reports/iteration_4.json` - Resale/Release System (17/17 tests passed)
- `/app/test_reports/iteration_5.json` - EMI Payment Module (22/22 tests passed)
- `/app/test_reports/iteration_6.json` - Receipt Generation & Vendor Management (24/24 tests passed)
- `/app/test_reports/iteration_8.json` - Complaint System & Referral/Wallet (33/34 tests passed)
- `/app/test_reports/iteration_9.json` - Payments Dashboard (7/7 backend + full frontend pass)
- `/app/test_reports/iteration_10.json` - Commission Analytics Dashboard (10/10 backend + full frontend pass)
- `/app/test_reports/iteration_11.json` - Project Landing Pages (18/18 backend + full frontend pass)
- `/app/test_reports/iteration_14.json` - Email Notifications (21/21 tests passed)
- `/app/test_reports/iteration_15.json` - SaaS Subscription & Billing (25/25 tests passed)
- `/app/test_reports/iteration_16.json` - Block Location Editor (15/15 tests passed)
- `/app/test_reports/iteration_17.json` - SaaS Usage Limits Enforcement (14/14 tests passed)
- `/app/test_reports/iteration_18.json` - Certified Property Settings (13/13 tests passed)
- `/app/test_reports/iteration_19.json` - PDF Generation Service (13/13 tests passed)

## New Routes Added (Jan 12, 2026)
- `/document-locker` - Document storage with physical location mapping
- `/festival-greetings` - Republic Day & Independence Day greetings
- `/site-visits` - Site visit management
- `/booking-queue` - Property waitlist management
- `/customers-management` - Customer database with wallet
- `/resale-release` - Resale/Release management system
- `/emi-payments` - EMI payment tracking and management
- `/payments-dashboard` - Comprehensive payment tracking dashboard
- `/commission-analytics` - Commission analytics with trends, leaderboard, TDS tracking
- `/vendor-management` - Vendor directory, bills, and payments
- `/complaints` - Customer complaint management system
- `/referral-wallet` - Referral program & customer wallet
- `/email-management` - Email notifications management (NEW - Jan 14, 2026)
- `/billing` - Subscription billing & plan management (NEW - Jan 14, 2026)
- `/subscription-success` - Post-payment success page (NEW - Jan 14, 2026)
- `/block-locations` - Block Location Editor for GPS coordinates (NEW - Jan 15, 2026)
- `/property/:propertyId/settings` - Property Certified Settings (NEW - Jan 17, 2026)

## Public Routes (No Authentication Required)
- `/saas` - SaaS marketing landing page
- `/t/{tenant_id}` - Tenant public page with projects
- `/p/{project_id}` - Project landing page with properties (NEW)

# RETOERP Credits System - Complete Overview

## 📊 What Credits Are Present in RETOERP V1

RETOERP has **4 different types of credit systems** implemented:

---

## 1️⃣ **COMMUNICATION CREDITS** (Tenant Level)
### **Purpose:** Control usage of SMS, Email, and WhatsApp communications

### **Location:**
- **Model**: `/app/backend/models/tenant.py` - `TenantCredits` class
- **Package Model**: `/app/backend/models/package.py` - `PackageFeatures` class

### **Structure:**
```python
class TenantCredits(BaseModel):
    sms_remaining: int = 0        # SMS credits available
    email_remaining: int = 0       # Email credits available
    whatsapp_remaining: int = 0    # WhatsApp credits available
    sms_used: int = 0             # SMS used this period
    email_used: int = 0           # Email used this period
    whatsapp_used: int = 0        # WhatsApp used this period
```

### **How It Works:**
1. **Credits Assigned:** When tenant subscribes to a package, they get monthly credits
2. **Credits Consumed:** Each SMS/Email/WhatsApp sent deducts from remaining credits
3. **Monthly Reset:** Credits reset every billing cycle
4. **Tracking:** Usage is tracked and stored in `TenantCredits`

### **Package-Based Credits:**
```
Starter Package:
  - SMS: 500 credits/month
  - Email: 1000 credits/month
  - WhatsApp: 200 credits/month

Professional Package:
  - SMS: 2000 credits/month
  - Email: 5000 credits/month
  - WhatsApp: 1000 credits/month

Enterprise Package:
  - SMS: 10000 credits/month
  - Email: 20000 credits/month
  - WhatsApp: 5000 credits/month
```

### **APIs:**
```
POST /api/saas-admin/tenants/{tenant_id}/add-credits
```

---

## 2️⃣ **USAGE LIMITS & TRACKING** (SaaS Level)
### **Purpose:** Track and enforce package limits for resources

### **Location:**
- **Model**: `/app/backend/models/tenant_usage.py`
- **Routes**: `/app/backend/routes/usage_tracking.py`

### **What's Tracked:**
```python
class TenantUsage(BaseModel):
    # Core resources
    projects_count: int = 0
    properties_count: int = 0
    users_count: int = 0
    
    # Communication (monthly)
    sms_used_this_month: int = 0
    email_used_this_month: int = 0
    whatsapp_used_this_month: int = 0
    
    # Storage
    storage_used_mb: float = 0.0
    
    # Period tracking
    current_period_start: datetime
    current_period_end: datetime
    last_reset_date: datetime
    
    # Historical data
    usage_history: Dict[str, Dict] = {}
```

### **Features:**
1. **Automatic Tracking**: Increments when resources are created
2. **Limit Enforcement**: Blocks creation when limit reached
3. **Usage Alerts**: Warns at 80% usage
4. **Monthly Reset**: Communication credits reset monthly
5. **Historical Data**: Stores month-by-month usage

### **Usage Alerts:**
```python
class UsageAlert(BaseModel):
    alert_type: str  # "warning", "limit_reached", "limit_exceeded"
    resource_type: str  # "projects", "sms", "email", "storage"
    percentage_used: float
    message: str
```

### **APIs:**
```
GET  /api/usage/tenant/{tenant_id}
POST /api/usage/increment/{tenant_id}/{resource_type}
POST /api/usage/reset-monthly/{tenant_id}
GET  /api/usage/alerts/{tenant_id}
```

---

## 3️⃣ **SHARE & REFERRAL CREDITS** (Viral Marketing)
### **Purpose:** Reward users for sharing content and generating leads

### **Location:**
- **Model**: `/app/backend/models/share_referral.py`
- **Routes**: `/app/backend/routes/share_referral.py`

### **How It Works:**
```python
class ShareReward(BaseModel):
    reward_per_view: float = 1.0          # ₹1 per view
    reward_per_share: float = 10.0        # ₹10 when someone re-shares
    reward_per_lead: float = 100.0        # ₹100 per lead captured
    reward_per_conversion: float = 500.0  # ₹500 per paid conversion
    
    # Bonuses
    viral_threshold: int = 100            # 100+ views = viral
    viral_bonus: float = 1000.0           # ₹1000 bonus for viral content
    min_payout_threshold: float = 500.0   # Minimum ₹500 to withdraw
```

### **Earning Credits:**
1. **Share Content**: User shares article/project via unique link
2. **Track Views**: System tracks views via share code
3. **Capture Leads**: When someone fills form via shared link
4. **Award Credits**: Credits awarded based on activity
5. **Conversion Bonus**: Extra credits when lead converts to sale

### **Credit Status:**
- **Pending**: Credits earned but not yet approved
- **Awarded**: Credits approved and added to balance
- **Paid**: Credits withdrawn/paid out

### **Analytics:**
```python
class ShareAnalytics(BaseModel):
    total_shares: int
    total_views: int
    total_leads: int
    total_credits_earned: float
    available_credits: float  # Can withdraw
    pending_credits: float    # Awaiting approval
```

### **Use Cases:**
- Staff members share projects to earn commissions
- Customers share testimonials for rewards
- Agents share properties to generate leads
- Viral marketing campaigns

---

## 4️⃣ **INCOMELANDS AGENT CREDITS** (Marketplace)
### **Purpose:** Credits for IncomeLands agents to unlock developer contacts

### **Location:**
- **Model**: `/app/backend/models/incomelands_user.py`
- **Routes**: `/app/backend/routes/marketplace.py`

### **Structure:**
```python
class IncomeLandsUser(BaseModel):
    free_credits: int = 20    # Default 20 free credits
    paid_credits: int = 0     # Purchased credits
```

### **How It Works:**
1. **New Agent Registration**: Gets 20 free credits
2. **Contact Unlock**: Costs 10 credits per developer contact
3. **Credit Purchase**: Agents can buy more credits
4. **Revenue Model**: ₹10 per unlock × credits used

### **Usage:**
```
Agent has: 20 credits
Unlocks contact: -10 credits
Remaining: 10 credits
```

### **Contact Unlock Model:**
```python
class PropertyContactUnlock(BaseModel):
    agent_id: str
    property_id: str
    developer_id: str
    amount: int = 10  # Credits to deduct
    unlock_type: str  # "credits", "paid"
```

---

## 📈 CREDITS DASHBOARD & REPORTING

### **Where Credits Are Displayed:**

#### **1. SaaS Admin Dashboard** (`/admin/saas-dashboard`)
- Total communication credits across all tenants
- Usage statistics per tenant
- Alert notifications for high usage

#### **2. Tenant Dashboard** (`/dashboard`)
- Communication credits remaining
- Usage percentage bars
- Alert messages when approaching limits

#### **3. Usage Tracking Page** (`/api/usage/dashboard/{tenant_id}`)
- Detailed breakdown of all resources
- Historical usage graphs
- Credit consumption trends

#### **4. Share Rewards Page**
- Total credits earned from sharing
- Pending vs. available credits
- Withdrawal history

---

## 💰 MONETIZATION MODEL

### **Revenue Streams Using Credits:**

1. **Subscription Packages**
   - Monthly/Yearly fees include credit allocation
   - Higher tiers = more credits

2. **Pay-As-You-Go Credits**
   - Buy additional SMS/Email/WhatsApp credits
   - Top-up packages (e.g., 1000 SMS for ₹500)

3. **Contact Unlock Revenue**
   - IncomeLands agents pay ₹10 per contact unlock
   - Platform gets 10% commission (₹1 per unlock)

4. **Credit Withdrawal Fees**
   - Referral credits: Platform takes 10% fee on withdrawal
   - Minimum withdrawal threshold enforces engagement

---

## 🔄 CREDIT LIFECYCLE

### **Monthly Reset Cycle:**
```
1. Start of Month
   ↓
2. Reset communication credits based on package
   ↓
3. Track usage throughout month
   ↓
4. Alert at 80% usage
   ↓
5. Block at 100% usage (or allow overage with charges)
   ↓
6. End of Month
   ↓
7. Calculate overage charges
   ↓
8. Reset and repeat
```

### **Credit Purchase Flow:**
```
1. User needs more credits
   ↓
2. Click "Buy Credits"
   ↓
3. Select credit package
   ↓
4. Payment via Razorpay
   ↓
5. Credits added to account immediately
   ↓
6. Can use right away
```

---

## 🎯 CURRENT STATUS OF CREDITS SYSTEM

### **✅ Fully Implemented:**
1. ✅ Communication credits (SMS/Email/WhatsApp)
2. ✅ Package-based credit allocation
3. ✅ Usage tracking and limits
4. ✅ Monthly reset mechanism
5. ✅ Usage alerts (80% threshold)
6. ✅ Share & referral reward credits
7. ✅ IncomeLands agent credits
8. ✅ Credit deduction on usage

### **⚠️ Partially Implemented:**
1. ⚠️ Credit purchase/top-up UI (API exists, UI pending)
2. ⚠️ Credit withdrawal system (for referral rewards)
3. ⚠️ Overage charges calculation
4. ⚠️ Credit expiry dates

### **❌ Not Yet Implemented:**
1. ❌ Credit transfer between tenants
2. ❌ Credit gifting system
3. ❌ Bulk credit packages for resellers
4. ❌ Credit usage analytics dashboard (frontend)
5. ❌ Automated credit purchase on low balance
6. ❌ Credit history/transaction log (detailed)

---

## 🔧 HOW TO MANAGE CREDITS

### **For SaaS Admin:**

#### **Add Credits to Tenant:**
```bash
POST /api/saas-admin/tenants/{tenant_id}/add-credits
{
  "sms_credits": 1000,
  "email_credits": 2000,
  "whatsapp_credits": 500
}
```

#### **View Tenant Usage:**
```bash
GET /api/usage/tenant/{tenant_id}
```

#### **Reset Monthly Credits:**
```bash
POST /api/usage/reset-monthly/{tenant_id}
```

### **For Tenants:**

#### **Check Remaining Credits:**
```bash
GET /api/usage/tenant/{tenant_id}
```

#### **Purchase Additional Credits:**
```bash
POST /api/credits/purchase
{
  "package": "sms_1000",
  "amount": 500
}
```

---

## 📊 CREDIT PRICING (Suggested)

### **Additional Credit Packages:**

#### **SMS Credits:**
- 500 SMS = ₹250 (₹0.50/SMS)
- 1000 SMS = ₹450 (₹0.45/SMS)
- 5000 SMS = ₹2000 (₹0.40/SMS)
- 10000 SMS = ₹3500 (₹0.35/SMS)

#### **Email Credits:**
- 1000 Emails = ₹100 (₹0.10/email)
- 5000 Emails = ₹400 (₹0.08/email)
- 10000 Emails = ₹700 (₹0.07/email)

#### **WhatsApp Credits:**
- 500 Messages = ₹400 (₹0.80/msg)
- 1000 Messages = ₹700 (₹0.70/msg)
- 5000 Messages = ₹3000 (₹0.60/msg)

#### **IncomeLands Agent Credits:**
- 50 Credits = ₹500 (₹10/credit)
- 100 Credits = ₹900 (₹9/credit)
- 500 Credits = ₹4000 (₹8/credit)

---

## 🚀 NEXT STEPS FOR V2 (EXLAIN)

### **Enhanced Credits System:**

1. **Credit Wallet System**
   - Unified wallet for all credit types
   - Credit balance display in header
   - Transaction history page

2. **Auto Top-Up**
   - Set minimum balance threshold
   - Auto-purchase when below threshold
   - SMS/Email alerts before deduction

3. **Credit Bundles**
   - Combo packages (SMS + Email + WhatsApp)
   - Seasonal discount bundles
   - Bulk purchase discounts

4. **Credit Expiry**
   - Purchased credits valid for 6-12 months
   - Expiry warnings
   - Rollover options for unused credits

5. **Credit Analytics**
   - Usage trends and forecasting
   - Cost optimization recommendations
   - ROI tracking for communication campaigns

6. **Credit Marketplace**
   - Transfer credits between projects
   - Gift credits to team members
   - Credit trading (with platform fee)

---

## 📞 SUMMARY

**RETOERP V1 has 4 credit systems:**
1. ✅ **Communication Credits** (SMS/Email/WhatsApp) - Tenant level
2. ✅ **Usage Limits & Tracking** - SaaS level enforcement
3. ✅ **Share & Referral Rewards** - Viral marketing incentives
4. ✅ **IncomeLands Agent Credits** - Marketplace contact unlocks

**All systems are implemented and functional!**

The credits are stored in:
- `tenants` collection → `credits` field
- `tenant_usage` collection → usage tracking
- `share_referrals` collection → reward credits
- `incomelands_users` collection → agent credits

**Ready to extend for V2 with enhanced features!**

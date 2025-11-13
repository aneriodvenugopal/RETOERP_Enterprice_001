# 🧪 RETOERP Complete Testing Guide

## 📋 Overview
This guide will help you test all 67 APIs and features implemented in the RETOERP system.

---

## 🔑 Test Accounts

### 1. **SaaS Admin Account** (Your main account)
- **Phone:** `9948303060`
- **Access:** Full system access, can see all tenants
- **Dashboard:** https://retoerp.com/admin/saas-dashboard

### 2. **Tenant Admin Account** (Create a test tenant)
- **How to Create:** 
  - Login as SaaS Admin → Create Tenant
  - Or register new account at `/register`
- **Access:** Single tenant management
- **Dashboard:** https://retoerp.com/dashboard

### 3. **Staff Accounts** (Project Manager, Marketing Agent, etc.)
- **How to Create:** 
  - Login as Tenant Admin → Users → Add User
  - Assign roles: Project Manager, Marketing Agent, Sales Staff
- **Access:** Role-based dashboards

---

## 🧪 Testing Workflow (Recommended Order)

### **PHASE 1: Foundation & Setup** ✅

#### 1.1 Test Master Categories API
**Endpoint:** `GET /api/categories/master`

**How to Test:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this code:
```javascript
fetch('/api/categories/master', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Master Categories:', data))
```

**Expected Result:**
- 4 categories: Residential, Commercial, Industrial, Agricultural
- Each with icon and description

#### 1.2 Test Master Subcategories
**Endpoint:** `GET /api/categories/master/all-with-subcategories`

```javascript
fetch('/api/categories/master/all-with-subcategories', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Categories with Subcategories:', data))
```

**Expected Result:**
- Residential: 7 subcategories (Apartments, Villas, Plots, etc.)
- Commercial: 7 subcategories
- Industrial: 4 subcategories
- Agricultural: 4 subcategories
- Total: 22 subcategories

#### 1.3 Test Currencies
**Endpoint:** `GET /api/currencies`

```javascript
fetch('/api/currencies', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Currencies:', data))
```

**Expected Result:**
- 6 currencies: INR (base), USD, EUR, GBP, AED, SGD
- Each with exchange rate to INR

---

### **PHASE 2: Payment Schemes** 💳

#### 2.1 Test System Templates
**Endpoint:** `GET /api/schemes/templates/system`

```javascript
fetch('/api/schemes/templates/system', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Payment Scheme Templates:', data))
```

**Expected Result:**
- 4 templates:
  - 12 Months Standard (₹8.5L)
  - 18 Months Flexible (₹10L)
  - 24 Months Extended (₹12.5L)
  - Construction Linked (percentage-based)

#### 2.2 Create Custom Payment Scheme
**Endpoint:** `POST /api/schemes`

**Prerequisites:** You need a tenant_id and project_id

```javascript
// Get your tenant_id first
fetch('/api/tenants/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(tenant => {
  // Now create a payment scheme
  return fetch('/api/schemes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_id: tenant.tenant_id,
      scheme_name: "Test 6 Months Scheme",
      scheme_type: "custom",
      duration_months: 6,
      fields: [
        {
          field_name: "Booking Amount",
          field_value: 50000,
          due_month: 0,
          is_percentage: false,
          description: "Initial booking"
        },
        {
          field_name: "3rd Month Payment",
          field_value: 100000,
          due_month: 3,
          is_percentage: false,
          description: "Mid-term payment"
        },
        {
          field_name: "Final Payment",
          field_value: 150000,
          due_month: 6,
          is_percentage: false,
          description: "Final settlement"
        }
      ]
    })
  });
})
.then(r => r.json())
.then(data => console.log('Payment Scheme Created:', data))
```

**Expected Result:**
- Scheme created successfully
- Total amount: ₹3,00,000
- scheme_id returned

---

### **PHASE 3: Staff Hierarchy & Commission** 👥

#### 3.1 Create Staff Hierarchy
**Endpoint:** `POST /api/staff-hierarchy`

**Example: Create a sales team**

```javascript
// Step 1: Create Regional Manager (Top level)
fetch('/api/staff-hierarchy', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    staff_id: "staff_rm_001",
    staff_name: "Rajesh Kumar",
    staff_phone: "9876543210",
    role_id: "role_regional_manager",
    role_name: "Regional Manager",
    direct_commission_percentage: 0.0,
    gap_commission_percentage: 0.3
  })
})
.then(r => r.json())
.then(data => {
  console.log('Regional Manager Created:', data);
  
  // Step 2: Create Team Leader under Regional Manager
  return fetch('/api/staff-hierarchy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_id: "YOUR_TENANT_ID",
      staff_id: "staff_tl_001",
      staff_name: "Priya Sharma",
      staff_phone: "9876543211",
      role_id: "role_team_leader",
      role_name: "Team Leader",
      parent_staff_id: "staff_rm_001",
      direct_commission_percentage: 1.0,
      gap_commission_percentage: 0.5
    })
  });
})
.then(r => r.json())
.then(data => {
  console.log('Team Leader Created:', data);
  
  // Step 3: Create Senior Agent under Team Leader
  return fetch('/api/staff-hierarchy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tenant_id: "YOUR_TENANT_ID",
      staff_id: "staff_sa_001",
      staff_name: "Amit Patel",
      staff_phone: "9876543212",
      role_id: "role_senior_agent",
      role_name: "Senior Agent",
      parent_staff_id: "staff_tl_001",
      direct_commission_percentage: 1.5,
      gap_commission_percentage: 0.0
    })
  });
})
.then(r => r.json())
.then(data => console.log('Senior Agent Created:', data))
```

**Expected Result:**
- 3-level hierarchy created
- hierarchy_level auto-calculated (0, 1, 2)
- hierarchy_path auto-built

#### 3.2 View Staff Tree
**Endpoint:** `GET /api/staff-hierarchy/{staff_id}/tree`

```javascript
fetch('/api/staff-hierarchy/staff_rm_001/tree?tenant_id=YOUR_TENANT_ID', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Staff Tree:', data))
```

**Expected Result:**
- Complete hierarchy tree
- Regional Manager → Team Leader → Senior Agent
- Each with subordinates array

---

### **PHASE 4: Customer Payments** 💰

#### 4.1 Manual Payment Entry
**Endpoint:** `POST /api/manual`

**Prerequisites:** Need booking_id and customer_id

```javascript
fetch('/api/manual', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    booking_ids: ["booking_001"],
    customer_id: "customer_001",
    amount: 100000,
    currency_id: "INR",
    payment_method: "manual",
    payment_mode: "neft",
    reference_number: "NEFT123456789",
    bank_name: "State Bank of India",
    allocation: {
      "booking_001": 100000
    },
    notes: "First installment payment"
  })
})
.then(r => r.json())
.then(data => console.log('Payment Recorded:', data))
```

**Expected Result:**
- Payment recorded successfully
- Receipt number generated: RCP-YYYYMMDD-XXX
- Commission calculation triggered in background

#### 4.2 Razorpay Payment (Complete Flow)

**Step 1: Create Razorpay Order**
```javascript
fetch('/api/razorpay/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    booking_ids: ["booking_001"],
    customer_id: "customer_001",
    amount: 50000,
    currency: "INR"
  })
})
.then(r => r.json())
.then(data => {
  console.log('Razorpay Order Created:', data);
  // data.order_id, data.key_id returned
  // Now you can open Razorpay checkout
})
```

**Expected Result:**
- order_id created
- key_id returned (rzp_test_...)
- payment_id created in database

---

### **PHASE 5: Commission Management** 💸

#### 5.1 View Commission Earnings
**Endpoint:** `GET /api/commissions/earnings`

```javascript
fetch('/api/commissions/earnings?tenant_id=YOUR_TENANT_ID&status=pending', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Commission Earnings:', data))
```

**Expected Result:**
- List of commission earnings
- Direct commissions (sales staff)
- Gap commissions (managers)
- TDS calculated (5%)
- Status: pending

#### 5.2 Approve Commission
**Endpoint:** `POST /api/commissions/earnings/{earning_id}/approve`

```javascript
fetch('/api/commissions/earnings/EARNING_ID/approve', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    commission_earning_id: "EARNING_ID",
    action: "approve",
    notes: "Approved for payout"
  })
})
.then(r => r.json())
.then(data => console.log('Commission Approved:', data))
```

**Expected Result:**
- Commission status → approved
- Ready for payout

#### 5.3 Create Commission Payout
**Endpoint:** `POST /api/commissions/payouts`

```javascript
fetch('/api/commissions/payouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    staff_id: "staff_sa_001",
    commission_earning_ids: ["earning_001", "earning_002"],
    payment_mode: "bank_transfer",
    payment_reference: "TXN20250123001",
    processed_by: "admin_user_id",
    notes: "January 2025 commission payout"
  })
})
.then(r => r.json())
.then(data => console.log('Payout Created:', data))
```

**Expected Result:**
- Payout record created
- Earnings marked as "paid"
- Net amount calculated (after TDS)

---

### **PHASE 6: Usage Tracking** 📊

#### 6.1 Check Current Usage
**Endpoint:** `GET /api/usage/tenant/{tenant_id}`

```javascript
fetch('/api/usage/tenant/YOUR_TENANT_ID', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Current Usage:', data))
```

**Expected Result:**
```json
{
  "usage": {
    "projects": {
      "used": 2,
      "limit": 10,
      "remaining": 8,
      "percentage": 20.0
    },
    "sms": {
      "used": 500,
      "limit": 2000,
      "remaining": 1500,
      "percentage": 25.0
    }
  }
}
```

#### 6.2 Check Specific Limit
**Endpoint:** `GET /api/usage/check/{tenant_id}/projects`

```javascript
fetch('/api/usage/check/YOUR_TENANT_ID/projects', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Project Limit Check:', data))
```

**Expected Result:**
```json
{
  "allowed": true,
  "current_usage": 2,
  "limit": 10,
  "remaining": 8,
  "message": "8 projects remaining"
}
```

#### 6.3 Test Limit Enforcement

**Simulate limit reached:**
```javascript
// Keep incrementing until limit reached
async function testLimitEnforcement() {
  for (let i = 0; i < 15; i++) {
    const response = await fetch('/api/usage/increment/YOUR_TENANT_ID/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    console.log(`Attempt ${i+1}:`, data);
    
    if (!data.success) {
      console.log('LIMIT REACHED!', data.detail);
      break;
    }
  }
}

testLimitEnforcement();
```

**Expected Result:**
- First 10 increments: Success
- 11th increment: Error 403 "Limit reached. Please upgrade plan."

#### 6.4 Check Usage Alerts
**Endpoint:** `GET /api/usage/alerts/{tenant_id}`

```javascript
fetch('/api/usage/alerts/YOUR_TENANT_ID?is_resolved=false', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Usage Alerts:', data))
```

**Expected Result:**
- Alerts when usage > 80%
- Alert types: warning, limit_reached

---

## 🎯 Quick Test Checklist

### ✅ Foundation
- [ ] Master categories loaded (4 categories)
- [ ] Master subcategories loaded (22 subcategories)
- [ ] Currencies available (6 currencies)
- [ ] Payment scheme templates (4 templates)

### ✅ Payment Schemes
- [ ] View system templates
- [ ] Create custom scheme
- [ ] Update scheme (before finalization)
- [ ] Finalize scheme (lock from editing)
- [ ] Clone existing scheme

### ✅ Staff Hierarchy
- [ ] Create 3-level hierarchy
- [ ] View staff tree
- [ ] View staff upline
- [ ] Update commission percentages
- [ ] Set project-specific rates

### ✅ Customer Payments
- [ ] Manual payment (NEFT/Cheque/Cash)
- [ ] Razorpay order creation
- [ ] Payment verification
- [ ] Cheque clearance
- [ ] Multi-property allocation

### ✅ Commission System
- [ ] Auto commission calculation
- [ ] View earnings (pending)
- [ ] Approve earnings
- [ ] Create payout
- [ ] View payout history

### ✅ Usage Tracking
- [ ] View current usage
- [ ] Check resource limits
- [ ] Test limit enforcement
- [ ] View usage alerts
- [ ] Sync actual usage

---

## 🔥 Complete Flow Test (End-to-End)

**Test Complete Payment → Commission → Payout Flow:**

```javascript
// 1. Create Payment
const payment = await fetch('/api/manual', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    booking_ids: ["booking_001"],
    customer_id: "customer_001",
    amount: 1000000, // ₹10L
    currency_id: "INR",
    payment_method: "manual",
    payment_mode: "neft",
    reference_number: "TEST123",
    allocation: { "booking_001": 1000000 }
  })
}).then(r => r.json());

console.log('1. Payment Created:', payment);

// Wait 2 seconds for background commission calculation
await new Promise(resolve => setTimeout(resolve, 2000));

// 2. Check Commission Earnings
const earnings = await fetch(`/api/commissions/earnings?tenant_id=YOUR_TENANT_ID&payment_id=${payment.payment_id}`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json());

console.log('2. Commissions Calculated:', earnings);
// Expected: 3 commissions (sales agent + 2 managers)

// 3. Approve All Commissions
for (const earning of earnings.earnings) {
  await fetch(`/api/commissions/earnings/${earning.id}/approve`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      commission_earning_id: earning.id,
      action: "approve"
    })
  });
}

console.log('3. All Commissions Approved');

// 4. Create Payout
const payout = await fetch('/api/commissions/payouts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tenant_id: "YOUR_TENANT_ID",
    staff_id: "staff_sa_001",
    commission_earning_ids: [earnings.earnings[0].id],
    payment_mode: "bank_transfer",
    payment_reference: "PAYOUT001",
    processed_by: "admin_id"
  })
}).then(r => r.json());

console.log('4. Payout Created:', payout);
console.log('✅ COMPLETE FLOW WORKING!');
```

---

## 📱 Where to Test (UI Pages)

### 1. **SaaS Admin Dashboard**
   - URL: `/admin/saas-dashboard`
   - Fixed Error: ✅ Status display issue resolved
   - Features: View all tenants, overall metrics

### 2. **Tenant Dashboard**
   - URL: `/dashboard`
   - Features: View own tenant stats

### 3. **Projects**
   - URL: `/projects`
   - Test: Create project (usage increment)

### 4. **Bookings**
   - URL: `/bookings`
   - Test: Create booking, then add payment

### 5. **Users/Staff**
   - URL: `/users`
   - Test: Create staff hierarchy

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch"
**Solution:** Check backend is running
```bash
sudo supervisorctl status backend
```

### Issue: "403 Forbidden"
**Solution:** Check authentication token
```javascript
console.log(localStorage.getItem('token'));
```

### Issue: "Commission not calculated"
**Solution:** Check staff hierarchy exists and booking has `closed_by` field

### Issue: "Usage limit not enforcing"
**Solution:** Sync usage first
```javascript
fetch('/api/usage/sync/YOUR_TENANT_ID', { method: 'POST', ... })
```

---

## 📞 Support

For testing help, check:
- API Documentation: `/app/backend/API_DOCUMENTATION.md`
- Backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Frontend console: Browser DevTools (F12)

---

**🎉 Happy Testing!**

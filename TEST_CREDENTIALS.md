# RETOERP - Test User Credentials

## Important Note: OTP-Based Authentication
RETOERP uses **OTP-based authentication** (NO PASSWORDS REQUIRED)

**Login Process:**
1. Go to: `http://localhost:3000/login`
2. Enter phone number
3. Click "Send OTP"
4. Check console logs for OTP (shows in browser console or backend logs)
5. Enter the 6-digit OTP
6. Click "Verify & Login"

---

## Test User Credentials

### 🔴 SUPER ADMIN (Complete System Access)

| Phone Number  | Name           | Email                    | Role        |
|---------------|----------------|--------------------------|-------------|
| **9948303060** | RETOERP Admin  | admin@retoerp.com       | Super Admin |
| **9999999999** | Rajesh Kumar   | rajesh.kumar@retoerp.com| Super Admin |

**Access:** 
- Full system access
- Manage all tenants
- View all data across tenants
- System configuration

---

### 🟠 TENANT ADMIN (Organization Management)

| Phone Number  | Name                | Email                    | Role         | Organization      |
|---------------|---------------------|--------------------------|--------------|-------------------|
| **9908290239** | Tenant Admin User   | tenant@retoerp.com      | Tenant Admin | Default Organization |
| **8888888888** | Priya Sharma        | priya.sharma@retoerp.com| Tenant Admin | Default Organization |

**Access:**
- Full access within their organization
- Manage projects, properties, leads
- Manage staff members
- View reports & analytics
- Manage bookings & payments
- Commission management

---

### 🟡 STAFF (Sales Team Members)

| Phone Number  | Name           | Email                    | Role  | Organization      |
|---------------|----------------|--------------------------|-------|-------------------|
| **7777777777** | Amit Patel     | amit.patel@retoerp.com  | Staff | Default Organization |
| **5555555555** | Vikram Singh   | vikram.singh@retoerp.com| Staff | Default Organization |

**Access:**
- View assigned projects
- Manage their own leads
- View properties
- Add follow-ups
- Limited dashboard view

---

### 🟢 CUSTOMER (Property Buyers)

| Phone Number  | Name           | Email                    | Role     | Organization      |
|---------------|----------------|--------------------------|----------|-------------------|
| **6666666666** | Sneha Reddy    | sneha.reddy@retoerp.com | Customer | Default Organization |
| **4444444444** | Ananya Iyer    | ananya.iyer@retoerp.com | Customer | Default Organization |

**Access:**
- View their own properties
- View payment schedules
- View booking details
- Request property resale

---

## Quick Login Guide

### Example: Login as Tenant Admin (9908290239)

1. **Open RETOERP:** http://localhost:3000/login
2. **Enter Phone:** 9908290239
3. **Click:** "Send OTP"
4. **Check Console:** Press F12 → Console Tab → Look for "OTP: XXXXXX"
5. **Enter OTP:** Type the 6-digit code
6. **Login:** Click "Verify & Login"
7. **Redirects to:** Dashboard

---

## Password Reference (Not Used in RETOERP)

You mentioned: **Venu@29543**

**Note:** RETOERP uses OTP authentication, so passwords are not required. However, if you want to add password-based authentication in the future, this can be your default password for all test accounts.

---

## Module Testing Checklist

Use these credentials to test all implemented modules:

### ✅ Authentication & Registration
- [x] Login with OTP for all roles
- [x] Registration with custom validations
- [x] Role-based access control

### ✅ Projects & Properties
- Login as: **8888888888** (Tenant Admin)
- Create projects
- Add properties
- Manage inventory

### ✅ Lead Management
- Login as: **7777777777** (Staff)
- Create leads
- Add follow-ups
- Update lead status

### ✅ Bookings & Payments
- Login as: **8888888888** (Tenant Admin)
- Create bookings
- Record payments
- Generate EMI schedules

### ✅ Reports & Analytics
- Login as: **9908290239** (Tenant Admin)
- View dashboard metrics
- Lead analytics
- Sales reports
- Payment analytics

### ✅ Communication Integration
- Login as: **8888888888** (Tenant Admin)
- Send booking confirmations
- Send payment reminders
- View notification logs
- Check notification stats

---

## API Testing (cURL Examples)

### Get OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9908290239"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9908290239", "otp": "123456"}'
```

---

## Organization Details

**Default Organization:**
- **Name:** Default Organization
- **Company:** Default Real Estate Company
- **Currency:** INR (₹)
- **Language:** English
- **Timezone:** Asia/Kolkata

---

## Easy-to-Remember Phone Numbers

- **All 9s (9999999999)** = Super Admin (Rajesh Kumar)
- **All 8s (8888888888)** = Tenant Admin (Priya Sharma)
- **All 7s (7777777777)** = Staff (Amit Patel)
- **All 6s (6666666666)** = Customer (Sneha Reddy)
- **All 5s (5555555555)** = Staff (Vikram Singh)
- **All 4s (4444444444)** = Customer (Ananya Iyer)

---

## Troubleshooting

### Can't see OTP?
1. Open browser console (F12)
2. Look for: `OTP: XXXXXX`
3. Or check backend logs: `tail -f /var/log/supervisor/backend.out.log`

### Can't login?
1. Make sure backend is running: `sudo supervisorctl status backend`
2. Check if user is registered in database
3. Try refreshing the page

### Want to re-register a user?
1. Delete from database first
2. Then register again through `/register` page

---

## Summary

**Quick Test Login:**
- **Tenant Admin:** 9908290239 (or 8888888888)
- **Staff:** 7777777777 (or 5555555555)
- **Customer:** 6666666666 (or 4444444444)
- **Super Admin:** 9948303060 (or 9999999999)

**No passwords needed - Just phone number + OTP!**

---

Generated: 2025
System: RETOERP - Real Estate Automation Software

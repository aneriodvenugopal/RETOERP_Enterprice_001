# 🔐 Complete User List - All 9 Users with Roles & Passwords

## 📊 System Users Overview

**Total Users:** 9
**SaaS Admins:** 2 (Super Admin role)
**Tenant Admins:** 3
**Staff Members:** 2
**Customers:** 2

---

## 👥 All Users with Complete Details

### User 1: Super Admin ⭐ (SaaS Admin)
```
Name:         Super Admin
Phone:        9999999999
Email:        superadmin@retoerp.com
Role:         Super Admin (super_admin)
Password:     9999999999
Access Level: SaaS Admin - Full system access
Can Access:   Everything (all tenants, all features)
```

### User 2: Tenant Admin
```
Name:         Tenant Admin
Phone:        8888888888
Email:        admin@retoerp.com
Role:         Tenant Admin (tenant_admin)
Password:     8888888888
Access Level: Tenant Administrator
Can Access:   Manage their tenant, projects, users
```

### User 3: Staff Member
```
Name:         Staff Member
Phone:        7777777777
Email:        staff@retoerp.com
Role:         Staff (staff)
Password:     7777777777
Access Level: Staff/Frontdesk
Can Access:   Daily operations, customer support
```

### User 4: Customer User
```
Name:         Customer User
Phone:        6666666666
Email:        customer@retoerp.com
Role:         Customer (customer)
Password:     6666666666
Access Level: Customer
Can Access:   View bookings, properties, make requests
```

### User 5: RETOERP Admin ⭐ (SaaS Admin)
```
Name:         RETOERP Admin
Phone:        9948303060
Email:        admin@retoerp.com
Role:         Super Admin (super_admin)
Password:     9948303060
Access Level: SaaS Admin - Full system access
Can Access:   Everything (all tenants, all features)
```

### User 6: rajam
```
Name:         rajam
Phone:        9908290239
Email:        rajam@retoerp.com
Role:         Tenant Admin (tenant_admin)
Password:     9908290239
Access Level: Tenant Administrator
Can Access:   Manage their tenant, projects, users
```

### User 7: Vikram Singh
```
Name:         Vikram Singh
Phone:        5555555555
Email:        vikram.singh@retoerp.com
Role:         Staff (staff)
Password:     5555555555
Access Level: Staff/Frontdesk
Can Access:   Daily operations, customer support
```

### User 8: Ananya Iyer
```
Name:         Ananya Iyer
Phone:        4444444444
Email:        ananya.iyer@retoerp.com
Role:         Customer (customer)
Password:     4444444444
Access Level: Customer
Can Access:   View bookings, properties, make requests
```

### User 9: K Prasad
```
Name:         K Prasad
Phone:        9603830483
Email:        prasad@retoerp.com
Role:         Tenant Admin (tenant_admin)
Password:     9603830483
Access Level: Tenant Administrator
Can Access:   Manage their tenant, projects, users
```

---

## 🔑 SaaS Admin Accounts (2 Users)

### Who is the SaaS Admin?

**There are 2 SaaS Admins:**

1. **Super Admin** (Phone: 9999999999) ⭐
2. **RETOERP Admin** (Phone: 9948303060) ⭐

**SaaS Admin = Super Admin Role**

**What can SaaS Admins do?**
- ✅ Access ALL tenants
- ✅ Create/delete tenants
- ✅ Manage all users across all tenants
- ✅ Access CMS dashboard (`/admin/content`)
- ✅ Access resale management (`/admin/resale`)
- ✅ View system-wide analytics
- ✅ Configure system settings
- ✅ Full administrative control

---

## 📋 Login Instructions

### Method 1: Password Login (Recommended)
```
1. Go to: http://localhost:3000/login
2. Enter Phone: 9908290239 (or any user's phone)
3. Enter Password: 9908290239 (same as phone)
4. Click "Login with Password"
5. ✅ Logged in!
```

### Method 2: OTP Login (Fallback)
```
1. Click "Use OTP" toggle
2. Enter phone number
3. Click "Send OTP"
4. Enter OTP received
5. Click "Verify OTP"
```

### Method 3: Forgot Password (If needed)
```
1. Click "🔑 Forgot Password?" link
2. Enter phone number
3. Receive OTP via SMS
4. Verify OTP
5. Create new strong password
6. Login with new password
```

---

## 🎯 Role Breakdown

### Super Admin (2 users) - SaaS Level
- Full system access
- Can manage all tenants
- Can access admin panels
- System configuration

**Users:** Super Admin, RETOERP Admin

### Tenant Admin (3 users) - Tenant Level
- Manage their tenant
- Create projects & properties
- Manage team members
- View tenant analytics

**Users:** Tenant Admin, rajam, K Prasad

### Staff (2 users) - Operational Level
- Daily operations
- Customer support
- Lead management
- Booking assistance

**Users:** Staff Member, Vikram Singh

### Customer (2 users) - End User Level
- View their bookings
- Browse properties
- Request resale
- View payment schedules

**Users:** Customer User, Ananya Iyer

---

## 🧪 Quick Test

### Test SaaS Admin Login:
```bash
Phone:    9948303060
Password: 9948303060
Expected: Should see admin options in dashboard
```

### Test Tenant Admin Login:
```bash
Phone:    9908290239
Password: 9908290239
Expected: Should see tenant management options
```

### Test Customer Login:
```bash
Phone:    6666666666
Password: 6666666666
Expected: Should see customer dashboard
```

---

## 🔐 Password Reset (If Needed)

### To Reset Any User's Password:

**Option 1: Use Forgot Password Flow**
```
1. Go to login page
2. Click "Forgot Password?"
3. Enter phone number
4. Verify OTP
5. Set new password
```

**Option 2: Run Password Reset Script**
```bash
cd /app/backend
python scripts/set_default_passwords.py
```
This will reset all passwords to phone numbers.

---

## 🛡️ Security Notes

### Current State:
- ✅ All passwords are hashed with bcrypt
- ✅ No plain text passwords in database
- ✅ JWT token authentication
- ✅ Role-based access control

### Recommendations:
1. 💡 Change default passwords after first login
2. 💡 Use strong passwords for production
3. 💡 Enable 2FA in future (optional)
4. 💡 Regular password rotation policy

---

## 📞 Access Matrix

| User | Phone | Role | Can Access CMS | Can Manage Resale | Can Manage Tenant |
|------|-------|------|---------------|-------------------|-------------------|
| Super Admin | 9999999999 | Super Admin | ✅ Yes | ✅ Yes | ✅ All Tenants |
| Tenant Admin | 8888888888 | Tenant Admin | ❌ No | ✅ Yes | ✅ Own Tenant |
| Staff Member | 7777777777 | Staff | ❌ No | ✅ Yes | ❌ No |
| Customer User | 6666666666 | Customer | ❌ No | ❌ No | ❌ No |
| RETOERP Admin | 9948303060 | Super Admin | ✅ Yes | ✅ Yes | ✅ All Tenants |
| rajam | 9908290239 | Tenant Admin | ❌ No | ✅ Yes | ✅ Own Tenant |
| Vikram Singh | 5555555555 | Staff | ❌ No | ✅ Yes | ❌ No |
| Ananya Iyer | 4444444444 | Customer | ❌ No | ❌ No | ❌ No |
| K Prasad | 9603830483 | Tenant Admin | ❌ No | ✅ Yes | ✅ Own Tenant |

---

## 🎯 Summary

**Total Users:** 9
- 2 SaaS Admins (Super Admin role) ⭐
- 3 Tenant Admins
- 2 Staff Members
- 2 Customers

**SaaS Admins are:**
1. Super Admin (9999999999)
2. RETOERP Admin (9948303060)

**All Default Passwords:** Same as phone number
**All Passwords:** Securely hashed with bcrypt

**Login Status:** ✅ ALL WORKING
**Forgot Password:** ✅ WORKING
**Password Reset:** ✅ WORKING

---

*Last Updated: Current Session*
*All users can login immediately!*
*Forgot password feature is fully functional!* 🎉

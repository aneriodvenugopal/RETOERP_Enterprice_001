# Default Passwords for Existing Accounts

## 📋 All 8 Existing User Accounts

**Default Password Rule:** Password = Phone Number

---

### User 1: Super Admin
```
Username (Phone): 9999999999
Password:         9999999999
Role:            Super Admin
Status:          ✅ Active
```

### User 2: Tenant Admin
```
Username (Phone): 8888888888
Password:         8888888888
Role:            Tenant Admin
Status:          ✅ Active
```

### User 3: Staff Member
```
Username (Phone): 7777777777
Password:         7777777777
Role:            Staff
Status:          ✅ Active
```

### User 4: Customer User
```
Username (Phone): 6666666666
Password:         6666666666
Role:            Customer
Status:          ✅ Active
```

### User 5: RETOERP Admin
```
Username (Phone): 9948303060
Password:         9948303060
Role:            Admin
Status:          ✅ Active
```

### User 6: rajam
```
Username (Phone): 9908290239
Password:         9908290239
Role:            (Check in system)
Status:          ✅ Active
```

### User 7: Vikram Singh
```
Username (Phone): 5555555555
Password:         5555555555
Role:            (Check in system)
Status:          ✅ Active
```

### User 8: Ananya Iyer
```
Username (Phone): 4444444444
Password:         4444444444
Role:            (Check in system)
Status:          ✅ Active
```

---

## 🔐 How to Login:

### Step 1: Go to Login Page
```
http://localhost:3000/login
```

### Step 2: Enter Credentials
```
1. Select "Password Login" mode (default)
2. Enter Phone Number (e.g., 9908290239)
3. Enter Password (same as phone: 9908290239)
4. Click "Login with Password"
```

### Step 3: Success!
```
✅ You will be logged in immediately
```

---

## 🔄 Alternative Login (OTP Method):

If you want to use OTP instead:
```
1. Click "Use OTP" toggle
2. Enter phone number
3. Click "Send OTP"
4. Enter OTP received
5. Click "Verify OTP"
```

**Note:** OTP method costs SMS, so use password login to save costs!

---

## 🆕 New User Registration:

### Public Registration Shows Only:
- **Tenant Admin** - For new tenants/businesses
- **Customer** - For end customers

### How to Register:
```
1. Go to: http://localhost:3000/register
2. Fill all fields:
   - Name
   - Email
   - Phone (10 digits)
   - Password (must be strong)
   - Confirm Password
   - Select Role (Tenant Admin or Customer)
3. Click "Register"
4. Login with your credentials
```

### Strong Password Requirements:
```
✅ Minimum 8 characters
✅ At least one uppercase letter (A-Z)
✅ At least one lowercase letter (a-z)
✅ At least one number (0-9)
✅ At least one special character (!@#$%^&*...)
✅ Passwords must match

Example Strong Passwords:
- MyP@ssw0rd2024
- Secure#Pass123
- RealEst@te2024!
```

---

## 💡 Recommendations:

### For Existing Users:
1. ✅ Login with default password (phone number)
2. ✅ Change password after first login (recommended)
3. ✅ Use strong password for security

### For New Users:
1. ✅ Register with strong password from day 1
2. ✅ No need to change password (already strong)

---

## 🔒 Security Notes:

### Default Passwords:
- ✅ All passwords are hashed with bcrypt
- ✅ No plain text passwords in database
- ✅ Default passwords are temporary (should be changed)

### Strong Passwords:
- ✅ Meet industry standards (OWASP compliant)
- ✅ Hashed with bcrypt
- ✅ Secure from day 1

---

## 📞 Support:

If you cannot login with default passwords:
1. Check if phone number is correct
2. Try OTP login method
3. Contact system administrator
4. Check if account is active

---

## 🧪 Quick Test:

**Test Login Now:**
```
1. Open: http://localhost:3000/login
2. Username: 9908290239
3. Password: 9908290239
4. Click Login
5. Should work! ✅
```

---

**All passwords are set and ready to use! 🎉**

*Last Updated: Current Session*
*Password Script: /app/backend/scripts/set_default_passwords.py*

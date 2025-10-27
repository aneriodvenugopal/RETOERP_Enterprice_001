# MSG91 Integration - Required Credentials Checklist

## 📋 What You Need to Provide from MSG91 Dashboard

Based on your MSG91 screenshot, here's exactly what information I need from you to integrate MSG91 SMS into RETOERP:

---

### ✅ **1. Authentication Key (Auth Key)** - MANDATORY

**Where to find:**
1. Login to MSG91 dashboard
2. Click on your profile/username dropdown (top right)
3. Select "**Authkey**" option
4. Copy the authentication key shown

**Format:** Looks like `AIzaSyC9xXx...` or similar alphanumeric string

**What it does:** This is your API password to send SMS through MSG91

---

### ✅ **2. Sender IDs** - MANDATORY (Different for each SMS type)

**You need 3 separate Sender IDs:**

#### **A) OTP Sender ID**
- **Where to find:** MSG91 Dashboard → Configuration → Sender ID
- **Format:** 6 characters (e.g., `RETOTP`)
- **Used for:** Login OTPs, verification codes

#### **B) Transactional Sender ID**
- **Where to find:** MSG91 Dashboard → Configuration → Sender ID
- **Format:** 6 characters (e.g., `RETOSMS`)
- **Used for:** Booking confirmations, lead notifications

#### **C) Promotional Sender ID**
- **Where to find:** MSG91 Dashboard → Configuration → Sender ID
- **Format:** 6 characters (e.g., `RETOPRO`)
- **Used for:** Marketing campaigns, property updates

**Note:** For India, you must register these Sender IDs through DLT (Distributed Ledger Technology) platform.

---

### ✅ **3. DLT Registration Details** - MANDATORY for India

**What you need:**

#### **A) DLT Entity ID (PE ID)**
- **Where to find:** Your DLT registration portal
- **Format:** 19-digit number
- **What it is:** Your company's registered entity ID in DLT system

#### **B) DLT Template IDs**
- **Where to find:** MSG91 Dashboard → DLT Templates
- **What you need:** Template ID for each message type
  - OTP Template ID (e.g., `1234567890123456789`)
  - Booking Confirmation Template ID
  - Lead Notification Template ID
  - Promotional Message Template ID

**Note:** Each message template must be approved by DLT before use.

---

### ⚠️ **4. Flow IDs (Template IDs)** - OPTIONAL (For advanced messaging)

**Where to find:**
1. MSG91 Dashboard → Manage → Flow
2. Create a new Flow for each message type
3. Copy the Flow ID

**What you might create:**
- Booking Confirmation Flow ID
- Lead Notification Flow ID
- Welcome Message Flow ID

---

## 🔐 Security Information

### **IP Whitelisting** - RECOMMENDED
- **What to do:** Add your server IP addresses to MSG91 whitelist
- **Where:** MSG91 Dashboard → Settings → IP Whitelisting
- **Server IPs to add:**
  - Production server IP: `___.___.___.___`
  - Staging server IP: `___.___.___.___`
  - Development IP (if needed): Your office/home IP

---

## 💰 Current Balance Information (from your screenshot)

Based on your screenshot:
- **Current Balance:** ₹50.00
- **SMS Available:**
  - **Promotional:** 250 SMS at ₹0.2/SMS
  - **Send OTP:** 200 SMS at ₹0.25/SMS
  - **Transactional:** 200 SMS at ₹0.25/SMS
- **Hello Wallet:** ₹0.00

**⚠️ Recommendation:** Add more balance before testing to avoid interruptions.

---

## 📝 Information Collection Form

**Please provide the following details:**

```
==============================================
MSG91 CREDENTIALS
==============================================

1. AUTHENTICATION KEY:
   [                                        ]

2. SENDER IDs:
   A) OTP Sender ID: [      ]
   B) Transactional Sender ID: [      ]
   C) Promotional Sender ID: [      ]

3. DLT REGISTRATION (For India):
   A) DLT Entity ID (PE ID): [                   ]
   B) OTP Template ID: [                   ]
   C) Booking Template ID: [                   ]
   D) Lead Template ID: [                   ]
   E) Promotional Template ID: [                   ]

4. FLOW IDs (Optional):
   A) Booking Flow ID: [                   ]
   B) Lead Flow ID: [                   ]

5. IP WHITELISTING:
   A) Production Server IP: [   .   .   .   ]
   B) Staging Server IP: [   .   .   .   ]

==============================================
```

---

## 🚀 Once You Provide These Details

**I will:**
1. ✅ Add them securely to your `.env` file
2. ✅ Configure the SMS service in RETOERP backend
3. ✅ Create API endpoints for:
   - Send OTP for login
   - Booking confirmations
   - Lead notifications
   - Promotional campaigns
4. ✅ Test the integration with MSG91
5. ✅ Provide you with testing instructions

---

## 📞 How to Get These Details?

### **Step 1: Login to MSG91**
Go to: https://msg91.com/
Login with your credentials

### **Step 2: Get Auth Key**
- Click profile dropdown → Authkey
- Copy the key

### **Step 3: Get Sender IDs**
- Go to Configuration → Sender ID
- View your approved Sender IDs
- If you don't have any, create new ones (requires DLT approval)

### **Step 4: Get DLT Details**
- Go to your DLT portal (https://www.vilpower.in/)
- Copy your PE ID
- Go to MSG91 → DLT → Templates
- Copy template IDs for each message type

### **Step 5: Get Flow IDs (Optional)**
- Go to Manage → Flow
- Create flows for different message types
- Copy Flow IDs

---

## ❓ Common Questions

### **Q: Do I need separate Sender IDs for each SMS type?**
**A:** Yes, for India it's recommended to have separate Sender IDs for OTP, Transactional, and Promotional SMS for better deliverability and compliance.

### **Q: What is DLT and why is it mandatory?**
**A:** DLT (Distributed Ledger Technology) is mandatory in India to prevent spam SMS. All businesses must register their company, Sender IDs, and message templates before sending SMS.

### **Q: Can I use MSG91 without DLT registration?**
**A:** No, for sending SMS in India, DLT registration is mandatory. Without it, your SMS will not be delivered.

### **Q: How long does DLT approval take?**
**A:** Typically 2-3 working days for Sender ID approval and 1-2 days for template approval.

### **Q: How do I add more balance?**
**A:** MSG91 Dashboard → Wallet → Add Balance → Choose payment method

### **Q: Is IP whitelisting mandatory?**
**A:** Not mandatory, but highly recommended for security. It prevents unauthorized access to your MSG91 account.

---

## 🎯 Next Steps

1. **Collect the credentials** from MSG91 dashboard using the form above
2. **Share them with me** (I'll add them securely to your backend)
3. **I'll implement** the SMS integration in RETOERP
4. **We'll test** together to ensure everything works
5. **Go live** with SMS functionality! 🚀

---

**Need help finding any of these details? Let me know which specific item you need help with, and I'll guide you step-by-step!** 😊

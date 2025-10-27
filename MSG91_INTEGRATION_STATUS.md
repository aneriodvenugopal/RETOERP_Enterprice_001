# MSG91 Integration Status - RETOERP

## ✅ Already Configured

### **1. Auth Key** ✓
```
474418A2HJu7f3Clv68ff53b2P1
```
**Status:** Added to backend `.env` file securely

### **2. Server IP Whitelisting** ✓
```
34.16.56.64
```
**Action Required:** Please add this IP to MSG91 Dashboard → Authkey → IP Security → Whitelist IPs

---

## ⏳ Still Need from You

To complete the MSG91 integration, I need the following information from your MSG91 dashboard:

### **1. Sender IDs** (Required)

You need to provide **3 Sender IDs** registered in your MSG91 account:

#### **A) OTP Sender ID**
**Purpose:** For sending login OTPs and verification codes  
**Format:** 6 characters (e.g., `RETOTP`, `VERPRO`, etc.)  
**Where to find:** MSG91 Dashboard → Configuration → Sender ID

```
MSG91_SENDER_ID_OTP = [          ]
```

#### **B) Transactional Sender ID**
**Purpose:** For booking confirmations, lead notifications  
**Format:** 6 characters (e.g., `RETOSM`, `PROPUP`, etc.)  
**Where to find:** MSG91 Dashboard → Configuration → Sender ID

```
MSG91_SENDER_ID_TRANSACTIONAL = [          ]
```

#### **C) Promotional Sender ID**
**Purpose:** For marketing campaigns, property updates  
**Format:** 6 characters (e.g., `RETOPRO`, `PROPRO`, etc.)  
**Where to find:** MSG91 Dashboard → Configuration → Sender ID

```
MSG91_SENDER_ID_PROMOTIONAL = [          ]
```

---

### **2. DLT Registration Details** (Required for India 🇮🇳)

#### **A) DLT Entity ID (PE ID)**
**What it is:** Your company's registered entity ID in DLT system  
**Format:** 19-digit number  
**Where to find:** DLT Portal (https://www.vilpower.in/) OR MSG91 Dashboard → DLT

```
MSG91_DLT_ENTITY_ID = [                   ]
```

---

### **3. DLT Template IDs** (Required for India 🇮🇳)

Each message template must be approved in DLT. You need Template IDs for:

#### **A) OTP Template ID**
**Template example:** "Your OTP is {#var#}. Valid for 10 minutes. - RETOERP"  
**Where to find:** MSG91 Dashboard → DLT → Templates

```
MSG91_TEMPLATE_ID_OTP = [                   ]
```

#### **B) Booking Confirmation Template ID**
**Template example:** "Booking confirmed for {#var#}. Reference: {#var#}. Amount: {#var#}. - RETOERP"  
**Where to find:** MSG91 Dashboard → DLT → Templates

```
MSG91_TEMPLATE_ID_BOOKING = [                   ]
```

#### **C) Lead Notification Template ID**
**Template example:** "New lead alert: {#var#}. Type: {#var#}. Source: {#var#}. - RETOERP"  
**Where to find:** MSG91 Dashboard → DLT → Templates

```
MSG91_TEMPLATE_ID_LEAD = [                   ]
```

---

## 📋 Quick Copy-Paste Form

**Please fill this form and send it to me:**

```
==============================================
MSG91 REMAINING CREDENTIALS
==============================================

1. SENDER IDs:
   A) OTP Sender ID: [      ]
   B) Transactional Sender ID: [      ]
   C) Promotional Sender ID: [      ]

2. DLT ENTITY ID:
   PE ID: [                   ]

3. DLT TEMPLATE IDs:
   A) OTP Template ID: [                   ]
   B) Booking Template ID: [                   ]
   C) Lead Template ID: [                   ]

4. IP WHITELISTING STATUS:
   Have you whitelisted 34.16.56.64? [ YES / NO ]

==============================================
```

---

## 🔍 How to Find These Details

### **Finding Sender IDs:**

1. Login to MSG91: https://control.msg91.com/app/
2. Go to: **Configuration** → **Sender ID**
3. You'll see a list of approved Sender IDs
4. Copy the 6-character Sender IDs you want to use
5. If you don't have any:
   - Click **"Add Sender ID"**
   - Enter 6-character name (e.g., RETOTP)
   - Submit for approval (takes 2-3 days)

### **Finding DLT Entity ID:**

**Option 1: From MSG91 Dashboard**
1. Login to MSG91
2. Go to: **DLT** section
3. Your PE ID will be shown at the top

**Option 2: From DLT Portal**
1. Login to: https://www.vilpower.in/
2. Go to your **Dashboard**
3. Copy your **PE ID** (19-digit number)

### **Finding DLT Template IDs:**

1. Login to MSG91
2. Go to: **DLT** → **Templates**
3. You'll see all your approved templates
4. Each template has a **Template ID** (19-digit number)
5. Match template purpose with template ID:
   - OTP templates → OTP Template ID
   - Booking confirmation → Booking Template ID
   - Lead notification → Lead Template ID

**If you don't have templates:**
1. Click **"Add Template"**
2. Create template with variables (e.g., {#var#})
3. Submit for DLT approval
4. Once approved (1-2 days), copy Template ID

---

## ⚠️ Important: DLT Registration

### **Do you have DLT registration?**

**If YES:**
- Great! Just provide the Template IDs above

**If NO:**
- You MUST register on DLT to send SMS in India
- Visit: https://www.vilpower.in/
- Or visit: https://smartping.live/dlt-registration.html
- Register your:
  - Company details
  - Sender IDs (headers)
  - Message templates
- This is **mandatory** by TRAI regulations

**Without DLT registration:**
- ❌ SMS will NOT be delivered in India
- ❌ MSG91 will reject your requests
- ❌ You'll get DLT errors

---

## 🎯 What Happens After You Provide These?

Once you share the Sender IDs and Template IDs:

### **I will:**

1. ✅ Update backend `.env` with all credentials
2. ✅ Create MSG91 SMS service in Python/FastAPI
3. ✅ Implement API endpoints:
   - `/api/sms/send-otp` - Send OTP for login
   - `/api/sms/send-booking-confirmation` - Booking SMS
   - `/api/sms/send-lead-notification` - Lead alerts
   - `/api/sms/send-promotional` - Marketing campaigns
4. ✅ Add proper error handling and logging
5. ✅ Test all SMS functionality
6. ✅ Provide testing guide for you

### **You will be able to:**
- ✅ Send OTP for user login/verification
- ✅ Auto-send booking confirmations to customers
- ✅ Notify agents instantly about new leads
- ✅ Run SMS marketing campaigns for properties
- ✅ Track delivery status of all SMS
- ✅ Monitor SMS usage and balance

---

## 💡 Can't Find Sender IDs or Templates?

### **Option 1: Check with MSG91 Support**
- Email: support@msg91.com
- They can help you find your registered Sender IDs and Templates

### **Option 2: I Can Help You Register**
- If you haven't registered Sender IDs yet
- If you need help creating DLT templates
- Just let me know what messages you want to send
- I'll guide you through the registration process

### **Option 3: Use Default/Test Mode (Not for Production)**
- For testing purposes only
- We can use MSG91's test Sender ID
- But this WON'T work for production/real users

---

## 📞 Need Help?

**Stuck on any step? Let me know:**
- Can't find Sender IDs? → I'll guide you
- Don't have DLT registration? → I'll explain the process
- Confused about templates? → I'll help create them
- Any other questions? → Just ask! 😊

---

## 🚀 Summary - Next Steps

**Your Action Items:**
1. ☑️ Whitelist IP `34.16.56.64` in MSG91 dashboard
2. ☐ Copy your Sender IDs from MSG91
3. ☐ Copy your DLT Entity ID
4. ☐ Copy your DLT Template IDs
5. ☐ Fill the form above and share with me

**My Action Items (After you provide info):**
1. Complete backend MSG91 integration
2. Create SMS API endpoints
3. Test thoroughly
4. Provide you with documentation

---

**Let's complete this integration! Share the Sender IDs and Template IDs whenever you're ready!** 📱✨

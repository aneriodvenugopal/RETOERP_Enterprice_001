# Firebase, MSG91, మరియు DND Registration - పూర్తి గైడ్ (తెలుగులో)

## విషయ సూచిక
1. [Firebase Setup (Push Notifications కోసం)](#firebase-setup)
2. [MSG91 Registration (SMS కోసం)](#msg91-registration)
3. [Sender ID Registration](#sender-id-registration)
4. [DND (Do Not Disturb) Registration](#dnd-registration)

---

# 1. Firebase Setup (Push Notifications కోసం) 🔔

## దశ 1: Firebase ప్రాజెక్ట్ సృష్టించండి

### 1.1 Firebase Console కి వెళ్ళండి
```
🌐 https://console.firebase.google.com/
```

**చేయవలసినవి:**
1. మీ Google ఖాతాతో login చేయండి
2. "Add project" లేదా "ప్రాజెక్ట్ జోడించండి" బటన్ క్లిక్ చేయండి

### 1.2 ప్రాజెక్ట్ పేరు ఇవ్వండి
```
Project name: RETOERP
```
- మీకు నచ్చిన పేరు ఇవ్వండి (ఉదా: RETOERP, MyRealEstate, etc.)
- "Continue" క్లిక్ చేయండి

### 1.3 Google Analytics
```
Google Analytics: OFF చేయవచ్చు (optional)
```
- మీకు అనలిటిక్స్ కావాలంటే enable చేయండి
- లేకపోతే disable చేసి "Create project" క్లిక్ చేయండి

### 1.4 Project Ready!
- 30 సెకన్లు wait చేయండి
- "Your new project is ready" అని చూపిస్తుంది
- "Continue" క్లిక్ చేయండి

---

## దశ 2: Web App Add చేయండి

### 2.1 Web Icon క్లిక్ చేయండి
```
Firebase Console → Project Overview → </> (Web icon)
```

**ఎక్కడ కనిపిస్తుంది:**
- Dashboard మధ్యలో "Get started by adding Firebase to your app" కింద
- `</>` (Web) icon ని క్లిక్ చేయండి

### 2.2 App nickname ఇవ్వండి
```
App nickname: RETOERP Web
✅ Also set up Firebase Hosting (optional - మీకు కావాలంటే check చేయండి)
```
- "Register app" క్లిక్ చేయండి

### 2.3 Firebase Config Copy చేయండి ⚠️ **చాలా ముఖ్యం!**
```javascript
// ఈ config object అంతా copy చేసుకోండి
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "retoerp-xxxxx.firebaseapp.com",
  projectId: "retoerp-xxxxx",
  storageBucket: "retoerp-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

**📋 దీన్ని ఎక్కడ save చేయాలి:**
- Notepad లో copy paste చేసి save చేసుకోండి
- మీకు తర్వాత ఇవ్వాలి

---

## దశ 3: Cloud Messaging Enable చేయండి

### 3.1 Cloud Messaging కి వెళ్ళండి
```
Firebase Console → Build → Cloud Messaging
```

### 3.2 VAPID Key Generate చేయండి
```
1. "Web configuration" tab click చేయండి
2. "Web Push certificates" section లో
3. "Generate key pair" button click చేయండి
```

### 3.3 VAPID Key Copy చేయండి ⚠️ **చాలా ముఖ్యం!**
```
Key pair: BMxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

**📋 దీన్ని కూడా save చేసుకోండి:**
- Notepad లో paste చేయండి
- "VAPID Key: " అని label పెట్టండి

---

## దశ 4: Service Account Key Download చేయండి (Backend కోసం)

### 4.1 Project Settings కి వెళ్ళండి
```
Firebase Console → ⚙️ (Settings icon) → Project settings
```

### 4.2 Service Accounts Tab
```
1. "Service accounts" tab click చేయండి
2. కింద scroll చేయండి
```

### 4.3 Private Key Generate చేయండి
```
1. "Generate new private key" button click చేయండి
2. Warning popup వస్తుంది: "Keep it confidential"
3. "Generate key" confirm చేయండి
```

### 4.4 JSON File Download అవుతుంది ⚠️ **చాలా ముఖ్యం!**
```
File name: retoerp-xxxxx-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
```

**📋 ఈ file ని:**
- సురక్షితంగా save చేసుకోండి
- ఎవరితోనూ share చేయకండి
- దీన్ని నాకు ఇవ్వాలి

---

## దశ 5: మీరు నాకు ఇవ్వవలసిన Information

**నేను configure చేయడానికి ఈ 3 విషయాలు కావాలి:**

### ✅ 1. Firebase Config (Frontend కోసం)
```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "retoerp-xxxxx.firebaseapp.com",
  projectId: "retoerp-xxxxx",
  storageBucket: "retoerp-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
}
```

### ✅ 2. VAPID Key
```
BMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx...
```

### ✅ 3. Service Account JSON File
```
retoerp-xxxxx-firebase-adminsdk-xxxxx-xxxxxxxxxx.json
(entire file upload చేయండి లేదా content copy చేయండి)
```

---

## సులభంగా గుర్తుంచుకోవడానికి Checklist:

- [ ] Firebase project created (Project name: ________)
- [ ] Web app registered
- [ ] Firebase Config copied (apiKey, projectId, etc.)
- [ ] VAPID Key copied
- [ ] Service Account JSON file downloaded
- [ ] All 3 items saved in notepad/file
- [ ] Ready to share with you

---

# 2. MSG91 Registration (SMS కోసం) 📱

## MSG91 అంటే ఏమిటి?
```
MSG91 = SMS పంపడానికి service
India లో #1 SMS provider
```

## దశ 1: MSG91 Account సృష్టించండి

### 1.1 Website కి వెళ్ళండి
```
🌐 https://msg91.com/
```

### 1.2 Sign Up Click చేయండి
```
1. Top right లో "Sign Up" / "Get Started Free" button
2. లేదా: https://control.msg91.com/signup/
```

### 1.3 Details నింపండి
```
📧 Email: మీ business email
📱 Mobile: మీ mobile number (OTP వస్తుంది)
🏢 Company Name: మీ company పేరు (ఉదా: RETOERP)
👤 Full Name: మీ పూర్తి పేరు
🔐 Password: బలమైన password
```

### 1.4 OTP Verify చేయండి
```
1. మీ mobile కి OTP వస్తుంది
2. Enter చేసి verify చేయండి
3. Email verification link click చేయండి
```

### 1.5 Account Type Select చేయండి
```
Account Type: Transactional (లేదా Promotional)
Business Type: Real Estate / Technology
```

---

## దశ 2: KYC Documents Submit చేయండి

### 2.1 KYC Section కి వెళ్ళండి
```
Dashboard → Settings → KYC
```

### 2.2 కావలసిన Documents:

#### For Company:
```
✅ Company Registration Certificate
✅ GST Certificate
✅ PAN Card (Company)
✅ Address Proof
```

#### For Individual:
```
✅ Aadhaar Card
✅ PAN Card
✅ Address Proof (Electricity Bill / Bank Statement)
✅ Photo
```

### 2.3 Upload చేయండి
```
1. Clear scanned copies upload చేయండి
2. PDF లేదా JPG format
3. File size: 2MB లోపు
```

### 2.4 Verification Time
```
⏰ 2-3 business days
📧 Email notification వస్తుంది
```

---

## దశ 3: Credits Purchase చేయండి

### 3.1 Credits అంటే ఏమిటి?
```
1 Credit = 1 SMS
Cost: ₹0.15 to ₹0.25 per SMS (volume based)
```

### 3.2 Wallet కి వెళ్ళండి
```
Dashboard → Wallet / Recharge
```

### 3.3 Amount Select చేయండి
```
Minimum: ₹500 (~ 2000-3000 SMS)
Recommended: ₹1000 to ₹5000 (testing కోసం)
```

### 3.4 Payment Options
```
💳 Credit Card / Debit Card
🏦 Net Banking
📱 UPI
📄 Invoice (for bulk)
```

---

## దశ 4: API Key పొందండి ⚠️ **చాలా ముఖ్యం!**

### 4.1 API Section కి వెళ్ళండి
```
Dashboard → API → API Keys
```

### 4.2 Generate New API Key
```
1. "Generate New API Key" button click చేయండి
2. Name ఇవ్వండి: "RETOERP Production"
3. "Generate" click చేయండి
```

### 4.3 API Key Copy చేయండి
```
API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**📋 దీన్ని save చేసుకోండి:**
```
MSG91_AUTH_KEY: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

# 3. Sender ID Registration 🏷️

## Sender ID అంటే ఏమిటి?
```
Sender ID = SMS లో sender name గా కనిపించేది
ఉదాహరణ: "RETOER" లేదా "RETERP"
Maximum: 6 characters (alphabets only)
```

## దశ 1: Sender ID Request చేయండి

### 1.1 Sender ID Section
```
MSG91 Dashboard → Manage → Sender ID
```

### 1.2 New Sender ID Request
```
1. "Add New Sender ID" button click చేయండి
2. Sender ID: RETOER (లేదా RETERP)
   - 6 characters maximum
   - Only capital letters
   - No numbers or special characters
```

### 1.3 Use Case Select చేయండి
```
Purpose: Transactional
Category: Real Estate
```

### 1.4 Supporting Documents Upload
```
✅ Company Letter Head (your request)
✅ Sample SMS format
✅ Business proof
```

---

## దశ 2: Sample SMS Format

### 2.1 SMS Template Example
```
Your RETOERP verification code is: {#var#}. Valid for 10 minutes.
```

### 2.2 Template Format Rules
```
✅ Variables: {#var#} format use చేయండి
✅ Clear purpose mention చేయండి
✅ Company name include చేయండి
✅ No misleading content
```

---

## దశ 3: Approval Process

### 3.1 Submission తర్వాత
```
⏰ Review time: 2-4 business days
📧 Email updates వస్తాయి
```

### 3.2 Approval Status Check
```
Dashboard → Sender ID → Status column
- Pending (yellow)
- Approved (green)
- Rejected (red)
```

### 3.3 Approved అయితే
```
✅ Sender ID active అవుతుంది
✅ SMS లో "RETOER" గా sender name show అవుతుంది
✅ Ready to use!
```

---

# 4. DND (Do Not Disturb) Registration 📵

## DND అంటే ఏమిటి?
```
DND = Do Not Disturb
TRAI (టెలికాం నియంత్రణ సంస్థ) నిబంధన
DND registers చేసిన numbers కి SMS పంపడానికి permission అవసరం
```

## DND Registration ఎందుకు అవసరం?

### సమస్య:
```
❌ చాలా మంది customers DND activate చేస్తారు
❌ Promotional SMS లు వెళ్ళవు
❌ Important updates కూడా miss అవుతాయి
```

### పరిష్కారం:
```
✅ DND Scrubbing service use చేయండి
✅ Transactional route use చేయండి
✅ TRAI guidelines follow అవ్వండి
```

---

## దశ 1: TRAI Registration

### 1.1 Telecom Commercial Communications Customer Preference Regulations (TCCCPR)
```
🌐 Website: https://www.trai.gov.in/
```

### 1.2 Principal Entity Registration

#### కావలసిన Documents:
```
1. Company Registration Certificate
2. GST Certificate
3. PAN Card
4. Letter head లో request letter
5. Authorized signatory details
6. Header registration proofs
```

### 1.3 Header Registration
```
Header = Sender ID (RETOER)
Category: Real Estate
Purpose: Transactional/Promotional
```

---

## దశ 2: MSG91 DND Settings

### 2.1 DND Scrubbing Enable చేయండి
```
MSG91 Dashboard → Settings → DND Settings
```

### 2.2 Options:

#### Option 1: Auto DND Scrubbing (Recommended)
```
✅ MSG91 automatically DND numbers ని filter చేస్తుంది
✅ Cost: Extra ₹0.02 per SMS
✅ Easy & Compliant
```

#### Option 2: Manual Scrubbing
```
➖ మీరే DND list maintain చేయాలి
➖ API call చేసి check చేయాలి
➖ Complex but cheaper
```

---

## దశ 3: Transactional vs Promotional

### Transactional SMS (DND bypass అవుతుంది)
```
✅ OTP messages
✅ Booking confirmations
✅ Payment receipts
✅ Account alerts
✅ Order updates

Cost: ₹0.20 - ₹0.25 per SMS
```

### Promotional SMS (DND apply అవుతుంది)
```
❌ Marketing messages
❌ Offers & discounts
❌ New launches
❌ General announcements

Cost: ₹0.10 - ₹0.15 per SMS
```

---

## దశ 4: Best Practices

### 4.1 మంచి SMS Habits
```
✅ Only necessary SMS లు పంపండి
✅ Clear opt-out option ఇవ్వండి
✅ Time restrictions follow అవ్వండి (9 AM - 9 PM)
✅ Frequency limit పెట్టుకోండి
```

### 4.2 Legal Compliance
```
✅ Customer consent తీసుకోండి
✅ Unsubscribe option mandatory
✅ TRAI guidelines strictly follow అవ్వండి
✅ DND registers ని respect చేయండి
```

---

# సారాంశం - Quick Checklist

## Firebase (Push Notifications):
- [ ] Firebase project created
- [ ] Firebase Config copied (apiKey, authDomain, etc.)
- [ ] VAPID Key copied
- [ ] Service Account JSON downloaded
- [ ] All saved and ready to share

## MSG91 (SMS):
- [ ] MSG91 account created
- [ ] KYC documents submitted
- [ ] Credits purchased (minimum ₹500)
- [ ] API Key generated and saved
- [ ] Sender ID registered (RETOER/RETERP)

## DND:
- [ ] DND scrubbing enabled in MSG91
- [ ] Transactional route selected
- [ ] TRAI guidelines understood
- [ ] Compliance measures in place

---

# మీరు నాకు ఇవ్వవలసిన Final Information:

## 1. Firebase:
```
✅ Firebase Config (apiKey, projectId, etc.)
✅ VAPID Key
✅ Service Account JSON file
```

## 2. MSG91:
```
✅ API Key (AUTH_KEY)
✅ Sender ID (approved)
✅ Account credits balance
```

## 3. Additional (Optional):
```
⚠️ Any other API keys or credentials
⚠️ WhatsApp Business API details (if applicable)
⚠️ Email service credentials (if any)
```

---

# సహాయం కావాలా?

## Firebase Support:
📧 firebase-support@google.com
📚 https://firebase.google.com/support

## MSG91 Support:
📱 +91 9650790790
📧 support@msg91.com
💬 Live Chat: https://msg91.com/

## TRAI:
🌐 https://www.trai.gov.in/
📧 cprsupport@trai.gov.in

---

**అన్ని steps పూర్తి చేసి, credentials నాకు share చేయండి. నేను application లో configure చేస్తాను! 🚀**

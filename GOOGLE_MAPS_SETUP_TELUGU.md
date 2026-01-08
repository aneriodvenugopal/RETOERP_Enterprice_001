# Google Maps API Key సెటప్ గైడ్ - తెలుగులో

## 📋 ఇందులో ఉన్నవి:
1. [Google Cloud అకౌంట్ క్రియేట్ చేయడం](#step-1)
2. [Project సృష్టించడం](#step-2)
3. [Maps JavaScript API ఎనేబుల్ చేయడం](#step-3)
4. [API Key తీసుకోవడం](#step-4)
5. [Security కోసం Key Restrict చేయడం](#step-5)
6. [మీ యాప్‌లో Key జోడించడం](#step-6)

---

## 🎯 ముఖ్యమైన సమాచారం

### **మీకు ఏమి కావాలి:**
- ✅ Gmail అకౌంట్
- ✅ Credit/Debit Card (వెరిఫికేషన్ కోసం మాత్రమే - free tier లో charge అవ్వదు)
- ✅ 10-15 నిమిషాల సమయం

### **మీరు Enable చేయవలసిన API:**
- ✅ **Maps JavaScript API** (ఒక్కటే చాలు!)
- ❌ Geocoding API (అవసరం లేదు)
- ❌ Places API (అవసరం లేదు)
- ❌ Directions API (అవసరం లేదు)

### **ఖర్చు:**
- 🆓 **మొదటి 32 లక్షల మ్యాప్ లోడ్లు:** ఉచితం (₹5,70,000 క్రెడిట్)
- 📊 **ఆ తర్వాత:** 1000 లోడ్లకు ₹175 (70% డిస్కౌంట్ భారత్‌కు)
- 💰 **50,000 ఏజెంట్లకు:** నెలకు ~₹3,400 మాత్రమే

---

<a name="step-1"></a>
## 📝 Step 1: Google Cloud Console కి వెళ్ళండి

### **చేయవలసినవి:**

1. **మీ Browser తెరవండి** (Chrome, Firefox, Edge ఏదైనా)

2. **ఈ లింక్ కి వెళ్ళండి:**
   ```
   https://console.cloud.google.com/
   ```

3. **Gmail Account తో Login అవ్వండి**
   - మీ Gmail ID & Password ఎంటర్ చేయండి
   - అది ఇప్పటికే login అయి ఉంటే skip అవుతుంది

4. **మొదటిసారి అయితే "Terms of Service" స్వీకరించండి**
   - ☑️ చెక్బాక్స్ మార్క్ చేయండి
   - **"Agree and Continue"** బటన్ క్లిక్ చేయండి

---

<a name="step-2"></a>
## 🏗️ Step 2: కొత్త Project క్రియేట్ చేయండి

### **చేయవలసినవి:**

1. **టాప్ బార్‌లో "Select a project" డ్రాప్‌డౌన్ క్లిక్ చేయండి**
   - స్క్రీన్ టాప్ ఎడమవైపు Google Cloud logo పక్కన ఉంటుంది

2. **పాప్-అప్ విండో తెరుచుకుంటుంది**
   - కుడి మూలన **"NEW PROJECT"** బటన్ క్లిక్ చేయండి

3. **Project Details నింపండి:**

   **Project Name:**
   ```
   IncomeLands-App
   ```
   (మీకు నచ్చిన పేరు పెట్టవచ్చు - తెలుగులో కూడా రాయవచ్చు)

   **Organization:** 
   ```
   No organization (default) - ఇలాగే వదిలేయండి
   ```

   **Location:**
   ```
   No organization - ఇలాగే వదిలేయండి
   ```

4. **"CREATE" బటన్ క్లిక్ చేయండి**

5. **వేచి ఉండండి 10-20 సెకన్లు**
   - స్క్రీన్ టాప్ రైట్ కార్నర్‌లో notification bell (🔔) చూడండి
   - "Project created" అని మెసేజ్ వస్తుంది

6. **కొత్త Project సెలెక్ట్ చేయండి**
   - టాప్ బార్ డ్రాప్‌డౌన్ క్లిక్ చేసి
   - "IncomeLands-App" ని సెలెక్ట్ చేయండి

---

<a name="step-3"></a>
## 🗺️ Step 3: Maps JavaScript API Enable చేయండి

### **చేయవలసినవి:**

1. **ఎడమవైపు మెను (☰) ఓపెన్ చేయండి**
   - స్క్రీన్ టాప్ ఎడమ కార్నర్‌లో hamburger మెను (3 horizontal lines) క్లిక్ చేయండి

2. **"APIs & Services" మీద hover చేయండి**
   - సబ్-మెను తెరుచుకుంటుంది

3. **"Library" క్లిక్ చేయండి**
   - API Library పేజీ తెరుచుకుంటుంది

4. **సెర్చ్ బాక్స్‌లో టైప్ చేయండి:**
   ```
   Maps JavaScript API
   ```
   (ఖచ్చితంగా ఈ పేరే టైప్ చేయండి)

5. **Search Results లో "Maps JavaScript API" క్లిక్ చేయండి**
   - నీలం రంగు లోగో తో ఉంటుంది
   - Description: "Customizable maps for your website or mobile app"

6. **"ENABLE" బటన్ క్లిక్ చేయండి**
   - పెద్ద నీలం రంగు బటన్ మధ్యలో ఉంటుంది

7. **1-2 నిమిషాలు వేచి ఉండండి**
   - API ఆక్టివేట్ అవుతుంది
   - "API enabled" స్టేటస్ కనిపిస్తుంది

---

<a name="step-4"></a>
## 🔑 Step 4: API Key క్రియేట్ చేయండి

### **చేయవలసినవి:**

1. **ఎడమవైపు మెను (☰) ఓపెన్ చేయండి**

2. **"APIs & Services" → "Credentials" క్లిక్ చేయండి**

3. **టాప్‌లో "+ CREATE CREDENTIALS" బటన్ క్లిక్ చేయండి**

4. **డ్రాప్‌డౌన్ నుండి "API key" ఎంచుకోండి**

5. **పాప్-అప్ విండో తెరుచుకుంటుంది:**
   ```
   API key created
   AIzaSyC9xXxxxxxxxxxxxxxxxxxxxxxxx
   ```

6. **⚠️ ముఖ్యం: ఈ Key కాపీ చేయండి**
   - **"COPY"** బటన్ క్లిక్ చేయండి
   - లేదా మాన్యువల్‌గా సెలెక్ట్ చేసి కాపీ చేయండి (Ctrl+C)
   - ఈ Key ని Notepad లో paste చేసి save చేసుకోండి

7. **"CLOSE" క్లిక్ చేయకండి ఇంకా!**
   - ముందు Key ని Restrict చేయాలి (Security కోసం)

---

<a name="step-5"></a>
## 🔒 Step 5: API Key ని Restrict చేయండి (Security కోసం - చాలా ముఖ్యం!)

### **ఎందుకు Restrict చేయాలి?**
- 🛡️ వేరే వాళ్ళు మీ Key use చేయలేరు
- 💰 Key leak అయితే bill పెరగదు
- ✅ Production కి best practice

### **చేయవలసినవి:**

1. **పాప్-అప్ విండోలో "RESTRICT KEY" బటన్ క్లిక్ చేయండి**
   - లేదా Credentials పేజీలో మీ API key name మీద క్లిక్ చేయండి

2. **API Key Edit పేజీ తెరుచుకుంటుంది**

---

### **A) Application Restrictions సెట్ చేయండి:**

1. **"Application restrictions" సెక్షన్ కి scroll చేయండి**

2. **"HTTP referrers (web sites)" రేడియో బటన్ ఎంచుకోండి**

3. **"ADD AN ITEM" బటన్ క్లిక్ చేయండి**

4. **మీ website URLs జోడించండి:**

   **మొదటి referrer:**
   ```
   https://property-saas-4.preview.emergentagent.com/*
   ```
   - Paste చేసి Enter నొక్కండి

   **రెండవ referrer (మీ actual domain):**
   ```
   https://yourdomain.com/*
   ```
   - మీ actual domain ఉంటే add చేయండి

   **మూడవ referrer (local testing కోసం):**
   ```
   http://localhost:3000/*
   ```
   - Local testing కోసం

   **నాల్గవ referrer (local IP testing):**
   ```
   http://127.0.0.1:3000/*
   ```

5. **ప్రతి referrer తర్వాత "ADD AN ITEM" క్లిక్ చేసి next add చేయండి**

---

### **B) API Restrictions సెట్ చేయండి:**

1. **"API restrictions" సెక్షన్ కి scroll చేయండి**

2. **"Restrict key" రేడియో బటన్ ఎంచుకోండి**

3. **డ్రాప్‌డౌన్ "Select APIs" క్లిక్ చేయండి**

4. **ఈ ఒక్క API మాత్రమే ఎంచుకోండి:**
   - ☑️ **Maps JavaScript API** (ఇది మాత్రమే check చేయండి)
   - ❌ మిగతా అన్నీ uncheck చేయండి

5. **"OK" క్లిక్ చేయండి**

---

### **C) Save చేయండి:**

1. **పేజీ bottom కి scroll చేయండి**

2. **"SAVE" బటన్ క్లిక్ చేయండి (నీలం రంగు బటన్)**

3. **"Changes saved" confirmation వస్తుంది**

4. **5 నిమిషాలు వేచి ఉండండి**
   - Restrictions ఆక్టివేట్ అవడానికి సమయం పడుతుంది

---

<a name="step-6"></a>
## 📱 Step 6: మీ IncomeLands యాప్‌లో API Key జోడించండి

### **చేయవలసినవి:**

**నేను (AI) చేస్తాను - మీరు Key మాత్రమే షేర్ చేయండి:**

1. **మీరు చేయవలసింది:**
   - కాపీ చేసిన API Key నాకు షేర్ చేయండి
   - ఉదాహరణ: `AIzaSyC9xXxxxxxxxxxxxxxxxxxxxxxxx`

2. **నేను చేస్తాను:**
   - `/app/frontend/.env` ఫైల్ ఓపెన్ చేస్తాను
   - ఈ లైన్ add చేస్తాను:
     ```
     REACT_APP_GOOGLE_MAPS_KEY=AIzaSyC9xXxxxxx...మీ_KEY
     ```
   - Frontend restart చేస్తాను:
     ```bash
     sudo supervisorctl restart frontend
     ```

3. **నేను టెస్ట్ చేస్తాను:**
   - Maps లోడ్ అవుతుందో check చేస్తాను
   - Markers కనిపిస్తున్నాయో verify చేస్తాను
   - Errors ఉన్నాయో చూస్తాను
   - Screenshot తీసుకుని మీకు చూపిస్తాను

---

## ✅ Step 7: Billing Enable చేయండి (ముఖ్యం!)

### **ఎందుకు కావాలి?**
- Google Maps API పని చేయడానికి billing account కావాలి
- ⚠️ కానీ free tier లో charge అవ్వదు!
- Credit card verification కోసం మాత్రమే

### **చేయవలసినవి:**

1. **Google Cloud Console లో ఎడమ మెను (☰) ఓపెన్ చేయండి**

2. **"Billing" క్లిక్ చేయండి**

3. **"Link a billing account" లేదా "Create billing account" క్లిక్ చేయండి**

4. **మీ వివరాలు నింపండి:**

   **Account Type:**
   - Business (మీ company కోసం)
   - Individual (వ్యక్తిగత use కోసం)

   **Country:**
   ```
   India
   ```

   **Currency:**
   ```
   INR (₹)
   ```

5. **Credit/Debit Card Details add చేయండి:**
   - Card Number
   - Expiry Date
   - CVV
   - Card Holder Name

6. **Billing Address నింపండి:**
   - Name
   - Address
   - City
   - State
   - PIN Code
   - Phone Number

7. **"Start my free trial" లేదా "Enable billing" క్లిక్ చేయండి**

8. **⚠️ ₹1-2 verification charge అవుతుంది (తిరిగి వస్తుంది)**

9. **Billing account link అవుతుంది మీ project కి**

---

## 💰 Budget Alert సెట్ చేయండి (Optional కానీ Recommended)

### **ఎందుకు సెట్ చేయాలి?**
- 💸 ఊహించని bill రాకుండా
- 📊 Usage track చేయడానికి
- ⚠️ Alert వస్తుంది limit దాటితే

### **చేయవలసినవి:**

1. **"Billing" → "Budgets & alerts" కి వెళ్ళండి**

2. **"CREATE BUDGET" క్లిక్ చేయండి**

3. **Budget Details నింపండి:**

   **Name:**
   ```
   IncomeLands Monthly Budget
   ```

   **Projects:**
   - ☑️ IncomeLands-App ఎంచుకోండి

   **Services:**
   - All services (default)

   **Budget Amount:**
   ```
   ₹500
   ```
   (మీకు నచ్చిన amount పెట్టవచ్చు)

4. **Alert Thresholds సెట్ చేయండి:**
   - ☑️ 50% (₹250 దాటితే email వస్తుంది)
   - ☑️ 75% (₹375 దాటితే email వస్తుంది)
   - ☑️ 90% (₹450 దాటితే email వస్తుంది)
   - ☑️ 100% (₹500 దాటితే email వస్తుంది)

5. **"FINISH" క్లిక్ చేయండి**

6. **ఇప్పుడు మీకు alerts వస్తాయి మీ Gmail కి**

---

## 🎯 Summary - మీరు చేయవలసినవి:

### **✅ Completed Steps:**
1. ☑️ Google Cloud Console కి వెళ్ళి login అవ్వండి
2. ☑️ కొత్త Project "IncomeLands-App" క్రియేట్ చేయండి
3. ☑️ "Maps JavaScript API" enable చేయండి
4. ☑️ API Key క్రియేట్ చేసి కాపీ చేయండి
5. ☑️ API Key ని Restrict చేయండి (HTTP referrers + API restrictions)
6. ☑️ Billing enable చేయండి (credit card add చేయండి)
7. ☑️ Budget alert సెట్ చేయండి (optional)

### **🔑 చివరి Step:**
**API Key నాకు షేర్ చేయండి, నేను యాప్‌లో add చేస్తాను!**

---

## 🐛 సమస్యలు వస్తే (Troubleshooting)

### **సమస్య 1: "API key not valid" error**

**కారణం:**
- API key తప్పుగా కాపీ అయి ఉండొచ్చు
- Maps JavaScript API enable కాలేదు
- Restrictions సరిగ్గా లేవు

**పరిష్కారం:**
1. API key మళ్ళీ కాపీ చేయండి (spaces లేకుండా)
2. Maps JavaScript API enabled ఉందో check చేయండి
3. 5 నిమిషాలు వేచి ఉండి try చేయండి
4. HTTP referrers correct గా add అయ్యాయో check చేయండి

---

### **సమస్య 2: "RefererNotAllowedMapError"**

**కారణం:**
- మీ website URL HTTP referrers లో add కాలేదు

**పరిష్కారం:**
1. Credentials → Edit API key
2. HTTP referrers section లో మీ URL add చేయండి
3. `https://yourdomain.com/*` format లో
4. Save చేసి 5 నిమిషాలు వేచి ఉండండి

---

### **సమస్య 3: "BillingNotEnabledMapError"**

**కారణం:**
- Billing enable కాలేదు

**పరిష్కారం:**
1. Billing → Create billing account
2. Credit card add చేయండి
3. Billing account ని project కి link చేయండి

---

### **సమస్య 4: "This API project is not authorized to use this API"**

**కారణం:**
- API restrictions లో Maps JavaScript API select కాలేదు

**పరిష్కారం:**
1. Credentials → Edit API key
2. API restrictions → Restrict key
3. Maps JavaScript API select చేయండి
4. Save చేయండి

---

## 📞 మరింత సహాయం కావాలా?

### **నాకు ఈ విషయాలు అడగండి:**
- ✅ Google Cloud account సెటప్ లో ఏదైనా doubt
- ✅ API key తీసుకోవడంలో సమస్య
- ✅ Restrictions సెట్ చేయడంలో confusion
- ✅ Billing setup గురించి questions
- ✅ Error messages అర్థం కాకపోతే
- ✅ Maps పని చేయడం లేదంటే

### **నేను సహాయం చేస్తాను:**
- 🔍 Step-by-step screenshots తో guide చేస్తాను
- 🐛 Errors fix చేస్తాను
- 🧪 Map functionality test చేస్తాను
- 📊 Usage monitor చేయడం నేర్పిస్తాను

---

## 🎊 అభినందనలు!

మీరు ఇప్పుడు Google Maps API key తీసుకోవడం నేర్చుకున్నారు!

### **ఇప్పుడు ఏం చేయాలి:**

1. **మీరు:**
   - పైన చెప్పిన steps follow అవ్వండి
   - API key తీసుకోండి
   - నాకు షేర్ చేయండి

2. **నేను:**
   - Code లో add చేస్తాను
   - Frontend restart చేస్తాను
   - Maps test చేస్తాను
   - Screenshot చూపిస్తాను

3. **మీరు:**
   - Maps working చూస్తారు
   - Properties, Projects, Requirements markers చూస్తారు
   - IncomeLands app ready! 🎉

---

## 🔐 Security Tips - గుర్తుంచుకోండి:

1. ❌ **API key ను ఎవరితోనూ షేర్ చేయకండి** (నేను తప్ప)
2. ❌ **API key ను public చేయకండి** (GitHub, Facebook, WhatsApp groups)
3. ✅ **HTTP referrers తప్పకుండా add చేయండి**
4. ✅ **Budget alerts set చేసుకోండి**
5. ✅ **Monthly usage check చేయండి**

---

**ప్రశ్నలు ఉంటే అడగండి! నేను సహాయం చేస్తాను! 😊**

---

## 📸 ముఖ్యమైన Screens ఎలా కనిపిస్తాయి:

### **1. Google Cloud Console Home:**
```
┌─────────────────────────────────────────┐
│ ≡ Google Cloud    IncomeLands-App ▼    │
├─────────────────────────────────────────┤
│                                          │
│    Welcome to Google Cloud Console      │
│                                          │
│    [ APIs & Services ]                  │
│    [ Billing ]                          │
│    [ Credentials ]                      │
│                                          │
└─────────────────────────────────────────┘
```

### **2. API Library:**
```
┌─────────────────────────────────────────┐
│  Search: Maps JavaScript API     🔍     │
├─────────────────────────────────────────┤
│                                          │
│  📍 Maps JavaScript API                 │
│     Customizable maps for your website  │
│     [ ENABLE ]                          │
│                                          │
└─────────────────────────────────────────┘
```

### **3. API Key Created:**
```
┌─────────────────────────────────────────┐
│  API key created                        │
│                                          │
│  AIzaSyC9xXxxxxxxxxxxxxxxxxxxxxxxx     │
│                              [ COPY ]   │
│                                          │
│  [ RESTRICT KEY ]    [ CLOSE ]         │
└─────────────────────────────────────────┘
```

### **4. HTTP Referrers:**
```
┌─────────────────────────────────────────┐
│  Application restrictions               │
│                                          │
│  ○ None                                 │
│  ● HTTP referrers (web sites)          │
│                                          │
│  https://yourdomain.com/*               │
│  [ + ADD AN ITEM ]                     │
└─────────────────────────────────────────┘
```

---

**ఇక మీ API key ఎదురు చూస్తున్నాను! 🚀**

# MSG91 IP Whitelisting Guide - RETOERP

## 🌐 Your Server IP Addresses

Based on your current RETOERP deployment, here are the IP addresses you need to whitelist in MSG91:

---

### **📍 IP Addresses to Whitelist:**

#### **1. Public IP Address (MAIN - MUST WHITELIST):**
```
34.16.56.64
```
**This is your outgoing public IP address that MSG91 will see when your server makes API calls.**

#### **2. Internal/Private IP Address (For reference only):**
```
10.64.144.59
```
**This is your internal server IP - do NOT whitelist this in MSG91 (it won't work)**

---

## 🔧 How to Whitelist IPs in MSG91 Dashboard

### **Step-by-Step Instructions:**

#### **Option 1: When Creating New Auth Key**

1. **Login to MSG91 Dashboard**
   - Go to: https://control.msg91.com/app/

2. **Create New Auth Key**
   - Click on your profile/username (top right)
   - Select **"Authkey"** → **"Create New"**

3. **Enable IP Security**
   - In the Auth Key creation form:
   - ☑️ **Enable IP security by default** (check this box)

4. **Add Your IP Address**
   - In the **"Whitelist IPs"** field, enter:
   ```
   34.16.56.64
   ```

5. **Click "Create"**

---

#### **Option 2: Edit Existing Auth Key**

1. **Login to MSG91 Dashboard**
   - Go to: https://control.msg91.com/app/

2. **Go to Authkey Settings**
   - Click profile → **"Authkey"**
   - Find your existing Auth Key
   - Click **"Edit"** or **"Settings"** icon

3. **Enable IP Security**
   - Toggle **"IP Security"** ON

4. **Add Whitelisted IP**
   - In the **"Whitelist IPs"** field:
   ```
   34.16.56.64
   ```
   - Click **"+"** or **"Add"** button

5. **Save Changes**

---

#### **Option 3: From Recent IPs List**

1. **Login to MSG91 Dashboard**

2. **Go to Authkey → IP Whitelisting**

3. **View Recent IPs**
   - MSG91 tracks recent IPs from which submissions were received
   - If you've already made test API calls, you'll see `34.16.56.64` in the list

4. **Click the "+" Icon**
   - Next to your IP address `34.16.56.64`
   - This automatically adds it to whitelist

5. **Confirm**

---

## ✅ Verification After Whitelisting

### **How to Verify IP is Whitelisted:**

1. **Check Authkey Settings**
   - Go to MSG91 Dashboard → Authkey
   - Click on your Auth Key
   - Under "IP Security" or "Whitelisted IPs"
   - You should see: `34.16.56.64`

2. **Test API Call**
   - Make a test API call from your RETOERP backend
   - If whitelisting is successful, API calls will work
   - If NOT whitelisted, you'll get error: **418 - IP not whitelisted**

---

## 🎯 Summary - Copy & Paste This:

**For MSG91 Dashboard → Authkey → Whitelist IPs:**

```
34.16.56.64
```

---

## ⚠️ Important Notes

### **1. Why Whitelist IPs?**
- **Security:** Prevents unauthorized access to your MSG91 account
- **Protection:** Even if someone gets your Auth Key, they can't use it from unauthorized IPs
- **Best Practice:** Recommended for all production applications

### **2. What Happens if IP Changes?**
- If your server IP changes (rare but possible), you'll need to:
  1. Update the whitelist in MSG91 dashboard
  2. Add the new IP address
  3. Remove the old IP (optional)

### **3. Multiple Environments?**
- If you have multiple environments (Dev, Staging, Production):
  - Use **separate Auth Keys** for each environment
  - Each Auth Key can have its own whitelisted IPs
  - This provides better security isolation

### **4. Dynamic IPs?**
- If your server has a dynamic IP (changes frequently):
  - Consider using a static IP for production
  - Or disable IP whitelisting (not recommended for production)
  - Or use MSG91's domain whitelisting feature

### **5. Testing from Local Machine?**
- If you want to test MSG91 from your local development machine:
  - Find your local IP: Visit https://whatismyipaddress.com/
  - Add that IP to the whitelist temporarily
  - Remove it after testing for security

---

## 🔍 Troubleshooting

### **Problem: Getting "418 - IP not whitelisted" Error**

**Solution 1:** Check if IP is correctly whitelisted
```bash
# Check your current public IP
curl ifconfig.me
# Should show: 34.16.56.64
```

**Solution 2:** Wait 5 minutes after adding IP
- MSG91 takes a few minutes to propagate IP whitelist changes

**Solution 3:** Clear any caching
- Restart your backend service
```bash
sudo supervisorctl restart backend
```

**Solution 4:** Verify Auth Key
- Make sure you're using the correct Auth Key that has the IP whitelisted

---

### **Problem: IP Changed and API Stopped Working**

**Check Current IP:**
```bash
curl ifconfig.me
```

**If Different from 34.16.56.64:**
1. Note the new IP address
2. Add new IP to MSG91 whitelist
3. Test API calls

---

## 📋 Quick Reference Card

```
═══════════════════════════════════════════════
        MSG91 IP WHITELISTING INFO
═══════════════════════════════════════════════

Your Server Public IP:     34.16.56.64

MSG91 Dashboard URL:       https://control.msg91.com/app/

Where to Add:             Profile → Authkey → 
                          IP Security → Whitelist IPs

What to Enter:            34.16.56.64

Verification:             Test API call should work
                          No 418 error

Support:                  support@msg91.com
                          (if issues persist)

═══════════════════════════════════════════════
```

---

## 🚀 Next Steps After Whitelisting

1. ✅ **Whitelist IP** `34.16.56.64` in MSG91 dashboard
2. ✅ **Share your Auth Key** and other credentials with me
3. ✅ **I'll integrate** MSG91 into RETOERP backend
4. ✅ **Test SMS** sending functionality
5. ✅ **Go live** with SMS features! 📱

---

**Need help with the whitelisting process? Let me know and I can guide you step-by-step with screenshots!** 😊

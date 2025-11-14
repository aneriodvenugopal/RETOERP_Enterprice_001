# RETOERP ERP Module - Quick Testing Guide

## 🎯 How to Test Each Module

---

## Prerequisites
**Login:** Go to `/login` → Use tenant admin credentials

---

## 1. Payment Schemes (`/schemes`) - 5 mins

### Tests:
1. **Create:** Click "Create Scheme" → Add name, fields → Save ✅
2. **Edit:** Click "Edit" on draft → Modify → Save ✅
3. **Finalize:** Click "Finalize" → Confirm → Check locked ✅
4. **Clone:** Click clone icon → Verify copy created ✅
5. **Delete:** Click delete on draft → Confirm ✅

**Quick Check:** Total amount calculates? Finalized can't edit?

---

## 2. Staff Hierarchy (`/staff-hierarchy`) - 5 mins

### Tests:
1. **Add Manager:** Click "Add Staff" → Name, phone, role: Manager, commissions → Save ✅
2. **Add Agent:** Click "Add Staff" → Select manager in "Reports To" → Save ✅
3. **Expand:** Click chevron → See subordinates ✅
4. **Edit:** Change parent → Save → Hierarchy updates ✅
5. **Delete:** Try delete with subordinates (fails) ✅

**Quick Check:** Tree shows correctly? Commission % visible?

---

## 3. Customer Payments (`/payments`) - 5 mins

### Tests:
1. **Manual:** Click "Record Payment" → Select booking → Choose "Manual" → NEFT → Enter details → Save ✅
2. **Cheque:** Same flow → Choose "Cheque" → Enter cheque details ✅
3. **Razorpay:** Choose "Razorpay" → Should open payment modal ✅
4. **View:** Check list → Filter by status → Search by name ✅

**Quick Check:** Auto-fills customer? Commission auto-calculated?

---

## 4. Commission Dashboard (`/commissions`) - 5 mins

### Tests:
1. **View:** See commissions list → Check status badges ✅
2. **Filter:** Click status filters → Type filters → Updates ✅
3. **Approve:** Click green thumb on pending → Status changes ✅
4. **Details:** Click eye icon → See breakdown, TDS ✅
5. **Staff View:** Login as staff → See only personal ✅

**Quick Check:** TDS = 5%? Approval works?

---

## 5. Agent Payouts (`/payouts`) - 5 mins

### Tests:
1. **Access:** Login as admin → Page loads ✅
2. **Create:** Click "Create Payout" → Select staff → Check commissions → Select some → Total updates ✅
3. **Method:** Choose bank transfer → Enter account details ✅
4. **Save:** Click "Create Payout" → Success ✅
5. **View:** Check payouts table → Click eye icon ✅

**Quick Check:** Only approved commissions show? Total correct?

---

## 6. WorkforceMap (`/workforce-map`) - 3 mins

### Tests:
1. **Map:** Page loads → Markers display ✅
2. **Click Marker:** Info window opens ✅
3. **Click Card:** Map centers on worker ✅
4. **Filter:** Select skill type → Results update ✅

**Quick Check:** Markers showing? Click actions work?

---

## 7. PWA Installation - 2 mins

### Tests:
1. **Footer Button:** Scroll to tenant landing page footer → See "Install App" ✅
2. **Click:** Click button → Install prompt appears ✅
3. **Auto Prompt:** Wait 5 sec → Banner appears at bottom ✅

**Quick Check:** Button visible? Prompt works?

---

## 🔄 End-to-End Test (10 mins)

**Complete Flow:**
1. Create scheme → Add 2 staff (manager + agent)
2. Record payment ₹100k → Check 2 commissions auto-created
3. Approve both → Go to payouts
4. Create payout → Verify status changes to "Paid"

**Quick Check:** All steps work? Commissions calculated correctly?

---

## ✅ Quick Validation

- [ ] All pages load without errors
- [ ] All buttons work
- [ ] Toast notifications show
- [ ] Filters work
- [ ] Forms validate
- [ ] Auto-calculations correct

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Invalid token" | Login again |
| No data showing | Create test data first |
| Can't approve | Must be admin |
| Map not loading | Check coordinates exist |

---

## 📊 What to Check

**Numbers:** Commission = payment × %, TDS = 5%, Net = Gross - TDS
**Security:** Staff see only theirs, admins see all
**Status:** Pending → Approved → Paid
**UI:** Professional, responsive, no errors

---

## 🎉 Success = All Tests Pass!

**Total Time:** ~30 minutes for complete testing

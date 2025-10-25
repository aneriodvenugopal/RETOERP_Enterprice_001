# IncomeLands Marketplace API Testing Guide

This guide explains how to test the IncomeLands-RETOERP marketplace integration APIs.

## 🎯 What You're Testing

You've built a complete backend API system that allows the IncomeLands Android app to:
- Register agents
- Search RETOERP projects and properties on a map
- Submit buyer leads to developers
- Unlock developer contacts for ₹10
- Post buyer requirements
- Calculate and track commissions
- View marketplace analytics

## 📱 Testing Methods

### **Method 1: Interactive Web Interface** (Easiest)

Open this URL in your browser:
```
http://your-domain/incomelands-tester.html
```

Or if running locally:
```
http://localhost:3000/incomelands-tester.html
```

**Features:**
- ✅ Beautiful UI to test all marketplace APIs
- ✅ Click buttons to test each endpoint
- ✅ View JSON responses in real-time
- ✅ No coding required

**Test Flow:**
1. Click "Register Agent" - creates an IncomeLands agent
2. Click "Search Projects" - finds projects near Hyderabad
3. Click "Search Properties" - searches available properties
4. Click "Submit Lead" - agent submits a buyer lead
5. Click "Create Requirement" - posts buyer requirement
6. Click "Get Statistics" - view marketplace analytics

---

### **Method 2: Command Line Testing** (Quick)

Run the test script I created:

```bash
cd /app
bash test_incomelands_apis.sh
```

This will automatically test all 7 marketplace endpoints and show results.

---

### **Method 3: Manual cURL Commands** (For Developers)

#### 1. Register an Agent
```bash
curl -X POST http://your-domain/api/marketplace/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "email": "ramesh@incomelands.com",
    "city": "Hyderabad",
    "state": "Telangana",
    "areas_covered": ["Gachibowli", "HITEC City"],
    "latitude": 17.385,
    "longitude": 78.486,
    "experience_years": 5
  }'
```

#### 2. Search Projects (Geo-Location Based)
```bash
curl "http://your-domain/api/marketplace/projects?latitude=17.385&longitude=78.486&radius_km=20"
```

#### 3. Search Properties
```bash
curl "http://your-domain/api/marketplace/properties/search?city=Hyderabad&status=available&min_price=1000000&max_price=5000000"
```

#### 4. Submit a Lead
```bash
curl -X POST http://your-domain/api/marketplace/leads/submit \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "YOUR_TENANT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "agent_id": "YOUR_AGENT_ID",
    "agent_name": "Ramesh Kumar",
    "agent_phone": "9876543210",
    "buyer_name": "Suresh Reddy",
    "buyer_phone": "9988776655",
    "buyer_email": "suresh@example.com",
    "budget": 5000000,
    "notes": "Interested in 1500 sqft plot"
  }'
```

#### 5. Unlock Developer Contact (₹10)
```bash
curl -X POST http://your-domain/api/marketplace/unlock-contact \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "YOUR_AGENT_ID",
    "agent_phone": "9876543210",
    "tenant_id": "YOUR_TENANT_ID",
    "project_id": "YOUR_PROJECT_ID",
    "payment_method": "credits",
    "transaction_id": "TXN123456"
  }'
```

#### 6. Create Buyer Requirement
```bash
curl -X POST http://your-domain/api/marketplace/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "requirement_type": "buy",
    "property_type": "plot",
    "budget_min": 3000000,
    "budget_max": 7000000,
    "preferred_locations": ["Hyderabad"],
    "latitude": 17.385,
    "longitude": 78.486,
    "radius_km": 15,
    "min_area": 1200,
    "max_area": 2000,
    "buyer_name": "Prakash Rao",
    "buyer_phone": "9876543211",
    "is_direct_buyer": true
  }'
```

#### 7. Get Marketplace Statistics
```bash
curl "http://your-domain/api/marketplace/stats/overview"
```

---

## 🔑 All Available Endpoints

### **Agent Management**
- `POST /api/marketplace/agents/register` - Register agent
- `GET /api/marketplace/agents/{agent_id}` - Get agent profile
- `GET /api/marketplace/agents/phone/{phone}` - Lookup by phone

### **Projects & Properties**
- `GET /api/marketplace/projects` - List projects (geo-location, filters)
- `GET /api/marketplace/projects/{project_id}` - Project details
- `GET /api/marketplace/properties/search` - Search properties

### **Contact Unlock**
- `POST /api/marketplace/unlock-contact` - Unlock developer contact (₹10)

### **Lead Management**
- `POST /api/marketplace/leads/submit` - Submit lead to developer
- `GET /api/marketplace/leads/agent/{agent_id}` - Agent's leads
- `PATCH /api/marketplace/leads/{lead_id}` - Update lead status

### **Buyer Requirements**
- `POST /api/marketplace/requirements` - Create requirement
- `GET /api/marketplace/requirements` - List requirements
- `GET /api/marketplace/requirements/{id}/matches` - AI matching (0-100 score)

### **Commission System**
- `POST /api/marketplace/commissions/calculate` - Calculate commission
- `GET /api/marketplace/commissions/agent/{agent_id}` - Agent commissions
- `PATCH /api/marketplace/commissions/{commission_id}` - Update status

### **Analytics**
- `GET /api/marketplace/stats/overview` - Platform-wide stats
- `GET /api/marketplace/stats/developer/{tenant_id}` - Developer stats

---

## 📊 What to Verify

When testing, check:

1. **Agent Registration**: ✅ Agent created with ID
2. **Geo-Location Search**: ✅ Projects sorted by distance
3. **Property Search**: ✅ Filters working (price, area, type)
4. **Data Enrichment**: ✅ Developer names, project names included
5. **Lead Creation**: ✅ Created in both `marketplace_leads` and `leads` collections
6. **Contact Unlock**: ✅ Returns actual phone/email, ₹10 charged
7. **AI Matching**: ✅ Scores between 0-100
8. **Commission Calculation**: ✅ 1% to agent, 10% platform fee

---

## 🚀 Next Steps: Actual IncomeLands App Integration

To integrate the real IncomeLands Android app:

1. **Update IncomeLands API URLs**: Point to `http://your-domain/api/marketplace`
2. **Implement API Calls**: Use the same endpoints shown above
3. **Map View Integration**: Use `/marketplace/projects` with user's GPS coordinates
4. **Lead Submission**: When agent clicks "Submit Lead" in app
5. **Contact Unlock**: When agent pays ₹10 to view developer contact

---

## 📝 Testing Checklist

- [ ] Web interface loads correctly
- [ ] Agent registration works
- [ ] Project search returns results with distances
- [ ] Property search with filters works
- [ ] Lead submission creates entries in both tables
- [ ] Contact unlock returns developer phone/email
- [ ] Buyer requirement creation works
- [ ] AI matching returns scored properties
- [ ] Statistics show correct data
- [ ] All endpoints return valid JSON responses

---

## 🆘 Troubleshooting

**No projects found?**
- Make sure projects exist in database with `latitude` and `longitude` set
- Check projects are `active` and `deleted_at` is `null`

**Commission calculation failing?**
- Ensure booking exists in database
- Verify marketplace lead exists
- Check property has valid `price` field

**Contact unlock not working?**
- Verify tenant/developer exists with phone/email
- Check agent is registered

---

## 💡 Pro Tip

The marketplace APIs are **public** (no authentication required) because IncomeLands app has its own login system. The APIs use `agent_phone` and `agent_id` for identification.

---

For questions or issues, check the backend logs:
```bash
tail -f /var/log/supervisor/backend.err.log
```

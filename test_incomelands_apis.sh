#!/bin/bash

# IncomeLands Marketplace API Testing Script
# This simulates how the IncomeLands Android app would call RETOERP APIs

echo "======================================"
echo "IncomeLands Marketplace API Testing"
echo "======================================"

# Get backend URL
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)
API_BASE="${BACKEND_URL}/api/marketplace"

echo "Backend URL: $API_BASE"
echo ""

# Test 1: Register an Agent (simulate IncomeLands agent)
echo "1️⃣ Testing Agent Registration..."
echo "POST ${API_BASE}/agents/register"

AGENT_RESPONSE=$(curl -s -X POST "${API_BASE}/agents/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ramesh Kumar",
    "phone": "9876543210",
    "email": "ramesh@incomelands.com",
    "city": "Hyderabad",
    "state": "Telangana",
    "areas_covered": ["Gachibowli", "HITEC City", "Madhapur"],
    "latitude": 17.385,
    "longitude": 78.486,
    "experience_years": 5
  }')

echo "$AGENT_RESPONSE" | python3 -m json.tool
AGENT_ID=$(echo "$AGENT_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('agent', {}).get('id', ''))" 2>/dev/null)
echo "✅ Agent ID: $AGENT_ID"
echo ""

# Test 2: Search Projects near Hyderabad
echo "2️⃣ Testing Project Search (Geo-location based)..."
echo "GET ${API_BASE}/projects?latitude=17.385&longitude=78.486&radius_km=20"

curl -s "${API_BASE}/projects?latitude=17.385&longitude=78.486&radius_km=20" | python3 -m json.tool | head -50
echo ""

# Test 3: Search Properties
echo "3️⃣ Testing Property Search..."
echo "GET ${API_BASE}/properties/search?city=Hyderabad&status=available"

curl -s "${API_BASE}/properties/search?city=Hyderabad&status=available&limit=5" | python3 -m json.tool | head -50
echo ""

# Test 4: Get Agent Profile
if [ ! -z "$AGENT_ID" ]; then
  echo "4️⃣ Testing Agent Profile..."
  echo "GET ${API_BASE}/agents/${AGENT_ID}"
  
  curl -s "${API_BASE}/agents/${AGENT_ID}" | python3 -m json.tool
  echo ""
fi

# Test 5: Submit a Lead (agent submits buyer lead to developer)
echo "5️⃣ Testing Lead Submission..."
echo "POST ${API_BASE}/leads/submit"

# First get a project ID
PROJECT_ID=$(curl -s "${API_BASE}/projects?limit=1" | python3 -c "import sys, json; data=json.load(sys.stdin); projects=data.get('projects', []); print(projects[0]['id'] if projects else '')" 2>/dev/null)

if [ ! -z "$PROJECT_ID" ] && [ ! -z "$AGENT_ID" ]; then
  TENANT_ID=$(curl -s "${API_BASE}/projects?limit=1" | python3 -c "import sys, json; data=json.load(sys.stdin); projects=data.get('projects', []); print(projects[0]['tenant_id'] if projects else '')" 2>/dev/null)
  
  curl -s -X POST "${API_BASE}/leads/submit" \
    -H "Content-Type: application/json" \
    -d "{
      \"tenant_id\": \"$TENANT_ID\",
      \"project_id\": \"$PROJECT_ID\",
      \"agent_id\": \"$AGENT_ID\",
      \"agent_name\": \"Ramesh Kumar\",
      \"agent_phone\": \"9876543210\",
      \"buyer_name\": \"Suresh Reddy\",
      \"buyer_phone\": \"9988776655\",
      \"buyer_email\": \"suresh@example.com\",
      \"budget\": 5000000,
      \"notes\": \"Interested in 1500 sqft plot\",
      \"source_detail\": \"Map View\"
    }" | python3 -m json.tool
  
  echo "✅ Lead submitted successfully"
else
  echo "⚠️ Skipping (no project found or agent not created)"
fi
echo ""

# Test 6: Create Buyer Requirement
echo "6️⃣ Testing Buyer Requirement Creation..."
echo "POST ${API_BASE}/requirements"

curl -s -X POST "${API_BASE}/requirements" \
  -H "Content-Type: application/json" \
  -d '{
    "requirement_type": "buy",
    "property_type": "plot",
    "budget_min": 3000000,
    "budget_max": 7000000,
    "preferred_locations": ["Hyderabad", "Gachibowli"],
    "latitude": 17.385,
    "longitude": 78.486,
    "radius_km": 15,
    "min_area": 1200,
    "max_area": 2000,
    "buyer_name": "Prakash Rao",
    "buyer_phone": "9876543211",
    "buyer_email": "prakash@example.com",
    "is_direct_buyer": true
  }' | python3 -m json.tool
echo ""

# Test 7: Marketplace Statistics
echo "7️⃣ Testing Marketplace Analytics..."
echo "GET ${API_BASE}/stats/overview"

curl -s "${API_BASE}/stats/overview" | python3 -m json.tool
echo ""

echo "======================================"
echo "✅ All Tests Complete!"
echo "======================================"

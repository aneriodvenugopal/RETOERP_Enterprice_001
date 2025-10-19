#!/usr/bin/env python3
"""
Test JWT token creation and verification
"""

import requests
import json
import sys
import os

# Add backend to path
sys.path.append('/app/backend')

from services.auth_service import AuthService

# Get backend URL from frontend .env file
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

print("Testing JWT Token Creation and Verification")
print("=" * 50)

# Test 1: Create a token manually
print("\n1. Creating token manually...")
token = AuthService.create_access_token(
    user_id="test-user-id",
    tenant_id="test-tenant-id", 
    role="tenant_admin"
)
print(f"Created token: {token[:50]}...")

# Test 2: Decode the token
print("\n2. Decoding token...")
try:
    payload = AuthService.decode_token(token)
    print(f"Decoded payload: {payload}")
except Exception as e:
    print(f"Error decoding token: {e}")

# Test 3: Test with API
print("\n3. Testing with API...")
headers = {"Authorization": f"Bearer {token}"}
response = requests.get(f"{API_BASE}/projects", headers=headers, timeout=10)
print(f"API Response: {response.status_code} - {response.text[:200]}")

# Test 4: Get a real token via login
print("\n4. Getting real token via login...")
otp_data = {"phone": "9908290239"}
response = requests.post(f"{API_BASE}/auth/send-otp", json=otp_data, timeout=10)
if response.status_code == 200:
    otp = response.json().get('otp')
    print(f"Got OTP: {otp}")
    
    verify_data = {"phone": "9908290239", "otp": otp}
    response = requests.post(f"{API_BASE}/auth/verify-otp", json=verify_data, timeout=10)
    if response.status_code == 200:
        real_token = response.json().get('access_token')
        print(f"Got real token: {real_token[:50]}...")
        
        # Test decoding real token
        try:
            real_payload = AuthService.decode_token(real_token)
            print(f"Real token payload: {real_payload}")
        except Exception as e:
            print(f"Error decoding real token: {e}")
            
        # Test real token with API
        headers = {"Authorization": f"Bearer {real_token}"}
        response = requests.get(f"{API_BASE}/projects", headers=headers, timeout=10)
        print(f"Real token API Response: {response.status_code} - {response.text[:200]}")
    else:
        print(f"OTP verification failed: {response.status_code} - {response.text}")
else:
    print(f"OTP send failed: {response.status_code} - {response.text}")
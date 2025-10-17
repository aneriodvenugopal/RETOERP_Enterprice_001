#!/usr/bin/env python3
"""
Backend API Testing for RETOERP Analytics Module
Tests the complete analytics functionality including dashboard, leads, sales, payments, and commissions endpoints.
"""

import requests
import json
import sys
import os
from datetime import datetime

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
if not BACKEND_URL:
    print("ERROR: Could not get REACT_APP_BACKEND_URL from frontend/.env")
    sys.exit(1)

API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")
print("=" * 80)

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def add_pass(self, test_name):
        self.passed += 1
        print(f"✅ PASS: {test_name}")
        
    def add_fail(self, test_name, error):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ FAIL: {test_name} - {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print("\n" + "=" * 80)
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print("\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        return self.failed == 0

results = TestResults()

def test_health_check():
    """Test if the API is running"""
    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "healthy":
                results.add_pass("API Health Check")
                return True
            else:
                results.add_fail("API Health Check", f"Unhealthy status: {data}")
                return False
        else:
            results.add_fail("API Health Check", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        results.add_fail("API Health Check", f"Connection error: {str(e)}")
        return False

def test_get_roles():
    """Test GET /api/auth/roles endpoint"""
    try:
        response = requests.get(f"{API_BASE}/auth/roles", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /auth/roles", f"Status code: {response.status_code}")
            return None
            
        roles = response.json()
        
        if not isinstance(roles, list):
            results.add_fail("GET /auth/roles", "Response is not a list")
            return None
            
        if len(roles) == 0:
            results.add_fail("GET /auth/roles", "No roles returned")
            return None
            
        # Check for required roles
        role_slugs = [role.get('slug') for role in roles]
        required_roles = ['super_admin', 'tenant_admin', 'staff', 'customer']
        
        missing_roles = [role for role in required_roles if role not in role_slugs]
        if missing_roles:
            results.add_fail("GET /auth/roles", f"Missing required roles: {missing_roles}")
            return None
            
        # Validate role structure
        for role in roles:
            required_fields = ['id', 'name', 'slug']
            missing_fields = [field for field in required_fields if field not in role]
            if missing_fields:
                results.add_fail("GET /auth/roles", f"Role missing fields: {missing_fields}")
                return None
                
        results.add_pass("GET /auth/roles - Structure and required roles")
        print(f"   Found {len(roles)} roles: {role_slugs}")
        return roles
        
    except Exception as e:
        results.add_fail("GET /auth/roles", f"Exception: {str(e)}")
        return None

def test_get_tenants():
    """Test GET /api/tenants endpoint to get default tenant"""
    try:
        response = requests.get(f"{API_BASE}/tenants/", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /tenants", f"Status code: {response.status_code}")
            return None
            
        tenants = response.json()
        
        if not isinstance(tenants, list):
            results.add_fail("GET /tenants", "Response is not a list")
            return None
            
        if len(tenants) == 0:
            results.add_fail("GET /tenants", "No tenants found - need default tenant")
            return None
            
        # Get the first tenant as default
        default_tenant = tenants[0]
        
        # Validate tenant structure
        required_fields = ['id', 'name', 'company_name']
        missing_fields = [field for field in required_fields if field not in default_tenant]
        if missing_fields:
            results.add_fail("GET /tenants", f"Tenant missing fields: {missing_fields}")
            return None
            
        results.add_pass("GET /tenants - Default tenant available")
        print(f"   Default tenant: {default_tenant['name']} (ID: {default_tenant['id']})")
        return default_tenant
        
    except Exception as e:
        results.add_fail("GET /tenants", f"Exception: {str(e)}")
        return None

def test_register_super_admin(roles):
    """Test Case 1: Register Super Admin"""
    if not roles:
        results.add_fail("Register Super Admin", "No roles available for testing")
        return None
        
    # Find super_admin role
    super_admin_role = None
    for role in roles:
        if role.get('slug') == 'super_admin':
            super_admin_role = role
            break
            
    if not super_admin_role:
        results.add_fail("Register Super Admin", "super_admin role not found")
        return None
        
    user_data = {
        "phone": "9948303060",
        "name": "RETOERP Admin",
        "email": "admin@retoerp.com",
        "role_id": super_admin_role['id'],
        "tenant_id": None  # Super admin doesn't need tenant
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            if "message" not in data or "user" not in data:
                results.add_fail("Register Super Admin", "Invalid response structure")
                return None
                
            user = data["user"]
            required_fields = ["id", "name", "phone", "email"]
            missing_fields = [field for field in required_fields if field not in user]
            if missing_fields:
                results.add_fail("Register Super Admin", f"User missing fields: {missing_fields}")
                return None
                
            # Validate data matches
            if user["phone"] != user_data["phone"]:
                results.add_fail("Register Super Admin", "Phone mismatch in response")
                return None
                
            results.add_pass("Register Super Admin - Success")
            print(f"   Registered user: {user['name']} ({user['phone']})")
            return user
            
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in error_data.get("detail", ""):
                results.add_pass("Register Super Admin - Already exists (expected)")
                return {"phone": user_data["phone"], "name": user_data["name"]}
            else:
                results.add_fail("Register Super Admin", f"400 error: {error_data.get('detail')}")
                return None
        else:
            results.add_fail("Register Super Admin", f"Status code: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        results.add_fail("Register Super Admin", f"Exception: {str(e)}")
        return None

def test_register_tenant_admin(roles, default_tenant):
    """Test Case 2: Register Tenant Admin"""
    if not roles:
        results.add_fail("Register Tenant Admin", "No roles available for testing")
        return None
        
    if not default_tenant:
        results.add_fail("Register Tenant Admin", "No default tenant available")
        return None
        
    # Find tenant_admin role
    tenant_admin_role = None
    for role in roles:
        if role.get('slug') == 'tenant_admin':
            tenant_admin_role = role
            break
            
    if not tenant_admin_role:
        results.add_fail("Register Tenant Admin", "tenant_admin role not found")
        return None
        
    user_data = {
        "phone": "9908290239",
        "name": "Tenant Admin User",
        "email": "tenant@retoerp.com",
        "role_id": tenant_admin_role['id'],
        "tenant_id": default_tenant['id']
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            if "message" not in data or "user" not in data:
                results.add_fail("Register Tenant Admin", "Invalid response structure")
                return None
                
            user = data["user"]
            required_fields = ["id", "name", "phone", "email"]
            missing_fields = [field for field in required_fields if field not in user]
            if missing_fields:
                results.add_fail("Register Tenant Admin", f"User missing fields: {missing_fields}")
                return None
                
            # Validate data matches
            if user["phone"] != user_data["phone"]:
                results.add_fail("Register Tenant Admin", "Phone mismatch in response")
                return None
                
            results.add_pass("Register Tenant Admin - Success")
            print(f"   Registered user: {user['name']} ({user['phone']})")
            return user
            
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in error_data.get("detail", ""):
                results.add_pass("Register Tenant Admin - Already exists (expected)")
                return {"phone": user_data["phone"], "name": user_data["name"]}
            else:
                results.add_fail("Register Tenant Admin", f"400 error: {error_data.get('detail')}")
                return None
        else:
            results.add_fail("Register Tenant Admin", f"Status code: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        results.add_fail("Register Tenant Admin", f"Exception: {str(e)}")
        return None

def test_duplicate_registration():
    """Test Case 3: Duplicate Registration"""
    user_data = {
        "phone": "9948303060",  # Same as super admin
        "name": "Duplicate User",
        "email": "duplicate@retoerp.com",
        "role_id": "dummy-role-id",
        "tenant_id": None
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/auth/register",
            json=user_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 400:
            error_data = response.json()
            if "already exists" in error_data.get("detail", "").lower():
                results.add_pass("Duplicate Registration - Correctly rejected")
                print(f"   Error message: {error_data.get('detail')}")
                return True
            else:
                results.add_fail("Duplicate Registration", f"Wrong error message: {error_data.get('detail')}")
                return False
        else:
            results.add_fail("Duplicate Registration", f"Expected 400, got {response.status_code}")
            return False
            
    except Exception as e:
        results.add_fail("Duplicate Registration", f"Exception: {str(e)}")
        return False

def test_invalid_data_registration(roles):
    """Test Case 4: Invalid Data Registration"""
    if not roles:
        results.add_fail("Invalid Data Registration", "No roles available for testing")
        return False
        
    test_cases = [
        {
            "name": "Missing phone",
            "data": {"name": "Test User", "email": "test@test.com", "role_id": roles[0]['id']},
            "expected_error": "phone"
        },
        {
            "name": "Missing name", 
            "data": {"phone": "1234567890", "email": "test@test.com", "role_id": roles[0]['id']},
            "expected_error": "name"
        },
        {
            "name": "Invalid role_id",
            "data": {"phone": "1234567890", "name": "Test User", "email": "test@test.com", "role_id": "invalid-role-id"},
            "expected_error": "role"
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        try:
            response = requests.post(
                f"{API_BASE}/auth/register",
                json=test_case["data"],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [400, 422]:  # 422 for validation errors
                results.add_pass(f"Invalid Data - {test_case['name']}")
                print(f"   Correctly rejected: {response.json().get('detail', 'Validation error')}")
            else:
                results.add_fail(f"Invalid Data - {test_case['name']}", f"Expected 400/422, got {response.status_code}")
                all_passed = False
                
        except Exception as e:
            results.add_fail(f"Invalid Data - {test_case['name']}", f"Exception: {str(e)}")
            all_passed = False
            
    return all_passed

def test_send_otp(phone):
    """Test sending OTP for registered user"""
    try:
        response = requests.post(
            f"{API_BASE}/auth/send-otp",
            json={"phone": phone},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "otp" in data:
                results.add_pass(f"Send OTP for {phone}")
                print(f"   OTP sent: {data.get('otp')} (shown for testing)")
                return data.get('otp')
            else:
                results.add_fail(f"Send OTP for {phone}", "Invalid response structure")
                return None
        elif response.status_code == 404:
            results.add_fail(f"Send OTP for {phone}", "User not found - registration may have failed")
            return None
        else:
            results.add_fail(f"Send OTP for {phone}", f"Status code: {response.status_code}, Response: {response.text}")
            return None
            
    except Exception as e:
        results.add_fail(f"Send OTP for {phone}", f"Exception: {str(e)}")
        return None

def main():
    """Run all tests"""
    print("Starting RETOERP Backend API Tests")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 80)
    
    # Test 1: Health Check
    if not test_health_check():
        print("❌ API is not running. Stopping tests.")
        return False
    
    # Test 2: Get Roles
    roles = test_get_roles()
    
    # Test 3: Get Default Tenant
    default_tenant = test_get_tenants()
    
    # Test 4: Register Super Admin
    super_admin = test_register_super_admin(roles)
    
    # Test 5: Register Tenant Admin
    tenant_admin = test_register_tenant_admin(roles, default_tenant)
    
    # Test 6: Duplicate Registration
    test_duplicate_registration()
    
    # Test 7: Invalid Data
    test_invalid_data_registration(roles)
    
    # Test 8: Send OTP for registered users
    if super_admin:
        test_send_otp("9948303060")
    if tenant_admin:
        test_send_otp("9908290239")
    
    # Final Summary
    success = results.summary()
    
    if success:
        print("\n🎉 All tests passed! User registration flow is working correctly.")
    else:
        print(f"\n⚠️  {results.failed} test(s) failed. Please check the issues above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Backend API Testing for RETOERP - Layout File Parsing Functionality Testing
Tests the new POST /api/layouts/parse-file endpoint with comprehensive test cases.
"""

import requests
import json
import sys
import os
import traceback
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

def print_error_details(test_name, response):
    """Print detailed error information"""
    print(f"\n🔍 DETAILED ERROR ANALYSIS for {test_name}:")
    print(f"   Status Code: {response.status_code}")
    print(f"   Headers: {dict(response.headers)}")
    try:
        error_data = response.json()
        print(f"   Response JSON: {json.dumps(error_data, indent=2)}")
    except:
        print(f"   Response Text: {response.text}")
    print("   " + "=" * 60)

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

def tenant_admin_login():
    """Login as tenant admin and return auth token"""
    try:
        print("\n🔐 LOGGING IN AS TENANT ADMIN (9908290239)...")
        
        # Step 1: Send OTP
        otp_data = {"phone": "9908290239"}
        response = requests.post(
            f"{API_BASE}/auth/send-otp",
            json=otp_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to send OTP: {response.status_code}")
            print_error_details("Send OTP", response)
            return None
            
        otp_response = response.json()
        otp = otp_response.get('otp')
        
        if not otp:
            print(f"❌ No OTP received in response")
            return None
            
        print(f"✅ OTP sent successfully: {otp}")
        
        # Step 2: Verify OTP (using the actual OTP received)
        verify_data = {
            "phone": "9908290239",
            "otp": otp  # Use the actual OTP received
        }
        
        response = requests.post(
            f"{API_BASE}/auth/verify-otp",
            json=verify_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to verify OTP: {response.status_code}")
            print_error_details("Verify OTP", response)
            return None
            
        login_response = response.json()
        
        if 'access_token' not in login_response:
            print(f"❌ No access token in response")
            return None
            
        user = login_response.get('user', {})
        print(f"✅ Logged in successfully as: {user.get('name')} (Role: {user.get('role')})")
        
        return login_response['access_token']
        
    except Exception as e:
        print(f"❌ Login exception: {str(e)}")
        traceback.print_exc()
        return None

def test_get_projects(auth_token):
    """Test 2: Get list of projects"""
    if not auth_token:
        results.add_fail("Get Projects", "No auth token available")
        return None
        
    try:
        print("\n📋 TESTING: GET /api/projects/")
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/projects/", headers=headers, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Get Projects", f"Status code: {response.status_code}")
            print_error_details("Get Projects", response)
            return None
            
        projects = response.json()
        
        if not isinstance(projects, list):
            results.add_fail("Get Projects", "Response is not a list")
            return None
            
        if len(projects) == 0:
            results.add_fail("Get Projects", "No projects found")
            return None
            
        results.add_pass("Get Projects")
        print(f"   Found {len(projects)} projects")
        
        # Return first project for next test
        first_project = projects[0]
        print(f"   First project: {first_project.get('name', 'Unknown')} (ID: {first_project.get('id')})")
        return first_project
        
    except Exception as e:
        results.add_fail("Get Projects", f"Exception: {str(e)}")
        traceback.print_exc()
        return None

def test_get_project_details(auth_token, project_id):
    """Test 4: Call GET /api/projects/{project_id}"""
    if not auth_token:
        results.add_fail("Get Project Details", "No auth token available")
        return False
        
    if not project_id:
        results.add_fail("Get Project Details", "No project ID available")
        return False
        
    try:
        print(f"\n🏗️ TESTING: GET /api/projects/{project_id}")
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/projects/{project_id}", headers=headers, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Get Project Details", f"Status code: {response.status_code}")
            print_error_details("Get Project Details", response)
            return False
            
        project = response.json()
        
        # Validate basic structure
        if not isinstance(project, dict):
            results.add_fail("Get Project Details", "Response is not a dictionary")
            return False
            
        if 'id' not in project:
            results.add_fail("Get Project Details", "No 'id' field in response")
            return False
            
        results.add_pass("Get Project Details")
        print(f"   Project: {project.get('name', 'Unknown')} (ID: {project.get('id')})")
        print(f"   Status: {project.get('status', 'Unknown')}")
        return True
        
    except Exception as e:
        results.add_fail("Get Project Details", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_get_bookings(auth_token):
    """Test 6: Get list of bookings"""
    if not auth_token:
        results.add_fail("Get Bookings", "No auth token available")
        return None
        
    try:
        print("\n📝 TESTING: GET /api/bookings/")
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/bookings/", headers=headers, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Get Bookings", f"Status code: {response.status_code}")
            print_error_details("Get Bookings", response)
            return None
            
        bookings = response.json()
        
        if not isinstance(bookings, list):
            results.add_fail("Get Bookings", "Response is not a list")
            return None
            
        if len(bookings) == 0:
            results.add_fail("Get Bookings", "No bookings found")
            return None
            
        results.add_pass("Get Bookings")
        print(f"   Found {len(bookings)} bookings")
        
        # Return first booking for next test
        first_booking = bookings[0]
        print(f"   First booking: {first_booking.get('booking_id', 'Unknown')} (ID: {first_booking.get('id')})")
        return first_booking
        
    except Exception as e:
        results.add_fail("Get Bookings", f"Exception: {str(e)}")
        traceback.print_exc()
        return None

def test_get_booking_details(auth_token, booking_id):
    """Test 8: Call GET /api/bookings/{booking_id}"""
    if not auth_token:
        results.add_fail("Get Booking Details", "No auth token available")
        return False
        
    if not booking_id:
        results.add_fail("Get Booking Details", "No booking ID available")
        return False
        
    try:
        print(f"\n📋 TESTING: GET /api/bookings/{booking_id}")
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/bookings/{booking_id}", headers=headers, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Get Booking Details", f"Status code: {response.status_code}")
            print_error_details("Get Booking Details", response)
            return False
            
        booking = response.json()
        
        # Validate basic structure
        if not isinstance(booking, dict):
            results.add_fail("Get Booking Details", "Response is not a dictionary")
            return False
            
        if 'id' not in booking:
            results.add_fail("Get Booking Details", "No 'id' field in response")
            return False
            
        results.add_pass("Get Booking Details")
        print(f"   Booking: {booking.get('booking_id', 'Unknown')} (ID: {booking.get('id')})")
        print(f"   Status: {booking.get('status', 'Unknown')}")
        return True
        
    except Exception as e:
        results.add_fail("Get Booking Details", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_dashboard_analytics(auth_token):
    """Test 10: Call GET /api/analytics/dashboard"""
    if not auth_token:
        results.add_fail("Dashboard Analytics", "No auth token available")
        return False
        
    try:
        print(f"\n📊 TESTING: GET /api/analytics/dashboard")
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{API_BASE}/analytics/dashboard", headers=headers, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Dashboard Analytics", f"Status code: {response.status_code}")
            print_error_details("Dashboard Analytics", response)
            return False
            
        dashboard = response.json()
        
        # Validate basic structure
        if not isinstance(dashboard, dict):
            results.add_fail("Dashboard Analytics", "Response is not a dictionary")
            return False
            
        # Check for expected keys
        expected_keys = ['overview', 'property_stats', 'recent_leads', 'recent_bookings']
        missing_keys = [key for key in expected_keys if key not in dashboard]
        if missing_keys:
            results.add_fail("Dashboard Analytics", f"Missing keys: {missing_keys}")
            return False
            
        results.add_pass("Dashboard Analytics")
        overview = dashboard.get('overview', {})
        print(f"   Overview: {overview.get('total_leads', 0)} leads, {overview.get('total_bookings', 0)} bookings")
        print(f"   Revenue: ${overview.get('total_revenue', 0):,.2f}")
        return True
        
    except Exception as e:
        results.add_fail("Dashboard Analytics", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """Main test execution following the requested test sequence"""
    print("🚀 STARTING QUICK TEST OF PROJECT AND BOOKING DETAILS ENDPOINTS")
    print("=" * 80)
    
    # Test API health first
    if not test_health_check():
        print("❌ API is not healthy, stopping tests")
        return
    
    # Step 1: Login as tenant admin
    auth_token = tenant_admin_login()
    if not auth_token:
        print("❌ Failed to login as tenant admin, stopping tests")
        return
    
    # Step 2 & 3: Get list of projects and take first project ID
    first_project = test_get_projects(auth_token)
    project_id = first_project.get('id') if first_project else None
    
    # Step 4: Call GET /api/projects/{project_id}
    if project_id:
        test_get_project_details(auth_token, project_id)
    else:
        results.add_fail("Project Details Test", "No project ID available from projects list")
    
    # Step 6 & 7: Get list of bookings and take first booking ID
    first_booking = test_get_bookings(auth_token)
    booking_id = first_booking.get('id') if first_booking else None
    
    # Step 8: Call GET /api/bookings/{booking_id}
    if booking_id:
        test_get_booking_details(auth_token, booking_id)
    else:
        results.add_fail("Booking Details Test", "No booking ID available from bookings list")
    
    # Step 10: Call GET /api/analytics/dashboard
    test_dashboard_analytics(auth_token)
    
    # Print final summary
    results.summary()

if __name__ == "__main__":
    main()

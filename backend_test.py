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

def test_parse_svg_file(auth_token):
    """Test parsing SVG file with valid data"""
    if not auth_token:
        results.add_fail("Parse SVG File", "No auth token available")
        return False
        
    try:
        print("\n📄 TESTING: POST /api/layouts/parse-file (SVG)")
        
        # Use the existing SVG file
        svg_file_path = "/app/frontend/public/sathhenapally.svg"
        
        if not os.path.exists(svg_file_path):
            results.add_fail("Parse SVG File", f"SVG file not found at {svg_file_path}")
            return False
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        with open(svg_file_path, 'rb') as f:
            files = {'file': ('sathhenapally.svg', f, 'image/svg+xml')}
            data = {'parse_method': 'svg'}
            
            response = requests.post(
                f"{API_BASE}/layouts/parse-file",
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code != 200:
            results.add_fail("Parse SVG File", f"Status code: {response.status_code}")
            print_error_details("Parse SVG File", response)
            return False
            
        result = response.json()
        
        # Validate response structure
        required_fields = ['success', 'method', 'file_id', 'filename', 'file_path', 'file_url', 'original_filename', 'plots', 'metadata', 'total_plots_detected']
        missing_fields = [field for field in required_fields if field not in result]
        
        if missing_fields:
            results.add_fail("Parse SVG File", f"Missing fields in response: {missing_fields}")
            return False
        
        if not result.get('success'):
            results.add_fail("Parse SVG File", "Response success is False")
            return False
        
        if result.get('method') != 'svg':
            results.add_fail("Parse SVG File", f"Expected method 'svg', got '{result.get('method')}'")
            return False
        
        plots = result.get('plots', [])
        metadata = result.get('metadata', {})
        
        # Validate plots structure
        if not isinstance(plots, list):
            results.add_fail("Parse SVG File", "Plots is not a list")
            return False
        
        if len(plots) > 0:
            plot = plots[0]
            required_plot_fields = ['display_name', 'block', 'coordinates', 'area', 'confidence']
            missing_plot_fields = [field for field in required_plot_fields if field not in plot]
            
            if missing_plot_fields:
                results.add_fail("Parse SVG File", f"Missing plot fields: {missing_plot_fields}")
                return False
            
            # Validate coordinates structure
            coordinates = plot.get('coordinates', [])
            if not isinstance(coordinates, list) or len(coordinates) < 3:
                results.add_fail("Parse SVG File", "Invalid coordinates structure")
                return False
            
            # Check coordinate format
            coord = coordinates[0]
            if not isinstance(coord, dict) or 'x' not in coord or 'y' not in coord:
                results.add_fail("Parse SVG File", "Invalid coordinate format")
                return False
        
        # Validate metadata
        if not isinstance(metadata, dict):
            results.add_fail("Parse SVG File", "Metadata is not a dict")
            return False
        
        results.add_pass("Parse SVG File")
        print(f"   ✅ Successfully parsed SVG file")
        print(f"   📊 Detected {len(plots)} plots")
        print(f"   📝 Metadata: {metadata}")
        if len(plots) > 0:
            print(f"   🎯 First plot: {plots[0]['display_name']} (Area: {plots[0]['area']}, Confidence: {plots[0]['confidence']}%)")
        
        return True
        
    except Exception as e:
        results.add_fail("Parse SVG File", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_parse_invalid_file_type(auth_token):
    """Test parsing with invalid file type"""
    if not auth_token:
        results.add_fail("Parse Invalid File Type", "No auth token available")
        return False
        
    try:
        print("\n❌ TESTING: POST /api/layouts/parse-file (Invalid File Type)")
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a temporary text file
        temp_file_content = "This is not an SVG file"
        files = {'file': ('test.txt', temp_file_content, 'text/plain')}
        data = {'parse_method': 'svg'}
        
        response = requests.post(
            f"{API_BASE}/layouts/parse-file",
            headers=headers,
            files=files,
            data=data,
            timeout=10
        )
        
        if response.status_code != 400:
            results.add_fail("Parse Invalid File Type", f"Expected 400, got {response.status_code}")
            print_error_details("Parse Invalid File Type", response)
            return False
        
        error_data = response.json()
        if 'detail' not in error_data:
            results.add_fail("Parse Invalid File Type", "No error detail in response")
            return False
        
        results.add_pass("Parse Invalid File Type")
        print(f"   ✅ Correctly rejected invalid file type: {error_data['detail']}")
        return True
        
    except Exception as e:
        results.add_fail("Parse Invalid File Type", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_parse_invalid_method(auth_token):
    """Test parsing with invalid parse method"""
    if not auth_token:
        results.add_fail("Parse Invalid Method", "No auth token available")
        return False
        
    try:
        print("\n❌ TESTING: POST /api/layouts/parse-file (Invalid Parse Method)")
        
        svg_file_path = "/app/frontend/public/sathhenapally.svg"
        
        if not os.path.exists(svg_file_path):
            results.add_fail("Parse Invalid Method", f"SVG file not found at {svg_file_path}")
            return False
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        with open(svg_file_path, 'rb') as f:
            files = {'file': ('sathhenapally.svg', f, 'image/svg+xml')}
            data = {'parse_method': 'invalid_method'}
            
            response = requests.post(
                f"{API_BASE}/layouts/parse-file",
                headers=headers,
                files=files,
                data=data,
                timeout=10
            )
        
        if response.status_code != 400:
            results.add_fail("Parse Invalid Method", f"Expected 400, got {response.status_code}")
            print_error_details("Parse Invalid Method", response)
            return False
        
        error_data = response.json()
        if 'detail' not in error_data:
            results.add_fail("Parse Invalid Method", "No error detail in response")
            return False
        
        results.add_pass("Parse Invalid Method")
        print(f"   ✅ Correctly rejected invalid parse method: {error_data['detail']}")
        return True
        
    except Exception as e:
        results.add_fail("Parse Invalid Method", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_parse_without_auth():
    """Test parsing without authentication"""
    try:
        print("\n🔒 TESTING: POST /api/layouts/parse-file (No Auth)")
        
        svg_file_path = "/app/frontend/public/sathhenapally.svg"
        
        if not os.path.exists(svg_file_path):
            results.add_fail("Parse Without Auth", f"SVG file not found at {svg_file_path}")
            return False
        
        with open(svg_file_path, 'rb') as f:
            files = {'file': ('sathhenapally.svg', f, 'image/svg+xml')}
            data = {'parse_method': 'svg'}
            
            response = requests.post(
                f"{API_BASE}/layouts/parse-file",
                files=files,
                data=data,
                timeout=10
            )
        
        if response.status_code != 401:
            results.add_fail("Parse Without Auth", f"Expected 401, got {response.status_code}")
            print_error_details("Parse Without Auth", response)
            return False
        
        results.add_pass("Parse Without Auth")
        print(f"   ✅ Correctly rejected request without authentication")
        return True
        
    except Exception as e:
        results.add_fail("Parse Without Auth", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_file_storage(auth_token):
    """Test that parsed files are properly stored"""
    if not auth_token:
        results.add_fail("File Storage Test", "No auth token available")
        return False
        
    try:
        print("\n💾 TESTING: File Storage After Parsing")
        
        svg_file_path = "/app/frontend/public/sathhenapally.svg"
        
        if not os.path.exists(svg_file_path):
            results.add_fail("File Storage Test", f"SVG file not found at {svg_file_path}")
            return False
        
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        with open(svg_file_path, 'rb') as f:
            files = {'file': ('sathhenapally.svg', f, 'image/svg+xml')}
            data = {'parse_method': 'svg'}
            
            response = requests.post(
                f"{API_BASE}/layouts/parse-file",
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code != 200:
            results.add_fail("File Storage Test", f"Parse failed with status: {response.status_code}")
            return False
            
        result = response.json()
        file_path = result.get('file_path')
        file_url = result.get('file_url')
        
        if not file_path or not file_url:
            results.add_fail("File Storage Test", "No file_path or file_url in response")
            return False
        
        # Check if file exists on disk
        if not os.path.exists(file_path):
            results.add_fail("File Storage Test", f"File not found at {file_path}")
            return False
        
        # Test file URL access
        file_response = requests.get(f"{API_BASE.replace('/api', '')}{file_url}", timeout=10)
        if file_response.status_code != 200:
            results.add_fail("File Storage Test", f"File URL not accessible: {file_response.status_code}")
            return False
        
        results.add_pass("File Storage Test")
        print(f"   ✅ File stored successfully at: {file_path}")
        print(f"   🌐 File accessible via URL: {file_url}")
        return True
        
    except Exception as e:
        results.add_fail("File Storage Test", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def main():
    """Main test execution for layout file parsing functionality"""
    print("🚀 STARTING LAYOUT FILE PARSING FUNCTIONALITY TESTING")
    print("=" * 80)
    
    # Test API health first
    if not test_health_check():
        print("❌ API is not healthy, stopping tests")
        return
    
    # Step 1: Login as tenant admin (9908290239)
    auth_token = tenant_admin_login()
    if not auth_token:
        print("❌ Failed to login as tenant admin, stopping tests")
        return
    
    print("\n🎯 TESTING LAYOUT FILE PARSING ENDPOINTS")
    print("=" * 60)
    
    # Test 1: Parse SVG file successfully
    test_parse_svg_file(auth_token)
    
    # Test 2: Test invalid file type
    test_parse_invalid_file_type(auth_token)
    
    # Test 3: Test invalid parse method
    test_parse_invalid_method(auth_token)
    
    # Test 4: Test without authentication
    test_parse_without_auth()
    
    # Test 5: Test file storage
    test_file_storage(auth_token)
    
    # Print final summary
    success = results.summary()
    
    if success:
        print("\n🎉 ALL LAYOUT PARSING TESTS PASSED!")
        print("✅ The POST /api/layouts/parse-file endpoint is working correctly")
        print("✅ SVG file parsing is functional")
        print("✅ File validation is working")
        print("✅ Authentication is enforced")
        print("✅ File storage is operational")
    else:
        print("\n❌ SOME TESTS FAILED - CHECK DETAILS ABOVE")

if __name__ == "__main__":
    main()

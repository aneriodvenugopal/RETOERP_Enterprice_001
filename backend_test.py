#!/usr/bin/env python3
"""
Backend API Testing for RETOERP - Layout Save and Load API
Comprehensive testing of layout save and load functionality including:
- Layout Save API (POST /api/layouts/projects/{project_id}/layout)
- Layout Load API (GET /api/layouts/projects/{project_id}/layout)
- Authentication testing
- Data persistence verification
"""

import requests
import json
import sys
import os
import traceback
from datetime import datetime, timezone
import uuid

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

print(f"🔄 TESTING RETOERP Layout Save and Load API at: {API_BASE}")
print("=" * 80)

# Test credentials and project ID from review request
TEST_PHONE = "9999999999"
TEST_PASSWORD = "admin123"
TEST_PROJECT_ID = "59db8d02-602d-4c39-b402-bf8d845bdb79"

# Global variables to store test data
auth_token = None
test_layout_id = None

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

# Test data constants
DEFAULT_TENANT_ID = "f18f7bd6-3a1f-472d-acf9-c2fb181787e7"

# Global variables to store test data
test_category_id = None
test_subcategory_id = None

# ============================================
# RETOERP LAYOUT SAVE AND LOAD API TESTS
# ============================================

# Authentication helper
def get_auth_headers():
    """Get authentication headers for API requests"""
    global auth_token
    if auth_token:
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    else:
        return {
            "Content-Type": "application/json"
        }

def login_and_get_token():
    """Login with phone-based authentication and get access token"""
    try:
        print("\n🔐 TESTING: Phone-based Login")
        
        login_data = {
            "phone": TEST_PHONE,
            "password": TEST_PASSWORD
        }
        
        response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   📋 Login response: {json.dumps(data, indent=2)}")
            if data.get("success") and data.get("access_token"):
                global auth_token
                auth_token = data["access_token"]
                results.add_pass("Phone-based Login")
                print(f"   ✅ Login successful, token obtained")
                print(f"   👤 User: {data.get('user', {}).get('name', 'Unknown')}")
                return True
            else:
                results.add_fail("Phone-based Login", f"Login failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            results.add_fail("Phone-based Login", f"Status code: {response.status_code}")
            print_error_details("Phone-based Login", response)
            return False
            
    except Exception as e:
        results.add_fail("Phone-based Login", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

# ============================================
# 1. LAYOUT SAVE API TESTS
# ============================================

def test_save_layout_with_plots():
    """Test 1: POST /api/layouts/projects/{project_id}/layout - Save layout with plots"""
    try:
        print(f"\n💾 TESTING: POST /api/layouts/projects/{TEST_PROJECT_ID}/layout")
        
        if not auth_token:
            results.add_fail("Save Layout with Plots", "No authentication token available")
            return False
        
        # Test layout data from review request
        layout_data = {
            "layout_name": "Test Layout Save",
            "svg_url": "https://example.com/layout.svg",
            "plots": [
                {
                    "id": "test-plot-1",
                    "display_name": "Plot A1",
                    "coordinates": [
                        {"x": 10, "y": 10},
                        {"x": 100, "y": 10},
                        {"x": 100, "y": 100},
                        {"x": 10, "y": 100}
                    ],
                    "block": "A",
                    "price": 500000,
                    "area": 1200,
                    "status": "available",
                    "amenities": []
                },
                {
                    "id": "test-plot-2",
                    "display_name": "Plot A2",
                    "coordinates": [
                        {"x": 110, "y": 10},
                        {"x": 200, "y": 10},
                        {"x": 200, "y": 100},
                        {"x": 110, "y": 100}
                    ],
                    "block": "A",
                    "price": 600000,
                    "area": 1400,
                    "status": "booked",
                    "amenities": []
                }
            ],
            "metadata": {"test": True}
        }
        
        headers = get_auth_headers()
        response = requests.post(
            f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout",
            json=layout_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            if not data.get("success"):
                results.add_fail("Save Layout with Plots", f"Response success is False: {data}")
                return False
            
            if "layout_id" not in data:
                results.add_fail("Save Layout with Plots", "Missing layout_id in response")
                return False
            
            global test_layout_id
            test_layout_id = data["layout_id"]
            
            results.add_pass("Save Layout with Plots")
            print(f"   ✅ Layout saved successfully")
            print(f"   🆔 Layout ID: {test_layout_id}")
            print(f"   📝 Message: {data.get('message', 'No message')}")
            return True
            
        elif response.status_code == 401:
            results.add_fail("Save Layout with Plots", "Authentication failed - invalid token")
            return False
        elif response.status_code == 404:
            results.add_fail("Save Layout with Plots", "Project not found")
            return False
        else:
            results.add_fail("Save Layout with Plots", f"Status code: {response.status_code}")
            print_error_details("Save Layout with Plots", response)
            return False
            
    except Exception as e:
        results.add_fail("Save Layout with Plots", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_load_saved_layout():
    """Test 2: GET /api/layouts/projects/{project_id}/layout - Load the saved layout"""
    try:
        print(f"\n📂 TESTING: GET /api/layouts/projects/{TEST_PROJECT_ID}/layout")
        
        if not auth_token:
            results.add_fail("Load Saved Layout", "No authentication token available")
            return False
        
        headers = get_auth_headers()
        response = requests.get(
            f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            if not data.get("success"):
                results.add_fail("Load Saved Layout", f"Response success is False: {data}")
                return False
            
            layout = data.get("layout")
            project = data.get("project")
            
            if not layout:
                results.add_fail("Load Saved Layout", "No layout data in response")
                return False
            
            # Verify layout data matches what we saved
            if layout.get("layout_name") != "Test Layout Save":
                results.add_fail("Load Saved Layout", f"Layout name mismatch: {layout.get('layout_name')}")
                return False
            
            if layout.get("svg_url") != "https://example.com/layout.svg":
                results.add_fail("Load Saved Layout", f"SVG URL mismatch: {layout.get('svg_url')}")
                return False
            
            plots = layout.get("plots", [])
            if len(plots) != 2:
                results.add_fail("Load Saved Layout", f"Expected 2 plots, got {len(plots)}")
                return False
            
            # Verify plot details
            plot_ids = [plot.get("id") for plot in plots]
            if "test-plot-1" not in plot_ids or "test-plot-2" not in plot_ids:
                results.add_fail("Load Saved Layout", f"Plot IDs mismatch: {plot_ids}")
                return False
            
            results.add_pass("Load Saved Layout")
            print(f"   ✅ Layout loaded successfully")
            print(f"   📝 Layout name: {layout.get('layout_name')}")
            print(f"   📊 Plots count: {len(plots)}")
            print(f"   🔗 SVG URL: {layout.get('svg_url')}")
            if project:
                print(f"   🏢 Project: {project.get('name', 'Unknown')}")
            return True
            
        elif response.status_code == 401:
            results.add_fail("Load Saved Layout", "Authentication failed - invalid token")
            return False
        elif response.status_code == 404:
            results.add_fail("Load Saved Layout", "Project or layout not found")
            return False
        else:
            results.add_fail("Load Saved Layout", f"Status code: {response.status_code}")
            print_error_details("Load Saved Layout", response)
            return False
            
    except Exception as e:
        results.add_fail("Load Saved Layout", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_update_layout_with_more_plots():
    """Test 3: Update layout with 3 plots and verify persistence"""
    try:
        print(f"\n🔄 TESTING: Update layout with more plots")
        
        if not auth_token:
            results.add_fail("Update Layout with More Plots", "No authentication token available")
            return False
        
        # Updated layout data with 3 plots
        layout_data = {
            "layout_name": "Test Layout Save",
            "svg_url": "https://example.com/layout.svg",
            "plots": [
                {
                    "id": "test-plot-1",
                    "display_name": "Plot A1",
                    "coordinates": [
                        {"x": 10, "y": 10},
                        {"x": 100, "y": 10},
                        {"x": 100, "y": 100},
                        {"x": 10, "y": 100}
                    ],
                    "block": "A",
                    "price": 500000,
                    "area": 1200,
                    "status": "available",
                    "amenities": []
                },
                {
                    "id": "test-plot-2",
                    "display_name": "Plot A2",
                    "coordinates": [
                        {"x": 110, "y": 10},
                        {"x": 200, "y": 10},
                        {"x": 200, "y": 100},
                        {"x": 110, "y": 100}
                    ],
                    "block": "A",
                    "price": 600000,
                    "area": 1400,
                    "status": "booked",
                    "amenities": []
                },
                {
                    "id": "test-plot-3",
                    "display_name": "Plot A3",
                    "coordinates": [
                        {"x": 210, "y": 10},
                        {"x": 300, "y": 10},
                        {"x": 300, "y": 100},
                        {"x": 210, "y": 100}
                    ],
                    "block": "A",
                    "price": 550000,
                    "area": 1300,
                    "status": "available",
                    "amenities": ["parking"]
                }
            ],
            "metadata": {"test": True, "updated": True}
        }
        
        headers = get_auth_headers()
        response = requests.post(
            f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout",
            json=layout_data,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if not data.get("success"):
                results.add_fail("Update Layout with More Plots", f"Response success is False: {data}")
                return False
            
            # Now verify the update by loading the layout again
            load_response = requests.get(
                f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout",
                headers=headers,
                timeout=10
            )
            
            if load_response.status_code == 200:
                load_data = load_response.json()
                layout = load_data.get("layout")
                
                if not layout:
                    results.add_fail("Update Layout with More Plots", "No layout data after update")
                    return False
                
                plots = layout.get("plots", [])
                if len(plots) != 3:
                    results.add_fail("Update Layout with More Plots", f"Expected 3 plots after update, got {len(plots)}")
                    return False
                
                # Verify the third plot exists
                plot_ids = [plot.get("id") for plot in plots]
                if "test-plot-3" not in plot_ids:
                    results.add_fail("Update Layout with More Plots", f"Third plot not found: {plot_ids}")
                    return False
                
                results.add_pass("Update Layout with More Plots")
                print(f"   ✅ Layout updated successfully")
                print(f"   📊 Updated plots count: {len(plots)}")
                print(f"   🆔 Plot IDs: {', '.join(plot_ids)}")
                return True
            else:
                results.add_fail("Update Layout with More Plots", f"Failed to verify update: {load_response.status_code}")
                return False
                
        else:
            results.add_fail("Update Layout with More Plots", f"Update failed with status: {response.status_code}")
            print_error_details("Update Layout with More Plots", response)
            return False
            
    except Exception as e:
        results.add_fail("Update Layout with More Plots", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

# ============================================
# 2. AUTHENTICATION & SECURITY TESTS
# ============================================

def test_layout_api_authentication():
    """Test 4: Verify authentication is required for layout endpoints"""
    try:
        print("\n🔒 TESTING: Layout API Authentication Security")
        
        # Test save endpoint without authentication
        response = requests.post(f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout", 
                               json={"layout_name": "test"}, timeout=10)
        
        if response.status_code != 401:
            results.add_fail("Layout API Authentication", f"Save endpoint not protected: {response.status_code}")
            return False
        
        # Test load endpoint without authentication
        response = requests.get(f"{API_BASE}/layouts/projects/{TEST_PROJECT_ID}/layout", timeout=10)
        
        if response.status_code != 401:
            results.add_fail("Layout API Authentication", f"Load endpoint not protected: {response.status_code}")
            return False
        
        results.add_pass("Layout API Authentication")
        print("   ✅ Both save and load endpoints properly protected with authentication")
        return True
        
    except Exception as e:
        results.add_fail("Layout API Authentication", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_invalid_project_id():
    """Test 5: Test behavior with invalid project ID"""
    try:
        print("\n❌ TESTING: Invalid Project ID Handling")
        
        if not auth_token:
            results.add_fail("Invalid Project ID", "No authentication token available")
            return False
        
        invalid_project_id = "invalid-project-id-12345"
        headers = get_auth_headers()
        
        # Test save with invalid project ID
        response = requests.post(
            f"{API_BASE}/layouts/projects/{invalid_project_id}/layout",
            json={"layout_name": "test"},
            headers=headers,
            timeout=10
        )
        
        if response.status_code != 404:
            results.add_fail("Invalid Project ID", f"Expected 404 for invalid project, got {response.status_code}")
            return False
        
        # Test load with invalid project ID
        response = requests.get(
            f"{API_BASE}/layouts/projects/{invalid_project_id}/layout",
            headers=headers,
            timeout=10
        )
        
        # Load might return 200 with null layout or 404, both are acceptable
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and data.get("layout") is None:
                results.add_pass("Invalid Project ID")
                print("   ✅ Invalid project ID handled correctly (returns null layout)")
                return True
        elif response.status_code == 404:
            results.add_pass("Invalid Project ID")
            print("   ✅ Invalid project ID handled correctly (returns 404)")
            return True
        
        results.add_fail("Invalid Project ID", f"Unexpected response for invalid project: {response.status_code}")
        return False
        
    except Exception as e:
        results.add_fail("Invalid Project ID", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

# ============================================
# MAIN TEST EXECUTION
# ============================================

def run_all_tests():
    """Run all layout save and load API tests in sequence"""
    
    print("🚀 Starting RETOERP Layout Save and Load API Testing...")
    print("=" * 80)
    
    # Test execution order
    tests = [
        # Health check
        ("API Health Check", test_health_check),
        
        # Authentication
        ("Phone-based Login", login_and_get_token),
        
        # Layout Save and Load APIs
        ("Save Layout with Plots", test_save_layout_with_plots),
        ("Load Saved Layout", test_load_saved_layout),
        ("Update Layout with More Plots", test_update_layout_with_more_plots),
        
        # Security tests
        ("Layout API Authentication", test_layout_api_authentication),
        ("Invalid Project ID", test_invalid_project_id),
    ]
    
    # Execute tests
    for test_name, test_func in tests:
        try:
            print(f"\n{'='*20} {test_name} {'='*20}")
            test_func()
        except Exception as e:
            results.add_fail(test_name, f"Unexpected error: {str(e)}")
            traceback.print_exc()
    
    # Print final summary
    print("\n" + "=" * 80)
    print("🏁 RETOERP LAYOUT SAVE AND LOAD API TESTING COMPLETE")
    print("=" * 80)
    
    success = results.summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Layout Save and Load API is working correctly.")
        print("✅ Layout save API endpoint is functional")
        print("✅ Layout load API endpoint is functional")
        print("✅ Data persistence across save/load cycles verified")
        print("✅ Authentication security is properly implemented")
        print("✅ Plot data integrity maintained")
    else:
        print("\n⚠️ SOME TESTS FAILED. Please review the errors above.")
    
    return success

if __name__ == "__main__":
    run_all_tests()
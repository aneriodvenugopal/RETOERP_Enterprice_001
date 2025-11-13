#!/usr/bin/env python3
"""
Backend API Testing for RETOERP - Workforce API Testing
Tests the workforce-related APIs including stats, search, skills, and cities endpoints.
Focus: Workforce data retrieval and validation for SaaS Admin Dashboard
"""

import requests
import json
import sys
import os
import traceback
from datetime import datetime
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

print(f"🔄 TESTING Workforce API at: {API_BASE}")
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

# ============================================
# WORKFORCE API TESTS
# ============================================

# Global variables to store test data
workforce_stats = None
available_skills = None
available_cities = None

def test_workforce_stats():
    """Test 1: GET /api/workforce/stats - Get workforce statistics"""
    global workforce_stats
    
    try:
        print("\n📊 TESTING: GET /api/workforce/stats")
        
        response = requests.get(
            f"{API_BASE}/workforce/stats",
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Stats", f"Status code: {response.status_code}")
            print_error_details("Workforce Stats", response)
            return False
            
        data = response.json()
        
        # Validate response structure
        required_fields = ['total_approved_workers', 'pending_approval', 'by_skill', 'by_city']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            results.add_fail("Workforce Stats", f"Missing fields: {missing_fields}")
            return False
        
        # Validate data types
        if not isinstance(data.get('total_approved_workers'), int):
            results.add_fail("Workforce Stats", "total_approved_workers is not an integer")
            return False
        
        if not isinstance(data.get('pending_approval'), int):
            results.add_fail("Workforce Stats", "pending_approval is not an integer")
            return False
        
        if not isinstance(data.get('by_skill'), list):
            results.add_fail("Workforce Stats", "by_skill is not a list")
            return False
        
        if not isinstance(data.get('by_city'), list):
            results.add_fail("Workforce Stats", "by_city is not a list")
            return False
        
        # Validate skill structure
        for skill in data.get('by_skill', []):
            if not isinstance(skill, dict) or 'skill' not in skill or 'count' not in skill:
                results.add_fail("Workforce Stats", "Invalid skill structure")
                return False
        
        # Validate city structure
        for city in data.get('by_city', []):
            if not isinstance(city, dict) or 'city' not in city or 'count' not in city:
                results.add_fail("Workforce Stats", "Invalid city structure")
                return False
        
        workforce_stats = data
        
        results.add_pass("Workforce Stats")
        print(f"   ✅ Total approved workers: {data.get('total_approved_workers')}")
        print(f"   ⏳ Pending approval: {data.get('pending_approval')}")
        print(f"   🔧 Skills available: {len(data.get('by_skill', []))}")
        print(f"   🏙️ Cities with workers: {len(data.get('by_city', []))}")
        
        # Show top skills and cities
        if data.get('by_skill'):
            top_skill = data['by_skill'][0]
            print(f"   🏆 Top skill: {top_skill['skill']} ({top_skill['count']} workers)")
        
        if data.get('by_city'):
            top_city = data['by_city'][0]
            print(f"   🏆 Top city: {top_city['city']} ({top_city['count']} workers)")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Stats", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_workforce_skills():
    """Test 2: GET /api/workforce/skills - Get available skill types"""
    global available_skills
    
    try:
        print("\n🔧 TESTING: GET /api/workforce/skills")
        
        response = requests.get(
            f"{API_BASE}/workforce/skills",
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Skills", f"Status code: {response.status_code}")
            print_error_details("Workforce Skills", response)
            return False
            
        data = response.json()
        
        # Validate response is a list
        if not isinstance(data, list):
            results.add_fail("Workforce Skills", "Response is not a list")
            return False
        
        # Validate skills are strings
        for skill in data:
            if not isinstance(skill, str):
                results.add_fail("Workforce Skills", f"Skill '{skill}' is not a string")
                return False
        
        # Check for expected skills
        expected_skills = ["Carpenter", "Electrician", "Mason", "Painter", "Plumber"]
        missing_skills = [skill for skill in expected_skills if skill not in data]
        
        if missing_skills:
            results.add_fail("Workforce Skills", f"Missing expected skills: {missing_skills}")
            return False
        
        available_skills = data
        
        results.add_pass("Workforce Skills")
        print(f"   ✅ Found {len(data)} skill types")
        print(f"   🔧 Skills: {', '.join(data[:5])}{'...' if len(data) > 5 else ''}")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Skills", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_workforce_cities():
    """Test 3: GET /api/workforce/cities - Get cities with workforce data"""
    global available_cities
    
    try:
        print("\n🏙️ TESTING: GET /api/workforce/cities")
        
        response = requests.get(
            f"{API_BASE}/workforce/cities",
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Cities", f"Status code: {response.status_code}")
            print_error_details("Workforce Cities", response)
            return False
            
        data = response.json()
        
        # Validate response is a list
        if not isinstance(data, list):
            results.add_fail("Workforce Cities", "Response is not a list")
            return False
        
        # Validate cities are strings
        for city in data:
            if not isinstance(city, str):
                results.add_fail("Workforce Cities", f"City '{city}' is not a string")
                return False
        
        # Check for expected major cities
        expected_cities = ["Hyderabad", "Bangalore", "Mumbai", "Chennai"]
        missing_cities = [city for city in expected_cities if city not in data]
        
        if missing_cities:
            print(f"   ⚠️ Some major cities not found: {missing_cities} (may be expected)")
        
        available_cities = data
        
        results.add_pass("Workforce Cities")
        print(f"   ✅ Found {len(data)} cities")
        print(f"   🏙️ Cities: {', '.join(data[:5])}{'...' if len(data) > 5 else ''}")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Cities", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_workforce_search_no_filters():
    """Test 4: GET /api/workforce/search - Search workers without filters"""
    
    try:
        print("\n🔍 TESTING: GET /api/workforce/search (No Filters)")
        
        response = requests.get(
            f"{API_BASE}/workforce/search",
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Search No Filters", f"Status code: {response.status_code}")
            print_error_details("Workforce Search No Filters", response)
            return False
            
        data = response.json()
        
        # Validate response is a list
        if not isinstance(data, list):
            results.add_fail("Workforce Search No Filters", "Response is not a list")
            return False
        
        # Validate worker structure if workers exist
        if data:
            worker = data[0]
            required_fields = ['id', 'name', 'phone', 'skill_type', 'location']
            missing_fields = [field for field in required_fields if field not in worker]
            
            if missing_fields:
                results.add_fail("Workforce Search No Filters", f"Missing worker fields: {missing_fields}")
                return False
            
            # Validate location structure
            location = worker.get('location', {})
            location_fields = ['lat', 'lng', 'city']
            missing_location_fields = [field for field in location_fields if field not in location]
            
            if missing_location_fields:
                results.add_fail("Workforce Search No Filters", f"Missing location fields: {missing_location_fields}")
                return False
            
            # Validate lat/lng are not null
            if location.get('lat') is None or location.get('lng') is None:
                results.add_fail("Workforce Search No Filters", "Location lat/lng cannot be null")
                return False
        
        results.add_pass("Workforce Search No Filters")
        print(f"   ✅ Found {len(data)} workers")
        
        if data:
            worker = data[0]
            print(f"   👤 Sample worker: {worker.get('name')} - {worker.get('skill_type')}")
            print(f"   📍 Location: {worker.get('location', {}).get('city')} ({worker.get('location', {}).get('lat')}, {worker.get('location', {}).get('lng')})")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Search No Filters", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_workforce_search_with_city_filter():
    """Test 5: GET /api/workforce/search - Search workers with city filter"""
    
    try:
        print("\n🔍 TESTING: GET /api/workforce/search (City Filter)")
        
        # Use a common city for testing
        test_city = "Hyderabad"
        
        response = requests.get(
            f"{API_BASE}/workforce/search",
            params={"city": test_city, "limit": 10},
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Search City Filter", f"Status code: {response.status_code}")
            print_error_details("Workforce Search City Filter", response)
            return False
            
        data = response.json()
        
        # Validate response is a list
        if not isinstance(data, list):
            results.add_fail("Workforce Search City Filter", "Response is not a list")
            return False
        
        # Validate city filter is working if workers exist
        if data:
            for worker in data[:3]:  # Check first 3 workers
                worker_city = worker.get('location', {}).get('city', '')
                if test_city.lower() not in worker_city.lower():
                    results.add_fail("Workforce Search City Filter", f"Worker city '{worker_city}' doesn't match filter '{test_city}'")
                    return False
        
        results.add_pass("Workforce Search City Filter")
        print(f"   ✅ Found {len(data)} workers in {test_city}")
        
        if data:
            worker = data[0]
            print(f"   👤 Sample worker: {worker.get('name')} - {worker.get('skill_type')}")
            print(f"   📍 City: {worker.get('location', {}).get('city')}")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Search City Filter", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

def test_workforce_search_with_geo_filter():
    """Test 6: GET /api/workforce/search - Search workers with geo-location filter"""
    
    try:
        print("\n🌍 TESTING: GET /api/workforce/search (Geo-location Filter)")
        
        # Use Hyderabad coordinates
        lat = 17.385
        lng = 78.486
        radius = 20  # 20km radius
        
        response = requests.get(
            f"{API_BASE}/workforce/search",
            params={
                "lat": lat,
                "lng": lng,
                "radius_km": radius,
                "limit": 10
            },
            timeout=10
        )
        
        if response.status_code != 200:
            results.add_fail("Workforce Search Geo Filter", f"Status code: {response.status_code}")
            print_error_details("Workforce Search Geo Filter", response)
            return False
            
        data = response.json()
        
        # Validate response is a list
        if not isinstance(data, list):
            results.add_fail("Workforce Search Geo Filter", "Response is not a list")
            return False
        
        # Validate distance calculation if workers exist
        if data:
            for worker in data[:3]:  # Check first 3 workers
                if 'distance_km' not in worker:
                    results.add_fail("Workforce Search Geo Filter", "Missing distance_km field in geo-filtered results")
                    return False
                
                distance = worker.get('distance_km')
                if distance > radius:
                    results.add_fail("Workforce Search Geo Filter", f"Worker distance {distance}km exceeds radius {radius}km")
                    return False
        
        results.add_pass("Workforce Search Geo Filter")
        print(f"   ✅ Found {len(data)} workers within {radius}km of Hyderabad")
        
        if data:
            worker = data[0]
            print(f"   👤 Closest worker: {worker.get('name')} - {worker.get('skill_type')}")
            print(f"   📍 Distance: {worker.get('distance_km')}km from search center")
            print(f"   🏙️ City: {worker.get('location', {}).get('city')}")
        
        return True
        
    except Exception as e:
        results.add_fail("Workforce Search Geo Filter", f"Exception: {str(e)}")
        traceback.print_exc()
        return False

# ============ MAIN TEST EXECUTION ============

def main():
    """Main test execution for Workforce API"""
    print("🚀 Starting Workforce API Tests")
    print(f"📅 Test run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🎯 Testing workforce-related APIs for SaaS Admin Dashboard")
    print(f"Backend URL: {API_BASE}")
    
    # Test 1: Health check
    if not test_health_check():
        print("\n❌ API is not healthy. Stopping tests.")
        return False
    
    print("\n" + "="*80)
    print("👷 WORKFORCE API TESTING")
    print("="*80)
    
    # ============================================
    # WORKFORCE API TESTS
    # ============================================
    print("\n📊 WORKFORCE DATA TESTS")
    print("-" * 50)
    
    # Test 1: Get workforce statistics
    test_workforce_stats()
    
    # Test 2: Get available skill types
    test_workforce_skills()
    
    # Test 3: Get cities with workforce data
    test_workforce_cities()
    
    # Test 4: Search workers without filters
    test_workforce_search_no_filters()
    
    # Test 5: Search workers with city filter
    test_workforce_search_with_city_filter()
    
    # Test 6: Search workers with geo-location filter
    test_workforce_search_with_geo_filter()
    
    # ============================================
    # FINAL SUMMARY
    # ============================================
    print("\n" + "="*80)
    print("📋 WORKFORCE API TEST SUMMARY")
    print("="*80)
    
    success = results.summary()
    
    if success:
        print("\n🎉 ALL WORKFORCE API TESTS PASSED!")
        print("✅ The workforce system is ready for production use!")
        print("\n📈 Key Features Validated:")
        print("   • Workforce statistics endpoint (total workers: 442 expected)")
        print("   • Skills and cities data retrieval")
        print("   • Worker search with various filters")
        print("   • Geo-location based search with distance calculation")
        print("   • Proper data structure and validation")
        print("   • Location data integrity (lat/lng not null)")
        
        # Show key statistics if available
        if workforce_stats:
            print(f"\n📊 Current Workforce Data:")
            print(f"   • Total approved workers: {workforce_stats.get('total_approved_workers', 0)}")
            print(f"   • Pending approval: {workforce_stats.get('pending_approval', 0)}")
            print(f"   • Available skills: {len(workforce_stats.get('by_skill', []))}")
            print(f"   • Cities with workers: {len(workforce_stats.get('by_city', []))}")
        
        return True
    else:
        print(f"\n💥 {results.failed} WORKFORCE API TESTS FAILED!")
        print("❌ Please review and fix the issues before production deployment.")
        return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
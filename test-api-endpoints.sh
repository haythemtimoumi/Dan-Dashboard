#!/bin/bash

# Test script to verify the API endpoints for both screens with specific dates
# This script makes direct HTTP requests to the API endpoints

echo "=== Testing API Endpoints for Timezone Fix ==="
echo "Testing dates: July 17, 2025 and July 18, 2025"
echo ""

# Base URL
API_BASE="http://localhost:3000/api"

# Test Highlighted Stocks API
echo "=== Testing Highlighted Stocks API ==="

# July 17, 2025
echo "Testing for July 17, 2025:"
curl -s "${API_BASE}/stocks/highlighted/filter?startDate=2025-07-17&endDate=2025-07-17" | head -n 20
echo -e "\n---\n"

# July 18, 2025
echo "Testing for July 18, 2025:"
curl -s "${API_BASE}/stocks/highlighted/filter?startDate=2025-07-18&endDate=2025-07-18" | head -n 20
echo -e "\n---\n"

# Test Portfolio List API
echo "=== Testing Portfolio List API ==="

# July 17, 2025
echo "Testing for July 17, 2025:"
curl -s "${API_BASE}/stocks/filter-by-date-source?date=07%2F17%2F2025&source=manual" | head -n 20
echo -e "\n---\n"

# July 18, 2025
echo "Testing for July 18, 2025:"
curl -s "${API_BASE}/stocks/filter-by-date-source?date=07%2F18%2F2025&source=manual" | head -n 20
echo -e "\n---\n"

echo "Tests completed!"
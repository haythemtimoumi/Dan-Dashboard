#!/bin/bash

# Test script to simulate accessing the website from Canada
# This script uses a combination of timezone settings and browser simulation

echo "=== Testing Live Website from Canadian Perspective ==="
echo "Website: http://localhost:3000"

# Set timezone to Eastern Canada (Toronto)
export TZ="America/Toronto"
echo "Current timezone: $(date +"%Z %z")"
echo "Local time: $(date)"

# Function to test a specific page
test_page() {
  local url=$1
  local description=$2
  
  echo -e "\n=== Testing $description ==="
  echo "URL: $url"
  
  # Use curl with user agent to simulate a browser from Canada
  response=$(curl -s -L \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36" \
    -H "Accept-Language: en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7" \
    -H "X-Forwarded-For: 99.236.177.45" \
    "$url")
  
  # Check if the page loaded successfully
  if [[ $response == *"DOCTYPE html"* ]]; then
    echo "✅ Page loaded successfully"
    
    # Check for specific content that indicates the page loaded correctly
    if [[ $response == *"highlighted-stocks"* ]] || [[ $response == *"portfolio-list"* ]]; then
      echo "✅ Page content verified"
    else
      echo "❌ Could not verify page content"
    fi
  else
    echo "❌ Failed to load page"
    echo "Response preview: ${response:0:100}..."
  fi
}

# Function to test API endpoints directly
test_api() {
  local url=$1
  local description=$2
  
  echo -e "\n=== Testing $description ==="
  echo "URL: $url"
  
  # Use curl with Canadian IP and headers
  response=$(curl -s \
    -H "X-Forwarded-For: 99.236.177.45" \
    -H "Accept-Language: en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7" \
    "$url")
  
  # Check if we got valid JSON
  if [[ $response == "["* ]] || [[ $response == "{"* ]]; then
    echo "✅ API returned valid JSON"
    
    # Check for July 17 data
    if [[ $response == *"2025-07-17"* ]]; then
      echo "✅ Found July 17 data"
      # Extract a sample ticker
      if [[ $response == *"ticker"* ]]; then
        ticker=$(echo $response | grep -o '"ticker":"[^"]*"' | head -1)
        echo "   Sample: $ticker"
      fi
    else
      echo "❌ Could not find July 17 data"
      echo "Response preview: ${response:0:100}..."
    fi
  else
    echo "❌ API did not return valid JSON"
    echo "Response preview: ${response:0:100}..."
  fi
}

# Test the main pages
test_page "http://localhost:3000/dashboard/highlighted?startDate=07%2F17%2F2025&endDate=07%2F17%2F2025" "Highlighted Stocks Page (July 17, 2025)"
test_page "http://localhost:3000/dashboard/portfolio-list" "Portfolio List Page"

# Test the API endpoints directly
test_api "http://localhost:3000/api/stocks/highlighted/filter?startDate=2025-07-17&endDate=2025-07-17" "Highlighted Stocks API (July 17)"
test_api "http://localhost:3000/api/stocks/filter-by-date-source?date=07%2F17%2F2025&source=manual" "Portfolio List API (July 17)"

echo -e "\n=== Testing Complete ==="
echo "Note: This script simulates a Canadian user by:"
echo "1. Setting the timezone to America/Toronto"
echo "2. Using a Canadian IP address (99.236.177.45 - Toronto)"
echo "3. Setting Canadian language preferences"
echo ""
echo "For a more thorough test, consider using a VPN with a Canadian server"
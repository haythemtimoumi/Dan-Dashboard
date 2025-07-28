#!/bin/bash

# Verification script to ensure the timezone fix works correctly for Canadian users
# This script specifically tests the July 17 issue where Canadian users see July 16 data

echo "=== Canada Timezone Fix Verification ==="

# Base URL - change this if testing locally
API_BASE="https://www.mytickerlist.com/api"
# Uncomment the line below if testing locally
# API_BASE="https://www.mytickerlist.com/api"

# Test date - focus on July 17 which is showing as July 16
TEST_DATE="2025-07-17"
TEST_SLASH_DATE="07/17/2025"

# Function to run tests in a specific timezone
run_timezone_tests() {
    local timezone=$1
    local timezone_name=$2
    
    echo -e "\n\n=== Testing in $timezone_name ($timezone) ==="
    export TZ="$timezone"
    echo "Current timezone: $(date +"%Z %z")"

    # Function to check if response contains data
    check_response() {
      if [[ $1 == *"[]"* ]] || [[ $1 == *"\"stocks\":[]"* ]]; then
        echo "❌ No data found"
      else
        echo "✅ Data found"
        # Extract and show a sample ticker if data exists
        if [[ $1 == *"ticker"* ]]; then
          ticker=$(echo $1 | grep -o '"ticker":"[^"]*"' | head -1)
          echo "   Sample: $ticker"
        fi
      fi
    }

    # Test Highlighted Stocks API
    echo -e "\n=== Testing Highlighted Stocks API for July 17 ==="
    echo "Testing date: $TEST_DATE"
    response=$(curl -s "${API_BASE}/stocks/highlighted/filter?startDate=$TEST_DATE&endDate=$TEST_DATE")
    echo "Response preview: ${response:0:100}..."
    check_response "$response"

    # Test Portfolio List API
    echo -e "\n=== Testing Portfolio List API for July 17 ==="
    echo "Testing date: $TEST_SLASH_DATE"
    # URL encode the slash date
    encoded_date=$(echo "$TEST_SLASH_DATE" | sed 's/\//%2F/g')
    response=$(curl -s "${API_BASE}/stocks/filter-by-date-source?date=$encoded_date&source=manual")
    echo "Response preview: ${response:0:100}..."
    check_response "$response"

    # Test with the previous day to verify the issue
    echo -e "\n=== Testing with July 16 (to verify the issue) ==="
    PREV_DATE="2025-07-16"
    PREV_SLASH_DATE="07/16/2025"

    echo "Testing Highlighted API with: $PREV_DATE"
    response=$(curl -s "${API_BASE}/stocks/highlighted/filter?startDate=$PREV_DATE&endDate=$PREV_DATE")
    echo "Response preview: ${response:0:100}..."
    check_response "$response"

    echo "Testing Portfolio API with: $PREV_SLASH_DATE"
    encoded_date=$(echo "$PREV_SLASH_DATE" | sed 's/\//%2F/g')
    response=$(curl -s "${API_BASE}/stocks/filter-by-date-source?date=$encoded_date&source=manual")
    echo "Response preview: ${response:0:100}..."
    check_response "$response"
}

# Run tests in multiple timezones to simulate different locations
run_timezone_tests "America/Toronto" "Eastern Canada"
run_timezone_tests "America/Vancouver" "Western Canada"
run_timezone_tests "UTC" "UTC (Server timezone)"
run_timezone_tests "Europe/Paris" "France"

echo -e "\n=== Verification Complete ==="
echo "If the fix is working correctly:"
echo "1. July 17 API calls should return July 17 data (not July 16)"
echo "2. July 16 API calls should return July 16 data"
echo "3. The same results should appear regardless of timezone"

echo -e "\nTo test with your local development server:"
echo "1. Start your Next.js server: npm run dev"
echo "2. Edit this script to use localhost API_BASE"
echo "3. Run: bash verify-timezone-fix.sh"
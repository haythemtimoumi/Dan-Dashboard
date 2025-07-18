#!/bin/bash

# Verification script to ensure the timezone fix works correctly for Canadian users
# This script specifically tests the July 17 issue where Canadian users see July 16 data

echo "=== Canada Timezone Fix Verification ==="
echo "Testing API endpoints with focus on July 17 data..."

# Base URL
API_BASE="https://www.mytickerlist.com/api"

# Set timezone to Eastern Time (Canada)
export TZ="America/Toronto"
echo "Current timezone: $(date +"%Z %z")"

# Test date - focus on July 17 which is showing as July 16
TEST_DATE="2025-07-17"
TEST_SLASH_DATE="07/17/2025"

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

echo -e "\n=== Verification Complete ==="
echo "If the fix is working correctly:"
echo "1. July 17 API calls should return July 17 data (not July 16)"
echo "2. July 16 API calls should return July 16 data"
echo "3. The same results should appear regardless of timezone"
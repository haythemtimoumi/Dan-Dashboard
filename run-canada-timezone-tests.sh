#!/bin/bash

# Script to run all timezone tests with Canadian Eastern Time

echo "Running timezone tests with Canadian Eastern Time (America/Toronto)"
echo "==============================================================="

# Set timezone to Eastern Time (Canada)
export TZ="America/Toronto"

echo "Running local date handling test..."
node test-canada-timezone-fix.js

echo -e "\n\n"
echo "Running API verification test..."
node verify-canada-timezone-fix.js

echo "==============================================================="
echo "Tests complete!"
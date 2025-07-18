#!/bin/bash

# Script to test the timezone fix with Canadian Eastern Time

echo "Running timezone test with Canadian Eastern Time (America/Toronto)"
echo "==============================================================="

# Set timezone to Eastern Time (Canada)
export TZ="America/Toronto"

# Run the test script
node test-canada-july17-issue.js

echo "==============================================================="
echo "Test complete!"
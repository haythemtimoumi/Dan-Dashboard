#!/bin/bash

# Script to test the frontend with Canadian timezone
# This opens the test HTML page in a browser with the timezone set to Eastern Time

echo "=== Testing Frontend with Canadian Timezone ==="
echo "This script will open a browser with the timezone set to Eastern Time (Canada)"

# Set timezone to Eastern Time (Canada)
export TZ="America/Toronto"

# Get the absolute path to the HTML file
HTML_PATH="$(pwd)/test-canada-frontend.html"

echo "Current timezone: $(date +"%Z %z")"
echo "Opening test page: $HTML_PATH"

# Check if we're in a graphical environment
if [ -n "$DISPLAY" ]; then
    # Try to open with various browsers
    if command -v google-chrome &> /dev/null; then
        echo "Opening with Google Chrome..."
        google-chrome --new-window "$HTML_PATH" &
    elif command -v firefox &> /dev/null; then
        echo "Opening with Firefox..."
        firefox --new-window "$HTML_PATH" &
    elif command -v chromium-browser &> /dev/null; then
        echo "Opening with Chromium..."
        chromium-browser --new-window "$HTML_PATH" &
    else
        echo "No supported browser found. Please open the HTML file manually:"
        echo "$HTML_PATH"
    fi
else
    echo "No graphical environment detected. Please open the HTML file manually:"
    echo "$HTML_PATH"
    
    # Provide instructions for testing
    echo -e "\nTo test manually:"
    echo "1. Open the HTML file in a browser"
    echo "2. Use browser developer tools to simulate the Toronto timezone:"
    echo "   - Chrome: DevTools > ... > More tools > Sensors > Location > Toronto"
    echo "   - Firefox: DevTools > ... > Web Developer > Responsive Design Mode > Change timezone"
fi

echo -e "\n=== Test Instructions ==="
echo "1. The page will show your current timezone information"
echo "2. Select July 17, 2025 and test both APIs"
echo "3. Verify that you see July 17 data (not July 16)"
echo "4. Try other dates to confirm the fix works consistently"
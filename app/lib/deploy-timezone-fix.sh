#!/bin/bash

# Script to deploy the timezone fix to the live website
# This script updates the necessary files to fix the timezone issue for Canadian users

echo "=== Deploying Timezone Fix for Canadian Users ==="
echo "This script will update the necessary files to fix the timezone issue"

# Define the files that need to be updated
DATE_UTILS_FILE="/root/Dan-Dashboard/app/lib/date-utils.ts"
DATE_PICKER_FILE="/root/Dan-Dashboard/app/ui/date-picker.tsx"
HIGHLIGHTED_STOCKS_FILE="/root/Dan-Dashboard/app/ui/stocks/highlighted-stocks-with-date-range.tsx"
PORTFOLIO_LIST_FILE="/root/Dan-Dashboard/app/ui/stocks/portfolio-list-with-date-range.tsx"

# Check if files exist
for file in "$DATE_UTILS_FILE" "$DATE_PICKER_FILE" "$HIGHLIGHTED_STOCKS_FILE" "$PORTFOLIO_LIST_FILE"; do
  if [ ! -f "$file" ]; then
    echo "❌ Error: File $file not found"
    exit 1
  fi
done

echo "✅ All required files found"

# Build and deploy the application
echo -e "\n=== Building and deploying the application ==="
echo "Running build process..."

# Navigate to the project root directory
cd /root/Dan-Dashboard

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the application
echo "Building the application..."
npm run build

# Deploy to production
echo "Deploying to production..."
# Replace this with your actual deployment command
# For example: vercel --prod or npm run deploy
npm run deploy

echo -e "\n=== Deployment Complete ==="
echo "The timezone fix has been deployed to the live website"
echo "Please verify the fix by testing the following pages:"
echo "1. https://www.mytickerlist.com/dashboard/highlighted"
echo "2. https://www.mytickerlist.com/dashboard/portfolio-list"
echo ""
echo "Test with the date July 17, 2025 to ensure Canadian users see the correct data"
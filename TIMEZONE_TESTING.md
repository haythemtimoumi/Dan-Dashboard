# Timezone Testing Guide

This guide explains how to test the timezone fix for Canadian users who were experiencing date shifting issues.

## The Issue

Canadian users in Eastern Time (UTC-4/5) were experiencing date shifting when viewing data for July 17, 2025. They were seeing July 16 data instead. This affected both the highlighted stocks and portfolio list pages.

## Testing Options

### Option 1: Using the Verification Script

We've created a bash script that simulates different timezones to test the API responses:

```bash
# Make the script executable if needed
chmod +x verify-timezone-fix.sh

# Run the script
./verify-timezone-fix.sh
```

This script will:
1. Test the API endpoints with July 17, 2025 as the target date
2. Run tests in multiple timezones (Eastern Canada, Western Canada, UTC, France)
3. Compare the results to ensure consistency across timezones

### Option 2: Using the Browser Test Page

We've also created a browser-based test page that you can use to verify the timezone handling:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the test page at:
   ```
   http://localhost:3000/timezone-test
   ```

3. The page will show:
   - Your current browser timezone
   - Various date format representations
   - Links to test the API endpoints directly

### Option 3: Changing Your System Timezone

If you want to manually test by changing your system timezone:

#### On macOS:
1. Go to System Preferences > Date & Time
2. Select "Eastern Time" or another Canadian timezone
3. Test the application

#### On Linux:
```bash
# Temporarily change timezone
export TZ="America/Toronto"

# Verify the change
date
```

#### On Windows:
1. Go to Settings > Time & Language > Date & time
2. Change the timezone to "(UTC-05:00) Eastern Time (US & Canada)"
3. Test the application

## Expected Results

If the timezone fix is working correctly:
1. July 17 API calls should return July 17 data (not July 16)
2. July 16 API calls should return July 16 data
3. The same results should appear regardless of timezone

## Troubleshooting

If you're still seeing inconsistent results:
1. Check the browser console for any JavaScript errors
2. Verify that the date-utils.ts file is using the UTC noon approach
3. Clear your browser cache and cookies
4. Try testing in an incognito/private browsing window
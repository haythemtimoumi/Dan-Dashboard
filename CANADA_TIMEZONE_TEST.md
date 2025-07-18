# Canada Timezone Issue Testing Guide

This guide provides instructions for testing the timezone fix for Canadian users who were experiencing date shifting issues.

## The Issue

Canadian users (Eastern Time, UTC-4/UTC-5) reported that when selecting July 17, 2025, they were seeing data from July 16, 2025. This issue affected both the highlighted stocks and portfolio list pages.

## Testing Tools

We've created several tools to verify the fix:

1. **Backend API Tests**
   - `verify-timezone-fix.sh` - Tests the API endpoints with Canadian timezone
   - `test-canada-july17-issue.js` - Tests the date utility functions with Canadian timezone

2. **Frontend Simulation**
   - `test-canada-frontend.html` - Simulates the frontend experience for Canadian users
   - `test-canada-frontend.sh` - Opens a browser with Canadian timezone settings

## How to Test

### 1. Backend API Testing

Run the verification script to test the API endpoints:

```bash
./verify-timezone-fix.sh
```

This script:
- Sets the timezone to Eastern Time (Canada)
- Tests the highlighted stocks API with July 17, 2025
- Tests the portfolio list API with July 17, 2025
- Compares with July 16 data to verify the fix

### 2. Date Utility Function Testing

Run the test script to verify the date utility functions:

```bash
./run-canada-test.sh
```

This script:
- Sets the timezone to Eastern Time (Canada)
- Tests the date formatting functions
- Verifies that dates are correctly formatted for API calls
- Confirms that the UTC noon approach prevents date shifting

### 3. Frontend Testing

Run the frontend test script:

```bash
./test-canada-frontend.sh
```

This script:
- Opens a browser with the timezone set to Eastern Time
- Loads a test page that simulates the dashboard experience
- Allows you to test both APIs with different dates

Alternatively, you can manually open `test-canada-frontend.html` in a browser and use developer tools to simulate the Toronto timezone.

## Expected Results

If the fix is working correctly:

1. When selecting July 17, 2025:
   - The highlighted stocks API should return July 17 data
   - The portfolio list API should return July 17 data

2. When selecting July 18, 2025:
   - The highlighted stocks API should return July 18 data
   - The portfolio list API should return July 18 data

3. The date formatting functions should consistently produce:
   - "2025-07-17" for the highlighted stocks API
   - "07/17/2025" for the portfolio list API

## Troubleshooting

If issues persist:

1. Check that all date operations use the utility functions from `app/lib/date-utils.ts`
2. Verify that the UTC noon approach is applied consistently
3. Check for any caching issues that might be serving old data
4. Inspect the network requests in the browser to confirm the correct date format is being used

## Fix Implementation

The fix uses the "UTC noon" approach:

```typescript
// Create a UTC date at noon to avoid any timezone day shifting
const utcDate = new Date(Date.UTC(
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
  12, 0, 0
));
```

This ensures that even with timezone differences of up to ±12 hours, the date won't shift to the previous or next day.
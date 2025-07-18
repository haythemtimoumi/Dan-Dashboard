# API Testing for Timezone Fix

This document provides instructions for testing the timezone fix for both the highlighted stocks and portfolio list screens.

## Test Dates

We'll test with two specific dates:
- July 17, 2025
- July 18, 2025

## API Endpoints to Test

### Highlighted Stocks Screen
```
https://www.mytickerlist.com/api/stocks/highlighted/filter?startDate=2025-07-17&endDate=2025-07-17
https://www.mytickerlist.com/api/stocks/highlighted/filter?startDate=2025-07-18&endDate=2025-07-18
```

### Portfolio List Screen
```
https://www.mytickerlist.com/api/stocks/filter-by-date-source?date=07/17/2025&source=manual
https://www.mytickerlist.com/api/stocks/filter-by-date-source?date=07/18/2025&source=manual
```

## How to Test

### Method 1: Using the Browser

1. Open your browser and navigate to each of the API endpoints listed above
2. Verify that the correct data is returned for each date
3. Test from different timezones (you can use a VPN to simulate different locations)

### Method 2: Using the Test Scripts

We've provided two test scripts:

#### JavaScript Test (Node.js)
```bash
node test-api-endpoints.js
```

#### Shell Script Test
```bash
./test-api-endpoints.sh
```

### Method 3: Using the Dashboard UI

1. Open the highlighted stocks page: https://www.mytickerlist.com/dashboard/highlighted
2. Select July 17, 2025 in the date picker and verify the data
3. Select July 18, 2025 in the date picker and verify the data
4. Open the portfolio list page: https://www.mytickerlist.com/dashboard/portfolio-list
5. Select July 17, 2025 in the date picker and verify the data
6. Select July 18, 2025 in the date picker and verify the data

## Expected Results

- Each API endpoint should return data specific to the requested date
- The date displayed in the UI should match the date you selected
- The fix should work consistently across different timezones

## Verifying the Fix for Canadian Users

To specifically test for Canadian users (Eastern Time):
1. Use a VPN set to a Canadian location
2. Run the tests above
3. Verify that the correct data is displayed for each date

The timezone fix ensures that users in any timezone will see data for the date they selected, not the previous or next day.
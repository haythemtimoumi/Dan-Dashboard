# Timezone Fix Verification Checklist

Use this checklist to verify that the timezone fix is working correctly for both the highlighted stocks and portfolio list screens.

## Prerequisites
- Access to the production environment
- Ability to test from different timezones (or use a VPN)

## Verification Steps

### 1. Run the Verification Scripts
- [ ] Run `./verify-timezone-fix.sh` to test the API endpoints
- [ ] Run `node verify-timezone-fix.js` to verify date handling

### 2. Test Highlighted Stocks Screen
- [ ] Navigate to http://localhost:3000/dashboard/highlighted
- [ ] Select July 17, 2025 in the date picker
- [ ] Verify that data for July 17, 2025 is displayed
- [ ] Select July 18, 2025 in the date picker
- [ ] Verify that data for July 18, 2025 is displayed

### 3. Test Portfolio List Screen
- [ ] Navigate to http://localhost:3000/dashboard/portfolio-list
- [ ] Select July 17, 2025 in the date picker
- [ ] Verify that data for July 17, 2025 is displayed
- [ ] Select July 18, 2025 in the date picker
- [ ] Verify that data for July 18, 2025 is displayed

### 4. Test from Different Timezones
- [ ] Test from Eastern Time (Canada) - UTC-4/UTC-5
- [ ] Test from Pacific Time - UTC-7/UTC-8
- [ ] Test from Central European Time - UTC+1/UTC+2
- [ ] Test from Japan/Korea - UTC+9

### 5. Check Browser Console
- [ ] Open browser developer tools
- [ ] Check console for any date-related errors
- [ ] Verify that API requests use the correct date format

## Expected Results
- The same data should be displayed for a given date regardless of timezone
- No date shifting should occur (e.g., selecting July 17 should not show data from July 16)
- API requests should use the correct date format (YYYY-MM-DD for highlighted, MM/DD/YYYY for portfolio)

## Troubleshooting
If issues persist:
1. Check server logs for any timezone-related errors
2. Verify that all date utility functions are being used consistently
3. Ensure that the UTC noon approach is applied to all date operations
4. Check for any caching issues that might be serving old data
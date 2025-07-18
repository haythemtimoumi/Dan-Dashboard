# Timezone Fix for Canadian Users

This document explains the fix implemented to address the timezone issue affecting users in Canada and other timezones.

## Problem

Users in Canada (and potentially other timezones) were experiencing an issue where selecting a specific date (e.g., July 17) would show data from the previous day (July 16).

## Root Cause

The issue was caused by inconsistent date handling between:

1. The frontend (browser's local timezone)
2. The API routes (converting dates to different formats)
3. The database (storing dates in UTC)

When dates were converted between timezones, especially for users in timezones like Eastern Time (UTC-4/UTC-5), the date could shift to the previous day.

## Solution

We implemented a consistent approach to date handling using "UTC noon" for all date operations:

1. All dates are converted to UTC at 12:00 noon
2. Using noon ensures that even with timezone differences, the date won't shift to the previous or next day
3. Date comparisons are done using the YYYY-MM-DD string format

## Key Changes

1. Updated `date-utils.ts` utility functions:
   - `formatDateForHighlightedAPI`
   - `formatDateForPortfolioAPI`
   - `parseDateString`
   - `getTodayLocal`

2. Fixed API routes:
   - `/api/stocks/filter-by-date-source/route.ts`
   - `/api/stocks/highlighted/filter/route.ts`

## Testing

To verify this fix works for Canadian users:
1. Test with a browser set to Eastern Time (UTC-4/UTC-5)
2. Select specific dates and verify the correct data appears
3. Check server logs to confirm dates are being processed correctly

## Why This Works

By using UTC noon (12:00) for all date operations, we ensure that timezone differences won't cause the date to shift. Even in timezones that are many hours ahead or behind UTC, noon UTC will still fall within the same calendar day.
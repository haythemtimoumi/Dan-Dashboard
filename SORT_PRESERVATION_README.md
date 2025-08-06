# Sort Preservation Feature

## Overview
This feature preserves the current sort column and direction when navigating from the portfolio table to ticker detail pages.

## How it works

### 1. Portfolio Table (`/dashboard/portfolio`)
- When clicking on a ticker (e.g., SLB), the current sort state is passed as URL parameters
- Example: `/dashboard/portfolio/SLB?date=2025-08-06&sortBy=per_upside&sortOrder=desc`

### 2. Ticker Detail Page (`/dashboard/portfolio/[ticker]`)
- Reads the `sortBy` and `sortOrder` parameters from the URL
- Applies the same sorting logic to the stock list for navigation
- Preserves sort parameters when navigating between tickers using arrow keys or navigation buttons

### 3. Analysis Page (`/dashboard/portfolio/[ticker]/analysis`)
- Also preserves sort parameters when navigating back to the ticker detail page

## URL Parameters
- `date`: The selected date (e.g., `2025-08-06`)
- `sortBy`: The column being sorted (e.g., `per_upside`, `sentiment_score`, `ticker`)
- `sortOrder`: The sort direction (`asc` or `desc`)

## Navigation Flow
1. User sorts portfolio table by "% Upside" descending
2. User clicks on ticker "SLB"
3. URL becomes: `/dashboard/portfolio/SLB?date=2025-08-06&sortBy=per_upside&sortOrder=desc`
4. Detail page shows SLB with navigation preserving the original sort order
5. User can navigate to next/previous stocks in the same sort order
6. When returning to portfolio, the original sort state is maintained

## Files Modified
- `/app/dashboard/portfolio/page.tsx` - Added sort parameters to ticker links
- `/app/dashboard/portfolio/[ticker]/page.tsx` - Read and apply sort parameters
- `/app/dashboard/portfolio/[ticker]/analysis/page.tsx` - Preserve sort parameters in back navigation

## Benefits
- Maintains user context when drilling down into details
- Provides consistent navigation experience
- Preserves user's preferred sorting preference across page transitions
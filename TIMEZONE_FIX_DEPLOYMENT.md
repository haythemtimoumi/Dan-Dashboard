# Timezone Fix Deployment Guide

This guide explains how to deploy the timezone fix for Canadian users who were experiencing date shifting issues on the live website.

## The Issue

Canadian users in Eastern Time (UTC-4/5) were experiencing date shifting when viewing data for July 17, 2025. They were seeing July 16 data instead. This affected both the highlighted stocks and portfolio list pages.

## Files Modified for the Fix

The following files were updated to implement the timezone fix:

1. `/app/lib/date-utils.ts` - Added UTC noon approach for consistent date handling
2. `/app/ui/date-picker.tsx` - Updated to use UTC noon approach when handling date changes
3. `/app/ui/stocks/highlighted-stocks-with-date-range.tsx` - Enhanced API data handling with UTC noon approach
4. `/app/ui/stocks/portfolio-list-with-date-range.tsx` - Enhanced API data handling with UTC noon approach

## Deployment Options

### Option 1: Using the Deployment Script

We've created a bash script that automates the deployment process:

```bash
# Make the script executable if needed
chmod +x /root/Dan-Dashboard/app/lib/deploy-timezone-fix.sh

# Run the script
/root/Dan-Dashboard/app/lib/deploy-timezone-fix.sh
```

This script will:
1. Check if all required files exist
2. Install dependencies if needed
3. Build the application
4. Deploy to production

### Option 2: Manual Deployment

If you prefer to deploy manually:

1. Navigate to the project root directory:
   ```bash
   cd /root/Dan-Dashboard
   ```

2. Install dependencies if needed:
   ```bash
   npm install
   ```

3. Build the application:
   ```bash
   npm run build
   ```

4. Deploy to production using your preferred method:
   ```bash
   # For Vercel
   vercel --prod
   
   # Or your custom deployment command
   npm run deploy
   ```

## Verification After Deployment

After deploying, verify the fix by:

1. Visit the highlighted stocks page:
   ```
   https://www.mytickerlist.com/dashboard/highlighted
   ```

2. Visit the portfolio list page:
   ```
   https://www.mytickerlist.com/dashboard/portfolio-list
   ```

3. Set the date to July 17, 2025 and verify that:
   - The correct July 17 data is displayed
   - The same results appear regardless of timezone

## Rollback Plan

If issues are encountered after deployment:

1. Revert the changes in the modified files
2. Rebuild and redeploy the application
3. Notify users of the rollback and expected timeline for a fix

## Support

If Canadian users continue to experience issues after deployment, direct them to the test page:
```
https://www.mytickerlist.com/timezone-test
```

This page will help diagnose any remaining timezone issues by showing detailed date information.
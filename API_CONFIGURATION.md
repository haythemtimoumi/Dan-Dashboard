# API Configuration

## Environment Variables

To ensure the API works correctly, you need to set up the proper environment variables:

1. Create a `.env.local` file in the root of your project
2. Add the following environment variable:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Note:** When your frontend is running on a different port (e.g., 3001) than your backend API (e.g., 3000), you need to use an absolute URL with the correct port for the backend.

## API URL Format

The application uses a properly formatted URL for API calls. The URL can be either:

1. An absolute URL (recommended for separate backend): `http://localhost:3000`
   - Must include:
     - Protocol (http:// or https://)
     - Host (localhost or your domain)
     - Port (if not using standard ports)
   - Do not include the `/api` path in the environment variable as it's added in the code

2. A relative URL: `/api`
   - Only use this when your API is served from the same server as your frontend
   - Not recommended when running frontend and backend on different ports

## Common Issues

If you encounter the error `TypeError: Failed to parse URL from /api/stocks`, it means the API URL is not properly formatted. Make sure you have:

1. Set the NEXT_PUBLIC_API_URL environment variable in your .env.local file
2. Restarted your development server after making changes to environment variables

If you see the error `Failed to load stocks. Please try again later.`, check for:

1. Port mismatch: If your frontend is running on a different port (e.g., 3001) than your API (e.g., 3000), use an absolute URL with the correct port
2. CORS issues: Ensure your backend has CORS configured to allow requests from your frontend
3. API server status: Ensure your API server is running
4. Network errors: Check the browser's developer tools Network tab for specific error details

## Testing API Endpoints

You can test the API endpoints directly in your browser:

- All stocks: https://stockdashboard.ddnsfree.com/api/stocks
- Highlighted stocks: https://stockdashboard.ddnsfree.com/api/stocks/highlighted
- Sorted stocks: https://stockdashboard.ddnsfree.com/api/stocks/sorted
- Daily changes: https://stockdashboard.ddnsfree.com/api/stocks/daily-changes
- Date range: https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=2023-01-01&endDate=2023-12-31
- Stock history: https://stockdashboard.ddnsfree.com/api/stocks/123/history?from=2023-01-01&to=2023-01-31
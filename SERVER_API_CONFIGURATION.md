# Server API Configuration Guide

## Environment Variables for Server Components

When using Next.js App Router with React Server Components, you need to properly configure environment variables to ensure API calls work correctly both in development and production environments.

## The Issue

The error you encountered:
```
TypeError: Failed to parse URL from /api/proxy/stocks
code: 'ERR_INVALID_URL'
input: '/api/proxy/stocks'
```

This happens because:
- In server components, relative URLs like `/api/proxy/stocks` don't work because there's no base URL context
- Server components need absolute URLs for fetch calls

## Solution

### 1. Environment Variables

Add these environment variables to your project:

1. Create a `.env.local` file in your project root:
```
NEXT_PUBLIC_BASE_URL=http://localhost:3000/
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

2. For Vercel deployment, add these same variables in the Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add both variables with appropriate production values

### 2. URL Creation Function

We've implemented a `createApiUrl` function in `app/lib/data.ts` that:
- Detects if the code is running on the server or client
- Uses the appropriate base URL for server-side calls
- Handles both development and production environments

### 3. API Call Pattern

Always use the `createApiUrl` function for API calls:

```typescript
// CORRECT - Works in both client and server components
const response = await fetch(createApiUrl('/stocks'));

// INCORRECT - Will fail in server components
const response = await fetch('/api/proxy/stocks');
```

## How It Works

1. **Client-side rendering**: 
   - Relative URLs work fine because the browser provides the base URL context
   - Example: `/api/stocks` → `http://localhost:3000/api/stocks`

2. **Server-side rendering**:
   - We use `NEXT_PUBLIC_BASE_URL` to create absolute URLs
   - Example: `/api/stocks` → `http://localhost:3000/api/stocks`

3. **Production environment**:
   - The proxy API route is used to avoid CORS issues
   - All API calls go through `/api/proxy` which forwards them to the actual API

## Testing

To verify your configuration is working:
1. Run the application locally
2. Check both client-side rendered pages and server components
3. Verify API calls are working in both contexts
4. Deploy to Vercel and test in production

## Troubleshooting

If you still encounter URL parsing errors:
1. Check that `NEXT_PUBLIC_BASE_URL` is correctly set
2. Ensure all API calls use the `createApiUrl` function
3. Restart your development server after changing environment variables
4. Check the server logs for more detailed error information
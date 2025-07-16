import { NextRequest, NextResponse } from 'next/server';

// The base URL of your HTTP-only backend API
const API_BASE_URL = 'http://localhost:3000';

// Mark this route as dynamic to ensure it's not cached
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the path and query parameters from the request
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Remove the path parameter and keep the rest for forwarding
    const forwardParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        forwardParams.append(key, value);
      }
    });

    // Construct the URL to the backend API
    let apiUrl = `${API_BASE_URL}${path}`;
    const queryString = forwardParams.toString();
    if (queryString) {
      apiUrl += `?${queryString}`;
    }

    console.log(`Proxying request to: ${apiUrl}`);

    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get the response data
    const data = await response.json();

    // Return the response from the backend API
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from backend API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the path from the query parameters
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { error: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();

    // Remove the path parameter and keep the rest for forwarding
    const forwardParams = new URLSearchParams();
    searchParams.forEach((value, key) => {
      if (key !== 'path') {
        forwardParams.append(key, value);
      }
    });

    // Construct the URL to the backend API
    let apiUrl = `${API_BASE_URL}${path}`;
    const queryString = forwardParams.toString();
    if (queryString) {
      apiUrl += `?${queryString}`;
    }

    console.log(`Proxying POST request to: ${apiUrl}`);

    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Get the response data
    const data = await response.json();

    // Return the response from the backend API
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: 'Failed to post data to backend API' },
      { status: 500 }
    );
  }
}
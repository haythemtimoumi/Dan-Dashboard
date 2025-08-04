import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

export async function GET() {
  try {
    console.log('Fetching gurus from:', `${API_BASE_URL}/api/gurus-with-tickers`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_BASE_URL}/api/gurus-with-tickers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Successfully fetched gurus data, count:', data.length);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching gurus with tickers:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - API took too long to respond' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch gurus with tickers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
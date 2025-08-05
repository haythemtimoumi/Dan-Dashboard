import { NextRequest, NextResponse } from 'next/server';

const DAN_API_BASE_URL = process.env.DAN_API_BASE_URL || 'http://localhost:3000';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const url = `${DAN_API_BASE_URL}/api/stocks/last-date?t=${Date.now()}&r=${Math.random()}`;
    console.log('Calling backend URL:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend returned:', data);
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error fetching last date from backend:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last date' }, 
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

const DAN_API_BASE_URL = process.env.DAN_API_BASE_URL || 'http://localhost:3000';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Build the URL for Dan-API
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const danApiUrl = `${DAN_API_BASE_URL}/api/stocks/grouped?${params.toString()}`;
    
    const response = await fetch(danApiUrl);
    
    if (!response.ok) {
      throw new Error(`Dan-API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching grouped stocks from Dan-API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped stocks from Dan-API' }, 
      { status: 500 }
    );
  }
}
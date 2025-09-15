import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const { ticker } = params;
    const body = await request.json();
    
    const DAN_API_BASE_URL = process.env.DAN_API_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${DAN_API_BASE_URL}/api/stocks/ticker/${ticker}/ticker-view`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update ticker view' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating ticker view:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
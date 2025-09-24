import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    // Use the correct Dan-API URL based on environment
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000/api/stocks'
      : 'http://localhost:3000/api/stocks';
    
    const response = await fetch(`${apiUrl}/ticker/${params.ticker}/target-false`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update target status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating target status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
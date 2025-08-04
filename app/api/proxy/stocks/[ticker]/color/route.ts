import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const body = await request.json();
    
    // Use the correct Dan-API URL based on environment
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000/api/stocks'
      : 'http://localhost:3000/api/stocks';
    
    const response = await fetch(`${apiUrl}/ticker/${params.ticker}/color`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update color' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating color:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
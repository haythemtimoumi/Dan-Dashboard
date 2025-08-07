import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const response = await fetch(`http://localhost:3000/api/comments/ticker/${params.ticker}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ticker comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker comments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const body = await request.json();
    
    const response = await fetch(`http://localhost:3000/api/comments/ticker/${params.ticker}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating ticker comment:', error);
    return NextResponse.json(
      { error: 'Failed to create ticker comment' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch('https://www.mytickerlist.com/api/stocks/grouped', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching grouped stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped stocks' },
      { status: 500 }
    );
  }
}
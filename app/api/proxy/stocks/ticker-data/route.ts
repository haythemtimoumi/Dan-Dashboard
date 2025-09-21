import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');
  const date = searchParams.get('date');

  if (!ticker || !date) {
    return NextResponse.json(
      { error: 'Ticker and date parameters are required' },
      { status: 400 }
    );
  }

  try {
    const externalApiUrl = `http://localhost:3000/api/stocks/ticker-data?ticker=${ticker}&date=${date}`;
    const response = await fetch(externalApiUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ticker data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
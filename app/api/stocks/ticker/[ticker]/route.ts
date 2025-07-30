import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const isHourly = searchParams.get('hourly') === 'true';
    
    let url = `https://www.mytickerlist.com/api/stocks/ticker/${params.ticker}`;
    const urlParams = new URLSearchParams();
    
    if (date) {
      if (isHourly) {
        // For hourly tickers, get all data for the specified date
        urlParams.append('startDate', date);
        urlParams.append('endDate', date);
      } else {
        // For daily tickers, get data for the specific date
        urlParams.append('date', date);
      }
    }
    
    if (urlParams.toString()) {
      url += `?${urlParams.toString()}`;
    }
    
    const response = await fetch(url, {
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
    console.error('Error fetching ticker data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
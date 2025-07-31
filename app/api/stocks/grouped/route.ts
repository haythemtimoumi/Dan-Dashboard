import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const target = searchParams.get('target');
    
    let url = 'https://www.mytickerlist.com/api/stocks/grouped';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    let data = await response.json();
    
    // Filter for target stocks if requested
    if (target === 'true') {
      data = data.filter((stock: any) => stock.target === true);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching grouped stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grouped stocks' },
      { status: 500 }
    );
  }
}
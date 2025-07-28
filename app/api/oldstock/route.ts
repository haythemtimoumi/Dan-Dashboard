import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    let apiUrl = `${API_BASE_URL}/oldstock`;
    
    // Add date filtering if provided
    if (startDate && endDate) {
      apiUrl += `/filter?startDate=${startDate}&endDate=${endDate}`;
    }
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': authHeader || '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Old stock API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch old stock data' },
      { status: 500 }
    );
  }
}
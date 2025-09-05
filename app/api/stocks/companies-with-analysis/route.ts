import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const url = new URL('http://localhost:3000/api/stocks/companies-with-analysis');
    if (date) {
      url.searchParams.set('date', date);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks data' },
      { status: 500 }
    );
  }
}
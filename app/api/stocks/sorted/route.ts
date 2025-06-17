import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export async function GET() {
  try {
    // Sort stocks by sentiment score in descending order
    const sortedStocks = [...stocks].sort((a, b) => b.sentiment_score - a.sentiment_score);
    return NextResponse.json(sortedStocks);
  } catch (error) {
    console.error('Error fetching sorted stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sorted stocks' },
      { status: 500 }
    );
  }
}
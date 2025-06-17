import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export async function GET() {
  try {
    // Filter stocks based on the highlight property
    const highlightedStocks = stocks.filter(stock => stock.highlight === true);
    
    // Sort by sentiment score in descending order
    highlightedStocks.sort((a, b) => b.sentiment_score - a.sentiment_score);
    
    if (highlightedStocks.length === 0) {
      console.warn('No highlighted stocks found');
      // Return an empty array with 200 status instead of an error
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(highlightedStocks);
  } catch (error) {
    console.error('Error fetching highlighted stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch highlighted stocks' },
      { status: 500 }
    );
  }
}
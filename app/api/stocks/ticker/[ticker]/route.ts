import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase();
    const matchingStocks = stocks.filter(s => s.ticker === ticker);
    
    if (matchingStocks.length === 0) {
      console.warn(`No stocks found with ticker ${ticker}`);
      return NextResponse.json(
        { error: `No stocks found with ticker ${ticker}` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(matchingStocks);
  } catch (error) {
    console.error('Error fetching stock by ticker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock by ticker' },
      { status: 500 }
    );
  }
}
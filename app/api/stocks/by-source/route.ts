import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    if (!source) {
      return NextResponse.json(
        { error: 'Source parameter is required' },
        { status: 400 }
      );
    }

    // Map source names to internal source values
    const sourceMapping: { [key: string]: string } = {
      'guru_portfolio': 'guru_list',
      'dan_portfolio_list': 'dan_portfolio_list',
      'stockscore_list': 'manual'
    };

    const mappedSource = sourceMapping[source] || source;
    
    const sourceStocks = stocks.filter(stock => stock.source === mappedSource);
    
    // Add highlight property to stocks
    const stocksWithHighlight = sourceStocks.map(stock => ({
      ...stock,
      highlight: stock.sentiment_score > 70 // Example highlight logic
    }));

    return NextResponse.json(stocksWithHighlight);
  } catch (error) {
    console.error('Error fetching stocks by source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks by source' },
      { status: 500 }
    );
  }
}
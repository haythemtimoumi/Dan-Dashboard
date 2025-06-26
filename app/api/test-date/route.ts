import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get the first few stocks to examine their structure
    const sampleStocks = stocks.slice(0, 3);
    
    // Return detailed information about the dates
    const dateInfo = sampleStocks.map(stock => ({
      id: stock.id,
      ticker: stock.ticker,
      created_at: stock.created_at,
      created_at_type: typeof stock.created_at,
      date_valid: stock.created_at ? !isNaN(new Date(stock.created_at).getTime()) : false
    }));
    
    return NextResponse.json({
      dateInfo,
      rawStocks: sampleStocks
    });
  } catch (error) {
    console.error('Error in test-date API:', error);
    return NextResponse.json(
      { error: 'Failed to test dates' },
      { status: 500 }
    );
  }
}
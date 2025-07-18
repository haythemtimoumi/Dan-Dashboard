import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    
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
      serverTime: {
        iso: now.toISOString(),
        utc: now.toUTCString(),
        local: now.toString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: now.getTimezoneOffset(),
        formatted: {
          'YYYY-MM-DD': now.toISOString().split('T')[0],
          'MM/DD/YYYY': `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
        }
      },
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
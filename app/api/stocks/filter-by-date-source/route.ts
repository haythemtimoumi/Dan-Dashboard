import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const source = searchParams.get('source');

    if (!date || !source) {
      return NextResponse.json(
        { error: 'Date and source parameters are required' },
        { status: 400 }
      );
    }

    // Convert source parameter to match the type in the stock data
    // The API accepts "rule1" or "manual"
    let normalizedSource: 'rule1' | 'manual';
    
    if (source === 'rule1') {
      normalizedSource = 'rule1';
    } else if (source === 'manual') {
      normalizedSource = 'manual';
    } else {
      return NextResponse.json(
        { error: `Invalid source: ${source}. Must be 'rule1' or 'manual'` },
        { status: 400 }
      );
    }

    // Parse the date string (MM/DD/YYYY) to a Date object
    // Create date in UTC to avoid timezone issues
    const [month, day, year] = date.split('/').map(Number);
    
    // Create a UTC date at noon to avoid any timezone day shifting
    const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    
    // Format the date to match the format in the stock data (YYYY-MM-DD)
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    // Filter stocks by date and source
    const filteredStocks = stocks.filter(stock => {
      // Extract date from the stock's date or created_at field
      let stockDate;
      if (stock.date) {
        // If date is in MM/DD/YYYY format, parse it
        if (typeof stock.date === 'string' && stock.date.includes('/')) {
          const [stockMonth, stockDay, stockYear] = stock.date.split('/').map(Number);
          stockDate = new Date(Date.UTC(stockYear, stockMonth - 1, stockDay, 12, 0, 0));
        } else {
          // Otherwise assume ISO format
          stockDate = new Date(stock.date);
        }
      } else {
        stockDate = new Date(stock.created_at);
      }
      
      // Get the date in YYYY-MM-DD format
      const stockDateStr = stockDate.toISOString().split('T')[0];
      
      // Check if the stock's date matches the requested date and source
      return stockDateStr === formattedDate && stock.source === normalizedSource;
    });

    if (filteredStocks.length === 0) {
      // Return an object with empty stocks array but include date and source info
      return NextResponse.json({
        stocks: [],
        totalCount: 0,
        date: formattedDate,
        source: normalizedSource,
        message: `No stocks found for date: ${date} and source: ${source}`
      }, { status: 200 });
    }

    return NextResponse.json({
      stocks: filteredStocks,
      totalCount: filteredStocks.length,
      date: formattedDate,
      source: normalizedSource
    });
  } catch (error) {
    console.error('Error filtering stocks by date and source:', error);
    return NextResponse.json(
      { error: 'Failed to filter stocks by date and source' },
      { status: 500 }
    );
  }
}
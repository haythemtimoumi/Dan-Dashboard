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
    const [month, day, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    
    // Format the date to match the format in the stock data (YYYY-MM-DD)
    // Use local date parts to avoid timezone shifts
    const formattedYear = dateObj.getFullYear();
    const formattedMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(dateObj.getDate()).padStart(2, '0');
    const formattedDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;
    
    console.log(`Filtering stocks for date: ${date} (formatted as: ${formattedDate}) and source: ${normalizedSource}`);
    
    // Filter stocks by date and source
    const filteredStocks = stocks.filter(stock => {
      // Extract date from the stock's date or created_at field
      const stockDate = stock.date ? new Date(stock.date) : new Date(stock.created_at);
      
      // Format stock date using local date parts to avoid timezone shifts
      const stockYear = stockDate.getFullYear();
      const stockMonth = String(stockDate.getMonth() + 1).padStart(2, '0');
      const stockDay = String(stockDate.getDate()).padStart(2, '0');
      const stockDateStr = `${stockYear}-${stockMonth}-${stockDay}`;
      
      // Check if the stock's date matches the requested date and source
      return stockDateStr === formattedDate && stock.source === normalizedSource;
    });
    
    console.log(`Found ${filteredStocks.length} stocks for date: ${formattedDate} and source: ${normalizedSource}`)

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
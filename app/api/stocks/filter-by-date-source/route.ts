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
    // The API accepts "Rule1" or "MagicFormula" but the data uses "Rule 1" or "Magic Formula"
    let normalizedSource: 'Rule1' | 'MagicFormula';
    
    if (source === 'Rule1') {
      normalizedSource = 'Rule1';
    } else if (source === 'MagicFormula') {
      normalizedSource = 'MagicFormula';
    } else {
      return NextResponse.json(
        { error: `Invalid source: ${source}. Must be 'Rule1' or 'MagicFormula'` },
        { status: 400 }
      );
    }

    // Parse the date string (MM/DD/YYYY) to a Date object
    const [month, day, year] = date.split('/').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in JS Date
    
    // Format the date to match the format in the stock data (YYYY-MM-DD)
    const formattedDate = dateObj.toISOString().split('T')[0];
    
    // Filter stocks by date and source
    const filteredStocks = stocks.filter(stock => {
      // Extract date from the stock's date or created_at field
      const stockDate = stock.date ? new Date(stock.date) : new Date(stock.created_at);
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
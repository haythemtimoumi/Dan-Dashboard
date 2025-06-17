import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { source: string } }
) {
  try {
    const source = decodeURIComponent(params.source);
    
    // Convert source parameter to match the type in the stock data
    // The API accepts "Rule1" or "MagicFormula" but the data uses "Rule 1" or "Magic Formula"
    let normalizedSource: 'Rule1' | 'MagicFormula';
    
    if (source === 'Rule1') {
      normalizedSource = 'Rule1';
    } else if (source === 'MagicFormula') {
      normalizedSource = 'MagicFormula';
    } else {
      console.error(`Invalid source requested: ${source}`);
      return NextResponse.json(
        { error: `Invalid source: ${source}. Must be 'Rule1' or 'MagicFormula'` },
        { status: 400 }
      );
    }
    
    const sourceStocks = stocks.filter(stock => stock.source === normalizedSource);
    
    if (sourceStocks.length === 0) {
      console.warn(`No stocks found for source: ${normalizedSource}`);
      // Return an object with empty stocks array, source info and current date
      const currentDate = new Date().toISOString();
      return NextResponse.json({
        stocks: [],
        source: normalizedSource,
        date: currentDate,
        message: `No stocks found for source: ${normalizedSource}`
      }, { status: 200 });
    }
    
    // Return stocks with additional metadata
    return NextResponse.json({
      stocks: sourceStocks,
      source: normalizedSource,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stocks by source:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks by source' },
      { status: 500 }
    );
  }
}
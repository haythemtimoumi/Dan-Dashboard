import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const metric = searchParams.get('metric');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');
    
    // Optional parameters with defaults
    const threshold = parseFloat(searchParams.get('threshold') || '5');
    const ticker = searchParams.get('ticker');
    const source = searchParams.get('source');
    const guru = searchParams.get('guru');

    // Validate required parameters
    if (!metric || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'metric, start_date, and end_date are required parameters' },
        { status: 400 }
      );
    }

    // Validate metric parameter
    const validMetrics = ['pe', 'signal_score', 'sentiment_score', 'buy_price'];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `metric must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Filter stocks by date range
    let startStocks = stocks.filter(stock => {
      const stockDate = new Date(stock.created_at);
      return stockDate.toISOString().split('T')[0] === startDate.toISOString().split('T')[0];
    });

    let endStocks = stocks.filter(stock => {
      const stockDate = new Date(stock.created_at);
      return stockDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0];
    });

    // Apply optional filters
    if (ticker) {
      startStocks = startStocks.filter(stock => stock.ticker === ticker);
      endStocks = endStocks.filter(stock => stock.ticker === ticker);
    }

    if (source) {
      startStocks = startStocks.filter(stock => stock.source === source);
      endStocks = endStocks.filter(stock => stock.source === source);
    }

    if (guru) {
      startStocks = startStocks.filter(stock => stock.guru === guru);
      endStocks = endStocks.filter(stock => stock.guru === guru);
    }

    // Create a map of tickers from start date
    const startStocksMap = new Map();
    startStocks.forEach(stock => {
      startStocksMap.set(stock.ticker, stock);
    });

    // Calculate changes
    const changes = endStocks
      .filter(endStock => startStocksMap.has(endStock.ticker))
      .map(endStock => {
        const startStock = startStocksMap.get(endStock.ticker);
        const startValue = startStock[metric as keyof typeof startStock] as number;
        const endValue = endStock[metric as keyof typeof endStock] as number;
        
        // Calculate percentage change
        const change = endValue - startValue;
        const changePercent = startValue !== 0 ? (change / startValue) * 100 : 0;
        
        return {
          ticker: endStock.ticker,
          source: endStock.source,
          guru: endStock.guru,
          metric,
          start_value: startValue,
          end_value: endValue,
          change_percent: parseFloat(changePercent.toFixed(2)),
          change: parseFloat(change.toFixed(2)),
          status: 'complete'
        };
      })
      // Filter by threshold
      .filter(change => Math.abs(change.change_percent) >= threshold);

    // Sort by change percentage (descending)
    changes.sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent));

    return NextResponse.json(changes);
  } catch (error) {
    console.error('Error fetching stock changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock changes' },
      { status: 500 }
    );
  }
}
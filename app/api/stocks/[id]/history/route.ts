import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';
import { Stock } from '@/app/lib/definitions';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

// Generate historical data for a stock
function generateStockHistory(stockId: string, fromDate?: string, toDate?: string): Stock[] {
  // Find the base stock
  const baseStock = stocks.find(s => s.id === stockId);
  
  if (!baseStock) {
    return [];
  }
  
  // Find all stocks with the same ticker, source, and guru (if present)
  // This simulates historical data for the stock
  const similarStocks = stocks.filter(s => 
    s.ticker === baseStock.ticker && 
    s.source === baseStock.source &&
    s.guru === baseStock.guru
  );
  
  // If we don't have enough similar stocks, generate more data points
  let history: Stock[] = [...similarStocks];
  
  // If we need more data points, generate them
  if (history.length < 5) {
    const today = new Date();
    let startDate = new Date();
    startDate.setDate(today.getDate() - 30); // Default to 30 days ago
    
    // If fromDate is provided, use it as the start date
    if (fromDate) {
      const parsedFromDate = new Date(fromDate);
      if (!isNaN(parsedFromDate.getTime())) {
        startDate = parsedFromDate;
      }
    }
    
    // If toDate is provided, use it as the end date
    let endDate = today;
    if (toDate) {
      const parsedToDate = new Date(toDate);
      if (!isNaN(parsedToDate.getTime())) {
        endDate = parsedToDate;
      }
    }
    
    // Generate one data point per day
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip if we already have a data point for this date
      if (history.some(s => new Date(s.created_at || s.date || new Date().toISOString()).toDateString() === date.toDateString())) {
        continue;
      }
      
      // Create a copy of the base stock with modified values
      const dayOffset = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const randomFactor = Math.sin(dayOffset * 0.3) * 0.1 + Math.random() * 0.05;
      
      // Generate a unique ID for this historical record
      const historyId = `${baseStock.id}_${date.toISOString().split('T')[0]}`;
      
      // Calculate values based on the base stock with some variation
      const pe = Number((baseStock.pe * (1 + randomFactor * 0.2)).toFixed(1));
      const dividend = Math.random() < 0.7 ? `${(Math.random() * 2).toFixed(2)}%` : null;
      const cash_per_share = `${(Math.random() * 5 + 1).toFixed(2)}`;
      const current_ratio = Number((1 + Math.random() * 0.5).toFixed(2));
      const sentiment_score = Math.floor(baseStock.sentiment_score * 100);
      const signal_score = Math.floor(baseStock.signal_score * 100);
      const buy_price_value = Number((baseStock.buy_price * (1 + randomFactor * 0.1)).toFixed(2));
      
      // Create the historical stock record
      const historicalStock: Stock = {
        id: historyId,
        date: new Date(date).toISOString(),
        ticker: baseStock.ticker,
        source: baseStock.source,
        pe: pe,
        dividend: dividend,
        cash_per_share: cash_per_share,
        current_ratio: current_ratio,
        signal_score: signal_score,
        sentiment_score: sentiment_score,
        screenshot: baseStock.screenshot || `https://example.com/screenshots/${baseStock.ticker.toLowerCase()}_${date.toISOString().split('T')[0]}.png`,
        guru: baseStock.guru,
        rule1_score: baseStock.source === 'rule1' ? Math.floor(Math.random() * 100) : null,
        moat_score: Math.random() < 0.5 ? Math.floor(Math.random() * 100) : null,
        management_score: Math.random() < 0.5 ? Math.floor(Math.random() * 100) : null,
        buy_price: buy_price_value,
        highlight: baseStock.highlight,
        created_at: new Date(date).toISOString(),
        updated_at: new Date(date).toISOString()
      };
      
      history.push(historicalStock);
    }
  }
  
  // Filter by date range if provided
  if (fromDate) {
    const fromDateTime = new Date(fromDate).getTime();
    history = history.filter(stock => 
      new Date(stock.created_at || stock.date || new Date().toISOString()).getTime() >= fromDateTime
    );
  }
  
  if (toDate) {
    const toDateTime = new Date(toDate);
    toDateTime.setHours(23, 59, 59, 999); // End of the day
    history = history.filter(stock => 
      new Date(stock.created_at || stock.date || new Date().toISOString()).getTime() <= toDateTime.getTime()
    );
  }
  
  // Sort by date in ascending order
  history.sort((a, b) => 
    new Date(a.created_at || a.date || new Date().toISOString()).getTime() - new Date(b.created_at || b.date || new Date().toISOString()).getTime()
  );
  
  return history;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID format
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { message: "Invalid ID format" },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    
    // Get optional date range parameters
    const fromDate = searchParams.get('from') || undefined;
    const toDate = searchParams.get('to') || undefined;
    
    // Check if the stock exists
    const stock = stocks.find(s => s.id === id);
    
    if (!stock) {
      return NextResponse.json(
        { message: "Stock not found" },
        { status: 404 }
      );
    }
    
    // Generate historical data for the stock
    const history = generateStockHistory(id, fromDate, toDate);
    
    // Check if we have any history
    if (history.length === 0) {
      return NextResponse.json(
        { message: "No history available for this stock" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching stock history:', error);
    return NextResponse.json(
      { message: "Failed to fetch stock history" },
      { status: 500 }
    );
  }
}
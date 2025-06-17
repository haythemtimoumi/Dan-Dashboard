import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    // Find stock by string ID since our data uses string IDs
    const stock = stocks.find(s => s.id === id);
    
    if (!stock) {
      console.warn(`Stock with ID ${id} not found`);
      return NextResponse.json(
        { error: `The stock with ID ${id} could not be found.` },
        { status: 404 }
      );
    }
    
    // Format the stock data to match the frontend's expected format
    const formattedStock = {
      ...stock,
      // Convert ID to number for frontend compatibility
      id: parseInt(stock.id, 10),
      // Add missing fields with default values if they don't exist
      date: stock.date || stock.created_at || new Date().toISOString(),
      dividend: stock.dividend || '0.0%',
      cash_per_share: stock.cash_per_share || '$0.00',
      current_ratio: stock.current_ratio || 0,
      // Convert buy_price from number to string with $ symbol
      buy_price: typeof stock.buy_price === 'number' ? `$${stock.buy_price.toFixed(2)}` : stock.buy_price,
      // Add optional scores with null as default
      rule1_score: stock.rule1_score !== undefined ? stock.rule1_score : null,
      moat_score: stock.moat_score !== undefined ? stock.moat_score : null,
      management_score: stock.management_score !== undefined ? stock.management_score : null
    };
    
    return NextResponse.json(formattedStock);
  } catch (error) {
    console.error('Error fetching stock by ID:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    );
  }
}
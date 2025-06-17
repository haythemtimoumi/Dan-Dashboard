import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export async function GET() {
  try {
    console.log(`API returning ${stocks.length} stocks`);
    return NextResponse.json(stocks);
  } catch (error) {
    console.error('Error fetching all stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
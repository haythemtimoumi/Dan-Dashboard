import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export async function GET() {
  try {
    // For demonstration purposes, we'll consider:
    // - current: all stocks
    // - new: the 3 most recently created stocks
    // - removed: an empty array (no stocks removed)
    
    const sortedByDate = [...stocks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const dailyChanges = {
      current: stocks,
      new: sortedByDate.slice(0, 3),
      removed: []
    };
    
    return NextResponse.json(dailyChanges);
  } catch (error) {
    console.error('Error fetching daily changes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily changes' },
      { status: 500 }
    );
  }
}
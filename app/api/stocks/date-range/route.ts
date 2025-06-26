import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required parameters' },
        { status: 400 }
      );
    }

    // Parse dates (supports both MM/DD/YYYY and YYYY-MM-DD formats)
    const parseDate = (dateString: string) => {
      // Check if the date is in YYYY-MM-DD format
      if (dateString.includes('-')) {
        return new Date(dateString);
      }
      
      // Otherwise, assume MM/DD/YYYY format
      const [month, day, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day); // Month is 0-indexed in JS Date
    };

    try {
      const start = parseDate(startDate);
      const end = parseDate(endDate);
      
      // Validate that the dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new Error('Invalid date');
      }
      
      // Add one day to end date to include the full end date
      end.setDate(end.getDate() + 1);

      // Filter stocks by date range
      const filteredStocks = stocks.filter(stock => {
        const stockDate = new Date(stock.created_at);
        return stockDate >= start && stockDate < end;
      });

      // Sort by created_at in descending order
      filteredStocks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Helper function to format date string to MM/DD/YYYY
      const formatDateString = (dateStr: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${month}/${day}/${year}`;
      };
      
      // Make sure each stock has a properly formatted date field
      const processedStocks = filteredStocks.map(stock => ({
        ...stock,
        // If date field doesn't exist, create it from created_at
        date: stock.date || formatDateString(stock.created_at)
      }));

      return NextResponse.json(processedStocks);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching stocks by date range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks by date range' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

// Add export config to mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Filter stocks based on the highlight property
    let highlightedStocks = stocks.filter(stock => stock.highlight === true);
    
    // Apply date filters if provided
    if (startDate && endDate) {
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
        
        // Create UTC dates at noon to avoid timezone day shifting
        const startUTC = new Date(Date.UTC(
          start.getFullYear(), 
          start.getMonth(), 
          start.getDate(), 
          12, 0, 0
        ));
        
        const endUTC = new Date(Date.UTC(
          end.getFullYear(), 
          end.getMonth(), 
          end.getDate() - 1, // Adjust because we added a day to end
          12, 0, 0
        ));
        
        // Get dates in YYYY-MM-DD format
        const startDateStr = startUTC.toISOString().split('T')[0];
        const endDateStr = endUTC.toISOString().split('T')[0];
        
        // Filter by date range
        highlightedStocks = highlightedStocks.filter(stock => {
          // Get stock date in UTC at noon
          const stockDate = new Date(stock.created_at);
          const stockUTC = new Date(Date.UTC(
            stockDate.getFullYear(),
            stockDate.getMonth(),
            stockDate.getDate(),
            12, 0, 0
          ));
          
          // Get stock date in YYYY-MM-DD format
          const stockDateStr = stockUTC.toISOString().split('T')[0];
          
          // Compare dates as strings in YYYY-MM-DD format
          return stockDateStr >= startDateStr && stockDateStr <= endDateStr;
        });
      } catch (error) {
        console.error('Error parsing dates:', error);
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
          { status: 400 }
        );
      }
    }
    
    // Sort by sentiment score in descending order
    highlightedStocks.sort((a, b) => b.sentiment_score - a.sentiment_score);
    
    // Helper function to format date string to MM/DD/YYYY
    // Uses local date parts to avoid timezone shifts
    const formatDateString = (dateStr: string): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      // Use local date parts to avoid timezone shifts
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    };
    
    // Make sure each stock has a properly formatted date field
    const processedStocks = highlightedStocks.map(stock => ({
      ...stock,
      // If date field doesn't exist, create it from created_at
      date: stock.date || formatDateString(stock.created_at)
    }));
    
    if (processedStocks.length === 0) {
      console.warn('No highlighted stocks found for the specified date range');
      // Return an empty array with 200 status instead of an error
      return NextResponse.json([], { status: 200 });
    }
    
    return NextResponse.json(processedStocks);
  } catch (error) {
    console.error('Error fetching highlighted stocks by date range:', error);
    return NextResponse.json(
      { error: 'Failed to fetch highlighted stocks by date range' },
      { status: 500 }
    );
  }
}
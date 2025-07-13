import { NextResponse } from 'next/server';
import { stocks } from '@/app/lib/stock-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Filter stocks based on highlight = true AND source = 'manual'
    let portfolioStocks = stocks.filter(stock => 
      stock.highlight === true && stock.source === 'manual'
    );
    
    // Apply date filters if provided
    if (startDate && endDate) {
      const parseDate = (dateString: string) => {
        if (dateString.includes('-')) {
          return new Date(dateString);
        }
        const [month, day, year] = dateString.split('/').map(Number);
        return new Date(year, month - 1, day);
      };

      try {
        const start = parseDate(startDate);
        const end = parseDate(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new Error('Invalid date');
        }
        
        end.setDate(end.getDate() + 1);
        
        portfolioStocks = portfolioStocks.filter(stock => {
          const stockDate = new Date(stock.created_at);
          return stockDate >= start && stockDate < end;
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
    portfolioStocks.sort((a, b) => b.sentiment_score - a.sentiment_score);
    
    const formatDateString = (dateStr: string): string => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    };
    
    const processedStocks = portfolioStocks.map(stock => ({
      ...stock,
      date: stock.date || formatDateString(stock.created_at)
    }));
    
    return NextResponse.json(processedStocks);
  } catch (error) {
    console.error('Error fetching portfolio stocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio stocks' },
      { status: 500 }
    );
  }
}
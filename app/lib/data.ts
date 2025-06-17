import { unstable_noStore as noStore } from 'next/cache';
import { 
  Stock, 
  StocksTable, 
  LatestStock, 
  StockForm, 
  DailyChanges, 
  StockStats 
} from './definitions';

// For Next.js, we need to use relative URLs for API calls to ensure they work
// regardless of which port the app is running on
// We need to ensure the API URL is properly formatted for fetch calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Log the API URL for debugging
console.log(`Using API URL: ${API_URL}`);

export async function fetchStockStats(): Promise<StockStats> {
  noStore();
  try {
    // Fetch all stocks
    const allStocksResponse = await fetch(`${API_URL}/stocks`);
    
    if (!allStocksResponse.ok) {
      throw new Error(`Failed to fetch stocks: ${allStocksResponse.statusText}`);
    }
    
    const allStocks: Stock[] = await allStocksResponse.json();
    
    // Calculate stats
    const totalStocks = allStocks.length;
    // Count highlighted stocks based on API criteria: sentiment_score > 60 AND signal_score > 80
    const highlightedStocks = allStocks.filter(stock => 
      stock.sentiment_score > 60 && stock.signal_score > 80
    ).length;
    const rule1Stocks = allStocks.filter(stock => stock.source === 'Rule1').length;
    const magicFormulaStocks = allStocks.filter(stock => stock.source === 'MagicFormula').length;
    
    return {
      totalStocks,
      highlightedStocks,
      rule1Stocks,
      magicFormulaStocks
    };
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stock statistics.');
  }
}

export async function fetchLatestStocks(): Promise<LatestStock[]> {
  noStore();
  try {
    // Fetch sorted stocks with highlight flag
    const response = await fetch(`${API_URL}/stocks/sorted`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sorted stocks: ${response.statusText}`);
    }
    
    const stocks: Stock[] = await response.json();
    
    // Return the top 5 stocks
    return stocks.slice(0, 5).map(stock => ({
      id: stock.id,
      ticker: stock.ticker,
      sentiment_score: stock.sentiment_score,
      highlight: stock.highlight
    }));
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch latest stocks.');
  }
}

export async function fetchDailyChanges(): Promise<DailyChanges> {
  noStore();
  try {
    const response = await fetch(`${API_URL}/stocks/daily-changes`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch daily changes: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch daily stock changes.');
  }
}

const ITEMS_PER_PAGE = 10;

export async function fetchFilteredStocks(
  query: string,
  currentPage: number,
  source: string = '',
  minSentiment: string = '',
  maxPE: string = '',
  startDate: string = '',
  endDate: string = '',
  sortBy: string = 'sentiment_score',
  sortOrder: string = 'desc'
): Promise<StocksTable[]> {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  
  try {
    // Fetch all stocks first
    const response = await fetch(`${API_URL}/stocks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks: ${response.statusText}`);
    }
    
    const allStocks: Stock[] = await response.json();
    
    // Apply all filters
    let filteredStocks = allStocks;
    
    // Filter by search query
    if (query) {
      filteredStocks = filteredStocks.filter(stock => 
        stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
        stock.guru.toLowerCase().includes(query.toLowerCase()) ||
        stock.source.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by source
    if (source) {
      filteredStocks = filteredStocks.filter(stock => 
        stock.source === source
      );
    }
    
    // Filter by minimum sentiment score
    if (minSentiment) {
      const minScore = parseInt(minSentiment);
      filteredStocks = filteredStocks.filter(stock => 
        stock.sentiment_score >= minScore
      );
    }
    
    // Filter by maximum PE ratio
    if (maxPE) {
      const maxPERatio = parseInt(maxPE);
      filteredStocks = filteredStocks.filter(stock => 
        stock.pe <= maxPERatio
      );
    }
    
    // Filter by date range
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() >= startDateTime
      );
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() < endDateTime.getTime()
      );
    }
    
    // Sort results
    filteredStocks.sort((a, b) => {
      // Handle different data types for sorting
      let valueA = a[sortBy as keyof Stock];
      let valueB = b[sortBy as keyof Stock];
      
      // For numeric values
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // For string values
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Default case
      return 0;
    });
    
    // Paginate results
    return filteredStocks.slice(offset, offset + ITEMS_PER_PAGE);
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch filtered stocks.');
  }
}

export async function fetchStocksPages(
  query: string,
  source: string = '',
  minSentiment: string = '',
  maxPE: string = '',
  startDate: string = '',
  endDate: string = ''
): Promise<number> {
  noStore();
  try {
    // Fetch all stocks
    const response = await fetch(`${API_URL}/stocks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks: ${response.statusText}`);
    }
    
    const allStocks: Stock[] = await response.json();
    
    // Apply all filters
    let filteredStocks = allStocks;
    
    // Filter by search query
    if (query) {
      filteredStocks = filteredStocks.filter(stock => 
        stock.ticker.toLowerCase().includes(query.toLowerCase()) ||
        stock.guru.toLowerCase().includes(query.toLowerCase()) ||
        stock.source.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Filter by source
    if (source) {
      filteredStocks = filteredStocks.filter(stock => 
        stock.source === source
      );
    }
    
    // Filter by minimum sentiment score
    if (minSentiment) {
      const minScore = parseInt(minSentiment);
      filteredStocks = filteredStocks.filter(stock => 
        stock.sentiment_score >= minScore
      );
    }
    
    // Filter by maximum PE ratio
    if (maxPE) {
      const maxPERatio = parseInt(maxPE);
      filteredStocks = filteredStocks.filter(stock => 
        stock.pe <= maxPERatio
      );
    }
    
    // Filter by date range
    if (startDate) {
      const startDateTime = new Date(startDate).getTime();
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() >= startDateTime
      );
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() < endDateTime.getTime()
      );
    }
    
    // Calculate total pages
    return Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to calculate stock pages.');
  }
}

export async function fetchHighlightedStocks(): Promise<StocksTable[]> {
  noStore();
  try {
    // Fetch highlighted stocks directly from the API
    const response = await fetch(`${API_URL}/stocks/highlighted`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch highlighted stocks: ${response.statusText}`);
    }
    
    const highlightedStocks: Stock[] = await response.json();
    
    // Return the highlighted stocks directly
    return highlightedStocks;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch highlighted stocks.');
  }
}

export async function fetchStocksBySource(source: 'Rule1' | 'MagicFormula'): Promise<StocksTable[]> {
  noStore();
  try {
    // Get current date in MM/DD/YYYY format
    const today = new Date();
    const formattedDate = `${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getDate().toString().padStart(2,'0')}/${today.getFullYear()}`;
    
    // Use the filter-by-date-source endpoint with today's date
    const url = new URL(`${API_URL}/stocks/filter-by-date-source`);
    url.searchParams.append('date', formattedDate);
    url.searchParams.append('source', source);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stocks by source.');
  }
}
// In lib/data.ts
export async function fetchStocksByDate(date: string = ''): Promise<Stock[]> {
  noStore();
  try {
    const url = new URL(`${API_URL}/stocks/filter-by-date`);
    
    // Format date as MM/DD/YYYY
    const formattedDate = date 
      ? `${(new Date(date).getMonth()+1).toString().padStart(2,'0')}/${new Date(date).getDate().toString().padStart(2,'0')}/${new Date(date).getFullYear()}`
      : `${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getDate().toString().padStart(2,'0')}/${new Date().getFullYear()}`;
    
    url.searchParams.append('date', formattedDate);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Fetch Error:', error);
    throw new Error(`Failed to load stocks`);
  }
}
export async function fetchStocksByDateAndSource(
  date: string, 
  source: 'Rule1' | 'MagicFormula'
): Promise<Stock[]> {
  noStore();
  try {
    // Convert date from MM/DD/YYYY to YYYY-MM-DD format
    const [month, day, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    
    const response = await fetch(
      `http://localhost:3000/api/stocks/filter-by-date-source?date=${encodeURIComponent(date)}&source=${source}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source} stocks: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response:', data); // Debug log
    
    // Transform date format to match frontend expectations if needed
    return data.map((stock: any) => ({
      ...stock,
      date: new Date(stock.date).toLocaleDateString('en-US') // Format as MM/DD/YYYY
    }));
  } catch (error) {
    console.error(`API Error fetching ${source} stocks:`, error);
    return [];
  }
}

export async function fetchStockById(id: string): Promise<Stock | null> {
  noStore();
  try {
    // Use the configured API_URL instead of hardcoded URL
    const response = await fetch(`${API_URL}/stocks/${id}`);
    
    if (response.status === 404) {
      console.warn(`Stock with ID ${id} not found`);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stock.');
  }
}

export async function fetchStockByTicker(ticker: string): Promise<Stock[]> {
  noStore();
  try {
    const response = await fetch(`${API_URL}/stocks/ticker/${ticker}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock by ticker: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stock by ticker.');
  }
}

export async function fetchStocksForChart(): Promise<Stock[]> {
  noStore();
  try {
    // Fetch all stocks directly from the API
    // Use the correct API endpoint format with /api path
    const response = await fetch(`${API_URL}/stocks`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks: ${response.statusText}`);
    }
    
    const allStocks: Stock[] = await response.json();
    
    // Log the number of stocks received for debugging
    console.log(`Fetched ${allStocks.length} stocks for chart`);
    
    // Sort by sentiment score and return
    return allStocks.sort((a, b) => b.sentiment_score - a.sentiment_score);
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stocks for chart.');
  }
}

export async function fetchStocksByDateRange(
  startDate: string,
  endDate: string
): Promise<Stock[]> {
  noStore();
  try {
    // Format: MM/DD/YYYY for the legacy API
    
    // Ensure dates are in MM/DD/YYYY format for the legacy API
    let formattedStartDate = startDate;
    if (startDate.includes('-')) {
      // Convert from YYYY-MM-DD to MM/DD/YYYY
      const [year, month, day] = startDate.split('-');
      formattedStartDate = `${month}/${day}/${year}`;
    }
    
    // Add one day to end date to include all records for that day
    let endDateObj;
    if (endDate.includes('/')) {
      // MM/DD/YYYY format
      const [month, day, year] = endDate.split('/').map(Number);
      endDateObj = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format
      endDateObj = new Date(endDate);
    }
    
    // Add one day to end date
    endDateObj.setDate(endDateObj.getDate() + 1);
    
    // Format the adjusted end date in MM/DD/YYYY format for legacy API
    const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(endDateObj.getDate()).padStart(2, '0');
    const year = endDateObj.getFullYear();
    const formattedEndDate = `${month}/${day}/${year}`;
    
    // Use the specific URL for the legacy API
    const response = await fetch(`http://localhost:3001/api/stocks/date-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stocks by date range: ${response.statusText}`);
    }
    
    const stocks: Stock[] = await response.json();
    return stocks;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stocks by date range.');
  }
}

export async function fetchHighlightedStocksByDateRange(
  startDate: string,
  endDate: string
): Promise<Stock[]> {
  noStore();
  try {
    // Format: YYYY-MM-DD for the new API
    
    // Add one day to end date to include all records for that day
    let endDateObj;
    if (endDate.includes('/')) {
      // MM/DD/YYYY format
      const [month, day, year] = endDate.split('/').map(Number);
      endDateObj = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format
      endDateObj = new Date(endDate);
    }
    
    // Add one day to end date
    endDateObj.setDate(endDateObj.getDate() + 1);
    
    // Format the adjusted end date
    let adjustedEndDate;
    if (endDate.includes('/')) {
      // Keep MM/DD/YYYY format
      const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(endDateObj.getDate()).padStart(2, '0');
      const year = endDateObj.getFullYear();
      adjustedEndDate = `${month}/${day}/${year}`;
    } else {
      // Keep YYYY-MM-DD format
      adjustedEndDate = endDateObj.toISOString().split('T')[0];
    }
    
    const response = await fetch(`${API_URL}/stocks/highlighted/filter?startDate=${startDate}&endDate=${adjustedEndDate}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch highlighted stocks by date range: ${response.statusText}`);
    }
    
    const stocks: Stock[] = await response.json();
    return stocks;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch highlighted stocks by date range.');
  }
}

export async function fetchStockHistory(
  id: string,
  fromDate?: string,
  toDate?: string
): Promise<Stock[]> {
  noStore();
  try {
    // Build the URL with optional query parameters
    // Use the API_URL constant for consistency
    let url = `${API_URL}/stocks/${id}/history`;
    
    // Add date range parameters if provided
    const params = new URLSearchParams();
    if (fromDate) {
      params.append('from', fromDate);
    }
    if (toDate) {
      params.append('to', toDate);
    }
    
    // Append parameters to URL if any exist
    const queryString = params.toString();
    if (queryString) {
      url = `${url}?${queryString}`;
    }
    
    console.log(`Fetching stock history from: ${url}`);
    const response = await fetch(url);
    
    if (response.status === 404) {
      console.warn(`Stock history for ID ${id} not found`);
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stock history: ${response.statusText}`);
    }
    
    const stockHistory: Stock[] = await response.json();
    
    // Sort the history by date (created_at)
    return stockHistory.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  } catch (error) {
    console.error('API Error:', error);
    throw new Error('Failed to fetch stock history.');
  }
}
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

// In development, use the direct API URL
// In production, use our proxy API to avoid mixed content issues
const isProduction = process.env.NODE_ENV === 'production';
const directApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://dan-dashboard-chi.vercel.app/');

// In production, we'll use our proxy API route
const API_URL = isProduction ? '/api/proxy' : directApiUrl;

// Function to create API URLs based on environment
function createApiUrl(path: string, params?: Record<string, string>) {
  const base = isProduction 
    ? 'http://localhost:3000' 
    : directApiUrl;

  // Ensure path starts with /api
  const fullPath = path.startsWith('/api') ? path : `/api${path}`;

  // Construct full absolute URL safely
  const url = new URL(`${base}${fullPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}



// Log the API URL for debugging
console.log(`Using API URL: ${isProduction ? 'Proxy API' : API_URL}`);

export async function fetchStockStats(): Promise<StockStats> {
  noStore();
  try {
    // Fetch all stocks
    const allStocksResponse = await fetch(createApiUrl('/stocks'));
    
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
    const rule1Stocks = allStocks.filter(stock => stock.source === 'rule1').length;
    const magicFormulaStocks = allStocks.filter(stock => stock.source === 'manual').length;
    
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
    const response = await fetch(createApiUrl('/stocks/sorted'));
    
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
    const response = await fetch(createApiUrl('/stocks/daily-changes'));
    
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
    const response = await fetch(createApiUrl('/stocks'));
    
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
      // Set to end of the selected day (23:59:59.999)
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() <= endDateTime.getTime()
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
    const response = await fetch(createApiUrl('/stocks'));
    
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
      // Set to end of the selected day (23:59:59.999)
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filteredStocks = filteredStocks.filter(stock => 
        new Date(stock.created_at).getTime() <= endDateTime.getTime()
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
    const response = await fetch(createApiUrl('/stocks/highlighted'));
    
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

export async function fetchStocksBySource(source: 'rule1' | 'manual'): Promise<StocksTable[]> {
  noStore();
  try {
    // Get current date in MM/DD/YYYY format
    const today = new Date();
    const formattedDate = `${(today.getMonth()+1).toString().padStart(2,'0')}/${today.getDate().toString().padStart(2,'0')}/${today.getFullYear()}`;
    
    // Use our createApiUrl function with parameters
    const params: Record<string, string> = {
      'date': formattedDate,
      'source': source
    };
    
    const response = await fetch(createApiUrl('/stocks/filter-by-date-source', params));
    
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
    // Format date as MM/DD/YYYY
    const formattedDate = date 
      ? `${(new Date(date).getMonth()+1).toString().padStart(2,'0')}/${new Date(date).getDate().toString().padStart(2,'0')}/${new Date(date).getFullYear()}`
      : `${(new Date().getMonth()+1).toString().padStart(2,'0')}/${new Date().getDate().toString().padStart(2,'0')}/${new Date().getFullYear()}`;
    
    // Use our createApiUrl function with parameters
    const params: Record<string, string> = {
      'date': formattedDate
    };
    
    const response = await fetch(createApiUrl('/stocks/filter-by-date', params));
    
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
  source: 'rule1' | 'manual'
): Promise<Stock[]> {
  noStore();
  try {
    // Use our createApiUrl function with parameters
    const params: Record<string, string> = {
      'date': date,
      'source': source
    };
    
    const response = await fetch(createApiUrl('/stocks/filter-by-date-source', params));
    
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
    // Use the createApiUrl function for proper URL handling
    const response = await fetch(createApiUrl(`/stocks/${id}`));
    
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
    const response = await fetch(createApiUrl(`/stocks/ticker/${ticker}`));
    
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
    // Fetch all stocks using the createApiUrl function for proper URL handling
    const response = await fetch(createApiUrl('/stocks'));
    
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
  startDate?: string,
  endDate?: string
): Promise<Stock[]> {
  noStore();
  try {
    // Format: MM/DD/YYYY for the legacy API
    
    // If no dates provided, use current date
    const today = new Date();
    const formattedToday = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;
    
    // Ensure dates are in MM/DD/YYYY format for the legacy API
    let formattedStartDate = startDate || formattedToday;
    if (formattedStartDate.includes('-')) {
      // Convert from YYYY-MM-DD to MM/DD/YYYY
      const [year, month, day] = formattedStartDate.split('-');
      formattedStartDate = `${month}/${day}/${year}`;
    }
    
    // Add one day to end date to include all records for that day
    let endDateObj;
    const endDateValue = endDate || formattedToday;
    if (endDateValue.includes('/')) {
      // MM/DD/YYYY format
      const [month, day, year] = endDateValue.split('/').map(Number);
      endDateObj = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format
      endDateObj = new Date(endDateValue);
    }
    
    // Add one day to end date
    endDateObj.setDate(endDateObj.getDate() + 1);
    
    // Format the adjusted end date in MM/DD/YYYY format for legacy API
    const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(endDateObj.getDate()).padStart(2, '0');
    const year = endDateObj.getFullYear();
    const formattedEndDate = `${month}/${day}/${year}`;
    
    // Use createApiUrl with parameters
    const params: Record<string, string> = {
      'startDate': formattedStartDate,
      'endDate': formattedEndDate
    };
    
    const response = await fetch(createApiUrl('/stocks/date-range', params));
    
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
  startDate?: string,
  endDate?: string
): Promise<Stock[]> {
  noStore();
  try {
    // Format: YYYY-MM-DD for the new API
    
    // If no dates provided, use current date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const formattedTodaySlash = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`; // MM/DD/YYYY format
    
    // Add one day to end date to include all records for that day
    let endDateObj;
    const endDateValue = endDate || (endDate?.includes('/') ? formattedTodaySlash : formattedToday);
    
    if (endDateValue.includes('/')) {
      // MM/DD/YYYY format
      const [month, day, year] = endDateValue.split('/').map(Number);
      endDateObj = new Date(year, month - 1, day);
    } else {
      // YYYY-MM-DD format
      endDateObj = new Date(endDateValue);
    }
    
    // Add one day to end date
    endDateObj.setDate(endDateObj.getDate() + 1);
    
    // Format the adjusted end date
    let adjustedEndDate;
    if (endDateValue.includes('/')) {
      // Keep MM/DD/YYYY format
      const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(endDateObj.getDate()).padStart(2, '0');
      const year = endDateObj.getFullYear();
      adjustedEndDate = `${month}/${day}/${year}`;
    } else {
      // Keep YYYY-MM-DD format
      adjustedEndDate = endDateObj.toISOString().split('T')[0];
    }
    
    // Use the same format as the input for startDate or default to today
    const formattedStartDate = startDate || (endDateValue.includes('/') ? formattedTodaySlash : formattedToday);
    
    const response = await fetch(`${API_URL}/stocks/highlighted/filter?startDate=${formattedStartDate}&endDate=${adjustedEndDate}`);
    
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
export async function fetchRecentChangesAll(
  metric: string,
  startDate: string,
  endDate: string,
  threshold: number = 5
): Promise<StockChange[]> {
  noStore();
  try {
    const params: Record<string, string> = {
      metric,
      start_date: startDate,
      end_date: endDate,
      threshold: threshold.toString()
    };

    const response = await fetch(createApiUrl('/stocks/recent-changes/all', params));

    if (!response.ok) {
      throw new Error(`Failed to fetch recent changes (all): ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('fetchRecentChangesAll failed:', error);
    throw new Error('Failed to fetch recent stock changes (all).');
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
    // Use the createApiUrl function for proper URL handling
    const params: Record<string, string> = {};
    if (fromDate) {
      params['from'] = fromDate;
    }
    if (toDate) {
      params['to'] = toDate;
    }
    
    const response = await fetch(createApiUrl(`/stocks/${id}/history`, params));
    
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

// Define the type for stock changes
export type StockChange = {
  ticker: string;
  source: string;
  guru: string;
  metric: string;
  start_value: number;
  end_value: number;
  change_percent: number;
  change: number;
  status: string;
};

export async function fetchRecentChanges(
  metric: string,
  startDate: string,
  endDate: string,
  threshold: number = 5,
  ticker?: string,
  source?: string,
  guru?: string
): Promise<StockChange[]> {
  noStore();
  try {
    const params: Record<string, string> = {
      metric,
      start_date: startDate,
      end_date: endDate,
      threshold: threshold.toString()
    };

    if (ticker) params['ticker'] = ticker;
    if (source) params['source'] = source;
    if (guru) params['guru'] = guru;

    const response = await fetch(createApiUrl('/stocks/recent-changes', params));

    // New: verify content-type
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType?.includes('application/json')) {
      const text = await response.text();
      console.error('Unexpected API response:', text);
      throw new Error('API response is not valid JSON.');
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error('Expected array but got:', data);
      throw new Error('Unexpected API response format');
    }

    return data;
  } catch (error) {
    console.error('fetchRecentChanges failed:', error);
    throw new Error('Failed to fetch recent stock changes.');
  }
}

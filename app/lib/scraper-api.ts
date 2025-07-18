const SCRAPER_API_URL = 'https://scraperbackend.freeddns.org';

export interface ScraperStatus {
  is_running: boolean;
  last_run: string | null;
  next_run: string;
  next_run_in: string;
  can_update_tickers: boolean;
  // Add computed property for backward compatibility
  status?: 'running' | 'idle' | 'ready';
}

export interface TickerResponse {
  tickers: string[];
  count: number;
}

// Mock data for when API is unavailable
const mockStatus: ScraperStatus = {
  is_running: false,
  next_run_in: '18:57:11',
  next_run: '2025-07-18T20:05:00Z',
  last_run: '2025-07-16T00:00:00Z',
  can_update_tickers: true,
  status: 'idle',
};

const mockTickers: TickerResponse = {
  tickers: [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC',
    'CRM', 'ADBE', 'PYPL', 'SHOP', 'SQ', 'ROKU', 'ZM', 'DOCU', 'TWLO', 'OKTA',
    'SNOW', 'PLTR', 'CRWD', 'NET', 'DDOG', 'MDB', 'FSLY', 'ESTC', 'TEAM', 'ATLASSIAN',
    'UBER', 'LYFT', 'ABNB', 'DASH', 'COIN', 'HOOD', 'SOFI', 'UPST', 'AFRM', 'OPEN',
    'RBLX', 'U', 'PINS', 'SNAP', 'TWTR', 'SPOT', 'MTCH', 'BMBL', 'YELP', 'GRUB',
    'ETSY', 'EBAY', 'AMZN', 'WMT', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'LULU',
    'SBUX', 'MCD', 'CMG', 'DPZ', 'YUM', 'QSR', 'DNKN', 'PZZA', 'WING', 'TXRH',
    'DIS', 'CMCSA', 'T', 'VZ', 'TMUS', 'S', 'CHTR', 'DISH', 'SIRI', 'LBRDK',
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'AXP', 'V', 'MA', 'PYPL',
    'JNJ', 'PFE', 'ABBV', 'MRK', 'BMY', 'GILD', 'AMGN', 'BIIB', 'REGN', 'VRTX',
    'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'HAL', 'BKR', 'OXY', 'DVN', 'FANG',
    'BA', 'CAT', 'DE', 'MMM', 'GE', 'HON', 'UTX', 'LMT', 'NOC', 'RTX',
    'TSLA', 'F', 'GM', 'FCAU', 'TM', 'HMC', 'NSANY', 'BMWYY', 'VWAGY', 'RACE',
    'KO', 'PEP', 'MDLZ', 'KHC', 'GIS', 'K', 'CPB', 'HSY', 'SJM', 'CAG',
    'PG', 'UL', 'CL', 'KMB', 'CHD', 'CLX', 'EL', 'COTY', 'REV', 'IFF'
  ],
  count: 150,
}

export const scraperApi = {
  async getStatus(): Promise<ScraperStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SCRAPER_API_URL}/scraper-status`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache', // Don't use old cached responses
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      console.warn('Scraper API unavailable, using mock data:', error);
      return mockStatus;
    }
  },
  
  async reloadScraperState(): Promise<ScraperStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use cache-busting headers but no query parameters
      const response = await fetch(`${SCRAPER_API_URL}/scraper-status`, {
        signal: controller.signal,
        headers: { 
          'Accept': 'application/json',
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          // Add a random header to bust any cache
          'X-Cache-Bust': new Date().getTime().toString()
        },
        cache: 'no-store', // Force a fresh request
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      console.warn('Failed to reload scraper state:', error);
      throw new Error('API unavailable - please try again later');
    }
  },

  async getTickers(): Promise<TickerResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SCRAPER_API_URL}/get-tickers`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    } catch (error) {
      console.warn('Scraper API unavailable, using mock data:', error);
      return mockTickers;
    }
  },

  async updateTickers(tickers: string[]): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${SCRAPER_API_URL}/update-tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn('Failed to update tickers via API:', error);
      throw new Error('API unavailable - please try again later');
    }
  },
};
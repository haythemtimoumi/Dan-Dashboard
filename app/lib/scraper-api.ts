const SCRAPER_API_URL = 'https://scraperbackend.freeddns.org';

export interface ScraperStatus {
  is_running: boolean;
  last_run: string | null;
  next_scheduled_run: string;
  next_run_in_hours_minutes: string;
  can_update_tickers: boolean;
  // Add computed property for backward compatibility
  status?: 'running' | 'idle' | 'ready';
}

export interface TickerResponse {
  tickers: Array<{source: string, ticker: string}> | string[];
  count: number;
}

export interface SourceTickersRequest {
  source: string;
  tickers: string[];
}

export interface DeleteTickerRequest {
  source: string;
  ticker: string;
}

// Mock data for when API is unavailable
const mockStatus: ScraperStatus = {
  is_running: false,
  next_run_in_hours_minutes: '17h:24m',
  next_scheduled_run: '2025-07-19 20:05:00',
  last_run: '2025-07-18 22:03:45',
  can_update_tickers: true,
  status: 'idle',
};

const mockTickers: TickerResponse = {
  tickers: [
    { source: 'manual', ticker: 'AAPL' },
    { source: 'manual', ticker: 'GOOGL' },
    { source: 'manual', ticker: 'MSFT' },
    { source: 'guru_list', ticker: 'TSLA' },
    { source: 'guru_list', ticker: 'NVDA' },
    { source: 'guru_list', ticker: 'AMZN' },
    { source: 'target', ticker: 'META' },
    { source: 'target', ticker: 'NFLX' },
    { source: 'monitor', ticker: 'AMD' },
    { source: 'monitor', ticker: 'INTC' }
  ],
  count: 10
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
      
      // Use standard cache-busting approach
      const cacheBuster = `?_=${new Date().getTime()}`;
      const response = await fetch(`${SCRAPER_API_URL}/scraper-status${cacheBuster}`, {
        signal: controller.signal,
        headers: { 
          'Accept': 'application/json'
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
  
  async updateSourceTickers(source: string, tickers: string[]): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${SCRAPER_API_URL}/update-source-tickers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, tickers }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn('Failed to update source tickers via API:', error);
      throw new Error('API unavailable - please try again later');
    }
  },
  
  async deleteTicker(source: string, ticker: string): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${SCRAPER_API_URL}/delete-ticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, ticker }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      console.warn('Failed to delete ticker via API:', error);
      throw new Error('API unavailable - please try again later');
    }
  },
};
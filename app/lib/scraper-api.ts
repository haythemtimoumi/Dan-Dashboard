const SCRAPER_API_URL = 'http://162.248.100.66:5000';

export interface ScraperStatus {
  status: 'running' | 'idle' | 'ready';
  is_running: boolean;
  next_run_in_hours: number;
  last_run: string | null;
  can_update_tickers: boolean;
}

export interface TickerResponse {
  tickers: string[];
  count: number;
}

export const scraperApi = {
  async getStatus(): Promise<ScraperStatus> {
    const response = await fetch(`${SCRAPER_API_URL}/scraper-status`);
    if (!response.ok) throw new Error('Failed to fetch scraper status');
    return response.json();
  },

  async getTickers(): Promise<TickerResponse> {
    const response = await fetch(`${SCRAPER_API_URL}/get-tickers`);
    if (!response.ok) throw new Error('Failed to fetch tickers');
    return response.json();
  },

  async updateTickers(tickers: string[]): Promise<void> {
    const response = await fetch(`${SCRAPER_API_URL}/update-tickers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tickers }),
    });
    if (!response.ok) throw new Error('Failed to update tickers');
  },
};
import { fetchStockHistory } from '../data';
import { Stock } from '../definitions';

// Mock the fetch function
global.fetch = jest.fn();

// Mock console.error to avoid cluttering test output
console.error = jest.fn();

// Mock console.log to avoid cluttering test output
console.log = jest.fn();

// Mock console.warn to avoid cluttering test output
console.warn = jest.fn();

describe('fetchStockHistory', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // Set the environment variable for testing
    process.env.NEXT_PUBLIC_API_URL = 'https://stocksapidashboard.duckdns.org/api';
  });

  it('should fetch stock history with the correct URL', async () => {
    // Mock successful response
    const mockStockHistory: Stock[] = [
      {
        id: '1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        price: 150.0,
        change: 2.5,
        percent_change: 1.7,
        volume: 1000000,
        market_cap: 2500000000000,
        created_at: '2023-01-01T12:00:00Z',
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStockHistory,
    });

    const result = await fetchStockHistory('1');

    // Verify the URL used in the fetch call
    expect(fetch).toHaveBeenCalledWith('https://stocksapidashboard.duckdns.org/api/stocks/1/history');
    expect(result).toEqual(mockStockHistory);
  });

  it('should include from and to parameters when provided', async () => {
    // Mock successful response
    const mockStockHistory: Stock[] = [
      {
        id: '1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        price: 150.0,
        change: 2.5,
        percent_change: 1.7,
        volume: 1000000,
        market_cap: 2500000000000,
        created_at: '2023-01-01T12:00:00Z',
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStockHistory,
    });

    const fromDate = '2023-01-01';
    const toDate = '2023-01-31';
    
    await fetchStockHistory('1', fromDate, toDate);

    // Verify the URL includes the query parameters
    expect(fetch).toHaveBeenCalledWith(
      `https://stocksapidashboard.duckdns.org/api/stocks/1/history?from=${fromDate}&to=${toDate}`
    );
  });

  it('should return empty array when stock history is not found (404)', async () => {
    // Mock 404 response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const result = await fetchStockHistory('999');

    // Verify the URL used in the fetch call
    expect(fetch).toHaveBeenCalledWith('https://stocksapidashboard.duckdns.org/api/stocks/999/history');
    
    // Should return empty array
    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(fetchStockHistory('999')).rejects.toThrow('Failed to fetch stock history.');
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchStockHistory('1')).rejects.toThrow('Failed to fetch stock history.');
    expect(console.error).toHaveBeenCalled();
  });

  it('should use the default URL when environment variable is not set', async () => {
    // Clear the environment variable
    delete process.env.NEXT_PUBLIC_API_URL;
    
    // Mock successful response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    await fetchStockHistory('1');

    // Verify the default URL is used
    expect(fetch).toHaveBeenCalledWith('https://stocksapidashboard.duckdns.org/api/stocks/1/history');
  });
});
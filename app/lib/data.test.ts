import { fetchStocksForChart, fetchHighlightedStocks, fetchStocksByDateRange, fetchHighlightedStocksByDateRange } from './data';
import { stocks } from './stock-data';

// Mock the fetch function
global.fetch = jest.fn();

describe('fetchStocksForChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all stocks and sort them by sentiment score', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => stocks,
    });

    // Call the function
    const result = await fetchStocksForChart();

    // Verify that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/stocks'));

    // Verify that all stocks are returned
    expect(result.length).toBe(stocks.length);

    // Verify that stocks are sorted by sentiment score in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].sentiment_score).toBeGreaterThanOrEqual(result[i + 1].sentiment_score);
    }
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    // Call the function and expect it to throw an error
    await expect(fetchStocksForChart()).rejects.toThrow('Failed to fetch stocks for chart.');

    // Verify that fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('fetchHighlightedStocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch highlighted stocks from the API', async () => {
    // Create mock highlighted stocks
    const mockHighlightedStocks = [
      { id: '1', ticker: 'AAPL', highlight: true, sentiment_score: 0.9 },
      { id: '2', ticker: 'MSFT', highlight: true, sentiment_score: 0.8 }
    ];

    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });

    // Call the function
    const result = await fetchHighlightedStocks();

    // Verify that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/stocks/highlighted'));

    // Verify that highlighted stocks are returned
    expect(result).toEqual(mockHighlightedStocks);
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    // Call the function and expect it to throw an error
    await expect(fetchHighlightedStocks()).rejects.toThrow('Failed to fetch highlighted stocks.');

    // Verify that fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });
});
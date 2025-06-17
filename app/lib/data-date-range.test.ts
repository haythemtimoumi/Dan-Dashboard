import { fetchStocksByDateRange, fetchHighlightedStocksByDateRange } from './data';
import { stocks } from './stock-data';

// Mock the fetch function
global.fetch = jest.fn();

describe('fetchStocksByDateRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use legacy API format (MM/DD/YYYY) when fetching stocks by date range', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => stocks,
    });

    // Call the function with MM/DD/YYYY format
    await fetchStocksByDateRange('01/01/2023', '12/31/2023');

    // Verify that fetch was called with the correct URL and MM/DD/YYYY format
    // End date should be 01/01/2024 (one day after 12/31/2023)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://162.248.100.66:3001/api/stocks/date-range?startDate=01/01/2023&endDate=01/01/2024'
    );
  });

  it('should convert YYYY-MM-DD format to MM/DD/YYYY for legacy API compatibility', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => stocks,
    });

    // Call the function with YYYY-MM-DD format
    await fetchStocksByDateRange('2023-01-01', '2023-12-31');

    // Verify that fetch was called with the correct URL and MM/DD/YYYY format
    // End date should be 01/01/2024 (one day after 12/31/2023)
    expect(global.fetch).toHaveBeenCalledWith(
      'http://162.248.100.66:3001/api/stocks/date-range?startDate=01/01/2023&endDate=01/01/2024'
    );
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    // Call the function and expect it to throw an error
    await expect(fetchStocksByDateRange('2023-01-01', '2023-12-31')).rejects.toThrow('Failed to fetch stocks by date range.');

    // Verify that fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });
});

describe('fetchHighlightedStocksByDateRange', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add one day to end date when fetching highlighted stocks by date range (MM/DD/YYYY format)', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => stocks.filter(stock => stock.highlight),
    });

    // Call the function with MM/DD/YYYY format
    await fetchHighlightedStocksByDateRange('01/01/2023', '12/31/2023');

    // Verify that fetch was called with the correct URL
    // End date should be 01/01/2024 (one day after 12/31/2023)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stocks/highlighted/filter?startDate=01/01/2023&endDate=01/01/2024')
    );
  });

  it('should add one day to end date when fetching highlighted stocks by date range (YYYY-MM-DD format)', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => stocks.filter(stock => stock.highlight),
    });

    // Call the function with YYYY-MM-DD format
    await fetchHighlightedStocksByDateRange('2023-01-01', '2023-12-31');

    // Verify that fetch was called with the correct URL
    // End date should be 2024-01-01 (one day after 2023-12-31)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/stocks/highlighted/filter?startDate=2023-01-01&endDate=2024-01-01')
    );
  });

  it('should handle API errors gracefully', async () => {
    // Mock a failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    });

    // Call the function and expect it to throw an error
    await expect(fetchHighlightedStocksByDateRange('2023-01-01', '2023-12-31')).rejects.toThrow('Failed to fetch highlighted stocks by date range.');

    // Verify that fetch was called
    expect(global.fetch).toHaveBeenCalled();
  });
});
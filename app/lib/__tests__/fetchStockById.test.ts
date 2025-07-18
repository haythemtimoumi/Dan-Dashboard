import { fetchStockById } from '../data';

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'https://www.mytickerlist.com/api';

// Mock the fetch function
global.fetch = jest.fn();

describe('fetchStockById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch a stock by ID using the configured API_URL', async () => {
    // Mock stock data
    const mockStock = {
      id: '123',
      ticker: 'AAPL',
      sentiment_score: 0.85,
      signal_score: 0.78,
      pe: 28.5,
      buy_price: 150,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-06-20T14:30:00Z'
    };

    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockStock,
    });

    // Call the function
    const result = await fetchStockById('123');

    // Verify that fetch was called with the correct URL using the API_URL
    expect(global.fetch).toHaveBeenCalledWith('https://www.mytickerlist.com/api/stocks/123');

    // Verify that the correct stock is returned
    expect(result).toEqual(mockStock);
  });

  it('should return null when stock is not found (404)', async () => {
    // Mock a 404 response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    // Call the function
    const result = await fetchStockById('999');

    // Verify that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('https://www.mytickerlist.com/api/stocks/999');

    // Verify that null is returned
    expect(result).toBeNull();
  });

  it('should handle other API errors gracefully', async () => {
    // Mock a failed fetch response (not 404)
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Call the function and expect it to throw an error
    await expect(fetchStockById('999')).rejects.toThrow('Failed to fetch stock.');

    // Verify that fetch was called with the correct URL using the API_URL
    expect(global.fetch).toHaveBeenCalledWith('https://www.mytickerlist.com/api/stocks/999');
  });
});
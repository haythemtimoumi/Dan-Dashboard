import { fetchStocksBySource } from '../data';

// Mock the fetch function
global.fetch = jest.fn();

// Mock the unstable_noStore function
jest.mock('next/cache', () => ({
  unstable_noStore: jest.fn(),
}));

describe('fetchStocksBySource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    console.error = jest.fn();
  });

  it('should fetch stocks using the correct API endpoint', async () => {
    // Mock successful API response
    const mockStocks = [
      {
        id: '1',
        ticker: 'AAPL',
        sentiment_score: 0.85,
        signal_score: 0.78,
        pe: 28.5,
        buy_price: 150.00,
        guru: 'Warren Buffett',
        source: 'Rule1',
        highlight: true,
        created_at: '2023-06-15T12:00:00Z',
        updated_at: '2023-06-15T12:00:00Z'
      }
    ];

    // Setup the fetch mock with content-type header
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      },
      json: jest.fn().mockResolvedValueOnce(mockStocks)
    });

    // Call the function with Rule1 source
    const result = await fetchStocksBySource('Rule1');

    // Verify the fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      'https://stocksapidashboard.duckdns.org/api/stocks/source/Rule1'
    );

    // Verify the result contains the expected data
    expect(result).toEqual(mockStocks);
    expect(result.length).toBe(1);
    expect(result[0].ticker).toBe('AAPL');
  });

  it('should return an empty array when the API returns an error', async () => {
    // Mock failed API response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    // Call the function
    const result = await fetchStocksBySource('MagicFormula');

    // Verify the result is an empty array
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should return an empty array when the API throws an exception', async () => {
    // Mock fetch to throw an error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));

    // Call the function
    const result = await fetchStocksBySource('Rule1');

    // Verify the result is an empty array
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle non-JSON content type responses', async () => {
    // Mock API response with HTML content type
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('text/html')
      }
    });

    // Call the function
    const result = await fetchStocksBySource('Rule1');

    // Verify the result is an empty array
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });

  it('should handle JSON parsing errors', async () => {
    // Mock API response with JSON content type but invalid JSON
    global.fetch.mockResolvedValueOnce({
      ok: true,
      headers: {
        get: jest.fn().mockReturnValue('application/json')
      },
      json: jest.fn().mockRejectedValueOnce(new Error('Invalid JSON'))
    });

    // Call the function
    const result = await fetchStocksBySource('Rule1');

    // Verify the result is an empty array
    expect(result).toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});
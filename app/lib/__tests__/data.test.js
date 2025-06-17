/**
 * @jest-environment node
 */

import { 
  fetchStocksForChart, 
  fetchHighlightedStocks, 
  fetchFilteredStocks,
  fetchStocksPages,
  fetchStockById
} from '../data';

// Mock the fetch function
global.fetch = jest.fn();

describe('Data fetching functions', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('fetchStocksForChart makes request to the correct URL', async () => {
    // Mock the fetch response
    const mockStocks = [
      { id: '1', ticker: 'AAPL', sentiment_score: 0.8 },
      { id: '2', ticker: 'MSFT', sentiment_score: 0.7 }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStocks
    });

    // Call the function
    const result = await fetchStocksForChart();

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks`);
    
    // Check that the function returns the expected result
    expect(result).toEqual(mockStocks.sort((a, b) => b.sentiment_score - a.sentiment_score));
  });

  test('fetchStocksForChart handles errors correctly', async () => {
    // Mock a failed fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });

    // Call the function and expect it to throw
    await expect(fetchStocksForChart()).rejects.toThrow('Failed to fetch stocks for chart.');
  });

  test('fetchHighlightedStocks makes request to the correct URL', async () => {
    // Mock the fetch response
    const mockHighlightedStocks = [
      { id: '1', ticker: 'AAPL', highlight: true, sentiment_score: 0.9 },
      { id: '2', ticker: 'MSFT', highlight: true, sentiment_score: 0.8 }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks
    });

    // Call the function
    const result = await fetchHighlightedStocks();

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks/highlighted`);
    
    // Check that the function returns the expected result
    expect(result).toEqual(mockHighlightedStocks);
  });

  test('fetchHighlightedStocks handles errors correctly', async () => {
    // Mock a failed fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });

    // Call the function and expect it to throw
    await expect(fetchHighlightedStocks()).rejects.toThrow('Failed to fetch highlighted stocks.');
  });
  
  test('fetchFilteredStocks applies all filters correctly', async () => {
    // Mock the fetch response
    const mockAllStocks = [
      { id: '1', ticker: 'AAPL', sentiment_score: 80, signal_score: 90, pe: 25, buy_price: 150, guru: 'Warren', source: 'Rule 1', created_at: '2023-01-15T12:00:00Z' },
      { id: '2', ticker: 'MSFT', sentiment_score: 70, signal_score: 85, pe: 30, buy_price: 200, guru: 'Lynch', source: 'Magic Formula', created_at: '2023-02-20T12:00:00Z' },
      { id: '3', ticker: 'GOOG', sentiment_score: 60, signal_score: 75, pe: 35, buy_price: 250, guru: 'Buffett', source: 'Rule 1', created_at: '2023-03-25T12:00:00Z' },
      { id: '4', ticker: 'AMZN', sentiment_score: 50, signal_score: 65, pe: 40, buy_price: 300, guru: 'Graham', source: 'Magic Formula', created_at: '2023-04-30T12:00:00Z' }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAllStocks
    });

    // Call the function with filters
    const result = await fetchFilteredStocks(
      'A', // query (should match AAPL and AMZN)
      1,   // currentPage
      'Rule 1', // source
      '60',  // minSentiment
      '30',  // maxPE
      '2023-01-01', // startDate
      '2023-02-01', // endDate
      'sentiment_score', // sortBy
      'desc' // sortOrder
    );

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks`);
    
    // Only AAPL should match all filters including date range
    expect(result).toHaveLength(1);
    expect(result[0].ticker).toBe('AAPL');
  });
  
  test('fetchStocksPages calculates pages correctly with filters', async () => {
    // Mock the fetch response with 25 stocks (should be 3 pages with 10 per page)
    const mockAllStocks = Array.from({ length: 25 }, (_, i) => ({
      id: `${i+1}`,
      ticker: `STOCK${i+1}`,
      sentiment_score: i % 2 === 0 ? 80 : 40, // Even indices have high sentiment
      signal_score: 75,
      pe: i + 20, // PE ranges from 20 to 44
      buy_price: 100 + i * 10,
      guru: 'Test',
      source: i % 3 === 0 ? 'Rule 1' : 'Magic Formula', // Every 3rd is Rule 1
      created_at: `2023-0${(i % 6) + 1}-01T12:00:00Z` // Spread across 6 months
    }));
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAllStocks
    });

    // Call the function with filters that should match stocks in a specific date range
    const result = await fetchStocksPages(
      '', // no query
      'Rule 1', // source
      '70', // minSentiment
      '', // no maxPE
      '2023-01-01', // startDate
      '2023-03-31' // endDate (Q1 only)
    );

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks`);
    
    // Should filter to only Rule 1 stocks with high sentiment in Q1
    expect(result).toBeLessThanOrEqual(1); // Should be 1 page or less
  });
  
  test('fetchFilteredStocks filters by date range correctly', async () => {
    // Mock the fetch response with stocks across different dates
    const mockAllStocks = [
      { id: '1', ticker: 'AAPL', sentiment_score: 80, created_at: '2023-01-15T12:00:00Z' },
      { id: '2', ticker: 'MSFT', sentiment_score: 70, created_at: '2023-02-20T12:00:00Z' },
      { id: '3', ticker: 'GOOG', sentiment_score: 60, created_at: '2023-03-25T12:00:00Z' },
      { id: '4', ticker: 'AMZN', sentiment_score: 50, created_at: '2023-04-30T12:00:00Z' },
      { id: '5', ticker: 'META', sentiment_score: 75, created_at: '2023-05-15T12:00:00Z' },
      { id: '6', ticker: 'TSLA', sentiment_score: 85, created_at: '2023-06-20T12:00:00Z' }
    ];
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAllStocks
    });

    // Call the function with only date filters (Q2 2023)
    const result = await fetchFilteredStocks(
      '', // no query
      1,  // currentPage
      '', // no source filter
      '', // no minSentiment
      '', // no maxPE
      '2023-04-01', // startDate (Q2 start)
      '2023-06-30', // endDate (Q2 end)
      'sentiment_score', // sortBy
      'desc' // sortOrder
    );

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks`);
    
    // Should only include Q2 stocks (AMZN, META, TSLA)
    expect(result).toHaveLength(3);
    expect(result.map(stock => stock.ticker)).toEqual(['TSLA', 'META', 'AMZN']); // Sorted by sentiment desc
  });

  test('fetchStockById makes request to the correct URL', async () => {
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
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStock
    });

    // Call the function
    const result = await fetchStockById('123');

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks/123`);
    
    // Check that the function returns the expected result
    expect(result).toEqual(mockStock);
  });

  test('fetchStockById handles errors correctly', async () => {
    // Mock a failed fetch
    global.fetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found'
    });

    // Call the function and expect it to throw
    await expect(fetchStockById('999')).rejects.toThrow('Failed to fetch stock.');

    // Check that fetch was called with the correct URL
    const expectedUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    expect(global.fetch).toHaveBeenCalledWith(`${expectedUrl}/stocks/999`);
  });
});
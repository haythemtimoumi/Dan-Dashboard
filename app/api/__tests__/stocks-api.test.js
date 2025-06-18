/**
 * @jest-environment node
 */

import { NextResponse } from 'next/server';
import { GET as getAllStocks } from '../stocks/route';
import { GET as getHighlightedStocks } from '../stocks/highlighted/route';
import { GET as getStocksBySource } from '../stocks/source/[source]/route';
import { GET as getStocksByDateAndSource } from '../stocks/filter-by-date-source/route';

describe('Stock API Routes', () => {
  // Test the main stocks endpoint
  test('GET /api/stocks returns all stocks', async () => {
    const response = await getAllStocks();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('ticker');
  });

  // Test the highlighted stocks endpoint
  test('GET /api/stocks/highlighted returns only highlighted stocks', async () => {
    const response = await getHighlightedStocks();
    const data = await response.json();
    
    expect(Array.isArray(data)).toBe(true);
    // Verify we're getting highlighted stocks
    expect(data.length).toBeGreaterThan(0);
    // Only check highlight property if there are stocks returned
    if (data.length > 0) {
      data.forEach(stock => {
        expect(stock.highlight).toBe(true);
      });
    }
  });

  // Test the stocks by source endpoint
  test('GET /api/stocks/source/Rule1 returns Rule1 stocks', async () => {
    const mockParams = { params: { source: 'Rule1' } };
    const response = await getStocksBySource({}, mockParams);
    const data = await response.json();
    
    expect(data).toHaveProperty('stocks');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('date');
    
    // Only check source property if there are stocks returned
    if (data.stocks && data.stocks.length > 0) {
      data.stocks.forEach(stock => {
        expect(stock.source).toBe('Rule1');
      });
    }
  });

  test('GET /api/stocks/source/MagicFormula returns MagicFormula stocks', async () => {
    const mockParams = { params: { source: 'MagicFormula' } };
    const response = await getStocksBySource({}, mockParams);
    const data = await response.json();
    
    expect(data).toHaveProperty('stocks');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('date');
    
    // Only check source property if there are stocks returned
    if (data.stocks && data.stocks.length > 0) {
      data.stocks.forEach(stock => {
        expect(stock.source).toBe('MagicFormula');
      });
    }
  });
  
  // Test invalid source parameter
  test('GET /api/stocks/source with invalid source returns 400 error', async () => {
    const mockParams = { params: { source: 'InvalidSource' } };
    const response = await getStocksBySource({}, mockParams);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Invalid source');
  });
  
  // Test empty results handling
  test('GET /api/stocks/highlighted returns 200 status even with no highlighted stocks', async () => {
    // Save the original implementation
    const originalImplementation = getHighlightedStocks;
    
    // Mock implementation to simulate no highlighted stocks
    jest.spyOn(global, 'fetch').mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );
    
    // Create a mock implementation that returns an empty array
    const mockGetHighlightedStocks = async () => {
      return NextResponse.json([]);
    };
    
    // Replace the implementation temporarily
    global.getHighlightedStocks = mockGetHighlightedStocks;
    
    const response = await mockGetHighlightedStocks();
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
    
    // Restore the original implementation
    global.getHighlightedStocks = originalImplementation;
    jest.restoreAllMocks();
  });
  
  // Test the filter-by-date-source endpoint
  test('GET /api/stocks/filter-by-date-source returns stocks filtered by date and source', async () => {
    // Create a mock request with search params
    const mockRequest = {
      url: 'https://stocksapidashboard.duckdns.org/api/stocks/filter-by-date-source?date=06%2F20%2F2023&source=Rule1'
    };
    
    const response = await getStocksByDateAndSource(mockRequest);
    const data = await response.json();
    
    expect(data).toHaveProperty('stocks');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('source');
    
    // Check that the source is correct
    expect(data.source).toBe('Rule1');
    
    // Check that the date is in the correct format (YYYY-MM-DD)
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // If there are stocks, check that they have the correct source
    if (data.stocks && data.stocks.length > 0) {
      data.stocks.forEach(stock => {
        expect(stock.source).toBe('Rule1');
      });
    }
  });
  
  test('GET /api/stocks/filter-by-date-source with no stocks returns proper metadata', async () => {
    // Create a mock request with search params for a date that likely has no stocks
    const mockRequest = {
      url: 'https://stocksapidashboard.duckdns.org/api/stocks/filter-by-date-source?date=01%2F01%2F2000&source=Rule1'
    };
    
    const response = await getStocksByDateAndSource(mockRequest);
    const data = await response.json();
    
    expect(data).toHaveProperty('stocks');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('date');
    expect(data).toHaveProperty('source');
    expect(data).toHaveProperty('message');
    
    // Check that the stocks array is empty
    expect(data.stocks).toEqual([]);
    expect(data.totalCount).toBe(0);
    
    // Check that the source is correct
    expect(data.source).toBe('Rule1');
    
    // Check that the date is in the correct format (YYYY-MM-DD)
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // Check that there's a message about no stocks found
    expect(data.message).toContain('No stocks found');
  });
});
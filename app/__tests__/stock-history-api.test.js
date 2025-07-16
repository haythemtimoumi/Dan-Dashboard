import { GET, dynamic } from '../api/stocks/[id]/history/route';
import { NextResponse } from 'next/server';

// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('Stock History API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be configured as a dynamic route', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('should handle a valid stock ID', async () => {
    // Use a known valid stock ID (1 should exist in the mock data)
    const request = new Request('http://localhost:3000/api/stocks/1/history');
    const params = { id: '1' };
    
    const response = await GET(request, { params });
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
    
    // Check that the response data has the expected properties
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const firstItem = response.data[0];
      expect(firstItem).toHaveProperty('ticker');
      expect(firstItem).toHaveProperty('sentiment_score');
      expect(firstItem).toHaveProperty('signal_score');
      // Check for the newly added properties
      expect(firstItem).toHaveProperty('dividend');
      expect(firstItem).toHaveProperty('cash_per_share');
      expect(firstItem).toHaveProperty('current_ratio');
    }
  });

  it('should handle an invalid stock ID format', async () => {
    const request = new Request('http://localhost:3000/api/stocks/invalid/history');
    const params = { id: 'invalid' };
    
    const response = await GET(request, { params });
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Invalid ID format" },
      { status: 400 }
    );
  });

  it('should handle date filtering correctly', async () => {
    // Test with from and to date parameters
    const url = 'http://localhost:3000/api/stocks/1/history?from=2023-01-01&to=2023-12-31';
    const request = new Request(url);
    const params = { id: '1' };
    
    const response = await GET(request, { params });
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle a non-existent stock ID', async () => {
    // Use a stock ID that doesn't exist in the mock data
    const request = new Request('http://localhost:3000/api/stocks/9999/history');
    const params = { id: '9999' };
    
    const response = await GET(request, { params });
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { message: "Stock not found" },
      { status: 404 }
    );
  });
});
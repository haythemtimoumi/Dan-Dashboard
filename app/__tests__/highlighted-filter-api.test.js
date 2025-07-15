import { GET, dynamic } from '../api/stocks/highlighted/filter/route';
import { NextResponse } from 'next/server';

// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('Highlighted Stocks Filter API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be configured as a dynamic route', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('should work without date parameters', async () => {
    // Test without date parameters
    const request = new Request('http://locahost:3000/api/stocks/highlighted/filter');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle valid date parameters in MM/DD/YYYY format', async () => {
    // Test with valid date parameters
    const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=01/01/2023&endDate=12/31/2023');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle valid date parameters in YYYY-MM-DD format', async () => {
    // Test with valid date parameters
    const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=2023-01-01&endDate=2023-12-31');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle invalid date format', async () => {
    // Test with invalid date format
    const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=invalid&endDate=2023-12-31');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
      { status: 400 }
    );
  });

  it('should return empty array for no matching stocks', async () => {
    // Test with a date range that should return no stocks
    // Using a future date range that shouldn't have any stocks
    const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=2050-01-01&endDate=2050-12-31');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      [],
      { status: 200 }
    );
  });
});
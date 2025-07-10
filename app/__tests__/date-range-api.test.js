import { GET, dynamic } from '../api/stocks/date-range/route';
import { NextResponse } from 'next/server';

// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
  },
}));

describe('Date Range API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be configured as a dynamic route', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('should require startDate and endDate parameters', async () => {
    // Test with missing parameters
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'startDate and endDate are required parameters' },
      { status: 400 }
    );
  });

  it('should handle valid date parameters in MM/DD/YYYY format', async () => {
    // Test with valid date parameters
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=01/01/2023&endDate=12/31/2023');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle valid date parameters in YYYY-MM-DD format', async () => {
    // Test with valid date parameters
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=2023-01-01&endDate=2023-12-31');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalled();
    expect(response.options).toBeUndefined(); // No error status
  });

  it('should handle invalid date format', async () => {
    // Test with invalid date format
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=invalid&endDate=2023-12-31');
    
    const response = await GET(request);
    
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
      { status: 400 }
    );
  });
});
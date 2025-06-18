import { GET } from '../stocks/[id]/history/route';
import { NextRequest } from 'next/server';

// Mock the stocks data
jest.mock('@/app/lib/stock-data', () => ({
  stocks: [
    {
      id: '15289',
      ticker: 'NVAX',
      sentiment_score: 0.76,
      signal_score: 0.71,
      pe: 35.2,
      buy_price: 120.0,
      guru: 'Peter Lynch',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-03-10T09:45:00Z',
      updated_at: '2023-08-15T11:20:00Z',
    },
    {
      id: '1',
      ticker: 'AAPL',
      sentiment_score: 0.85,
      signal_score: 0.78,
      pe: 28.5,
      buy_price: 150.0,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-06-20T14:30:00Z',
    },
  ],
}));

describe('Stock History API', () => {
  it('should return 400 for invalid ID format', async () => {
    const request = new NextRequest(new URL('https://stocksapidashboard.duckdns.org/api/stocks/abc/history'));
    const response = await GET(request, { params: { id: 'abc' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.message).toBe('Invalid ID format');
  });
  
  it('should return 404 for non-existent stock', async () => {
    const request = new NextRequest(new URL('https://stocksapidashboard.duckdns.org/api/stocks/999/history'));
    const response = await GET(request, { params: { id: '999' } });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.message).toBe('Stock not found');
  });
  
  it('should return historical data for stock with ID 15289', async () => {
    const request = new NextRequest(new URL('https://stocksapidashboard.duckdns.org/api/stocks/15289/history'));
    const response = await GET(request, { params: { id: '15289' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Check that the response has the expected structure
    const firstItem = data[0];
    expect(firstItem).toHaveProperty('id');
    expect(firstItem).toHaveProperty('ticker', 'NVAX');
    expect(firstItem).toHaveProperty('date');
    expect(firstItem).toHaveProperty('pe');
    expect(firstItem).toHaveProperty('sentiment_score');
    expect(firstItem).toHaveProperty('signal_score');
    expect(firstItem).toHaveProperty('buy_price');
  });
  
  it('should respect date range parameters', async () => {
    const fromDate = '2023-01-01';
    const toDate = '2023-01-05';
    const url = `https://stocksapidashboard.duckdns.org/api/stocks/1/history?from=${fromDate}&to=${toDate}`;
    const request = new NextRequest(new URL(url));
    const response = await GET(request, { params: { id: '1' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    
    // Check that all dates are within the specified range
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999); // End of the day
    
    data.forEach(item => {
      const itemDate = new Date(item.date || item.created_at);
      expect(itemDate >= startDate && itemDate <= endDate).toBe(true);
    });
  });
});
import { GET as getStocksByDateRange } from '../stocks/date-range/route';
import { stocks } from '@/app/lib/stock-data';

// Mock the stock data to include future dates
jest.mock('@/app/lib/stock-data', () => ({
  stocks: [
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
    {
      id: '11',
      ticker: 'FUTURE_STOCK',
      sentiment_score: 0.95,
      signal_score: 0.92,
      pe: 30.5,
      buy_price: 200.0,
      guru: 'Future Guru',
      source: 'Rule 1',
      highlight: true,
      created_at: '2025-06-15T12:00:00Z', // Future date within the requested range
      updated_at: '2025-06-15T14:30:00Z',
    },
  ],
}));

// Mock the NextResponse
const mockJson = jest.fn();
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, options?: any) => {
      mockJson(data, options);
      return { data, options };
    },
  },
}));

describe('Future Date Range API Tests', () => {
  beforeEach(() => {
    mockJson.mockClear();
  });

  it('should return stocks for future date range (06/06/2025 to 07/06/2025)', async () => {
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=06/06/2025&endDate=07/06/2025');
    await getStocksByDateRange(request);
    
    expect(mockJson).toHaveBeenCalled();
    const data = mockJson.mock.calls[0][0];
    expect(data).toHaveLength(1);
    expect(data[0].ticker).toBe('FUTURE_STOCK');
    expect(data[0].created_at).toBe('2025-06-15T12:00:00Z');
  });

  it('should return empty array for future date range with no stocks', async () => {
    const request = new Request('https://stockdashboard.ddnsfree.com/api/stocks/date-range?startDate=08/01/2025&endDate=09/01/2025');
    await getStocksByDateRange(request);
    
    expect(mockJson).toHaveBeenCalled();
    const data = mockJson.mock.calls[0][0];
    expect(data).toHaveLength(0);
  });
});
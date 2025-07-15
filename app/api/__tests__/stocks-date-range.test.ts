import { GET as getStocksByDateRange } from '../stocks/date-range/route';
import { GET as getHighlightedStocksByDateRange } from '../stocks/highlighted/filter/route';
import { stocks } from '@/app/lib/stock-data';

// Mock the stock data
jest.mock('@/app/lib/stock-data', () => ({
  stocks: [
    {
      id: '1',
      ticker: 'AAPL',
      sentiment_score: 85,
      signal_score: 90,
      pe: 25,
      buy_price: 150,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-01-15T12:00:00Z',
    },
    {
      id: '2',
      ticker: 'MSFT',
      sentiment_score: 75,
      signal_score: 80,
      pe: 30,
      buy_price: 250,
      guru: 'Peter Lynch',
      source: 'Magic Formula',
      highlight: true,
      created_at: '2023-06-20T12:00:00Z',
      updated_at: '2023-06-20T12:00:00Z',
    },
    {
      id: '3',
      ticker: 'GOOGL',
      sentiment_score: 70,
      signal_score: 75,
      pe: 28,
      buy_price: 2000,
      guru: 'Charlie Munger',
      source: 'Rule 1',
      highlight: false,
      created_at: '2023-12-10T12:00:00Z',
      updated_at: '2023-12-10T12:00:00Z',
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

describe('Stocks Date Range API', () => {
  beforeEach(() => {
    mockJson.mockClear();
  });

  describe('GET /api/stocks/date-range', () => {
    it('should return 400 if startDate or endDate is missing', async () => {
      const request = new Request('http://locahost:3000/api/stocks/date-range');
      await getStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'startDate and endDate are required parameters' },
        { status: 400 }
      );
    });

    it('should return stocks filtered by date range with MM/DD/YYYY format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/date-range?startDate=01/01/2023&endDate=06/30/2023');
      await getStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalled();
      const data = mockJson.mock.calls[0][0];
      expect(data).toHaveLength(1);
      expect(data[0].ticker).toBe('AAPL');
    });

    it('should return stocks filtered by date range with YYYY-MM-DD format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/date-range?startDate=2023-01-01&endDate=2023-06-30');
      await getStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalled();
      const data = mockJson.mock.calls[0][0];
      expect(data).toHaveLength(1);
      expect(data[0].ticker).toBe('AAPL');
    });

    it('should return 400 for invalid date format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/date-range?startDate=invalid&endDate=invalid');
      await getStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
        { status: 400 }
      );
    });
  });

  describe('GET /api/stocks/highlighted/filter', () => {
    it('should return all highlighted stocks if no date range is provided', async () => {
      const request = new Request('http://locahost:3000/api/stocks/highlighted/filter');
      await getHighlightedStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalled();
      const data = mockJson.mock.calls[0][0];
      expect(data).toHaveLength(2);
      expect(data.every((stock: any) => stock.highlight)).toBe(true);
    });

    it('should return highlighted stocks filtered by date range with YYYY-MM-DD format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=2023-01-01&endDate=2023-03-01');
      await getHighlightedStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalled();
      const data = mockJson.mock.calls[0][0];
      expect(data).toHaveLength(1);
      expect(data[0].ticker).toBe('AAPL');
      expect(data[0].highlight).toBe(true);
    });

    it('should return highlighted stocks filtered by date range with MM/DD/YYYY format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=01/01/2023&endDate=03/01/2023');
      await getHighlightedStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalled();
      const data = mockJson.mock.calls[0][0];
      expect(data).toHaveLength(1);
      expect(data[0].ticker).toBe('AAPL');
      expect(data[0].highlight).toBe(true);
    });

    it('should return empty array if no highlighted stocks in date range', async () => {
      const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=2024-01-01&endDate=2024-03-01');
      await getHighlightedStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalledWith([], { status: 200 });
    });

    it('should return 400 for invalid date format', async () => {
      const request = new Request('http://locahost:3000/api/stocks/highlighted/filter?startDate=invalid&endDate=invalid');
      await getHighlightedStocksByDateRange(request);
      
      expect(mockJson).toHaveBeenCalledWith(
        { error: 'Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY' },
        { status: 400 }
      );
    });
  });
});
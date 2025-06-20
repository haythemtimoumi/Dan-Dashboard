// Mock the NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: async () => data,
      status: options?.status || 200,
    })),
  },
}));

// Mock the stock data
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
      source: 'Rule1',
      highlight: true,
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-06-20T14:30:00Z',
      date: '2023-06-20T14:30:00Z',
    },
    {
      id: '2',
      ticker: 'AAPL',
      sentiment_score: 0.90,
      signal_score: 0.82,
      pe: 30.0,
      buy_price: 155.0,
      guru: 'Warren Buffett',
      source: 'Rule1',
      highlight: true,
      created_at: '2023-01-20T12:00:00Z',
      updated_at: '2023-06-25T14:30:00Z',
      date: '2023-06-25T14:30:00Z',
    },
    {
      id: '3',
      ticker: 'MSFT',
      sentiment_score: 0.75,
      signal_score: 0.70,
      pe: 25.0,
      buy_price: 280.0,
      guru: 'Bill Gates',
      source: 'MagicFormula',
      highlight: true,
      created_at: '2023-01-15T12:00:00Z',
      updated_at: '2023-06-20T14:30:00Z',
      date: '2023-06-20T14:30:00Z',
    },
    {
      id: '4',
      ticker: 'MSFT',
      sentiment_score: 0.80,
      signal_score: 0.75,
      pe: 26.0,
      buy_price: 285.0,
      guru: 'Bill Gates',
      source: 'MagicFormula',
      highlight: true,
      created_at: '2023-01-20T12:00:00Z',
      updated_at: '2023-06-25T14:30:00Z',
      date: '2023-06-25T14:30:00Z',
    },
  ],
}));

// Import the handler function directly
import { GET } from '../stocks/recent-changes/route';

describe('Recent Changes API', () => {
  // Helper function to create a mock request with search params
  function createMockRequest(params: Record<string, string>): Request {
    const url = new URL('https://example.com/api/stocks/recent-changes');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return {
      url: url.toString(),
    } as unknown as Request;
  }

  it('should return 400 if required parameters are missing', async () => {
    const req = createMockRequest({});
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('required parameters');
  });

  it('should return 400 if metric is invalid', async () => {
    const req = createMockRequest({
      metric: 'invalid_metric',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toContain('metric must be one of');
  });

  it('should calculate changes correctly for sentiment_score', async () => {
    const req = createMockRequest({
      metric: 'sentiment_score',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
      threshold: '1',
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(2); // AAPL and MSFT
    
    // Check AAPL change
    const aaplChange = data.find((item: any) => item.ticker === 'AAPL');
    expect(aaplChange).toBeDefined();
    expect(aaplChange.start_value).toBe(0.85);
    expect(aaplChange.end_value).toBe(0.9);
    expect(aaplChange.change_percent).toBe(5.88); // (0.9 - 0.85) / 0.85 * 100 = 5.88%
    
    // Check MSFT change
    const msftChange = data.find((item: any) => item.ticker === 'MSFT');
    expect(msftChange).toBeDefined();
    expect(msftChange.start_value).toBe(0.75);
    expect(msftChange.end_value).toBe(0.8);
    expect(msftChange.change_percent).toBe(6.67); // (0.8 - 0.75) / 0.75 * 100 = 6.67%
  });

  it('should filter by threshold correctly', async () => {
    const req = createMockRequest({
      metric: 'sentiment_score',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
      threshold: '6', // Only MSFT has a change >= 6%
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].ticker).toBe('MSFT');
  });

  it('should filter by ticker correctly', async () => {
    const req = createMockRequest({
      metric: 'sentiment_score',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
      threshold: '1',
      ticker: 'AAPL',
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].ticker).toBe('AAPL');
  });

  it('should filter by source correctly', async () => {
    const req = createMockRequest({
      metric: 'sentiment_score',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
      threshold: '1',
      source: 'MagicFormula',
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].source).toBe('MagicFormula');
  });

  it('should filter by guru correctly', async () => {
    const req = createMockRequest({
      metric: 'sentiment_score',
      start_date: '2023-01-15',
      end_date: '2023-01-20',
      threshold: '1',
      guru: 'Warren Buffett',
    });
    
    const response = await GET(req);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].guru).toBe('Warren Buffett');
  });
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import StockHistoryChart from '../stock-history-chart';
import { fetchStockHistory } from '@/app/lib/data';

// Mock the data module
jest.mock('@/app/lib/data', () => ({
  fetchStockHistory: jest.fn(),
}));

// Mock the chart.js and react-chartjs-2 modules
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-chart">Chart Component</div>,
}));

describe('StockHistoryChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading state initially', () => {
    (fetchStockHistory as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<StockHistoryChart stockId="1" />);
    
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  test('renders chart when data is available', async () => {
    const mockData = [
      {
        id: '1',
        ticker: 'AAPL',
        sentiment_score: 85,
        signal_score: 78,
        pe: 28.5,
        buy_price: 150,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: true,
        created_at: '2023-01-15T12:00:00Z',
        updated_at: '2023-06-20T14:30:00Z'
      },
      {
        id: '2',
        ticker: 'AAPL',
        sentiment_score: 87,
        signal_score: 80,
        pe: 29.1,
        buy_price: 155,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: true,
        created_at: '2023-01-16T12:00:00Z',
        updated_at: '2023-06-21T14:30:00Z'
      }
    ];
    
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockData);
    
    render(<StockHistoryChart stockId="1" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
  });

  test('renders no data message when history is empty', async () => {
    (fetchStockHistory as jest.Mock).mockResolvedValue([]);
    
    render(<StockHistoryChart stockId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('No data for this time range.')).toBeInTheDocument();
    });
  });

  test('renders error message when fetch fails', async () => {
    (fetchStockHistory as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<StockHistoryChart stockId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load stock history data. Please try again later.')).toBeInTheDocument();
    });
  });

  test('changes date range when filter button is clicked', async () => {
    const mockData = [
      {
        id: '1',
        ticker: 'AAPL',
        sentiment_score: 85,
        signal_score: 78,
        pe: 28.5,
        buy_price: 150,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: true,
        created_at: '2023-01-15T12:00:00Z',
        updated_at: '2023-06-20T14:30:00Z'
      }
    ];
    
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockData);
    
    render(<StockHistoryChart stockId="1" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
    
    // Default should be 1W
    expect(fetchStockHistory).toHaveBeenCalledWith(
      '1',
      expect.any(String), // from date (7 days ago)
      expect.any(String)  // to date (today)
    );
    
    // Click on 1M filter
    fireEvent.click(screen.getByText('1M'));
    
    // Should fetch with new date range
    await waitFor(() => {
      expect(fetchStockHistory).toHaveBeenCalledTimes(2);
    });
  });

  test('changes selected metric when dropdown is changed', async () => {
    const mockData = [
      {
        id: '1',
        ticker: 'AAPL',
        sentiment_score: 85,
        signal_score: 78,
        pe: 28.5,
        buy_price: 150,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: true,
        created_at: '2023-01-15T12:00:00Z',
        updated_at: '2023-06-20T14:30:00Z'
      }
    ];
    
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockData);
    
    render(<StockHistoryChart stockId="1" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });
    
    // Change metric to PE Ratio
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'pe' } });
    
    // Chart should update with new metric (no need to fetch new data)
    expect(fetchStockHistory).toHaveBeenCalledTimes(1);
  });
});
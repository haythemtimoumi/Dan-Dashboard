import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StockHistoryChart from '../dashboard/stock-history-chart';
import { fetchStockHistory } from '@/app/lib/data';

// Mock the data fetching function
jest.mock('@/app/lib/data', () => ({
  fetchStockHistory: jest.fn(),
}));

// Mock the Chart.js component
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="mock-line-chart">Mock Chart</div>,
}));

describe('StockHistoryChart', () => {
  const mockStockHistory = [
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
      updated_at: '2023-01-15T12:00:00Z',
    },
    {
      id: '2',
      ticker: 'AAPL',
      sentiment_score: 87,
      signal_score: 80,
      pe: 27.8,
      buy_price: 155,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-02-15T12:00:00Z',
      updated_at: '2023-02-15T12:00:00Z',
    },
    {
      id: '3',
      ticker: 'AAPL',
      sentiment_score: 90,
      signal_score: 82,
      pe: 26.5,
      buy_price: 160,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-03-15T12:00:00Z',
      updated_at: '2023-03-15T12:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockStockHistory);
  });

  it('should render loading state initially', () => {
    render(<StockHistoryChart stockId="123" />);
    expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
  });

  it('should render the chart after data is loaded', async () => {
    render(<StockHistoryChart stockId="123" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });
    
    // Check that the chart is rendered
    expect(screen.getByTestId('mock-line-chart')).toBeInTheDocument();
    
    // Check that the API was called with the correct parameters
    expect(fetchStockHistory).toHaveBeenCalledWith('123', expect.any(String));
  });

  it('should render empty state when no data is available', async () => {
    // Mock empty response
    (fetchStockHistory as jest.Mock).mockResolvedValue([]);
    
    render(<StockHistoryChart stockId="123" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });
    
    // Check that the empty state message is displayed
    expect(screen.getByText('No historical data available for this stock.')).toBeInTheDocument();
  });

  it('should render error state when API call fails', async () => {
    // Mock API error
    (fetchStockHistory as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    render(<StockHistoryChart stockId="123" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });
    
    // Check that the error message is displayed
    expect(screen.getByText('Failed to load stock history data. Please try again later.')).toBeInTheDocument();
  });

  it('should change metrics when selector is changed', async () => {
    render(<StockHistoryChart stockId="123" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });
    
    // Find the metric selector and change it
    const metricSelector = screen.getByRole('combobox');
    fireEvent.change(metricSelector, { target: { value: 'pe' } });
    
    // Check that the chart title reflects the new metric
    expect(screen.getByText('Stock Performance History')).toBeInTheDocument();
  });

  it('should change date range when a range button is clicked', async () => {
    render(<StockHistoryChart stockId="123" />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
    });
    
    // Find the 1M button and click it
    const oneMonthButton = screen.getByText('1M');
    fireEvent.click(oneMonthButton);
    
    // Check that the API was called again with the new date range
    expect(fetchStockHistory).toHaveBeenCalledTimes(2);
  });
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HighlightedStocks, { HighlightedStocksSkeleton } from '@/app/ui/stocks/highlighted-stocks';
import { Stock } from '@/app/lib/definitions';

// Mock fetch
global.fetch = jest.fn();

// Mock setInterval and clearInterval
jest.useFakeTimers();

const mockHighlightedStocks: Stock[] = [
  {
    id: '1',
    ticker: 'AAPL',
    sentiment_score: 85,
    signal_score: 78,
    pe: 28.5,
    buy_price: 150.0,
    guru: 'Warren Buffett',
    source: 'Rule 1',
    highlight: true,
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-06-20T14:30:00Z',
  },
  {
    id: '2',
    ticker: 'MSFT',
    sentiment_score: 92,
    signal_score: 85,
    pe: 32.1,
    buy_price: 280.0,
    guru: 'Bill Gates',
    source: 'Magic Formula',
    highlight: true,
    created_at: '2023-02-10T09:15:00Z',
    updated_at: '2023-07-05T11:45:00Z',
  }
];

describe('HighlightedStocks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('renders loading skeleton initially', () => {
    // Mock fetch to return a promise that doesn't resolve immediately
    (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<HighlightedStocks />);
    
    // Check if loading skeleton is displayed
    expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
  });

  it('renders highlighted stocks when data is loaded', async () => {
    // Mock successful fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    render(<HighlightedStocks />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
    });
    
    // Check if other data is displayed correctly
    expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
    expect(screen.getByText('Bill Gates')).toBeInTheDocument();
    expect(screen.getByText('Rule 1')).toBeInTheDocument();
    expect(screen.getByText('Magic Formula')).toBeInTheDocument();
  });

  it('renders error message when fetch fails', async () => {
    // Mock failed fetch
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<HighlightedStocks />);
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load highlighted stocks/)).toBeInTheDocument();
    });
  });

  it('renders empty state when no highlighted stocks are found', async () => {
    // Mock successful fetch but with empty array
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
    
    render(<HighlightedStocks />);
    
    // Wait for the empty state message to appear
    await waitFor(() => {
      expect(screen.getByText('No highlighted stocks found')).toBeInTheDocument();
    });
  });

  it('sorts stocks when sort button is clicked', async () => {
    // Mock successful fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    render(<HighlightedStocks />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Initial sort should be descending (MSFT first with 0.92 score)
    const rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('MSFT'); // First data row should be MSFT
    
    // Click sort button to change to ascending
    const sortButton = screen.getByText(/Sort by Sentiment/);
    fireEvent.click(sortButton);
    
    // Mock fetch for the re-sort
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    // Wait for re-render after sort
    await waitFor(() => {
      const updatedRows = screen.getAllByRole('row');
      // Now AAPL should be first with lower score (0.85)
      expect(updatedRows[1].textContent).toContain('AAPL');
    });
  });

  it('refreshes data at regular intervals', async () => {
    // Mock successful fetch for initial load
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    render(<HighlightedStocks />);
    
    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Mock fetch for the refresh
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          ...mockHighlightedStocks[0],
          sentiment_score: 95, // Updated score
        },
        mockHighlightedStocks[1],
      ],
    });
    
    // Fast-forward time to trigger the interval
    jest.advanceTimersByTime(60000);
    
    // Verify that fetch was called again
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('HighlightedStocksSkeleton', () => {
  it('renders correctly', () => {
    render(<HighlightedStocksSkeleton />);
    
    expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
    // Check for table headers
    expect(screen.getByText('Ticker')).toBeInTheDocument();
    expect(screen.getByText('Sentiment Score')).toBeInTheDocument();
    expect(screen.getByText('Signal Score')).toBeInTheDocument();
    expect(screen.getByText('PE')).toBeInTheDocument();
    expect(screen.getByText('Guru')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
  });
});
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HighlightedStocksExternal, { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';
import { Stock } from '@/app/lib/definitions';

// Mock fetch
global.fetch = jest.fn();

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock data with more than 5 items to test pagination
const mockHighlightedStocks: Stock[] = [
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
    id: '2',
    ticker: 'MSFT',
    sentiment_score: 0.92,
    signal_score: 0.85,
    pe: 32.1,
    buy_price: 280.0,
    guru: 'Bill Gates',
    source: 'Magic Formula',
    highlight: true,
    created_at: '2023-02-10T09:15:00Z',
    updated_at: '2023-07-05T11:45:00Z',
  },
  {
    id: '3',
    ticker: 'AMZN',
    sentiment_score: 0.88,
    signal_score: 0.82,
    pe: 30.5,
    buy_price: 120.0,
    guru: 'Jeff Bezos',
    source: 'Rule 1',
    highlight: true,
    created_at: '2023-03-15T10:00:00Z',
    updated_at: '2023-07-10T09:30:00Z',
  },
  {
    id: '4',
    ticker: 'GOOGL',
    sentiment_score: 0.90,
    signal_score: 0.84,
    pe: 29.8,
    buy_price: 135.0,
    guru: 'Larry Page',
    source: 'Magic Formula',
    highlight: true,
    created_at: '2023-04-05T14:20:00Z',
    updated_at: '2023-07-15T16:45:00Z',
  },
  {
    id: '5',
    ticker: 'TSLA',
    sentiment_score: 0.82,
    signal_score: 0.76,
    pe: 35.2,
    buy_price: 200.0,
    guru: 'Elon Musk',
    source: 'Rule 1',
    highlight: true,
    created_at: '2023-05-12T11:30:00Z',
    updated_at: '2023-07-20T13:15:00Z',
  },
  {
    id: '6',
    ticker: 'META',
    sentiment_score: 0.86,
    signal_score: 0.80,
    pe: 31.5,
    buy_price: 300.0,
    guru: 'Mark Zuckerberg',
    source: 'Magic Formula',
    highlight: true,
    created_at: '2023-06-08T09:45:00Z',
    updated_at: '2023-07-25T10:30:00Z',
  }
];

describe('HighlightedStocksExternal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    // Mock fetch to return a promise that doesn't resolve immediately
    (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => {}));
    
    render(<HighlightedStocksExternal />);
    
    // Check if loading skeleton is displayed
    expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
  });

  it('renders highlighted stocks with all columns when data is loaded', async () => {
    // Mock successful fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    render(<HighlightedStocksExternal />);
    
    // Wait for the data to load - should only show first 5 items due to pagination
    await waitFor(() => {
      // Check for gurus
      expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
      expect(screen.getByText('Bill Gates')).toBeInTheDocument();
      expect(screen.getByText('Jeff Bezos')).toBeInTheDocument();
      expect(screen.getByText('Larry Page')).toBeInTheDocument();
      expect(screen.getByText('Elon Musk')).toBeInTheDocument();
      
      // Check for tickers
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
      expect(screen.getByText('AMZN')).toBeInTheDocument();
      expect(screen.getByText('GOOGL')).toBeInTheDocument();
      expect(screen.getByText('TSLA')).toBeInTheDocument();
      
      // Check for sources
      expect(screen.getAllByText('Rule 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Magic Formula').length).toBeGreaterThan(0);
    });
    
    // Mark Zuckerberg should not be visible on first page
    expect(screen.queryByText('Mark Zuckerberg')).not.toBeInTheDocument();
    expect(screen.queryByText('META')).not.toBeInTheDocument();
  });

  it('handles pagination correctly', async () => {
    // Mock successful fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockHighlightedStocks,
    });
    
    render(<HighlightedStocksExternal />);
    
    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText('Warren Buffett')).toBeInTheDocument();
    });
    
    // Find the right arrow button (next page)
    const nextButtons = screen.getAllByRole('button');
    const nextButton = nextButtons[nextButtons.length - 2]; // Second to last button should be the right arrow
    
    // Click on the next page button
    fireEvent.click(nextButton);
    
    // Should now show Mark Zuckerberg (on page 2)
    expect(screen.getByText('Mark Zuckerberg')).toBeInTheDocument();
    
    // Warren Buffett should no longer be visible
    expect(screen.queryByText('Warren Buffett')).not.toBeInTheDocument();
    
    // Check that scrollTo was called
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('renders error message when fetch fails', async () => {
    // Mock failed fetch
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<HighlightedStocksExternal />);
    
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
    
    render(<HighlightedStocksExternal />);
    
    // Wait for the empty state message to appear
    await waitFor(() => {
      expect(screen.getByText('No highlighted stocks found')).toBeInTheDocument();
    });
  });
});

describe('HighlightedStocksExternalSkeleton', () => {
  it('renders correctly', () => {
    render(<HighlightedStocksExternalSkeleton />);
    
    expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
    // Check for table headers - should have all columns now
    expect(screen.getByText('Ticker')).toBeInTheDocument();
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.getByText('Signal')).toBeInTheDocument();
    expect(screen.getByText('PE')).toBeInTheDocument();
    expect(screen.getByText('Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Guru')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });
});
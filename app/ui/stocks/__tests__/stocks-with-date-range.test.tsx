import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StocksWithDateRange from '../stocks-with-date-range';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([
      {
        id: '1',
        ticker: 'AAPL',
        sentiment_score: 85,
        signal_score: 90,
        pe: 25,
        buy_price: 150,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: false,
        created_at: '2023-01-01T00:00:00.000Z',
        updated_at: '2023-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        ticker: 'MSFT',
        sentiment_score: 80,
        signal_score: 85,
        pe: 30,
        buy_price: 300,
        guru: 'Charlie Munger',
        source: 'Magic Formula',
        highlight: true,
        created_at: '2023-01-02T00:00:00.000Z',
        updated_at: '2023-01-02T00:00:00.000Z',
      },
    ]),
  })
);

describe('StocksWithDateRange', () => {
  const mockRouter = {
    push: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/dashboard/stocks');
  });

  it('navigates to stock detail page when row is clicked', async () => {
    render(<StocksWithDateRange startDate="01/01/2023" endDate="01/31/2023" />);
    
    // Wait for the component to load data
    await screen.findByText('AAPL');
    
    // Click on the first row
    const row = screen.getByText('AAPL').closest('tr');
    if (row) {
      fireEvent.click(row);
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/stocks/1');
    }
  });

  it('navigates to stock detail page when View button is clicked', async () => {
    render(<StocksWithDateRange startDate="01/01/2023" endDate="01/31/2023" />);
    
    // Wait for the component to load data
    await screen.findByText('AAPL');
    
    // Find all View buttons and click the first one
    const viewButtons = await screen.findAllByText('View');
    fireEvent.click(viewButtons[0]);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/stocks/1');
  });
});
import React from 'react';
import { render } from '@testing-library/react';
import StocksPage from '../page';

// Mock the StocksWithDateRange component
jest.mock('@/app/ui/stocks/stocks-with-date-range', () => {
  return function MockStocksWithDateRange({ startDate, endDate }: { startDate: string; endDate: string }) {
    return (
      <div data-testid="stocks-with-date-range">
        <div data-testid="start-date">{startDate}</div>
        <div data-testid="end-date">{endDate}</div>
      </div>
    );
  };
});

// Mock the StocksExternalSkeleton component
jest.mock('@/app/ui/stocks/stocks-external-skeleton', () => ({
  StocksExternalSkeleton: () => <div data-testid="stocks-skeleton">Loading...</div>,
}));

describe('StocksPage', () => {
  beforeEach(() => {
    // Reset date to a fixed value for consistent testing
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-05-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should default to showing stocks from the last 30 days when no dates are provided', () => {
    const { getByTestId } = render(<StocksPage />);
    
    // Current date is 2023-05-15, so 30 days ago is 2023-04-15
    expect(getByTestId('start-date').textContent).toBe('04/15/2023');
    expect(getByTestId('end-date').textContent).toBe('05/15/2023');
  });

  it('should use provided dates from searchParams when available', () => {
    const { getByTestId } = render(
      <StocksPage searchParams={{ startDate: '01/01/2023', endDate: '12/31/2023' }} />
    );
    
    expect(getByTestId('start-date').textContent).toBe('01/01/2023');
    expect(getByTestId('end-date').textContent).toBe('12/31/2023');
  });
});
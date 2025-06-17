import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StocksWithDateRange from '@/app/ui/stocks/stocks-with-date-range';
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
    json: () => Promise.resolve([]),
  })
) as jest.Mock;

describe('StocksWithDateRange', () => {
  const mockRouter = { push: jest.fn() };
  const mockPathname = '/dashboard/stocks';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('renders the component with date filters', async () => {
    render(<StocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stocks')).toBeInTheDocument();
    });
    
    // Check if date filters are rendered
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
    expect(screen.getByText('Apply Filter')).toBeInTheDocument();
  });

  it('has a "Set Today" button that sets both dates to today', async () => {
    render(<StocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stocks')).toBeInTheDocument();
    });
    
    // Check if "Set Today" button exists
    const setTodayButton = screen.getByText('Set Today');
    expect(setTodayButton).toBeInTheDocument();
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Click the "Set Today" button
    fireEvent.click(setTodayButton);
    
    // Check if start and end date inputs are updated to today's date
    const startDateInput = screen.getByLabelText(/Start Date/) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    
    expect(startDateInput.value).toBe(today);
    expect(endDateInput.value).toBe(today);
  });

  it('applies date filter when form is submitted', async () => {
    render(<StocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stocks')).toBeInTheDocument();
    });
    
    // Change date values
    const startDateInput = screen.getByLabelText(/Start Date/) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });
    
    // Submit the form
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);
    
    // Check if router.push was called with correct params
    expect(mockRouter.push).toHaveBeenCalledWith(
      `${mockPathname}?startDate=2024-01-01&endDate=2024-12-31`
    );
  });

  it('shows error when start date is after end date', async () => {
    render(<StocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Stocks')).toBeInTheDocument();
    });
    
    // Set invalid date range
    const startDateInput = screen.getByLabelText(/Start Date/) as HTMLInputElement;
    const endDateInput = screen.getByLabelText(/End Date/) as HTMLInputElement;
    
    fireEvent.change(startDateInput, { target: { value: '2024-12-31' } });
    fireEvent.change(endDateInput, { target: { value: '2024-01-01' } });
    
    // Submit the form
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Start date cannot be after end date')).toBeInTheDocument();
    });
    
    // Verify router.push was not called
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('handles sorting when clicking on sortable headers', async () => {
    // Mock stocks data
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { id: '1', ticker: 'AAPL', sentiment_score: 80, signal_score: 75, pe: 25, buy_price: 150, guru: 'Test', source: 'Rule 1', highlight: false, created_at: '2023-01-01' },
          { id: '2', ticker: 'MSFT', sentiment_score: 70, signal_score: 65, pe: 30, buy_price: 200, guru: 'Test', source: 'Magic Formula', highlight: true, created_at: '2023-01-02' }
        ]),
      })
    );

    render(<StocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load with data
    await waitFor(() => {
      expect(screen.getByText('Stocks')).toBeInTheDocument();
    });
    
    // Wait for the table to be populated
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Find and click on the ticker header to sort
    const tickerHeader = screen.getByText('Ticker');
    fireEvent.click(tickerHeader);
    
    // Verify the component doesn't crash
    expect(screen.getByText('Stocks')).toBeInTheDocument();
  });
});
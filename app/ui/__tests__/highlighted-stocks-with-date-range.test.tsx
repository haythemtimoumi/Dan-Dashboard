import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HighlightedStocksWithDateRange from '@/app/ui/stocks/highlighted-stocks-with-date-range';
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

describe('HighlightedStocksWithDateRange', () => {
  const mockRouter = { push: jest.fn() };
  const mockPathname = '/dashboard/highlighted';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue(mockPathname);
  });

  it('renders the component with date filters', async () => {
    render(<HighlightedStocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
    });
    
    // Check if date filters are rendered
    expect(screen.getByLabelText(/Start Date/)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/)).toBeInTheDocument();
    expect(screen.getByText('Apply Filter')).toBeInTheDocument();
  });

  it('has a "Set Today" button that sets both dates to today', async () => {
    render(<HighlightedStocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
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

  it('adds one day to end date when making API calls', async () => {
    render(<HighlightedStocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load and API call to be made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
    
    // Check that the fetch was called with the correct dates
    // End date should be 2024-01-01 (one day after 2023-12-31)
    const fetchUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(fetchUrl).toContain('startDate=2023-01-01');
    expect(fetchUrl).toContain('endDate=2024-01-01');
  });
  
  it('applies date filter when form is submitted', async () => {
    render(<HighlightedStocksWithDateRange startDate="2023-01-01" endDate="2023-12-31" />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Highlighted Stocks')).toBeInTheDocument();
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
});
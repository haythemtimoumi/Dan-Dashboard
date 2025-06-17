import React from 'react';
import { render, screen } from '@testing-library/react';
import StockDetailPage from '../page';
import { redirect } from 'next/navigation';

// Mock the data fetching function
jest.mock('@/app/lib/data', () => ({
  fetchStockById: jest.fn(),
  fetchStockHistory: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: { src: string; alt: string }) => {
    // Using a div instead of img to avoid the ESLint warning
    return <div data-testid="stock-chart-image" data-src={src} data-alt={alt} {...props} />;
  },
}));

// Mock the Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// Mock the StockHistoryChart component
jest.mock('@/app/ui/dashboard/stock-history-chart', () => {
  return function MockStockHistoryChart({ stockId }: { stockId: string }) {
    return <div data-testid="stock-history-chart" data-stockid={stockId}>Stock History Chart</div>;
  };
});

// Import the mocked function for testing
import { fetchStockById, fetchStockHistory } from '@/app/lib/data';

describe('StockDetailPage', () => {
  const mockStock = {
    id: '123',
    ticker: 'AAPL',
    sentiment_score: 0.85,
    signal_score: 0.78,
    pe: 28.5,
    buy_price: 150,
    guru: 'Warren Buffett',
    source: 'Rule 1',
    highlight: true,
    created_at: '2023-01-15T12:00:00Z',
    updated_at: '2023-06-20T14:30:00Z',
    screenshot: '/stocks/aapl-chart.png'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render stock details correctly', async () => {
    // Mock the fetchStockById to return our test data
    (fetchStockById as jest.Mock).mockResolvedValue(mockStock);

    // Render the component with a mock params object
    const { findByText, findByTestId } = render(await StockDetailPage({ params: { id: '123' } }));

    // Check that the stock details are displayed
    expect(await findByText('Stock Details: AAPL')).toBeInTheDocument();
    expect(await findByText('AAPL')).toBeInTheDocument();
    expect(await findByText('Warren Buffett')).toBeInTheDocument();
    expect(await findByText('Rule 1')).toBeInTheDocument();
    expect(await findByText('28.5')).toBeInTheDocument();
    expect(await findByText('$150.00')).toBeInTheDocument();
    expect(await findByText('0.85')).toBeInTheDocument();
    expect(await findByText('0.78')).toBeInTheDocument();
    
    // Check that the date is displayed correctly with the new label
    expect(await findByText('Stock Date')).toBeInTheDocument();
    
    // Check that the chart image is displayed
    expect(await findByTestId('stock-chart-image')).toBeInTheDocument();
    expect(await findByTestId('stock-chart-image')).toHaveAttribute('data-src', '/stocks/aapl-chart.png');
    expect(await findByTestId('stock-chart-image')).toHaveAttribute('data-alt', 'AAPL chart');
    
    // Check that the dynamic stock history chart is displayed with the correct stock ID
    const historyChart = await findByTestId('stock-history-chart');
    expect(historyChart).toBeInTheDocument();
    expect(historyChart).toHaveAttribute('data-stockid', '123');
    
    // Check that the back button is present
    expect(await findByText('Back to List')).toBeInTheDocument();
  });

  it('should show a user-friendly message when stock is not found', async () => {
    // Mock the fetchStockById to return null (stock not found)
    (fetchStockById as jest.Mock).mockResolvedValue(null);

    // Render the component
    const { findByText } = render(await StockDetailPage({ params: { id: '999' } }));

    // Check that the not found message is displayed
    expect(await findByText('Stock Not Found')).toBeInTheDocument();
    expect(await findByText('The stock with ID 999 could not be found.')).toBeInTheDocument();
    expect(await findByText('Back to All Stocks')).toBeInTheDocument();
  });

  // This test is commented out because the redirect functionality is optional and commented in the code
  // Uncomment this test if you uncomment the redirect in the page component
  /*
  it('should redirect to stocks list when stock is not found and redirect is enabled', async () => {
    // Mock the fetchStockById to return null (stock not found)
    (fetchStockById as jest.Mock).mockResolvedValue(null);

    // Enable the redirect in the page component before running this test
    await StockDetailPage({ params: { id: '999' } });

    // Check that redirect was called with the correct path
    expect(redirect).toHaveBeenCalledWith('/dashboard/stocks');
  });
  */

  it('should handle missing screenshot field gracefully', async () => {
    // Create a mock stock without screenshot field
    const stockWithoutScreenshot = { ...mockStock };
    delete stockWithoutScreenshot.screenshot;
    
    // Mock the fetchStockById to return stock without screenshot
    (fetchStockById as jest.Mock).mockResolvedValue(stockWithoutScreenshot);

    // Render the component
    const { findByText, queryByTestId } = render(await StockDetailPage({ params: { id: '123' } }));

    // Check that the stock details are displayed
    expect(await findByText('Stock Details: AAPL')).toBeInTheDocument();
    
    // Check that the chart image is not displayed
    expect(queryByTestId('stock-chart-image')).not.toBeInTheDocument();
  });

  it('should render stock history scores correctly', async () => {
    // Mock the fetchStockById to return our test data
    (fetchStockById as jest.Mock).mockResolvedValue(mockStock);
    
    // Mock the fetchStockHistory to return history with scores
    const mockHistory = [
      {
        id: '456',
        ticker: 'AAPL',
        sentiment_score: 0.85,
        signal_score: 0.78,
        pe: 28.5,
        buy_price: 150,
        guru: 'Warren Buffett',
        source: 'Rule 1',
        highlight: true,
        created_at: '2023-01-10T12:00:00Z',
        updated_at: '2023-01-10T14:30:00Z',
        rule1_score: 85,
        moat_score: 90,
        management_score: 75
      }
    ];
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockHistory);

    // Render the component with a mock params object
    const { findByText } = render(await StockDetailPage({ params: { id: '123' } }));

    // Check that the history scores are displayed
    expect(await findByText('Rule 1 Score')).toBeInTheDocument();
    expect(await findByText('85')).toBeInTheDocument();
    expect(await findByText('Moat Score')).toBeInTheDocument();
    expect(await findByText('90')).toBeInTheDocument();
    expect(await findByText('Management Score')).toBeInTheDocument();
    expect(await findByText('75')).toBeInTheDocument();
  });
  
  it('should show fallback UI when both stock and history screenshots are undefined', async () => {
    // Create a mock stock without screenshot field
    const stockWithoutScreenshot = { ...mockStock };
    delete stockWithoutScreenshot.screenshot;
    
    // Mock the fetchStockById to return stock without screenshot
    (fetchStockById as jest.Mock).mockResolvedValue(stockWithoutScreenshot);
    
    // Mock the fetchStockHistory to return history without screenshot
    const mockHistoryWithoutScreenshot = [{
      id: '456',
      ticker: 'AAPL',
      sentiment_score: 0.85,
      signal_score: 0.78,
      pe: 28.5,
      buy_price: 150,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-01-10T12:00:00Z',
      updated_at: '2023-01-10T14:30:00Z',
      rule1_score: 85,
      moat_score: 90,
      management_score: 75
      // No screenshot field
    }];
    (fetchStockHistory as jest.Mock).mockResolvedValue(mockHistoryWithoutScreenshot);

    // Render the component
    const { findByText } = render(await StockDetailPage({ params: { id: '123' } }));
    
    // Check that the fallback UI is displayed
    expect(await findByText('No chart image available')).toBeInTheDocument();
    expect(await findByText('Screenshot data is missing')).toBeInTheDocument();
  });
  
  it('should handle API errors gracefully', async () => {
    // Mock the fetchStockById to throw an error
    (fetchStockById as jest.Mock).mockRejectedValue(new Error('API Error'));

    // Render the component
    const { findByText } = render(await StockDetailPage({ params: { id: '123' } }));

    // Check that the error message is displayed
    expect(await findByText('Failed to load stock details. Please try again later.')).toBeInTheDocument();
    expect(await findByText('Back to Stocks')).toBeInTheDocument();
  });
});
import { render, screen } from '@testing-library/react';
import StockChart from '../dashboard/stock-chart';
import { Stock } from '@/app/lib/definitions';
import '@testing-library/jest-dom';

// Mock the Chart.js component since we're not testing the actual chart rendering
jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="mock-bar-chart">Chart Placeholder</div>,
}));

describe('StockChart Component', () => {
  const mockStocks: Stock[] = [
    {
      id: '1',
      ticker: 'AAPL',
      sentiment_score: 0.85,
      signal_score: 0.9,
      pe: 25.5,
      buy_price: 150.0,
      guru: 'Warren Buffett',
      source: 'Rule 1',
      highlight: true,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
    {
      id: '2',
      ticker: 'MSFT',
      sentiment_score: 0.75,
      signal_score: 0.8,
      pe: 30.2,
      buy_price: 280.0,
      guru: 'Peter Lynch',
      source: 'Magic Formula',
      highlight: false,
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    },
  ];

  it('renders the chart component with title', () => {
    render(<StockChart stocks={mockStocks} />);
    
    // Check if the title is rendered
    expect(screen.getByText('Stock Sentiment Analysis')).toBeInTheDocument();
    
    // Check if the chart is rendered (via our mock)
    expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();
  });

  it('renders with empty data', () => {
    render(<StockChart stocks={[]} />);
    
    // Even with no data, the component should render without errors
    expect(screen.getByText('Stock Sentiment Analysis')).toBeInTheDocument();
  });
});
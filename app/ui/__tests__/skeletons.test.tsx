import { render } from '@testing-library/react';
import DashboardSkeleton, { 
  CardSkeleton, 
  CardsSkeleton, 
  LatestStocksSkeleton, 
  DailyChangesSkeleton,
  StockSkeleton,
  TableRowSkeleton,
  StocksMobileSkeleton,
  StocksTableSkeleton,
  FormSkeleton,
  InvoicesTableSkeleton
} from '../skeletons';

describe('Skeleton Components', () => {
  test('DashboardSkeleton renders correctly', () => {
    const { container } = render(<DashboardSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('CardSkeleton renders correctly', () => {
    const { container } = render(<CardSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('CardsSkeleton renders correctly', () => {
    const { container } = render(<CardsSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('LatestStocksSkeleton renders correctly', () => {
    const { container } = render(<LatestStocksSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('DailyChangesSkeleton renders correctly', () => {
    const { container } = render(<DailyChangesSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('StockSkeleton renders correctly', () => {
    const { container } = render(<StockSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('TableRowSkeleton renders correctly', () => {
    const { container } = render(<TableRowSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('StocksMobileSkeleton renders correctly', () => {
    const { container } = render(<StocksMobileSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('StocksTableSkeleton renders correctly', () => {
    const { container } = render(<StocksTableSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('FormSkeleton renders correctly', () => {
    const { container } = render(<FormSkeleton />);
    expect(container).toBeInTheDocument();
  });

  test('InvoicesTableSkeleton renders correctly', () => {
    const { container } = render(<InvoicesTableSkeleton />);
    expect(container).toBeInTheDocument();
  });
});
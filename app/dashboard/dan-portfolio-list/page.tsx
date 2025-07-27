import { Suspense } from 'react';
import { Metadata } from 'next';
import PortfolioListWithDateRange from '@/app/ui/stocks/dan-portfolio-list-with-date-range';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Dan Portfolio List',
  description: 'View portfolio stocks (dan_portfolio_list source)',
};

export default function PortfolioListPage() {
  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <PortfolioListWithDateRange />
      </Suspense>
    </main>
  );
}
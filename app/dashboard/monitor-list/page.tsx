import { Suspense } from 'react';
import { Metadata } from 'next';
import PortfolioListWithDateRange from '@/app/ui/stocks/monitor-list-with-date-range';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Portfolio List',
  description: 'View portfolio stocks (monitor source)',
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
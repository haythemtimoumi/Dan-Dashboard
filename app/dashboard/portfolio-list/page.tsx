import { Suspense } from 'react';
import { Metadata } from 'next';
import PortfolioListWithDateRange from '@/app/ui/stocks/portfolio-list-with-date-range';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Portfolio List',
  description: 'View portfolio stocks (manual source)',
};

export default function PortfolioListPage({
  searchParams,
}: {
  searchParams?: {
    startDate?: string;
    endDate?: string;
  };
}) {
  // Get current date for default values
  const currentDate = new Date();
  const currentDateFormatted = currentDate.toISOString().split('T')[0];
  
  // Default to current date if no dates provided
  const startDate = searchParams?.startDate || currentDateFormatted;
  const endDate = searchParams?.endDate || currentDateFormatted;

  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <PortfolioListWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
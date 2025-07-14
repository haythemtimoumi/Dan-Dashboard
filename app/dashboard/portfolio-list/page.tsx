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
  };
}) {
  // Get current date for default values
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = currentDate.getFullYear();
  const currentDateFormatted = `${month}/${day}/${year}`;
  
  // Default to current date if no date provided
  const startDate = searchParams?.startDate || currentDateFormatted;

  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <PortfolioListWithDateRange startDate={startDate} />
      </Suspense>
    </main>
  );
}
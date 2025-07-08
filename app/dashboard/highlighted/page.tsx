import { Suspense } from 'react';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import HighlightedStocksWithDateRange from '@/app/ui/stocks/highlighted-stocks-with-date-range';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Highlighted Stocks',
  description: 'View highlighted stocks by date range',
};

export default function HighlightedStocksPage({
  searchParams,
}: {
  searchParams?: {
    startDate?: string;
    endDate?: string;
  };
}) {
  // Get current date for default values
  const currentDate = new Date();
  const currentDateFormatted = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = currentDate.getFullYear();
  const formattedDate = `${month}/${day}/${year}`;
  
  // Default to current date if no dates provided
  const startDate = searchParams?.startDate || currentDateFormatted;
  const endDate = searchParams?.endDate || currentDateFormatted;

  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <HighlightedStocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
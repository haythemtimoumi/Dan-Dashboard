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
  // Use a default date that will be overridden on client-side
  // This prevents timezone issues between server and client
  const defaultDate = '2025-07-01'; // Fallback date
  
  // Default to fallback date if no dates provided - will be updated client-side
  const startDate = searchParams?.startDate || defaultDate;
  const endDate = searchParams?.endDate || defaultDate;

  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <HighlightedStocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
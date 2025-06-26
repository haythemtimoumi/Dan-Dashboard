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
  const currentYear = currentDate.getFullYear();
  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;
  
  // Default to current year if no dates provided
  const startDate = searchParams?.startDate || startOfYear;
  const endDate = searchParams?.endDate || endOfYear;

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl font-bold text-blue-900`}>
        Highlighted Stocks
      </h1>
      <p className="text-gray-600 mb-6">
        View all highlighted stocks with detailed information including ticker, sentiment, signal, buy price, and source.
      </p>
      
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <HighlightedStocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
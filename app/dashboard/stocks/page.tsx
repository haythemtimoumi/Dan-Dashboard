import { Suspense } from 'react';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import StocksWithDateRange from '@/app/ui/stocks/stocks-with-date-range';
import { StocksExternalSkeleton } from '@/app/ui/stocks/stocks-external-skeleton';

export const metadata: Metadata = {
  title: 'Stocks',
  description: 'View stocks by date range with pagination',
};

export default function StocksPage({
  searchParams,
}: {
  searchParams?: {
    startDate?: string;
    endDate?: string;
  };
}) {
  // Get current date for default end date
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const year = currentDate.getFullYear();
  
  // Format current date as MM/DD/YYYY
  const currentDateFormatted = `${month}/${day}/${year}`;
  
  // Use current date as default if no dates provided
  const startDate = searchParams?.startDate || currentDateFormatted;
  const endDate = searchParams?.endDate || currentDateFormatted;

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl font-bold text-blue-900`}>
        Stocks
      </h1>
      <p className="text-gray-600 mb-6">
        View all stocks with detailed information including ticker, sentiment, signal, percentage upside, last price, sticker price, and source.
      </p>
      
      <Suspense fallback={<StocksExternalSkeleton />}>
        <StocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
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
      <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold`}>
          Highlighted Stocks
        </h1>
        <p className="mt-2 opacity-90 max-w-3xl">
          Premium stock selections with detailed metrics including sentiment analysis, signal scores, and financial indicators.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
            {formattedDate}
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Featured Selections
          </div>
        </div>
      </div>
      
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <HighlightedStocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
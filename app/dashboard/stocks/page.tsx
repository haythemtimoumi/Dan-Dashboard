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
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold`}>
          Stock Portfolio
        </h1>
        <p className="mt-2 opacity-90 max-w-3xl">
          View and manage your stock portfolio with detailed metrics including sentiment analysis, signal scores, and financial indicators.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium">
            {currentDateFormatted}
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Market Analysis
          </div>
        </div>
      </div>
      
      <Suspense fallback={<StocksExternalSkeleton />}>
        <StocksWithDateRange startDate={startDate} endDate={endDate} />
      </Suspense>
    </main>
  );
}
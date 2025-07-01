import { Suspense } from 'react';
import { Metadata } from 'next';
import { lusitana } from '@/app/ui/fonts';
import StockUpdateList from '@/app/ui/stocks/stock-update-list';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Stock Update',
  description: 'Browse stocks with pagination sorted by percentage upside',
};

export default function StockUpdatePage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
  };
}) {
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <main>
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl shadow-lg p-6 text-white mb-8">
        <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold`}>
          Stock Update
        </h1>
        <p className="mt-2 opacity-90 max-w-3xl">
          Browse all highlighted stocks sorted by percentage upside with pagination navigation.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Sorted by Upside
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Paginated View
          </div>
        </div>
      </div>
      
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <StockUpdateList currentPage={currentPage} />
      </Suspense>
    </main>
  );
}
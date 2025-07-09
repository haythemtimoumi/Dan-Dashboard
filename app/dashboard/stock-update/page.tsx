import { Suspense } from 'react';
import { Metadata } from 'next';
import StockUpdateList from '@/app/ui/stocks/stock-update-list';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Stock Update',
  description: 'Browse stocks with date selector and modern interface',
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
    <main className="p-0">
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <StockUpdateList currentPage={currentPage} />
      </Suspense>
    </main>
  );
}
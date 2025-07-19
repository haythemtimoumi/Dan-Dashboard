import { Suspense } from 'react';
import { Metadata } from 'next';
import GuruListWithDateRange from '@/app/ui/stocks/guru-list-with-date-range';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

export const metadata: Metadata = {
  title: 'Guru List',
  description: 'View guru list stocks (guru_list source)',
};

export default function GuruListPage() {
  return (
    <main>
      <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
        <GuruListWithDateRange />
      </Suspense>
    </main>
  );
}
import { Suspense } from 'react';
import { Metadata } from 'next';

import CardWrapper from '@/app/ui/dashboard/cards';
import LatestStocks from '@/app/ui/dashboard/latest-stocks';
import StockChart from '@/app/ui/dashboard/stock-chart';
import { lusitana } from '@/app/ui/fonts';
import {
  CardsSkeleton,
  LatestStocksSkeleton,
  DailyChangesSkeleton,
} from '@/app/ui/skeletons';
import { fetchStocksForChart } from '@/app/lib/data';
import RecentChanges from '@/app/ui/dashboard/RecentChanges'; // ✅ new component

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Stock Analysis Dashboard Overview"
};

export default async function DashboardPage() {
  const stocksForChart = await fetchStocksForChart();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Stock Analysis Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<LatestStocksSkeleton />}>
          <LatestStocks />
        </Suspense>
        <Suspense fallback={<DailyChangesSkeleton />}>
          <StockChart stocks={stocksForChart} />
        </Suspense>
      </div>

      {/* ✅ Added: Section to display recent stock changes */}
      <RecentChanges />
    </main>
  );
}

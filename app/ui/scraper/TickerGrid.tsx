'use client';

import { useQuery } from '@tanstack/react-query';
import { scraperApi, TickerResponse } from '@/app/lib/scraper-api';
import { TickerGridSkeleton } from './LoadingSkeleton';

export default function TickerGrid() {
  const { data: tickerData, isLoading, error } = useQuery<TickerResponse>({
    queryKey: ['tickers'],
    queryFn: scraperApi.getTickers,
  });

  if (isLoading) return <TickerGridSkeleton />;
  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
      <p className="text-red-700 dark:text-red-300 font-medium">Failed to load tickers</p>
      <p className="text-red-600 dark:text-red-400 text-sm mt-1">Please check your connection and try again</p>
    </div>
  );
  if (!tickerData) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Tickers</h3>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          {tickerData.count} tickers
        </span>
      </div>
      
      <div className="max-h-64 overflow-y-auto">
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          {tickerData.tickers.map((ticker, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-center text-sm font-mono border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors dark:text-white"
            >
              {ticker}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
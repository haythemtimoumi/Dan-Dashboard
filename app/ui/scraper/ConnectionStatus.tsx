'use client';

import { useQuery } from '@tanstack/react-query';
import { scraperApi } from '@/app/lib/scraper-api';
import { WifiIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ConnectionStatus() {
  const { error: statusError } = useQuery({
    queryKey: ['scraper-status'],
    queryFn: scraperApi.getStatus,
  });

  const { error: tickersError } = useQuery({
    queryKey: ['tickers'],
    queryFn: scraperApi.getTickers,
  });

  const isOffline = statusError || tickersError;

  if (!isOffline) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-lg mb-4">
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <div>
          <p className="text-orange-800 dark:text-orange-200 font-medium text-sm">
            API Connection Issue
          </p>
          <p className="text-orange-700 dark:text-orange-300 text-xs">
            Showing demo data - scraper API at 162.248.100.66:5000 is unavailable
          </p>
        </div>
      </div>
    </div>
  );
}
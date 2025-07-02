'use client';

import { useQuery } from '@tanstack/react-query';
import { scraperApi, ScraperStatus } from '@/app/lib/scraper-api';
import { ClockIcon, PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { StatusSkeleton } from './LoadingSkeleton';

export default function StatusCard() {
  const { data: status, isLoading, error } = useQuery<ScraperStatus>({
    queryKey: ['scraper-status'],
    queryFn: scraperApi.getStatus,
  });

  if (isLoading) return <StatusSkeleton />;
  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
      <p className="text-red-700 dark:text-red-300 font-medium">Failed to load scraper status</p>
      <p className="text-red-600 dark:text-red-400 text-sm mt-1">Please check your connection and try again</p>
    </div>
  );
  if (!status) return null;

  const getStatusColor = () => {
    switch (status.status) {
      case 'running': return 'bg-green-100 text-green-800 border-green-200';
      case 'idle': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'running': return <PlayIcon className="h-5 w-5" />;
      case 'idle': return <StopIcon className="h-5 w-5" />;
      case 'ready': return <ClockIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scraper Status</h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="capitalize font-medium">{status.status}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Running:</span>
          <span className={status.is_running ? 'text-green-600' : 'text-red-600'}>
            {status.is_running ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Next Run:</span>
          <span className="dark:text-white">{status.next_run_in_hours}h</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Last Run:</span>
          <span className="dark:text-white">{status.last_run ? new Date(status.last_run).toLocaleString() : 'Never'}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-300">Can Update Tickers:</span>
          <span className={status.can_update_tickers ? 'text-green-600' : 'text-red-600'}>
            {status.can_update_tickers ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
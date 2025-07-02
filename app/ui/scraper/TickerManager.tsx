'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scraperApi, TickerResponse, ScraperStatus } from '@/app/lib/scraper-api';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TickerManager() {
  const [newTickers, setNewTickers] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: status } = useQuery<ScraperStatus>({
    queryKey: ['scraper-status'],
    queryFn: scraperApi.getStatus,
  });

  const { data: tickerData } = useQuery<TickerResponse>({
    queryKey: ['tickers'],
    queryFn: scraperApi.getTickers,
  });

  const updateMutation = useMutation({
    mutationFn: (tickers: string[]) => scraperApi.updateTickers(tickers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickers'] });
      toast.success('Tickers updated successfully');
      setNewTickers('');
      setIsExpanded(false);
    },
    onError: () => {
      toast.error('Failed to update tickers');
    },
  });

  const handleAddTickers = () => {
    if (!newTickers.trim()) return;
    
    const tickersToAdd = newTickers
      .split(/[\s,\n]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);
    
    if (tickersToAdd.length === 0) return;
    
    const currentTickers = tickerData?.tickers || [];
    const uniqueTickers = Array.from(new Set([...currentTickers, ...tickersToAdd]));
    
    updateMutation.mutate(uniqueTickers);
  };

  const handleReplaceTickers = () => {
    if (!newTickers.trim()) return;
    
    const tickersToReplace = newTickers
      .split(/[\s,\n]+/)
      .map(t => t.trim().toUpperCase())
      .filter(t => t.length > 0);
    
    if (tickersToReplace.length === 0) return;
    
    updateMutation.mutate(tickersToReplace);
  };

  const canUpdate = status?.can_update_tickers ?? false;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ticker Management</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={!canUpdate}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            canUpdate 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <PlusIcon className="h-4 w-4" />
          {isExpanded ? 'Cancel' : 'Manage Tickers'}
        </button>
      </div>

      {!canUpdate && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg mb-4">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Ticker updates are disabled while the scraper is running.
          </p>
        </div>
      )}

      {isExpanded && canUpdate && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add/Replace Tickers (one per line or comma-separated)
            </label>
            <textarea
              value={newTickers}
              onChange={(e) => setNewTickers(e.target.value)}
              placeholder="AAPL, GOOGL, MSFT&#10;TSLA&#10;NVDA"
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAddTickers}
              disabled={updateMutation.isPending || !newTickers.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              Add to Existing
            </button>
            
            <button
              onClick={handleReplaceTickers}
              disabled={updateMutation.isPending || !newTickers.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {updateMutation.isPending && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              Replace All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
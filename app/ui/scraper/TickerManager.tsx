'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scraperApi, TickerResponse, ScraperStatus } from '@/app/lib/scraper-api';
import { PlusIcon, ArrowPathIcon, PencilSquareIcon, DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/outline';
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
      toast.success('✅ Tickers updated successfully!');
      setNewTickers('');
      setIsExpanded(false);
    },
    onError: () => {
      toast.error('❌ Failed to update tickers');
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
  const tickerCount = newTickers.split(/[\s,\n]+/).filter(t => t.trim().length > 0).length;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md">
              <PencilSquareIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Ticker Management</h3>
              <p className="text-sm text-gray-600">Add or replace stock symbols</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            disabled={!canUpdate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 shadow-md ${
              canUpdate 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {!canUpdate ? <LockClosedIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            {isExpanded ? 'Cancel' : 'Manage Tickers'}
          </button>
        </div>

        {!canUpdate && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <LockClosedIcon className="h-5 w-5 text-amber-600" />
              <p className="text-amber-800 font-medium text-sm">
                Ticker updates are locked while the scraper is running
              </p>
            </div>
          </div>
        )}
      </div>

      {isExpanded && canUpdate && (
        <div className="bg-white/70 backdrop-blur-sm border-t border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                <label className="text-sm font-semibold text-gray-700">
                  Enter Ticker Symbols
                </label>
                {tickerCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {tickerCount} symbols
                  </span>
                )}
              </div>
              <textarea
                value={newTickers}
                onChange={(e) => setNewTickers(e.target.value)}
                placeholder="Enter symbols separated by commas or new lines:\n\nAAPL, GOOGL, MSFT\nTSLA\nNVDA, META"
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm bg-white text-gray-900 placeholder-gray-400 transition-all duration-200 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 Tip: Use commas, spaces, or new lines to separate ticker symbols
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleAddTickers}
                disabled={updateMutation.isPending || !newTickers.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {updateMutation.isPending ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <PlusIcon className="h-5 w-5" />
                )}
                Add to Existing
              </button>
              
              <button
                onClick={handleReplaceTickers}
                disabled={updateMutation.isPending || !newTickers.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:from-orange-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {updateMutation.isPending ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                ) : (
                  <ArrowPathIcon className="h-5 w-5" />
                )}
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
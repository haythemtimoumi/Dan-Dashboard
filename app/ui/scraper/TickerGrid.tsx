'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scraperApi, TickerResponse } from '@/app/lib/scraper-api';
import { TickerGridSkeleton } from './LoadingSkeleton';
import { MagnifyingGlassIcon, ChartBarIcon, XCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';
import toast from 'react-hot-toast';

export default function TickerGrid() {
  const { t } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { data: tickerData, isLoading, error } = useQuery<TickerResponse>({
    queryKey: ['tickers'],
    queryFn: scraperApi.getTickers,
  });
  
  const deleteMutation = useMutation({
    mutationFn: ({ source, ticker }: { source: string, ticker: string }) => 
      scraperApi.deleteTicker(source, ticker),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickers'] });
      toast.success('Ticker deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete ticker');
    },
  });
  
  const handleDeleteTicker = (source: string, ticker: string) => {
    if (confirm(`Are you sure you want to delete ${ticker} from ${source}?`)) {
      deleteMutation.mutate({ source, ticker });
    }
  };

  if (isLoading) return <TickerGridSkeleton />;
  if (error) return (
    <div className="bg-red-50 border border-red-200 p-6 rounded-xl">
      <div className="flex items-center gap-3 mb-2">
        <XCircleIcon className="h-6 w-6 text-red-500" />
        <h3 className="text-lg font-semibold text-red-800">Failed to Load Tickers</h3>
      </div>
      <p className="text-red-700 text-sm">Unable to fetch ticker data from the server</p>
    </div>
  );
  if (!tickerData) return null;
  
  // Ensure tickers is an array of objects with source and ticker properties
  const tickersArray = Array.isArray(tickerData.tickers) 
    ? tickerData.tickers.map(item => {
        if (typeof item === 'string') {
          return { source: 'manual', ticker: item };
        }
        return item;
      })
    : [];
    
  // Group tickers by source
  const tickersBySource = tickersArray.reduce((acc, item) => {
    if (!acc[item.source]) {
      acc[item.source] = [];
    }
    acc[item.source].push(item.ticker);
    return acc;
  }, {} as Record<string, string[]>);
  
  // Filter tickers based on search term
  const filteredTickersBySource: Record<string, string[]> = {};
  let totalFilteredTickers = 0;
  
  Object.keys(tickersBySource).forEach(source => {
    const filteredSourceTickers = tickersBySource[source].filter(ticker => 
      ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredSourceTickers.length > 0) {
      filteredTickersBySource[source] = filteredSourceTickers;
      totalFilteredTickers += filteredSourceTickers.length;
    }
  });
  
  // Source display names mapping
  const sourceDisplayNames: Record<string, string> = {
    'manual': 'Manual',
    'guru_list': 'Guru List',
    'target': 'Target',
    'monitor': 'Monitor'
  };
  
  // Source color mapping
  const sourceColors: Record<string, { bg: string, border: string, text: string }> = {
    'manual': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    'guru_list': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    'target': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    'monitor': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-900 text-white">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t('activeTickers')}</h3>
              <p className="text-sm text-gray-600">{t('currentlyMonitoredSymbols')}</p>
            </div>
          </div>
          
          <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold">
            {totalFilteredTickers} of {tickerData.count}
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white text-gray-900 placeholder-gray-400"
          />
        </div>
      </div>
      
      {/* Ticker Grid */}
      <div className="p-6">
        {totalFilteredTickers === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No tickers found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search term</p>
          </div>
        ) : (
          <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2">
            {Object.keys(filteredTickersBySource).map(source => (
              <div key={source} className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sourceColors[source]?.bg || 'bg-gray-100'} ${sourceColors[source]?.border || 'border-gray-200'} border`}>
                  <h4 className={`font-semibold ${sourceColors[source]?.text || 'text-gray-800'}`}>
                    {sourceDisplayNames[source] || source}
                  </h4>
                  <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                    {filteredTickersBySource[source].length} tickers
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                  {filteredTickersBySource[source].map((ticker, index) => (
                    <div
                      key={`${source}-${ticker}`}
                      className={`group relative ${sourceColors[source]?.bg || 'bg-gray-100'} hover:bg-opacity-70 ${sourceColors[source]?.border || 'border-gray-200'} border p-3 rounded-lg flex items-center justify-between transition-all duration-200 hover:shadow-md`}
                    >
                      <span className="font-mono font-medium text-sm">{ticker}</span>
                      <button 
                        onClick={() => handleDeleteTicker(source, ticker)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded-full hover:bg-red-100 text-red-500"
                        title="Delete ticker"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
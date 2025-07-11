'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { scraperApi, TickerResponse } from '@/app/lib/scraper-api';
import { TickerGridSkeleton } from './LoadingSkeleton';
import { MagnifyingGlassIcon, ChartBarIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function TickerGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: tickerData, isLoading, error } = useQuery<TickerResponse>({
    queryKey: ['tickers'],
    queryFn: scraperApi.getTickers,
  });

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

  const filteredTickers = tickerData.tickers.filter(ticker => 
    ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h3 className="text-xl font-bold text-gray-900">Active Tickers</h3>
              <p className="text-sm text-gray-600">Currently monitored symbols</p>
            </div>
          </div>
          
          <span className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold">
            {filteredTickers.length} of {tickerData.count}
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
        {filteredTickers.length === 0 ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No tickers found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search term</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2">
              {filteredTickers.map((ticker, index) => (
                <div
                  key={index}
                  className="group bg-gray-100 hover:bg-gray-200 border border-gray-300 hover:border-gray-400 p-3 rounded-lg text-center font-mono font-semibold text-gray-800 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-md"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <span className="text-sm group-hover:text-gray-900 transition-colors duration-200">{ticker}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
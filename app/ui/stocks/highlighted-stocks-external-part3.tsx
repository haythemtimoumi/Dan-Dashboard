'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { HighlightedStocksExternalSkeleton, Pagination } from './highlighted-stocks-external-part1';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stocksapidashboard.duckdns.org/api';

// Items per page for pagination
const ITEMS_PER_PAGE = 5;

// This is a continuation of the HighlightedStocksExternal component
// The beginning of this component is in highlighted-stocks-external-part2.tsx

export function HighlightedStocksExternalPart3({ 
  loading, 
  error, 
  filteredStocks, 
  currentPage, 
  setCurrentPage,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  isFilterOpen,
  setIsFilterOpen,
  dateError,
  activeFilters,
  resetFilters,
  handleDateFilterChange
}: {
  loading: boolean;
  error: string | null;
  filteredStocks: Stock[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  isFilterOpen: boolean;
  setIsFilterOpen: (isOpen: boolean) => void;
  dateError: string | null;
  activeFilters: number;
  resetFilters: () => void;
  handleDateFilterChange: (name: string, value: string) => void;
}) {
  if (loading) {
    return <HighlightedStocksExternalSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg bg-red-50 p-6 text-center shadow-md">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredStocks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStocks = filteredStocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the component
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-4 md:pt-4 shadow-md">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-2xl font-semibold text-blue-800">Highlighted Stocks</h2>
            
            {/* Filter toggle button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx(
                "flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors",
                isFilterOpen 
                  ? "bg-blue-500 text-white border-blue-600" 
                  : activeFilters > 0
                    ? "bg-blue-100 text-blue-700 border-blue-200"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              {isFilterOpen ? (
                <>
                  <XMarkIcon className="h-4 w-4" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <FunnelIcon className="h-4 w-4" />
                  <span>
                    {activeFilters > 0 ? `Filters (${activeFilters})` : "Filter"}
                  </span>
                </>
              )}
            </button>
          </div>
          
          {/* Date filter */}
          {isFilterOpen && (
            <div className="mb-6 px-2 bg-white p-4 rounded-md border border-gray-200 shadow-sm animate-in fade-in slide-in-from-top duration-300">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Date</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="col-span-1">
                  <label htmlFor="startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Start Date</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className={clsx(
                      "block w-full rounded-md border py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/30",
                      dateError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                    )}
                    value={startDate}
                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                    max={endDate || undefined}
                  />
                </div>
                
                <div className="col-span-1">
                  <label htmlFor="endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>End Date</span>
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    className={clsx(
                      "block w-full rounded-md border py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/30",
                      dateError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                    )}
                    value={endDate}
                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
                
                <div className="col-span-1 flex items-end">
                  <button
                    onClick={resetFilters}
                    className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
              
              {dateError && (
                <p className="mt-2 text-sm text-red-600">{dateError}</p>
              )}
              
              {activeFilters > 0 && !dateError && (
                <div className="mt-3 text-sm text-blue-600">
                  Showing {filteredStocks.length} stocks matching your filters
                </div>
              )}
            </div>
          )}
          
          {/* Active filters display when filter panel is closed */}
          {!isFilterOpen && activeFilters > 0 && (
            <div className="mb-4 px-2">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-500">Active filters:</span>
                
                {startDate && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    From: {startDate}
                    <button 
                      onClick={() => setStartDate('')}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {endDate && (
                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    To: {endDate}
                    <button 
                      onClick={() => setEndDate('')}
                      className="ml-1 text-blue-500 hover:text-blue-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                <button
                  onClick={resetFilters}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Clear all
                </button>
              </div>
              
              <div className="mt-2 text-sm text-blue-600">
                Showing {filteredStocks.length} stocks matching your filters
              </div>
            </div>
          )}
          
          {filteredStocks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No highlighted stocks found</p>
              {activeFilters > 0 && (
                <button
                  onClick={resetFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800 hover:underline text-sm"
                >
                  Clear filters and try again
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="mb-3 w-full rounded-md bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="text-sm font-semibold">{stock.ticker}</p>
                        <p className="text-sm text-gray-500">{stock.guru}</p>
                      </div>
                      <div className={`${getSentimentColor(stock.sentiment_score)} text-sm font-medium`}>
                        {stock.sentiment_score}
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between pt-4">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">Signal:</span> {stock.signal_score}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">PE:</span> {stock.pe}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Buy Price:</span> {formatCurrency(stock.buy_price)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Date:</span> {formatDate(stock.created_at)}
                        </p>
                        <p className="mt-2">
                          <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block">
                <table className="min-w-full text-gray-900 border-collapse">
                  <thead className="rounded-lg text-left text-sm font-normal">
                    <tr className="bg-blue-50">
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Ticker
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Sentiment
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Signal
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        PE
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Buy Price
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Guru
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Source
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="w-full py-3 text-sm hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-3 py-4 whitespace-nowrap font-medium">
                          {stock.ticker}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "font-medium rounded-full px-2 py-1 text-xs inline-flex items-center justify-center w-12"
                          )}>
                            {stock.sentiment_score}
                          </p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.signal_score),
                            "font-medium rounded-full px-2 py-1 text-xs inline-flex items-center justify-center w-12"
                          )}>
                            {stock.signal_score}
                          </p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {stock.pe}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {stock.guru}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                          {formatDate(stock.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-5 flex w-full justify-center">
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handlePageChange} 
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
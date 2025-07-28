'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate, generatePagination } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';
//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

// Items per page for pagination
const ITEMS_PER_PAGE = 5;

// Loading skeleton for the highlighted stocks table
export function HighlightedStocksExternalSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0 shadow-md">
          <div className="flex justify-between items-center mb-4 px-4">
            <h2 className="text-xl font-semibold">Highlighted Stocks</h2>
          </div>
          <div className="md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="h-5 w-24 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal bg-gray-100">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">Ticker</th>
                <th scope="col" className="px-3 py-5 font-medium">Sentiment</th>
                <th scope="col" className="px-3 py-5 font-medium">Signal</th>
                <th scope="col" className="px-3 py-5 font-medium">PE</th>
                <th scope="col" className="px-3 py-5 font-medium">Buy Price</th>
                <th scope="col" className="px-3 py-5 font-medium">Guru</th>
                <th scope="col" className="px-3 py-5 font-medium">Source</th>
                <th scope="col" className="px-3 py-5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-gray-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="whitespace-nowrap px-3 py-4">
                      <div className="h-5 w-24 rounded bg-gray-200"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Pagination component
export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  const allPages = generatePagination(currentPage, totalPages);

  // If there are no pages, don't render pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 mt-6">
      {/* Left Arrow */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          currentPage <= 1
            ? 'pointer-events-none text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 text-gray-700 border-gray-300'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      <div className="flex -space-x-px">
        {allPages.map((page, index) => {
          let position: 'first' | 'last' | 'single' | 'middle' | undefined;

          if (index === 0) position = 'first';
          if (index === allPages.length - 1) position = 'last';
          if (allPages.length === 1) position = 'single';
          if (page === '...') position = 'middle';

          return (
            <button
              key={page.toString() + index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`flex h-9 w-9 items-center justify-center text-sm border transition-colors ${
                position === 'first' || position === 'single' ? 'rounded-l-md' : ''
              } ${
                position === 'last' || position === 'single' ? 'rounded-r-md' : ''
              } ${
                currentPage === page
                  ? 'z-10 bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : position === 'middle'
                  ? 'text-gray-300'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          currentPage >= totalPages
            ? 'pointer-events-none text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 text-gray-700 border-gray-300'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Page info */}
      <div className="ml-2 text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

// Main component for highlighted stocks
export default function HighlightedStocksExternal() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  // Fetch highlighted stocks
  useEffect(() => {
    const fetchHighlightedStocks = async () => {
      try {
        setLoading(true);
        // Use the API URL from environment variable
        const response = await fetch(`${API_URL}/stocks/highlighted`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch highlighted stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Set the stocks without any modification
        setStocks(data);
        setFilteredStocks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching highlighted stocks:', err);
        setError('Failed to load highlighted stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlightedStocks();
  }, []);

  // Apply date filters when they change
  useEffect(() => {
    if (stocks.length === 0) return;
    
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setDateError('Start date cannot be after end date');
        return;
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
    
    let filtered = [...stocks];
    let filterCount = 0;
    
    // Filter by start date
    if (startDate) {
      filterCount++;
      const startDateTime = new Date(startDate).getTime();
      filtered = filtered.filter(stock => 
        new Date(stock.created_at).getTime() >= startDateTime
      );
    }
    
    // Filter by end date
    if (endDate) {
      filterCount++;
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filtered = filtered.filter(stock => 
        new Date(stock.created_at).getTime() < endDateTime.getTime()
      );
    }
    
    setActiveFilters(filterCount);
    setFilteredStocks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [startDate, endDate, stocks]);

  // Handle date filter changes
  const handleDateFilterChange = (name: string, value: string) => {
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredStocks(stocks);
    setCurrentPage(1);
    setDateError(null);
  };

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
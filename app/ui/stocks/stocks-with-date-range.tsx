'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { UpdateStock, DeleteStock, CreateStock } from '@/app/ui/stocks/buttons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/app/ui/datepicker-custom.css';

// Use the backend API URL running on port 3000
const API_URL = 'https://stocksapidashboard.duckdns.org/api';

// No pagination - show all items

// No pagination component needed

// Main component for stocks with date range
export default function StocksWithDateRange({
  startDate,
  endDate
}: {
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // No pagination state needed
  const [startDateObj, setStartDateObj] = useState<Date | null>(parseDate(startDate));
  const [endDateObj, setEndDateObj] = useState<Date | null>(parseDate(endDate));
  const [dateError, setDateError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('sentiment_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Parse date string to Date object
  function parseDate(dateString: string): Date | null {
    try {
      // Handle MM/DD/YYYY format
      if (dateString.includes('/')) {
        const [month, day, year] = dateString.split('/');
        return new Date(`${year}-${month}-${day}`);
      }
      // Handle YYYY-MM-DD format
      return new Date(dateString);
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }

  // Format Date object to MM/DD/YYYY string
  function formatDateToString(date: Date | null): string {
    if (!date) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  // Convert between date formats
  const formatDateForAPI = (dateString: string): string => {
    // For the legacy API, we need MM/DD/YYYY format
    // Check if the date is already in MM/DD/YYYY format
    if (dateString.includes('/')) {
      return dateString;
    }
    
    // Otherwise, assume YYYY-MM-DD and convert to MM/DD/YYYY
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };
  
  // Convert YYYY-MM-DD to MM/DD/YYYY for display
  const formatDateForDisplay = (dateString: string): string => {
    // Check if the date is already in MM/DD/YYYY format
    if (dateString.includes('/')) {
      return dateString;
    }
    
    // Otherwise, assume YYYY-MM-DD and convert
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Fetch stocks by date range
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        
        // Format dates for API - ensure MM/DD/YYYY format for legacy API
        const formattedStart = formatDateToString(startDateObj);
        const formattedEnd = formatDateToString(endDateObj);
        
        // URL encode the date parameters for safety
        const encodedStartDate = encodeURIComponent(formattedStart);
        const encodedEndDate = encodeURIComponent(formattedEnd);
        
        // Construct the full API URL with the backend running on port 3000
        const apiUrl = `${API_URL}/stocks/date-range?startDate=${encodedStartDate}&endDate=${encodedEndDate}`;
        
        console.log(`Fetching stocks from API: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} stocks from API`);
        
        // Use the data directly without additional processing
        setStocks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        // Provide more specific error message for network errors (likely CORS or API unreachable)
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Unable to connect to the API server at https://stocksapidashboard.duckdns.org. Please ensure the backend is running and CORS is properly configured.');
        } else {
          setError('Failed to load stocks. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (startDateObj && endDateObj) {
      fetchStocks();
    }
  }, [startDateObj, endDateObj]);

  // Handle date filter changes
  const handleDateFilterChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    try {
      if (!startDateObj || !endDateObj) {
        setDateError('Please select both start and end dates');
        return;
      }
      
      if (startDateObj > endDateObj) {
        setDateError('Start date cannot be after end date');
        return;
      }
      
      // Format dates for URL parameters
      const formattedStartDate = formatDateToString(startDateObj);
      const formattedEndDate = formatDateToString(endDateObj);
      
      // Update URL with new date parameters
      const params = new URLSearchParams();
      params.set('startDate', formattedStartDate);
      params.set('endDate', formattedEndDate);
      
      router.push(`${pathname}?${params.toString()}`);
      setDateError(null);
    } catch (err) {
      setDateError('Invalid date selection. Please try again.');
    }
  };

  // No page change handler needed

  // Handle sorting
  const handleSort = (field: string) => {
    console.log(`Sorting by ${field}, current sort: ${sortBy}, order: ${sortOrder}`);
    
    if (sortBy === field) {
      // Toggle sort order if already sorting by this field
      const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      console.log(`Toggling order to ${newOrder}`);
      setSortOrder(newOrder);
    } else {
      // Set new sort field and default to descending
      console.log(`New sort field: ${field}, setting order to desc`);
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort stocks with improved handling for null/undefined values
  const sortedStocks = [...stocks].sort((a, b) => {
    const valueA = a[sortBy as keyof Stock];
    const valueB = b[sortBy as keyof Stock];
    
    // Debug sorting values
    if (sortBy === 'rule1_score' || sortBy === 'moat_score' || sortBy === 'management_score') {
      console.log(`Comparing ${a.ticker} (${valueA}) with ${b.ticker} (${valueB}) for ${sortBy}`);
    }
    
    // Handle null/undefined values - always sort them to the end
    if (valueA === null || valueA === undefined) {
      return sortOrder === 'asc' ? 1 : -1; // null values at end
    }
    if (valueB === null || valueB === undefined) {
      return sortOrder === 'asc' ? -1 : 1; // null values at end
    }
    
    // Handle numbers
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle strings
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Default case
    return 0;
  });

  // Use all sorted stocks without pagination
  const paginatedStocks = sortedStocks;

  // Sortable header component
  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <th 
      scope="col" 
      className={clsx(
        "px-4 py-4 font-medium cursor-pointer transition-colors duration-200",
        sortBy === field ? "text-blue-700" : "text-gray-700 hover:text-blue-600"
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5 group">
        <span>{label}</span>
        <div className={clsx(
          "transition-opacity duration-200",
          sortBy === field ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        )}>
          {sortBy === field && sortOrder === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          )}
        </div>
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div className="animate-pulse flex items-center gap-2">
                <div className="h-6 w-6 bg-blue-200 rounded-full"></div>
                <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-10 w-24 bg-blue-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="animate-pulse space-y-6">
              <div className="h-32 bg-gray-100 rounded-xl"></div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl bg-red-50 p-8 text-center shadow-md border border-red-100">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Stocks</h2>
        <p className="text-red-700 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <span>Stock Portfolio</span>
              </h2>
              <p className="text-gray-500 mt-1">
                Showing data from {formatDateToString(startDateObj)} to {formatDateToString(endDateObj)}
              </p>
            </div>
            <div>
              <CreateStock />
            </div>
          </div>
          
          {/* Date filter */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
            <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Filter by Date Range
            </h3>
            <form onSubmit={handleDateFilterChange} className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="col-span-1">
                <label htmlFor="startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <span>Start Date</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="startDate"
                    selected={startDateObj}
                    onChange={(date) => setStartDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className={clsx(
                      "block w-full rounded-lg border py-2.5 px-4 pl-10 text-sm shadow-sm focus:ring-2 focus:ring-blue-500/30 bg-white",
                      dateError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                    )}
                    placeholderText="Select start date"
                    showPopperArrow={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    todayButton="Today"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                </div>
              </div>
              
              <div className="col-span-1">
                <label htmlFor="endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <span>End Date</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="endDate"
                    selected={endDateObj}
                    onChange={(date) => setEndDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className={clsx(
                      "block w-full rounded-lg border py-2.5 px-4 pl-10 text-sm shadow-sm focus:ring-2 focus:ring-blue-500/30 bg-white",
                      dateError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                    )}
                    placeholderText="Select end date"
                    showPopperArrow={false}
                    minDate={startDateObj || undefined}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    todayButton="Today"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500" />
                </div>
              </div>
              
              <div className="col-span-1 flex items-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setStartDateObj(today);
                    setEndDateObj(today);
                    
                    // Auto-submit the form to apply the filter immediately
                    setTimeout(() => {
                      const formattedToday = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;
                      const params = new URLSearchParams();
                      params.set('startDate', formattedToday);
                      params.set('endDate', formattedToday);
                      router.push(`${pathname}?${params.toString()}`);
                    }, 100);
                  }}
                  className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 flex-grow shadow-sm transition-all duration-200 hover:shadow"
                >
                  <span className="flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Today&apos;s Data
                  </span>
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-all duration-200 hover:shadow flex items-center justify-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Apply Filter
                </button>
              </div>
            </form>
            
            {dateError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {dateError}
              </div>
            )}
            
            <div className="mt-4 flex items-center gap-2">
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                {stocks.length} stocks
              </div>
              <div className="text-sm text-gray-600">
                from {formatDateToString(startDateObj)} to {formatDateToString(endDateObj)}
              </div>
            </div>
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-gray-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Stocks Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">No stocks were found for the selected date range. Try selecting a wider date range or different dates to see more results.</p>
              <button
                onClick={() => {
                  const today = new Date();
                  setStartDateObj(today);
                  setEndDateObj(today);
                  
                  setTimeout(() => {
                    const formattedToday = `${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}/${today.getFullYear()}`;
                    const params = new URLSearchParams();
                    params.set('startDate', formattedToday);
                    params.set('endDate', formattedToday);
                    router.push(`${pathname}?${params.toString()}`);
                  }, 100);
                }}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Today&apos;s Stocks
              </button>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className={clsx(
                      "w-full rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-50 border border-gray-100", 
                      {
                        "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/stocks/${stock.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {stock.ticker.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-800">{stock.ticker}</p>
                          <p className="text-xs text-gray-500">{stock.guru}</p>
                        </div>
                      </div>
                      <div className={clsx(
                        getSentimentColor(stock.sentiment_score),
                        "text-sm font-medium rounded-full px-3 py-1.5 flex items-center gap-1"
                      )}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {stock.sentiment_score}
                      </div>
                    </div>
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Signal Score</p>
                          <p className="text-lg font-semibold">{stock.signal_score}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Rule1 Score</p>
                          <p className="text-lg font-semibold">{stock.rule1_score !== null ? stock.rule1_score : '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Sticker Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(stock.buy_price)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Price</p>
                          <p className="text-lg font-semibold">{stock.current_ratio}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                          </span>
                        </div>
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/stocks/${stock.id}`);
                            }}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            View
                          </button>
                          <UpdateStock id={stock.id} />
                          <DeleteStock id={stock.id} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-gray-900 border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 text-left text-sm font-medium">
                      <SortableHeader label="Ticker" field="ticker" />
                      <SortableHeader label="Sentiment" field="sentiment_score" />
                      <SortableHeader label="Signal" field="signal_score" />
                      <SortableHeader label="Rule1 Score" field="rule1_score" />
                      <SortableHeader label="Moat Score" field="moat_score" />
                      <SortableHeader label="Management Score" field="management_score" />
                      <SortableHeader label="Sticker Price" field="buy_price" />
                      <SortableHeader label="Last Price" field="current_ratio" />
                      <SortableHeader label="Percentage Upside" field="pe" />
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">
                        Source
                      </th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">
                        Date
                      </th>
                      <th scope="col" className="relative py-3 pl-6 pr-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className={clsx(
                          "w-full text-sm hover:bg-blue-50 transition-all duration-200 cursor-pointer", 
                          {
                            "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                          }
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/stocks/${stock.id}`);
                        }}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-xs">
                              {stock.ticker.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{stock.ticker}</p>
                              <p className="text-xs text-gray-500">{stock.guru}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "font-medium rounded-full px-2.5 py-1 text-xs inline-flex items-center justify-center w-14"
                          )}>
                            {stock.sentiment_score}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.signal_score),
                            "font-medium rounded-full px-2.5 py-1 text-xs inline-flex items-center justify-center w-14"
                          )}>
                            {stock.signal_score}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.moat_score !== null ? stock.moat_score : '-'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.management_score !== null ? stock.management_score : '-'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.current_ratio}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.pe}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/stocks/${stock.id}`);
                              }}
                              className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                            >
                              View
                            </button>
                            <UpdateStock id={stock.id} />
                            <DeleteStock id={stock.id} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* No pagination */}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

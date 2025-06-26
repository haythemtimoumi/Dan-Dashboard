'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate, generatePagination } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { UpdateStock, DeleteStock, CreateStock } from '@/app/ui/stocks/buttons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/app/ui/datepicker-custom.css';

// Use the backend API URL running on port 3000
const API_URL = 'https://stocksapidashboard.duckdns.org/api';

// Items per page for pagination
const ITEMS_PER_PAGE = 5;

// Pagination component
function Pagination({ 
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
  const [currentPage, setCurrentPage] = useState<number>(1);
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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the component
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if already sorting by this field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to descending
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort stocks
  const sortedStocks = [...stocks].sort((a, b) => {
    const valueA = a[sortBy as keyof Stock];
    const valueB = b[sortBy as keyof Stock];
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    return 0;
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedStocks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStocks = sortedStocks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Sortable header component
  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <th 
      scope="col" 
      className="px-3 py-4 font-medium text-blue-900 cursor-pointer hover:text-blue-700"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === field && (
          sortOrder === 'asc' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          )
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-lg bg-gray-50 p-4 md:pt-4 shadow-md">
            <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-2xl font-semibold text-blue-800">Loading...</h2>
            </div>
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg bg-red-50 p-6 text-center shadow-md">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-4 md:pt-4 shadow-md">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-2xl font-semibold text-blue-800">
              Stocks Created Between {formatDateToString(startDateObj)} - {formatDateToString(endDateObj)}
            </h2>
            <CreateStock />
          </div>
          
          {/* Date filter */}
          <div className="mb-6 px-2 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Filter by Date</h3>
            <form onSubmit={handleDateFilterChange} className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="col-span-1">
                <label htmlFor="startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Start Date</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="startDate"
                    selected={startDateObj}
                    onChange={(date) => setStartDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className={clsx(
                      "block w-full rounded-md border py-2 px-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500/30",
                      dateError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                    )}
                    placeholderText="Select start date"
                    showPopperArrow={false}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    todayButton="Today"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="col-span-1">
                <label htmlFor="endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>End Date</span>
                </label>
                <div className="relative">
                  <DatePicker
                    id="endDate"
                    selected={endDateObj}
                    onChange={(date) => setEndDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className={clsx(
                      "block w-full rounded-md border py-2 px-3 pl-10 text-sm focus:ring-2 focus:ring-blue-500/30",
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
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="col-span-1 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    setStartDateObj(today);
                    setEndDateObj(today);
                  }}
                  className="rounded-md bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"
                >
                  Set Today
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Apply Filter
                </button>
              </div>
            </form>
            
            {dateError && (
              <p className="mt-2 text-sm text-red-600">{dateError}</p>
            )}
            
            <div className="mt-3 text-sm text-blue-600">
              Showing {stocks.length} stocks from {formatDateToString(startDateObj)} to {formatDateToString(endDateObj)}
            </div>
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No stocks found for the selected date range.</p>
              <p className="text-gray-500 mt-2">Try selecting a wider date range to see more results.</p>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className={clsx(
                      "mb-3 w-full rounded-md bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer hover:bg-blue-50", 
                      {
                        "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/stocks/${stock.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="text-sm font-semibold">{stock.ticker}</p>
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
                          <span className="font-medium">Rule1 Score:</span> {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Moat Score:</span> {stock.moat_score !== null ? stock.moat_score : '-'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Management Score:</span> {stock.management_score !== null ? stock.management_score : '-'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Buy Price:</span> {formatCurrency(stock.buy_price)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Date:</span> {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                        </p>
                        <p className="mt-2">
                          <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </p>
                      </div>
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/stocks/${stock.id}`);
                          }}
                          className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-200"
                        >
                          View
                        </button>
                        <UpdateStock id={stock.id} />
                        <DeleteStock id={stock.id} />
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
                      <SortableHeader label="Ticker" field="ticker" />
                      <SortableHeader label="Sentiment" field="sentiment_score" />
                      <SortableHeader label="Signal" field="signal_score" />
                      <SortableHeader label="Rule1 Score" field="rule1_score" />
                      <SortableHeader label="Moat Score" field="moat_score" />
                      <SortableHeader label="Management Score" field="management_score" />
                      <SortableHeader label="Buy Price" field="buy_price" />
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Source
                      </th>
                      <th scope="col" className="px-3 py-4 font-medium text-blue-900">
                        Date
                      </th>
                      <th scope="col" className="relative py-3 pl-6 pr-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className={clsx(
                          "w-full py-3 text-sm hover:bg-blue-100 transition-colors duration-150 cursor-pointer border border-transparent hover:border-blue-300", 
                          {
                            "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                          }
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/stocks/${stock.id}`);
                        }}
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
                          {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {stock.moat_score !== null ? stock.moat_score : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {stock.management_score !== null ? stock.management_score : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-500">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          <div className="flex justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/stocks/${stock.id}`);
                              }}
                              className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-blue-200"
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

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon } from '@heroicons/react/24/outline';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/app/ui/datepicker-custom.css';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stocksapidashboard.duckdns.org/api';

// No pagination - show all items

// No pagination component needed

// Main component for highlighted stocks with date range
export default function HighlightedStocksWithDateRange({
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

  // Fetch highlighted stocks by date range
  useEffect(() => {
    const fetchHighlightedStocks = async () => {
      try {
        if (!startDateObj || !endDateObj) return;
        
        setLoading(true);
        
        // Format dates for API
        const formattedStart = formatDateToString(startDateObj);
        
        // Add one day to end date to include all records for that day
        const adjustedEndDate = new Date(endDateObj);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        const formattedEnd = formatDateToString(adjustedEndDate);
        
        // Use the API URL from environment variable
        const response = await fetch(`${API_URL}/stocks/highlighted/filter?startDate=${formattedStart}&endDate=${formattedEnd}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch highlighted stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Use the data directly without additional processing
        setStocks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching highlighted stocks:', err);
        setError('Failed to load highlighted stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlightedStocks();
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
              Highlighted Stocks ({formatDateToString(startDateObj)} - {formatDateToString(endDateObj)})
            </h2>
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
                    
                    // Auto-submit the form to apply the filter immediately
                    setTimeout(() => {
                      const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                      const params = new URLSearchParams();
                      params.set('startDate', formattedToday);
                      params.set('endDate', formattedToday);
                      router.push(`${pathname}?${params.toString()}`);
                    }, 100);
                  }}
                  className="rounded-md bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600 flex-grow"
                >
                  <span className="flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Today&apos;s Data
                  </span>
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
              Showing {stocks.length} highlighted stocks from {formatDateToString(startDateObj)} to {formatDateToString(endDateObj)}
            </div>
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No highlighted stocks found for the selected date range</p>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="mb-3 w-full rounded-md bg-white p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/highlighted/${stock.id}`);
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
                          <span className="font-medium">Sticker Price:</span> {formatCurrency(stock.buy_price)}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Last Price:</span> {stock.current_ratio}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Percentage Upside:</span> {stock.pe}
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
                      <SortableHeader label="Sticker Price" field="buy_price" />
                      <SortableHeader label="Last Price" field="current_ratio" />
                      <SortableHeader label="Percentage Upside" field="pe" />
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
                        className="w-full py-3 text-sm hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/highlighted/${stock.id}`);
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
                          {stock.current_ratio}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap">
                          {stock.pe}
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
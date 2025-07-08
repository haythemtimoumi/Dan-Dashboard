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
        
        // Set to end of the selected day (23:59:59.999)
        const adjustedEndDate = new Date(endDateObj);
        adjustedEndDate.setHours(23, 59, 59, 999);
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
    let valueA = a[sortBy as keyof Stock];
    let valueB = b[sortBy as keyof Stock];
    
    // Handle null/undefined/empty string values - always sort them to the end
    const isAEmpty = valueA === null || valueA === undefined || valueA === '' || valueA === 0;
    const isBEmpty = valueB === null || valueB === undefined || valueB === '' || valueB === 0;
    
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return 1; // A goes to end
    if (isBEmpty) return -1; // B goes to end
    
    // Convert to numbers if they are numeric strings or actual numbers
    if (typeof valueA === 'string' && !isNaN(Number(valueA))) {
      valueA = Number(valueA);
    }
    if (typeof valueB === 'string' && !isNaN(Number(valueB))) {
      valueB = Number(valueB);
    }
    
    // Handle numbers (including negative numbers)
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    // Handle strings
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    // Mixed types - convert to string for comparison
    const strA = String(valueA);
    const strB = String(valueB);
    return sortOrder === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });

  // Use all sorted stocks without pagination
  const paginatedStocks = sortedStocks;
  
  // Sortable header component
  const SortableHeader = ({ label, field }: { label: string; field: string }) => (
    <th 
      className={clsx(
        "px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
        sortBy === field ? "text-blue-600" : "text-gray-700"
      )}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{label}</span>
        {sortBy === field && (
          <span className="text-blue-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
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
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Featured Stocks</h2>
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
    <div className="flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold text-gray-900">Highlighted Stocks</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                {stocks.length}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDateToString(startDateObj)} - {formatDateToString(endDateObj)}
            </div>
          </div>
          
          {/* Date filter */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Date Filter</span>
            </div>
            <form onSubmit={handleDateFilterChange} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-32">
                <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                <div className="relative">
                  <DatePicker
                    selected={startDateObj}
                    onChange={(date) => setStartDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className="w-full rounded border border-gray-300 py-2 px-3 pl-8 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-32">
                <label className="block text-xs text-gray-600 mb-1">End Date</label>
                <div className="relative">
                  <DatePicker
                    selected={endDateObj}
                    onChange={(date) => setEndDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className="w-full rounded border border-gray-300 py-2 px-3 pl-8 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    minDate={startDateObj || undefined}
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setStartDateObj(today);
                  setEndDateObj(today);
                  setTimeout(() => {
                    const formattedToday = today.toISOString().split('T')[0];
                    const params = new URLSearchParams();
                    params.set('startDate', formattedToday);
                    params.set('endDate', formattedToday);
                    router.push(`${pathname}?${params.toString()}`);
                  }, 100);
                }}
                className="px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Today
              </button>
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </form>
            
            {dateError && (
              <div className="mt-2 text-red-600 text-xs">
                {dateError}
              </div>
            )}
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-blue-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Featured Stocks Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">No highlighted stocks were found for the selected date range. Try selecting a wider date range or different dates to see featured stocks.</p>
              <button
                onClick={() => {
                  const today = new Date();
                  setStartDateObj(today);
                  setEndDateObj(today);
                  
                  setTimeout(() => {
                    const formattedToday = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                    const params = new URLSearchParams();
                    params.set('startDate', formattedToday);
                    params.set('endDate', formattedToday);
                    router.push(`${pathname}?${params.toString()}`);
                  }, 100);
                }}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Today&apos;s Featured Stocks
              </button>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="w-full rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-blue-50 border border-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/highlighted/${stock.id}`);
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
                          <p className="text-xs text-gray-500 mb-1">Target Buy Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(stock.buy_price)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Sticker Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(stock.buy_price * 2)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Price</p>
                          <p className="text-lg font-semibold">{stock.current_ratio}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Saved Composite GR</p>
                          <p className="text-lg font-semibold">{stock.dividend || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Analyst Estimated Long-Term GR</p>
                          <p className="text-lg font-semibold">{stock.cash_per_share || '-'}</p>
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
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/highlighted/${stock.id}`);
                            }}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-gray-900 text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      <SortableHeader label="Ticker" field="ticker" />
                      <SortableHeader label="Sentiment" field="sentiment_score" />
                      <SortableHeader label="Signal" field="signal_score" />
                      <SortableHeader label="Rule1 Score" field="rule1_score" />
                      <SortableHeader label="Moat Score" field="moat_score" />
                      <SortableHeader label="Management Score" field="management_score" />
                      <SortableHeader label="Target Buy Price" field="buy_price" />
                      <th className="px-3 py-2 text-gray-700">Sticker Price</th>
                      <SortableHeader label="Last Price" field="current_ratio" />
                      <SortableHeader label="% Upside" field="pe" />
                      <SortableHeader label="Composite GR" field="dividend" />
                      <SortableHeader label="Est. Long-Term GR" field="cash_per_share" />
                      <th className="px-3 py-2 text-gray-700">Source</th>
                      <th className="px-3 py-2 text-gray-700">Date</th>
                      <th className="px-3 py-2 text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/highlighted/${stock.id}`);
                        }}
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{stock.ticker}</div>
                          <div className="text-xs text-gray-500">{stock.guru}</div>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "px-2 py-1 rounded text-xs font-medium"
                          )}>
                            {stock.sentiment_score}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.signal_score),
                            "px-2 py-1 rounded text-xs font-medium"
                          )}>
                            {stock.signal_score}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.moat_score !== null ? stock.moat_score : '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.management_score !== null ? stock.management_score : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(stock.buy_price * 2)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {stock.current_ratio}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.pe}%
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.dividend || '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stock.cash_per_share || '-'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={clsx("px-2 py-1 rounded text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/highlighted/${stock.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                          >
                            View
                          </button>
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
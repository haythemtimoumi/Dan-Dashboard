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
import { useSettings } from '@/app/contexts/settings-context';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stockdashboard.ddnsfree.com/api';

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
  const { t } = useSettings();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // No pagination state needed
  const [startDateObj, setStartDateObj] = useState<Date | null>(parseDate(startDate));
  const [endDateObj, setEndDateObj] = useState<Date | null>(parseDate(endDate));
  const [dateError, setDateError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('sentiment_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [stockColors, setStockColors] = useState<{[key: string]: string}>({});
  const [stockComments, setStockComments] = useState<{[key: string]: string}>({});
  const [commentHistory, setCommentHistory] = useState<{[ticker: string]: {text: string, date: string, color?: string}[]}>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [showColorModal, setShowColorModal] = useState<string | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedColors = localStorage.getItem('stockColors');
    const savedComments = localStorage.getItem('stockComments');
    const savedHistory = localStorage.getItem('tickerCommentHistory');
    if (savedColors) setStockColors(JSON.parse(savedColors));
    if (savedComments) setStockComments(JSON.parse(savedComments));
    if (savedHistory) {
      setCommentHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save color change to localStorage
  const handleColorChange = (stockId: string, color: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const newColors = { ...stockColors, [key]: color };
    setStockColors(newColors);
    localStorage.setItem('stockColors', JSON.stringify(newColors));
    setShowColorModal(null);
  };

  const cycleColor = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const currentColor = stockColors[key] || '';
    const colors = ['', 'red', 'green', 'yellow'];
    const currentIndex = colors.indexOf(currentColor);
    const nextColor = colors[(currentIndex + 1) % colors.length];
    handleColorChange(stockId, nextColor);
  };

  // Save comment change to localStorage
  const handleCommentSave = (stockId: string, comment: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const newComments = { ...stockComments, [key]: comment };
    setStockComments(newComments);
    localStorage.setItem('stockComments', JSON.stringify(newComments));
    
    // Add to ticker-specific history if not empty and not already exists
    if (comment.trim()) {
      const tickerHistory = commentHistory[key] || [];
      if (!tickerHistory.some(h => h.text === comment.trim())) {
        const currentColor = stockColors[key] || '';
        const newHistoryItem = { text: comment.trim(), date: new Date().toISOString(), color: currentColor };
        const updatedTickerHistory = [newHistoryItem, ...tickerHistory].slice(0, 5); // Keep last 5 per ticker
        const newHistory = { ...commentHistory, [key]: updatedTickerHistory };
        setCommentHistory(newHistory);
        localStorage.setItem('tickerCommentHistory', JSON.stringify(newHistory));
      }
    }
    
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = (stockId: string) => {
    setCurrentComment('');
    setShowCommentModal(stockId);
  };

  const deleteHistoryItem = (ticker: string, index: number) => {
    const tickerHistory = commentHistory[ticker] || [];
    const updatedTickerHistory = tickerHistory.filter((_, i) => i !== index);
    const newHistory = { ...commentHistory, [ticker]: updatedTickerHistory };
    setCommentHistory(newHistory);
    localStorage.setItem('tickerCommentHistory', JSON.stringify(newHistory));
  };

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
        "px-2 py-2 cursor-pointer hover:bg-white/50 transition-all duration-200 text-xs",
        sortBy === field ? "text-blue-600 bg-white/30" : "text-gray-700"
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
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700">
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
      <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-900/20 p-8 text-center shadow-md border border-red-100 dark:border-red-800">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">Error Loading Featured Stocks</h2>
        <p className="text-red-700 dark:text-red-300 max-w-md mx-auto">{error}</p>
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
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Featured Stocks</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Highlighted investment opportunities</p>
              </div>
              <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                {stocks.length} stocks
              </span>
            </div>
            <div className="text-sm text-black dark:text-black bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
              {formatDateToString(startDateObj)} - {formatDateToString(endDateObj)}
            </div>
          </div>
          
          {/* Date filter */}
          <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Filter by Date Range</span>
            </div>
            <form onSubmit={handleDateFilterChange} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-32">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                <div className="relative">
                  <DatePicker
                    selected={startDateObj}
                    onChange={(date) => setStartDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 py-2 px-3 pl-8 text-sm bg-white dark:bg-gray-700 text-white dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                  <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-32">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                <div className="relative">
                  <DatePicker
                    selected={endDateObj}
                    onChange={(date) => setEndDateObj(date)}
                    dateFormat="MM/dd/yyyy"
                    className="w-full rounded border border-gray-300 dark:border-gray-600 py-2 px-3 pl-8 text-sm bg-white dark:bg-gray-700 text-white dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">PBT</p>
                          <p className="text-lg font-semibold">{stock.guru || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleColor(stock.id);
                              }}
                              className={clsx(
                                "p-1 rounded hover:bg-gray-100 transition-colors",
                                stockColors[stock.ticker] === 'red' && 'text-red-500',
                                stockColors[stock.ticker] === 'green' && 'text-green-500',
                                stockColors[stock.ticker] === 'yellow' && 'text-yellow-500',
                                !stockColors[stock.ticker] && 'text-gray-400'
                              )}
                              title="Click to change color"
                            >
                              {stock.source === 'manual' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
                                  <path d="M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
                                  <path d="M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9z" />
                                  <circle cx="12" cy="8" r="1.5" />
                                  <circle cx="8" cy="12" r="1.5" />
                                  <circle cx="16" cy="12" r="1.5" />
                                  <circle cx="12" cy="16" r="1.5" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        {(stockComments[stock.ticker] || stockColors[stock.ticker]) && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            {stockColors[stock.ticker] && (
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs text-gray-500">Color:</span>
                                <span className={clsx("inline-block w-3 h-3 rounded-full", 
                                  stockColors[stock.ticker] === 'red' && 'bg-red-400',
                                  stockColors[stock.ticker] === 'green' && 'bg-green-400',
                                  stockColors[stock.ticker] === 'yellow' && 'bg-yellow-400'
                                )}></span>
                              </div>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(stock.id);
                              }}
                              className={clsx(
                                "text-xs border rounded-lg px-3 py-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200",
                                stockComments[stock.ticker] ? "text-gray-900 bg-blue-50 border-blue-200 hover:bg-blue-100" : "text-gray-400 hover:bg-gray-50"
                              )}
                            >
                              {stockComments[stock.ticker] || "Add comment..."}
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-gray-900 text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-2 py-2 text-center text-gray-700">Color</th>
                      <th className="px-2 py-2 text-left text-gray-700">Comment</th>
                      <th className="px-2 py-2 text-left text-gray-700 cursor-pointer" onClick={() => handleSort('ticker')}>
                        <div className="flex items-center gap-1">
                          <span>Ticker</span>
                          {sortBy === 'ticker' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('sentiment_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Sentiment</span>
                          {sortBy === 'sentiment_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('signal_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Signal</span>
                          {sortBy === 'signal_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('rule1_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Rule1</span>
                          {sortBy === 'rule1_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('moat_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Moat</span>
                          {sortBy === 'moat_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('management_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Mgmt</span>
                          {sortBy === 'management_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-right text-gray-700 cursor-pointer" onClick={() => handleSort('buy_price')}>
                        <div className="flex items-center justify-end gap-1">
                          <span>Buy</span>
                          {sortBy === 'buy_price' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-right text-gray-700">Sticker</th>
                      <th className="px-2 py-2 text-right text-gray-700 cursor-pointer" onClick={() => handleSort('current_ratio')}>
                        <div className="flex items-center justify-end gap-1">
                          <span>Price</span>
                          {sortBy === 'current_ratio' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('pe')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Upside</span>
                          {sortBy === 'pe' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('dividend')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Comp</span>
                          {sortBy === 'dividend' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('cash_per_share')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Growth</span>
                          {sortBy === 'cash_per_share' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer" onClick={() => handleSort('guru')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>PBT</span>
                          {sortBy === 'guru' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-left text-gray-700">Source</th>
                      <th className="px-2 py-2 text-left text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className={clsx(
                          "cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0",
                          stockColors[stock.ticker] === 'red' && 'bg-red-50 hover:bg-red-100',
                          stockColors[stock.ticker] === 'green' && 'bg-green-50 hover:bg-green-100',
                          stockColors[stock.ticker] === 'yellow' && 'bg-yellow-50 hover:bg-yellow-100',
                          !stockColors[stock.ticker] && 'hover:bg-blue-50/50'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/highlighted/${stock.id}`);
                        }}
                      >
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleColor(stock.id);
                            }}
                            className={clsx(
                              "p-1 rounded hover:bg-gray-100 transition-colors",
                              stockColors[stock.ticker] === 'red' && 'text-red-500',
                              stockColors[stock.ticker] === 'green' && 'text-green-500',
                              stockColors[stock.ticker] === 'yellow' && 'text-yellow-500',
                              !stockColors[stock.ticker] && 'text-gray-400'
                            )}
                            title="Click to change color"
                          >
                            {stock.source === 'manual' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z" />
                                <circle cx="12" cy="9" r="2" />
                                <path d="M8 9h1m6 0h1" />
                              </svg>
                            )}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <div className="relative group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(stock.id);
                              }}
                              className={clsx(
                                "p-1 rounded hover:bg-gray-100 transition-colors",
                                stockComments[stock.ticker] ? "text-blue-600" : "text-gray-400"
                              )}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            {stockComments[stock.ticker] && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs whitespace-normal">
                                <div className="break-words">{stockComments[stock.ticker]}</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <div className="font-medium text-gray-900 text-sm">{stock.ticker}</div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "px-1.5 py-0.5 rounded text-xs font-medium"
                          )}>
                            {stock.sentiment_score}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.signal_score),
                            "px-1.5 py-0.5 rounded text-xs font-medium"
                          )}>
                            {stock.signal_score}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.moat_score !== null ? stock.moat_score : '-'}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.management_score !== null ? stock.management_score : '-'}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {formatCurrency(stock.buy_price * 2)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {stock.current_ratio}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.pe}%
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.dividend || '-'}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.cash_per_share || '-'}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.guru || '-'}
                        </td>
                        <td className="px-2 py-2">
                          <span className={clsx("px-1.5 py-0.5 rounded text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-500">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toLocaleDateString() : '-'}
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
      
      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCommentModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Comment</h3>
                  <p className="text-sm text-gray-500">Share your thoughts about this stock</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment</label>
                  <textarea
                    value={currentComment}
                    onChange={(e) => setCurrentComment(e.target.value)}
                    placeholder="What are your thoughts on this stock?"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    rows={4}
                  />
                </div>
                
                {(() => {
                  const stock = stocks.find(s => s.id === showCommentModal);
                  const ticker = stock?.ticker;
                  const hasExistingComment = ticker && stockComments[ticker];
                  const tickerHistory = ticker ? (commentHistory[ticker] || []) : [];
                  return hasExistingComment && tickerHistory.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Recent Comments for {ticker}</label>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {tickerHistory.map((item, index) => (
                          <div key={index} className={clsx(
                            "group flex items-start gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer",
                            item.color === 'red' && 'bg-red-50 hover:bg-red-100 border border-red-200',
                            item.color === 'green' && 'bg-green-50 hover:bg-green-100 border border-green-200',
                            item.color === 'yellow' && 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200',
                            !item.color && 'bg-gray-50 hover:bg-blue-50'
                          )} onClick={() => setCurrentComment(item.text)}>
                            <div className={clsx(
                              "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow",
                              item.color === 'red' && 'bg-red-100',
                              item.color === 'green' && 'bg-green-100',
                              item.color === 'yellow' && 'bg-yellow-100',
                              !item.color && 'bg-white'
                            )}>
                              <svg xmlns="http://www.w3.org/2000/svg" className={clsx(
                                "h-4 w-4 transition-colors",
                                item.color === 'red' && 'text-red-500 group-hover:text-red-600',
                                item.color === 'green' && 'text-green-500 group-hover:text-green-600',
                                item.color === 'yellow' && 'text-yellow-500 group-hover:text-yellow-600',
                                !item.color && 'text-gray-400 group-hover:text-blue-500'
                              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 line-clamp-2">{item.text}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryItem(ticker, index);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition-all duration-200"
                              title="Delete"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleCommentSave(showCommentModal, currentComment)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Comment
                </button>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
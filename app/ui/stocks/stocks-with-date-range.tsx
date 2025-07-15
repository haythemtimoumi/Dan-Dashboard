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
const API_URL = 'http://locahost:3000/api';

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
          setError('Unable to connect to the API server at http://locahost:3000. Please ensure the backend is running and CORS is properly configured.');
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
    <div className="mt-6 space-y-8">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    Stock Portfolio
                  </h1>
                  <p className="text-blue-200/80 text-lg">
                    Advanced Analytics & Investment Tracking
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <span className="text-sm font-medium text-blue-200">Period: {formatDateToString(startDateObj)} - {formatDateToString(endDateObj)}</span>
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-emerald-400/30">
                  <span className="text-sm font-medium text-emerald-200">{stocks.length} Active Positions</span>
                </div>
                <div className="bg-amber-500/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-amber-400/30">
                  <span className="text-sm font-medium text-amber-200">{stocks.filter(s => s.highlight).length} Featured</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <CreateStock />
              <button className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/20 transition-all duration-200 group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100/50 overflow-hidden">
          
        {/* Enhanced Date Filter Section */}
        <div className="p-8 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Date Range Filter</h3>
                <p className="text-gray-600 text-sm">Analyze portfolio performance across specific time periods</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleDateFilterChange} className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="lg:col-span-1">
              <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-3">
                Start Date
              </label>
              <div className="relative group">
                <DatePicker
                  id="startDate"
                  selected={startDateObj}
                  onChange={(date) => setStartDateObj(date)}
                  dateFormat="MM/dd/yyyy"
                  className={clsx(
                    "block w-full rounded-xl border-2 py-3 px-4 pl-12 text-sm font-medium shadow-sm transition-all duration-200 bg-white/80 backdrop-blur-sm",
                    dateError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 group-hover:border-blue-300"
                  )}
                  placeholderText="Select start date"
                  showPopperArrow={false}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  todayButton="Today"
                />
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-3">
                End Date
              </label>
              <div className="relative group">
                <DatePicker
                  id="endDate"
                  selected={endDateObj}
                  onChange={(date) => setEndDateObj(date)}
                  dateFormat="MM/dd/yyyy"
                  className={clsx(
                    "block w-full rounded-xl border-2 py-3 px-4 pl-12 text-sm font-medium shadow-sm transition-all duration-200 bg-white/80 backdrop-blur-sm",
                    dateError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 group-hover:border-blue-300"
                  )}
                  placeholderText="Select end date"
                  showPopperArrow={false}
                  minDate={startDateObj || undefined}
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  todayButton="Today"
                />
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
            
            <div className="lg:col-span-2 flex flex-col justify-end">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
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
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Today&apos;s Data
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Apply Filter
                </button>
              </div>
            </div>
          </form>
            
          {dateError && (
            <div className="mt-4 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-400 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-1 bg-red-100 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-700 font-medium">{dateError}</p>
              </div>
            </div>
          )}
        </div>
          
          {stocks.length === 0 ? (
            <div className="py-20 text-center">
              <div className="relative inline-flex items-center justify-center mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full blur-xl opacity-60"></div>
                <div className="relative h-24 w-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Stocks Found</h3>
              <p className="text-gray-600 max-w-lg mx-auto mb-8 text-lg leading-relaxed">
                No stocks were found for the selected date range. Try expanding your search criteria or explore today&apos;s market data.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  View Today&apos;s Stocks
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:border-gray-400 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Enhanced Mobile View */}
              <div className="lg:hidden p-6 space-y-6">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className={clsx(
                      "relative overflow-hidden rounded-2xl bg-white shadow-xl border transition-all duration-300 cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl", 
                      {
                        "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 shadow-amber-100": stock.highlight,
                        "border-gray-200 hover:border-blue-300": !stock.highlight
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/stocks/${stock.id}`);
                    }}
                  >
                    {stock.highlight && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="h-6 w-6 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {stock.ticker.substring(0, 2)}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{stock.ticker}</h3>
                            <p className="text-sm text-gray-600 font-medium">{stock.guru}</p>
                          </div>
                        </div>
                        <div className={clsx(
                          getSentimentColor(stock.sentiment_score),
                          "px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2"
                        )}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {stock.sentiment_score}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs font-semibold text-blue-600 mb-2">Signal Score</p>
                          <p className="text-xl font-bold text-gray-900">{stock.signal_score}</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                          <p className="text-xs font-semibold text-purple-600 mb-2">Rule1 Score</p>
                          <p className="text-xl font-bold text-gray-900">{stock.rule1_score !== null ? stock.rule1_score : '—'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                          <p className="text-xs font-semibold text-emerald-600 mb-2">Target Buy Price</p>
                          <p className="text-xl font-bold text-emerald-700">{formatCurrency(stock.buy_price)}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                          <p className="text-xs font-semibold text-blue-600 mb-2">Sticker Price</p>
                          <p className="text-xl font-bold text-blue-700">{formatCurrency(stock.buy_price * 2)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-xs font-semibold text-gray-600 mb-2">Last Price</p>
                          <p className="text-xl font-bold text-gray-900">{stock.current_ratio || '—'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-100">
                          <p className="text-xs font-semibold text-amber-600 mb-2">Upside %</p>
                          <p className="text-xl font-bold text-amber-700">{stock.pe}%</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className={clsx("inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold shadow-sm", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                          <div className="text-xs text-gray-600 font-medium bg-gray-100 px-3 py-2 rounded-lg">
                            {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                          </div>
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/stocks/${stock.id}`);
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-0.5"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
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
              
              {/* Enhanced Desktop Table */}
              <div className="hidden lg:block">
                <div className="overflow-hidden rounded-2xl border border-gray-200/50 shadow-xl bg-white">
                  <table className="min-w-full text-gray-900">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 border-b border-gray-200/50">
                      <SortableHeader label="Ticker" field="ticker" />
                      <SortableHeader label="Source" field="source" />
                      <SortableHeader label="Date" field="created_at" />
                      <SortableHeader label="Sentiment" field="sentiment_score" />
                      <SortableHeader label="Signal" field="signal_score" />
                      <SortableHeader label="Rule1 Score" field="rule1_score" />
                      <SortableHeader label="Moat Score" field="moat_score" />
                      <SortableHeader label="Management Score" field="management_score" />
                      <SortableHeader label="Target Buy Price" field="buy_price" />
                      <SortableHeader label="Sticker Price" field="buy_price" />
                      <SortableHeader label="Last Price" field="current_ratio" />
                      <SortableHeader label="Percentage Upside" field="pe" />
                      <th scope="col" className="relative py-3 pl-6 pr-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                    <tbody className="bg-white divide-y divide-gray-100/50">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className={clsx(
                          "group text-sm transition-all duration-300 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 hover:shadow-lg", 
                          {
                            "bg-gradient-to-r from-amber-50/80 to-yellow-50/60 border-l-4 border-amber-400 shadow-sm": stock.highlight
                          }
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/stocks/${stock.id}`);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                                {stock.ticker.substring(0, 2)}
                              </div>
                              {stock.highlight && (
                                <div className="absolute -top-1 -right-1 h-4 w-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-base">{stock.ticker}</p>
                              <p className="text-sm text-gray-600 font-medium">{stock.guru}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx("inline-flex items-center rounded-xl px-3 py-2 text-xs font-bold shadow-sm", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-medium">
                            {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : <span className="text-gray-400">No date</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold shadow-sm min-w-[60px] justify-center"
                          )}>
                            {stock.sentiment_score}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={clsx(
                            getSentimentColor(stock.signal_score),
                            "inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold shadow-sm min-w-[60px] justify-center"
                          )}>
                            {stock.signal_score}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {stock.rule1_score !== null ? stock.rule1_score : <span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {stock.moat_score !== null ? stock.moat_score : <span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {stock.management_score !== null ? stock.management_score : <span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                            {formatCurrency(stock.buy_price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                            {formatCurrency(stock.buy_price * 2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {stock.current_ratio || <span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-purple-700">
                            {stock.pe}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-gray-900">
                            {stock.current_ratio || <span className="text-gray-400">—</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-bold text-purple-700">
                            {stock.pe}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/stocks/${stock.id}`);
                              }}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-0.5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
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
              </div>

              {/* No pagination */}
            </>
          )}
        </div>
      </div>
  );
}

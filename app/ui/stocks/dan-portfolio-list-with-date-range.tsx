'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatLargeNumber } from '@/app/lib/utils';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import DatePickerInput from '@/app/ui/date-picker';
import { formatDateForPortfolioAPI, getTodayLocal, addDays, subtractDays } from '@/app/lib/date-utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
//const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function PortfolioListWithDateRange() {
  const router = useRouter();
  const { t, language } = useSettings();
  const { isAdmin } = useAuth();
  
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('sentiment_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [stockColors, setStockColors] = useState<{[key: string]: string}>({});
  const [stockComments, setStockComments] = useState<{[key: string]: string}>({});
  const [commentHistory, setCommentHistory] = useState<{[ticker: string]: {text: string, date: string, color?: string}[]}>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [showColorModal, setShowColorModal] = useState<string | null>(null);
  const [deletingStocks, setDeletingStocks] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(getTodayLocal());
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addingStock, setAddingStock] = useState<boolean>(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, countdown: number, undoData?: any}>({show: false, message: '', countdown: 0});
  const [flipAnimations, setFlipAnimations] = useState<Set<string>>(new Set());
  const [newStock, setNewStock] = useState<{
    ticker: string;
    sentiment_score: number;
    signal_score: number;
    rule1_score: number | null;
    moat_score: number | null;
    management_score: number | null;
    buy_price: string;
    pe: string;
    dividend: string;
    cash_per_share: string;
    current_ratio: string;
    guru: string;
    // New API fields
    last_price: string;
    per_upside: string;
    last_gr: string;
    long_gr: string;
    pbt: string;
    last_action?: string;
    per_portfolio?: number;
  }>({
    ticker: '',
    sentiment_score: 0,
    signal_score: 0,
    rule1_score: null,
    moat_score: null,
    management_score: null,
    buy_price: '',
    pe: '',
    dividend: '',
    cash_per_share: '',
    current_ratio: '',
    guru: '',
    // New API fields with empty defaults
    last_price: '',
    per_upside: '',
    last_gr: '',
    long_gr: '',
    pbt: '',
    last_action: '',
    per_portfolio: undefined
  });

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

  const handleDeleteStock = async (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;

    // Start flip animation
    setFlipAnimations(prev => new Set(prev).add(stockId));
    
    // Wait for flip animation
    setTimeout(async () => {
      setFlipAnimations(prev => {
        const newSet = new Set(prev);
        newSet.delete(stockId);
        return newSet;
      });
      
      setDeletingStocks(prev => new Set(prev).add(stockId));

      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`/api/stocks/${stockId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to delete stock: ${response.statusText}`);
        }

        // Remove from local state
        setStocks(prev => prev.filter(s => s.id !== stockId));
        
        // Show notification with undo option
        showDeleteNotification(stock);
        
      } catch (error) {
        console.error('Error deleting stock:', error);
      } finally {
        setDeletingStocks(prev => {
          const newSet = new Set(prev);
          newSet.delete(stockId);
          return newSet;
        });
      }
    }, 600); // Wait for flip animation to complete
  };

  const showDeleteNotification = (deletedStock: any) => {
    setNotification({
      show: true,
      message: `${deletedStock.ticker} deleted`,
      countdown: 5,
      undoData: deletedStock
    });
    
    // Start countdown
    const interval = setInterval(() => {
      setNotification(prev => {
        if (prev.countdown <= 1) {
          clearInterval(interval);
          return {show: false, message: '', countdown: 0};
        }
        return {...prev, countdown: prev.countdown - 1};
      });
    }, 1000);
  };

  const handleUndo = async () => {
    if (!notification.undoData) return;
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const stockData = {
        ...notification.undoData,
        source: 'dan_portfolio_list',
        date: selectedDate ? formatDateForPortfolioAPI(selectedDate) : formatDateForPortfolioAPI(getTodayLocal())
      };
      
      // Map old fields to new fields for API compatibility
      if (stockData.current_ratio && !stockData.last_price) stockData.last_price = stockData.current_ratio;
      if (stockData.pe && !stockData.per_upside) stockData.per_upside = stockData.pe;
      if (stockData.dividend && !stockData.last_gr) stockData.last_gr = stockData.dividend;
      if (stockData.cash_per_share && !stockData.long_gr) stockData.long_gr = stockData.cash_per_share;
      if (stockData.guru && !stockData.pbt) stockData.pbt = stockData.guru;
      delete stockData.id; // Remove ID to create new entry

      const response = await fetch(`${API_URL}/stocks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(stockData)
      });

      if (response.ok) {
        const restoredStock = await response.json();
        setStocks(prev => [restoredStock, ...prev]);
        setNotification({show: false, message: '', countdown: 0});
      }
    } catch (error) {
      console.error('Error restoring stock:', error);
    }
  };

  function formatDateToString(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const goToToday = () => {
    setSelectedDate(getTodayLocal());
  };

  const goToPreviousDay = () => {
    if (selectedDate) {
      setSelectedDate(subtractDays(selectedDate, 1));
    }
  };

  const goToNextDay = () => {
    if (selectedDate) {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  const handleAddStock = async () => {
    if (!newStock.ticker.trim()) {
      return;
    }

    setAddingStock(true);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const stockData: any = {
        ticker: newStock.ticker.toUpperCase(),
        source: 'dan_portfolio_list',
        sentiment_score: newStock.sentiment_score,
        signal_score: newStock.signal_score,
        date: selectedDate ? formatDateForPortfolioAPI(selectedDate) : formatDateForPortfolioAPI(getTodayLocal())
      };
      
      // Only include optional fields if they have values
      if (newStock.rule1_score !== null && newStock.rule1_score !== undefined) stockData.rule1_score = newStock.rule1_score;
      if (newStock.moat_score !== null && newStock.moat_score !== undefined) stockData.moat_score = newStock.moat_score;
      if (newStock.management_score !== null && newStock.management_score !== undefined) stockData.management_score = newStock.management_score;
      if (newStock.buy_price && newStock.buy_price.trim()) stockData.buy_price = newStock.buy_price;
      
      // Include both old and new API fields for compatibility
      if (newStock.pe && newStock.pe.trim()) {
        stockData.pe = newStock.pe;
        stockData.per_upside = newStock.pe; // New field
      }
      if (newStock.dividend && newStock.dividend.trim()) {
        stockData.dividend = newStock.dividend;
        stockData.last_gr = newStock.dividend; // New field
      }
      if (newStock.cash_per_share && newStock.cash_per_share.trim()) {
        stockData.cash_per_share = newStock.cash_per_share;
        stockData.long_gr = newStock.cash_per_share; // New field
      }
      if (newStock.current_ratio && newStock.current_ratio.trim()) {
        stockData.current_ratio = newStock.current_ratio;
        stockData.last_price = newStock.current_ratio; // New field
      }
      if (newStock.guru && newStock.guru.trim()) {
        stockData.guru = newStock.guru;
        stockData.pbt = newStock.guru; // New field
      }
      
      // Also include new fields if they have values directly
      if (newStock.last_price && newStock.last_price.trim()) stockData.last_price = newStock.last_price;
      if (newStock.per_upside && newStock.per_upside.trim()) stockData.per_upside = newStock.per_upside;
      if (newStock.last_gr && newStock.last_gr.trim()) stockData.last_gr = newStock.last_gr;
      if (newStock.long_gr && newStock.long_gr.trim()) stockData.long_gr = newStock.long_gr;
      if (newStock.pbt && newStock.pbt.trim()) stockData.pbt = newStock.pbt;
      if (newStock.last_action && newStock.last_action.trim()) stockData.last_action = newStock.last_action;
      if (newStock.per_portfolio !== undefined) stockData.per_portfolio = newStock.per_portfolio;

      const response = await fetch(`${API_URL}/stocks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(stockData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 || response.status === 401) {
          setNotification({
            show: true,
            message: 'Admin access required. Please log in as an admin user.',
            countdown: 5
          });
          setTimeout(() => setNotification({show: false, message: '', countdown: 0}), 5000);
          return;
        }
        if (response.status === 400 && errorData.errors) {
          const tickerError = errorData.errors.find((e: any) => e.path === 'ticker');
          if (tickerError) {
            setNotification({
              show: true,
              message: `Invalid ticker: Please use a valid stock symbol (e.g., AAPL, MSFT, GOOGL)`,
              countdown: 5
            });
            setTimeout(() => setNotification({show: false, message: '', countdown: 0}), 5000);
            return;
          }
        }
        throw new Error(errorData.message || `Failed to add stock: ${response.statusText}`);
      }

      const addedStock = await response.json();
      setStocks(prev => [addedStock, ...prev]);
      setShowAddModal(false);
      setNewStock({
        ticker: '',
        sentiment_score: 0,
        signal_score: 0,
        rule1_score: null,
        moat_score: null,
        management_score: null,
        buy_price: '',
        pe: '',
        dividend: '',
        cash_per_share: '',
        current_ratio: '',
        guru: '',
        // New API fields with empty defaults
        last_price: '',
        per_upside: '',
        last_gr: '',
        long_gr: '',
        pbt: '',
        last_action: '',
        per_portfolio: undefined
      });
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setAddingStock(false);
    }
  };

  useEffect(() => {
    const fetchPortfolioStocks = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        
        // Format date for the API using utility function with UTC noon approach
        const formattedDate = formatDateForPortfolioAPI(selectedDate);
        
        console.log(`Fetching portfolio stocks for date: ${formattedDate} (timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone})`);
        
        // First, try fetching all stocks to see if the API is working
        console.log('Testing API connection by fetching all stocks...');
        const testResponse = await fetch(`${API_URL}/stocks`);
        console.log('Test response status:', testResponse.status);
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`API is working. Found ${Array.isArray(testData) ? testData.length : 'unknown number of'} stocks in total`);
        } else {
          console.error('API test failed. Status:', testResponse.status);
        }
        
        // Try fetching with the specific source first
        const url = `${API_URL}/stocks/filter-by-date-source?date=${formattedDate}&source=dan_portfolio_list`;
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API response data:', data);
        
        // Handle different response formats
        let stocksData = [];
        if (data && data.stocks) {
          stocksData = data.stocks;
        } else if (Array.isArray(data)) {
          stocksData = data;
        } else if (data && typeof data === 'object') {
          // If data is an object but not in the expected format, try to extract stocks
          console.log('Data is an object but not in expected format, trying to extract stocks');
          if (data.data && Array.isArray(data.data)) {
            stocksData = data.data;
            console.log('Found stocks in data.data:', stocksData.length);
          } else if (data.results && Array.isArray(data.results)) {
            stocksData = data.results;
            console.log('Found stocks in data.results:', stocksData.length);
          } else {
            console.log('Could not find stocks array in response');
          }
        }
        
        console.log(`Found ${stocksData.length} portfolio stocks for ${formattedDate}`);
        
        // If no stocks found with dan_portfolio_list source, just show empty state
        if (stocksData.length === 0) {
          console.log('No dan_portfolio_list stocks found for the selected date');
          // Don't try to fetch all stocks - just leave stocksData as empty array
        }
        
        setStocks(stocksData);
        setError(null);
      } catch (err) {
        console.error('Error fetching portfolio stocks:', err);
        setError('Failed to load portfolio stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioStocks();
  }, [selectedDate]);



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
    // Note: 0 and negative numbers are NOT considered empty
    const isAEmpty = valueA === null || valueA === undefined || valueA === '';
    const isBEmpty = valueB === null || valueB === undefined || valueB === '';
    
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return 1; // A goes to end
    if (isBEmpty) return -1; // B goes to end
    
    // Special handling for buy_price field which may contain commas
    if (sortBy === 'buy_price') {
      // Remove commas and $ signs, then convert to number
      const numA = typeof valueA === 'string' ? Number(valueA.replace(/[$,]/g, '')) : Number(valueA);
      const numB = typeof valueB === 'string' ? Number(valueB.replace(/[$,]/g, '')) : Number(valueB);
      
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }
    }
    
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

  const paginatedStocks = sortedStocks;

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
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">{t('errorLoadingPortfolio')}</h2>
        <p className="text-red-700 dark:text-red-300 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {t('tryAgain')}
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
              <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('portfolioList')}</h1>
              </div>
              <span className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                {stocks.length} {t('stocks')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Stock
                </button>
              )}
              <button onClick={goToPreviousDay} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="min-w-[140px]">
                <DatePickerInput selectedDate={selectedDate} onChange={handleDateChange} placeholder="Select date..." />
              </div>
              <button onClick={goToNextDay} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button onClick={goToToday} className="px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs hover:bg-gray-800 dark:hover:bg-gray-200">
                {t('today')}
              </button>
            </div>
          </div>
          
          {/* Average Metrics */}
          {stocks.length > 0 && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('averageSentiment')}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(stocks.reduce((sum, stock) => sum + (stock.sentiment_score || 0), 0) / stocks.length).toFixed(1)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('averageUpside')}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(stocks.reduce((sum, stock) => {
                      // Use per_upside if available, otherwise fall back to pe
                      const value = stock.per_upside || stock.pe;
                      return sum + (typeof value === 'string' ? parseFloat(value) : value || 0);
                    }, 0) / stocks.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}
          

          
          {stocks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('noPortfolioStocksFound')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">No portfolio stocks were found for the selected date range or source. Try selecting a wider date range or different date.</p>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="w-full rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-green-50 border border-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/highlighted/${stock.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
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
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.signal_score)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Rule1 Score</p>
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.rule1_score)}</p>
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
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.last_price || stock.current_ratio)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Saved Composite GR</p>
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.last_gr || stock.dividend)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Analyst Estimated Long-Term GR</p>
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.long_gr || stock.cash_per_share)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">PBT</p>
                          <p className="text-lg font-semibold">{formatLargeNumber(stock.pbt || stock.guru)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Action</p>
                          <p className="text-lg font-semibold">{stock.last_action || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">% Portfolio</p>
                          <p className="text-lg font-semibold">{stock.per_portfolio ? (String(stock.per_portfolio).endsWith('%') ? stock.per_portfolio : `${stock.per_portfolio}%`) : '-'}</p>
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
                              {(stock.date || stock.created_at) ? (stock.date || stock.created_at).split('T')[0] : 'No date'}
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
                              {stock.source === 'dan_portfolio_list' ? (
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
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStock(stock.id);
                                }}
                                disabled={deletingStocks.has(stock.id)}
                                className="p-1 rounded hover:bg-red-100 transition-all duration-300 text-red-500 hover:text-red-700 disabled:opacity-50"
                                title={t('deleteStock') || 'Delete stock'}
                              >
                                {deletingStocks.has(stock.id) ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}
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
                                "text-xs border rounded-lg px-3 py-2 w-full text-left focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200",
                                stockComments[stock.ticker] ? "text-gray-900 bg-green-50 border-green-200 hover:bg-green-100" : "text-gray-400 hover:bg-gray-50"
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
                    <tr className="bg-gradient-to-r from-gray-50 to-green-50 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-2 py-2 text-center text-gray-700">Actions</th>
                      <th className="px-2 py-2 text-left text-gray-700">Comment</th>
                      <th className="px-2 py-2 text-left text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('ticker')}>
                        <div className="flex items-center gap-1">
                          <span>Ticker</span>
                          {sortBy === 'ticker' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-left text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('guru')}>
                        <div className="flex items-center gap-1">
                          <span>Guru</span>
                          {sortBy === 'guru' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('sentiment_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Sentiment</span>
                          {sortBy === 'sentiment_score' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('signal_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Signal</span>
                          {sortBy === 'signal_score' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('rule1_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Rule1</span>
                          {sortBy === 'rule1_score' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('moat_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Moat</span>
                          {sortBy === 'moat_score' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('management_score')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Mgmt</span>
                          {sortBy === 'management_score' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-right text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('buy_price')}>
                        <div className="flex items-center justify-end gap-1">
                          <span>Buy</span>
                          {sortBy === 'buy_price' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-right text-gray-700">Sticker</th>
                      <th className="px-2 py-2 text-right text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('last_price')}>
                        <div className="flex items-center justify-end gap-1">
                          <span>Price</span>
                          {(sortBy === 'last_price' || sortBy === 'current_ratio') && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('per_upside')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Upside</span>
                          {(sortBy === 'per_upside' || sortBy === 'pe') && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('last_gr')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Comp</span>
                          {(sortBy === 'last_gr' || sortBy === 'dividend') && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('long_gr')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Growth</span>
                          {(sortBy === 'long_gr' || sortBy === 'cash_per_share') && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('pbt')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>PBT</span>
                          {(sortBy === 'pbt' || sortBy === 'guru') && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('last_action')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>Last Action</span>
                          {sortBy === 'last_action' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                        </div>
                      </th>
                      <th className="px-2 py-2 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('per_portfolio')}>
                        <div className="flex items-center justify-center gap-1">
                          <span>% Portfolio</span>
                          {sortBy === 'per_portfolio' && <span className="text-green-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
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
                          !stockColors[stock.ticker] && 'hover:bg-green-50/50'
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/highlighted/${stock.id}`);
                        }}
                      >
                        <td className="px-2 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
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
                            {stock.source === 'dan_portfolio_list' ? (
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
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStock(stock.id);
                                }}
                                disabled={deletingStocks.has(stock.id)}
                                className="p-1 rounded hover:bg-red-100 transition-all duration-300 text-red-500 hover:text-red-700 disabled:opacity-50"
                                title={t('deleteStock') || 'Delete stock'}
                              >
                                {deletingStocks.has(stock.id) ? (
                                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
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
                                stockComments[stock.ticker] ? "text-green-600" : "text-gray-400"
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
                        <td className="px-2 py-2">
                          <div className="text-gray-700 text-sm">{stock.guru || '-'}</div>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "px-1.5 py-0.5 rounded text-xs font-medium"
                          )}>
                            {formatLargeNumber(stock.sentiment_score)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={clsx(
                            getSentimentColor(stock.signal_score),
                            "px-1.5 py-0.5 rounded text-xs font-medium"
                          )}>
                            {formatLargeNumber(stock.signal_score)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.rule1_score)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.moat_score)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.management_score)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {formatCurrency(stock.buy_price * 2)}
                        </td>
                        <td className="px-2 py-2 text-right text-sm">
                          {formatLargeNumber(stock.last_price || stock.current_ratio)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.per_upside || stock.pe)}{(stock.per_upside || stock.pe) ? '%' : ''}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.last_gr || stock.dividend)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.long_gr || stock.cash_per_share)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {formatLargeNumber(stock.pbt || stock.guru)}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.last_action || '-'}
                        </td>
                        <td className="px-2 py-2 text-center text-sm">
                          {stock.per_portfolio ? (String(stock.per_portfolio).endsWith('%') ? stock.per_portfolio : `${stock.per_portfolio}%`) : '-'}
                        </td>
                        <td className="px-2 py-2">
                          <span className={clsx("px-1.5 py-0.5 rounded text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-xs text-gray-500">
                          {(stock.date || stock.created_at) ? (stock.date || stock.created_at).split('T')[0] : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200"
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
                            !item.color && 'bg-gray-50 hover:bg-green-50'
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
                                !item.color && 'text-gray-400 group-hover:text-green-500'
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
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
      
      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add New Portfolio Stock</h3>
                  <p className="text-sm text-gray-500">Add a new dan_portfolio_list stock to your portfolio</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticker *</label>
                  <input
                    type="text"
                    value={newStock.ticker}
                    onChange={(e) => setNewStock({...newStock, ticker: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="AAPL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    value="dan_portfolio_list"
                    disabled
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sentiment Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newStock.sentiment_score}
                    onChange={(e) => setNewStock({...newStock, sentiment_score: Number(e.target.value)})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Signal Score</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newStock.signal_score}
                    onChange={(e) => setNewStock({...newStock, signal_score: Number(e.target.value)})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rule1 Score</label>
                  <input
                    type="number"
                    value={newStock.rule1_score || ''}
                    onChange={(e) => setNewStock({...newStock, rule1_score: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buy Price</label>
                  <input
                    type="text"
                    value={newStock.buy_price}
                    onChange={(e) => setNewStock({...newStock, buy_price: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="100.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upside</label>
                  <input
                    type="text"
                    value={newStock.pe}
                    onChange={(e) => setNewStock({...newStock, pe: e.target.value, per_upside: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <input
                    type="text"
                    value={newStock.current_ratio}
                    onChange={(e) => setNewStock({...newStock, current_ratio: e.target.value, last_price: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moat Score</label>
                  <input
                    type="number"
                    value={newStock.moat_score || ''}
                    onChange={(e) => setNewStock({...newStock, moat_score: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Management Score</label>
                  <input
                    type="number"
                    value={newStock.management_score || ''}
                    onChange={(e) => setNewStock({...newStock, management_score: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comp</label>
                  <input
                    type="text"
                    value={newStock.dividend}
                    onChange={(e) => setNewStock({...newStock, dividend: e.target.value, last_gr: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Growth</label>
                  <input
                    type="text"
                    value={newStock.cash_per_share}
                    onChange={(e) => setNewStock({...newStock, cash_per_share: e.target.value, long_gr: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">PBT</label>
                  <input
                    type="text"
                    value={newStock.guru}
                    onChange={(e) => setNewStock({...newStock, guru: e.target.value, pbt: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="10.5 years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Action</label>
                  <input
                    type="text"
                    value={newStock.last_action || ''}
                    onChange={(e) => setNewStock({...newStock, last_action: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Buy/Sell/Hold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">% Portfolio</label>
                  <input
                    type="number"
                    value={newStock.per_portfolio || ''}
                    onChange={(e) => setNewStock({...newStock, per_portfolio: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="5"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleAddStock}
                  disabled={addingStock}
                  className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {addingStock ? 'Adding...' : 'Add Portfolio Stock'}
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{notification.message}</span>
          </div>
          <button
            onClick={handleUndo}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Undo
          </button>
          <div className="text-sm text-gray-300">
            {notification.countdown}s
          </div>
        </div>
      )}
    </div>
  );
}
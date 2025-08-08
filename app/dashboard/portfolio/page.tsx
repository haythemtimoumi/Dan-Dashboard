'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatLargeNumber } from '@/app/lib/utils';
import { formatGuruBadges, getGuruDisplay } from '@/app/lib/stock-utils';

import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';
import { StockTooltip } from '@/app/ui/stocks/stock-tooltip';
import { EnhancedCommentModal } from '@/app/ui/stocks/enhanced-comment-modal';

// Utility function to format numbers
const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  let num: number;
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    num = parseFloat(value.replace(/[$,]/g, ''));
  } else {
    num = Number(value);
  }
  
  if (isNaN(num)) return '-';
  
  const rounded = Math.round(num);
  return rounded.toString();
};

// Utility function to format buy price
const formatBuyPrice = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  if (typeof value === 'string') {
    // If it already has $ symbol, clean it and reformat
    const cleanValue = value.replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '-';
    if (num === 0) return '$0';
    return formatCurrency(num);
  }
  
  const num = Number(value);
  if (isNaN(num)) return '-';
  if (num === 0) return '$0';
  return formatCurrency(num);
};



interface StockWithHighlight extends Omit<Stock, 'highlight'> {
  highlight?: boolean;
  target?: boolean;
  color?: string;
  ticker_id?: number;
}

export default function NewPortfolioPage() {
  const router = useRouter();
  const { t, language } = useSettings();
  const { isAdmin, user } = useAuth();
  
  const [sources, setSources] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [stocks, setStocks] = useState<StockWithHighlight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSources, setLoadingSources] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('per_upside');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  const [stockComments, setStockComments] = useState<{[key: string]: string}>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [tooltip, setTooltip] = useState<{ stock: Stock; position: { x: number; y: number } } | null>(null);
  const [stocksWithComments, setStocksWithComments] = useState<Set<string>>(new Set());
  const [lastComments, setLastComments] = useState<{[key: string]: string}>({});
  const [commentTooltip, setCommentTooltip] = useState<{ ticker: string; comment: string; position: { x: number; y: number } } | null>(null);
  const [allUserComments, setAllUserComments] = useState<any[]>([]);
  const [searchTicker, setSearchTicker] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    sentiment: 60,
    moat: 85,
    rule1: 85,
    management: 85
  });
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [isRestoredFromCache, setIsRestoredFromCache] = useState<boolean>(false);
  const [savedScrollPosition, setSavedScrollPosition] = useState<number>(0);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Save table scroll position and data before navigating
  const saveStateBeforeNavigation = () => {
    // Get the most recent scroll position from sessionStorage or current ref
    const savedScrollTop = sessionStorage.getItem('portfolioScrollPosition');
    const tableScrollTop = savedScrollTop ? parseInt(savedScrollTop) : (tableContainerRef.current?.scrollTop || 0);
    
    const state = {
      tableScrollTop: tableScrollTop,
      stocks: stocks,
      searchTicker: searchTicker,
      selectedSource: selectedSource,
      startDate: startDate,
      endDate: endDate,
      sortBy: sortBy,
      sortOrder: sortOrder,
      filters: filters,
      isFiltered: isFiltered,
      timestamp: Date.now()
    };
    localStorage.setItem('portfolioState', JSON.stringify(state));
    sessionStorage.setItem('portfolioState', JSON.stringify(state));
  };

  // Restore state on page load
  useEffect(() => {
    // Try sessionStorage first (more reliable), then localStorage
    const savedState = sessionStorage.getItem('portfolioState') || localStorage.getItem('portfolioState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // Check if state is recent (within 5 minutes) and has data
        const isRecent = state.timestamp && (Date.now() - state.timestamp) < 5 * 60 * 1000;
        if (state.stocks && state.stocks.length > 0 && isRecent) {
          setStocks(state.stocks);
          setSearchTicker(state.searchTicker || '');
          setSelectedSource(state.selectedSource || '');
          setStartDate(state.startDate || '');
          setEndDate(state.endDate || '');
          setSortBy(state.sortBy || 'per_upside');
          setSortOrder(state.sortOrder || 'desc');
          setFilters(state.filters || { sentiment: 60, moat: 85, rule1: 85, management: 85 });
          setIsFiltered(state.isFiltered || false);
          setIsRestoredFromCache(true);
          setSavedScrollPosition(state.tableScrollTop || 0);
          setLoading(false);
          
          // Clean up saved state after successful restoration
          setTimeout(() => {
            localStorage.removeItem('portfolioState');
            sessionStorage.removeItem('portfolioState');
            sessionStorage.removeItem('portfolioScrollPosition');
          }, 1000);
        } else {
          // State is too old or invalid, clean it up
          localStorage.removeItem('portfolioState');
          sessionStorage.removeItem('portfolioState');
        }
      } catch (error) {
        console.error('Error restoring portfolio state:', error);
        localStorage.removeItem('portfolioState');
        sessionStorage.removeItem('portfolioState');
      }
    }
  }, []);

  // Restore scroll position after stocks are loaded and table is rendered
  useEffect(() => {
    if (savedScrollPosition > 0 && stocks.length > 0 && !loading) {
      // Wait for table to render, then restore scroll
      const restoreScroll = () => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = savedScrollPosition;
          setSavedScrollPosition(0); // Clear after restoration
        }
      };
      
      // Try multiple times with increasing delays
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 150);
      setTimeout(restoreScroll, 300);
    }
  }, [savedScrollPosition, stocks.length, loading]);

  // Save scroll position continuously as user scrolls
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;

    const handleScroll = () => {
      const scrollTop = tableContainer.scrollTop;
      // Save to sessionStorage for immediate access
      sessionStorage.setItem('portfolioScrollPosition', scrollTop.toString());
    };

    tableContainer.addEventListener('scroll', handleScroll);
    return () => tableContainer.removeEventListener('scroll', handleScroll);
  }, [stocks.length]); // Re-attach when stocks change

  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return -Infinity;
    if (typeof value === 'number') return value;
    
    // Handle percentage values
    if (typeof value === 'string' && value.includes('%')) {
      const num = parseFloat(value.replace('%', ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    // Handle currency values
    if (typeof value === 'string' && value.includes('$')) {
      const num = parseFloat(value.replace(/[$,]/g, ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    // Handle regular numeric strings
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/,/g, ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    return -Infinity;
  };

  // Load data from localStorage and fetch last date on component mount
  useEffect(() => {
    const savedComments = localStorage.getItem('stockComments');
    if (savedComments) setStockComments(JSON.parse(savedComments));
    
    // Fetch last date from backend API
    const fetchLastDate = async () => {
      try {
        const response = await fetch(`/api/proxy/stocks/last-date?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched last date:', data.last_date);
          const lastDate = data.last_date.split('T')[0]; // Convert to YYYY-MM-DD format
          console.log('Formatted date:', lastDate);
          setStartDate(lastDate);
          setEndDate(lastDate);
        } else {
          // Fallback to current date if API fails
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          setEndDate(today);
        }
      } catch (error) {
        console.error('Error fetching last date:', error);
        // Fallback to current date if API fails
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
      }
    };
    
    fetchLastDate();
  }, []);

  // Color management using new dan-api backend
  const cycleColor = async (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    
    const colors = ['neutral', 'red', 'green', 'yellow'];
    const currentIndex = colors.indexOf(stock.color || 'neutral');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    // Update local state immediately for instant feedback
    setStocks(stocks.map(s => 
      s.id === stockId ? { ...s, color: nextColor } : s
    ));
    
    // Update via proxy API
    try {
      const response = await fetch(`/api/proxy/stocks/${stock.ticker}/color`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color: nextColor })
      });
      
      if (!response.ok) {
        console.error('Failed to update color:', response.statusText);
        // Revert local state on API failure
        setStocks(stocks.map(s => 
          s.id === stockId ? { ...s, color: stock.color } : s
        ));
      }
    } catch (error) {
      console.error('Error updating color:', error);
      // Revert local state on error
      setStocks(stocks.map(s => 
        s.id === stockId ? { ...s, color: stock.color } : s
      ));
    }
  };

  const handleCommentSave = (stockId: string, comment: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const newComments = { ...stockComments, [key]: comment };
    setStockComments(newComments);
    localStorage.setItem('stockComments', JSON.stringify(newComments));
    
    // Update stocks with comments set
    if (stock) {
      const newStocksWithComments = new Set(stocksWithComments);
      const newLastComments = { ...lastComments };
      
      if (comment.trim()) {
        newStocksWithComments.add(stock.ticker);
        newLastComments[stock.ticker] = comment;
      } else {
        newStocksWithComments.delete(stock.ticker);
        delete newLastComments[stock.ticker];
      }
      
      setStocksWithComments(newStocksWithComments);
      setLastComments(newLastComments);
    }
    
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = async (stockId: string) => {
    setCurrentComment('');
    setShowCommentModal(stockId);
  };

  const handleDeleteStock = async (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (!stock) return;
    
    const confirmMessage = language === 'fr' 
      ? `Êtes-vous sûr de vouloir supprimer ${stock.ticker} ?`
      : `Are you sure you want to delete ${stock.ticker}?`;
    
    if (confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`/api/scraper-tasks/${stock.ticker_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          // Remove stock from local state
          setStocks(stocks.filter(s => s.id !== stockId));
          
          // Remove from local storage
          const stockKey = stock.ticker;
          const newComments = { ...stockComments };
          delete newComments[stockKey];
          setStockComments(newComments);
          localStorage.setItem('stockComments', JSON.stringify(newComments));
          

        } else {
          const errorMessage = language === 'fr' 
            ? 'Erreur lors de la suppression. Veuillez réessayer.'
            : 'Failed to delete stock. Please try again.';
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Error deleting stock:', error);
        const errorMessage = language === 'fr' 
          ? 'Erreur lors de la suppression. Veuillez réessayer.'
          : 'Failed to delete stock. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleMouseEnter = (event: React.MouseEvent, stock: StockWithHighlight) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      stock: stock as Stock,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleCommentIconEnter = (event: React.MouseEvent, ticker: string) => {
    const lastComment = lastComments[ticker];
    if (lastComment) {
      setCommentTooltip({
        ticker,
        comment: lastComment,
        position: { x: event.clientX, y: event.clientY }
      });
    }
  };

  const handleCommentIconLeave = () => {
    setCommentTooltip(null);
  };



  // Load sources from API
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const response = await fetch('/api/proxy/sources/types');
        if (response.ok) {
          const sourcesData = await response.json();
          setSources(sourcesData);
        }
      } catch (err) {
        console.error('Error fetching sources:', err);
      } finally {
        setLoadingSources(false);
      }
    };
    fetchSources();
  }, []);

  // Load stocks with date filtering using grouped endpoint
  useEffect(() => {
    // Only fetch stocks if dates are set
    if (!startDate || !endDate) return;
    
    // Skip API call if we already have stocks data (from restored state)
    if (stocks.length > 0 && !loading) {
      return;
    }
    
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Always use grouped endpoint
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        
        const url = `/api/stocks/grouped?${params.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        
        // Show all stocks including target stocks with star icons
        setStocks(stocksData);
        
        // Auto-load comments for all stocks
        await checkCommentsForStocks(stocksData);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load portfolio stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [startDate, endDate, stocks.length, loading]);

  // Function to check comments for all stocks using user API
  const checkCommentsForStocks = async (stocksList?: StockWithHighlight[]) => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/proxy/comments/user/${user.id}?t=${Date.now()}`);
      
      if (response.ok) {
        const allComments = await response.json();
        const newStocksWithComments = new Set<string>();
        const newLastComments: {[key: string]: string} = {};
        
        // Group comments by ticker and get the latest comment for each
        const commentsByTicker: {[key: string]: any[]} = {};
        allComments.forEach((comment: any) => {
          if (!commentsByTicker[comment.ticker_symbol]) {
            commentsByTicker[comment.ticker_symbol] = [];
          }
          commentsByTicker[comment.ticker_symbol].push(comment);
        });
        
        // Process each ticker's comments
        Object.entries(commentsByTicker).forEach(([ticker, comments]) => {
          if (comments.length > 0) {
            newStocksWithComments.add(ticker);
            // Get the most recent comment
            const latestComment = comments.sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0];
            newLastComments[ticker] = latestComment.comment;
          }
        });
        
        setStocksWithComments(newStocksWithComments);
        setLastComments(newLastComments);
        setAllUserComments(allComments);
      }
    } catch (error) {
      console.error('Error checking comments:', error);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Filter stocks by selected source, ticker search, and advanced filters
  let filteredStocks = stocks.filter(stock => {
    const sourceMatch = !selectedSource || stock.source === selectedSource;
    const tickerMatch = !searchTicker || stock.ticker.toLowerCase().includes(searchTicker.toLowerCase());
    return sourceMatch && tickerMatch;
  });
  
  // Apply advanced filters if enabled
  if (isFiltered) {
    filteredStocks = filteredStocks.filter((stock: StockWithHighlight) => {
      const sentimentScore = parseNumericValue(stock.sentiment_score);
      const moatScore = parseNumericValue(stock.moat_score);
      const rule1Score = parseNumericValue(stock.rule1_score);
      const managementScore = parseNumericValue(stock.management_score);
      
      // Check if all three scores are green (>85)
      const allScoresGreen = rule1Score > 85 && moatScore > 85 && managementScore > 85;
      
      // If scores are green, sentiment must be >60, otherwise use filter value
      const minSentiment = allScoresGreen ? 60 : filters.sentiment;
      
      return sentimentScore >= minSentiment &&
             moatScore >= filters.moat &&
             rule1Score >= filters.rule1 &&
             managementScore >= filters.management;
    });
  }

  const parseNumericValueDuplicate = (value: any): number => {
    if (value === null || value === undefined || value === '') return -Infinity;
    if (typeof value === 'number') return value;
    
    // Handle percentage values
    if (typeof value === 'string' && value.includes('%')) {
      const num = parseFloat(value.replace('%', ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    // Handle currency values
    if (typeof value === 'string' && value.includes('$')) {
      const num = parseFloat(value.replace(/[$,]/g, ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    // Handle regular numeric strings
    if (typeof value === 'string') {
      const num = parseFloat(value.replace(/,/g, ''));
      return isNaN(num) ? -Infinity : num;
    }
    
    return -Infinity;
  };

  const parseDateValue = (value: any): number => {
    if (!value) return 0;
    const date = new Date(value);
    return isNaN(date.getTime()) ? 0 : date.getTime();
  };

  const sortedStocks = [...filteredStocks].sort((a, b) => {
    // Special handling for upside calculation first (before general empty value handling)
    if (sortBy === 'upside' || sortBy === 'per_upside') {
      const hasUpsideA = a.per_upside !== null && a.per_upside !== undefined;
      const hasUpsideB = b.per_upside !== null && b.per_upside !== undefined;
      
      // Handle null values - always put them at the bottom regardless of sort order
      if (!hasUpsideA && !hasUpsideB) return 0;
      if (!hasUpsideA) return 1; // A goes to bottom
      if (!hasUpsideB) return -1; // B goes to bottom
      
      const comparison = a.per_upside! - b.per_upside!;
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    
    let valueA = a[sortBy as keyof Stock];
    let valueB = b[sortBy as keyof Stock];
    
    // Handle empty values
    const isAEmpty = valueA === null || valueA === undefined || valueA === '';
    const isBEmpty = valueB === null || valueB === undefined || valueB === '';
    
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return sortOrder === 'asc' ? 1 : -1;
    if (isBEmpty) return sortOrder === 'asc' ? -1 : 1;
    
    // Special handling for different field types
    let comparison = 0;
    
    // Date fields
    if (sortBy === 'created_at' || sortBy === 'date') {
      const dateA = parseDateValue(valueA);
      const dateB = parseDateValue(valueB);
      comparison = dateA - dateB;
    }
    // Numeric fields (scores, prices, percentages)
    else if (['signal_score', 'sentiment_score', 'rule1_score', 'moat_score', 'management_score', 
              'buy_price', 'last_price', 'long_gr', 'last_gr', 'pbt'].includes(sortBy)) {
      const numA = parseNumericValue(valueA);
      const numB = parseNumericValue(valueB);
      comparison = numA - numB;
    }
    // String fields (ticker, guru, full_name, source)
    else {
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      comparison = strA.localeCompare(strB);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getSourceDisplayName = (source: string) => {
    const displayNames: { [key: string]: { en: string; fr: string } } = {
      'rule1': { en: 'Rule #1', fr: 'Règle #1' },
      'manual': { en: 'Manual Entry', fr: 'Saisie Manuelle' },
      'guru_list': { en: 'Guru List', fr: 'Liste Guru' },
      'target': { en: 'Target List', fr: 'Liste Cible' },
      'monitor': { en: 'Monitor List', fr: 'Liste Surveillance' }
    };
    
    return displayNames[source]?.[language] || source;
  };

  if (loadingSources) {
    return (
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-gray-100 rounded-xl"></div>
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
        <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2">{language === 'fr' ? 'Erreur de chargement des données' : 'Error loading data'}</h2>
        <p className="text-red-600 dark:text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const newShowFilters = !showFilters;
                  setShowFilters(newShowFilters);
                  // Auto-apply filters when opening for the first time
                  if (newShowFilters && !isFiltered) {
                    setIsFiltered(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isFiltered 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                {language === 'fr' ? 'Filtre Avancé' : 'Advanced Filter'}
                {isFiltered && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {language === 'fr' ? 'Actif' : 'Active'}
                  </span>
                )}
              </button>
              
              {isRestoredFromCache && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{language === 'fr' ? 'Position restaurée' : 'Position restored'}</span>
                </div>
              )}
            </div>
            
            {isRestoredFromCache && (
              <button
                onClick={() => {
                  setIsRestoredFromCache(false);
                  setStocks([]);
                  setLoading(true);
                  // This will trigger a fresh fetch
                }}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                title={language === 'fr' ? 'Actualiser les données' : 'Refresh data'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {language === 'fr' ? 'Actualiser' : 'Refresh'}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
              {/* Ticker Search */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'fr' ? 'Rechercher:' : 'Search:'}
              </label>
              <input
                type="text"
                value={searchTicker}
                onChange={(e) => setSearchTicker(e.target.value)}
                placeholder={language === 'fr' ? 'Symbole...' : 'Ticker...'}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'fr' ? 'Source:' : 'Source:'}
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">
                  {language === 'fr' ? 'Toutes les sources' : 'All sources'}
                </option>
                {sources.map(source => (
                  <option key={source} value={source}>
                    {getSourceDisplayName(source)}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'fr' ? 'Du:' : 'From:'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'fr' ? 'Au:' : 'To:'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Clear Filters */}
            {(searchTicker || selectedSource) && (
              <button
                onClick={async () => {
                  setSearchTicker('');
                  setSelectedSource('');
                  // Reset to last date from backend API
                  try {
                    const response = await fetch(`/api/proxy/stocks/last-date?t=${Date.now()}`);
                    if (response.ok) {
                      const data = await response.json();
                      const lastDate = data.last_date.split('T')[0]; // Convert to YYYY-MM-DD format
                      setStartDate(lastDate);
                      setEndDate(lastDate);
                    }
                  } catch (error) {
                    console.error('Error fetching last date:', error);
                  }
                }}
                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500"
              >
                {language === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            )}
              </div>
              
            </div>
            
            {/* Collapsible Filter Box */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Sentiment >' : 'Sentiment >'}
                    </label>
                    <input
                      type="number"
                      value={filters.sentiment}
                      onChange={(e) => {
                        const newFilters = {...filters, sentiment: parseInt(e.target.value) || 0};
                        setFilters(newFilters);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Fossé >' : 'Moat >'}
                    </label>
                    <input
                      type="number"
                      value={filters.moat}
                      onChange={(e) => {
                        const newFilters = {...filters, moat: parseInt(e.target.value) || 0};
                        setFilters(newFilters);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Règle #1 >' : 'Rule #1 >'}
                    </label>
                    <input
                      type="number"
                      value={filters.rule1}
                      onChange={(e) => {
                        const newFilters = {...filters, rule1: parseInt(e.target.value) || 0};
                        setFilters(newFilters);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Gestion >' : 'Management >'}
                    </label>
                    <input
                      type="number"
                      value={filters.management}
                      onChange={(e) => {
                        const newFilters = {...filters, management: parseInt(e.target.value) || 0};
                        setFilters(newFilters);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setIsFiltered(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {language === 'fr' ? 'Appliquer' : 'Apply'}
                  </button>
                  <button
                    onClick={() => {
                      setIsFiltered(false);
                      setFilters({
                        sentiment: 60,
                        moat: 85,
                        rule1: 85,
                        management: 85
                      });
                    }}
                    className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
                  >
                    {language === 'fr' ? 'Effacer' : 'Clear'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? `${sortedStocks.length} résultat${sortedStocks.length !== 1 ? 's' : ''}`
              : `${sortedStocks.length} result${sortedStocks.length !== 1 ? 's' : ''}`
            }
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div ref={tableContainerRef} className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        {language === 'fr' ? 'Position' : 'Position'}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('ticker')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Symbole' : 'Ticker'}
                        {getSortIcon('ticker')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('guru')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Guru' : 'Guru'}
                        {getSortIcon('guru')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('signal_score')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Signal' : 'Signal'}
                        {getSortIcon('signal_score')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('sentiment_score')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Sentiment' : 'Sentiment'}
                        {getSortIcon('sentiment_score')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('rule1_score')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Règle #1' : 'Rule #1'}
                        {getSortIcon('rule1_score')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('moat_score')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Fossé' : 'Moat'}
                        {getSortIcon('moat_score')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('management_score')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Gestion' : 'Management'}
                        {getSortIcon('management_score')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('buy_price')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Prix Achat' : 'Buy Price'}
                        {getSortIcon('buy_price')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('stickerPrice')}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('per_upside')}>
                      <div className="flex items-center">
                        % {t('upside')}
                        {getSortIcon('per_upside')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('last_price')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Prix' : 'Price'}
                        {getSortIcon('last_price')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('long_gr')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Croiss. Analyste' : 'Analyst Growth'}
                        {getSortIcon('long_gr')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('last_gr')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Croiss. Composite' : 'Composite Growth'}
                        {getSortIcon('last_gr')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('pbt')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'PBT' : 'PBT'}
                        {getSortIcon('pbt')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('created_at')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Date' : 'Date'}
                        {getSortIcon('created_at')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {language === 'fr' ? 'Actions' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedStocks.map((stock, index) => {
                    const stockColor = stock.color || '';
                    const hasComment = stocksWithComments.has(stock.ticker);
                    
                    return (
                      <tr
                        key={stock.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          stockColor === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                          stockColor === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                          stockColor === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                        }`}
                        onMouseEnter={(e) => handleMouseEnter(e, stock)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => {
                          saveStateBeforeNavigation();
                          router.push(`/dashboard/portfolio/${stock.ticker}?date=${startDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
                        }}
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-500 dark:text-gray-400">
                          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-bold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await cycleColor(stock.id);
                              }}
                              className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                              style={{ backgroundColor: stockColor === 'neutral' ? 'transparent' : stockColor || 'transparent' }}
                            />
                            {stock.target && (
                              <span title="Target Stock">
                                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                              </span>
                            )}
                            {stock.ticker}
                            {(() => {
                              const guruInfo = formatGuruBadges(stock, 2);
                              return guruInfo.hasMore && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm animate-pulse">
                                  +{guruInfo.remainingCount}
                                </span>
                              );
                            })()
                            }

                          </div>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            const guruInfo = formatGuruBadges(stock, 2);
                            const guruDisplay = getGuruDisplay(stock);
                            
                            if (guruDisplay.type === 'grouped') {
                              return (
                                <div className="flex flex-wrap gap-1 items-center">
                                  {guruInfo.displayGurus.map((guru: string) => (
                                    <span key={guru} className="guru-badge">
                                      {guru}
                                    </span>
                                  ))}
                                  {guruInfo.hasMore && (
                                    <span className="guru-count">+{guruInfo.remainingCount}</span>
                                  )}
                                </div>
                              );
                            }
                            
                            return stock.guru || '-';
                          })()
                          }
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.signal_score)}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                          parseNumericValue(stock.sentiment_score) > 60 && parseNumericValue(stock.rule1_score) > 85 && parseNumericValue(stock.moat_score) > 85 && parseNumericValue(stock.management_score) > 85
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatNumber(stock.sentiment_score)}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                          parseNumericValue(stock.sentiment_score) > 60 && parseNumericValue(stock.rule1_score) > 85 && parseNumericValue(stock.moat_score) > 85 && parseNumericValue(stock.management_score) > 85
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatNumber(stock.rule1_score)}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                          parseNumericValue(stock.sentiment_score) > 60 && parseNumericValue(stock.rule1_score) > 85 && parseNumericValue(stock.moat_score) > 85 && parseNumericValue(stock.management_score) > 85
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatNumber(stock.moat_score)}
                        </td>
                        <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                          parseNumericValue(stock.sentiment_score) > 60 && parseNumericValue(stock.rule1_score) > 85 && parseNumericValue(stock.moat_score) > 85 && parseNumericValue(stock.management_score) > 85
                            ? 'text-green-600 dark:text-green-400 font-bold'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatNumber(stock.management_score)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatBuyPrice(stock.buy_price)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(() => {
                            if (!stock.buy_price) return '-';
                            const buyPriceStr = String(stock.buy_price);
                            if (buyPriceStr === '$0' || buyPriceStr === '0') return '-';
                            const buyPrice = parseFloat(buyPriceStr.replace(/[$,]/g, ''));
                            return isNaN(buyPrice) || buyPrice === 0 ? '-' : formatCurrency(buyPrice * 2);
                          })()
                          }
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {stock.per_upside !== null && stock.per_upside !== undefined ? `${Math.round(stock.per_upside)}%` : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {stock.last_price ? `$${formatNumber(stock.last_price)}` : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.long_gr)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.last_gr)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.pbt)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : '-'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openCommentModal(stock.id);
                              }}
                              onMouseEnter={(e) => handleCommentIconEnter(e, stock.ticker)}
                              onMouseLeave={handleCommentIconLeave}
                              className={`p-1 rounded transition-all duration-200 ${
                                hasComment 
                                  ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 transform hover:scale-110' 
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              <svg className={`${hasComment ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-200`} 
                                   fill={hasComment ? 'currentColor' : 'none'} 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStock(stock.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                              title={language === 'fr' ? 'Supprimer' : 'Delete'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Multi-Guru Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-black text-white p-3 rounded-lg shadow-xl text-sm max-w-sm"
          style={{
            left: tooltip.position.x + 10,
            top: tooltip.position.y - 10,
          }}
        >
          <div className="font-bold text-lg mb-2">{tooltip.stock.ticker}</div>
          {tooltip.stock.full_name && (
            <div className="text-gray-300 mb-2">{tooltip.stock.full_name}</div>
          )}
          <div className="mb-2">{language === 'fr' ? 'Score:' : 'Score:'} {tooltip.stock.sentiment_score || 'N/A'}</div>
          
          {/* Multi-guru display for grouped data */}
          {(() => {
            const guruDisplay = getGuruDisplay(tooltip.stock);
            
            if (guruDisplay.type === 'grouped') {
              return (
                <div className="border-t border-gray-600 pt-2">
                  <div className="text-gray-300 text-xs mb-1">{t('analyzedBy')}:</div>
                  <div className="guru-list mb-1">
                    {guruDisplay.gurus.map((guru: string) => (
                      <span key={guru} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {guru}
                      </span>
                    ))}
                  </div>
                  <div className="guru-count">
                    ({guruDisplay.count} {t('gurus')})
                  </div>
                </div>
              );
            }
            
            return (
              <div>
                {language === 'fr' ? 'Guru:' : 'Guru:'} {tooltip.stock.guru || 'N/A'}
                {guruDisplay.type === 'single' && guruDisplay.date && (
                  <div className="analysis-date mt-1">
                    {new Date(guruDisplay.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })()
          }
        </div>
      )}

      {/* Comment Tooltip */}
      {commentTooltip && (
        <div
          className="fixed z-50 bg-blue-900 text-white p-3 rounded-lg shadow-xl text-sm max-w-xs border-2 border-blue-600"
          style={{
            left: Math.min(commentTooltip.position.x + 10, window.innerWidth - 320),
            top: commentTooltip.position.y - 60,
          }}
        >
          <div className="font-bold text-blue-200 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t('lastComment')}
          </div>
          <div className="text-blue-100 italic">
            &quot;{commentTooltip.comment.length > 100 
              ? commentTooltip.comment.substring(0, 100) + '...' 
              : commentTooltip.comment}&quot;
          </div>
        </div>
      )}

      {/* Enhanced Comment Modal */}
      {showCommentModal && (
        <EnhancedCommentModal
          isOpen={!!showCommentModal}
          onClose={() => setShowCommentModal(null)}
          ticker={stocks.find(s => s.id === showCommentModal)?.ticker || ''}
          onSave={(comment) => handleCommentSave(showCommentModal, comment)}
          currentComment={currentComment}
          setCurrentComment={setCurrentComment}
          tickerColor={stocks.find(s => s.id === showCommentModal)?.color || 'neutral'}
          userComments={allUserComments}
          onRefreshComments={() => checkCommentsForStocks()}
        />
      )}
    </div>
  );
}
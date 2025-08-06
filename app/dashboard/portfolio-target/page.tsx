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
import MissingAnalysisDropdown from '@/app/ui/dashboard/missing-analysis-dropdown';

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

export default function TargetPortfolioPage() {
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
  const [searchTicker, setSearchTicker] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    tickers: '',
    active: true
  });
  const [addSaving, setAddSaving] = useState(false);
  const [addResult, setAddResult] = useState<{success: boolean, message: string} | null>(null);
  const [inProgressTickers, setInProgressTickers] = useState<string[]>([]);
  const [backendInProgress, setBackendInProgress] = useState<string[]>([]);

  // Load in-progress tickers from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('inProgressTickers');
    if (saved) {
      setInProgressTickers(JSON.parse(saved));
    }
  }, []);

  // Fetch missing analysis tickers from backend
  const fetchMissingAnalysis = async () => {
    try {
      const response = await fetch('/api/tickers/missing-analysis');
      if (response.ok) {
        const data = await response.json();
        const symbols = data.map((item: any) => item.symbol);
        setBackendInProgress(symbols);
      }
    } catch (error) {
      console.error('Error fetching missing analysis:', error);
    }
  };

  // Fetch missing analysis on component mount and when stocks change
  useEffect(() => {
    fetchMissingAnalysis();
  }, [stocks]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [filters, setFilters] = useState({
    sentiment: 60,
    moat: 85,
    rule1: 85,
    management: 85
  });
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Save table scroll position and data before navigating
  const saveStateBeforeNavigation = () => {
    const tableScrollTop = tableContainerRef.current?.scrollTop || 0;
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
      isFiltered: isFiltered
    };
    localStorage.setItem('portfolioTargetState', JSON.stringify(state));
  };

  // Restore state on page load
  useEffect(() => {
    const savedState = localStorage.getItem('portfolioTargetState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.stocks && state.stocks.length > 0) {
          setStocks(state.stocks);
          setSearchTicker(state.searchTicker || '');
          setSelectedSource(state.selectedSource || '');
          setStartDate(state.startDate || '');
          setEndDate(state.endDate || '');
          setSortBy(state.sortBy || 'per_upside');
          setSortOrder(state.sortOrder || 'desc');
          setFilters(state.filters || { sentiment: 60, moat: 85, rule1: 85, management: 85 });
          setIsFiltered(state.isFiltered || false);
          setLoading(false);
          
          // Restore table scroll position
          setTimeout(() => {
            if (tableContainerRef.current && state.tableScrollTop) {
              tableContainerRef.current.scrollTop = state.tableScrollTop;
            }
            localStorage.removeItem('portfolioTargetState');
          }, 100);
        }
      } catch (error) {
        console.error('Error restoring portfolio target state:', error);
      }
    }
  }, []);

  // Load data from localStorage and fetch last date on component mount
  useEffect(() => {
    const savedComments = localStorage.getItem('stockComments');
    if (savedComments) setStockComments(JSON.parse(savedComments));
    
    // Load persisted comment status
    const savedStocksWithComments = localStorage.getItem('stocksWithComments');
    if (savedStocksWithComments) {
      setStocksWithComments(new Set(JSON.parse(savedStocksWithComments)));
    }
    
    const savedLastComments = localStorage.getItem('lastComments');
    if (savedLastComments) {
      setLastComments(JSON.parse(savedLastComments));
    }
    
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
      
      // Persist comment status to localStorage to survive page reloads
      localStorage.setItem('stocksWithComments', JSON.stringify(Array.from(newStocksWithComments)));
      localStorage.setItem('lastComments', JSON.stringify(newLastComments));
    }
    
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = async (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (stock) {
      // Check if this stock has comments using the proxy API
      try {
        const response = await fetch(`/api/proxy/comments/ticker/${stock.ticker}`);
        if (response.ok) {
          const comments = await response.json();
          const newStocksWithComments = new Set(stocksWithComments);
          const newLastComments = { ...lastComments };
          
          if (comments.length > 0) {
            newStocksWithComments.add(stock.ticker);
            // Get the most recent comment
            const sortedComments = comments.sort((a: any, b: any) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            newLastComments[stock.ticker] = sortedComments[0].comment_text;
          } else {
            newStocksWithComments.delete(stock.ticker);
            delete newLastComments[stock.ticker];
          }
          
          setStocksWithComments(newStocksWithComments);
          setLastComments(newLastComments);
          
          // Persist the updated comment status
          localStorage.setItem('stocksWithComments', JSON.stringify(Array.from(newStocksWithComments)));
          localStorage.setItem('lastComments', JSON.stringify(newLastComments));
        }
      } catch (error) {
        console.error('Error checking comments:', error);
      }
    }
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
          
          // Update stocks with comments set
          const newStocksWithComments = new Set(stocksWithComments);
          const newLastComments = { ...lastComments };
          newStocksWithComments.delete(stock.ticker);
          delete newLastComments[stock.ticker];
          setStocksWithComments(newStocksWithComments);
          setLastComments(newLastComments);
          
          // Persist the updated comment status
          localStorage.setItem('stocksWithComments', JSON.stringify(Array.from(newStocksWithComments)));
          localStorage.setItem('lastComments', JSON.stringify(newLastComments));
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

  // Load stocks with date filtering using external API - FILTER FOR TARGET ONLY
  useEffect(() => {
    // Only fetch stocks if dates are set
    if (!startDate || !endDate) return;
    
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use Dan-API grouped endpoint to get data with proper analysis
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        
        const url = `/api/proxy/stocks/grouped?${params.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        // Additional client-side filter as backup
        let targetStocks = stocksData.filter((stock: StockWithHighlight) => stock.target === true);
        
        // Apply advanced filters if enabled
        if (isFiltered) {
          targetStocks = targetStocks.filter((stock: StockWithHighlight) => {
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
        
        // Check comments for all stocks before setting stocks
        await checkCommentsForStocks(targetStocks);
        setStocks(targetStocks);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load target portfolio stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [startDate, endDate, isFiltered, filters]);

  // Function to refresh comment status for all stocks
  const refreshCommentStatus = async () => {
    if (stocks.length > 0) {
      await checkCommentsForStocks(stocks);
    }
  };

  // Function to check comments for all stocks using batch API
  const checkCommentsForStocks = async (stocksList: StockWithHighlight[]) => {
    const tickers = stocksList.map(stock => stock.ticker);
    
    // Get persisted comment status from localStorage
    const savedStocksWithComments = localStorage.getItem('stocksWithComments');
    const savedLastComments = localStorage.getItem('lastComments');
    
    let persistedStocksWithComments = new Set<string>();
    let persistedLastComments: {[key: string]: string} = {};
    
    if (savedStocksWithComments) {
      persistedStocksWithComments = new Set(JSON.parse(savedStocksWithComments));
    }
    
    if (savedLastComments) {
      persistedLastComments = JSON.parse(savedLastComments);
    }
    
    try {
      const response = await fetch('/api/comments/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers })
      });
      
      if (response.ok) {
        const commentsData = await response.json();
        const newStocksWithComments = new Set<string>(persistedStocksWithComments);
        const newLastComments: {[key: string]: string} = { ...persistedLastComments };
        
        Object.entries(commentsData).forEach(([ticker, data]: [string, any]) => {
          if (data.hasComments) {
            newStocksWithComments.add(ticker);
            if (data.lastComment) {
              newLastComments[ticker] = data.lastComment;
            }
          }
        });
        
        setStocksWithComments(newStocksWithComments);
        setLastComments(newLastComments);
        
        // Update localStorage with merged data
        localStorage.setItem('stocksWithComments', JSON.stringify(Array.from(newStocksWithComments)));
        localStorage.setItem('lastComments', JSON.stringify(newLastComments));
      } else {
        // If API fails, use persisted data
        setStocksWithComments(persistedStocksWithComments);
        setLastComments(persistedLastComments);
      }
    } catch (error) {
      console.error('Error checking comments:', error);
      // If API fails, use persisted data
      setStocksWithComments(persistedStocksWithComments);
      setLastComments(persistedLastComments);
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

  // Filter stocks by selected source and ticker search
  const filteredStocks = stocks.filter(stock => {
    const sourceMatch = !selectedSource || stock.source === selectedSource;
    const tickerMatch = !searchTicker || stock.ticker.toLowerCase().includes(searchTicker.toLowerCase());
    return sourceMatch && tickerMatch;
  });

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
          <div className="mb-6 flex items-center gap-3">
            <MissingAnalysisDropdown />
            <button
              onClick={async () => {
                const allInProgress = Array.from(new Set([...inProgressTickers, ...backendInProgress]));
                
                if (allInProgress.length > 0) {
                  // Re-activate in-progress tickers
                  try {
                    const response = await fetch('/api/proxy/stocks/activate-for-dan', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tickers: allInProgress })
                    });
                    
                    if (response.ok) {
                      const result = await response.json();
                      if (result.activated.length > 0) {
                        const filteredInProgress = inProgressTickers.filter(ticker => !result.activated.includes(ticker));
                        setInProgressTickers(filteredInProgress);
                        localStorage.setItem('inProgressTickers', JSON.stringify(filteredInProgress));
                        await fetchMissingAnalysis();
                        window.location.reload();
                      }
                    }
                  } catch (error) {
                    console.error('Error refreshing tickers:', error);
                  }
                } else {
                  refreshCommentStatus();
                }
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm ${
                (inProgressTickers.length > 0 || backendInProgress.length > 0)
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              title={(inProgressTickers.length > 0 || backendInProgress.length > 0)
                ? (language === 'fr' ? 'Actualiser les tickers en cours' : 'Refresh in-progress tickers')
                : (language === 'fr' ? 'Actualiser les commentaires' : 'Refresh comments')
              }
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {(inProgressTickers.length > 0 || backendInProgress.length > 0)
                ? `${language === 'fr' ? 'Actualiser' : 'Refresh'} (${Array.from(new Set([...inProgressTickers, ...backendInProgress])).length})`
                : (language === 'fr' ? 'Actualiser' : 'Refresh')
              }
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {language === 'fr' ? 'Ajouter Tickers' : 'Add Tickers'}
              </button>
            )}
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
          </div>

          {/* Collapsible Filter Box */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
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
                      setIsFiltered(true);
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
                      setIsFiltered(true);
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
                      setIsFiltered(true);
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
                      setIsFiltered(true);
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
                    setShowFilters(false);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {language === 'fr' ? 'Appliquer' : 'Apply'}
                </button>
                <button
                  onClick={() => {
                    setIsFiltered(false);
                    setShowFilters(false);
                  }}
                  className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
                >
                  {language === 'fr' ? 'Effacer' : 'Clear'}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
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

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            {language === 'fr' 
              ? `${sortedStocks.length} résultat${sortedStocks.length !== 1 ? 's' : ''} cible${sortedStocks.length !== 1 ? 's' : ''}`
              : `${sortedStocks.length} target result${sortedStocks.length !== 1 ? 's' : ''}`
            }
            {(inProgressTickers.length > 0 || backendInProgress.length > 0) && (
              <span className="ml-4 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded text-xs">
                🔄 {language === 'fr' ? 'En cours' : 'In Progress'}: {Array.from(new Set([...inProgressTickers, ...backendInProgress])).join(', ')}
              </span>
            )}
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
                        {language === 'fr' ? 'Croiss. Long' : 'Long Growth'}
                        {getSortIcon('long_gr')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('last_gr')}>
                      <div className="flex items-center">
                        {language === 'fr' ? 'Dern. Croiss.' : 'Last Growth'}
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
                  {sortedStocks.map((stock) => {
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
                          router.push(`/dashboard/portfolio-target/${stock.ticker}?date=${startDate}`);
                        }}
                      >
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
                            <span className="text-yellow-500 text-sm" title="Target Stock">
                              ⭐
                            </span>
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
                              title={hasComment ? t('viewComments') : t('addComment')}
                            >
                              <svg className={`${hasComment ? 'w-5 h-5' : 'w-4 h-4'} transition-all duration-200`} 
                                   fill={hasComment ? 'currentColor' : 'none'} 
                                   stroke="currentColor" 
                                   viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </button>
                            {hasComment && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const confirmMessage = language === 'fr' 
                                    ? `Supprimer tous les commentaires pour ${stock.ticker}?`
                                    : `Delete all comments for ${stock.ticker}?`;
                                  if (confirm(confirmMessage)) {
                                    try {
                                      const response = await fetch(`/api/proxy/comments/ticker/${stock.ticker}`);
                                      if (response.ok) {
                                        const comments = await response.json();
                                        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
                                        for (const comment of comments) {
                                          await fetch(`/api/proxy/comments/${comment.id}`, {
                                            method: 'DELETE',
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          });
                                        }
                                        const newStocksWithComments = new Set(stocksWithComments);
                                        const newLastComments = { ...lastComments };
                                        newStocksWithComments.delete(stock.ticker);
                                        delete newLastComments[stock.ticker];
                                        setStocksWithComments(newStocksWithComments);
                                        setLastComments(newLastComments);
                                        localStorage.setItem('stocksWithComments', JSON.stringify(Array.from(newStocksWithComments)));
                                        localStorage.setItem('lastComments', JSON.stringify(newLastComments));
                                      }
                                    } catch (error) {
                                      console.error('Error deleting comments:', error);
                                    }
                                  }
                                }}
                                className="p-1 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900 rounded transition-colors"
                                title={language === 'fr' ? 'Supprimer commentaires' : 'Delete comments'}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                                </svg>
                              </button>
                            )}
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
        />
      )}

      {/* Add Ticker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{language === 'fr' ? 'Ajouter des Tickers' : 'Add Tickers'}</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'fr' ? 'Tickers (séparés par des virgules)' : 'Tickers (comma separated)'}</label>
                  <textarea
                    value={addForm.tickers}
                    onChange={(e) => setAddForm({...addForm, tickers: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="AAPL, GOOGL, MSFT, TSLA, NVDA"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
                <button
                  onClick={async () => {
                    if (!addForm.tickers.trim()) return;
                    setAddSaving(true);
                    setAddResult(null);
                    try {
                      const tickersArray = addForm.tickers.split(',').map(t => t.trim().toUpperCase()).filter(t => t);
                      
                      const response = await fetch('/api/proxy/stocks/activate-for-dan', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                          tickers: tickersArray
                        })
                      });
                      
                      if (response.ok) {
                        const result = await response.json();
                        const totalProcessed = result.activated.length + result.added_to_dan.length;
                        
                        // Update in-progress tickers
                        if (result.added_to_dan.length > 0) {
                          const newInProgress = [...inProgressTickers, ...result.added_to_dan];
                          setInProgressTickers(newInProgress);
                          localStorage.setItem('inProgressTickers', JSON.stringify(newInProgress));
                        }
                        
                        // Remove activated tickers from in-progress
                        if (result.activated.length > 0) {
                          const filteredInProgress = inProgressTickers.filter(ticker => !result.activated.includes(ticker));
                          setInProgressTickers(filteredInProgress);
                          localStorage.setItem('inProgressTickers', JSON.stringify(filteredInProgress));
                        }
                        
                        let message = '';
                        if (result.added_to_dan.length > 0) {
                          message = language === 'fr'
                            ? `🔄 En cours d'analyse: ${result.added_to_dan.join(', ')}`
                            : `🔄 In Progress: ${result.added_to_dan.join(', ')}`;
                        }
                        
                        if (result.not_found.length > 0) {
                          if (message) message += '\n';
                          message += language === 'fr'
                            ? `❌ Non trouvés: ${result.not_found.join(', ')}`
                            : `❌ Not found: ${result.not_found.join(', ')}`;
                        }
                        
                        setAddResult({ 
                          success: totalProcessed > 0, 
                          message: message || (language === 'fr' ? 'Tickers activés avec succès' : 'Tickers activated successfully')
                        });
                        
                        if (totalProcessed > 0) {
                          setAddForm({...addForm, tickers: ''});
                          // Refresh stocks list
                          window.location.reload();
                        }
                      } else {
                        const errorData = await response.json();
                        setAddResult({ 
                          success: false, 
                          message: errorData.error || (language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding tickers')
                        });
                      }
                    } catch (error) {
                      console.error('Error adding tickers:', error);
                      setAddResult({ 
                        success: false, 
                        message: language === 'fr' ? 'Erreur lors de l\'ajout' : 'Error adding tickers'
                      });
                    } finally {
                      setAddSaving(false);
                    }
                  }}
                  disabled={addSaving || !addForm.tickers.trim()}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {addSaving ? (language === 'fr' ? 'Ajout...' : 'Adding...') : (language === 'fr' ? 'Ajouter' : 'Add')}
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setAddForm({
                      tickers: '',
                      active: true
                    });
                    setAddResult(null);
                  }}
                  className="px-6 py-3 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
              
              {/* Result Message */}
              {addResult && (
                <div className={`mt-4 p-4 rounded-xl ${
                  addResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className={`text-sm font-medium ${
                    addResult.success ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'
                  }`}>
                    {addResult.message.split('\n').map((line, index) => (
                      <div key={index} className="mb-1">{line}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
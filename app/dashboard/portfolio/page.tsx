'use client';

import { useState, useEffect, Suspense } from 'react';
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
  const [sortBy, setSortBy] = useState<string>('sentiment_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [stockColors, setStockColors] = useState<{[key: string]: string}>({});
  const [stockComments, setStockComments] = useState<{[key: string]: string}>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tooltip, setTooltip] = useState<{ stock: Stock; position: { x: number; y: number } } | null>(null);
  const [stocksWithComments, setStocksWithComments] = useState<Set<string>>(new Set());
  const [searchTicker, setSearchTicker] = useState<string>('');


  // Load data from localStorage on component mount
  useEffect(() => {
    const savedColors = localStorage.getItem('stockColors');
    const savedComments = localStorage.getItem('stockComments');
    if (savedColors) setStockColors(JSON.parse(savedColors));
    if (savedComments) setStockComments(JSON.parse(savedComments));
  }, []);

  // Color and comment management functions
  const handleColorChange = (stockId: string, color: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const newColors = { ...stockColors, [key]: color };
    setStockColors(newColors);
    localStorage.setItem('stockColors', JSON.stringify(newColors));
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

  const handleCommentSave = (stockId: string, comment: string) => {
    const stock = stocks.find(s => s.id === stockId);
    const key = stock?.ticker || stockId;
    const newComments = { ...stockComments, [key]: comment };
    setStockComments(newComments);
    localStorage.setItem('stockComments', JSON.stringify(newComments));
    
    // Update stocks with comments set
    if (stock) {
      const newStocksWithComments = new Set(stocksWithComments);
      if (comment.trim()) {
        newStocksWithComments.add(stock.ticker);
      } else {
        newStocksWithComments.delete(stock.ticker);
      }
      setStocksWithComments(newStocksWithComments);
    }
    
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = async (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    if (stock) {
      // Check if this stock has comments
      try {
        const response = await fetch(`https://www.mytickerlist.com/api/comments/ticker/${stock.ticker}`);
        if (response.ok) {
          const comments = await response.json();
          const newStocksWithComments = new Set(stocksWithComments);
          if (comments.length > 0) {
            newStocksWithComments.add(stock.ticker);
          } else {
            newStocksWithComments.delete(stock.ticker);
          }
          setStocksWithComments(newStocksWithComments);
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
        const response = await fetch(`https://www.mytickerlist.com/api/stocks/${stockId}`, {
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
          const newColors = { ...stockColors };
          const newComments = { ...stockComments };
          delete newColors[stockKey];
          delete newComments[stockKey];
          setStockColors(newColors);
          setStockComments(newComments);
          localStorage.setItem('stockColors', JSON.stringify(newColors));
          localStorage.setItem('stockComments', JSON.stringify(newComments));
          
          // Update stocks with comments set
          const newStocksWithComments = new Set(stocksWithComments);
          newStocksWithComments.delete(stock.ticker);
          setStocksWithComments(newStocksWithComments);
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

  // Load sources from API
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const response = await fetch('https://www.mytickerlist.com/api/scraper-tasks/list-types');
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
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use grouped endpoint
        let url = '/api/stocks/grouped';
        const params = new URLSearchParams();
        params.append('startDate', startDate);
        params.append('endDate', endDate);
        url += `?${params.toString()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        setStocks(stocksData);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load portfolio stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [startDate, endDate]);

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

  // Filter stocks by selected source and ticker search (no deduplication needed - grouped API handles this)
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
              'buy_price', 'last_price', 'per_upside', 'long_gr', 'last_gr', 'pbt'].includes(sortBy)) {
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
            {(searchTicker || selectedSource || startDate !== new Date().toISOString().split('T')[0] || endDate !== new Date().toISOString().split('T')[0]) && (
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setSearchTicker('');
                  setSelectedSource('');
                  setStartDate(today);
                  setEndDate(today);
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
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
                        {language === 'fr' ? '% Hausse' : '% Upside'}
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
                    const stockKey = stock.ticker || stock.id;
                    const stockColor = stockColors[stockKey] || '';
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
                        onClick={() => router.push(`/dashboard/portfolio/${stock.ticker}?date=${startDate}`)}
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cycleColor(stock.id);
                              }}
                              className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400"
                              style={{ backgroundColor: stockColor || 'transparent' }}
                            />
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
                            {hasComment && (
                              <span className="text-blue-500 text-xs">💬</span>
                            )}
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
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.sentiment_score)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.rule1_score)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatNumber(stock.moat_score)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                          {formatNumber(stock.per_upside)}
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
                              className={`p-1 rounded transition-colors ${
                                hasComment 
                                  ? 'text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900' 
                                  : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={language === 'fr' ? 'Ajouter un commentaire' : 'Add comment'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Enhanced Comment Modal */}
      {showCommentModal && (
        <EnhancedCommentModal
          isOpen={!!showCommentModal}
          onClose={() => setShowCommentModal(null)}
          ticker={stocks.find(s => s.id === showCommentModal)?.ticker || ''}
          onSave={(comment) => handleCommentSave(showCommentModal, comment)}
          currentComment={currentComment}
          setCurrentComment={setCurrentComment}
        />
      )}
    </div>
  );
}
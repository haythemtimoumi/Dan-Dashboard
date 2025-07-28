'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatLargeNumber } from '@/app/lib/utils';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import { HighlightedStocksExternalSkeleton } from '@/app/ui/stocks/highlighted-stocks-external';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

// Utility function to format numbers
const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value.replace(/,/g, ''));
  } else {
    num = Number(value);
  }
  
  if (isNaN(num)) return '-';
  
  const rounded = Math.round(num);
  return rounded.toString();
};

interface StockWithHighlight extends Omit<Stock, 'highlight'> {
  highlight?: boolean;
}

export default function UnifiedPortfolioPage() {
  const router = useRouter();
  const { t, language } = useSettings();
  const { isAdmin } = useAuth();
  
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

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
    setCurrentComment('');
    setShowCommentModal(null);
  };

  const openCommentModal = (stockId: string) => {
    setCurrentComment('');
    setShowCommentModal(stockId);
  };



  // Load available sources on mount
  useEffect(() => {
    const fetchSources = async () => {
      try {
        setLoadingSources(true);
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`${API_URL}/oldstock`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch old stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        const uniqueSources = Array.from(new Set(stocksData.map((stock: any) => stock.source))) as string[];
        setSources(uniqueSources);
        
        // Set default source if available
        if (uniqueSources.length > 0) {
          setSelectedSource(uniqueSources[0]);
        }
      } catch (err) {
        console.error('Error fetching sources:', err);
        setError('Failed to load old portfolio sources. Please try again later.');
      } finally {
        setLoadingSources(false);
      }
    };

    fetchSources();
  }, []);

  // Load stocks when source or date filters change
  useEffect(() => {
    const fetchOldStocks = async () => {
      if (!selectedSource) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        let url = `${API_URL}/oldstock`;
        
        // Add date filtering if dates are selected
        if (startDate && endDate) {
          url = `${API_URL}/oldstock/filter?startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch old stocks: ${response.statusText}`);
        }
        
        const allStocks = await response.json();
        const filteredStocks = allStocks.filter((stock: any) => stock.source === selectedSource);
        setStocks(filteredStocks);
      } catch (err) {
        console.error('Error fetching old stocks:', err);
        setError('Failed to load old portfolio stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOldStocks();
  }, [selectedSource, startDate, endDate]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    let valueA = a[sortBy as keyof Stock];
    let valueB = b[sortBy as keyof Stock];
    
    const isAEmpty = valueA === null || valueA === undefined || valueA === '';
    const isBEmpty = valueB === null || valueB === undefined || valueB === '';
    
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return 1;
    if (isBEmpty) return -1;
    
    if (typeof valueA === 'string' && !isNaN(Number(valueA))) {
      valueA = Number(valueA);
    }
    if (typeof valueB === 'string' && !isNaN(Number(valueB))) {
      valueB = Number(valueB);
    }
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    const strA = String(valueA);
    const strB = String(valueB);
    return sortOrder === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });

  const getSourceDisplayName = (source: string) => {
    const displayNames: { [key: string]: { en: string; fr: string } } = {
      'guru_portfolio': { en: 'Guru Portfolio', fr: 'Portfolio Guru' },
      'dan_portfolio_list': { en: 'Dan Portfolio', fr: 'Portfolio Dan' },
      'stockscore_list': { en: 'Stock Score List', fr: 'Liste Score Actions' }
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Old Portfolio Data (temp)</h1>
              </div>
              <span className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-semibold">
                {stocks.length} {t('stocks')}
              </span>
            </div>
            
            {/* Source Selector and Date Filters */}
            <div className="flex items-center gap-4">
              <div className="min-w-[200px]">
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">{language === 'fr' ? 'Sélectionner la source' : 'Select Portfolio Source'}</option>
                  {sources.map((source) => (
                    <option key={source} value={source}>
                      {getSourceDisplayName(source)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range Filters */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Start Date"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="End Date"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'fr' ? 'Score Signal Moyen' : 'Average Signal'}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(stocks.reduce((sum, stock) => sum + (stock.signal_score || 0), 0) / stocks.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {loading ? (
            <Suspense fallback={<HighlightedStocksExternalSkeleton />}>
              <HighlightedStocksExternalSkeleton />
            </Suspense>
          ) : stocks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {language === 'fr' ? 'Aucune action trouvée' : 'No stocks found'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {language === 'fr' 
                  ? 'Aucune action trouvée pour la source sélectionnée. Essayez de sélectionner une autre source.'
                  : 'No stocks were found for the selected source. Try selecting a different source.'
                }
              </p>
            </div>
          ) : (
            <>
            {/* Mobile view */}
            <div className="md:hidden space-y-4 p-4">
              {sortedStocks.map((stock) => (
                <div
                  key={stock.id}
                  className={clsx(
                    "rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2",
                    stockColors[stock.ticker] === 'red' && 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:from-red-100 hover:to-red-200',
                    stockColors[stock.ticker] === 'green' && 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:from-green-100 hover:to-green-200',
                    stockColors[stock.ticker] === 'yellow' && 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:from-yellow-100 hover:to-yellow-200',
                    !stockColors[stock.ticker] && 'bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:from-blue-50 hover:to-blue-100'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    router.push(`/dashboard/highlighted/${stock.id}`);
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {stock.ticker.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-gray-900">{stock.ticker}</p>
                        <p className="text-sm text-gray-500">{stock.source}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleColor(stock.id);
                        }}
                        className={clsx(
                          "p-2 rounded-xl hover:bg-white/50 transition-colors shadow-sm",
                          stockColors[stock.ticker] === 'red' && 'text-red-500',
                          stockColors[stock.ticker] === 'green' && 'text-green-500',
                          stockColors[stock.ticker] === 'yellow' && 'text-yellow-500',
                          !stockColors[stock.ticker] && 'text-gray-400'
                        )}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
                        </svg>
                      </button>

                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">{language === 'fr' ? 'Sentiment' : 'Sentiment'}</p>
                      <p className={clsx("text-lg font-bold", getSentimentColor(stock.sentiment_score).includes('text-') ? getSentimentColor(stock.sentiment_score) : 'text-gray-900')}>
                        {stock.sentiment_score}
                      </p>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                      <p className="text-xs text-gray-600 mb-1">{language === 'fr' ? 'Signal' : 'Signal'}</p>
                      <p className={clsx("text-lg font-bold", getSentimentColor(stock.signal_score).includes('text-') ? getSentimentColor(stock.signal_score) : 'text-gray-900')}>
                        {stock.signal_score}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">{language === 'fr' ? 'Rule1:' : 'Rule1:'}</span>
                      <span className="ml-1 font-medium">{formatNumber(stock.rule1_score)}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">{language === 'fr' ? 'Prix d\'achat:' : 'Buy Price:'}</span>
                      <span className="ml-1 font-medium">{formatNumber(stock.buy_price)}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">{language === 'fr' ? 'Prix:' : 'Price:'}</span>
                      <span className="ml-1 font-medium">{formatNumber(stock.last_price || stock.current_ratio)}</span>
                    </div>
                    <div className="bg-white/50 rounded-lg p-2">
                      <span className="text-gray-600">{language === 'fr' ? 'Hausse:' : 'Upside:'}</span>
                      <span className="ml-1 font-medium">{formatNumber(stock.per_upside || stock.pe)}%</span>
                    </div>
                  </div>
                  
                  {stockComments[stock.ticker] && (
                    <div className="mt-4 p-3 bg-white/70 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1">{language === 'fr' ? 'Commentaire:' : 'Comment:'}</p>
                      <p className="text-sm text-gray-800">{stockComments[stock.ticker]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Desktop view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-gray-900 text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-blue-50 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider border-b border-gray-200">
                    <th className="px-2 py-3 text-center text-gray-700">{language === 'fr' ? 'Couleur' : 'Color'}</th>
                    <th className="px-2 py-3 text-center text-gray-700">{language === 'fr' ? 'Commentaire' : 'Comment'}</th>
                    <th className="px-2 py-3 text-left text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('ticker')}>
                      <div className="flex items-center gap-1">
                        <span>{language === 'fr' ? 'Symbole' : 'Ticker'}</span>
                        {sortBy === 'ticker' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('sentiment_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Sentiment' : 'Sentiment'}</span>
                        {sortBy === 'sentiment_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('signal_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Signal' : 'Signal'}</span>
                        {sortBy === 'signal_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('rule1_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>Rule1</span>
                        {sortBy === 'rule1_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('moat_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Fossé' : 'Moat'}</span>
                        {sortBy === 'moat_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('management_score')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Gestion' : 'Mgmt'}</span>
                        {sortBy === 'management_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-right text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('buy_price')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>{language === 'fr' ? 'Achat' : 'Buy'}</span>
                        {sortBy === 'buy_price' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-right text-gray-700">{language === 'fr' ? 'Autocollant' : 'Sticker'}</th>
                    <th className="px-2 py-3 text-right text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('last_price')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>{language === 'fr' ? 'Prix' : 'Price'}</span>
                        {sortBy === 'last_price' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('per_upside')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Hausse' : 'Upside'}</span>
                        {sortBy === 'per_upside' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('last_gr')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Comp' : 'Comp'}</span>
                        {sortBy === 'last_gr' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('long_gr')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>{language === 'fr' ? 'Croissance' : 'Growth'}</span>
                        {sortBy === 'long_gr' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-center text-gray-700 cursor-pointer hover:bg-white/50 transition-all duration-200" onClick={() => handleSort('pbt')}>
                      <div className="flex items-center justify-center gap-1">
                        <span>PBT</span>
                        {sortBy === 'pbt' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </div>
                    </th>
                    <th className="px-2 py-3 text-left text-gray-700">{language === 'fr' ? 'Source' : 'Source'}</th>
                    <th className="px-2 py-3 text-left text-gray-700">{language === 'fr' ? 'Date' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedStocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className={clsx(
                        "cursor-pointer transition-all duration-300 border-b border-gray-100 last:border-b-0 hover:shadow-md",
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
                      <td className="px-2 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleColor(stock.id);
                            }}
                            className={clsx(
                              "p-1 rounded-lg hover:bg-white/50 transition-colors shadow-sm",
                              stockColors[stock.ticker] === 'red' && 'text-red-500',
                              stockColors[stock.ticker] === 'green' && 'text-green-500',
                              stockColors[stock.ticker] === 'yellow' && 'text-yellow-500',
                              !stockColors[stock.ticker] && 'text-gray-400'
                            )}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" />
                            </svg>
                          </button>

                        </div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCommentModal(stock.id);
                          }}
                          className={clsx(
                            "p-1 rounded-lg hover:bg-blue-100 transition-colors shadow-sm",
                            stockComments[stock.ticker] ? "text-blue-600" : "text-gray-400"
                          )}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </td>
                      <td className="px-2 py-3">
                        <div className="font-bold text-gray-900 text-sm bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stock.ticker}</div>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={clsx(
                          getSentimentColor(stock.sentiment_score),
                          "px-2 py-1 rounded-lg text-xs font-bold shadow-sm"
                        )}>
                          {stock.sentiment_score}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center">
                        <span className={clsx(
                          getSentimentColor(stock.signal_score),
                          "px-2 py-1 rounded-lg text-xs font-bold shadow-sm"
                        )}>
                          {stock.signal_score}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        <span className={stock.rule1_score && stock.rule1_score < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.rule1_score)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        <span className={stock.moat_score && stock.moat_score < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.moat_score)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        <span className={stock.management_score && stock.management_score < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.management_score)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-bold">
                        <span className={stock.buy_price && stock.buy_price < 0 ? 'text-red-600' : 'text-green-600'}>
                          {formatNumber(stock.buy_price)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-bold">
                        <span className={stock.buy_price && (stock.buy_price * 2) < 0 ? 'text-red-600' : 'text-blue-600'}>
                          {formatNumber(stock.buy_price * 2)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-right text-sm font-medium">
                        <span className={(stock.last_price || stock.current_ratio) && Number(stock.last_price || stock.current_ratio) < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.last_price || stock.current_ratio)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-bold">
                        <span className={clsx(
                          "px-2 py-1 rounded-lg text-xs shadow-sm",
                          (stock.per_upside || stock.pe) && Number(stock.per_upside || stock.pe) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        )}>
                          {formatNumber(stock.per_upside || stock.pe)}%
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        <span className={(stock.last_gr || stock.dividend) && Number(stock.last_gr || stock.dividend) < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.last_gr || stock.dividend)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        <span className={(stock.long_gr || stock.cash_per_share) && Number(stock.long_gr || stock.cash_per_share) < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatNumber(stock.long_gr || stock.cash_per_share)}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-center text-sm font-medium">
                        {(stock.pbt || stock.guru) ? String(stock.pbt || stock.guru).replace(/\d+\.\d+/g, (match) => Math.round(parseFloat(match)).toString()) : '-'}
                      </td>
                      <td className="px-2 py-3">
                        <span className={clsx("px-2 py-1 rounded-lg text-xs font-medium shadow-sm", 
                          getSourceBadgeColor(stock.source)
                        )}>
                          {stock.source}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-500 font-medium">
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
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{language === 'fr' ? 'Ajouter un commentaire' : 'Add Comment'}</h3>
                  <p className="text-sm text-gray-500">{language === 'fr' ? 'Partagez vos réflexions sur cette action' : 'Share your thoughts about this stock'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{language === 'fr' ? 'Votre commentaire' : 'Your Comment'}</label>
                  <textarea
                    value={currentComment}
                    onChange={(e) => setCurrentComment(e.target.value)}
                    placeholder={language === 'fr' ? 'Que pensez-vous de cette action ?' : 'What are your thoughts on this stock?'}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleCommentSave(showCommentModal, currentComment)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {language === 'fr' ? 'Enregistrer le commentaire' : 'Save Comment'}
                </button>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import NewsSection from '@/app/ui/news-section';
import { TickerViewModal } from '@/app/ui/stocks/ticker-view-modal';

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value.replace(/[$,]/g, ''));
  } else {
    num = Number(value);
  }
  
  if (isNaN(num)) return '-';
  
  const rounded = Math.round(num);
  return rounded.toString();
};

const formatBuyPrice = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  
  if (typeof value === 'string') {
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

export default function GoldStockAnalysisPage({ params }: { params: { ticker: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useSettings();
  const { user } = useAuth();
  
  const decodedTicker = decodeURIComponent(params.ticker);
  const tickerSymbol = decodedTicker.includes(':') ? decodedTicker.split(':')[1] : decodedTicker;
  
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [currentStock, setCurrentStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'per_upside'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
  );
  const [selectedSource, setSelectedSource] = useState<string>(
    searchParams.get('source') || ''
  );
  const [searchTicker, setSearchTicker] = useState<string>(
    searchParams.get('search') || ''
  );
  const [isFiltered, setIsFiltered] = useState<boolean>(
    searchParams.get('filtered') === 'true'
  );
  const [filters, setFilters] = useState({
    sentiment: parseInt(searchParams.get('sentiment') || '60'),
    moat: parseInt(searchParams.get('moat') || '85'),
    rule1: parseInt(searchParams.get('rule1') || '85'),
    management: parseInt(searchParams.get('management') || '85')
  });

  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [allUserComments, setAllUserComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [companyInfo, setCompanyInfo] = useState<any>(null);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState<boolean>(false);
  const [expandedDescription, setExpandedDescription] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'news' | 'company' | 'portfolio' | 'comments'>('news');
  const [isEditingAction, setIsEditingAction] = useState<boolean>(false);
  const [editAction, setEditAction] = useState<string>('');
  const [editPortfolio, setEditPortfolio] = useState<string>('');
  const [tickerViewData, setTickerViewData] = useState<{stock_ticker: string, ticker_view: string, rule1_ticker: string} | null>(null);
  const [editingStockTicker, setEditingStockTicker] = useState<boolean>(false);
  const [editingTickerView, setEditingTickerView] = useState<boolean>(false);
  const [editingRule1Ticker, setEditingRule1Ticker] = useState<boolean>(false);
  const [tempStockTicker, setTempStockTicker] = useState<string>('');
  const [tempTickerView, setTempTickerView] = useState<string>('');
  const [tempRule1Ticker, setTempRule1Ticker] = useState<string>('');

  // Color management using API
  const cycleColor = async () => {
    if (!currentStock) return;
    
    const colors = ['neutral', 'red', 'green', 'yellow'];
    const currentIndex = colors.indexOf(currentStock.color || 'neutral');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    // Update local state immediately for instant feedback
    setCurrentStock({ ...currentStock, color: nextColor });
    
    // Update via API if ticker_id is available
    if (currentStock.ticker_id) {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`/api/scraper-tasks/${currentStock.ticker_id}/color`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ color: nextColor })
        });
        
        if (!response.ok) {
          console.error('Failed to update color:', response.statusText);
          // Revert local state on API failure
          setCurrentStock({ ...currentStock, color: currentStock.color });
        }
      } catch (error) {
        console.error('Error updating color:', error);
        // Revert local state on error
        setCurrentStock({ ...currentStock, color: currentStock.color });
      }
    }
  };

  // Update ticker info via API
  const updateTickerInfo = async () => {
    if (!currentStock || !editAction.trim()) return;
    
    try {
      const response = await fetch(`/api/proxy/stocks/dan/ticker-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticker: currentStock.ticker,
          last_action: editAction,
          per_portfolio: editPortfolio || '0%'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Update local state
        setCurrentStock({
          ...currentStock,
          last_action: result.last_action,
          per_portfolio: result.per_portfolio
        });
        setIsEditingAction(false);
        setEditAction('');
        setEditPortfolio('');
      } else {
        try {
          const error = await response.json();
          alert(error.error || `Server error: ${response.status}`);
        } catch {
          alert(`Server error: ${response.status} - API endpoint not available`);
        }
      }
    } catch (error) {
      console.error('Error updating ticker info:', error);
      alert('API server is not running or endpoint not found');
    }
  };

  const fetchCompanyInfo = useCallback(async (ticker: string) => {
    if (!ticker) return;
    
    try {
      setLoadingCompanyInfo(true);
      const response = await fetch(`/api/proxy/stocks/company/${ticker}`);
      
      if (response.ok) {
        const data = await response.json();
        setCompanyInfo(data);
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    } finally {
      setLoadingCompanyInfo(false);
    }
  }, []);

  const fetchStocksForDate = useCallback(async (date: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/stocks/grouped?startDate=${date}&endDate=${date}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stocks: ${response.statusText}`);
      }
      
      const stocksData = await response.json();
      
      const tickerStock = stocksData.find((stock: Stock) => stock.ticker === tickerSymbol);
      
      if (tickerStock) {
        // Fetch color from API if ticker_id exists
        if (tickerStock.ticker_id) {
          try {
            const colorResponse = await fetch(`/api/proxy/stocks/${tickerStock.ticker}/color`);
            if (colorResponse.ok) {
              const colorData = await colorResponse.json();
              tickerStock.color = colorData.color || 'neutral';
            }
          } catch (error) {
            console.error('Error fetching color:', error);
          }
        }
        
        setCurrentStock(tickerStock);
        setError(null);
        fetchCompanyInfo(tickerStock.ticker);
      } else {
        setCurrentStock(null);
        setError(`No data found for ${tickerSymbol} on ${date}`);
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again later.');
      setCurrentStock(null);
    } finally {
      setLoading(false);
    }
  }, [tickerSymbol, fetchCompanyInfo]);

  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/stocks/grouped');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        
        const deduplicatedStocks = stocksData.reduce((acc: Stock[], stock: Stock) => {
          const existingStock = acc.find(s => s.ticker === stock.ticker);
          if (!existingStock) {
            acc.push(stock);
          } else {
            const existingTime = new Date(existingStock.updated_at || existingStock.created_at).getTime();
            const currentTime = new Date(stock.updated_at || stock.created_at).getTime();
            if (currentTime > existingTime) {
              const index = acc.findIndex(s => s.ticker === stock.ticker);
              acc[index] = stock;
            }
          }
          return acc;
        }, []);
        
        setAllStocks(deduplicatedStocks);
        
        const tickerIndex = deduplicatedStocks.findIndex((stock: Stock) => stock.ticker === tickerSymbol);
        if (tickerIndex !== -1) {
          setCurrentIndex(tickerIndex);
        }
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load stock analysis data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStocks();
  }, [tickerSymbol]);

  useEffect(() => {
    fetchStocksForDate(selectedDate);
  }, [selectedDate, tickerSymbol, fetchStocksForDate]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const newStock = allStocks[newIndex];
      const params = new URLSearchParams({
        date: selectedDate,
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(selectedSource && { source: selectedSource }),
        ...(searchTicker && { search: searchTicker }),
        ...(isFiltered && {
          filtered: 'true',
          sentiment: filters.sentiment.toString(),
          moat: filters.moat.toString(),
          rule1: filters.rule1.toString(),
          management: filters.management.toString()
        })
      });
      router.push(`/dashboard/gold-stocks/${encodeURIComponent(newStock.ticker)}?${params.toString()}`);
    }
  }, [currentIndex, allStocks, router, selectedDate, sortBy, sortOrder, selectedSource, searchTicker, isFiltered, filters]);

  const handleNext = useCallback(() => {
    if (currentIndex < allStocks.length - 1) {
      const newIndex = currentIndex + 1;
      const newStock = allStocks[newIndex];
      const params = new URLSearchParams({
        date: selectedDate,
        sortBy: sortBy,
        sortOrder: sortOrder,
        ...(selectedSource && { source: selectedSource }),
        ...(searchTicker && { search: searchTicker }),
        ...(isFiltered && {
          filtered: 'true',
          sentiment: filters.sentiment.toString(),
          moat: filters.moat.toString(),
          rule1: filters.rule1.toString(),
          management: filters.management.toString()
        })
      });
      router.push(`/dashboard/gold-stocks/${encodeURIComponent(newStock.ticker)}?${params.toString()}`);
    }
  }, [currentIndex, allStocks, router, selectedDate, sortBy, sortOrder, selectedSource, searchTicker, isFiltered, filters]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') {
        router.push('/dashboard/gold-stocks');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, router]);

  const fetchAllUserComments = useCallback(async () => {
    if (!user) return;
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/proxy/comments/user/${user.id}?t=${timestamp}`);
      if (response.ok) {
        const commentsData = await response.json();
        setAllUserComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching user comments:', error);
    }
  }, [user]);

  const filterCommentsForTicker = useCallback(() => {
    if (!currentStock || !allUserComments.length) {
      setComments([]);
      return;
    }
    const tickerComments = allUserComments.filter(comment => 
      comment.ticker_symbol === currentStock.ticker
    );
    setComments(tickerComments);
  }, [currentStock, allUserComments]);

  const handleSaveComment = async () => {
    if (!newComment.trim() || !user || !currentStock) return;
    try {
      const response = await fetch('/api/proxy/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: newComment,
          user_id: user.id || 1,
          ticker_symbol: currentStock.ticker,
          color: currentStock.color || 'neutral'
        }),
      });
      
      if (response.ok) {
        setNewComment('');
        await fetchAllUserComments();
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce commentaire?' : 'Are you sure you want to delete this comment?')) return;
    try {
      const response = await fetch(`/api/proxy/comments/${commentId}/user/${user?.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchAllUserComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  useEffect(() => {
    if (user) {
      fetchAllUserComments();
    }
  }, [user, fetchAllUserComments]);

  useEffect(() => {
    filterCommentsForTicker();
  }, [currentStock, allUserComments, filterCommentsForTicker]);

  // Fetch ticker view data
  useEffect(() => {
    const fetchTickerViewData = async () => {
      if (!currentStock?.ticker) return;
      try {
        const response = await fetch('/api/stocks/tickers-with-view');
        if (response.ok) {
          const data = await response.json();
          const tickerInfo = data.find((item: any) => item.symbol === currentStock.ticker);
          setTickerViewData(tickerInfo ? {
            stock_ticker: tickerInfo.stock_ticker,
            ticker_view: tickerInfo.ticker_view,
            rule1_ticker: tickerInfo.rule1_ticker
          } : null);
        }
      } catch (error) {
        console.error('Error fetching ticker view data:', error);
      }
    };
    
    fetchTickerViewData();
  }, [currentStock?.ticker]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded-2xl w-48"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-600 rounded-2xl"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded-2xl w-32"></div>
        </div>
      </div>
    );
  }

  if (error || !currentStock) {
    return (
      <div className="space-y-3">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/gold-stocks')}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
                title={language === 'fr' ? 'Retour aux Actions Or' : 'Back to Gold Stocks'}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {tickerSymbol} {language === 'fr' ? 'Analyse' : 'Analysis'}
                </h2>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-8 text-center">
            <h2 className="font-bold mb-2 text-gray-900 dark:text-white">
              {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {language === 'fr' 
                ? `Aucune donnée trouvée pour ${tickerSymbol}`
                : `No data found for ${tickerSymbol}`
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/gold-stocks')}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-start gap-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {tickerSymbol} ({language === 'fr' ? 'Cible' : 'Target'})
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentStock?.full_name || currentStock?.source}
                </p>
                {currentStock?.per_upside && (
                  <span className={`text-xs font-medium ${
                    (currentStock.per_upside ?? 0) > 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {(currentStock.per_upside ?? 0) > 0 ? '+' : ''}{formatNumber(currentStock.per_upside)}% {language === 'fr' ? 'Hausse' : 'Upside'}
                  </span>
                )}
              </div>
            </div>
            
            {companyInfo && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 min-w-0 flex-1 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                    {language === 'fr' ? 'Informations Société' : 'Company Information'}
                  </h3>
                  {companyInfo.business_description && (
                    <button
                      onClick={() => setExpandedDescription(!expandedDescription)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    >
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  )}
                </div>
                {expandedDescription && companyInfo.business_description && (
                  <div className="text-gray-900 dark:text-white text-xs leading-relaxed mb-2 p-2 bg-white dark:bg-gray-800 rounded border">
                    {companyInfo.business_description}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {companyInfo.ceo && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">CEO</span>
                      <div className="font-medium text-gray-900 dark:text-white truncate">{companyInfo.ceo}</div>
                    </div>
                  )}
                  {companyInfo.number_of_employees && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Employés' : 'Employees'}</span>
                      <div className="font-medium text-gray-900 dark:text-white">{companyInfo.number_of_employees.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(`https://www.stockscores.com/charts/charts/?ticker=${tickerSymbol}`, '_blank')}
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
            title={language === 'fr' ? 'Ouvrir le graphique StockScores' : 'Open StockScores chart'}
          >
            📈
          </button>
          {allStocks.length > 1 && (
            <>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-lg">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  #{currentIndex + 1} of {allStocks.length}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className={clsx(
                    "p-1.5 rounded-lg transition-all",
                    currentIndex === 0
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === allStocks.length - 1}
                    className={clsx(
                      "p-1.5 rounded-lg transition-all",
                      currentIndex === allStocks.length - 1
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
            </>
          )}
        </div>
      </div>
      
      {/* Analysis Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 mb-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Données d\'Analyse' : 'Analysis Data'}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={cycleColor}
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: (currentStock.color === 'neutral' || !currentStock.color) ? 'transparent' : currentStock.color }}
            />
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-lg text-xs font-medium">
              {currentStock.source}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock Ticker
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ticker View
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rule1 Ticker
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Signal
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sentiment
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Règle #1' : 'Rule #1'}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Fossé' : 'Moat'}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Gestion' : 'Management'}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Prix Achat' : 'Buy Price'}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  % {language === 'fr' ? 'Hausse' : 'Upside'}
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Prix' : 'Price'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {editingStockTicker ? (
                    <input
                      type="text"
                      value={tempStockTicker}
                      onChange={(e) => setTempStockTicker(e.target.value)}
                      onBlur={async () => {
                        setEditingStockTicker(false);
                        try {
                          await fetch(`/api/stocks/ticker/${currentStock.ticker}/stock-ticker`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ stock_ticker: tempStockTicker })
                          });
                          setTickerViewData(prev => prev ? { ...prev, stock_ticker: tempStockTicker } : { stock_ticker: tempStockTicker, ticker_view: '', rule1_ticker: '' });
                        } catch (error) {
                          console.error('Error updating stock ticker:', error);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                          setEditingStockTicker(false);
                          setTempStockTicker(tickerViewData?.stock_ticker || '');
                        }
                      }}
                      className="w-full px-2 py-1 border border-blue-500 rounded text-sm font-mono bg-white dark:bg-gray-700"
                      autoFocus
                    />
                  ) : (
                    <div
                      onDoubleClick={() => {
                        setEditingStockTicker(true);
                        setTempStockTicker(tickerViewData?.stock_ticker || '');
                      }}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded font-mono text-sm"
                      title={language === 'fr' ? 'Double-cliquer pour modifier' : 'Double-click to edit'}
                    >
                      {tickerViewData?.stock_ticker || '-'}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {editingTickerView ? (
                    <input
                      type="text"
                      value={tempTickerView}
                      onChange={(e) => setTempTickerView(e.target.value)}
                      onBlur={async () => {
                        setEditingTickerView(false);
                        try {
                          await fetch(`/api/stocks/ticker/${currentStock.ticker}/ticker-view`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ ticker_view: tempTickerView })
                          });
                          setTickerViewData(prev => prev ? { ...prev, ticker_view: tempTickerView } : { stock_ticker: '', ticker_view: tempTickerView, rule1_ticker: '' });
                        } catch (error) {
                          console.error('Error updating ticker view:', error);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                          setEditingTickerView(false);
                          setTempTickerView(tickerViewData?.ticker_view || '');
                        }
                      }}
                      className="w-full px-2 py-1 border border-blue-500 rounded text-sm bg-white dark:bg-gray-700"
                      autoFocus
                    />
                  ) : (
                    <div
                      onDoubleClick={() => {
                        setEditingTickerView(true);
                        setTempTickerView(tickerViewData?.ticker_view || '');
                      }}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded text-sm"
                      title={language === 'fr' ? 'Double-cliquer pour modifier' : 'Double-click to edit'}
                    >
                      {tickerViewData?.ticker_view || '-'}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {editingRule1Ticker ? (
                    <input
                      type="text"
                      value={tempRule1Ticker}
                      onChange={(e) => setTempRule1Ticker(e.target.value)}
                      onBlur={async () => {
                        setEditingRule1Ticker(false);
                        try {
                          await fetch(`/api/stocks/ticker/${currentStock.ticker}/rule1-ticker`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ rule1_ticker: tempRule1Ticker })
                          });
                          setTickerViewData(prev => prev ? { ...prev, rule1_ticker: tempRule1Ticker } : { stock_ticker: '', ticker_view: '', rule1_ticker: tempRule1Ticker });
                        } catch (error) {
                          console.error('Error updating rule1 ticker:', error);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') {
                          setEditingRule1Ticker(false);
                          setTempRule1Ticker(tickerViewData?.rule1_ticker || '');
                        }
                      }}
                      className="w-full px-2 py-1 border border-blue-500 rounded text-sm font-mono bg-white dark:bg-gray-700"
                      autoFocus
                    />
                  ) : (
                    <div
                      onDoubleClick={() => {
                        setEditingRule1Ticker(true);
                        setTempRule1Ticker(tickerViewData?.rule1_ticker || '');
                      }}
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded font-mono text-sm"
                      title={language === 'fr' ? 'Double-cliquer pour modifier' : 'Double-click to edit'}
                    >
                      {tickerViewData?.rule1_ticker || '-'}
                    </div>
                  )}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatNumber(currentStock.signal_score)}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatNumber(currentStock.sentiment_score)}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatNumber(currentStock.rule1_score)}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatNumber(currentStock.moat_score)}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatNumber(currentStock.management_score)}
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {formatBuyPrice(currentStock.buy_price)}
                </td>
                <td className="py-3 px-3 text-sm font-medium">
                  <span className={`${
                    (currentStock.per_upside ?? 0) > 0 ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {(currentStock.per_upside ?? 0) > 0 ? '+' : ''}{formatNumber(currentStock.per_upside)}%
                  </span>
                </td>
                <td className="py-3 px-3 text-sm text-gray-900 dark:text-white font-medium">
                  {currentStock.last_price ? `$${formatNumber(currentStock.last_price)}` : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Main Content Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0">
        {/* Chart Section */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            {currentStock.screenshot ? (
              <div className="relative flex-1 bg-gray-50 dark:bg-gray-900 group rounded-xl overflow-hidden">
                <Image 
                  src={currentStock.screenshot} 
                  alt={`${currentStock.ticker} chart`}
                  fill
                  className="object-contain cursor-pointer transition-all hover:scale-[1.02]"
                  priority
                  onClick={() => window.open(currentStock.screenshot, '_blank')}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => window.open(currentStock.screenshot, '_blank')}
                    className="bg-black/80 hover:bg-black text-white p-1.5 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl">
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'fr' ? 'Aucun graphique' : 'No chart'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Sidebar with Tabs */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-3">
            <button
              onClick={() => setSidebarTab('news')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'news'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {language === 'fr' ? 'Actualités' : 'News'}
            </button>
            <button
              onClick={() => setSidebarTab('portfolio')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                sidebarTab === 'portfolio'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setSidebarTab('comments')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors relative ${
                sidebarTab === 'comments'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {language === 'fr' ? 'Commentaires' : 'Comments'}
              {comments.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'news' && (
              <NewsSection ticker={currentStock.ticker} />
            )}
            
            {sidebarTab === 'portfolio' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 h-full">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Gestion Portfolio' : 'Portfolio Management'}</h3>
                  <button
                    onClick={() => {
                      setIsEditingAction(!isEditingAction);
                      if (!isEditingAction) {
                        setEditAction(currentStock.last_action || '');
                        setEditPortfolio(String(currentStock.per_portfolio || ''));
                      }
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                
                {isEditingAction ? (
                  <div className="space-y-3">
                    <select
                      value={editAction}
                      onChange={(e) => setEditAction(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                    >
                      <option value="">{language === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                      <option value="Increased">Increased</option>
                      <option value="Decreased">Decreased</option>
                      <option value="Held">Held</option>
                    </select>
                    <input
                      type="text"
                      value={editPortfolio}
                      onChange={(e) => setEditPortfolio(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
                      placeholder="5%, 10%, etc."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateTickerInfo}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        {language === 'fr' ? 'Sauvegarder' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAction(false);
                          setEditAction('');
                          setEditPortfolio('');
                        }}
                        className="flex-1 bg-gray-500 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
                      >
                        {language === 'fr' ? 'Annuler' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Dernière Action' : 'Last Action'}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentStock.last_action || '-'}</span>
                    </div>
                    {currentStock.per_portfolio && (
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Allocation' : 'Allocation'}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{currentStock.per_portfolio}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {sidebarTab === 'comments' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Commentaires' : 'Comments'}</h3>
                
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                  {loadingComments ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    comments.map((comment) => {
                      const isExpanded = expandedComments.has(comment.id);
                      const isLong = comment.comment.length > 60;
                      const displayText = isLong && !isExpanded 
                        ? comment.comment.substring(0, 60) + '...' 
                        : comment.comment;
                      
                      return (
                        <div key={comment.id} className={`rounded-lg p-2 border-l-2 text-xs ${
                          comment.color === 'red' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                          comment.color === 'green' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' :
                          comment.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                          'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                        }`}>
                          <div className="flex justify-between items-start mb-1">
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {comment.username || `${language === 'fr' ? 'Utilisateur' : 'User'} ${comment.user_id}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </span>
                              {user && comment.user_id === user.id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-900 dark:text-white">
                            {displayText}
                            {isLong && (
                              <button
                                onClick={() => toggleCommentExpansion(comment.id)}
                                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {isExpanded ? '↑' : '↓'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                      {t('noCommentsFound')}
                    </div>
                  )}
                </div>
                
                {/* Add Comment */}
                <div className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t('enterYourComment')}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none text-xs"
                    rows={2}
                  />
                  <button
                    onClick={handleSaveComment}
                    disabled={!newComment.trim() || !user}
                    className="w-full px-2 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {!user ? t('loginRequired') : t('saveComment')}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Analytics Button */}
          <div className="mt-3">
            <button
              onClick={() => {
                const params = new URLSearchParams({
                  date: selectedDate,
                  sortBy: sortBy,
                  sortOrder: sortOrder,
                  ...(selectedSource && { source: selectedSource }),
                  ...(searchTicker && { search: searchTicker }),
                  ...(isFiltered && {
                    filtered: 'true',
                    sentiment: filters.sentiment.toString(),
                    moat: filters.moat.toString(),
                    rule1: filters.rule1.toString(),
                    management: filters.management.toString()
                  })
                });
                router.push(`/dashboard/gold-stocks/${encodeURIComponent(currentStock.ticker)}/analysis?${params.toString()}`);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {language === 'fr' ? 'Analyse Avancée' : 'Advanced Analysis'}
            </button>
          </div>
        </div>
      </div>
      
      {/* External Links Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 mt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.open(`https://www.stockscores.com/charts/charts/?ticker=${currentStock.ticker}`, '_blank')}
            className="bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            📈 StockScores
          </button>
          <button
            onClick={() => window.open(`https://finance.yahoo.com/quote/${currentStock.ticker}`, '_blank')}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            Yahoo Finance
          </button>
          <button
            onClick={() => window.open(`https://www.google.com/finance/quote/${currentStock.ticker}:NASDAQ`, '_blank')}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-xs font-medium transition-colors"
          >
            Google Finance
          </button>
        </div>
      </div>
      

    </div>
  );
}
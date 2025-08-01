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

export default function StockAnalysisPage({ params }: { params: { ticker: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useSettings();
  const { user } = useAuth();
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [currentStock, setCurrentStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  const [showComments, setShowComments] = useState<boolean>(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());

  const fetchStocksForDate = async (date: string) => {
    try {
      setLoading(true);
      
      // Fetch stocks for specific date
      const response = await fetch(`/api/stocks/grouped?startDate=${date}&endDate=${date}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stocks: ${response.statusText}`);
      }
      
      const stocksData = await response.json();
      
      // Find the specific ticker in the response
      const tickerStock = stocksData.find((stock: Stock) => stock.ticker === params.ticker);
      
      if (tickerStock) {
        setCurrentStock(tickerStock);
        setError(null);
      } else {
        setCurrentStock(null);
        setError(`No data found for ${params.ticker} on ${date}`);
      }
    } catch (err) {
      console.error('Error fetching stock data:', err);
      setError('Failed to load stock data. Please try again later.');
      setCurrentStock(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        setLoading(true);
        
        // Fetch all stocks from grouped endpoint for navigation
        const response = await fetch('/api/stocks/grouped');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        
        // Deduplicate by ticker, keeping only the latest updated record
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
        
        // Sort by per_upside descending with proper numeric handling
        const sortedStocks = deduplicatedStocks.sort((a: Stock, b: Stock) => {
          // Convert to numbers, handling string values and null/undefined
          let valueA = 0;
          let valueB = 0;
          
          if (a.per_upside !== null && a.per_upside !== undefined) {
            valueA = typeof a.per_upside === 'string' ? parseFloat(a.per_upside) : Number(a.per_upside);
            if (isNaN(valueA)) valueA = 0;
          }
          
          if (b.per_upside !== null && b.per_upside !== undefined) {
            valueB = typeof b.per_upside === 'string' ? parseFloat(b.per_upside) : Number(b.per_upside);
            if (isNaN(valueB)) valueB = 0;
          }
          
          // Sort descending (highest first): 2442%, 623%, 251%, 74%, 72%, -100%
          return valueB - valueA;
        });
        
        setAllStocks(sortedStocks);
        
        // Find current ticker index
        const tickerIndex = sortedStocks.findIndex((stock: Stock) => stock.ticker === params.ticker);
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
  }, [params.ticker]);

  // Fetch stock data when date changes
  useEffect(() => {
    fetchStocksForDate(selectedDate);
  }, [selectedDate, params.ticker]);

  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    const newDate = nextDate.toISOString().split('T')[0];
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const newStock = allStocks[newIndex];
      router.push(`/dashboard/portfolio/${newStock.ticker}?date=${selectedDate}`);
    }
  }, [currentIndex, allStocks, router, selectedDate]);

  const handleNext = useCallback(() => {
    if (currentIndex < allStocks.length - 1) {
      const newIndex = currentIndex + 1;
      const newStock = allStocks[newIndex];
      router.push(`/dashboard/portfolio/${newStock.ticker}?date=${selectedDate}`);
    }
  }, [currentIndex, allStocks, router, selectedDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

  // Fetch comments
  const fetchComments = async () => {
    if (!currentStock) return;
    try {
      setLoadingComments(true);
      const response = await fetch(`https://www.mytickerlist.com/api/comments/ticker/${currentStock.ticker}`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Save comment
  const handleSaveComment = async () => {
    if (!newComment.trim() || !user || !currentStock) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`https://www.mytickerlist.com/api/comments/ticker/${currentStock.ticker}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: newComment,
          user_id: user.id || 1
        }),
      });
      
      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error saving comment:', error);
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm(language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce commentaire?' : 'Are you sure you want to delete this comment?')) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`https://www.mytickerlist.com/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Load comments when showing comments panel
  useEffect(() => {
    if (showComments && currentStock) {
      fetchComments();
    }
  }, [showComments, currentStock]);

  // Check for comments on page load
  useEffect(() => {
    if (currentStock) {
      fetchComments();
    }
  }, [currentStock]);

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
        {/* Header with Date Navigation */}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/portfolio')}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {params.ticker} {language === 'fr' ? 'Analyse' : 'Analysis'}
                </h2>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousDay}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                title={language === 'fr' ? 'Jour précédent' : 'Previous day'}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {new Date(selectedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
              <button
                onClick={handleNextDay}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className={`p-1 rounded transition-colors ${
                  selectedDate >= new Date().toISOString().split('T')[0]
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'hover:bg-blue-200 dark:hover:bg-blue-800'
                }`}
                title={language === 'fr' ? 'Jour suivant' : 'Next day'}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Error Message */}
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-8 text-center">
            <h2 className="font-bold mb-2 text-gray-900 dark:text-white">
              {language === 'fr' ? 'Aucune donnée disponible' : 'No data available for this date'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {language === 'fr' 
                ? `Aucune donnée trouvée pour ${params.ticker} le ${new Date(selectedDate).toLocaleDateString('fr-FR')}`
                : `No data found for ${params.ticker} on ${new Date(selectedDate).toLocaleDateString('en-US')}`
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'fr' 
                ? 'Utilisez les boutons de navigation pour changer de date'
                : 'Use the navigation buttons to change the date'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Compact Header with Navigation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/portfolio')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {params.ticker} {language === 'fr' ? 'Analyse' : 'Analysis'}
              </h2>
              {allStocks.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  #{currentIndex + 1} / {allStocks.length} • {Math.round(((allStocks.length - currentIndex) / allStocks.length) * 100)}% {language === 'fr' ? 'percentile' : 'percentile'}
                </span>
              )}
            </div>
          </div>
          
          {/* Inline Navigation */}
          {allStocks.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  currentIndex === 0
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === allStocks.length - 1}
                className={clsx(
                  "p-2 rounded-lg transition-all",
                  currentIndex === allStocks.length - 1
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content - Single Row Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
        {/* Chart Section - Takes 4/5 width on xl screens */}
        <div className="xl:col-span-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            {/* Stock Header Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-200 dark:border-blue-800 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentStock.ticker}</h1>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{currentStock.full_name || currentStock.guru || currentStock.source}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                      {currentStock.source}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePreviousDay}
                        className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors"
                        title={language === 'fr' ? 'Jour précédent' : 'Previous day'}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {new Date(selectedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                      <button
                        onClick={handleNextDay}
                        disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                        className={`p-1 rounded transition-colors ${
                          selectedDate >= new Date().toISOString().split('T')[0]
                            ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                            : 'hover:bg-blue-200 dark:hover:bg-blue-800'
                        }`}
                        title={language === 'fr' ? 'Jour suivant' : 'Next day'}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Key Metrics Inline */}
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formatBuyPrice(currentStock.buy_price)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix Achat' : 'Buy Price'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.sentiment_score)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('sentiment')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.signal_score)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{t('signal')}</div>
                  </div>
                  <div className={`font-bold rounded-lg px-3 py-2 text-lg ${
                    (currentStock.per_upside ?? 0) > 0 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-600 text-white'
                  }`}>
                    {(currentStock.per_upside ?? 0) > 0 ? '+' : ''}{formatNumber(currentStock.per_upside)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chart */}
            {currentStock.screenshot ? (
              <div className="relative h-[500px] bg-gray-50 dark:bg-gray-700 group">
                <Image 
                  src={currentStock.screenshot} 
                  alt={`${currentStock.ticker} chart`}
                  fill
                  className="object-contain cursor-pointer transition-transform hover:scale-105"
                  priority
                  onClick={() => window.open(currentStock.screenshot, '_blank')}
                />
                {/* Fullscreen overlay button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => window.open(currentStock.screenshot, '_blank')}
                    className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition-colors"
                    title={language === 'fr' ? 'Ouvrir en plein écran' : 'Open fullscreen'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                {/* Chart info overlay */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white rounded-lg px-2 py-1">
                  <span className="text-xs font-medium">{language === 'fr' ? 'Cliquer pour agrandir' : 'Click to enlarge'}</span>
                </div>
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No chart available</p>
                </div>
              </div>
            )}
            
            {/* Bottom Metrics Bar */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 border-t border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-6 gap-4 text-center">
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.rule1_score)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Règle #1' : 'Rule #1'}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.moat_score)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Fossé' : 'Moat'}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.management_score)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Gestion' : 'Management'}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.long_gr)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Croiss. Long' : 'Long Growth'}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.last_gr)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Dern. Croiss.' : 'Last Growth'}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.pbt)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">PBT</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Sidebar - Takes 1/5 width on xl screens */}
        <div className="space-y-3">
          {/* Financial Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{t('financial')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{t('stickerPrice')}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {(() => {
                    if (!currentStock.buy_price) return '-';
                    const buyPriceStr = String(currentStock.buy_price);
                    if (buyPriceStr === '$0' || buyPriceStr === '0') return '-';
                    const buyPrice = parseFloat(buyPriceStr.replace(/[$,]/g, ''));
                    return isNaN(buyPrice) || buyPrice === 0 ? '-' : formatCurrency(buyPrice * 2);
                  })()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix' : 'Price'}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {currentStock.last_price ? `$${formatNumber(currentStock.last_price)}` : '-'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
            <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Actions' : 'Actions'}</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/dashboard/portfolio/${currentStock.ticker}/analysis?date=${selectedDate}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {language === 'fr' ? 'Détails' : 'Details'}
              </button>
              
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => window.open(`https://finance.yahoo.com/quote/${currentStock.ticker}`, '_blank')}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-1 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                >
                  Yahoo
                </button>
                <button
                  onClick={() => window.open(`https://www.google.com/finance/quote/${currentStock.ticker}:NASDAQ`, '_blank')}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-1 rounded-lg text-xs font-medium transition-colors flex items-center justify-center"
                >
                  Google
                </button>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`py-2 px-1 rounded-lg text-xs font-medium transition-colors flex items-center justify-center relative ${
                    showComments 
                      ? 'bg-blue-600 text-white' 
                      : comments.length > 0
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  💬
                  {comments.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 rounded-full h-2 w-2"></span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{t('commentsFor')} {currentStock.ticker}</h3>
              
              {/* Comments List */}
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {loadingComments ? (
                  <div className="text-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : comments.length > 0 ? (
                  comments.map((comment) => {
                    const isExpanded = expandedComments.has(comment.id);
                    const isLong = comment.comment_text.length > 80;
                    const displayText = isLong && !isExpanded 
                      ? comment.comment_text.substring(0, 80) + '...' 
                      : comment.comment_text;
                    
                    return (
                      <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                        <div className="flex justify-between items-start mb-1">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {comment.username || `${language === 'fr' ? 'Utilisateur' : 'User'} ${comment.user_id}`}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(comment.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                            </span>
                            {user && comment.user_id === user.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                title={language === 'fr' ? 'Supprimer' : 'Delete'}
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
                              {isExpanded 
                                ? (language === 'fr' ? 'Voir moins' : 'Read less')
                                : (language === 'fr' ? 'Lire plus' : 'Read more')
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-400">
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
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 resize-none text-xs"
                  rows={2}
                />
                <button
                  onClick={handleSaveComment}
                  disabled={!newComment.trim() || !user}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!user ? t('loginRequired') : t('saveComment')}
                </button>
              </div>
            </div>
          )}
          
          {/* Analysis Summary */}
          {currentStock.last_action && (
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
              <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Résumé' : 'Summary'}</h3>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Dernière Action:' : 'Last Action:'}</span>
                <span className="font-medium text-gray-900 dark:text-white ml-1">{currentStock.last_action}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Navigation Strip */}
      {allStocks.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {language === 'fr' ? 'Navigation Rapide' : 'Quick Navigation'}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Trié par potentiel • Utilisez ← →' : 'Sorted by upside • Use ← →'}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2 max-h-20 overflow-y-auto">
            {allStocks.map((stock, index) => {
              const upside = stock.per_upside ?? 0;
              const isPositive = upside > 0;
              return (
                <button
                  key={stock.id}
                  onClick={() => router.push(`/dashboard/portfolio/${stock.ticker}?date=${selectedDate}`)}
                  className={`p-1.5 rounded-lg text-xs font-medium transition-all border ${
                    index === currentIndex
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : isPositive
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="truncate font-bold text-xs">{stock.ticker}</div>
                  <div className={`text-[10px] font-semibold ${
                    index === currentIndex ? 'opacity-70' : isPositive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                  }`}>
                    {isPositive ? '+' : ''}{formatNumber(upside)}%
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
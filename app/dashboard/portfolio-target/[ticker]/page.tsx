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

interface Comment {
  id: number;
  ticker: string;
  user_id?: number;
  comment_text: string;
  created_at: string;
  updated_at: string;
  username?: string;
  color?: string;
}

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

export default function PortfolioTargetStockAnalysisPage({ params }: { params: { ticker: string } }) {
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
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'per_upside'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
  );

  // Get sort display info
  const getSortDisplayInfo = () => {
    const sortLabels: { [key: string]: string } = {
      'per_upside': '% Upside',
      'buy_price': 'Buy Price',
      'sentiment_score': 'Sentiment',
      'signal_score': 'Signal',
      'rule1_score': 'Rule1',
      'moat_score': 'Moat',
      'management_score': 'Management',
      'last_price': 'Current Price',
      'ticker': 'Ticker',
      'created_at': 'Date',
      'date': 'Date'
    };
    
    return {
      field: sortLabels[sortBy] || sortBy,
      order: sortOrder === 'asc' ? 'ascending' : 'descending'
    };
  };
  const [showComments, setShowComments] = useState<boolean>(true);
  const [comments, setComments] = useState<any[]>([]);
  const [allUserComments, setAllUserComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [isEditingAction, setIsEditingAction] = useState<boolean>(false);
  const [editAction, setEditAction] = useState<string>('');
  const [editPortfolio, setEditPortfolio] = useState<string>('');

  // Color management using API
  const cycleColor = async () => {
    if (!currentStock) return;
    
    const colors = ['neutral', 'red', 'green', 'yellow'];
    const currentIndex = colors.indexOf(currentStock.color || 'neutral');
    const nextColor = colors[(currentIndex + 1) % colors.length];
    
    const originalColor = currentStock.color;
    
    // Update local state immediately for instant feedback
    setCurrentStock({ ...currentStock, color: nextColor });
    
    // Update via proxy API using ticker
    try {
      const response = await fetch(`/api/proxy/stocks/${currentStock.ticker}/color`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ color: nextColor })
      });
      
      if (!response.ok) {
        console.error('Failed to update color:', response.statusText);
        // Revert local state on API failure
        setCurrentStock({ ...currentStock, color: originalColor });
      } else {
        // Update the stock in allStocks array to persist the change
        setAllStocks(prevStocks => 
          prevStocks.map(stock => 
            stock.ticker === currentStock.ticker 
              ? { ...stock, color: nextColor }
              : stock
          )
        );
      }
    } catch (error) {
      console.error('Error updating color:', error);
      // Revert local state on error
      setCurrentStock({ ...currentStock, color: originalColor });
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

  const fetchStocksForDate = async (date: string) => {
    try {
      setLoading(true);
      
      // Fetch stocks for specific date using proxy API to ensure color data is included
      const response = await fetch(`/api/proxy/stocks/grouped?startDate=${date}&endDate=${date}`);
      
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
        const response = await fetch('/api/proxy/stocks/grouped');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const stocksData = await response.json();
        
        // Filter only target=true stocks
        const targetStocks = stocksData.filter((stock: Stock) => stock.target === true);
        
        // Deduplicate by ticker, keeping only the latest updated record
        const deduplicatedStocks = targetStocks.reduce((acc: Stock[], stock: Stock) => {
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
        
        // Apply the same sorting logic as the portfolio-target table
        const sortedStocks = [...deduplicatedStocks].sort((a: Stock, b: Stock) => {
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
            const dateA = new Date(valueA as string).getTime();
            const dateB = new Date(valueB as string).getTime();
            comparison = dateA - dateB;
          }
          // Numeric fields (scores, prices, percentages)
          else if (['signal_score', 'sentiment_score', 'rule1_score', 'moat_score', 'management_score', 
                    'buy_price', 'last_price', 'long_gr', 'last_gr', 'pbt'].includes(sortBy)) {
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

  // Sync currentStock with allStocks when ticker changes
  useEffect(() => {
    if (allStocks.length > 0) {
      const stockFromList = allStocks.find(stock => stock.ticker === params.ticker);
      if (stockFromList && currentStock) {
        setCurrentStock({ ...currentStock, color: stockFromList.color });
      }
    }
  }, [params.ticker, allStocks]);

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
      router.push(`/dashboard/portfolio-target/${newStock.ticker}?date=${selectedDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
    }
  }, [currentIndex, allStocks, router, selectedDate, sortBy, sortOrder]);

  const handleNext = useCallback(() => {
    if (currentIndex < allStocks.length - 1) {
      const newIndex = currentIndex + 1;
      const newStock = allStocks[newIndex];
      router.push(`/dashboard/portfolio-target/${newStock.ticker}?date=${selectedDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
    }
  }, [currentIndex, allStocks, router, selectedDate, sortBy, sortOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') {
        // Go back to portfolio-target with preserved state
        const referrer = document.referrer;
        const isFromPortfolioTarget = referrer.includes('/dashboard/portfolio-target') && !referrer.includes('/dashboard/portfolio-target/');
        
        if (isFromPortfolioTarget && window.history.length > 1) {
          window.history.back();
        } else {
          router.push('/dashboard/portfolio-target');
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious, router]);

  // Fetch all user comments
  const fetchAllUserComments = async () => {
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
  };

  // Filter comments for current ticker
  const filterCommentsForTicker = () => {
    if (!currentStock || !allUserComments.length) {
      setComments([]);
      return;
    }
    const tickerComments = allUserComments.filter(comment => 
      comment.ticker_symbol === currentStock.ticker
    );
    setComments(tickerComments);
  };

  // Save comment
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

  // Delete comment
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

  // Load user comments on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAllUserComments();
    }
  }, [user]);

  // Filter comments when stock or user comments change
  useEffect(() => {
    filterCommentsForTicker();
  }, [currentStock, allUserComments]);

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
                onClick={() => {
                  // Check if we came from portfolio-target page
                  const referrer = document.referrer;
                  const isFromPortfolioTarget = referrer.includes('/dashboard/portfolio-target') && !referrer.includes('/dashboard/portfolio-target/');
                  
                  if (isFromPortfolioTarget && window.history.length > 1) {
                    // Use browser back to preserve state
                    window.history.back();
                  } else {
                    // Fallback to direct navigation
                    router.push('/dashboard/portfolio-target');
                  }
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
                title={language === 'fr' ? 'Retour au Portfolio Target' : 'Back to Portfolio Target'}
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {params.ticker} {language === 'fr' ? 'Analyse (Target)' : 'Analysis (Target)'}
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
    <div className="h-screen flex flex-col p-4 max-w-full overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const referrer = document.referrer;
              const isFromPortfolioTarget = referrer.includes('/dashboard/portfolio-target') && !referrer.includes('/dashboard/portfolio-target/');
              
              if (isFromPortfolioTarget && window.history.length > 1) {
                window.history.back();
              } else {
                router.push('/dashboard/portfolio-target');
              }
            }}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {params.ticker} <span className="text-yellow-600">(Target)</span>
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentStock?.full_name || currentStock?.source}
              </p>
              {/* Sort indicator badge */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-md">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {getSortDisplayInfo().field} {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Controls */}
        {allStocks.length > 1 && (
          <div className="flex items-center gap-3">
            {/* Enhanced position indicator */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  #{currentIndex + 1} of {allStocks.length}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  (sorted by {getSortDisplayInfo().field.toLowerCase()})
                </div>
              </div>
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
          </div>
        )}
      </div>
      
      {/* Inline Key Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-lg font-bold flex items-center gap-1 justify-center ${
                (currentStock.per_upside ?? 0) > 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {(currentStock.per_upside ?? 0) > 0 ? '+' : ''}{formatNumber(currentStock.per_upside)}%
                {(sortBy === 'per_upside' || sortBy === 'upside') && (
                  <span className="text-blue-500 text-sm">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('upside')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-center">
                {formatBuyPrice(currentStock.buy_price)}
                {sortBy === 'buy_price' && (
                  <span className="text-blue-500 text-sm">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('buyPrice')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-center">
                {formatNumber(currentStock.sentiment_score)}
                {sortBy === 'sentiment_score' && (
                  <span className="text-blue-500 text-sm">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('sentiment')}</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1 justify-center">
                {formatNumber(currentStock.signal_score)}
                {sortBy === 'signal_score' && (
                  <span className="text-blue-500 text-sm">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('signal')}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={cycleColor}
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 hover:border-gray-400 transition-colors"
              style={{ backgroundColor: (currentStock.color === 'neutral' || !currentStock.color) ? 'transparent' : currentStock.color }}
            />
            <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-lg text-xs font-medium">
              Target • {currentStock.source}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousDay}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 font-medium px-2">
                {new Date(selectedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
              <button
                onClick={handleNextDay}
                disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                className={`p-1 rounded transition-colors ${
                  selectedDate >= new Date().toISOString().split('T')[0]
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content Layout - Flex to fill remaining height */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 min-h-0 mb-3">
        {/* Chart Section */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 h-full flex flex-col">
            {/* Chart */}
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
        
        {/* Compact Sidebar */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* All-in-one Sidebar Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 flex-1 flex flex-col min-h-0">
            {/* Metrics */}
            <div className="mb-3">
              <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Métriques' : 'Metrics'}</h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('rule1')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(currentStock.rule1_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('moat')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(currentStock.moat_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('management')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(currentStock.management_score)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('stickerPrice')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      if (!currentStock.buy_price) return '-';
                      const buyPriceStr = String(currentStock.buy_price);
                      if (buyPriceStr === '$0' || buyPriceStr === '0') return '-';
                      const buyPrice = parseFloat(buyPriceStr.replace(/[$,]/g, ''));
                      return isNaN(buyPrice) || buyPrice === 0 ? '-' : formatCurrency(buyPrice * 2);
                    })()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix Actuel' : 'Current Price'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {currentStock.last_price ? `$${formatNumber(currentStock.last_price)}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Croiss. Analyste' : 'Analyst Growth'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(currentStock.long_gr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Croiss. Composite' : 'Composite Growth'}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatNumber(currentStock.last_gr)}</span>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mb-3">
              <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Actions' : 'Actions'}</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/portfolio/${currentStock.ticker}/analysis?date=${selectedDate}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                >
                  {language === 'fr' ? 'Analyse Détaillée' : 'Detailed Analysis'}
                </button>
                
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => window.open(`https://finance.yahoo.com/quote/${currentStock.ticker}`, '_blank')}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Yahoo
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/finance/quote/${currentStock.ticker}:NASDAQ`, '_blank')}
                    className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    Google
                  </button>
                </div>
                
                <button
                  onClick={() => setShowComments(!showComments)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                    showComments 
                      ? 'bg-blue-600 text-white' 
                      : comments.length > 0
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  💬 {language === 'fr' ? 'Commentaires' : 'Comments'}
                  {comments.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {comments.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            {showComments && (
              <div className="flex-1 flex flex-col min-h-0">
                <h3 className="font-semibold mb-2 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Commentaires' : 'Comments'}</h3>
                
                {/* Comments List */}
                <div className="flex-1 space-y-2 mb-2 overflow-y-auto min-h-0">
                  {loadingComments ? (
                    <div className="text-center py-2">
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
                              {comment.username || `${language === 'fr' ? 'User' : 'User'} ${comment.user_id}`}
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
            
            {/* Portfolio Summary */}
            {!showComments && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Portfolio' : 'Portfolio'}</h3>
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
                  <div className="space-y-2">
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
                    <div className="flex gap-1">
                      <button
                        onClick={updateTickerInfo}
                        className="flex-1 bg-blue-600 text-white py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        {language === 'fr' ? 'Save' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingAction(false);
                          setEditAction('');
                          setEditPortfolio('');
                        }}
                        className="flex-1 bg-gray-500 text-white py-1.5 px-2 rounded-lg text-xs font-medium hover:bg-gray-600 transition-colors"
                      >
                        {language === 'fr' ? 'Cancel' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Action' : 'Action'}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{currentStock.last_action || '-'}</span>
                    </div>
                    {currentStock.per_portfolio && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Allocation' : 'Allocation'}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{currentStock.per_portfolio}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
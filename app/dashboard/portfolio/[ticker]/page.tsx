'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import { useSettings } from '@/app/contexts/settings-context';
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
  const { t, language } = useSettings();
  const [allStocks, setAllStocks] = useState<Stock[]>([]);
  const [currentStock, setCurrentStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchAllStocks = async () => {
      try {
        setLoading(true);
        
        // Fetch all stocks from grouped endpoint
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
          setCurrentStock(sortedStocks[tickerIndex]);
        } else {
          setError(`Ticker ${params.ticker} not found`);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load stock analysis data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllStocks();
  }, [params.ticker]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const newStock = allStocks[newIndex];
      router.push(`/dashboard/portfolio/${newStock.ticker}`);
    }
  }, [currentIndex, allStocks, router]);

  const handleNext = useCallback(() => {
    if (currentIndex < allStocks.length - 1) {
      const newIndex = currentIndex + 1;
      const newStock = allStocks[newIndex];
      router.push(`/dashboard/portfolio/${newStock.ticker}`);
    }
  }, [currentIndex, allStocks, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleNext, handlePrevious]);

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
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-8 text-center">
          <h2 className="font-bold mb-2 text-gray-900 dark:text-white">
            {!currentStock ? 'No Analysis Found' : 'Error Loading Analysis'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {!currentStock 
              ? `No analysis data found for ${params.ticker}`
              : error
            }
          </p>
          <button 
            onClick={() => router.push('/dashboard/portfolio')}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            <ArrowLeftIcon className="w-4 h-4 inline mr-2" />
            Back to Portfolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard/portfolio')}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {params.ticker} {language === 'fr' ? 'Analyse' : 'Analysis'}
            </h2>
            {allStocks.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({currentIndex + 1}/{allStocks.length})
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Stock Overview List */}
      {allStocks.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {language === 'fr' ? 'Navigation Rapide' : 'Quick Navigation'}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Trié par potentiel' : 'Sorted by upside'}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-32 overflow-y-auto">
            {allStocks.map((stock, index) => {
              const upside = stock.per_upside ?? 0;
              const isPositive = upside > 0;
              return (
                <button
                  key={stock.id}
                  onClick={() => router.push(`/dashboard/portfolio/${stock.ticker}`)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                    index === currentIndex
                      ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                      : isPositive
                      ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="truncate font-bold">{stock.ticker}</div>
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
      
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            {currentStock.screenshot ? (
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-gray-50 dark:bg-gray-700">
                <Image 
                  src={currentStock.screenshot} 
                  alt={`${currentStock.ticker} chart`}
                  fill
                  className="object-contain"
                  priority
                />
                <div className="absolute top-2 left-2 bg-black text-white rounded-lg px-2 py-1">
                  <span className="text-xs font-medium">Analysis Chart</span>
                </div>
              </div>
            ) : (
              <div className="h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center bg-gray-50 dark:bg-gray-700">
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
          </div>
        </div>
        
        {/* Stats Column */}
        <div className="space-y-4">
          {/* Enhanced Header Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentStock.ticker}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentStock.full_name || currentStock.guru || currentStock.source}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                    {currentStock.source}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(currentStock.date || currentStock.created_at) ? 
                      new Date(currentStock.date || currentStock.created_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US') : 
                      'No date'
                    }
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold rounded-lg px-3 py-1.5 text-lg ${
                  (currentStock.per_upside ?? 0) > 0 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-white'
                }`}>
                  {(currentStock.per_upside ?? 0) > 0 ? '+' : ''}{formatNumber(currentStock.per_upside)}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{language === 'fr' ? 'Potentiel' : 'Upside'}</p>
              </div>
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.sentiment_score)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('sentiment')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.signal_score)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{t('signal')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{formatBuyPrice(currentStock.buy_price)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix Achat' : 'Buy Price'}</div>
              </div>
            </div>
          </div>
          
          {/* Metrics Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{t('keyMetrics')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('sentiment')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.sentiment_score)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('signal')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.signal_score)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Règle #1' : 'Rule #1'}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.rule1_score)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Fossé' : 'Moat'}</p>
                <p className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.moat_score)}</p>
              </div>
            </div>
          </div>
          
          {/* Financial Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{t('financial')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix Achat' : 'Buy Price'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatBuyPrice(currentStock.buy_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('stickerPrice')}</span>
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
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Prix' : 'Price'}</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {currentStock.last_price ? `$${formatNumber(currentStock.last_price)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Gestion' : 'Management'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.management_score)}</span>
              </div>
            </div>
          </div>
          
          {/* Growth Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Croissance' : 'Growth'}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Croiss. Long' : 'Long Growth'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.long_gr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Dern. Croiss.' : 'Last Growth'}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.last_gr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">PBT</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatNumber(currentStock.pbt)}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Actions' : 'Actions'}</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/dashboard/portfolio/${currentStock.ticker}/analysis`)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {language === 'fr' ? 'Analyse Détaillée' : 'Detailed Analysis'}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.open(`https://finance.yahoo.com/quote/${currentStock.ticker}`, '_blank')}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Yahoo
                </button>
                <button
                  onClick={() => window.open(`https://www.google.com/finance/quote/${currentStock.ticker}:NASDAQ`, '_blank')}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Google
                </button>
              </div>
            </div>
          </div>
          
          {/* Analysis Summary Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{language === 'fr' ? 'Résumé de l\'Analyse' : 'Analysis Summary'}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Rang' : 'Rank'}</span>
                <span className="font-bold text-gray-900 dark:text-white">#{currentIndex + 1} / {allStocks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Percentile' : 'Percentile'}</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {Math.round(((allStocks.length - currentIndex) / allStocks.length) * 100)}%
                </span>
              </div>
              {currentStock.last_action && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Dernière Action' : 'Last Action'}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{currentStock.last_action}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Navigation */}
      {allStocks.length > 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  currentIndex === 0
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
                {currentIndex > 0 && (
                  <span className="hidden sm:inline">{allStocks[currentIndex - 1].ticker}</span>
                )}
              </button>
              
              <div className="text-center px-3">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{currentStock.ticker}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {currentIndex + 1} {language === 'fr' ? 'de' : 'of'} {allStocks.length}
                </div>
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentIndex === allStocks.length - 1}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  currentIndex === allStocks.length - 1
                    ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                {currentIndex < allStocks.length - 1 && (
                  <span className="hidden sm:inline">{allStocks[currentIndex + 1].ticker}</span>
                )}
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => router.push('/dashboard/portfolio')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'fr' ? 'Retour' : 'Back'}</span>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / allStocks.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{language === 'fr' ? 'Meilleur potentiel' : 'Highest upside'}</span>
            <span className="font-medium">{t('shortcuts')}: ← →</span>
            <span>{language === 'fr' ? 'Plus faible potentiel' : 'Lowest upside'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
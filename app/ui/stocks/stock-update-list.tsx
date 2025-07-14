'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import DatePickerInput from '@/app/ui/date-picker';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stockdashboard.ddnsfree.com/api';

export default function StockUpdateList({ currentPage }: { currentPage: number }) {
  const router = useRouter();
  const { t } = useSettings();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Auto-refresh every 30 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (selectedDate) {
        const fetchStocks = async () => {
          try {
            const response = await fetch(`${API_URL}/stocks/highlighted`);
            if (response.ok) {
              const data = await response.json();
              const selectedDateStr = selectedDate.toISOString().split('T')[0];
              const filteredStocks = data.filter((stock: Stock) => {
                const stockDate = stock.date ? new Date(stock.date) : new Date(stock.created_at);
                const stockDateStr = stockDate.toISOString().split('T')[0];
                return stockDateStr === selectedDateStr;
              });
              const sortedStocks = [...filteredStocks].sort((a, b) => (b.pe || 0) - (a.pe || 0));
              setStocks(sortedStocks);
            }
          } catch (err) {
            console.error('Auto-refresh failed:', err);
          }
        };
        fetchStocks();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedDate]);

  useEffect(() => {
    const fetchStocks = async () => {
      if (!selectedDate) return;
      
      try {
        setLoading(true);
        
        // Fetch highlighted stocks
        const response = await fetch(`${API_URL}/stocks/highlighted`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Get selected date for filtering
        const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Filter stocks by selected date
        const filteredStocks = data.filter((stock: Stock) => {
          const stockDate = stock.date ? new Date(stock.date) : new Date(stock.created_at);
          const stockDateStr = stockDate.toISOString().split('T')[0];
          return stockDateStr === selectedDateStr;
        });
        
        // Sort by Percentage Upside (pe field) in descending order
        const sortedStocks = [...filteredStocks].sort((a, b) => {
          const valueA = a.pe || 0;
          const valueB = b.pe || 0;
          return valueB - valueA; // Descending order
        });
        
        setStocks(sortedStocks);
        setCurrentIndex(0); // Reset to first stock
        setError(null);
      } catch (err) {
        console.error('Error fetching stocks:', err);
        setError('Failed to load stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();
  }, [selectedDate]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < stocks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, stocks.length]);

  const goToPreviousDay = useCallback(() => {
    if (selectedDate) {
      const prevDay = new Date(selectedDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setSelectedDate(prevDay);
    }
  }, [selectedDate]);

  const goToNextDay = useCallback(() => {
    if (selectedDate) {
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setSelectedDate(nextDay);
    }
  }, [selectedDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowUp') goToPreviousDay();
      if (e.key === 'ArrowDown') goToNextDay();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNextDay, goToPreviousDay, handleNext, handlePrevious]);

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

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-8 text-center">
          <h2 className="font-bold mb-2 text-gray-900 dark:text-white">Error Loading Stocks</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const goToToday = () => {
    setSelectedDate(new Date());
  };



  const dateSelector = (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('stockUpdate')}</h2>
          {stocks.length > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">({currentIndex + 1}/{stocks.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
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
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs ${
              autoRefresh 
                ? 'bg-black dark:bg-white text-white dark:text-black' 
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
        </div>
      </div>
    </div>
  );

  if (stocks.length === 0) {
    return (
      <div className="space-y-4">
        {dateSelector}
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{t('noStocksFound')}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('noStocksAvailableForSelectedDate')}</p>
          <div className="flex justify-center gap-2">
            <button onClick={goToPreviousDay} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">
              {t('yesterday')}
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-sm">
              {t('today')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current stock
  const currentStock = stocks[currentIndex];

  return (
    <div className="space-y-4">
      {dateSelector}
      
      {/* Stock Overview List */}
      {stocks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 max-h-20 overflow-y-auto">
            {stocks.map((stock, index) => (
              <button
                key={stock.id}
                onClick={() => setCurrentIndex(index)}
                className={`p-2 rounded-lg text-xs font-medium transition-all ${
                  index === currentIndex
                    ? 'bg-black dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="truncate">{stock.ticker}</div>
                <div className="text-[10px] opacity-70">+{stock.pe}%</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            {currentStock.screenshot && (
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-gray-50 dark:bg-gray-700">
                <Image 
                  src={currentStock.screenshot} 
                  alt={`${currentStock.ticker} chart`}
                  fill
                  className="object-contain"
                  priority
                />
                <div className="absolute top-2 left-2 bg-black text-white rounded-lg px-2 py-1">
                  <span className="text-xs font-medium">Live Chart</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Column */}
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{currentStock.ticker}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{currentStock.guru}</p>
              </div>
              <div className="text-right">
                <div className="bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg px-3 py-1.5 text-lg">
                  +{currentStock.pe}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upside</p>
              </div>
            </div>
          </div>
          
          {/* Metrics Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{t('keyMetrics')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('sentiment')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{currentStock.sentiment_score}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('signal')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{currentStock.signal_score}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('rule1')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{currentStock.rule1_score !== null ? currentStock.rule1_score : '—'}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">{t('moat')}</p>
                <p className="font-bold text-gray-900 dark:text-white">{currentStock.moat_score !== null ? currentStock.moat_score : '—'}</p>
              </div>
            </div>
          </div>
          
          {/* Financial Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold mb-3 text-sm text-gray-900 dark:text-white">{t('financial')}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('buyPrice')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(currentStock.buy_price).replace('$', '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('stickerPrice')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(currentStock.buy_price * 2).replace('$', '')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('management')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{currentStock.management_score !== null ? currentStock.management_score : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('current')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{currentStock.current_ratio || '—'}</span>
              </div>
            </div>
          </div>
          
          {/* Action Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                {currentStock.source}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {(currentStock.date || currentStock.created_at) ? 
                  new Date(currentStock.date || currentStock.created_at).toLocaleDateString('en-US') : 
                  'No date'
                }
              </span>
            </div>
            <button
              onClick={() => router.push(`/dashboard/highlighted/${currentStock.id}`)}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              {t('analyzeStock')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Navigation & Shortcuts */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
              currentIndex === 0
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            )}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            {t('previous')}
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === stocks.length - 1}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
              currentIndex === stocks.length - 1
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
            )}
          >
            {t('next')}
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">{t('shortcuts')}:</span> ← → {t('navigate')} | ↑ ↓ {t('dates')}
        </div>
      </div>
    </div>
  );
}
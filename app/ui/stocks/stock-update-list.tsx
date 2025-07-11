'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import DatePickerInput from '@/app/ui/date-picker';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stockdashboard.ddnsfree.com/api';

export default function StockUpdateList({ currentPage }: { currentPage: number }) {
  const router = useRouter();
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
        <div className="max-w-2xl w-full mx-auto">
          <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
            <div className="animate-pulse space-y-6">
              <div className="h-64 bg-gray-200 rounded-xl"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <div className="h-12 w-24 bg-gray-200 rounded-lg"></div>
                <div className="h-12 w-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="max-w-md w-full mx-auto">
          <div className="rounded-2xl bg-red-50 p-8 text-center shadow-xl border border-red-100">
            <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Stocks</h2>
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const goToToday = () => {
    setSelectedDate(new Date());
  };



  // Always render the date selector with quick navigation
  const dateSelector = (
    <div className="backdrop-blur-2xl bg-blue-900/10 border border-blue-400/20 rounded-2xl shadow-2xl p-4 mb-6 relative z-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Stock Analysis</h2>
          <div className="flex items-center gap-2">
            <button onClick={goToPreviousDay} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="min-w-[160px] relative z-50">
              <DatePickerInput selectedDate={selectedDate} onChange={handleDateChange} placeholder="Select date..." />
            </div>
            <button onClick={goToNextDay} className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={goToToday} className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-300 text-xs font-semibold transition-all">
              Today
            </button>
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-2 border rounded-lg text-xs font-semibold transition-all ${
                autoRefresh 
                  ? 'bg-green-500/20 border-green-400/30 text-green-300' 
                  : 'bg-gray-500/20 border-gray-400/30 text-gray-300 hover:bg-gray-500/30'
              }`}
            >
              {autoRefresh ? 'Auto ✓' : 'Manual'}
            </button>
          </div>
        </div>

        
        {stocks.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 border border-emerald-400/30 rounded-lg px-2 py-1 text-emerald-300 text-xs font-bold">
                {stocks.length} stocks
              </span>
              <span className="bg-blue-500/20 border border-blue-400/30 rounded-lg px-2 py-1 text-blue-300 text-xs font-bold">
                Best: +{stocks[0]?.pe || 0}%
              </span>
            </div>
            <div className="text-blue-300 text-xs">
              Viewing {currentIndex + 1} of {stocks.length}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (stocks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-3 py-6">
        <div className="max-w-6xl w-full mx-auto relative z-0">
          {dateSelector}
          <div className="mt-20 backdrop-blur-2xl bg-blue-900/10 border border-blue-400/20 rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-blue-500/20 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Stocks Found</h3>
            <p className="text-blue-300 mb-4">No stocks are available for the selected date.</p>
            <div className="flex justify-center gap-2">
              <button onClick={goToPreviousDay} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 text-sm transition-all">
                Try Yesterday
              </button>
              <button onClick={goToToday} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 rounded-lg text-emerald-300 text-sm transition-all">
                Go to Today
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get current stock
  const currentStock = stocks[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 px-3 py-6">
      <div className="max-w-6xl w-full mx-auto">
        {dateSelector}
        
        {/* Stock Overview List */}
        {stocks.length > 0 && (
          <div className="backdrop-blur-2xl bg-blue-900/10 border border-blue-400/20 rounded-2xl shadow-2xl p-4 mb-6">
            <h3 className="text-white font-semibold mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
              {stocks.map((stock, index) => (
                <button
                  key={stock.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                    index === currentIndex
                      ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                      : 'bg-blue-500/10 border border-blue-400/20 text-blue-300 hover:bg-blue-500/20'
                  }`}
                >
                  <div className="truncate">{stock.ticker}</div>
                  <div className="text-[10px] text-emerald-300">+{stock.pe}%</div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Stock Card */}
        <div className="backdrop-blur-2xl bg-blue-900/10 border border-blue-400/20 rounded-3xl shadow-2xl overflow-hidden hover:bg-blue-900/20 hover:border-blue-400/30 transition-all duration-700 hover:shadow-blue-500/20">
          {/* Screenshot */}
          {currentStock.screenshot && (
            <div className="relative h-[400px] md:h-[550px] lg:h-[700px] bg-gradient-to-br from-blue-950/50 to-indigo-950/50 border-b border-blue-400/20">
              <Image 
                src={currentStock.screenshot} 
                alt={`${currentStock.ticker} chart`}
                fill
                className="object-contain"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/30 via-transparent to-transparent"></div>
              <div className="absolute top-4 left-4 backdrop-blur-md bg-blue-900/30 border border-blue-400/30 rounded-xl px-3 py-1.5">
                <span className="text-blue-200 text-xs font-bold uppercase tracking-wider">Live Chart</span>
              </div>
            </div>
          )}
          
          {/* Card Content */}
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black text-white mb-0.5 tracking-tight">{currentStock.ticker}</h1>
                <p className="text-blue-300 text-xs font-medium">{currentStock.guru}</p>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-black rounded-lg px-3 py-1.5 shadow-lg shadow-blue-500/25">
                  +{currentStock.pe}%
                </div>
                <p className="text-[9px] text-blue-400 mt-0.5 font-semibold tracking-wide uppercase">Upside</p>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-5 gap-2 mb-4">
              <div className="backdrop-blur-md bg-blue-500/15 p-2 rounded-lg border border-blue-400/25 hover:border-blue-400/40 hover:bg-blue-500/20 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-blue-300 mb-0.5 uppercase tracking-wider">Sentiment</p>
                <p className={clsx(
                  "text-sm font-black group-hover:scale-110 transition-transform duration-300",
                  getSentimentColor(currentStock.sentiment_score).includes('green') ? 'text-blue-400' :
                  getSentimentColor(currentStock.sentiment_score).includes('red') ? 'text-red-400' : 'text-yellow-400'
                )}>
                  {currentStock.sentiment_score}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-indigo-500/15 p-2 rounded-lg border border-indigo-400/25 hover:border-indigo-400/40 hover:bg-indigo-500/20 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-indigo-300 mb-0.5 uppercase tracking-wider">Signal</p>
                <p className={clsx(
                  "text-sm font-black group-hover:scale-110 transition-transform duration-300",
                  getSentimentColor(currentStock.signal_score).includes('green') ? 'text-blue-400' :
                  getSentimentColor(currentStock.signal_score).includes('red') ? 'text-red-400' : 'text-yellow-400'
                )}>
                  {currentStock.signal_score}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-cyan-500/15 p-2 rounded-lg border border-cyan-400/25 hover:border-cyan-400/40 hover:bg-cyan-500/20 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-cyan-300 mb-0.5 uppercase tracking-wider">Rule1</p>
                <p className="text-sm font-black text-cyan-400 group-hover:scale-110 transition-transform duration-300">
                  {currentStock.rule1_score !== null ? currentStock.rule1_score : '—'}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-sky-500/15 p-2 rounded-lg border border-sky-400/25 hover:border-sky-400/40 hover:bg-sky-500/20 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-sky-300 mb-0.5 uppercase tracking-wider">Moat</p>
                <p className="text-sm font-black text-sky-400 group-hover:scale-110 transition-transform duration-300">
                  {currentStock.moat_score !== null ? currentStock.moat_score : '—'}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-emerald-500/15 p-2 rounded-lg border border-emerald-400/25 hover:border-emerald-400/40 hover:bg-emerald-500/20 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-emerald-300 mb-0.5 uppercase tracking-wider">Buy Price</p>
                <p className="text-sm font-black text-emerald-400 group-hover:scale-110 transition-transform duration-300">
                  {formatCurrency(currentStock.buy_price).replace('$', '')}
                </p>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="backdrop-blur-md bg-blue-600/10 p-2 rounded-lg border border-blue-400/20 hover:bg-blue-600/15 hover:border-blue-400/30 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-blue-400 mb-0.5 uppercase tracking-wider">Management</p>
                <p className="text-xs font-black text-white group-hover:text-blue-300 transition-colors duration-300">
                  {currentStock.management_score !== null ? currentStock.management_score : '—'}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-purple-600/10 p-2 rounded-lg border border-purple-400/20 hover:bg-purple-600/15 hover:border-purple-400/30 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-purple-400 mb-0.5 uppercase tracking-wider">Sticker</p>
                <p className="text-xs font-black text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                  {formatCurrency(currentStock.buy_price * 2).replace('$', '')}
                </p>
              </div>
              
              <div className="backdrop-blur-md bg-blue-600/10 p-2 rounded-lg border border-blue-400/20 hover:bg-blue-600/15 hover:border-blue-400/30 transition-all duration-300 group">
                <p className="text-[8px] font-bold text-blue-400 mb-0.5 uppercase tracking-wider">Current</p>
                <p className="text-xs font-black text-white group-hover:text-blue-300 transition-colors duration-300">
                  {currentStock.current_ratio || '—'}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-blue-400/20">
              <div className="flex items-center gap-2">
                <span className="backdrop-blur-md bg-blue-500/20 border border-blue-400/30 text-blue-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide">
                  {currentStock.source}
                </span>
                <span className="text-[9px] text-blue-400 font-medium">
                  {(currentStock.date || currentStock.created_at) ? 
                    new Date(currentStock.date || currentStock.created_at).toLocaleDateString('en-US') : 
                    'No date'
                  }
                </span>
              </div>
              
              <button
                onClick={() => router.push(`/dashboard/highlighted/${currentStock.id}`)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white px-4 py-1.5 rounded-lg font-bold text-[9px] uppercase tracking-wide transition-all duration-300 shadow-lg shadow-blue-500/25 hover:scale-105 hover:shadow-blue-400/30"
              >
                Analyze
              </button>
            </div>
          </div>
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="backdrop-blur-2xl bg-blue-900/10 border border-blue-400/20 rounded-2xl shadow-2xl p-3 mb-4">
          <div className="text-center text-blue-300 text-xs">
            <span className="font-semibold">Keyboard Shortcuts:</span> ← → Navigate stocks | ↑ ↓ Change dates
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wide transition-all duration-300",
              currentIndex === 0
                ? "backdrop-blur-md bg-blue-900/20 text-blue-600 cursor-not-allowed border border-blue-400/20"
                : "backdrop-blur-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-white shadow-lg hover:shadow-blue-500/20 border border-blue-400/30 hover:scale-105 hover:border-blue-400/50"
            )}
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            Prev
          </button>
          
          <div className="backdrop-blur-md bg-gradient-to-r from-blue-500/25 to-indigo-500/25 border border-blue-400/30 px-3 py-1.5 rounded-lg">
            <span className="text-[9px] font-black text-blue-300 uppercase tracking-wider">
              {currentIndex + 1} / {stocks.length}
            </span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === stocks.length - 1}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-[9px] uppercase tracking-wide transition-all duration-300",
              currentIndex === stocks.length - 1
                ? "backdrop-blur-md bg-blue-900/20 text-blue-600 cursor-not-allowed border border-blue-400/20"
                : "backdrop-blur-md bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-white shadow-lg hover:shadow-blue-500/20 border border-blue-400/30 hover:scale-105 hover:border-blue-400/50"
            )}
          >
            Next
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
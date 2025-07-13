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
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-2xl w-48"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-12 bg-gray-200 rounded-2xl w-32"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <h2 className="font-bold mb-2">Error Loading Stocks</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-black text-white rounded-2xl hover:bg-gray-800"
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
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Stock Update</h2>
        <div className="flex items-center gap-3">
          <button onClick={goToPreviousDay} className="p-2 hover:bg-gray-100 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="min-w-[160px]">
            <DatePickerInput selectedDate={selectedDate} onChange={handleDateChange} placeholder="Select date..." />
          </div>
          <button onClick={goToNextDay} className="p-2 hover:bg-gray-100 rounded-xl">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button onClick={goToToday} className="px-3 py-2 bg-black text-white rounded-xl text-sm hover:bg-gray-800">
            Today
          </button>
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-sm ${
              autoRefresh 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
        </div>
      </div>
      
      {stocks.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <span>{stocks.length} stocks</span>
            <span>Best: +{stocks[0]?.pe || 0}%</span>
          </div>
          <span>Viewing {currentIndex + 1} of {stocks.length}</span>
        </div>
      )}
    </div>
  );

  if (stocks.length === 0) {
    return (
      <div className="space-y-6">
        {dateSelector}
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
          <h3 className="font-semibold mb-2">No Stocks Found</h3>
          <p className="text-gray-600 mb-4">No stocks available for selected date</p>
          <div className="flex justify-center gap-3">
            <button onClick={goToPreviousDay} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl">
              Yesterday
            </button>
            <button onClick={goToToday} className="px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800">
              Today
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get current stock
  const currentStock = stocks[currentIndex];

  return (
    <div className="space-y-6">
      {dateSelector}
      
      {/* Stock Overview List */}
      {stocks.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-32 overflow-y-auto">
            {stocks.map((stock, index) => (
              <button
                key={stock.id}
                onClick={() => setCurrentIndex(index)}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  index === currentIndex
                    ? 'bg-black text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div className="truncate">{stock.ticker}</div>
                <div className="text-xs opacity-70">+{stock.pe}%</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Stock Card */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Screenshot */}
        {currentStock.screenshot && (
          <div className="relative h-[400px] md:h-[550px] lg:h-[700px] bg-gray-50 border-b border-gray-100">
            <Image 
              src={currentStock.screenshot} 
              alt={`${currentStock.ticker} chart`}
              fill
              className="object-contain"
              priority
            />
            <div className="absolute top-4 left-4 bg-black text-white rounded-xl px-3 py-1.5">
              <span className="text-xs font-medium">Live Chart</span>
            </div>
          </div>
        )}
        
        {/* Card Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">{currentStock.ticker}</h1>
              <p className="text-gray-600">{currentStock.guru}</p>
            </div>
            <div className="text-right">
              <div className="bg-black text-white font-bold rounded-xl px-4 py-2">
                +{currentStock.pe}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Upside</p>
            </div>
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Sentiment</p>
              <p className="text-lg font-bold">{currentStock.sentiment_score}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Signal</p>
              <p className="text-lg font-bold">{currentStock.signal_score}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Rule1</p>
              <p className="text-lg font-bold">{currentStock.rule1_score !== null ? currentStock.rule1_score : '—'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Moat</p>
              <p className="text-lg font-bold">{currentStock.moat_score !== null ? currentStock.moat_score : '—'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Buy Price</p>
              <p className="text-lg font-bold">{formatCurrency(currentStock.buy_price).replace('$', '')}</p>
            </div>
          </div>
          
          {/* Financial Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Management</p>
              <p className="font-bold">{currentStock.management_score !== null ? currentStock.management_score : '—'}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Sticker</p>
              <p className="font-bold">{formatCurrency(currentStock.buy_price * 2).replace('$', '')}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Current</p>
              <p className="font-bold">{currentStock.current_ratio || '—'}</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="bg-gray-100 px-3 py-1 rounded-xl text-sm font-medium">
                {currentStock.source}
              </span>
              <span className="text-sm text-gray-600">
                {(currentStock.date || currentStock.created_at) ? 
                  new Date(currentStock.date || currentStock.created_at).toLocaleDateString('en-US') : 
                  'No date'
                }
              </span>
            </div>
            
            <button
              onClick={() => router.push(`/dashboard/highlighted/${currentStock.id}`)}
              className="bg-black text-white px-4 py-2 rounded-xl font-medium hover:bg-gray-800"
            >
              Analyze
            </button>
          </div>
        </div>
      </div>
      
      {/* Keyboard Shortcuts Help */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4">
        <div className="text-center text-sm text-gray-600">
          <span className="font-medium">Keyboard Shortcuts:</span> ← → Navigate stocks | ↑ ↓ Change dates
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-center items-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
            currentIndex === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          )}
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Previous
        </button>
        
        <div className="bg-gray-100 px-4 py-2 rounded-xl">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {stocks.length}
          </span>
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentIndex === stocks.length - 1}
          className={clsx(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium",
            currentIndex === stocks.length - 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-800"
          )}
        >
          Next
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
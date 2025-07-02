'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stocksapidashboard.duckdns.org/api';

export default function StockUpdateList({ currentPage }: { currentPage: number }) {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        
        // Fetch highlighted stocks
        const response = await fetch(`${API_URL}/stocks/highlighted`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Get current date for filtering
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Filter stocks by current date
        const todayStocks = data.filter((stock: Stock) => {
          const stockDate = stock.date ? new Date(stock.date) : new Date(stock.created_at);
          const stockDateStr = stockDate.toISOString().split('T')[0];
          return stockDateStr === todayStr;
        });
        
        // Sort by Percentage Upside (pe field) in descending order
        const sortedStocks = [...todayStocks].sort((a, b) => {
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
  }, []);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < stocks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

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

  if (stocks.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="max-w-md w-full mx-auto">
          <div className="rounded-2xl bg-gray-50 p-8 text-center shadow-xl border border-gray-100">
            <div className="inline-flex items-center justify-center h-20 w-20 bg-gray-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Stocks Found</h3>
            <p className="text-gray-500">No stocks are available for today&apos;s date. Please check back later.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get current stock
  const currentStock = stocks[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black px-4 py-8">
      <div className="max-w-7xl w-full mx-auto">
        {/* Stock Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden hover:bg-white/10 transition-all duration-500">
          {/* Screenshot */}
          {currentStock.screenshot && (
            <div className="relative h-96 md:h-[500px] lg:h-[600px] bg-black/20 border-b border-white/10">
              <Image 
                src={currentStock.screenshot} 
                alt={`${currentStock.ticker} chart`}
                fill
                className="object-contain"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          )}
          
          {/* Card Content */}
          <div className="p-8 lg:p-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-3 tracking-tight">{currentStock.ticker}</h1>
                <p className="text-gray-300 text-lg font-medium">{currentStock.guru}</p>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-black text-2xl lg:text-3xl font-black rounded-2xl px-6 py-4 shadow-2xl">
                  +{currentStock.pe}%
                </div>
                <p className="text-sm text-gray-400 mt-2 font-semibold tracking-wide uppercase">Upside Potential</p>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="backdrop-blur-sm bg-gradient-to-br from-blue-500/20 to-indigo-600/20 p-6 rounded-2xl border border-blue-400/30 hover:border-blue-400/50 transition-all duration-300">
                <p className="text-xs font-bold text-blue-300 mb-2 uppercase tracking-wider">Sentiment</p>
                <p className={clsx(
                  "text-3xl font-black",
                  getSentimentColor(currentStock.sentiment_score).includes('green') ? 'text-emerald-400' :
                  getSentimentColor(currentStock.sentiment_score).includes('red') ? 'text-red-400' : 'text-yellow-400'
                )}>
                  {currentStock.sentiment_score}
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-pink-600/20 p-6 rounded-2xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300">
                <p className="text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">Signal</p>
                <p className={clsx(
                  "text-3xl font-black",
                  getSentimentColor(currentStock.signal_score).includes('green') ? 'text-emerald-400' :
                  getSentimentColor(currentStock.signal_score).includes('red') ? 'text-red-400' : 'text-yellow-400'
                )}>
                  {currentStock.signal_score}
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-gradient-to-br from-orange-500/20 to-red-600/20 p-6 rounded-2xl border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300">
                <p className="text-xs font-bold text-orange-300 mb-2 uppercase tracking-wider">Rule1</p>
                <p className="text-3xl font-black text-orange-400">
                  {currentStock.rule1_score !== null ? currentStock.rule1_score : '—'}
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-gradient-to-br from-teal-500/20 to-cyan-600/20 p-6 rounded-2xl border border-teal-400/30 hover:border-teal-400/50 transition-all duration-300">
                <p className="text-xs font-bold text-teal-300 mb-2 uppercase tracking-wider">Moat</p>
                <p className="text-3xl font-black text-teal-400">
                  {currentStock.moat_score !== null ? currentStock.moat_score : '—'}
                </p>
              </div>
            </div>
            
            {/* Financial Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Management</p>
                <p className="text-2xl font-black text-white">
                  {currentStock.management_score !== null ? currentStock.management_score : '—'}
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Sticker Price</p>
                <p className="text-2xl font-black text-emerald-400">
                  {formatCurrency(currentStock.buy_price)}
                </p>
              </div>
              
              <div className="backdrop-blur-sm bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Current Price</p>
                <p className="text-2xl font-black text-white">
                  {currentStock.current_ratio || '—'}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <span className="backdrop-blur-sm bg-gradient-to-r from-indigo-500/30 to-purple-600/30 border border-indigo-400/30 text-indigo-300 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide">
                  {currentStock.source}
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  {(currentStock.date || currentStock.created_at) ? 
                    new Date(currentStock.date || currentStock.created_at).toLocaleDateString('en-US') : 
                    'No date'
                  }
                </span>
              </div>
              
              <button
                onClick={() => router.push(`/dashboard/highlighted/${currentStock.id}`)}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wide transition-all duration-300 shadow-2xl hover:shadow-emerald-500/25 hover:scale-105"
              >
                Analyze
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center items-center gap-8 mt-12">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={clsx(
              "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300",
              currentIndex === 0
                ? "backdrop-blur-sm bg-white/5 text-gray-600 cursor-not-allowed border border-white/10"
                : "backdrop-blur-sm bg-white/10 text-white hover:bg-white/20 shadow-2xl hover:shadow-white/10 border border-white/20 hover:scale-105"
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <div className="backdrop-blur-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 px-6 py-3 rounded-2xl">
            <span className="text-sm font-black text-emerald-300 uppercase tracking-wider">
              {currentIndex + 1} / {stocks.length}
            </span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === stocks.length - 1}
            className={clsx(
              "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300",
              currentIndex === stocks.length - 1
                ? "backdrop-blur-sm bg-white/5 text-gray-600 cursor-not-allowed border border-white/10"
                : "backdrop-blur-sm bg-white/10 text-white hover:bg-white/20 shadow-2xl hover:shadow-white/10 border border-white/20 hover:scale-105"
            )}
          >
            Next
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
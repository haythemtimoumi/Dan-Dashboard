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
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl w-full mx-auto">
        {/* Stock Card */}
        <div className="rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden hover:shadow-3xl transition-all duration-300">
          {/* Screenshot */}
          {currentStock.screenshot && (
            <div className="relative h-96 md:h-[500px] lg:h-[600px] bg-gray-100">
              <Image 
                src={currentStock.screenshot} 
                alt={`${currentStock.ticker} chart`}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          
          {/* Card Content */}
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentStock.ticker}</h1>
                <p className="text-gray-600">{currentStock.guru}</p>
              </div>
              <div className="text-right">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-xl px-4 py-2 shadow-lg">
                  {currentStock.pe}%
                </div>
                <p className="text-sm text-gray-500 mt-1">Percentage Upside</p>
              </div>
            </div>
            
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <p className="text-sm font-medium text-blue-700 mb-1">Sentiment Score</p>
                <p className={clsx(
                  "text-2xl font-bold",
                  getSentimentColor(currentStock.sentiment_score).includes('green') ? 'text-green-600' :
                  getSentimentColor(currentStock.sentiment_score).includes('red') ? 'text-red-600' : 'text-yellow-600'
                )}>
                  {currentStock.sentiment_score}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <p className="text-sm font-medium text-purple-700 mb-1">Signal Score</p>
                <p className={clsx(
                  "text-2xl font-bold",
                  getSentimentColor(currentStock.signal_score).includes('green') ? 'text-green-600' :
                  getSentimentColor(currentStock.signal_score).includes('red') ? 'text-red-600' : 'text-yellow-600'
                )}>
                  {currentStock.signal_score}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <p className="text-sm font-medium text-orange-700 mb-1">Rule1 Score</p>
                <p className="text-2xl font-bold text-orange-600">
                  {currentStock.rule1_score !== null ? currentStock.rule1_score : '-'}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200">
                <p className="text-sm font-medium text-teal-700 mb-1">Moat Score</p>
                <p className="text-2xl font-bold text-teal-600">
                  {currentStock.moat_score !== null ? currentStock.moat_score : '-'}
                </p>
              </div>
            </div>
            
            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-1">Management Score</p>
                <p className="text-xl font-bold text-gray-800">
                  {currentStock.management_score !== null ? currentStock.management_score : '-'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-1">Sticker Price</p>
                <p className="text-xl font-bold text-gray-800">
                  {formatCurrency(currentStock.buy_price)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm font-medium text-gray-600 mb-1">Last Price</p>
                <p className="text-xl font-bold text-gray-800">
                  {currentStock.current_ratio || '-'}
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", 
                  getSourceBadgeColor(currentStock.source)
                )}>
                  {currentStock.source}
                </span>
                <span className="text-sm text-gray-500">
                  {(currentStock.date || currentStock.created_at) ? 
                    new Date(currentStock.date || currentStock.created_at).toLocaleDateString('en-US') : 
                    'No date'
                  }
                </span>
              </div>
              
              <button
                onClick={() => router.push(`/dashboard/highlighted/${currentStock.id}`)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center items-center gap-6 mt-12">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
              currentIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl border border-gray-200"
            )}
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <div className="bg-white px-4 py-2 rounded-lg shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-600">
              {currentIndex + 1} of {stocks.length}
            </span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === stocks.length - 1}
            className={clsx(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200",
              currentIndex === stocks.length - 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50 shadow-lg hover:shadow-xl border border-gray-200"
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
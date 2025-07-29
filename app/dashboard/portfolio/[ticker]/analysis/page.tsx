'use client';

import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { formatCurrency, formatDate, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import StockHistoryChart from '@/app/ui/dashboard/stock-history-chart';
import { Stock } from '@/app/lib/definitions';

export default function PortfolioAnalysisDetailPage({ params }: { params: { ticker: string } }) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchStock = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stocks/grouped');
        
        if (!response.ok) {
          throw new Error('Failed to fetch stocks');
        }
        
        const allStocks = await response.json();
        const foundStock = allStocks.find((s: Stock) => s.ticker === params.ticker);
        
        if (!foundStock) {
          setError(`Stock ${params.ticker} not found`);
        } else {
          setStock(foundStock);
        }
      } catch (err) {
        console.error('Error fetching stock:', err);
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStock();
  }, [params.ticker]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[600px]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-2xl w-48"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }
  
  if (error || !stock) {
    return (
      <div className="mt-6 rounded-xl bg-amber-50 p-8 text-center shadow-lg border border-amber-100">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-amber-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-amber-800 mb-2">Stock Not Found</h2>
        <p className="text-amber-700 max-w-md mx-auto">The stock {params.ticker} could not be found in the portfolio.</p>
        <div className="mt-6">
          <Link
            href="/dashboard/portfolio"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }
    
  return (
    <main>
        <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-xl shadow-xl p-6 text-white mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/20">
                  {stock.ticker.substring(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className={`${lusitana.className} text-2xl lg:text-3xl font-bold`}>
                      {stock.ticker}
                    </h1>
                    <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", 
                      getSourceBadgeColor(stock.source)
                    )}>
                      {stock.source.charAt(0).toUpperCase() + stock.source.slice(1)}
                    </span>
                  </div>
                  <div className="text-blue-100/90 text-sm">
                    <span className="font-medium">{stock.full_name || stock.guru}</span> • {formatDate(stock.created_at)}
                  </div>
                </div>
              </div>
              
              <Link
                href={`/dashboard/portfolio/${params.ticker}`}
                className="flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-md px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-all duration-200 border border-white/20"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </Link>
            </div>
            
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg px-4 py-3 border border-white/20">
              <div className="flex justify-between items-center text-center divide-x divide-white/20">
                <div className="flex-1">
                  <div className="text-xs text-blue-100/70 mb-1">Sentiment</div>
                  <div className="text-lg font-bold">{stock.sentiment_score}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-blue-100/70 mb-1">Signal</div>
                  <div className="text-lg font-bold">{stock.signal_score}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-blue-100/70 mb-1">Buy Price</div>
                  <div className="text-lg font-bold">{formatCurrency(stock.buy_price)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-blue-100/70 mb-1">Upside</div>
                  <div className="text-lg font-bold">{stock.per_upside}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Large Screenshot Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200 overflow-hidden">
              {stock.screenshot ? (
                <Image 
                  src={stock.screenshot} 
                  alt={`${stock.ticker} technical analysis chart`} 
                  width={1200} 
                  height={600} 
                  className="w-full h-auto hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl">
                  <div className="bg-white rounded-full p-6 shadow-lg mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-semibold text-gray-700 mb-3">Chart Not Available</h4>
                  <p className="text-gray-500 text-lg text-center max-w-md mb-6">Technical analysis chart is currently unavailable for this stock</p>
                  <button className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Chart
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Interactive Price History - Full Width */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Interactive Price History
            </h3>
          </div>
          <StockHistoryChart stockId={stock.id} />
        </div>
      </main>
    );
}
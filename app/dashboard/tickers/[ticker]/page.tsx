'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';

const DAN_API_URL = 'https://www.mytickerlist.com/api';

interface StockAnalysis {
  id: number;
  ticker: string;
  guru?: string;
  date?: string;
  source?: string;
  pe?: number;
  dividend?: string;
  cash_per_share?: string;
  current_ratio?: number;
  signal_score?: number;
  sentiment_score?: number;
  screenshot?: string;
  rule1_score?: number;
  moat_score?: number;
  management_score?: number;
  buy_price?: string;
  full_name?: string;
  last_price?: string;
  last_action?: string;
  per_portfolio?: string;
  long_gr?: string;
  last_gr?: string;
  per_upside?: string;
  pbt?: string;
  created_at?: string;
  highlight?: boolean;
}

export default function TickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language } = useSettings();
  const ticker = params.ticker as string;
  
  const [stockData, setStockData] = useState<StockAnalysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedGuru, setSelectedGuru] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<string>('desc');


  useEffect(() => {
    const fetchTickerData = async () => {
      if (!ticker) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${DAN_API_URL}/stocks/ticker/${ticker.toUpperCase()}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch ticker data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setStockData(data);
        
        if (data.length > 0) {
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error('Error fetching ticker data:', err);
        setError('Failed to load ticker data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTickerData();
  }, [ticker]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const filteredData = selectedGuru 
    ? stockData.filter(stock => stock.guru === selectedGuru)
    : stockData;

  const sortedData = [...filteredData].sort((a, b) => {
    let valueA = a[sortBy as keyof StockAnalysis];
    let valueB = b[sortBy as keyof StockAnalysis];
    
    const isAEmpty = valueA === null || valueA === undefined || valueA === '';
    const isBEmpty = valueB === null || valueB === undefined || valueB === '';
    
    if (isAEmpty && isBEmpty) return 0;
    if (isAEmpty) return 1;
    if (isBEmpty) return -1;
    
    if (typeof valueA === 'string' && !isNaN(Number(valueA))) {
      valueA = Number(valueA);
    }
    if (typeof valueB === 'string' && !isNaN(Number(valueB))) {
      valueB = Number(valueB);
    }
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    }
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }
    
    const strA = String(valueA);
    const strB = String(valueB);
    return sortOrder === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });

  const uniqueGurus = Array.from(new Set(stockData.map(stock => stock.guru).filter(Boolean)));

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
          <h2 className="font-bold mb-2 text-gray-900 dark:text-white">Error Loading Ticker Data</h2>
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

  if (stockData.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">No Data Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No analysis data found for ticker {ticker.toUpperCase()}
          </p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentStock = sortedData[currentIndex];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{ticker.toUpperCase()}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {stockData.length} {language === 'fr' ? 'analyses trouvées' : 'analyses found'}
              </p>
            </div>
          </div>
          
          {/* Guru Filter */}
          <div className="flex items-center gap-4">
            <select
              value={selectedGuru}
              onChange={(e) => setSelectedGuru(e.target.value)}
              className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{language === 'fr' ? 'Tous les gurus' : 'All Gurus'}</option>
              {uniqueGurus.map((guru) => (
                <option key={guru} value={guru}>{guru}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
            {currentStock?.screenshot ? (
              <div className="relative h-[400px] md:h-[500px] lg:h-[600px] bg-gray-50 dark:bg-gray-700">
                <Image 
                  src={currentStock.screenshot} 
                  alt={`${ticker} chart`}
                  fill
                  className="object-contain"
                  priority
                />
                <div className="absolute top-2 left-2 bg-black text-white rounded-lg px-2 py-1">
                  <span className="text-xs font-medium">
                    {currentStock.date ? new Date(currentStock.date).toLocaleDateString() : 'Latest'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-[400px] md:h-[500px] lg:h-[600px] bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No chart available</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Stats Column */}
        <div className="space-y-4">
          {/* Current Analysis Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Current Analysis</h3>
              <span className="text-xs text-gray-500">
                {currentIndex + 1} / {sortedData.length}
              </span>
            </div>
            
            {currentStock && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Sentiment</p>
                    <p className={clsx("font-bold", getSentimentColor(currentStock.sentiment_score || 0))}>
                      {currentStock.sentiment_score || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Signal</p>
                    <p className={clsx("font-bold", getSentimentColor(currentStock.signal_score || 0))}>
                      {currentStock.signal_score || '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Upside</p>
                    <p className="font-bold text-green-600">
                      {currentStock.pe ? `+${currentStock.pe}%` : '—'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Rule1</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {currentStock.rule1_score || '—'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Guru:</span>
                    <span className="font-medium">{currentStock.guru || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-medium">
                      {currentStock.date ? new Date(currentStock.date).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Buy Price:</span>
                    <span className="font-medium">{currentStock.buy_price || '—'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Navigation */}
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  currentIndex === 0
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                )}
              >
                Previous
              </button>
              
              <button
                onClick={() => setCurrentIndex(Math.min(sortedData.length - 1, currentIndex + 1))}
                disabled={currentIndex === sortedData.length - 1}
                className={clsx(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  currentIndex === sortedData.length - 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                )}
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">All Analysis Data</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {sortBy === 'date' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Guru</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('sentiment_score')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Sentiment</span>
                    {sortBy === 'sentiment_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('signal_score')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Signal</span>
                    {sortBy === 'signal_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('pe')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Upside %</span>
                    {sortBy === 'pe' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleSort('rule1_score')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Rule1</span>
                    {sortBy === 'rule1_score' && <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center">Moat</th>
                <th className="px-4 py-3 text-center">Mgmt</th>
                <th className="px-4 py-3 text-right">Buy Price</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedData.map((stock, index) => (
                <tr 
                  key={stock.id}
                  className={clsx(
                    "hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                    index === currentIndex && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => setCurrentIndex(index)}
                >
                  <td className="px-4 py-3">
                    {stock.date ? new Date(stock.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx("px-2 py-1 rounded text-xs font-medium", getSourceBadgeColor(stock.guru || ''))}>
                      {stock.guru || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx("font-bold", getSentimentColor(stock.sentiment_score || 0))}>
                      {stock.sentiment_score || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={clsx("font-bold", getSentimentColor(stock.signal_score || 0))}>
                      {stock.signal_score || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-green-600">
                      {stock.pe ? `+${stock.pe}%` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {stock.rule1_score || '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {stock.moat_score || '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-medium">
                    {stock.management_score || '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {stock.buy_price || '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
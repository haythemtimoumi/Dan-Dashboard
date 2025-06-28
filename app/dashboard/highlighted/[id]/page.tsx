import { fetchStockById, fetchStockHistory } from '@/app/lib/data';
import { redirect } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { formatCurrency, formatDate, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import StockHistoryChart from '@/app/ui/dashboard/stock-history-chart';

export default async function HighlightedStockDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  
  try {
    const stock = await fetchStockById(id);
    
    if (!stock) {
      console.log(`Highlighted stock with ID ${id} not found, showing user-friendly message`);
      
      return (
        <div className="mt-6 rounded-xl bg-amber-50 p-8 text-center shadow-lg border border-amber-100">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-amber-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-amber-800 mb-2">Highlighted Stock Not Found</h2>
          <p className="text-amber-700 max-w-md mx-auto">The highlighted stock with ID {id} could not be found. It may have been removed or the ID is incorrect.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/highlighted"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to All Highlighted Stocks
            </Link>
          </div>
        </div>
      );
    }
    
    // Fetch the latest history record to display additional information
    let latestHistory = null;
    try {
      const history = await fetchStockHistory(id);
      if (history && history.length > 0) {
        // Get the most recent history record
        latestHistory = history[history.length - 1];
      }
    } catch (historyError) {
      console.error('Error loading stock history:', historyError);
      // Continue without history data
    }
    
    return (
      <main>
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl">
                  {stock.ticker.substring(0, 2)}
                </div>
                <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold`}>
                  {stock.ticker}
                </h1>
                {stock.highlight && (
                  <span className="bg-yellow-400 text-yellow-900 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Featured
                  </span>
                )}
              </div>
              <p className="text-blue-100 max-w-2xl">
                {stock.guru} • {stock.source.charAt(0).toUpperCase() + stock.source.slice(1)} • Updated {formatDate(stock.created_at)}
              </p>
            </div>
            <Link
              href="/dashboard/highlighted"
              className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to List
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Sentiment: {stock.sentiment_score}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Price: {formatCurrency(stock.buy_price)}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h2>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                          Ticker
                        </p>
                        <p className="text-lg font-bold text-gray-800">{stock.ticker}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Guru
                        </p>
                        <p className="text-lg text-gray-800">{stock.guru}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          Source
                        </p>
                        <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", 
                          getSourceBadgeColor(stock.source)
                        )}>
                          {stock.source.charAt(0).toUpperCase() + stock.source.slice(1)}
                        </span>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Featured
                        </p>
                        <p className="text-lg text-gray-800">
                          {stock.highlight ? (
                            <span className="inline-flex items-center text-yellow-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Yes
                            </span>
                          ) : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Financial Data
                  </h2>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          Percentage Upside
                        </p>
                        <p className="text-lg font-medium text-gray-800">{stock.pe}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Sticker Price
                        </p>
                        <p className="text-lg font-medium text-green-700">{formatCurrency(stock.buy_price)}</p>
                      </div>
                      
                      {/* Additional financial data from history if available */}
                      {latestHistory && (
                        <>
                          {latestHistory.dividend && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Dividend</p>
                              <p className="text-lg">{latestHistory.dividend}</p>
                            </div>
                          )}
                          {latestHistory.cash_per_share && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Cash Per Share</p>
                              <p className="text-lg">${latestHistory.cash_per_share}</p>
                            </div>
                          )}
                          {latestHistory.current_ratio && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Last Price</p>
                              <p className="text-lg">{latestHistory.current_ratio}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Performance Scores
                  </h2>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Sentiment Score
                        </p>
                        <div className="mt-1">
                          <span className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "text-lg font-bold rounded-full px-3 py-1 inline-flex items-center gap-1"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            {stock.sentiment_score}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          </svg>
                          Signal Score
                        </p>
                        <div className="mt-1">
                          <span className={clsx(
                            getSentimentColor(stock.signal_score),
                            "text-lg font-bold rounded-full px-3 py-1 inline-flex items-center gap-1"
                          )}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            {stock.signal_score}
                          </span>
                        </div>
                      </div>
                      
                      {/* Additional scores from history if available */}
                      {latestHistory && (
                        <>
                          {latestHistory?.rule1_score !== null && latestHistory?.rule1_score !== undefined && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Rule 1 Score</p>
                              <div className="mt-1">
                                <span className={clsx(
                                  getSentimentColor(latestHistory.rule1_score / 100),
                                  "text-lg font-bold rounded-full px-3 py-1"
                                )}>
                                  {latestHistory.rule1_score}
                                </span>
                              </div>
                            </div>
                          )}
                          {latestHistory?.moat_score !== null && latestHistory?.moat_score !== undefined && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Moat Score</p>
                              <div className="mt-1">
                                <span className={clsx(
                                  getSentimentColor(latestHistory.moat_score / 100),
                                  "text-lg font-bold rounded-full px-3 py-1"
                                )}>
                                  {latestHistory.moat_score}
                                </span>
                              </div>
                            </div>
                          )}
                          {latestHistory?.management_score !== null && latestHistory?.management_score !== undefined && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Management Score</p>
                              <div className="mt-1">
                                <span className={clsx(
                                  getSentimentColor(latestHistory.management_score / 100),
                                  "text-lg font-bold rounded-full px-3 py-1"
                                )}>
                                  {latestHistory.management_score}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Timeline
                  </h2>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-100 shadow-sm">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <p className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Last Updated
                        </p>
                        <p className="text-lg font-medium text-gray-800">{formatDate(stock.created_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dynamic Stock History Chart */}
          <StockHistoryChart stockId={id} />
          
          {/* Static Chart Image Section (if available) */}
          <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Stock Chart Visualization
              </h2>
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-center">
                  {/* Only render Image if screenshot is available */}
                  {(stock.screenshot || latestHistory?.screenshot) ? (
                    <Image 
                      src={stock.screenshot || latestHistory?.screenshot || ''} 
                      alt={`${stock.ticker} chart`} 
                      width={800} 
                      height={400} 
                      className="rounded-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] w-full bg-gray-100 rounded-lg border border-dashed border-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 text-lg font-medium">No chart image available</p>
                      <p className="text-gray-500 text-sm mt-2">Chart visualization data is not available for this stock</p>
                      <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading highlighted stock:', error);
    return (
      <div className="mt-6 rounded-xl bg-red-50 p-8 text-center shadow-lg border border-red-100">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Stock Details</h2>
        <p className="text-red-700 max-w-md mx-auto">Failed to load highlighted stock details. Please try again later.</p>
        <div className="mt-6">
          <Link
            href="/dashboard/highlighted"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Highlighted Stocks
          </Link>
        </div>
      </div>
    );
  }
}
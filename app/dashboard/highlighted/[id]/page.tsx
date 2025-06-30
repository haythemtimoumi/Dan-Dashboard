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
                    {stock.highlight && (
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Featured
                      </span>
                    )}
                    <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", 
                      getSourceBadgeColor(stock.source)
                    )}>
                      {stock.source.charAt(0).toUpperCase() + stock.source.slice(1)}
                    </span>
                  </div>
                  <div className="text-blue-100/90 text-sm">
                    <span className="font-medium">{stock.guru}</span> • {formatDate(stock.created_at)}
                  </div>
                </div>
              </div>
              
              <Link
                href="/dashboard/highlighted"
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
                  <div className="text-xs text-blue-100/70 mb-1">Target</div>
                  <div className="text-lg font-bold">{formatCurrency(stock.buy_price)}</div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-blue-100/70 mb-1">Upside</div>
                  <div className="text-lg font-bold">{stock.pe}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        

          
        {/* Large Screenshot Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-6">
          <div className="p-6">
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl border border-gray-200 overflow-hidden">
              {(stock.screenshot || latestHistory?.screenshot) ? (
                <Image 
                  src={stock.screenshot || latestHistory?.screenshot || ''} 
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
          <StockHistoryChart stockId={id} />
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
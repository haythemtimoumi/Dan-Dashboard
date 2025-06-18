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
        <div className="mt-6 rounded-lg bg-amber-50 p-6 text-center shadow-md">
          <h2 className="text-lg font-semibold text-amber-800">Highlighted Stock Not Found</h2>
          <p className="mt-2 text-amber-700">The highlighted stock with ID {id} could not be found.</p>
          <div className="mt-4">
            <Link
              href="/dashboard/highlighted"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
            >
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
        <div className="flex items-center justify-between mb-8">
          <h1 className={`${lusitana.className} text-2xl md:text-3xl font-bold text-blue-900`}>
            Highlighted Stock Details: {stock.ticker}
          </h1>
          <Link
            href="/dashboard/highlighted"
            className="flex items-center gap-1 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to List
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className={clsx(
            "p-6 border-l-4",
            stock.highlight ? "border-yellow-500 bg-yellow-50" : "border-blue-500"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column */}
              <div>
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Basic Information</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ticker</p>
                        <p className="text-lg font-bold">{stock.ticker}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Guru</p>
                        <p className="text-lg">{stock.guru}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Source</p>
                        <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-sm", 
                          getSourceBadgeColor(stock.source)
                        )}>
                          {stock.source}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Highlight</p>
                        <p className="text-lg">{stock.highlight ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Financial Data</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">PE Ratio</p>
                        <p className="text-lg">{stock.pe}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Buy Price</p>
                        <p className="text-lg font-medium">{formatCurrency(stock.buy_price)}</p>
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
                              <p className="text-sm font-medium text-gray-500">Current Ratio</p>
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Scores</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Sentiment Score</p>
                        <div className="mt-1">
                          <span className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "text-lg font-bold rounded-full px-3 py-1"
                          )}>
                            {stock.sentiment_score}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Signal Score</p>
                        <div className="mt-1">
                          <span className={clsx(
                            getSentimentColor(stock.signal_score),
                            "text-lg font-bold rounded-full px-3 py-1"
                          )}>
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
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Dates</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Stock Date</p>
                        <p className="text-lg">{formatDate(stock.created_at)}</p>
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
          <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Static Stock Chart</h2>
              <div className="bg-gray-50 p-4 rounded-md">
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
                    <div className="flex flex-col items-center justify-center h-[400px] w-[800px] bg-gray-100 rounded-md">
                      <p className="text-gray-500 text-lg">No chart image available</p>
                      <p className="text-gray-400 text-sm mt-2">Screenshot data is missing</p>
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
      <div className="mt-6 rounded-lg bg-red-50 p-6 text-center shadow-md">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-700">Failed to load highlighted stock details. Please try again later.</p>
        <div className="mt-4">
          <Link
            href="/dashboard/highlighted"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Back to Highlighted Stocks
          </Link>
        </div>
      </div>
    );
  }
}
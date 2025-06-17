'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/app/lib/definitions';

// Note: This component uses the highlighted stocks API endpoint
// which returns stocks with sentiment_score > 60 AND signal_score > 80
import { formatCurrency, formatDateToLocal, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import clsx from 'clsx';

// Loading skeleton for the highlighted stocks table
export function HighlightedStocksSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="flex justify-between items-center mb-4 px-4">
            <h2 className="text-xl font-semibold">Highlighted Stocks</h2>
            <div className="h-8 w-24 rounded bg-gray-200"></div>
          </div>
          <div className="md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="h-5 w-16 rounded bg-gray-200"></div>
                    <div className="mt-2 h-4 w-24 rounded bg-gray-200"></div>
                  </div>
                  <div className="h-5 w-12 rounded bg-gray-200"></div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <div className="h-4 w-16 rounded bg-gray-200"></div>
                    <div className="mt-2 h-4 w-24 rounded bg-gray-200"></div>
                    <div className="mt-2 h-6 w-20 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">
                  Ticker
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Sentiment Score
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Signal Score
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  PE
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Guru
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Source
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Buy Price
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="w-full border-b py-3 text-sm last-of-type:border-none">
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-16 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-12 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-12 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-10 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-24 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-24 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-16 rounded bg-gray-200"></div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <div className="h-5 w-20 rounded bg-gray-200"></div>
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

export default function HighlightedStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchHighlightedStocks = async () => {
      try {
        setLoading(true);
        // Use relative URL for API calls to ensure they work in all environments
        // This endpoint returns stocks with sentiment_score > 60 AND signal_score > 80
        const response = await fetch('/api/stocks/highlighted');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch highlighted stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Sort the data by sentiment_score
        const sortedData = [...data].sort((a, b) => {
          return sortDirection === 'desc' 
            ? b.sentiment_score - a.sentiment_score 
            : a.sentiment_score - b.sentiment_score;
        });
        
        setStocks(sortedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching highlighted stocks:', err);
        setError('Failed to load highlighted stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlightedStocks();
    
    // Set up an interval to refresh data every 60 seconds
    const intervalId = setInterval(fetchHighlightedStocks, 60000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (loading) {
    return <HighlightedStocksSkeleton />;
  }

  if (error) {
    return (
      <div className="mt-6 rounded-lg bg-red-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-red-800">Error</h2>
        <p className="mt-2 text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="flex justify-between items-center mb-4 px-4 pt-4">
            <h2 className="text-xl font-semibold">Highlighted Stocks</h2>
            <button
              onClick={toggleSortDirection}
              className="flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Sort by Sentiment {sortDirection === 'desc' ? '↓' : '↑'}
            </button>
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500">No highlighted stocks found</p>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden">
                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="mb-2 w-full rounded-md bg-white p-4"
                  >
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="text-sm font-semibold">{stock.ticker}</p>
                        <p className="text-sm text-gray-500">{stock.guru}</p>
                      </div>
                      <div className={`${getSentimentColor(stock.sentiment_score)} text-sm font-medium`}>
                        {stock.sentiment_score}
                      </div>
                    </div>
                    <div className="flex w-full items-center justify-between pt-4">
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">PE:</span> {stock.pe}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Buy Price:</span> {formatCurrency(stock.buy_price)}
                        </p>
                        <p className="mt-2">
                          <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Date:</span> {formatDateToLocal(stock.updated_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <table className="hidden min-w-full text-gray-900 md:table">
                <thead className="rounded-lg text-left text-sm font-normal">
                  <tr>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Ticker
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-5 font-medium cursor-pointer"
                      onClick={toggleSortDirection}
                    >
                      <div className="flex items-center gap-1">
                        Sentiment Score
                        <span>{sortDirection === 'desc' ? '↓' : '↑'}</span>
                      </div>
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Signal Score
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      PE
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Guru
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Source
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Buy Price
                    </th>
                    <th scope="col" className="px-3 py-5 font-medium">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {stocks.map((stock) => (
                    <tr
                      key={stock.id}
                      className="w-full border-b py-3 text-sm last-of-type:border-none"
                    >
                      <td className="whitespace-nowrap px-3 py-3">
                        {stock.ticker}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={getSentimentColor(stock.sentiment_score)}>
                          {stock.sentiment_score}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={getSentimentColor(stock.signal_score)}>
                          {stock.signal_score}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {stock.pe}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {stock.guru}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <span className={clsx("inline-flex items-center rounded-full px-2 py-1 text-xs", 
                          getSourceBadgeColor(stock.source)
                        )}>
                          {stock.source}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatCurrency(stock.buy_price)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {formatDateToLocal(stock.updated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
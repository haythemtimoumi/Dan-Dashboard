'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import clsx from 'clsx';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stocksapidashboard.duckdns.org/api';
const ITEMS_PER_PAGE = 10;

export default function StockUpdateList({ currentPage }: { currentPage: number }) {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`${API_URL}/stocks/highlighted`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Sort by Percentage Upside (pe field) in descending order
        const sortedStocks = [...data].sort((a, b) => {
          const valueA = a.pe || 0;
          const valueB = b.pe || 0;
          return valueB - valueA; // Descending order
        });
        
        setStocks(sortedStocks);
        setTotalPages(Math.ceil(sortedStocks.length / ITEMS_PER_PAGE));
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

  const handlePageChange = (page: number) => {
    router.push(`/dashboard/stock-update?page=${page}`);
  };

  if (loading) {
    return (
      <div className="mt-6 flow-root">
        <div className="inline-block min-w-full align-middle">
          <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded-lg w-1/3"></div>
              <div className="h-64 bg-gray-100 rounded-xl"></div>
              <div className="flex justify-center gap-2">
                <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
                <div className="h-10 w-20 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl bg-red-50 p-8 text-center shadow-md border border-red-100">
        <div className="inline-flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Error Loading Stocks</h2>
        <p className="text-red-700 max-w-md mx-auto">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedStocks = stocks.slice(startIndex, endIndex);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-xl bg-white p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span>Stock Update</span>
              </h2>
              <p className="text-gray-500 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, stocks.length)} of {stocks.length} stocks
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="text-green-800 font-medium">Page {currentPage} of {totalPages}</span>
            </div>
          </div>
          
          {stocks.length === 0 ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center h-20 w-20 bg-green-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Stocks Found</h3>
              <p className="text-gray-500 max-w-md mx-auto">No stocks are available at the moment. Please check back later.</p>
            </div>
          ) : (
            <>
              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {paginatedStocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="w-full rounded-xl bg-white p-5 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:bg-green-50 border border-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(`/dashboard/highlighted/${stock.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                          {stock.ticker.substring(0, 2)}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-800">{stock.ticker}</p>
                          <p className="text-xs text-gray-500">{stock.guru}</p>
                        </div>
                      </div>
                      <div className="bg-green-100 text-green-800 text-sm font-medium rounded-full px-3 py-1.5 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {stock.pe}%
                      </div>
                    </div>
                    <div className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Sentiment</p>
                          <p className="text-lg font-semibold">{stock.sentiment_score}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Signal</p>
                          <p className="text-lg font-semibold">{stock.signal_score}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Sticker Price</p>
                          <p className="text-lg font-semibold">{formatCurrency(stock.buy_price)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Last Price</p>
                          <p className="text-lg font-semibold">{stock.current_ratio}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                          </span>
                        </div>
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/highlighted/${stock.id}`);
                            }}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop view */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200">
                <table className="min-w-full text-gray-900 border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-green-50 to-emerald-50 text-left text-sm font-medium">
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Ticker</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Percentage Upside</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Sentiment</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Signal</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Rule1 Score</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Sticker Price</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Last Price</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Source</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Date</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Screenshot</th>
                      <th scope="col" className="px-4 py-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStocks.map((stock) => (
                      <tr
                        key={stock.id}
                        className="w-full text-sm hover:bg-green-50 transition-all duration-200 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push(`/dashboard/highlighted/${stock.id}`);
                        }}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium text-xs">
                              {stock.ticker.substring(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{stock.ticker}</p>
                              <p className="text-xs text-gray-500">{stock.guru}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="bg-green-100 text-green-800 font-medium rounded-full px-2.5 py-1 text-xs inline-flex items-center justify-center">
                            {stock.pe}%
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.sentiment_score),
                            "font-medium rounded-full px-2.5 py-1 text-xs inline-flex items-center justify-center w-14"
                          )}>
                            {stock.sentiment_score}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <p className={clsx(
                            getSentimentColor(stock.signal_score),
                            "font-medium rounded-full px-2.5 py-1 text-xs inline-flex items-center justify-center w-14"
                          )}>
                            {stock.signal_score}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.rule1_score !== null ? stock.rule1_score : '-'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {formatCurrency(stock.buy_price)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium">
                          {stock.current_ratio}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", 
                            getSourceBadgeColor(stock.source)
                          )}>
                            {stock.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">
                          {(stock.date || stock.created_at) ? new Date(stock.date || stock.created_at).toISOString().split('T')[0] : 'No date'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {stock.screenshot ? (
                            <Image 
                              src={stock.screenshot} 
                              alt={`${stock.ticker} chart`}
                              width={48}
                              height={32}
                              className="h-8 w-12 object-cover rounded border"
                            />
                          ) : (
                            <span className="text-gray-400 text-xs">No image</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/highlighted/${stock.id}`);
                            }}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200 transition-colors"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className={clsx(
                      "relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
                      currentPage <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    )}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={clsx(
                      "relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium",
                      currentPage >= totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                    )}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, stocks.length)}</span> of{' '}
                      <span className="font-medium">{stocks.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={clsx(
                          "relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
                          currentPage <= 1 ? "cursor-not-allowed" : "hover:text-gray-500"
                        )}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={clsx(
                            "relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
                            page === currentPage
                              ? "z-10 bg-green-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                              : "text-gray-900"
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className={clsx(
                          "relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0",
                          currentPage >= totalPages ? "cursor-not-allowed" : "hover:text-gray-500"
                        )}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
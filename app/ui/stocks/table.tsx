'use client';

import Image from 'next/image';
import { UpdateStock, DeleteStock } from '@/app/ui/stocks/buttons';
import { formatCurrency, getSentimentColor, getSourceBadgeColor } from '@/app/lib/utils';
import { StocksTable } from '@/app/lib/definitions';
import clsx from 'clsx';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

// Helper component for table headers with sorting
function SortableHeader({ 
  label, 
  field, 
  currentSortBy, 
  currentSortOrder 
}: { 
  label: string; 
  field: string; 
  currentSortBy: string; 
  currentSortOrder: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Create URL for sorting by this field
  const createSortURL = () => {
    const params = new URLSearchParams(searchParams);
    
    // If already sorting by this field, toggle order
    if (currentSortBy === field) {
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      params.set('sortOrder', newOrder);
    } else {
      // Default to descending for new sort field
      params.set('sortBy', field);
      params.set('sortOrder', 'desc');
    }
    
    return `${pathname}?${params.toString()}`;
  };
  
  const isCurrentSort = currentSortBy === field;
  
  return (
    <th scope="col" className="px-3 py-5 font-medium">
      <Link 
        href={createSortURL()}
        className="group inline-flex items-center gap-1 hover:text-blue-600"
      >
        {label}
        {isCurrentSort ? (
          currentSortOrder === 'asc' ? (
            <ArrowUpIcon className="h-4 w-4 text-blue-500" />
          ) : (
            <ArrowDownIcon className="h-4 w-4 text-blue-500" />
          )
        ) : (
          <div className="invisible group-hover:visible h-4 w-4 text-gray-400">
            <ArrowDownIcon className="h-4 w-4" />
          </div>
        )}
      </Link>
    </th>
  );
}

export default function StocksTable({
  stocks,
  sortBy = 'sentiment_score',
  sortOrder = 'desc'
}: {
  stocks: StocksTable[];
  sortBy?: string;
  sortOrder?: string;
}) {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0 overflow-hidden shadow-sm">
          <div className="md:hidden">
            {stocks?.length > 0 ? (
              stocks.map((stock) => (
                <div
                  key={stock.id}
                  className={clsx(
                    "mb-2 w-full rounded-md bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-pointer hover:bg-gray-100", 
                    {
                      "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                    }
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = `/dashboard/sources/${stock.id}`;
                  }}
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
                    </div>
                    <div className="flex justify-end gap-2">
                      <UpdateStock id={stock.id} />
                      <DeleteStock id={stock.id} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-gray-500">
                No stocks found matching your criteria
              </div>
            )}
          </div>
          
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <SortableHeader 
                  label="Ticker" 
                  field="ticker" 
                  currentSortBy={sortBy} 
                  currentSortOrder={sortOrder} 
                />
                <SortableHeader 
                  label="Sentiment" 
                  field="sentiment_score" 
                  currentSortBy={sortBy} 
                  currentSortOrder={sortOrder} 
                />
                <SortableHeader 
                  label="Signal" 
                  field="signal_score" 
                  currentSortBy={sortBy} 
                  currentSortOrder={sortOrder} 
                />
                <SortableHeader 
                  label="PE" 
                  field="pe" 
                  currentSortBy={sortBy} 
                  currentSortOrder={sortOrder} 
                />
                <SortableHeader 
                  label="Buy Price" 
                  field="buy_price" 
                  currentSortBy={sortBy} 
                  currentSortOrder={sortOrder} 
                />
                <th scope="col" className="px-3 py-5 font-medium">
                  Guru
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Source
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {stocks?.length > 0 ? (
                stocks.map((stock) => (
                  <tr
                    key={stock.id}
                    className={clsx(
                      "w-full border-b py-3 text-sm last-of-type:border-none transition-colors hover:bg-gray-100 cursor-pointer", 
                      {
                        "bg-yellow-50 border-l-4 border-yellow-500": stock.highlight
                      }
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/dashboard/sources/${stock.id}`;
                    }}
                  >
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{stock.ticker}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className={clsx(
                        getSentimentColor(stock.sentiment_score),
                        "font-medium rounded-full px-2 py-1 text-xs inline-flex items-center justify-center w-12"
                      )}>
                        {stock.sentiment_score}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className={clsx(
                        getSentimentColor(stock.signal_score),
                        "font-medium rounded-full px-2 py-1 text-xs inline-flex items-center justify-center w-12"
                      )}>
                        {stock.signal_score}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {stock.pe}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatCurrency(stock.buy_price)}
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
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex justify-end gap-3">
                        <UpdateStock id={stock.id} />
                        <DeleteStock id={stock.id} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    No stocks found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, generatePagination, formatDate, isValidDateRange } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://162.248.100.66:3000/api';

// Items per page for pagination
const ITEMS_PER_PAGE = 5;

// Loading skeleton for the highlighted stocks table
export function HighlightedStocksExternalSkeleton() {
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0 shadow-md">
          <div className="flex justify-between items-center mb-4 px-4">
            <h2 className="text-xl font-semibold">Highlighted Stocks</h2>
          </div>
          <div className="md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="mb-2 w-full rounded-md bg-white p-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="h-5 w-24 rounded bg-gray-200"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal bg-gray-100">
              <tr>
                <th scope="col" className="px-3 py-5 font-medium">Ticker</th>
                <th scope="col" className="px-3 py-5 font-medium">Sentiment</th>
                <th scope="col" className="px-3 py-5 font-medium">Signal</th>
                <th scope="col" className="px-3 py-5 font-medium">PE</th>
                <th scope="col" className="px-3 py-5 font-medium">Buy Price</th>
                <th scope="col" className="px-3 py-5 font-medium">Guru</th>
                <th scope="col" className="px-3 py-5 font-medium">Source</th>
                <th scope="col" className="px-3 py-5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {[...Array(3)].map((_, i) => (
                <tr key={i} className="w-full border-b py-3 text-sm last-of-type:border-none hover:bg-gray-50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="whitespace-nowrap px-3 py-4">
                      <div className="h-5 w-24 rounded bg-gray-200"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Pagination component
export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  const allPages = generatePagination(currentPage, totalPages);

  // If there are no pages, don't render pagination
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 mt-6">
      {/* Left Arrow */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          currentPage <= 1
            ? 'pointer-events-none text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 text-gray-700 border-gray-300'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      <div className="flex -space-x-px">
        {allPages.map((page, index) => {
          let position: 'first' | 'last' | 'single' | 'middle' | undefined;

          if (index === 0) position = 'first';
          if (index === allPages.length - 1) position = 'last';
          if (allPages.length === 1) position = 'single';
          if (page === '...') position = 'middle';

          return (
            <button
              key={page.toString() + index}
              onClick={() => typeof page === 'number' ? onPageChange(page) : null}
              disabled={page === '...'}
              className={`flex h-9 w-9 items-center justify-center text-sm border transition-colors ${
                position === 'first' || position === 'single' ? 'rounded-l-md' : ''
              } ${
                position === 'last' || position === 'single' ? 'rounded-r-md' : ''
              } ${
                currentPage === page
                  ? 'z-10 bg-blue-600 border-blue-600 text-white hover:bg-blue-700'
                  : position === 'middle'
                  ? 'text-gray-300'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
          currentPage >= totalPages
            ? 'pointer-events-none text-gray-300 border-gray-200'
            : 'hover:bg-gray-100 text-gray-700 border-gray-300'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      
      {/* Page info */}
      <div className="ml-2 text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}
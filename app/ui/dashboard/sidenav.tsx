'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { StockLogo } from '@/app/ui/stock-logo';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={`flex h-full flex-col bg-white dark:bg-gray-800 transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 dark:border-gray-700">
        <Link className="flex items-center" href="/">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold text-black dark:text-white">StockScreener</span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className="flex-1 px-4 py-6">
        <NavLinks isCollapsed={isCollapsed} />
      </div>
      
      {!isCollapsed && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
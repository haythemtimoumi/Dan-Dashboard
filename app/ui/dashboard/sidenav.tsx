'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { StockLogo } from '@/app/ui/stock-logo';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <div className={`flex h-full flex-col bg-white transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
        <Link className="flex items-center" href="/">
          <div className="w-8 text-black">
            <StockLogo />
          </div>
          {!isCollapsed && (
            <span className="ml-3 text-xl font-bold text-black">StockScreener</span>
          )}
        </Link>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 hover:bg-gray-100 rounded-lg"
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
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}
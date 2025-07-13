'use client';

import { useState } from 'react';
import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { StockLogo } from '@/app/ui/stock-logo';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function SideNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className={clsx(
      "flex h-full flex-col transition-all duration-300 ease-in-out",
      "bg-gradient-to-b from-white via-gray-50 to-white",
      "border-r border-gray-200 shadow-xl",
      isCollapsed ? "w-20" : "w-full"
    )}>
      {/* Header Section */}
      <div className="relative">
        {/* Logo Section */}
        <Link
          className={clsx(
            "flex items-center justify-center rounded-xl m-4 p-4 transition-all duration-300",
            "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800",
            "hover:from-blue-700 hover:via-blue-800 hover:to-indigo-900",
            "shadow-lg hover:shadow-xl transform hover:scale-[1.02]",
            isCollapsed ? "h-16" : "h-20 md:h-32"
          )}
          href="/"
        >
          <div className={clsx(
            "text-white transition-all duration-300",
            isCollapsed ? "w-8" : "w-32 md:w-40"
          )}>
            <StockLogo />
          </div>
        </Link>
        
        {/* Collapse Toggle - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={clsx(
            "hidden md:flex absolute -right-3 top-8 z-10",
            "w-6 h-6 bg-white border border-gray-300 rounded-full",
            "items-center justify-center shadow-md hover:shadow-lg",
            "transition-all duration-300 hover:scale-110",
            "text-gray-600 hover:text-blue-600"
          )}
        >
          {isCollapsed ? (
            <Bars3Icon className="w-3 h-3" />
          ) : (
            <XMarkIcon className="w-3 h-3" />
          )}
        </button>
      </div>
      
      {/* Dashboard Info */}
      {!isCollapsed && (
        <div className="mx-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
            <h3 className="text-sm font-bold text-blue-900 mb-1">Dan Dashboard</h3>
            <p className="text-xs text-blue-700 opacity-80">Stock Analysis Platform</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-700 font-medium">Live Data</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className={clsx(
          "transition-all duration-300",
          isCollapsed && "opacity-0 pointer-events-none"
        )}>
          <NavLinks />
        </div>
        
        {/* Collapsed Navigation Icons */}
        {isCollapsed && (
          <div className="space-y-4 pt-4">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-2">Quick Access</div>
              {/* Add collapsed icon navigation here if needed */}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer Section */}
      {!isCollapsed && (
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100 text-center shadow-sm">
            <div className="text-xs text-gray-600 mb-2 font-medium">Last Updated</div>
            <div className="text-sm font-bold text-gray-800">
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
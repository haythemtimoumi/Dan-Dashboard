'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  StarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  CogIcon,
  TagIcon,
  ServerIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import SettingsModal from './settings-modal';

export default function NavLinks({ isCollapsed = false, onNavigate }: { isCollapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t, language } = useSettings();
  const { isAdmin } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <>
      <nav className="space-y-1">
        {/* Gold Stocks Link */}
        <Link
          href="/dashboard/gold-stocks"
          onClick={handleLinkClick}
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out",
            pathname === '/dashboard/gold-stocks'
              ? "bg-gradient-to-r from-blue-400/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-xl shadow-xl border border-blue-300/20 text-white shadow-blue-500/20"
              : "text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:backdrop-blur-sm hover:text-gray-900 dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Actions Or' : 'Gold Stocks') : undefined}
        >
          <CurrencyDollarIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Actions Or' : 'Gold Stocks'}</span>
              {pathname === '/dashboard/gold-stocks' && 
                <div className="ml-auto w-2 h-2 bg-white/80 rounded-full shadow-sm" />
              }
            </>
          )}
        </Link>
        {/* Stock Data Link */}
        <Link
          href="/dashboard/portfolio"
          onClick={handleLinkClick}
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out",
            (pathname === '/dashboard/portfolio' || (pathname.startsWith('/dashboard/portfolio') && !pathname.startsWith('/dashboard/portfolio-target')))
              ? "bg-gradient-to-r from-blue-400/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-xl shadow-xl border border-blue-300/20 text-white shadow-blue-500/20"
              : "text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:backdrop-blur-sm hover:text-gray-900 dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Règle 1' : 'Rule 1') : undefined}
        >
          <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Règle 1' : 'Rule 1'}</span>
              {(pathname === '/dashboard/portfolio' || (pathname.startsWith('/dashboard/portfolio') && !pathname.startsWith('/dashboard/portfolio-target'))) && 
                <div className="ml-auto w-2 h-2 bg-white/80 rounded-full shadow-sm" />
              }
            </>
          )}
        </Link>
        {/* Target Portfolio Link */}
        <Link
          href="/dashboard/portfolio-target"
          onClick={handleLinkClick}
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out",
            pathname === '/dashboard/portfolio-target' || pathname.startsWith('/dashboard/portfolio-target')
              ? "bg-gradient-to-r from-blue-400/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-xl shadow-xl border border-blue-300/20 text-white shadow-blue-500/20"
              : "text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:backdrop-blur-sm hover:text-gray-900 dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Portfolio' : 'Portfolio') : undefined}
        >
          <StarIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Portfolio' : 'Portfolio'}</span>
              {(pathname === '/dashboard/portfolio-target' || pathname.startsWith('/dashboard/portfolio-target')) && 
                <div className="ml-auto w-2 h-2 bg-white/80 rounded-full shadow-sm" />
              }
            </>
          )}
        </Link>
        {/* Gurus Link */}
        <Link
          href="/dashboard/gurus"
          onClick={handleLinkClick}
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ease-out",
            pathname === '/dashboard/gurus'
              ? "bg-gradient-to-r from-blue-400/30 via-indigo-500/30 to-purple-600/30 backdrop-blur-xl shadow-xl border border-blue-300/20 text-white shadow-blue-500/20"
              : "text-gray-600 dark:text-gray-300 hover:bg-white/30 dark:hover:bg-gray-700/30 hover:backdrop-blur-sm hover:text-gray-900 dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Gurus' : 'Gurus') : undefined}
        >
          <UserGroupIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Gurus' : 'Gurus'}</span>
              {pathname === '/dashboard/gurus' && 
                <div className="ml-auto w-2 h-2 bg-white/80 rounded-full shadow-sm" />
              }
            </>
          )}
        </Link>

      </nav>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
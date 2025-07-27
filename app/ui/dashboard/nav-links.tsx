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
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import SettingsModal from './settings-modal';

export default function NavLinks({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const { t } = useSettings();
  const { isAdmin } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  
  const links = [
    { name: t('dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('highlighted'), href: '/dashboard/highlighted', icon: StarIcon },
    { name: t('update'), href: '/dashboard/stock-update', icon: ArrowPathIcon },
    ...(isAdmin ? [{ name: t('addStock'), href: '/dashboard/stocks/create', icon: PlusCircleIcon }] : []),
  ];
  
  const portfolioSubLinks = [
    { name: t('manualPortfolio'), href: '/dashboard/portfolio-list' },
    { name: t('targetList'), href: '/dashboard/target-list' },
    { name: t('monitor'), href: '/dashboard/monitor-list' },
    { name: t('guruList'), href: '/dashboard/guru-list' },
    { name: t('Dan Portfolio'), href: '/dashboard/dan-portfolio-list' },
  ];
  
  return (
    <>
      <nav className="space-y-1">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href || 
            (link.href !== '/dashboard' && pathname.startsWith(link.href));
            
          return (
            <Link
              key={link.name}
              href={link.href}
              className={clsx(
                "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200",
                isActive
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? link.name : undefined}
            >
              <LinkIcon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate">{link.name}</span>
                  {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white dark:bg-black rounded-full" />}
                </>
              )}
            </Link>
          );
        })}
        
        {/* Portfolio Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPortfolioOpen(!isPortfolioOpen)}
            className={clsx(
              "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200 w-full",
              (pathname.includes('/portfolio-list') || pathname.includes('/target') || pathname.includes('/monitor') || pathname.includes('/guru-list') || pathname.includes('/dan-portfolio-list'))
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? t('portfolio') : undefined}
          >
            <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{t('portfolio')}</span>
                <ChevronDownIcon className={clsx(
                  "h-4 w-4 ml-auto transition-transform duration-200",
                  isPortfolioOpen && "rotate-180"
                )} />
              </>
            )}
          </button>
          
          {isPortfolioOpen && !isCollapsed && (
            <div className="ml-6 mt-1 space-y-1">
              {portfolioSubLinks.map((subLink) => {
                const isSubActive = pathname === subLink.href;
                return (
                  <Link
                    key={subLink.name}
                    href={subLink.href}
                    className={clsx(
                      "block px-4 py-2 text-sm rounded-xl transition-all duration-200",
                      isSubActive
                        ? "bg-gray-200 dark:bg-gray-600 text-black dark:text-white font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white"
                    )}
                  >
                    {subLink.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </nav>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
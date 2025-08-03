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
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';
import SettingsModal from './settings-modal';

export default function NavLinks({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const { t, language } = useSettings();
  const { isAdmin } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <nav className="space-y-1">
        {/* Stock Data Link */}
        <Link
          href="/dashboard/portfolio"
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200",
            (pathname === '/dashboard/portfolio' || (pathname.startsWith('/dashboard/portfolio') && !pathname.startsWith('/dashboard/portfolio-target')))
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Règle 1' : 'Rule 1') : undefined}
        >
          <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Règle 1' : 'Rule 1'}</span>
              {(pathname === '/dashboard/portfolio' || (pathname.startsWith('/dashboard/portfolio') && !pathname.startsWith('/dashboard/portfolio-target'))) && <div className="ml-auto w-1.5 h-1.5 bg-white dark:bg-black rounded-full" />}
            </>
          )}
        </Link>
        {/* Target Portfolio Link */}
        <Link
          href="/dashboard/portfolio-target"
          className={clsx(
            "group flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-200",
            pathname === '/dashboard/portfolio-target' || pathname.startsWith('/dashboard/portfolio-target')
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-black dark:hover:text-white",
            isCollapsed && "justify-center px-2"
          )}
          title={isCollapsed ? (language === 'fr' ? 'Portfolio' : 'Portfolio') : undefined}
        >
          <StarIcon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="truncate">{language === 'fr' ? 'Portfolio' : 'Portfolio'}</span>
              {(pathname === '/dashboard/portfolio-target' || pathname.startsWith('/dashboard/portfolio-target')) && <div className="ml-auto w-1.5 h-1.5 bg-white dark:bg-black rounded-full" />}
            </>
          )}
        </Link>

      </nav>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
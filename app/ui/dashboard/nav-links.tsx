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
  
  const links = [
    { name: t('dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('highlighted'), href: '/dashboard/highlighted', icon: StarIcon },
    { name: t('portfolio'), href: '/dashboard/portfolio-list', icon: DocumentTextIcon },
    { name: t('update'), href: '/dashboard/stock-update', icon: ArrowPathIcon },
    ...(isAdmin ? [{ name: t('addStock'), href: '/dashboard/stocks/create', icon: PlusCircleIcon }] : []),
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
        

      </nav>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
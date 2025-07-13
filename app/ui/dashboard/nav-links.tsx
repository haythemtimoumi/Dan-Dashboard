'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  TableCellsIcon,
  StarIcon,
  ScaleIcon,
  PlusCircleIcon,
  ChartBarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Navigation sections with improved organization
const navigationSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, description: 'Main overview' },
    ]
  },
  {
    title: 'Portfolio',
    items: [
      { name: 'Highlighted Stocks', href: '/dashboard/highlighted', icon: StarIcon, description: 'Top performing stocks' },
      { name: 'Portfolio List', href: '/dashboard/portfolio-list', icon: DocumentTextIcon, description: 'Your stock portfolio' },
    ]
  },
  {
    title: 'Management',
    items: [
      { name: 'Stock Update', href: '/dashboard/stock-update', icon: ArrowPathIcon, description: 'Update stock data' },
      { name: 'Add New Stock', href: '/dashboard/stocks/create', icon: PlusCircleIcon, description: 'Add to portfolio' },
    ]
  }
];

export default function NavLinks() {
  const pathname = usePathname();
  
  return (
    <nav className="space-y-6">
      {navigationSections.map((section, sectionIndex) => (
        <div key={section.title} className="space-y-2">
          {/* Section Header */}
          <div className="px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {section.title}
            </h3>
          </div>
          
          {/* Section Items */}
          <div className="space-y-1">
            {section.items.map((link) => {
              const LinkIcon = link.icon;
              const isActive = pathname === link.href || 
                (link.href !== '/dashboard' && pathname.startsWith(link.href));
                
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={clsx(
                    "nav-item group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-300 ease-in-out",
                    "hover:scale-[1.02] hover:shadow-md",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 active-indicator"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-700"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-white rounded-r-full" />
                  )}
                  
                  {/* Icon container */}
                  <div className={clsx(
                    "nav-icon flex-shrink-0 rounded-lg p-2 transition-all duration-300",
                    isActive 
                      ? "bg-white/20 text-white" 
                      : "bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                  )}>
                    <LinkIcon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{link.name}</div>
                    <div className={clsx(
                      "text-xs transition-colors duration-300",
                      isActive ? "text-blue-100" : "text-gray-500 group-hover:text-blue-600"
                    )}>
                      {link.description}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <ChevronRightIcon className={clsx(
                    "h-4 w-4 transition-all duration-300",
                    isActive 
                      ? "text-white transform rotate-90" 
                      : "text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1"
                  )} />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600/0 to-indigo-600/0 group-hover:from-blue-600/5 group-hover:to-indigo-600/5 transition-all duration-300" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
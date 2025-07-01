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
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Map of links to display in the side navigation.
const links = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'All Stocks', href: '/dashboard/stocks', icon: TableCellsIcon },
  { name: 'Highlighted Stocks', href: '/dashboard/highlighted', icon: StarIcon },
  { name: 'Stock Update', href: '/dashboard/stock-update', icon: ArrowPathIcon },
  { name: 'Recent Changes', href: '/dashboard/recent-changes', icon: ChartBarIcon },
  { name: 'rule1 vs manual', href: '/dashboard/sources', icon: ScaleIcon },
  { name: 'Add New Stock', href: '/dashboard/stocks/create', icon: PlusCircleIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  
  return (
    <div className="space-y-1">
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href || 
          (link.href !== '/dashboard' && pathname.startsWith(link.href));
          
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-blue-50 text-blue-700 shadow-sm"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <div className={clsx(
              "rounded-md p-1.5",
              isActive ? "bg-blue-100 text-blue-700" : "text-gray-500"
            )}>
              <LinkIcon className="w-5 h-5" />
            </div>
            <span>{link.name}</span>
            
            {/* Active indicator */}
            {isActive && (
              <span className="ml-auto h-2 w-2 rounded-full bg-blue-500"></span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  HomeIcon,
  StarIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Highlighted', href: '/dashboard/highlighted', icon: StarIcon },
  { name: 'Portfolio', href: '/dashboard/portfolio-list', icon: DocumentTextIcon },
  { name: 'Update', href: '/dashboard/stock-update', icon: ArrowPathIcon },
  { name: 'Add Stock', href: '/dashboard/stocks/create', icon: PlusCircleIcon },
];

export default function NavLinks({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();
  
  return (
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
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-black",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? link.name : undefined}
          >
            <LinkIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <>
                <span className="truncate">{link.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
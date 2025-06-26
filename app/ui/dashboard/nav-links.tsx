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
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

// Map of links to display in the side navigation.
const links = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'All Stocks', href: '/dashboard/stocks', icon: TableCellsIcon },
  { name: 'Highlighted Stocks', href: '/dashboard/highlighted', icon: StarIcon },
  { name: 'Recent Changes', href: '/dashboard/recent-changes', icon: ChartBarIcon },
  { name: 'rule1 vs manual', href: '/dashboard/sources', icon: ScaleIcon },
  { name: 'Add New Stock', href: '/dashboard/stocks/create', icon: PlusCircleIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              "flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3",
              {
                'bg-sky-100 text-blue-600': pathname === link.href || 
                  (link.href !== '/dashboard' && pathname.startsWith(link.href)),
              }
            )}
          >
            <LinkIcon className="w-6" />
            <p className="block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
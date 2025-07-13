import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { StockLogo } from '@/app/ui/stock-logo';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col bg-white">
      <Link
        className="flex h-16 items-center px-6 border-b border-gray-100"
        href="/"
      >
        <div className="w-8 text-black">
          <StockLogo />
        </div>
        <span className="ml-3 text-xl font-bold text-black">Dan</span>
      </Link>
      
      <div className="flex-1 px-4 py-6">
        <NavLinks />
      </div>
      
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
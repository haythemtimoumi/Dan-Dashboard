import Link from 'next/link';
import NavLinks from '@/app/ui/dashboard/nav-links';
import { StockLogo } from '@/app/ui/stock-logo';

export default function SideNav() {
  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-2 bg-white shadow-lg">
      <Link
        className="mb-4 flex h-20 items-end justify-start rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-4 md:h-40 shadow-md hover:shadow-lg transition-shadow duration-300"
        href="/"
      >
        <div className="w-32 text-white md:w-40">
          <StockLogo />
        </div>
      </Link>
      
      <div className="mb-4 px-2">
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
          <h3 className="text-sm font-medium text-blue-800 mb-1">Dan Dashboard</h3>
          <p className="text-xs text-blue-600">Stock Analysis Platform</p>
        </div>
      </div>
      
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2 overflow-y-auto">
        <div className="px-2 mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Navigation</p>
          <NavLinks />
        </div>
        
        <div className="hidden h-auto w-full grow md:block"></div>
        
        <div className="hidden md:block px-4 py-4 mt-auto">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 text-center">
            <div className="text-xs text-gray-500 mb-1">Last Updated</div>
            <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
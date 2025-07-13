'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/app/ui/dashboard/sidenav';
import { auth } from '@/app/lib/auth';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(auth.getUser());
  }, [router]);

  const handleLogout = () => {
    auth.logout();
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-200 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:flex-none border-r border-gray-100
      `}>
        <SideNav />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <span className="font-semibold">{user.username}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                user.role === 'admin' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
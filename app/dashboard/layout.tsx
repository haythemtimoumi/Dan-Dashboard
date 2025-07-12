'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SideNav from '@/app/ui/dashboard/sidenav';
import { auth } from '@/app/lib/auth';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
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
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-50">
      <div className="w-full flex-none md:w-72">
        <SideNav />
      </div>
      <div className="flex-grow flex flex-col">
        <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Welcome,</span>
            <span className="font-semibold text-gray-900">{user.username}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Logout
          </button>
        </div>
        <div className="flex-grow p-2 md:overflow-y-auto md:p-4">
          <div className="max-w-none">
            {children}
          </div>
          <footer className="mt-6 text-center text-xs text-gray-400 pb-4">
            <p>© {new Date().getFullYear()} Dan Dashboard</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
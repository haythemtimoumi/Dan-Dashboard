'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SideNav from '@/app/ui/dashboard/sidenav';
import { auth } from '@/app/lib/auth';
import { ArrowRightOnRectangleIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';
import FloatingSettingsButton from '@/app/ui/dashboard/floating-settings-button';
import ChatbotSimple from '@/app/ui/chatbot-simple';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { t } = useSettings();

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
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 transform transition-transform duration-200 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:flex-none border-r border-gray-100 dark:border-gray-700
      `}>
        <SideNav />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
              title="Menu"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
              <span className="text-xs font-medium text-gray-900 dark:text-white">{user.username}</span>
              <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                user.role === 'admin' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-300 dark:bg-gray-500 text-gray-700 dark:text-gray-300'
              }`}>
                {user.role}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
              title={t('logout')}
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="p-3">
            {children}
          </div>
        </div>
      </div>
      <FloatingSettingsButton />
      <ChatbotSimple />
    </div>
  );
}
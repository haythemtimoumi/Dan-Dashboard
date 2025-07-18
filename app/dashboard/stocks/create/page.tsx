'use client';

import { lusitana } from '@/app/ui/fonts';
import StatusCard from '@/app/ui/scraper/StatusCard';
import TickerGrid from '@/app/ui/scraper/TickerGrid';
import TickerManager from '@/app/ui/scraper/TickerManager';
import ThemeToggle from '@/app/ui/scraper/ThemeToggle';
import ConnectionStatus from '@/app/ui/scraper/ConnectionStatus';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';

export default function ScraperManagementPage() {
  const { t } = useSettings();
  const { isAdmin } = useAuth();
  
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">Admin access required to view this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full space-y-6">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl text-gray-900 dark:text-white`}>{t('stockScraperManagement')}</h1>
        <ThemeToggle />
      </div>
      
      <ConnectionStatus />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusCard />
        <TickerManager />
      </div>
      
      <TickerGrid />
    </div>
  );
}
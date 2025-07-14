'use client';

import { lusitana } from '@/app/ui/fonts';
import StatusCard from '@/app/ui/scraper/StatusCard';
import TickerGrid from '@/app/ui/scraper/TickerGrid';
import TickerManager from '@/app/ui/scraper/TickerManager';
import ThemeToggle from '@/app/ui/scraper/ThemeToggle';
import ConnectionStatus from '@/app/ui/scraper/ConnectionStatus';
import { useSettings } from '@/app/contexts/settings-context';

export default function ScraperManagementPage() {
  const { t } = useSettings();
  
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
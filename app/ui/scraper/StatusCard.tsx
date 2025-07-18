'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { scraperApi, ScraperStatus } from '@/app/lib/scraper-api';
import { ClockIcon, PlayIcon, StopIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { StatusSkeleton } from './LoadingSkeleton';
import { useSettings } from '@/app/contexts/settings-context';
import { useState, useEffect } from 'react';

// Separate component for the countdown timer
function CountdownTimer({ nextRunTime }: { nextRunTime: string | undefined }) {
  const [countdown, setCountdown] = useState('00:00:00');
  
  useEffect(() => {
    if (!nextRunTime) {
      setCountdown('00:00:00');
      return;
    }
    
    const updateCountdown = () => {
      const now = new Date();
      const nextRun = new Date(nextRunTime);
      const diff = nextRun.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown('00:00:00');
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // Format with leading zeros
      const formattedHours = hours.toString().padStart(2, '0');
      const formattedMinutes = minutes.toString().padStart(2, '0');
      const formattedSeconds = seconds.toString().padStart(2, '0');
      
      setCountdown(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
    };
    
    // Update immediately
    updateCountdown();
    
    // Update every second
    const timer = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(timer);
  }, [nextRunTime]);
  
  return countdown;
}

export default function StatusCard() {
  const { t } = useSettings();
  const queryClient = useQueryClient();
  const [isReloading, setIsReloading] = useState(false);
  
  const { data: status, isLoading, error } = useQuery<ScraperStatus>({
    queryKey: ['scraper-status'],
    queryFn: scraperApi.getStatus,
    refetchInterval: 30000,
    staleTime: 10000, // Consider data stale after 10 seconds
    gcTime: 15000, // Keep data in cache for 15 seconds
  });
  
  const handleReloadState = async () => {
    try {
      setIsReloading(true);
      const freshStatus = await scraperApi.reloadScraperState();
      queryClient.setQueryData(['scraper-status'], freshStatus);
      console.log('Scraper status reloaded successfully:', freshStatus);
    } catch (error) {
      console.error('Failed to reload scraper state:', error);
    } finally {
      setIsReloading(false);
    }
  };

  if (isLoading) return <StatusSkeleton />;
  if (error) return (
    <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <XCircleIcon className="h-6 w-6 text-red-500" />
        <h3 className="text-lg font-semibold text-red-800">Connection Error</h3>
      </div>
      <p className="text-red-700 text-sm">Unable to connect to scraper service</p>
    </div>
  );
  if (!status) return null;

  const getStatusConfig = () => {
    const statusValue = status.status || (status.is_running ? 'running' : 'idle');
    
    switch (statusValue) {
      case 'running': 
        return { color: 'from-green-500 to-emerald-600', icon: <PlayIcon className="h-5 w-5" />, pulse: true };
      case 'idle': 
        return { color: 'from-blue-500 to-cyan-600', icon: <StopIcon className="h-5 w-5" />, pulse: false };
      case 'ready': 
        return { color: 'from-amber-500 to-orange-600', icon: <ClockIcon className="h-5 w-5" />, pulse: false };
      default: 
        return { color: 'from-gray-500 to-slate-600', icon: <ClockIcon className="h-5 w-5" />, pulse: false };
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    
    // Extract the time directly from the ISO string to avoid timezone conversions
    const matches = dateStr.match(/T(\d{2}):(\d{2})/);
    if (matches) {
      const hours = matches[1];
      const minutes = matches[2];
      
      // Extract date parts
      const date = new Date(dateStr);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const day = date.getUTCDate();
      
      return `${month} ${day}, ${hours}:${minutes} UTC`;
    }
    
    // Fallback to the original format if pattern doesn't match
    const date = new Date(dateStr);
    return date.toUTCString();
  };
  
  const config = getStatusConfig();

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} text-white shadow-md`}>
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t('scraperStatus')}</h3>
              <p className="text-sm text-gray-600">{t('nextRunCountdown')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleReloadState}
              disabled={isReloading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              title="Refresh scraper status"
            >
              <ArrowPathIcon className={`h-5 w-5 ${isReloading ? 'animate-spin' : ''}`} />
              <span>{t('reloadState')}</span>
            </button>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${config.color} text-white shadow-md ${config.pulse ? 'animate-pulse' : ''}`}>
              {config.icon}
              <span className="capitalize font-semibold">{status.status || (status.is_running ? 'running' : 'idle')}</span>
            </div>
          </div>
        </div>

        {/* Countdown Display */}
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">{t('nextRunIn')}</p>
            <div className="text-6xl font-bold text-gray-900 mb-2 font-mono tracking-wider">
              <CountdownTimer nextRunTime={status.next_run} />
            </div>
            <p className="text-sm text-gray-500">{t('hoursMinutesSeconds')}</p>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {status.is_running ? 
                <CheckCircleIcon className="h-5 w-5 text-green-600" /> : 
                <XCircleIcon className="h-5 w-5 text-red-500" />
              }
              <span className="text-sm font-medium text-gray-700">{t('status')}</span>
            </div>
            <p className={`text-lg font-bold ${status.is_running ? 'text-green-600' : 'text-red-500'}`}>
              {status.is_running ? t('running') : t('stopped')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              {status.can_update_tickers ? 
                <CheckCircleIcon className="h-5 w-5 text-green-600" /> : 
                <XCircleIcon className="h-5 w-5 text-amber-500" />
              }
              <span className="text-sm font-medium text-gray-700">{t('updates')}</span>
            </div>
            <p className={`text-lg font-bold ${status.can_update_tickers ? 'text-green-600' : 'text-amber-600'}`}>
              {status.can_update_tickers ? t('available') : t('locked')}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">{t('nextRun')}</span>
            <span className="text-sm font-bold text-gray-900">{formatDateTime(status.next_run)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">{t('lastRun')}</span>
            <span className="text-sm font-bold text-gray-900">{formatDateTime(status.last_run)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
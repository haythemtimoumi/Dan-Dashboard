'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/auth-context';
import { useSettings } from '@/app/contexts/settings-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlayIcon, ClockIcon, CogIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, PencilSquareIcon, TagIcon } from '@heroicons/react/24/outline';

interface Service {
  name: string;
  description: string;
  useCase: string;
  category: 'monthly' | 'daily' | 'hourly';
}

const serviceDescriptions: Record<string, Service> = {
  'main-scraper.service': {
    name: 'Main Scraper',
    description: 'Runs all scrapers',
    useCase: 'Complete data collection',
    category: 'monthly'
  },
  'month-rule.service': {
    name: 'Monthly Rule',
    description: 'Monthly processing',
    useCase: 'Monthly tasks',
    category: 'monthly'
  },
  'stockscores-to-db.service': {
    name: 'StockScores',
    description: 'StockScores scraper',
    useCase: 'Technical analysis data',
    category: 'monthly'
  },
  'rule1-guru-to-db.service': {
    name: 'Rule1 + GuruFocus',
    description: 'Rule1 + GuruFocus',
    useCase: 'Fundamental analysis',
    category: 'monthly'
  },
  'dan-watchlist-to-db.service': {
    name: 'Dan Watchlist',
    description: 'Personal watchlist',
    useCase: 'Your tracked stocks',
    category: 'monthly'
  },
  'rule1-list-to-db.service': {
    name: 'Rule1 List',
    description: 'Rule1 ticker discovery',
    useCase: 'Find new stocks',
    category: 'monthly'
  },
  'run-sequential-scraping.service': {
    name: 'Sequential Scraping',
    description: 'Sequential processing',
    useCase: 'Ordered execution',
    category: 'monthly'
  }
};

export default function ScraperManagement() {
  const { isAdmin } = useAuth();
  const { t, language } = useSettings();
  const router = useRouter();
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningServices, setRunningServices] = useState<Set<string>>(new Set());
  const [schedule, setSchedule] = useState('daily');
  const [scheduleUpdating, setScheduleUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [configExpanded, setConfigExpanded] = useState(false);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [currentScheduleDisplay, setCurrentScheduleDisplay] = useState('monthly');
  
  // Daily Scraper state
  const [dailyStatus, setDailyStatus] = useState<{
    service_status: string;
    timer_status: string;
    current_script: string;
    last_run: string;
  } | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [selectedScript, setSelectedScript] = useState('scrape_all_active_ticker');
  const [dailySchedule, setDailySchedule] = useState('daily');
  const [customSchedule, setCustomSchedule] = useState('*-*-* 06:00:00');
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [updatingDailySchedule, setUpdatingDailySchedule] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  
  // Hourly Scraper state
  const [hourlyStatus, setHourlyStatus] = useState<{
    service_status: string;
    timer_status: string;
    current_script: string;
    last_run: string;
    service_last_runs: Record<string, string>;
  } | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [selectedHourlyScript, setSelectedHourlyScript] = useState('hourly_scraping');
  const [hourlySchedule, setHourlySchedule] = useState('*-*-* *:05:00');
  const [customHourlySchedule, setCustomHourlySchedule] = useState('*-*-* *:05:00');
  const [updatingHourlyConfig, setUpdatingHourlyConfig] = useState(false);
  const [updatingHourlySchedule, setUpdatingHourlySchedule] = useState(false);
  
  // Manual Scraper state
  const [selectedManualScript, setSelectedManualScript] = useState('run_sequential_scraping');
  const [runningManualScript, setRunningManualScript] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('https://stock-ticker.dev/services');
      if (!response.ok) throw new Error('Failed to fetch services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setError(t('failedToLoadServices'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchDailyStatus = useCallback(async () => {
    try {
      const response = await fetch('https://stock-ticker.dev/status');
      if (response.ok) {
        const data = await response.json();
        setDailyStatus(data);
        setSelectedScript(data.current_script || 'scrape_all_active_ticker');
      }
    } catch (error) {
      console.error('Failed to fetch daily status:', error);
    }
  }, []);

  const fetchHourlyStatus = useCallback(async () => {
    try {
      const response = await fetch('https://stock-ticker.dev/hourly-status');
      if (response.ok) {
        const data = await response.json();
        setHourlyStatus(data);
        setSelectedHourlyScript(data.current_script || 'hourly_scraping');
      }
    } catch (error) {
      console.error('Failed to fetch hourly status:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchServices();
    fetchDailyStatus();
    fetchHourlyStatus();
    
    // Auto-refresh status every 30 seconds
    const interval = setInterval(() => {
      fetchDailyStatus();
      fetchHourlyStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, router, fetchServices, fetchDailyStatus]);

  const updateDailyConfig = async () => {
    setUpdatingConfig(true);
    try {
      const response = await fetch('https://stock-ticker.dev/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: selectedScript })
      });
      
      if (response.ok) {
        setSuccessMessage('Daily scraper configuration updated successfully');
        fetchDailyStatus();
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      console.error('Failed to update daily config:', error);
      setError('Failed to update daily scraper configuration');
    } finally {
      setUpdatingConfig(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
    }
  };

  const updateDailySchedule = async () => {
    setUpdatingDailySchedule(true);
    try {
      const scheduleValue = dailySchedule === 'custom' ? customSchedule : dailySchedule;
      const response = await fetch('https://stock-ticker.dev/update-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleValue })
      });
      
      if (response.ok) {
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 2000);
        fetchDailyStatus();
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      console.error('Failed to update daily schedule:', error);
      setError('Failed to update daily scraper schedule');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdatingDailySchedule(false);
    }
  };

  const updateHourlyConfig = async () => {
    setUpdatingHourlyConfig(true);
    try {
      const response = await fetch('https://stock-ticker.dev/hourly-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: selectedHourlyScript })
      });
      
      if (response.ok) {
        setSuccessMessage('Hourly scraper configuration updated successfully');
        fetchHourlyStatus();
      } else {
        throw new Error('Failed to update hourly configuration');
      }
    } catch (error) {
      console.error('Failed to update hourly config:', error);
      setError('Failed to update hourly scraper configuration');
    } finally {
      setUpdatingHourlyConfig(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
    }
  };



  const updateHourlySchedule = async () => {
    setUpdatingHourlySchedule(true);
    try {
      const scheduleValue = hourlySchedule === 'custom' ? customHourlySchedule : hourlySchedule;
      const response = await fetch('https://stock-ticker.dev/update-hourly-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleValue })
      });
      
      if (response.ok) {
        setSuccessMessage('Hourly scraper schedule updated successfully');
        fetchHourlyStatus();
      } else {
        throw new Error('Failed to update hourly schedule');
      }
    } catch (error) {
      console.error('Failed to update hourly schedule:', error);
      setError('Failed to update hourly scraper schedule');
    } finally {
      setUpdatingHourlySchedule(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
    }
  };

  const runManualScript = async () => {
    setRunningManualScript(true);
    try {
      const endpoint = selectedManualScript === 'run_sequential_scraping' 
        ? 'https://stock-ticker.dev/run-manual-sequential'
        : 'https://stock-ticker.dev/run-manual-active';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        setSuccessMessage(`Manual scraper started: ${selectedManualScript}`);
      } else {
        throw new Error('Failed to run manual script');
      }
    } catch (error) {
      console.error('Failed to run manual script:', error);
      setError('Failed to run manual scraper');
    } finally {
      setRunningManualScript(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
    }
  };



  const updateSchedule = async () => {
    setScheduleUpdating(true);
    try {
      const response = await fetch('https://stock-ticker.dev/update-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      });
      
      if (!response.ok) throw new Error('Failed to update schedule');
      
      setSuccessMessage(t('scheduleUpdated'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update schedule:', error);
      setError(t('failedToUpdateSchedule'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setScheduleUpdating(false);
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch('https://stock-ticker.dev/services');
      if (!response.ok) throw new Error('Connection test failed');
      const data = await response.json();
      
      if (data.services) {
        setSuccessMessage(t('connectionSuccessful'));
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error('No services returned');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError(t('connectionFailed'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setTestingConnection(false);
    }
  };

  const updateScheduleConfig = async () => {
    setScheduleUpdating(true);
    try {
      const scheduleValue = `*-*-${dayOfMonth.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      
      const response = await fetch('https://stock-ticker.dev/update-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: scheduleValue })
      });
      
      if (!response.ok) throw new Error('Failed to update schedule');
      const data = await response.json();
      
      if (data.success) {
        setCurrentScheduleDisplay(scheduleValue);
        setSuccessMessage(data.message || t('scheduleUpdated'));
        setTimeout(() => setSuccessMessage(null), 3000);
        setConfigExpanded(false);
      }
    } catch (error) {
      console.error('Failed to update schedule:', error);
      setError(t('failedToUpdateSchedule'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setScheduleUpdating(false);
    }
  };

  const renderServiceSection = (category: 'monthly' | 'daily' | 'hourly', title: string, icon: React.ReactNode) => {
    const isComingSoon = category === 'daily';
    const isRunning = runningServices.has('main-scraper.service');

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {icon}
          {title}
          {isComingSoon && (
            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium">
              {t('comingSoon')}
            </span>
          )}
        </h2>
        
        {isComingSoon ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('apiInDevelopment')}
            </p>
          </div>
        ) : category === 'monthly' ? (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                    Main Scraper
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Runs all scrapers
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 px-2 py-1 rounded-full inline-block">
                    Complete data collection
                  </p>
                </div>
                <div className="ml-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <CogIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Exécution automatique selon l\'horaire configuré' : 'Runs automatically according to configured schedule'}
                </p>
              </div>
            </div>
          </div>
        ) : category === 'hourly' ? (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-700 dark:to-purple-800 rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-purple-200 dark:border-purple-600">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                    {language === 'fr' ? 'Scraper Horaire' : 'Hourly Scraper'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {language === 'fr' ? 'Traitement horaire automatique' : 'Automated hourly processing'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-purple-600 px-2 py-1 rounded-full inline-block">
                    {hourlyStatus?.service_status === 'active' ? (language === 'fr' ? 'Actif' : 'Active') : (language === 'fr' ? 'Inactif' : 'Inactive')}
                  </p>
                </div>
                <div className="ml-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Exécution automatique selon l\'horaire configuré' : 'Runs automatically according to configured schedule'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CogIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('noServicesAvailable')}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('scraperManagement')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageScrapingServices')}
          </p>
        </div>
        <Link
          href="/dashboard/tickers"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <TagIcon className="h-4 w-4" />
          {language === 'fr' ? 'Voir Portfolio' : 'View Portfolio'}
        </Link>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-200">{successMessage}</span>
        </div>
      )}

      {/* Schedule Control */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ClockIcon className="h-5 w-5" />
          {t('schedule')}
        </h2>
        <div className="flex items-center gap-4">
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="daily">{t('daily')}</option>
            <option value="weekly">{t('weekly')}</option>
            <option value="monthly">{t('monthly')}</option>
            <option value="*-*-* 09:00:00">{t('customSchedule')}</option>
          </select>
          <button
            onClick={updateSchedule}
            disabled={scheduleUpdating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {scheduleUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {t('updateSchedule')}
          </button>
          <button
            onClick={testConnection}
            disabled={testingConnection}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {testingConnection && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
            {t('testConnection')}
          </button>
        </div>
      </div>

      {/* Schedule Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('scheduleConfiguration')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('configureMonthlySchedule')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setConfigExpanded(!configExpanded)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <CogIcon className="h-4 w-4" />
            {configExpanded ? t('cancel') : t('editConfig')}
          </button>
        </div>

        {/* Current Schedule Display */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('currentSchedule')}:</span>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{currentScheduleDisplay}</span>
        </div>

        {configExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('dayOfMonth')}
                </label>
                <select
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('hour')} (0-23)
                </label>
                <select
                  value={hour}
                  onChange={(e) => setHour(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('minute')} (0-59)
                </label>
                <select
                  value={minute}
                  onChange={(e) => setMinute(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={updateScheduleConfig}
                disabled={scheduleUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {scheduleUpdating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {t('updateSchedule')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daily Scraper Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-green-600" />
              {language === 'fr' ? 'Scraper Quotidien' : 'Daily Scraper'}
            </h2>
            <button
              onClick={fetchDailyStatus}
              disabled={dailyLoading}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              {dailyLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              ) : (
                language === 'fr' ? 'Actualiser' : 'Refresh Status'
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Service Information Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              {language === 'fr' ? 'Informations du Service' : 'Service Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Statut Service' : 'Service Status'}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    dailyStatus?.service_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold capitalize">
                    {dailyStatus?.service_status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Statut Timer' : 'Timer Status'}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    dailyStatus?.timer_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold capitalize">
                    {dailyStatus?.timer_status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Script Actuel' : 'Current Script'}
                </div>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {dailyStatus?.current_script || 'None'}
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Dernière Exécution' : 'Last Run'}
                </div>
                <span className="text-sm font-semibold">
                  {dailyStatus?.last_run || 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Script Configuration Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {language === 'fr' ? 'Configuration du Script' : 'Script Configuration'}
            </h3>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="space-y-4 mb-6">
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="script"
                    value="run_sequential_scraping"
                    checked={selectedScript === 'run_sequential_scraping'}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="mt-1 mr-4 text-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">run_sequential_scraping</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Scraping complet avec Rule1 + StockScores + Prix' : 'Full scraping with Rule1 + StockScores + Prices'}
                    </div>
                  </div>
                </label>
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="script"
                    value="scrape_all_active_ticker"
                    checked={selectedScript === 'scrape_all_active_ticker'}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="mt-1 mr-4 text-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">scrape_all_active_ticker</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Scrape tous les tickers actifs avec données fraîches' : 'Scrape all active tickers with fresh data'}
                    </div>
                  </div>
                </label>
              </div>
              <button
                onClick={updateDailyConfig}
                disabled={updatingConfig}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {updatingConfig && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour la Configuration' : 'Update Configuration'}
              </button>
            </div>
          </div>

          {/* Schedule Configuration Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {language === 'fr' ? 'Configuration de l\'Horaire' : 'Schedule Configuration'}
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Choisir l\'horaire' : 'Choose Schedule'}
                  </label>
                  <select
                    value={dailySchedule}
                    onChange={(e) => setDailySchedule(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  >
                    <optgroup label={language === 'fr' ? 'Options prédéfinies' : 'Preset Options'}>
                      <option value="daily">{language === 'fr' ? 'Tous les jours (défaut)' : 'Every day (default)'}</option>
                      <option value="*-*-* 06:00:00">{language === 'fr' ? 'Tous les jours à 6h00' : 'Every day at 6:00 AM'}</option>
                      <option value="*-*-* 18:00:00">{language === 'fr' ? 'Tous les jours à 18h00' : 'Every day at 6:00 PM'}</option>
                    </optgroup>
                    <optgroup label={language === 'fr' ? 'Options avancées' : 'Advanced Options'}>
                      <option value="custom">{language === 'fr' ? 'Horaire personnalisé...' : 'Custom schedule...'}</option>
                    </optgroup>
                  </select>
                </div>
                
                {dailySchedule === 'custom' && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Format personnalisé' : 'Custom Format'}
                    </label>
                    <input
                      type="text"
                      value={customSchedule}
                      onChange={(e) => setCustomSchedule(e.target.value)}
                      placeholder="*-*-* HH:MM:SS"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors font-mono"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {language === 'fr' ? 'Exemple: *-*-* 09:30:00 pour tous les jours à 9h30' : 'Example: *-*-* 09:30:00 for every day at 9:30 AM'}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={updateDailySchedule}
                disabled={updatingDailySchedule}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {updatingDailySchedule && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour l\'Horaire' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Scraper Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
              {language === 'fr' ? 'Scraper Horaire' : 'Hourly Scraper'}
            </h2>
            <button
              onClick={fetchHourlyStatus}
              disabled={hourlyLoading}
              className="px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 border border-gray-200 dark:border-gray-600 transition-colors"
            >
              {hourlyLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              ) : (
                language === 'fr' ? 'Actualiser' : 'Refresh Status'
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Service Information Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {language === 'fr' ? 'Informations du Service' : 'Service Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Statut Service' : 'Service Status'}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    hourlyStatus?.service_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold capitalize">
                    {hourlyStatus?.service_status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Statut Timer' : 'Timer Status'}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    hourlyStatus?.timer_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-semibold capitalize">
                    {hourlyStatus?.timer_status || 'Unknown'}
                  </span>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Script Actuel' : 'Current Script'}
                </div>
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {hourlyStatus?.current_script || 'None'}
                </span>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Dernière Exécution' : 'Last Run'}
                </div>
                <span className="text-sm font-semibold">
                  {hourlyStatus?.last_run || 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Script Configuration Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              {language === 'fr' ? 'Configuration du Script' : 'Script Configuration'}
            </h3>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="space-y-4 mb-6">
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="hourlyScript"
                    value="hourly_scraping"
                    checked={selectedHourlyScript === 'hourly_scraping'}
                    onChange={(e) => setSelectedHourlyScript(e.target.value)}
                    className="mt-1 mr-4 text-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">hourly_scraping</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Scraping horaire complet avec Rule1 + StockScores + Prix frais' : 'Full hourly scraping with fresh Rule1 + StockScores + Prices'}
                    </div>
                  </div>
                </label>
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="hourlyScript"
                    value="scrape_all_active_ticker_hourly"
                    checked={selectedHourlyScript === 'scrape_all_active_ticker_hourly'}
                    onChange={(e) => setSelectedHourlyScript(e.target.value)}
                    className="mt-1 mr-4 text-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">scrape_all_active_ticker_hourly</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Réutilise Rule1, données fraîches StockScores + Prix' : 'Reuses Rule1 data, fresh StockScores + Prices'}
                    </div>
                  </div>
                </label>
              </div>
              <button
                onClick={updateHourlyConfig}
                disabled={updatingHourlyConfig}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {updatingHourlyConfig && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour la Configuration' : 'Update Configuration'}
              </button>
            </div>
          </div>

          {/* Schedule Configuration Block */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              {language === 'fr' ? 'Configuration de l\'Horaire' : 'Schedule Configuration'}
            </h3>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Choisir l\'horaire' : 'Choose Schedule'}
                  </label>
                  <select
                    value={hourlySchedule}
                    onChange={(e) => setHourlySchedule(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                  >
                    <optgroup label={language === 'fr' ? 'Options prédéfinies' : 'Preset Options'}>
                      <option value="*-*-* *:05:00">{language === 'fr' ? 'Toutes les heures à :05' : 'Every hour at :05'}</option>
                      <option value="*-*-* *:15:00">{language === 'fr' ? 'Toutes les heures à :15' : 'Every hour at :15'}</option>
                      <option value="*-*-* *:30:00">{language === 'fr' ? 'Toutes les heures à :30' : 'Every hour at :30'}</option>
                      <option value="*-*-* *:00,30:00">{language === 'fr' ? 'Toutes les 30 minutes' : 'Every 30 minutes'}</option>
                    </optgroup>
                    <optgroup label={language === 'fr' ? 'Options avancées' : 'Advanced Options'}>
                      <option value="custom">{language === 'fr' ? 'Horaire personnalisé...' : 'Custom schedule...'}</option>
                    </optgroup>
                  </select>
                </div>
                
                {hourlySchedule === 'custom' && (
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {language === 'fr' ? 'Format personnalisé' : 'Custom Format'}
                    </label>
                    <input
                      type="text"
                      value={customHourlySchedule}
                      onChange={(e) => setCustomHourlySchedule(e.target.value)}
                      placeholder="*-*-* *:MM:SS"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors font-mono"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {language === 'fr' ? 'Exemple: *-*-* *:15:00 pour toutes les heures à 15 minutes' : 'Example: *-*-* *:15:00 for every hour at 15 minutes'}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={updateHourlySchedule}
                disabled={updatingHourlySchedule}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {updatingHourlySchedule && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour l\'Horaire' : 'Update Schedule'}
              </button>
            </div>
          </div>


        </div>
      </div>

      {/* Manual Scraper Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <PlayIcon className="h-5 w-5 text-orange-600" />
              {language === 'fr' ? 'Scraper Manuel' : 'Manual Scraper'}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Exécution immédiate' : 'Immediate execution'}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Script Selection */}
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              {language === 'fr' ? 'Sélection du Script' : 'Script Selection'}
            </h3>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
              <div className="space-y-4 mb-6">
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="manualScript"
                    value="run_sequential_scraping"
                    checked={selectedManualScript === 'run_sequential_scraping'}
                    onChange={(e) => setSelectedManualScript(e.target.value)}
                    className="mt-1 mr-4 text-orange-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">run_sequential_scraping_manually</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Scraping complet avec données Rule1 fraîches pour tickers target=true' : 'Full scraping with fresh Rule1 data for target=true tickers'}
                    </div>
                  </div>
                </label>
                <label className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="manualScript"
                    value="scrape_all_active_ticker"
                    checked={selectedManualScript === 'scrape_all_active_ticker'}
                    onChange={(e) => setSelectedManualScript(e.target.value)}
                    className="mt-1 mr-4 text-orange-600"
                  />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">scrape_all_active_ticker_manually</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'fr' ? 'Réutilise Rule1, données fraîches pour tickers target=true' : 'Reuses Rule1 data, fresh data for target=true tickers'}
                    </div>
                  </div>
                </label>
              </div>
              <button
                onClick={runManualScript}
                disabled={runningManualScript}
                className={`w-full px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                  runningManualScript
                    ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {runningManualScript ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    {language === 'fr' ? 'Exécution...' : 'Running...'}
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-4 w-4" />
                    {language === 'fr' ? 'Exécuter Maintenant' : 'Run Now'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scraper Sections */}
      <div className="space-y-6">
        {renderServiceSection('monthly', t('monthlyScrapers'), <CalendarIcon className="h-5 w-5 text-blue-600" />)}
      </div>

      {services.length === 0 && !loading && (
        <div className="text-center py-12">
          <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            {t('noServicesAvailable')}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('checkConnectionToScrapingServer')}
          </p>
          <button
            onClick={fetchServices}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('retry')}
          </button>
        </div>
      )}
      {/* Popup Notification */}
      {showPopup && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {language === 'fr' ? 'Terminé - Le timer a été modifié' : 'Done - Timer was changed'}
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/auth-context';
import { useSettings } from '@/app/contexts/settings-context';
import { useRouter } from 'next/navigation';
import { PlayIcon, ClockIcon, CogIcon, ExclamationTriangleIcon, CheckCircleIcon, CalendarIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

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

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchServices();
  }, [isAdmin, router]);

  const fetchServices = async () => {
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
  };

  const runService = async (serviceName: string) => {
    setRunningServices(prev => new Set(prev).add(serviceName));
    try {
      const response = await fetch('https://stock-ticker.dev/run-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName })
      });
      
      if (!response.ok) throw new Error('Failed to run service');
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(`${t('serviceStarted')}: ${serviceName}`);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Failed to run service:', error);
      setError(`${t('failedToStartService')}: ${serviceName}`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setTimeout(() => {
        setRunningServices(prev => {
          const newSet = new Set(prev);
          newSet.delete(serviceName);
          return newSet;
        });
      }, 3000);
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
    const categoryServices = services.filter(service => {
      const serviceInfo = serviceDescriptions[service];
      return serviceInfo?.category === category;
    });

    const isComingSoon = category === 'daily' || category === 'hourly';

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
        ) : categoryServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryServices.map((service) => {
              const serviceInfo = serviceDescriptions[service] || {
                name: service.replace('.service', ''),
                description: service,
                useCase: 'Service execution',
                category: 'monthly' as const
              };
              const isRunning = runningServices.has(service);

              return (
                <div
                  key={service}
                  className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-5 hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
                        {serviceInfo.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {serviceInfo.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 px-2 py-1 rounded-full inline-block">
                        {serviceInfo.useCase}
                      </p>
                    </div>
                    <div className="ml-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <CogIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => runService(service)}
                    disabled={isRunning}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                      isRunning
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        {t('running')}
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        {t('run')}
                      </>
                    )}
                  </button>
                </div>
              );
            })}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('scraperManagement')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('manageScrapingServices')}
        </p>
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

      {/* Scraper Sections */}
      <div className="space-y-6">
        {renderServiceSection('monthly', t('monthlyScrapers'), <CalendarIcon className="h-5 w-5 text-blue-600" />)}
        {renderServiceSection('daily', t('dailyScrapers'), <ClockIcon className="h-5 w-5 text-green-600" />)}
        {renderServiceSection('hourly', t('hourlyScrapers'), <ClockIcon className="h-5 w-5 text-purple-600" />)}
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
    </div>
  );
}
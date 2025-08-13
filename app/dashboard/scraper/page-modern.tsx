'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/auth-context';
import { useSettings } from '@/app/contexts/settings-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  PlayIcon, 
  ClockIcon, 
  CogIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  TagIcon,
  ArrowPathIcon,
  PauseIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ScraperManagement() {
  const { isAdmin } = useAuth();
  const { t, language } = useSettings();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
  
  // Hourly Scraper state
  const [hourlyStatus, setHourlyStatus] = useState<{
    service_status: string;
    timer_status: string;
    current_script: string;
    last_run: string;
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
    setLoading(false);
    fetchDailyStatus();
    fetchHourlyStatus();
    
    const interval = setInterval(() => {
      fetchDailyStatus();
      fetchHourlyStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, router, fetchDailyStatus, fetchHourlyStatus]);

  const updateDailyConfig = async () => {
    setUpdatingConfig(true);
    try {
      const response = await fetch('https://stock-ticker.dev/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: selectedScript })
      });
      
      if (response.ok) {
        setSuccessMessage(language === 'fr' ? 'Configuration mise à jour' : 'Configuration updated');
        fetchDailyStatus();
      } else {
        throw new Error('Failed to update configuration');
      }
    } catch (error) {
      setError(language === 'fr' ? 'Échec de la mise à jour' : 'Update failed');
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
        setSuccessMessage(language === 'fr' ? 'Horaire mis à jour' : 'Schedule updated');
        fetchDailyStatus();
      } else {
        throw new Error('Failed to update schedule');
      }
    } catch (error) {
      setError(language === 'fr' ? 'Échec de la mise à jour' : 'Update failed');
    } finally {
      setUpdatingDailySchedule(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
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
        setSuccessMessage(language === 'fr' ? 'Configuration horaire mise à jour' : 'Hourly config updated');
        fetchHourlyStatus();
      } else {
        throw new Error('Failed to update hourly configuration');
      }
    } catch (error) {
      setError(language === 'fr' ? 'Échec de la mise à jour' : 'Update failed');
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
        setSuccessMessage(language === 'fr' ? 'Horaire horaire mis à jour' : 'Hourly schedule updated');
        fetchHourlyStatus();
      } else {
        throw new Error('Failed to update hourly schedule');
      }
    } catch (error) {
      setError(language === 'fr' ? 'Échec de la mise à jour' : 'Update failed');
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
        setSuccessMessage(language === 'fr' ? 'Scraper manuel démarré' : 'Manual scraper started');
      } else {
        throw new Error('Failed to run manual script');
      }
    } catch (error) {
      setError(language === 'fr' ? 'Échec du scraper manuel' : 'Manual scraper failed');
    } finally {
      setRunningManualScript(false);
      setTimeout(() => { setSuccessMessage(null); setError(null); }, 3000);
    }
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 p-4">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <CogIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'fr' ? 'Gestion des Scrapers' : 'Scraper Management'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'fr' ? 'Contrôlez vos services de scraping' : 'Control your scraping services'}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/tickers"
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
          >
            <TagIcon className="h-4 w-4" />
            {language === 'fr' ? 'Portfolio' : 'Portfolio'}
          </Link>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">{successMessage}</span>
        </div>
      )}

      {/* Modern Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Daily Scraper Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-600 rounded-lg">
                  <ClockIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {language === 'fr' ? 'Quotidien' : 'Daily'}
                </h3>
              </div>
              <button
                onClick={fetchDailyStatus}
                disabled={dailyLoading}
                className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${dailyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    dailyStatus?.service_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Service</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {dailyStatus?.service_status || 'Unknown'}
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    dailyStatus?.timer_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Timer</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {dailyStatus?.timer_status || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Current Script */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                {language === 'fr' ? 'Script Actuel' : 'Current Script'}
              </div>
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                {dailyStatus?.current_script || 'None'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'fr' ? 'Dernière: ' : 'Last: '}{dailyStatus?.last_run || 'Never'}
              </div>
            </div>

            {/* Script Selection */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {language === 'fr' ? 'Configuration' : 'Configuration'}
              </div>
              <div className="space-y-1">
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dailyScript"
                    value="run_sequential_scraping"
                    checked={selectedScript === 'run_sequential_scraping'}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="mr-2 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Sequential</div>
                    <div className="text-xs text-gray-500">Full scraping</div>
                  </div>
                </label>
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer">
                  <input
                    type="radio"
                    name="dailyScript"
                    value="scrape_all_active_ticker"
                    checked={selectedScript === 'scrape_all_active_ticker'}
                    onChange={(e) => setSelectedScript(e.target.value)}
                    className="mr-2 text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Active Tickers</div>
                    <div className="text-xs text-gray-500">Fresh data only</div>
                  </div>
                </label>
              </div>
              <button
                onClick={updateDailyConfig}
                disabled={updatingConfig}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {updatingConfig && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour' : 'Update'}
              </button>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {language === 'fr' ? 'Horaire' : 'Schedule'}
              </div>
              <select
                value={dailySchedule}
                onChange={(e) => setDailySchedule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="daily">{language === 'fr' ? 'Quotidien' : 'Daily'}</option>
                <option value="*-*-* 06:00:00">6:00 AM</option>
                <option value="*-*-* 18:00:00">6:00 PM</option>
                <option value="custom">{language === 'fr' ? 'Personnalisé' : 'Custom'}</option>
              </select>
              
              {dailySchedule === 'custom' && (
                <input
                  type="text"
                  value={customSchedule}
                  onChange={(e) => setCustomSchedule(e.target.value)}
                  placeholder="*-*-* HH:MM:SS"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
                />
              )}
              
              <button
                onClick={updateDailySchedule}
                disabled={updatingDailySchedule}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {updatingDailySchedule && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Programmer' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>

        {/* Hourly Scraper Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-600 rounded-lg">
                  <ClockIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {language === 'fr' ? 'Horaire' : 'Hourly'}
                </h3>
              </div>
              <button
                onClick={fetchHourlyStatus}
                disabled={hourlyLoading}
                className="p-1 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowPathIcon className={`h-4 w-4 ${hourlyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    hourlyStatus?.service_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Service</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {hourlyStatus?.service_status || 'Unknown'}
                </span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${
                    hourlyStatus?.timer_status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Timer</span>
                </div>
                <span className="text-sm font-medium capitalize">
                  {hourlyStatus?.timer_status || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Current Script */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                {language === 'fr' ? 'Script Actuel' : 'Current Script'}
              </div>
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                {hourlyStatus?.current_script || 'None'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'fr' ? 'Dernière: ' : 'Last: '}{hourlyStatus?.last_run || 'Never'}
              </div>
            </div>

            {/* Script Selection */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {language === 'fr' ? 'Configuration' : 'Configuration'}
              </div>
              <div className="space-y-1">
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="hourlyScript"
                    value="hourly_scraping"
                    checked={selectedHourlyScript === 'hourly_scraping'}
                    onChange={(e) => setSelectedHourlyScript(e.target.value)}
                    className="mr-2 text-purple-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Full Hourly</div>
                    <div className="text-xs text-gray-500">Complete scraping</div>
                  </div>
                </label>
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-purple-300 cursor-pointer">
                  <input
                    type="radio"
                    name="hourlyScript"
                    value="scrape_all_active_ticker_hourly"
                    checked={selectedHourlyScript === 'scrape_all_active_ticker_hourly'}
                    onChange={(e) => setSelectedHourlyScript(e.target.value)}
                    className="mr-2 text-purple-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Active Hourly</div>
                    <div className="text-xs text-gray-500">Reuse Rule1 data</div>
                  </div>
                </label>
              </div>
              <button
                onClick={updateHourlyConfig}
                disabled={updatingHourlyConfig}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {updatingHourlyConfig && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Mettre à jour' : 'Update'}
              </button>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {language === 'fr' ? 'Horaire' : 'Schedule'}
              </div>
              <select
                value={hourlySchedule}
                onChange={(e) => setHourlySchedule(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
              >
                <option value="*-*-* *:05:00">:05 minutes</option>
                <option value="*-*-* *:15:00">:15 minutes</option>
                <option value="*-*-* *:30:00">:30 minutes</option>
                <option value="custom">{language === 'fr' ? 'Personnalisé' : 'Custom'}</option>
              </select>
              
              {hourlySchedule === 'custom' && (
                <input
                  type="text"
                  value={customHourlySchedule}
                  onChange={(e) => setCustomHourlySchedule(e.target.value)}
                  placeholder="*-*-* *:MM:SS"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 font-mono text-sm"
                />
              )}
              
              <button
                onClick={updateHourlySchedule}
                disabled={updatingHourlySchedule}
                className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                {updatingHourlySchedule && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                {language === 'fr' ? 'Programmer' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>

        {/* Manual Scraper Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-orange-600 rounded-lg">
                <PlayIcon className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {language === 'fr' ? 'Manuel' : 'Manual'}
              </h3>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Info */}
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                {language === 'fr' ? 'Exécution Immédiate' : 'Immediate Execution'}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">
                {language === 'fr' ? 'Démarrer manuellement un scraper' : 'Start a scraper manually'}
              </div>
            </div>

            {/* Script Selection */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {language === 'fr' ? 'Sélection du Script' : 'Script Selection'}
              </div>
              <div className="space-y-1">
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-orange-300 cursor-pointer">
                  <input
                    type="radio"
                    name="manualScript"
                    value="run_sequential_scraping"
                    checked={selectedManualScript === 'run_sequential_scraping'}
                    onChange={(e) => setSelectedManualScript(e.target.value)}
                    className="mr-2 text-orange-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Sequential</div>
                    <div className="text-xs text-gray-500">Fresh Rule1 data</div>
                  </div>
                </label>
                <label className="flex items-center p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:border-orange-300 cursor-pointer">
                  <input
                    type="radio"
                    name="manualScript"
                    value="scrape_all_active_ticker"
                    checked={selectedManualScript === 'scrape_all_active_ticker'}
                    onChange={(e) => setSelectedManualScript(e.target.value)}
                    className="mr-2 text-orange-600"
                  />
                  <div>
                    <div className="text-sm font-medium">Active Tickers</div>
                    <div className="text-xs text-gray-500">Reuse Rule1 data</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={runManualScript}
              disabled={runningManualScript}
              className={`w-full px-4 py-3 rounded-lg transition-all flex items-center justify-center gap-2 font-medium ${
                runningManualScript
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
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
                  {language === 'fr' ? 'Exécuter' : 'Run Now'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex items-center gap-3 mb-3">
          <ChartBarIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Aperçu Rapide' : 'Quick Overview'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dailyStatus?.service_status === 'active' ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Scraper Quotidien' : 'Daily Scraper'}
            </div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {hourlyStatus?.service_status === 'active' ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Scraper Horaire' : 'Hourly Scraper'}
            </div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">⚡</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' ? 'Manuel Disponible' : 'Manual Available'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { StockChange, fetchRecentChangesAll } from '@/app/lib/data';
import StockBarChart from './StockBarChart';
import StockChangeTable from './StockChangeTable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useSettings } from '@/app/contexts/settings-context';

const metrics = ['sentiment_score', 'signal_score', 'pe', 'buy_price'];

export default function StockChangesView() {
  const { t } = useSettings();
  const [metric, setMetric] = useState('sentiment_score');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [threshold, setThreshold] = useState(5);
  const [data, setData] = useState<StockChange[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const format = (d: Date) => d.toISOString().split('T')[0];
        const changes = await fetchRecentChangesAll(metric, format(startDate), format(endDate), threshold);
        setData(changes);
      } catch (error) {
        console.error('Error loading changes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [metric, startDate, endDate, threshold]);

  const topGainers = data
    .filter(d => d.change_percent > 0)
    .sort((a, b) => b.change_percent - a.change_percent)
    .slice(0, 5);

  const topLosers = data
    .filter(d => d.change_percent < 0)
    .sort((a, b) => a.change_percent - b.change_percent)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">{t('stockScreener')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('trackStockMetricChanges')}</p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('metric')}</label>
            <select
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              value={metric}
              onChange={e => setMetric(e.target.value)}
            >
              {metrics.map(m => (
                <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('startDate')}</label>
            <DatePicker
              selected={startDate}
              onChange={(d: Date) => setStartDate(d)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('endDate')}</label>
            <DatePicker
              selected={endDate}
              onChange={(d: Date) => setEndDate(d)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{t('threshold')} (%)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
          <button 
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-medium rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            onClick={() => {
              const format = (d: Date) => d.toISOString().split('T')[0];
              fetchRecentChangesAll(metric, format(startDate), format(endDate), threshold)
                .then(changes => setData(changes))
                .catch(error => console.error('Error refreshing data:', error));
            }}
          >
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalChanges')}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{data.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('positive')}</p>
          <p className="text-2xl font-bold mt-1 text-green-600 dark:text-green-400">{data.filter(d => d.change_percent > 0).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('negative')}</p>
          <p className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{data.filter(d => d.change_percent < 0).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('average')}</p>
          <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">
            {data.length > 0 ? 
              (data.reduce((sum, item) => sum + item.change_percent, 0) / data.length).toFixed(2) + '%' : 
              '0%'}
          </p>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StockBarChart title={t('topGainers')} data={topGainers} />
          <StockChangeTable title={t('gainers')} rows={topGainers} />
        </div>
        <div className="space-y-6">
          <StockBarChart title={t('topLosers')} data={topLosers} />
          <StockChangeTable title={t('losers')} rows={topLosers} />
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 dark:bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-6 rounded-2xl flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black dark:border-white border-t-transparent"></div>
            <p className="font-medium text-gray-900 dark:text-white">{t('loading')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

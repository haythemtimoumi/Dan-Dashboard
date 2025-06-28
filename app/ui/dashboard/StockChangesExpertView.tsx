'use client';

import { useEffect, useState } from 'react';
import { StockChange, fetchRecentChangesAll } from '@/app/lib/data';
import StockBarChart from './StockBarChart';
import StockChangeTable from './StockChangeTable';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const metrics = ['sentiment_score', 'signal_score', 'pe', 'buy_price'];

export default function StockChangesView() {
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
    <div className="space-y-10">
      {/* Header Title with gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">📊 Metric Movements Dashboard</h1>
        <p className="mt-2 opacity-90">Track and analyze stock metric changes across your portfolio</p>
      </div>

      {/* Controls with improved styling */}
      <div className="sticky top-2 z-10 bg-white/90 backdrop-blur-md rounded-xl border border-gray-200 p-5 shadow-lg flex flex-wrap items-center gap-6">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Metric</label>
          <select
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            value={metric}
            onChange={e => setMetric(e.target.value)}
          >
            {metrics.map(m => (
              <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(d: Date) => setStartDate(d)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(d: Date) => setEndDate(d)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Threshold (%)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="w-28 px-4 py-2.5 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>
        <div className="flex items-end">
          <button 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={() => {
              const format = (d: Date) => d.toISOString().split('T')[0];
              fetchRecentChangesAll(metric, format(startDate), format(endDate), threshold)
                .then(changes => setData(changes))
                .catch(error => console.error('Error refreshing data:', error));
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">
          <p className="text-sm font-medium text-gray-500">Total Changes</p>
          <p className="text-2xl font-bold mt-1">{data.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">
          <p className="text-sm font-medium text-gray-500">Positive Changes</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{data.filter(d => d.change_percent > 0).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-red-500">
          <p className="text-sm font-medium text-gray-500">Negative Changes</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{data.filter(d => d.change_percent < 0).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">
          <p className="text-sm font-medium text-gray-500">Average Change</p>
          <p className="text-2xl font-bold mt-1">
            {data.length > 0 ? 
              (data.reduce((sum, item) => sum + item.change_percent, 0) / data.length).toFixed(2) + '%' : 
              '0%'}
          </p>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <StockBarChart title="📈 Top Gainers" data={topGainers} />
          <StockChangeTable title="Top Gainers Details" rows={topGainers} />
        </div>
        <div className="space-y-6">
          <StockBarChart title="📉 Top Losers" data={topLosers} />
          <StockChangeTable title="Top Losers Details" rows={topLosers} />
        </div>
      </div>

      {/* Placeholder for future sections with improved styling */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-8 text-center shadow-md border border-blue-100">
        <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">More Insights Coming Soon</h3>
        <p className="text-gray-600">We&apos;re working on additional analytics and visualization features to help you make better investment decisions.</p>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-700 font-medium">Loading data...</p>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-black">StockScreener</h1>
        <p className="text-gray-600 mt-1">Track stock metric changes</p>
      </div>

      {/* Controls */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Metric</label>
            <select
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-black transition-colors"
              value={metric}
              onChange={e => setMetric(e.target.value)}
            >
              {metrics.map(m => (
                <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(d: Date) => setStartDate(d)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-black transition-colors"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(d: Date) => setEndDate(d)}
              className="px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-black transition-colors"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Threshold (%)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-24 px-3 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <button 
            className="px-4 py-2 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            onClick={() => {
              const format = (d: Date) => d.toISOString().split('T')[0];
              fetchRecentChangesAll(metric, format(startDate), format(endDate), threshold)
                .then(changes => setData(changes))
                .catch(error => console.error('Error refreshing data:', error));
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-600">Total Changes</p>
          <p className="text-2xl font-bold mt-1">{data.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-600">Positive</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{data.filter(d => d.change_percent > 0).length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-600">Negative</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{data.filter(d => d.change_percent < 0).length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4">
          <p className="text-sm text-gray-600">Average</p>
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
          <StockBarChart title="Top Gainers" data={topGainers} />
          <StockChangeTable title="Gainers" rows={topGainers} />
        </div>
        <div className="space-y-6">
          <StockBarChart title="Top Losers" data={topLosers} />
          <StockChangeTable title="Losers" rows={topLosers} />
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
            <p className="font-medium">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}

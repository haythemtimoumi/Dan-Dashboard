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
      {/* Header Title */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2">📊 Metric Movements Dashboard</h1>

      {/* Controls */}
      <div className="sticky top-2 z-10 bg-white/70 backdrop-blur-md rounded-xl border p-4 shadow-md flex flex-wrap items-center gap-4">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Metric</label>
          <select
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={metric}
            onChange={e => setMetric(e.target.value)}
          >
            {metrics.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(d: Date) => setStartDate(d)}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(d: Date) => setEndDate(d)}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-600">Threshold (%)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="mt-1 w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <StockBarChart title="📈 Top Gainers" data={topGainers} />
          <StockChangeTable title="Top Gainers Table" rows={topGainers} />
        </div>
        <div className="space-y-4">
          <StockBarChart title="📉 Top Losers" data={topLosers} />
          <StockChangeTable title="Top Losers Table" rows={topLosers} />
        </div>
      </div>

      {/* Placeholder for future sections */}
      <div className="border rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500 shadow-sm">
        🚧 More insights and analytics coming soon below...
      </div>
    </div>
  );
}

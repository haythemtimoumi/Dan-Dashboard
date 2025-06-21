'use client';

import { useEffect, useState } from 'react';
import { StockChange, fetchRecentChangesAll } from '@/app/lib/data';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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

  const topChanges = data
    .filter(d => !isNaN(d.change_percent))
    .sort((a, b) => Math.abs(b.change_percent) - Math.abs(a.change_percent))
    .slice(0, 10);

  const chartData = {
    labels: topChanges.map(d => d.ticker.toUpperCase()),
    datasets: [
      {
        label: 'Change %',
        data: topChanges.map(d => d.change_percent),
        backgroundColor: topChanges.map(d => d.change_percent >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-4 rounded-xl shadow-sm">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">Metric</label>
          <select
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={metric}
            onChange={e => setMetric(e.target.value)}
          >
            {metrics.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(d: Date) => setStartDate(d)}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(d: Date) => setEndDate(d)}
            className="mt-1 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            dateFormat="yyyy-MM-dd"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-600">Threshold (%)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="mt-1 w-24 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 10 Movers by % Change</h2>
        {topChanges.length === 0 ? (
          <p className="text-sm text-gray-500">No significant changes found for the selected range.</p>
        ) : (
          <Bar data={chartData} options={{ responsive: true }} />
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Detailed Changes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-gray-500">No data found for this selection.</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-3 text-left">Ticker</th>
                <th className="p-3 text-left">Source</th>
                <th className="p-3 text-left">Guru</th>
                <th className="p-3 text-right">Start</th>
                <th className="p-3 text-right">End</th>
                <th className="p-3 text-right">Change %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold text-blue-700">{row.ticker.toUpperCase()}</td>
                  <td className="p-3">{row.source}</td>
                  <td className="p-3">{row.guru}</td>
                  <td className="p-3 text-right">{row.start_value}</td>
                  <td className="p-3 text-right">{row.end_value}</td>
                  <td className={`p-3 text-right font-bold ${row.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.change_percent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
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
        backgroundColor: topChanges.map(d => d.change_percent >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'),
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium">
          Metric:
          <select
            className="ml-2 px-2 py-1 border rounded"
            value={metric}
            onChange={e => setMetric(e.target.value)}
          >
            {metrics.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Start Date:
          <DatePicker
            selected={startDate}
            onChange={(d: Date) => setStartDate(d)}
            className="ml-2 px-2 py-1 border rounded"
            dateFormat="yyyy-MM-dd"
          />
        </label>
        <label className="text-sm font-medium">
          End Date:
          <DatePicker
            selected={endDate}
            onChange={(d: Date) => setEndDate(d)}
            className="ml-2 px-2 py-1 border rounded"
            dateFormat="yyyy-MM-dd"
          />
        </label>
        <label className="text-sm font-medium">
          Threshold (%):
          <input
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={e => setThreshold(Number(e.target.value))}
            className="ml-2 w-20 px-2 py-1 border rounded"
          />
        </label>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-md font-semibold mb-2">Top 10 Movers by % Change</h2>
        {topChanges.length === 0 ? (
          <p className="text-sm text-gray-500">No significant changes found for the selected range.</p>
        ) : (
          <Bar data={chartData} options={{ responsive: true }} />
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto bg-white p-4 rounded shadow">
        <h2 className="text-md font-semibold mb-2">Detailed Changes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-gray-500">No data found for this selection.</p>
        ) : (
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b">
                <th className="p-2">Ticker</th>
                <th className="p-2">Source</th>
                <th className="p-2">Guru</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Change %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b"
                >
                  <td className="p-2 font-bold">{row.ticker.toUpperCase()}</td>
                  <td className="p-2">{row.source}</td>
                  <td className="p-2">{row.guru}</td>
                  <td className="p-2">{row.start_value}</td>
                  <td className="p-2">{row.end_value}</td>
                  <td className={`p-2 font-semibold ${row.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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

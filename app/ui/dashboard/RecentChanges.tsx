'use client';

import { useEffect, useState } from 'react';
import { fetchRecentChangesAll } from '@/app/lib/data';
import { StockChange } from '@/app/lib/definitions';

export default function RecentChanges() {
  const [data, setData] = useState<StockChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('sentiment_score');

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const formatDate = (d: Date) =>
      d.toISOString().split('T')[0]; // YYYY-MM-DD

    fetchRecentChangesAll(metric, formatDate(yesterday), formatDate(today), 5)
      .then(setData)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [metric]);

  if (loading) return <div className="text-sm text-gray-500">Loading recent changes...</div>;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Recent Changes ({metric})</h2>
      <select
        className="mb-4 px-2 py-1 border rounded"
        value={metric}
        onChange={e => setMetric(e.target.value)}
      >
        <option value="sentiment_score">Sentiment Score</option>
        <option value="signal_score">Signal Score</option>
        <option value="pe">P/E</option>
        <option value="buy_price">Buy Price</option>
      </select>
      <div className="overflow-auto max-h-[300px] border rounded p-2">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="border-b">
              <th className="p-1">Ticker</th>
              <th className="p-1">Source</th>
              <th className="p-1">Guru</th>
              <th className="p-1">Start</th>
              <th className="p-1">End</th>
              <th className="p-1">Change %</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-1 font-bold">{row.ticker.toUpperCase()}</td>
                <td className="p-1">{row.source}</td>
                <td className="p-1">{row.guru}</td>
                <td className="p-1">{row.start_value}</td>
                <td className="p-1">{row.end_value}</td>
                <td className="p-1">{row.change_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

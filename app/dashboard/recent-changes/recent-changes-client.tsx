// File: app/dashboard/recent-changes/recent-changes-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { fetchRecentChanges } from '@/app/lib/data';
import { StockChange } from '@/app/lib/definitions';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

export default function RecentChangesClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const [metric, setMetric] = useState(searchParams.get('metric') || 'sentiment_score');
  const [startDate, setStartDate] = useState<Date | null>(
    searchParams.get('start_date') ? new Date(searchParams.get('start_date')!) : sevenDaysAgo
  );
  const [endDate, setEndDate] = useState<Date | null>(
    searchParams.get('end_date') ? new Date(searchParams.get('end_date')!) : today
  );
  const [threshold, setThreshold] = useState(
    searchParams.get('threshold') ? parseFloat(searchParams.get('threshold')!) : 5
  );
  const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [guru, setGuru] = useState(searchParams.get('guru') || '');

  const [changes, setChanges] = useState<StockChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!startDate || !endDate || !metric) {
      setError('Please select a metric, start date, and end date');
      return;
    }

    if (startDate > endDate) {
      setError('Start date must be before end date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const data = await fetchRecentChanges(
        metric,
        formattedStartDate,
        formattedEndDate,
        threshold,
        ticker || undefined,
        source || undefined,
        guru || undefined
      );

      setChanges(data);
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (metric) params.set('metric', metric);
    if (startDate) params.set('start_date', format(startDate, 'yyyy-MM-dd'));
    if (endDate) params.set('end_date', format(endDate, 'yyyy-MM-dd'));
    params.set('threshold', threshold.toString());
    if (ticker) params.set('ticker', ticker);
    if (source) params.set('source', source);
    if (guru) params.set('guru', guru);
    replace(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSearchParams();
    fetchData();
  };

  useEffect(() => {
    if (searchParams.get('metric') && searchParams.get('start_date') && searchParams.get('end_date')) {
      fetchData();
    }
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-8 rounded-md bg-gray-50 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="metric" className="block text-sm font-medium">Metric</label>
            <select
              id="metric"
              className="mt-1 block w-full rounded-md border px-3 py-2"
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              required
            >
              <option value="sentiment_score">Sentiment Score</option>
              <option value="signal_score">Signal Score</option>
              <option value="pe">PE Ratio</option>
              <option value="buy_price">Buy Price</option>
            </select>
          </div>

          <div>
            <label htmlFor="start_date" className="block text-sm font-medium">Start Date</label>
            <DatePicker
              id="start_date"
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              dateFormat="yyyy-MM-dd"
              required
            />
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium">End Date</label>
            <DatePicker
              id="end_date"
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              dateFormat="yyyy-MM-dd"
              required
            />
          </div>

          <div>
            <label htmlFor="threshold" className="block text-sm font-medium">Minimum % Change</label>
            <div className="flex items-center">
              <input
                type="range"
                id="threshold"
                min="0"
                max="50"
                step="1"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <span className="ml-2 text-sm">{threshold}%</span>
            </div>
          </div>

          <div>
            <label htmlFor="ticker" className="block text-sm font-medium">Ticker</label>
            <input
              type="text"
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              placeholder="e.g. AAPL"
            />
          </div>

          <div>
            <label htmlFor="source" className="block text-sm font-medium">Source</label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
            >
              <option value="">All Sources</option>
              <option value="Rule1">Rule1</option>
              <option value="MagicFormula">Magic Formula</option>
            </select>
          </div>

          <div>
            <label htmlFor="guru" className="block text-sm font-medium">Guru</label>
            <input
              type="text"
              id="guru"
              value={guru}
              onChange={(e) => setGuru(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2"
              placeholder="e.g. Warren Buffett"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
        </div>
      </form>

      {error && <div className="mb-4 rounded-md bg-red-100 p-4 text-red-700">{error}</div>}

      {changes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Ticker</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Guru</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Metric</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">% Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {changes.map((change, idx) => (
                <tr key={`${change.ticker}-${idx}`}>
                  <td className="px-6 py-4 text-sm text-gray-900">{change.ticker}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{change.source}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{change.guru}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{change.metric}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{change.start_value}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{change.end_value}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${change.change_percent > 0 ? 'text-green-600' : change.change_percent < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                    <div className="flex items-center">
                      {change.change_percent > 0 ? <ArrowUpIcon className="mr-1 h-4 w-4" /> : change.change_percent < 0 ? <ArrowDownIcon className="mr-1 h-4 w-4" /> : null}
                      {change.change_percent > 0 ? '+' : ''}{change.change_percent}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {change.status === 'complete' ? '✅ complete' : `⚠️ ${change.status}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && !error ? (
        <div className="rounded-md bg-gray-50 p-4 text-center text-gray-500">
          No significant changes found for the selected filters.
        </div>
      ) : null}
    </div>
  );
}

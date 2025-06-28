'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { lusitana } from '@/app/ui/fonts';
import { fetchStockHistory } from '@/app/lib/data';
import { formatDate } from '@/app/lib/utils';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type DateRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// Define the StockHistory type to match the API response
interface StockHistory {
  id: string | number;
  date: string;
  ticker: string;
  source: string;
  pe: number;
  dividend: string | null;
  cash_per_share: string;
  current_ratio: number;
  signal_score: number;
  sentiment_score: number;
  screenshot: string;
  guru: string;
  rule1_score: number | null;
  moat_score: number | null;
  management_score: number | null;
  buy_price: string;
  created_at?: string; // For backward compatibility
}

export default function StockHistoryChart({ stockId }: { stockId: string }) {
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'sentiment_score' | 'signal_score' | 'pe' | 'buy_price' | 'current_ratio'>('sentiment_score');
  const [dateRange, setDateRange] = useState<DateRange>('1W'); // Default to 1W
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: [],
  });

  // Function to calculate the from date based on the selected range
  const getFromDate = (range: DateRange): string | undefined => {
    if (range === 'ALL') return undefined;
    
    const today = new Date();
    let fromDate = new Date();
    
    switch (range) {
      case '1W':
        fromDate.setDate(today.getDate() - 7); // 7 days before today
        break;
      case '1M':
        fromDate.setMonth(today.getMonth() - 1);
        break;
      case '3M':
        fromDate.setMonth(today.getMonth() - 3);
        break;
      case '6M':
        fromDate.setMonth(today.getMonth() - 6);
        break;
      case '1Y':
        fromDate.setFullYear(today.getFullYear() - 1);
        break;
    }
    
    return fromDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Load stock history data
  useEffect(() => {
    const loadStockHistory = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const fromDate = getFromDate(dateRange);
        const toDate = getTodayDate(); // Today's date
        const history = await fetchStockHistory(stockId, fromDate, toDate);
        setStockHistory(history as unknown as StockHistory[]);
      } catch (err) {
        console.error('Failed to load stock history:', err);
        setError('Failed to load stock history data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadStockHistory();
  }, [stockId, dateRange]);

  // Prepare chart data when stock history or selected metric changes
  useEffect(() => {
    if (stockHistory.length === 0) return;

    const metricLabels: Record<string, string> = {
      sentiment_score: 'Sentiment Score',
      signal_score: 'Signal Score',
      pe: 'Percentage Upside',
      buy_price: 'Sticker Price',
      current_ratio: 'Last Price'
    };

    const metricColors: Record<string, { bg: string, border: string }> = {
      sentiment_score: { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
      signal_score: { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
      pe: { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
      buy_price: { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
      current_ratio: { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' }
    };

    // Extract the data for the selected metric
    const metricData = stockHistory.map(stock => {
      if (selectedMetric === 'buy_price') {
        // Convert string buy_price to number
        return parseFloat(stock.buy_price);
      }
      return stock[selectedMetric];
    });

    const data = {
      labels: stockHistory.map(stock => formatDate(stock.date || stock.created_at)),
      datasets: [
        {
          label: metricLabels[selectedMetric],
          data: metricData,
          backgroundColor: metricColors[selectedMetric].bg,
          borderColor: metricColors[selectedMetric].border,
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5,
        },
      ],
    };

    setChartData(data);
  }, [stockHistory, selectedMetric]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Stock Performance History - ${selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            if (selectedMetric === 'buy_price') {
              return `${context.dataset.label}: $${value.toFixed(2)}`;
            }
            return `${context.dataset.label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: selectedMetric !== 'buy_price',
        title: {
          display: true,
          text: selectedMetric === 'buy_price' ? 'Price ($)' : selectedMetric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className={`${lusitana.className} text-lg font-semibold text-gray-900 mb-4`}>
            Stock Performance History
          </h2>
          <div className="bg-gray-50 p-4 rounded-md h-80 flex items-center justify-center">
            <div className="text-gray-500">Loading chart data...</div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className={`${lusitana.className} text-lg font-semibold text-gray-900 mb-4`}>
            Stock Performance History
          </h2>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className={`${lusitana.className} text-lg font-semibold text-gray-900`}>
            Stock Performance History
          </h2>
          
          <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
            {/* Metric selector */}
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="rounded-md border-gray-300 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="sentiment_score">Sentiment Score</option>
              <option value="signal_score">Signal Score</option>
              <option value="pe">Percentage Upside</option>
              <option value="buy_price">Sticker Price</option>
              <option value="current_ratio">Last Price</option>
            </select>
          </div>
        </div>
        
        {/* Date range quick filters */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {(['1W', '1M', '3M', '6M', '1Y', 'ALL'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart or No Data message */}
        <div className="bg-gray-50 p-4 rounded-md">
          {stockHistory.length === 0 ? (
            <div className="h-80 w-full flex items-center justify-center">
              <div className="text-gray-500 text-center">
                <p className="text-lg font-medium">No data for this time range.</p>
                <p className="mt-2">Try selecting a different time period.</p>
              </div>
            </div>
          ) : (
            <div className="h-80 w-full">
              <Line options={options} data={chartData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
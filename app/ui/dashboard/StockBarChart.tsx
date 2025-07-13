'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

export default function StockBarChart({
  title,
  data,
}: {
  title: string;
  data: {
    ticker: string;
    change_percent: number;
  }[];
}) {
  const chartData = {
    labels: data.map((d) => d.ticker.toUpperCase()),
    datasets: [
      {
        label: 'Change %',
        data: data.map((d) => d.change_percent),
        backgroundColor: data.map((d) =>
          d.change_percent >= 0 ? '#000000' : '#ef4444'
        ),
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (items: any) => items[0].label,
          label: (context: any) => {
            const value = context.parsed.y;
            return `Change: ${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
          }
        }
      },
      datalabels: {
        color: (context: any) => {
          const value = context.dataset.data[context.dataIndex];
          return value >= 0 ? '#065f46' : '#991b1b';
        },
        anchor: 'end',
        align: 'top',
        formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
        font: {
          weight: 'bold',
          size: 12
        },
        textStrokeColor: 'white',
        textStrokeWidth: 3,
        borderRadius: 4,
        padding: 6
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.15)',
          drawBorder: false
        },
        ticks: {
          color: '#555',
          font: { size: 11 },
          padding: 8,
          callback: (value: number) => `${value}%`
        },
        border: {
          dash: [4, 4]
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#555',
          font: { size: 11, weight: 'bold' },
          padding: 8
        }
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-black dark:text-white">{title}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">{data.length}</span>
      </div>
      <div className="h-64">
        {data.length > 0 ? (
          <Bar data={chartData} options={options as any} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500">No data</p>
          </div>
        )}
      </div>
    </div>
  );
}

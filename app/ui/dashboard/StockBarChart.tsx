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
          d.change_percent >= 0 ? 'rgba(16,185,129,0.85)' : 'rgba(239,68,68,0.85)'
        ),
        borderWidth: 1,
        borderColor: data.map((d) =>
          d.change_percent >= 0 ? 'rgba(5,150,105,1)' : 'rgba(220,38,38,1)'
        ),
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: data.map((d) =>
          d.change_percent >= 0 ? 'rgba(16,185,129,1)' : 'rgba(239,68,68,1)'
        ),
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
    <div className="rounded-xl shadow-lg bg-white p-5 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="mr-2">{title}</span>
        <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {data.length} stocks
        </span>
      </h3>
      <div className="h-64">
        {data.length > 0 ? (
          <Bar data={chartData} options={options as any} />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

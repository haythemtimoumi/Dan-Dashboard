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
          d.change_percent >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        color: '#111',
        anchor: 'end',
        align: 'top', // ✅ fixed for type compatibility
        formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
        font: {
          weight: 'bold',
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#555',
        },
      },
      x: {
        ticks: {
          color: '#555',
        },
      },
    },
  };

  return (
    <div className="rounded-xl shadow bg-white p-4">
      <h3 className="text-md font-semibold text-gray-700 mb-3">{title}</h3>
      <Bar data={chartData} options={options as any} />
    </div>
  );
}

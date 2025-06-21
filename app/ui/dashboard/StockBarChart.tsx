import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Props = {
  title: string;
  data: { ticker: string; change_percent: number }[];
};

export default function StockBarChart({ title, data }: Props) {
  const chartData = {
    labels: data.map(d => d.ticker.toUpperCase()),
    datasets: [
      {
        label: 'Change %',
        data: data.map(d => d.change_percent),
        backgroundColor: data.map(d => d.change_percent >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)'),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow w-full">
      <h2 className="text-sm font-medium mb-2">{title}</h2>
      <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  );
}

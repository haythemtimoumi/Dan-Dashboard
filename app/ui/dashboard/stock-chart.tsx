'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { lusitana } from '@/app/ui/fonts';
import { Stock } from '@/app/lib/definitions';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function StockChart({ stocks }: { stocks: Stock[] }) {
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    // Log the number of stocks received for debugging

    
    // The stocks are already sorted by sentiment score in fetchStocksForChart
    // Just make sure we have all stocks and limit to display top 10 for readability
    const topStocks = stocks.slice(0, 10);

    // Prepare data for chart
    const data = {
      labels: topStocks.map(stock => stock.ticker),
      datasets: [
        {
          label: 'Sentiment Score',
          data: topStocks.map(stock => stock.sentiment_score),
          backgroundColor: topStocks.map(stock => 
            stock.highlight ? 'rgba(255, 206, 86, 0.8)' : 'rgba(54, 162, 235, 0.8)'
          ),
          borderColor: topStocks.map(stock => 
            stock.highlight ? 'rgba(255, 206, 86, 1)' : 'rgba(54, 162, 235, 1)'
          ),
          borderWidth: 1,
        },
      ],
    };

    setChartData(data);
  }, [stocks]);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Top 10 Stocks by Sentiment Score',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Score: ${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sentiment Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Stock Ticker'
        }
      }
    }
  };

  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Stock Sentiment Analysis
      </h2>
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="h-80 w-full">
          <Bar options={options} data={chartData} />
        </div>
      </div>
    </div>
  );
}
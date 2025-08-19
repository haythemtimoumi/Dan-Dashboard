'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';
import TradingViewWidget from '@/app/ui/trading-view-widget';

interface Analysis {
  id: number;
  ticker: string;
  full_name: string;
  rule1_score: number;
  moat_score: number;
  management_score: number;
  signal_score: number;
  sentiment_score: number;
  buy_price: string;
  last_price: string;
  long_gr: string;
  last_gr: string;
  pbt: string;
  date: string;
  created_at: string;
}

interface Guru {
  guru_name: string;
  guru_id: number;
  last_action: string;
  per_portfolio: string;
  analyses: Analysis[];
}

interface TickerData {
  ticker: string;
  date: string;
  gurus: Guru[];
}

export default function PortfolioAnalysisDetailPage({ params }: { params: { ticker: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useSettings();
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get('date') || new Date().toISOString().split('T')[0]
  );
  
  const fetchData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/stocks/by-ticker-date?ticker=${params.ticker}&date=${date}`);
      
      if (!response.ok) {
        setError(`No data found for ${params.ticker}`);
        setData(null);
        return;
      }
      
      const tickerStocks = await response.json();
      
      if (!tickerStocks || tickerStocks.length === 0) {
        setError(`No data found for ${params.ticker}`);
        setData(null);
        return;
      }
      
      const guruMap = new Map();
      
      tickerStocks.forEach((stock: any) => {
        const guruName = stock.guru || stock.source || 'portfolio';
        
        if (!guruMap.has(guruName)) {
          guruMap.set(guruName, {
            guru_name: guruName,
            guru_id: Math.random(),
            last_action: stock.last_action || '',
            per_portfolio: stock.per_portfolio || '',
            analyses: []
          });
        }
        guruMap.get(guruName).analyses.push({
          id: stock.id,
          ticker: stock.ticker,
          full_name: stock.full_name,
          rule1_score: stock.rule1_score,
          moat_score: stock.moat_score,
          management_score: stock.management_score,
          signal_score: stock.signal_score,
          sentiment_score: stock.sentiment_score,
          buy_price: stock.buy_price,
          last_price: stock.last_price,
          long_gr: stock.long_gr,
          last_gr: stock.last_gr,
          pbt: stock.pbt,
          date: stock.date || stock.created_at,
          created_at: stock.created_at
        });
      });
      
      const result = {
        ticker: params.ticker,
        date: date,
        gurus: Array.from(guruMap.values())
      };
      
      setData(result);
    } catch (err) {
      console.error('Error fetching ticker data:', err);
      setError('Failed to load ticker data');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData(selectedDate);
  }, [params.ticker, selectedDate]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !data || data.gurus.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{error}</p>
        <Link href="/dashboard/portfolio" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Portfolio
        </Link>
      </div>
    );
  }

  const analysis = data.gurus[0]?.analyses[0];
  const allAnalyses = data.gurus.flatMap(guru => 
    guru.analyses.map(analysis => ({ ...analysis, guru: guru.guru_name }))
  );

  // Get unique monthly metrics (in case they vary)
  const monthlyMetrics = new Map();
  allAnalyses.forEach(item => {
    const key = `${item.rule1_score}-${item.moat_score}-${item.management_score}`;
    if (!monthlyMetrics.has(key)) {
      monthlyMetrics.set(key, {
        rule1_score: item.rule1_score,
        moat_score: item.moat_score,
        management_score: item.management_score,
        buy_price: item.buy_price,
        long_gr: item.long_gr,
        last_gr: item.last_gr,
        pbt: item.pbt,
        guru: item.guru
      });
    }
  });
  
  return (
    <div className="h-screen flex flex-col p-4 gap-4 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Header with Monthly Metrics */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg p-4 shadow-lg border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">{analysis?.ticker}</h1>
              <p className="text-gray-600 dark:text-gray-400">{analysis?.full_name}</p>
            </div>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-700"
          />
        </div>
        
        {/* Monthly Metrics Grid */}
        <div className="space-y-2">
          {Array.from(monthlyMetrics.values()).map((metrics, index) => (
            <div key={index} className="grid grid-cols-4 md:grid-cols-8 gap-4 p-3 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg border border-white/30">
              <div className="text-center">
                <div className="text-xs text-gray-500">Rule1</div>
                <div className={`font-bold text-lg ${
                  metrics.rule1_score >= 70 ? 'text-green-600' :
                  metrics.rule1_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>{metrics.rule1_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Moat</div>
                <div className={`font-bold text-lg ${
                  metrics.moat_score >= 70 ? 'text-green-600' :
                  metrics.moat_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>{metrics.moat_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Mgmt</div>
                <div className={`font-bold text-lg ${
                  metrics.management_score >= 70 ? 'text-green-600' :
                  metrics.management_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                }`}>{metrics.management_score}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Buy Price</div>
                <div className="font-bold text-sm">${parseFloat(metrics.buy_price || '0').toLocaleString()}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">L.Growth</div>
                <div className="font-bold text-sm">{metrics.long_gr}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Growth</div>
                <div className="font-bold text-sm">{metrics.last_gr}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Payback</div>
                <div className="font-bold text-sm">{metrics.pbt}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-500">Guru</div>
                <div className="font-bold text-sm truncate">{metrics.guru}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - 70/30 Split */}
      <div className="flex flex-col lg:flex-row gap-4 h-[500px]">
        {/* Chart - 70% Width - LEFT */}
        <div className="w-full lg:w-[70%] bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg p-4 border border-white/20">
          <h3 className="font-semibold text-sm mb-3">{language === 'fr' ? 'Graphique' : 'Chart'}</h3>
          <div className="h-[450px]">
            <TradingViewWidget ticker={params.ticker} height="450px" />
          </div>
        </div>

        {/* Data Table - 30% Width - RIGHT */}
        <div className="w-full lg:w-[30%] bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-lg shadow-lg p-4 overflow-hidden border border-white/20">
          <h2 className="font-semibold text-sm mb-3">
            {language === 'fr' ? 'Données Quotidiennes' : 'Daily Data'}
          </h2>
          <div className="overflow-auto h-full">
            <table className="w-full text-xs">
              <thead className="bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">{language === 'fr' ? 'Heure' : 'Time'}</th>
                  <th className="px-2 py-2 text-left">{language === 'fr' ? 'Prix' : 'Price'}</th>
                  <th className="px-2 py-2 text-left">Signal</th>
                  <th className="px-2 py-2 text-left">Sentiment</th>
                </tr>
              </thead>
              <tbody>
                {allAnalyses.map((item, index) => (
                  <tr key={index} className="border-b border-white/20 hover:bg-white/30 dark:hover:bg-gray-700/30">
                    <td className="px-2 py-2">
                      {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-2 py-2 font-semibold text-blue-600">${item.last_price}</td>
                    <td className="px-2 py-2">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        item.signal_score >= 70 ? 'bg-green-100/80 text-green-800' :
                        item.signal_score >= 40 ? 'bg-yellow-100/80 text-yellow-800' :
                        'bg-red-100/80 text-red-800'
                      }`}>
                        {item.signal_score}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`px-1 py-0.5 rounded text-xs ${
                        item.sentiment_score >= 70 ? 'bg-green-100/80 text-green-800' :
                        item.sentiment_score >= 40 ? 'bg-yellow-100/80 text-yellow-800' :
                        'bg-red-100/80 text-red-800'
                      }`}>
                        {item.sentiment_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );         
}
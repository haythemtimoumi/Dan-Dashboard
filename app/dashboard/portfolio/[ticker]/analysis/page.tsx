'use client';

import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';

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
  const [isHourly, setIsHourly] = useState<boolean>(false);
  
  const fetchData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, try to get ticker-specific data with date filtering
      const tickerResponse = await fetch(`/api/stocks/ticker/${params.ticker}?date=${date}&hourly=${isHourly}`);
      
      let tickerStocks = [];
      if (tickerResponse.ok) {
        tickerStocks = await tickerResponse.json();
      }
      
      // If no ticker-specific data, fall back to grouped endpoint
      if (!tickerStocks || tickerStocks.length === 0) {
        const groupedResponse = await fetch(`/api/stocks/grouped?startDate=${date}&endDate=${date}`);
        if (groupedResponse.ok) {
          const allStocks = await groupedResponse.json();
          tickerStocks = allStocks.filter((stock: any) => stock.ticker === params.ticker);
        }
      }
      
      if (!tickerStocks || tickerStocks.length === 0) {
        setError(`No data found for ${params.ticker} on ${new Date(date).toLocaleDateString()}`);
        setData(null);
        return;
      }
      
      // Check if this is an hourly ticker (multiple entries for same date)
      const dateGroups = new Map();
      tickerStocks.forEach((stock: any) => {
        const stockDate = (stock.date || stock.created_at).split('T')[0];
        if (!dateGroups.has(stockDate)) {
          dateGroups.set(stockDate, []);
        }
        dateGroups.get(stockDate).push(stock);
      });
      
      const todayEntries = dateGroups.get(date) || [];
      setIsHourly(todayEntries.length > 1);
      
      // Group by guru and create the expected format
      const guruMap = new Map();
      const stocksToProcess = isHourly ? todayEntries : tickerStocks;
      
      stocksToProcess.forEach((stock: any) => {
        // Handle multiple gurus from grouped data
        const gurus = stock.gurus ? stock.gurus.split(', ') : [stock.guru || stock.source || 'portfolio'];
        
        gurus.forEach((guruName: string) => {
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
  
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };
  
  const handlePreviousDay = () => {
    const prevDate = new Date(selectedDate);
    prevDate.setDate(prevDate.getDate() - 1);
    setSelectedDate(prevDate.toISOString().split('T')[0]);
  };
  
  const handleNextDay = () => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const today = new Date().toISOString().split('T')[0];
    const newDate = nextDate.toISOString().split('T')[0];
    if (newDate <= today) {
      setSelectedDate(newDate);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !data || data.gurus.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analysis data available for {params.ticker}</p>
        <Link href="/dashboard/portfolio" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Portfolio
        </Link>
      </div>
    );
  }

  // Create separate rows for each analysis, grouped by exact timestamp
  const allAnalyses: any[] = [];
  
  data.gurus.forEach(guru => {
    guru.analyses.forEach(analysis => {
      const existingAnalysis = allAnalyses.find(item => 
        new Date(item.date).getTime() === new Date(analysis.date).getTime()
      );
      
      if (existingAnalysis) {
        // Same timestamp - add guru to existing row
        existingAnalysis.gurus.push({
          name: guru.guru_name,
          last_action: guru.last_action,
          per_portfolio: guru.per_portfolio
        });
      } else {
        // New timestamp - create new row
        allAnalyses.push({
          ...analysis,
          gurus: [{
            name: guru.guru_name,
            last_action: guru.last_action,
            per_portfolio: guru.per_portfolio
          }]
        });
      }
    });
  });
  
  const sortedAnalyses = allAnalyses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return (
    <main className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/dashboard/portfolio/${params.ticker}?date=${selectedDate}`)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900 dark:text-white`}>
              {params.ticker} {language === 'fr' ? 'Analyse' : 'Analysis'}
            </h1>
            {isHourly && (
              <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full text-xs font-medium">
                {language === 'fr' ? 'Horaire' : 'Hourly'}
              </span>
            )}
          </div>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousDay}
              className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
              title={language === 'fr' ? 'Jour précédent' : 'Previous day'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleNextDay}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              className={`p-2 rounded-lg transition-colors ${
                selectedDate >= new Date().toISOString().split('T')[0]
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'hover:bg-blue-100 dark:hover:bg-blue-800'
              }`}
              title={language === 'fr' ? 'Jour suivant' : 'Next day'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isHourly 
              ? (language === 'fr' ? `Toutes les entrées du ${new Date(selectedDate).toLocaleDateString('fr-FR')}` : `All entries for ${new Date(selectedDate).toLocaleDateString('en-US')}`)
              : (language === 'fr' ? `Données du ${new Date(selectedDate).toLocaleDateString('fr-FR')}` : `Data for ${new Date(selectedDate).toLocaleDateString('en-US')}`)
            }
          </div>
        </div>
      </div>

      {/* Gurus List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Gurus' : 'Gurus'} ({data?.gurus.length || 0})
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            {data.gurus.map((guru) => (
              <div key={guru.guru_id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {guru.guru_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium capitalize text-gray-900">{guru.guru_name}</div>
                    <div className="text-xs text-gray-500">Analyst</div>
                  </div>
                </div>
                <div className="text-right">
                  {guru.last_action && (
                    <div className="text-sm font-medium text-gray-700">{guru.last_action}</div>
                  )}
                  {guru.per_portfolio && (
                    <div className="text-xs text-blue-600 font-semibold">{guru.per_portfolio}% Portfolio</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {isHourly ? (language === 'fr' ? 'Heure' : 'Time') : (language === 'fr' ? 'Date' : 'Date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gurus</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Règle #1' : 'Rule1'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Fossé' : 'Moat'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Gestion' : 'Management'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Signal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Prix Achat' : 'Buy Price'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Prix' : 'Last Price'}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Croissance' : 'Growth'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAnalyses.map((analysis, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {isHourly 
                      ? new Date(analysis.date).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US')
                      : new Date(analysis.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')
                    }
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="space-y-1">
                      {analysis.gurus.map((guru: any, guruIndex: number) => (
                        <div key={guruIndex} className="text-xs bg-blue-100 px-2 py-1 rounded">
                          <div className="font-medium capitalize">{guru.name}</div>
                          {guru.last_action && <div className="text-gray-600">Action: {guru.last_action}</div>}
                          {guru.per_portfolio && <div className="text-gray-600">Portfolio: {guru.per_portfolio}%</div>}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.rule1_score || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.moat_score || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.management_score || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.signal_score || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.buy_price || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    ${analysis.last_price || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {analysis.long_gr ? `${analysis.long_gr}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
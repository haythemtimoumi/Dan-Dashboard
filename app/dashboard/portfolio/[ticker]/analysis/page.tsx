'use client';

import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/app/contexts/settings-context';
import TradingViewWidget from '@/app/ui/trading-view-widget';
import NewsSection from '@/app/ui/news-section';

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
  sticker_price: string;
  per_upside: string;
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
  const [sortBy, setSortBy] = useState<string>(
    searchParams.get('sortBy') || 'per_upside'
  );
  const [sortOrder, setSortOrder] = useState<string>(
    searchParams.get('sortOrder') || 'desc'
  );
  const [isHourly, setIsHourly] = useState<boolean>(false);
  
  const fetchData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use grouped endpoint directly (fast and reliable)
      const groupedResponse = await fetch(`/api/stocks/grouped?startDate=${date}&endDate=${date}`);
      let tickerStocks = [];
      if (groupedResponse.ok) {
        const allStocks = await groupedResponse.json();
        tickerStocks = allStocks.filter((stock: any) => stock.ticker === params.ticker);
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
            sticker_price: stock.sticker_price,
            per_upside: stock.per_upside,
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
    <main className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="lg:col-span-2 space-y-3">
      {/* Compact Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/dashboard/portfolio/${params.ticker}?date=${selectedDate}&sortBy=${sortBy}&sortOrder=${sortOrder}`)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            <h1 className={`${lusitana.className} text-xl font-bold text-gray-900 dark:text-white`}>
              {params.ticker}
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Analyse' : 'Analysis'}
            </span>
            {isHourly && (
              <span className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded text-xs font-medium">
                {language === 'fr' ? 'Horaire' : 'Hourly'}
              </span>
            )}
          </div>
          
          {/* Compact Date Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePreviousDay}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title={language === 'fr' ? 'Jour précédent' : 'Previous day'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleNextDay}
              disabled={selectedDate >= new Date().toISOString().split('T')[0]}
              className={`p-1 rounded transition-colors ${
                selectedDate >= new Date().toISOString().split('T')[0]
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={language === 'fr' ? 'Jour suivant' : 'Next day'}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Compact Gurus Grid */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Analystes' : 'Analysts'} ({data?.gurus.length || 0})
          </h2>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(selectedDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {data.gurus.map((guru) => (
            <div key={guru.guru_id} className="bg-white dark:bg-gray-700 rounded-lg p-2 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {guru.guru_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium capitalize text-gray-900 dark:text-white truncate">{guru.guru_name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {guru.per_portfolio && (
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{guru.per_portfolio}%</span>
                    )}
                    {guru.last_action && (
                      <span className="truncate">{guru.last_action}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TradingView Chart */}
      <TradingViewWidget ticker={params.ticker} height="400px" />

      {/* Compact Analysis Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {language === 'fr' ? 'Données d\'analyse' : 'Analysis Data'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {isHourly ? (language === 'fr' ? 'Heure' : 'Time') : (language === 'fr' ? 'Date' : 'Date')}
                </th>
                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Analystes' : 'Analysts'}
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Signal
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Sentiment' : 'Sentiment'}
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Règle #1' : 'Rule #1'}
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Fossé' : 'Moat'}
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Mgmt' : 'Management'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Prix Achat' : 'Buy Price'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Prix Sticker' : 'Sticker Price'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? '% Hausse' : '% Upside'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Prix' : 'Price'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Croiss. Long' : 'Long Growth'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  {language === 'fr' ? 'Dern. Croiss.' : 'Last Growth'}
                </th>
                <th className="px-2 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  PBT
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedAnalyses.map((analysis, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-2 py-2 text-xs text-gray-900 dark:text-gray-100">
                    {isHourly 
                      ? new Date(analysis.date).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                      : new Date(analysis.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
                    }
                  </td>
                  <td className="px-2 py-2 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {analysis.gurus.map((guru: any, guruIndex: number) => (
                        <span key={guruIndex} className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {guru.name.charAt(0).toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-medium ${
                      analysis.signal_score ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {analysis.signal_score || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-medium ${
                      analysis.sentiment_score ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {analysis.sentiment_score || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-medium ${
                      analysis.rule1_score ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {analysis.rule1_score || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-medium ${
                      analysis.moat_score ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {analysis.moat_score || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-center text-gray-900 dark:text-gray-100">
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-xs font-medium ${
                      analysis.management_score ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {analysis.management_score || '-'}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.buy_price ? `$${parseFloat(analysis.buy_price).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.sticker_price ? `$${parseFloat(analysis.sticker_price).toFixed(2)}` : 
                     analysis.buy_price ? `$${(parseFloat(analysis.buy_price) * 2).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.per_upside ? (
                      <span className={`${parseFloat(analysis.per_upside) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {parseFloat(analysis.per_upside).toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono font-medium">
                    {analysis.last_price ? `$${parseFloat(analysis.last_price).toFixed(2)}` : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.long_gr ? (
                      <span className={`${parseFloat(analysis.long_gr) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {parseFloat(analysis.long_gr).toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.last_gr ? (
                      <span className={`${parseFloat(analysis.last_gr) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {parseFloat(analysis.last_gr).toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-2 py-2 text-xs text-right text-gray-900 dark:text-gray-100 font-mono">
                    {analysis.pbt ? `$${parseFloat(analysis.pbt).toFixed(2)}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </div>
      
      {/* Right sidebar with news */}
      <div className="lg:col-span-1">
        <NewsSection ticker={params.ticker} />
      </div>
    </main>
  );
}
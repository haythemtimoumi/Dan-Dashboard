'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/app/contexts/settings-context';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';

interface Ticker {
  symbol: string;
  scrape_type: string;
  last_act: string | null;
  per_port: number | null;
}

interface Guru {
  guru_id: number;
  guru_name: string;
  tickers: Ticker[];
}

interface StockWithHighlight {
  id: string;
  ticker: string;
  guru?: string;
  signal_score?: any;
  sentiment_score?: any;
  rule1_score?: any;
  moat_score?: any;
  management_score?: any;
  buy_price?: any;
  per_upside?: number;
  last_price?: any;
  date?: string;
  created_at?: string;
  highlight?: boolean;
  target?: boolean;
  color?: string;
  ticker_id?: number;
  per_port?: number | null;
  last_action?: string | null;
}

const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  let num: number;
  if (typeof value === 'string') {
    num = parseFloat(value.replace(/[$,]/g, ''));
  } else {
    num = Number(value);
  }
  if (isNaN(num)) return '-';
  return Math.round(num).toString();
};

const formatBuyPrice = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'string') {
    const cleanValue = value.replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);
    if (isNaN(num)) return '-';
    if (num === 0) return '$0';
    return formatCurrency(num);
  }
  const num = Number(value);
  if (isNaN(num)) return '-';
  if (num === 0) return '$0';
  return formatCurrency(num);
};

const parseNumericValue = (value: any): number => {
  if (value === null || value === undefined || value === '') return -Infinity;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.includes('%')) {
    const num = parseFloat(value.replace('%', ''));
    return isNaN(num) ? -Infinity : num;
  }
  if (typeof value === 'string' && value.includes('$')) {
    const num = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(num) ? -Infinity : num;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/,/g, ''));
    return isNaN(num) ? -Infinity : num;
  }
  return -Infinity;
};

export default function GurusPage() {
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [expandedGuru, setExpandedGuru] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [guruStocks, setGuruStocks] = useState<{[key: number]: StockWithHighlight[]}>({});
  const [loadingStocks, setLoadingStocks] = useState<{[key: number]: boolean}>({});
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const { t, language } = useSettings();
  const router = useRouter();

  useEffect(() => {
    fetchGurus();
    // Fetch last date from API
    const fetchLastDate = async () => {
      try {
        const response = await fetch('/api/proxy/stocks/last-date');
        if (response.ok) {
          const data = await response.json();
          const lastDate = new Date(data.last_date).toISOString().split('T')[0];
          setStartDate(lastDate);
          setEndDate(lastDate);
        } else {
          const today = new Date().toISOString().split('T')[0];
          setStartDate(today);
          setEndDate(today);
        }
      } catch (error) {
        console.error('Error fetching last date:', error);
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
      }
    };
    fetchLastDate();
  }, []);

  const fetchGurus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gurus-with-tickers');
      if (!response.ok) throw new Error('Failed to fetch gurus');
      const data = await response.json();
      setGurus(data);
    } catch (err) {
      setError('Failed to load gurus');
      console.error('Error fetching gurus:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGuruClick = async (guruId: number) => {
    if (expandedGuru === guruId) {
      setExpandedGuru(null);
      return;
    }
    
    setExpandedGuru(guruId);
    
    // Fetch stocks for this guru if not already loaded
    if (!guruStocks[guruId] && startDate && endDate) {
      const guru = gurus.find(g => g.guru_id === guruId);
      if (guru) {
        await fetchGuruStocks(guruId, guru.guru_name);
      }
    }
  };
  
  const fetchGuruStocks = async (guruId: number, guruName: string) => {
    setLoadingStocks(prev => ({ ...prev, [guruId]: true }));
    
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await fetch(`/api/stocks/grouped?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      
      const stocksData = await response.json();
      console.log('Fetched stocks data:', stocksData.length, 'stocks');
      console.log('Looking for guru:', guruName);
      console.log('Sample stock guru fields:', stocksData.slice(0, 10).map((s: any) => ({ ticker: s.ticker, guru: s.guru, gurus: s.gurus })));
      
      // Find stocks that might match this guru
      const potentialMatches = stocksData.filter((s: any) => 
        s.guru && (s.guru.toLowerCase().includes(guruName.toLowerCase()) || 
        (s.gurus && s.gurus.toLowerCase && s.gurus.toLowerCase().includes(guruName.toLowerCase())))
      );
      console.log('Potential matches:', potentialMatches.length, potentialMatches.slice(0, 3).map((s: any) => ({ ticker: s.ticker, guru: s.guru, gurus: s.gurus })));
      
      const guruSpecificStocks = stocksData.filter((stock: any) => {
        // Check if stock has guru data
        const stockGuru = stock.guru || stock.gurus;
        if (!stockGuru) return false;
        
        const guruLower = guruName.toLowerCase();
        const stockGuruLower = stockGuru.toLowerCase();
        
        // Handle exact match (case insensitive)
        if (stockGuruLower === guruLower) return true;
        
        // Handle comma-separated guru lists
        if (stockGuruLower.includes(',')) {
          const gurus = stockGuruLower.split(',').map((g: string) => g.trim());
          return gurus.some((g: string) => g === guruLower || g.includes(guruLower));
        }
        
        // Handle partial matches
        return stockGuruLower.includes(guruLower);
      });
      
      console.log('Filtered stocks for guru:', guruSpecificStocks.length);
      
      setGuruStocks(prev => ({ ...prev, [guruId]: guruSpecificStocks }));
    } catch (error) {
      console.error('Error fetching guru stocks:', error);
    } finally {
      setLoadingStocks(prev => ({ ...prev, [guruId]: false }));
    }
  };

  const handleTickerClick = (ticker: string) => {
    const today = new Date().toISOString().split('T')[0];
    router.push(`/dashboard/portfolio/${ticker}?date=${today}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button 
          onClick={fetchGurus}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const filteredGurus = gurus.filter(guru => 
    guru.guru_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guru.tickers.some(ticker => ticker.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('gurus')}
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredGurus.length} of {gurus.length} {t('gurus').toLowerCase()}
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder={language === 'fr' ? 'Rechercher des gurus ou des tickers...' : 'Search gurus or tickers...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="space-y-4">
        {filteredGurus.map((guru) => (
          <div key={guru.guru_id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleGuruClick(guru.guru_id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {expandedGuru === guru.guru_id ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {guru.guru_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {guru.tickers.length} {t('tickers')}
                  </p>
                </div>
              </div>
            </button>

            {expandedGuru === guru.guru_id && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {loadingStocks[guru.guru_id] ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : guruStocks[guru.guru_id] && guruStocks[guru.guru_id].length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Symbole' : 'Ticker'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Signal' : 'Signal'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Sentiment' : 'Sentiment'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Règle #1' : 'Rule #1'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Fossé' : 'Moat'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Gestion' : 'Management'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Prix Achat' : 'Buy Price'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              % {t('upside')}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Prix' : 'Price'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Croiss. Analyste' : 'Analyst Growth'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Croiss. Composite' : 'Composite Growth'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? 'Dernière Action' : 'Last Action'}
                            </th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              {language === 'fr' ? '% Portfolio' : '% Portfolio'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {guruStocks[guru.guru_id].map((stock) => {
                            const stockColor = stock.color || '';
                            return (
                              <tr
                                key={stock.id}
                                className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                                  stockColor === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                                  stockColor === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                  stockColor === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                                }`}
                                onClick={() => router.push(`/dashboard/portfolio/${stock.ticker}?date=${startDate}`)}
                              >
                                <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                  <div className="flex items-center gap-2">
                                    {stock.target && (
                                      <span className="text-yellow-500 text-sm" title="Target Stock">
                                        ⭐
                                      </span>
                                    )}
                                    {stock.ticker}
                                  </div>
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatNumber(stock.signal_score)}
                                </td>
                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                                  parseNumericValue(stock.sentiment_score) >= 60 && parseNumericValue(stock.rule1_score) >= 85 && parseNumericValue(stock.moat_score) >= 85 && parseNumericValue(stock.management_score) >= 85
                                    ? 'text-green-600 dark:text-green-400 font-bold'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatNumber(stock.sentiment_score)}
                                </td>
                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                                  parseNumericValue(stock.sentiment_score) >= 60 && parseNumericValue(stock.rule1_score) >= 85 && parseNumericValue(stock.moat_score) >= 85 && parseNumericValue(stock.management_score) >= 85
                                    ? 'text-green-600 dark:text-green-400 font-bold'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatNumber(stock.rule1_score)}
                                </td>
                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                                  parseNumericValue(stock.sentiment_score) >= 60 && parseNumericValue(stock.rule1_score) >= 85 && parseNumericValue(stock.moat_score) >= 85 && parseNumericValue(stock.management_score) >= 85
                                    ? 'text-green-600 dark:text-green-400 font-bold'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatNumber(stock.moat_score)}
                                </td>
                                <td className={`px-3 py-4 whitespace-nowrap text-sm ${
                                  parseNumericValue(stock.sentiment_score) >= 60 && parseNumericValue(stock.rule1_score) >= 85 && parseNumericValue(stock.moat_score) >= 85 && parseNumericValue(stock.management_score) >= 85
                                    ? 'text-green-600 dark:text-green-400 font-bold'
                                    : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {formatNumber(stock.management_score)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatBuyPrice(stock.buy_price)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stock.per_upside !== null && stock.per_upside !== undefined ? `${Math.round(stock.per_upside)}%` : '-'}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stock.last_price ? `$${formatNumber(stock.last_price)}` : '-'}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatNumber((stock as any).long_gr)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatNumber((stock as any).last_gr)}
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {(() => {
                                    if (!stock.last_action || stock.last_action === '' || stock.last_action === null) return '-';
                                    const date = new Date(stock.last_action);
                                    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US');
                                  })()
                                  }
                                </td>
                                <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {stock.per_port !== null && stock.per_port !== undefined ? `${stock.per_port}%` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {language === 'fr' ? 'Aucun ticker trouvé pour ce guru' : 'No tickers found for this guru'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredGurus.length === 0 && gurus.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'fr' ? 'Aucun guru trouvé pour cette recherche' : 'No gurus found for this search'}
          </p>
        </div>
      )}

      {gurus.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {t('noGurusFound')}
          </p>
        </div>
      )}
    </div>
  );
}
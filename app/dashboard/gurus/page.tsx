'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/app/contexts/settings-context';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/app/lib/utils';
import DatePickerInput from '@/app/ui/date-picker';

interface GuruStock {
  ticker_id: number;
  ticker: string;
  signal: number;
  sentiment: number;
  rule1_score: string;
  moat_score: string;
  management_score: string;
  buy_price: string;
  upside_percent: string;
  current_price: string;
  analyst_growth: string;
  composite_growth: string;
  last_action: string;
  portfolio_percent: string;
}

interface Guru {
  guru_name: string;
  guru_id: number;
  stocks: GuruStock[];
}

interface ApiResponse {
  date: string;
  total_gurus: number;
  total_stocks: number;
  gurus: Guru[];
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
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [expandedGuru, setExpandedGuru] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { t, language } = useSettings();
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate && apiData) {
      fetchDataForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/stocks/gurus/portfolios/latest');
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      setApiData(data);
      setSelectedDate(new Date(data.date));
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataForDate = async (date: Date) => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/stocks/gurus/portfolios/${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data: ApiResponse = await response.json();
      setApiData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data for selected date');
    } finally {
      setLoading(false);
    }
  };

  const handleGuruClick = (guruId: number) => {
    setExpandedGuru(expandedGuru === guruId ? null : guruId);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleTickerClick = (ticker: string) => {
    const dateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    router.push(`/dashboard/portfolio/${ticker}?date=${dateStr}`);
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
          onClick={fetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const filteredGurus = apiData?.gurus.filter(guru => 
    guru.guru_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('gurus')}
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredGurus.length} of {apiData?.total_gurus || 0} {t('gurus').toLowerCase()}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {language === 'fr' ? 'Date des données' : 'Data Date'}
          </label>
          <div className="w-full sm:w-64">
            <DatePickerInput
              selectedDate={selectedDate}
              onChange={handleDateChange}
              placeholder={language === 'fr' ? 'Sélectionner une date...' : 'Select date...'}
            />
          </div>
        </div>
        {selectedDate && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            {language === 'fr' ? 'Données du' : 'Data from'}: {selectedDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
          </div>
        )}
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
                    {guru.stocks.length} {t('tickers')}
                  </p>
                </div>
              </div>
            </button>

            {expandedGuru === guru.guru_id && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="p-6">
                  {guru.stocks.length > 0 ? (
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
                        {guru.stocks.map((stock) => (
                          <tr
                            key={stock.ticker_id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleTickerClick(stock.ticker)}
                          >
                            <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {stock.ticker}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.signal}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.sentiment}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.rule1_score}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.moat_score}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.management_score}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              ${stock.buy_price}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.upside_percent}%
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              ${stock.current_price}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.analyst_growth}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.composite_growth}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.last_action}
                            </td>
                            <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {stock.portfolio_percent}
                            </td>
                          </tr>
                        ))}
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

      {filteredGurus.length === 0 && apiData && apiData.gurus.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {language === 'fr' ? 'Aucun guru trouvé pour cette recherche' : 'No gurus found for this search'}
          </p>
        </div>
      )}

      {!apiData || apiData.gurus.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {t('noGurusFound')}
          </p>
        </div>
      )}
    </div>
  );
}
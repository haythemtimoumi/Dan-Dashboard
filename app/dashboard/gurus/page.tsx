'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/app/contexts/settings-context';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

export default function GurusPage() {
  const [gurus, setGurus] = useState<Guru[]>([]);
  const [expandedGuru, setExpandedGuru] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, language } = useSettings();
  const router = useRouter();

  useEffect(() => {
    fetchGurus();
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

  const handleGuruClick = (guruId: number) => {
    setExpandedGuru(expandedGuru === guruId ? null : guruId);
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
                <div className="px-6 py-4">
                  <div className="grid gap-2">
                    {guru.tickers.map((ticker) => (
                      <button
                        key={ticker.symbol}
                        onClick={() => handleTickerClick(ticker.symbol)}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {ticker.symbol}
                          </span>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {ticker.scrape_type}
                          </span>
                        </div>
                        <div className="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                          {ticker.per_port !== null && (
                            <span className="font-medium">{ticker.per_port}%</span>
                          )}
                          {ticker.last_act && (
                            <span className="text-xs">{new Date(ticker.last_act).toLocaleDateString()}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
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
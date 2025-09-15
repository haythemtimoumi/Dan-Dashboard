'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/app/contexts/settings-context';

interface TickerViewData {
  symbol: string;
  stock_ticker: string;
  ticker_view: string;
  last_updated_at: string | null;
}

interface TickerViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
}

export function TickerViewModal({ isOpen, onClose, ticker }: TickerViewModalProps) {
  const { language } = useSettings();
  const [tickerData, setTickerData] = useState<TickerViewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && ticker) {
      fetchTickerData();
    }
  }, [isOpen, ticker]);

  const fetchTickerData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/stocks/tickers-with-view');
      if (response.ok) {
        const data = await response.json();
        const tickerInfo = data.find((item: TickerViewData) => item.symbol === ticker);
        setTickerData(tickerInfo || null);
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {language === 'fr' ? 'Informations du Ticker' : 'Ticker Information'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{ticker}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : tickerData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Symbole' : 'Symbol'}
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{tickerData.symbol}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Ticker Stock' : 'Stock Ticker'}
                </label>
                <p className="text-gray-900 dark:text-white font-mono text-sm bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border">
                  {tickerData.stock_ticker}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Vue du Ticker' : 'Ticker View'}
                </label>
                <p className="text-gray-900 dark:text-white">{tickerData.ticker_view}</p>
              </div>

              {tickerData.last_updated_at && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Dernière Mise à Jour' : 'Last Updated'}
                  </label>
                  <p className="text-gray-900 dark:text-white text-sm">
                    {new Date(tickerData.last_updated_at).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 dark:text-gray-400">
                {language === 'fr' ? 'Aucune information trouvée pour ce ticker' : 'No information found for this ticker'}
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-600">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
            >
              {language === 'fr' ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
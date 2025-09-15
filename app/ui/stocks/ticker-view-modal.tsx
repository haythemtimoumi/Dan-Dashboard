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
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ ticker_view: '', stock_ticker: '' });
  const [saving, setSaving] = useState(false);

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
        if (tickerInfo) {
          setEditData({ ticker_view: tickerInfo.ticker_view, stock_ticker: tickerInfo.stock_ticker });
        }
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [];
      if (editData.ticker_view !== (tickerData?.ticker_view || '')) {
        updates.push(
          fetch(`/api/stocks/ticker/${ticker}/ticker-view`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticker_view: editData.ticker_view })
          })
        );
      }
      if (editData.stock_ticker !== (tickerData?.stock_ticker || '')) {
        updates.push(
          fetch(`/api/stocks/ticker/${ticker}/stock-ticker`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stock_ticker: editData.stock_ticker })
          })
        );
      }
      await Promise.all(updates);
      setTickerData({ 
        symbol: ticker,
        stock_ticker: editData.stock_ticker,
        ticker_view: editData.ticker_view,
        last_updated_at: new Date().toISOString()
      });
      setEditing(false);
      await fetchTickerData();
    } catch (error) {
      console.error('Error updating ticker:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'fr' ? 'Ticker Info' : 'Ticker Info'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{ticker}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {language === 'fr' ? 'Chargement...' : 'Loading...'}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'fr' ? 'Stock Ticker' : 'Stock Ticker'}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.stock_ticker}
                    onChange={(e) => setEditData({ ...editData, stock_ticker: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter stock ticker"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <span className="text-sm font-mono text-gray-900 dark:text-white">
                      {tickerData?.stock_ticker || (language === 'fr' ? 'Non défini' : 'Not set')}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {language === 'fr' ? 'Ticker View' : 'Ticker View'}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={editData.ticker_view}
                    onChange={(e) => setEditData({ ...editData, ticker_view: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ticker view"
                  />
                ) : (
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {tickerData?.ticker_view || (language === 'fr' ? 'Non défini' : 'Not set')}
                    </span>
                  </div>
                )}
              </div>

              {tickerData?.last_updated_at && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'fr' ? 'Mis à jour:' : 'Updated:'} {new Date(tickerData.last_updated_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

        </div>
        <div className="flex justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          {editing ? (
            <button
              onClick={async () => {
                if (confirm(language === 'fr' ? 'Supprimer les données?' : 'Delete data?')) {
                  setSaving(true);
                  try {
                    await Promise.all([
                      fetch(`/api/stocks/ticker/${ticker}/ticker-view`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ticker_view: '' })
                      }),
                      fetch(`/api/stocks/ticker/${ticker}/stock-ticker`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ stock_ticker: '' })
                      })
                    ]);
                    setEditData({ ticker_view: '', stock_ticker: '' });
                    setTickerData(null);
                    setEditing(false);
                  } catch (error) {
                    console.error('Error clearing data:', error);
                  } finally {
                    setSaving(false);
                  }
                }
              }}
              disabled={saving}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
            >
              {language === 'fr' ? 'Vider' : 'Clear'}
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditData({ ticker_view: tickerData?.ticker_view || '', stock_ticker: tickerData?.stock_ticker || '' });
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...') : (language === 'fr' ? 'Sauvegarder' : 'Save')}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  {language === 'fr' ? 'Fermer' : 'Close'}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {language === 'fr' ? 'Modifier' : 'Edit'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
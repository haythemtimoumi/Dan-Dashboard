'use client';

import { useState, useEffect, useRef } from 'react';
import { useSettings } from '@/app/contexts/settings-context';

interface MissingTicker {
  symbol: string;
  scrape_status: string;
}

export default function MissingAnalysisDropdown() {
  const { language } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [missingTickers, setMissingTickers] = useState<MissingTicker[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch missing analysis data
  const fetchMissingAnalysis = async () => {
    if (missingTickers.length > 0) return; // Don't refetch if we already have data
    
    setLoading(true);
    try {
      const response = await fetch('/api/tickers/missing-analysis');
      if (response.ok) {
        const data = await response.json();
        setMissingTickers(data);
      }
    } catch (error) {
      console.error('Error fetching missing analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchMissingAnalysis();
    }
    setIsOpen(!isOpen);
  };

  const handleDelete = async (symbol: string) => {
    setDeleting(symbol);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      // Find the ticker ID first
      const tickersResponse = await fetch('https://www.mytickerlist.com/api/tickers');
      if (tickersResponse.ok) {
        const tickers = await tickersResponse.json();
        const ticker = tickers.find((t: any) => t.symbol === symbol);
        if (ticker) {
          const response = await fetch(`https://www.mytickerlist.com/api/tickers/${ticker.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            setMissingTickers(prev => prev.filter(t => t.symbol !== symbol));
          }
        }
      }
    } catch (error) {
      console.error('Error deleting ticker:', error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-800"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        {language === 'fr' ? 'En Cours' : 'In Progress'}
        {missingTickers.length > 0 && (
          <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {missingTickers.length}
          </span>
        )}
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {language === 'fr' ? 'Analyses en cours' : 'Analysis in progress'}
            </h3>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {language === 'fr' ? 'Chargement...' : 'Loading...'}
                </p>
              </div>
            ) : missingTickers.length === 0 ? (
              <div className="p-4 text-center">
                <svg className="w-8 h-8 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'fr' ? 'Toutes les analyses sont à jour!' : 'All analysis up to date!'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {missingTickers.map((ticker) => (
                  <div
                    key={ticker.symbol}
                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticker.symbol}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ticker.symbol);
                      }}
                      disabled={deleting === ticker.symbol}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-all disabled:opacity-50"
                      title={language === 'fr' ? 'Supprimer' : 'Delete'}
                    >
                      {deleting === ticker.symbol ? (
                        <div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
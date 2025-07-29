'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/app/contexts/settings-context';
import { useAuth } from '@/app/contexts/auth-context';

interface Analytics {
  overview: {
    totalStocks: number;
    totalTickers: number;
    activeTickers: number;
    stocksWithBuyPrice: number;
    avgSentiment: number;
    avgSignal: number;
    avgGrowthRate: number;
  };
  distribution: {
    sources: { [key: string]: number };
    sentimentRanges: {
      high: number;
      medium: number;
      low: number;
    };
  };
  activity: {
    recentStocks: number;
    dailyAverage: number;
  };
  topPerformers: Array<{
    ticker: string;
    sentiment_score: number;
    signal_score: number;
    source: string;
  }>;
}

export default function DashboardAnalytics() {
  const { language } = useSettings();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://www.mytickerlist.com/api/analytics');
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {language === 'fr' ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {language === 'fr' ? 'Tableau de Bord Analytique' : 'Analytics Dashboard'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {language === 'fr' ? 'Vue d\'ensemble des métriques et performances' : 'Overview of metrics and performance'}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">{language === 'fr' ? 'Total Actions' : 'Total Stocks'}</p>
              <p className="text-3xl font-bold">{analytics.overview.totalStocks}</p>
            </div>
            <div className="h-12 w-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">{language === 'fr' ? 'Sentiment Moyen' : 'Avg Sentiment'}</p>
              <p className="text-3xl font-bold">{analytics.overview.avgSentiment}</p>
            </div>
            <div className="h-12 w-12 bg-green-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{language === 'fr' ? 'Signal Moyen' : 'Avg Signal'}</p>
              <p className="text-3xl font-bold">{analytics.overview.avgSignal}</p>
            </div>
            <div className="h-12 w-12 bg-purple-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">{language === 'fr' ? 'Avec Prix d\'Achat' : 'With Buy Price'}</p>
              <p className="text-3xl font-bold">{analytics.overview.stocksWithBuyPrice}</p>
            </div>
            <div className="h-12 w-12 bg-orange-400 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Distribution par Source' : 'Source Distribution'}
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.distribution.sources).map(([source, count]) => (
              <div key={source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{source}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(count / analytics.overview.totalStocks) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Distribution du Sentiment' : 'Sentiment Distribution'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600">{language === 'fr' ? 'Élevé (≥70)' : 'High (≥70)'}</span>
              <span className="text-lg font-bold text-green-600">{analytics.distribution.sentimentRanges.high}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-yellow-600">{language === 'fr' ? 'Moyen (40-69)' : 'Medium (40-69)'}</span>
              <span className="text-lg font-bold text-yellow-600">{analytics.distribution.sentimentRanges.medium}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">{language === 'fr' ? 'Faible (<40)' : 'Low (<40)'}</span>
              <span className="text-lg font-bold text-red-600">{analytics.distribution.sentimentRanges.low}</span>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Activité Récente' : 'Recent Activity'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Actions (7 derniers jours)' : 'Stocks (Last 7 days)'}</span>
              <span className="text-2xl font-bold text-blue-600">{analytics.activity.recentStocks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Moyenne quotidienne' : 'Daily Average'}</span>
              <span className="text-2xl font-bold text-green-600">{analytics.activity.dailyAverage}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{language === 'fr' ? 'Tickers actifs' : 'Active Tickers'}</span>
              <span className="text-2xl font-bold text-purple-600">{analytics.overview.activeTickers}</span>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {language === 'fr' ? 'Meilleures Performances' : 'Top Performers'}
          </h3>
          <div className="space-y-3">
            {analytics.topPerformers.map((stock, index) => (
              <div key={stock.ticker} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 w-4">#{index + 1}</span>
                  <span className="font-bold text-blue-600">{stock.ticker}</span>
                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">{stock.source}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-green-600">{stock.sentiment_score}</div>
                  <div className="text-xs text-gray-500">Signal: {stock.signal_score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
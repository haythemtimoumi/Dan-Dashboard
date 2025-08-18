'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/app/contexts/settings-context';

interface NewsItem {
  title: string;
  url: string;
  time_published: string;
  summary: string;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
}

interface NewsSectionProps {
  ticker: string;
}

export default function NewsSection({ ticker }: NewsSectionProps) {
  const { language } = useSettings();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&apikey=06NWG6OH8CD1FO59&limit=5`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }
        
        const data = await response.json();
        
        if (data.feed) {
          setNews(data.feed.slice(0, 5));
        } else {
          setNews([]);
        }
      } catch (err) {
        setError('Failed to load news');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (ticker) {
      fetchNews();
    }
  }, [ticker]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'bullish': return 'text-green-600 dark:text-green-400';
      case 'bearish': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {language === 'fr' ? 'Actualités' : 'News'}
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || news.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {language === 'fr' ? 'Actualités' : 'News'}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {language === 'fr' ? 'Aucune actualité disponible' : 'No news available'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        {language === 'fr' ? `Actualités ${ticker}` : `${ticker} News`}
      </h3>
      <div className="space-y-3">
        {news.map((item, index) => (
          <div key={index} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 pb-3 last:pb-0">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-2 -m-2 transition-colors"
            >
              <h4 className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                {item.title}
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  {formatDate(item.time_published)}
                </span>
                <span className={`font-medium ${getSentimentColor(item.overall_sentiment_label)}`}>
                  {item.overall_sentiment_label}
                </span>
              </div>
              {item.summary && (
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                  {item.summary.substring(0, 100)}...
                </p>
              )}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
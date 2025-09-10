'use client';

import React, { useEffect, useRef } from 'react';
import { useSettings } from '@/app/contexts/settings-context';

interface TradingViewWidgetProps {
  ticker: string;
  height?: string;
  width?: string;
}

function TradingViewWidget({ ticker, height = "400px", width = "100%" }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);
  const { language } = useSettings();
  const widgetId = `tradingview_${ticker}_${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const containerElement = container.current;
    if (!containerElement || !ticker) return;

    containerElement.innerHTML = `<div id="${widgetId}" style="height: ${height}; width: ${width};"></div>`;

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          container_id: widgetId,
          width: width,
          height: height,
          symbol: ticker,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: language === 'fr' ? 'fr' : 'en',
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (containerElement) {
        containerElement.innerHTML = '';
      }
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [ticker, language, height, width, widgetId]);

  return (
    <div className="tradingview-widget-container bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {language === 'fr' ? `Graphique ${ticker}` : `${ticker} Chart`}
        </h3>
      </div>
      <div 
        key={ticker}
        className="tradingview-widget-container__widget" 
        ref={container}
        style={{ height, width }}
      >
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
      <div className="tradingview-widget-copyright px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
        <a 
          href="https://www.tradingview.com/" 
          rel="noopener nofollow" 
          target="_blank"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {language === 'fr' ? `Graphiques ${ticker} par TradingView` : `${ticker} charts by TradingView`}
        </a>
      </div>
    </div>
  );
}

export default TradingViewWidget;

declare global {
  interface Window {
    TradingView: any;
  }
}
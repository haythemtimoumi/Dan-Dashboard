'use client';

import { Stock } from '@/app/lib/definitions';
import { formatCurrency } from '@/app/lib/utils';
import { useSettings } from '@/app/contexts/settings-context';

interface StockTooltipProps {
  stock: Stock;
  isVisible: boolean;
  position: { x: number; y: number };
}

export function StockTooltip({ stock, isVisible, position }: StockTooltipProps) {
  const { language } = useSettings();

  if (!isVisible) return null;

  return (
    <div
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-3 min-w-48"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        pointerEvents: 'none'
      }}
    >
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {stock.full_name || stock.ticker}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/tabs';
import StocksTable from '@/app/ui/stocks/table';
import { StocksTableSkeleton } from '@/app/ui/skeletons';
import { fetchStocksByDateAndSource } from '@/app/lib/data';
import { Stock } from '@/app/lib/definitions';
import DatePickerWrapper from './date-picker-wrapper';

export default function SourcesClient({ initialDate }: { initialDate?: string }) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSource, setCurrentSource] = useState<'rule1' | 'manual'>('rule1');
  const [currentDate, setCurrentDate] = useState<string>(
    initialDate ? formatDateFromURL(initialDate) : getDefaultDate()
  );
  const [sortBy, setSortBy] = useState<string>('sentiment_score');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const router = useRouter();

  function getDefaultDate(): string {
    return '06/06/2025'; // Safe fallback for demo
  }

  function formatDateForAPI(date: Date): string {
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  }

  function formatDateFromURL(date: string): string {
    if (date.includes('-')) {
      const [year, month, day] = date.split('-');
      return `${month}/${day}/${year}`;
    }
    return date;
  }

  function formatDateForURL(date: string): string {
    const [month, day, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    fetchStocks(currentDate, currentSource);
  }, [currentDate, currentSource]);

  const fetchStocks = async (date: string, source: 'rule1' | 'manual') => {
    setLoading(true);
    setStocks([]);
    try {
      console.log(`[DEBUG] Fetching stocks for ${date} from ${source}`);
      const data = await fetchStocksByDateAndSource(date, source);
      console.log(`[DEBUG] Got ${data.length} stocks`);
      setStocks(data);
    } catch (error) {
      console.error(`[ERROR] Failed to fetch stocks:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDate = async (selectedDate: Date | null) => {
    const dateStr = selectedDate ? formatDateForAPI(selectedDate) : getDefaultDate();
    setCurrentDate(dateStr);

    if (selectedDate) {
      router.push(`/dashboard/sources?date=${formatDateForURL(dateStr)}`);
    } else {
      router.push('/dashboard/sources');
    }
  };

  const handleSourceChange = (source: 'rule1' | 'manual') => {
    setCurrentSource(source);
  };
  
  // Handle sorting changes
  const handleSortChange = (field: string, order: string) => {
    setSortBy(field);
    setSortOrder(order);
  };
  
  // Listen for URL changes to update sorting
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSortBy = params.get('sortBy');
    const urlSortOrder = params.get('sortOrder');
    
    if (urlSortBy) setSortBy(urlSortBy);
    if (urlSortOrder) setSortOrder(urlSortOrder);
  }, []);

  return (
    <>
      <div className="mt-4">
        <DatePickerWrapper 
          onApply={handleApplyDate} 
          initialDate={initialDate} 
        />
      </div>

      {loading ? (
        <StocksTableSkeleton />
      ) : (
        <div className="mt-6">
          <Tabs defaultValue={currentSource}>
            <TabsList>
              <TabsTrigger value="rule1" onClick={() => handleSourceChange('rule1')}>
                rule1
              </TabsTrigger>
              <TabsTrigger value="manual" onClick={() => handleSourceChange('manual')}>
                manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rule1">
              <StockTabContent 
                stocks={stocks} 
                source="rule1" 
                date={currentDate} 
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </TabsContent>

            <TabsContent value="manual">
              <StockTabContent 
                stocks={stocks} 
                source="manual" 
                date={currentDate} 
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
}

function StockTabContent({ stocks, source, date, sortBy, sortOrder }: { stocks: Stock[]; source: string; date: string; sortBy: string; sortOrder: string }) {
  if (stocks.length === 0) {
    return (
      <div className="mt-6 text-center p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600 font-medium">
          No {source} stocks found for {date}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Try selecting a different date
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-medium">{source} Stocks - {date}</h2>
        <span className="text-sm text-gray-500">
          Showing {stocks.length} stocks
        </span>
      </div>
      <StocksTable stocks={stocks} sortBy={sortBy} sortOrder={sortOrder} />
    </div>
  );
}

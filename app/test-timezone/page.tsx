'use client';

import { useState, useEffect } from 'react';
import { formatDateForHighlightedAPI, formatDateForPortfolioAPI, parseDateString, getTodayLocal } from '@/app/lib/date-utils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/app/ui/datepicker-custom.css';

export default function TestTimezone() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(getTodayLocal());
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Log timezone information on mount
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset() / -60;
    
    setTestResults([
      `Current timezone: ${timezone}`,
      `Timezone offset: UTC${offset >= 0 ? '+' : ''}${offset} hours`,
      `Current local time: ${new Date().toString()}`,
      `Current UTC time: ${new Date().toUTCString()}`
    ]);
  }, []);

  // Test the date utilities
  const testDateUtils = () => {
    if (!selectedDate) return;
    
    setLoading(true);
    
    const results = [
      '=== Date Utility Test Results ===',
      `Selected date: ${selectedDate.toString()}`,
      `Highlighted API format: ${formatDateForHighlightedAPI(selectedDate)}`,
      `Portfolio API format: ${formatDateForPortfolioAPI(selectedDate)}`,
      '',
      '=== Date Parsing Test ==='
    ];
    
    // Test parsing MM/DD/YYYY format
    const dateStr1 = formatDateForPortfolioAPI(selectedDate);
    const parsed1 = parseDateString(dateStr1);
    results.push(`Parsed "${dateStr1}": ${parsed1?.toString() || 'null'}`);
    results.push(`Back to highlighted API: ${parsed1 ? formatDateForHighlightedAPI(parsed1) : 'null'}`);
    
    // Test parsing YYYY-MM-DD format
    const dateStr2 = formatDateForHighlightedAPI(selectedDate);
    const parsed2 = parseDateString(dateStr2);
    results.push(`Parsed "${dateStr2}": ${parsed2?.toString() || 'null'}`);
    results.push(`Back to portfolio API: ${parsed2 ? formatDateForPortfolioAPI(parsed2) : 'null'}`);
    
    setTestResults(prev => [...prev, '', ...results]);
    setLoading(false);
  };

  // Test the API endpoints
  const testApiEndpoints = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    
    const results = [
      '=== API Endpoint Test Results ===',
      `Testing date: ${selectedDate.toString()}`
    ];
    
    try {
      // Format dates for API calls
      const highlightedDate = formatDateForHighlightedAPI(selectedDate);
      const portfolioDate = formatDateForPortfolioAPI(selectedDate);
      
      results.push(`Highlighted API date: ${highlightedDate}`);
      results.push(`Portfolio API date: ${portfolioDate}`);
      
      // Test highlighted API
      results.push('');
      results.push('Testing Highlighted Stocks API...');
      const highlightedUrl = `https://www.mytickerlist.com/api/stocks/highlighted/filter?startDate=${highlightedDate}&endDate=${highlightedDate}`;
      results.push(`URL: ${highlightedUrl}`);
      
      const highlightedResponse = await fetch(highlightedUrl);
      if (!highlightedResponse.ok) {
        results.push(`Error: ${highlightedResponse.status} ${highlightedResponse.statusText}`);
      } else {
        const highlightedData = await highlightedResponse.json();
        const stocksCount = Array.isArray(highlightedData) ? highlightedData.length : 
                           (highlightedData.stocks ? highlightedData.stocks.length : 0);
        
        results.push(`Success! Found ${stocksCount} highlighted stocks`);
        
        if (stocksCount > 0) {
          const stocks = Array.isArray(highlightedData) ? highlightedData : highlightedData.stocks;
          results.push('Sample stocks:');
          stocks.slice(0, 3).forEach((stock: any) => {
            results.push(`- ${stock.ticker} (${stock.date || stock.created_at})`);
          });
        }
      }
      
      // Test portfolio API
      results.push('');
      results.push('Testing Portfolio List API...');
      const portfolioUrl = `https://www.mytickerlist.com/api/stocks/filter-by-date-source?date=${encodeURIComponent(portfolioDate)}&source=manual`;
      results.push(`URL: ${portfolioUrl}`);
      
      const portfolioResponse = await fetch(portfolioUrl);
      if (!portfolioResponse.ok) {
        results.push(`Error: ${portfolioResponse.status} ${portfolioResponse.statusText}`);
      } else {
        const portfolioData = await portfolioResponse.json();
        const stocksCount = Array.isArray(portfolioData) ? portfolioData.length : 
                           (portfolioData.stocks ? portfolioData.stocks.length : 0);
        
        results.push(`Success! Found ${stocksCount} portfolio stocks`);
        
        if (stocksCount > 0) {
          const stocks = Array.isArray(portfolioData) ? portfolioData : portfolioData.stocks;
          results.push('Sample stocks:');
          stocks.slice(0, 3).forEach((stock: any) => {
            results.push(`- ${stock.ticker} (${stock.date || stock.created_at})`);
          });
        }
      }
      
    } catch (error) {
      results.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setTestResults(prev => [...prev, '', ...results]);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Timezone Fix Test Page</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Timezone Information</h2>
        <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
          {testResults.slice(0, 4).join('\n')}
        </pre>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Date Utilities</h2>
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select a date to test</label>
            <DatePicker
              selected={selectedDate}
              onChange={setSelectedDate}
              dateFormat="MM/dd/yyyy"
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
          </div>
          <button
            onClick={testDateUtils}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            Test Date Utils
          </button>
          <button
            onClick={testApiEndpoints}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Test API Endpoints
          </button>
        </div>
        
        {testResults.length > 4 && (
          <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap max-h-96 overflow-y-auto">
            {testResults.slice(4).join('\n')}
          </pre>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Dashboard Links</h2>
        <div className="flex flex-col gap-2">
          <a 
            href="/dashboard/highlighted" 
            className="text-blue-600 hover:underline"
          >
            Go to Highlighted Stocks
          </a>
          <a 
            href="/dashboard/portfolio-list" 
            className="text-blue-600 hover:underline"
          >
            Go to Portfolio List
          </a>
        </div>
      </div>
    </div>
  );
}
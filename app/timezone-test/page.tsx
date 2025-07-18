'use client';

import { useState, useEffect } from 'react';
import { formatDateForHighlightedAPI, formatDateForDisplay, parseDateString, getTodayLocal } from '@/app/lib/date-utils';

export default function TimezoneTestPage() {
  const [localTime, setLocalTime] = useState('');
  const [utcTime, setUtcTime] = useState('');
  const [testDate, setTestDate] = useState('2025-07-17');
  const [formattedDates, setFormattedDates] = useState<any>({});
  
  useEffect(() => {
    // Update times every second
    const timer = setInterval(() => {
      const now = new Date();
      setLocalTime(now.toString());
      setUtcTime(now.toUTCString());
    }, 1000);
    
    updateFormattedDates('2025-07-17');
    
    return () => clearInterval(timer);
  }, []);
  
  const updateFormattedDates = (dateStr: string) => {
    const date = new Date(dateStr);
    const utcNoon = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    const localFormatted = formatDateForDisplay(date);
    
    setFormattedDates({
      original: date.toString(),
      utcNoon: utcNoon.toString(),
      localFormatted,
      isoString: date.toISOString(),
      utcString: date.toUTCString(),
      apiFormat: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      slashFormat: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`
    });
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setTestDate(newDate);
    updateFormattedDates(newDate);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Timezone Test Page</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Your Current Time Information</h2>
        <p><strong>Browser Timezone:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        <p><strong>Local Time:</strong> {localTime}</p>
        <p><strong>UTC Time:</strong> {utcTime}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Test Date Formatting</h2>
        <div className="mb-4">
          <label htmlFor="testDate" className="block mb-2">Select a date to test:</label>
          <input 
            type="date" 
            id="testDate" 
            value={testDate} 
            onChange={handleDateChange}
            className="border rounded p-2"
          />
        </div>
        
        <div className="bg-white p-3 rounded">
          <h3 className="font-medium mb-2">Date Representations:</h3>
          <ul className="space-y-1">
            {Object.entries(formattedDates).map(([key, value]) => (
              <li key={key}>
                <strong>{key}:</strong> {String(value)}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">API Test Links</h2>
        <p className="mb-2">Click these links to test the API responses:</p>
        <ul className="space-y-2">
          <li>
            <a 
              href={`/api/stocks/highlighted/filter?startDate=${testDate}&endDate=${testDate}`} 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Test Highlighted Stocks API for {testDate}
            </a>
          </li>
          <li>
            <a 
              href={`/api/stocks/filter-by-date-source?date=${formattedDates.slashFormat || ''}&source=manual`} 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Test Portfolio List API for {formattedDates.slashFormat || ''}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
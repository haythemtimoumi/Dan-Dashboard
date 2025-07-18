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
      <h1 className="text-2xl font-bold mb-6">Page de Test de Fuseau Horaire</h1>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Informations sur votre fuseau horaire</h2>
        <p><strong>Fuseau horaire du navigateur:</strong> {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        <p><strong>Heure locale:</strong> {localTime}</p>
        <p><strong>Heure UTC:</strong> {utcTime}</p>
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Test de formatage de date</h2>
        <div className="mb-4">
          <label htmlFor="testDate" className="block mb-2">Sélectionnez une date à tester:</label>
          <input 
            type="date" 
            id="testDate" 
            value={testDate} 
            onChange={handleDateChange}
            className="border rounded p-2"
          />
        </div>
        
        <div className="bg-white p-3 rounded">
          <h3 className="font-medium mb-2">Représentations de la date:</h3>
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
        <h2 className="text-lg font-semibold mb-2">Liens de test API</h2>
        <p className="mb-2">Cliquez sur ces liens pour tester les réponses API:</p>
        <ul className="space-y-2">
          <li>
            <a 
              href={`/api/stocks/highlighted/filter?startDate=${testDate}&endDate=${testDate}`} 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Tester l&apos;API des actions en vedette pour {testDate}
            </a>
          </li>
          <li>
            <a 
              href={`/api/stocks/filter-by-date-source?date=${formattedDates.slashFormat || ''}&source=manual`} 
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Tester l&apos;API de liste de portefeuille pour {formattedDates.slashFormat || ''}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
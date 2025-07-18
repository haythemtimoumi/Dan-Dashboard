'use client';

import { useState, useEffect } from 'react';

export default function TimezoneTest() {
  const [clientTime, setClientTime] = useState<string>('');
  const [serverTime, setServerTime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await fetch('/api/test-date');
        const data = await response.json();
        setServerTime(data.serverTime);
      } catch (error) {
        console.error('Error fetching server time:', error);
      } finally {
        setLoading(false);
      }
    };

    // Set client time
    const now = new Date();
    setClientTime(JSON.stringify({
      iso: now.toISOString(),
      utc: now.toUTCString(),
      local: now.toString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: now.getTimezoneOffset(),
      formatted: {
        'YYYY-MM-DD': now.toISOString().split('T')[0],
        'MM/DD/YYYY': `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`
      }
    }, null, 2));

    fetchServerTime();
  }, []);

  if (loading) {
    return <div className="p-4">Loading timezone test...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Timezone Debug Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 text-blue-600">Client Time (Your Browser)</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {clientTime}
          </pre>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2 text-green-600">Server Time</h3>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(serverTime, null, 2)}
          </pre>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Key Points:</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Client timezone offset: {new Date().getTimezoneOffset()} minutes from UTC</li>
          <li>• Server timezone: {serverTime?.timezone || 'Unknown'}</li>
          <li>• If you&apos;re in Canada (EST/EDT), your offset should be 300 or 240 minutes</li>
          <li>• The fix ensures dates are created in your local timezone, not UTC</li>
        </ul>
      </div>
    </div>
  );
}
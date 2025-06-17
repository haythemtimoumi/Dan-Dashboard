'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CalendarIcon } from '@heroicons/react/24/outline';

export default function DateRangeSelector({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);
  const [error, setError] = useState<string | null>(null);

  // Convert YYYY-MM-DD to MM/DD/YYYY for display
  const formatDateForDisplay = (dateString: string): string => {
    // Check if the date is already in MM/DD/YYYY format
    if (dateString.includes('/')) {
      return dateString;
    }
    
    // Otherwise, assume YYYY-MM-DD and convert
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  // Convert MM/DD/YYYY to YYYY-MM-DD for input element
  const formatDateForInput = (dateString: string): string => {
    // Check if the date is already in YYYY-MM-DD format
    if (dateString.includes('-')) {
      return dateString;
    }
    
    // Otherwise, assume MM/DD/YYYY and convert
    const [month, day, year] = dateString.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    try {
      const startDate = new Date(formatDateForInput(start));
      const endDate = new Date(formatDateForInput(end));
      
      if (startDate > endDate) {
        setError('Start date cannot be after end date');
        return;
      }
      
      // Use YYYY-MM-DD format for the API
      const formattedStart = formatDateForInput(start);
      const formattedEnd = formatDateForInput(end);
      
      // Update URL with new date parameters
      const params = new URLSearchParams();
      params.set('startDate', formattedStart);
      params.set('endDate', formattedEnd);
      
      router.push(`${pathname}?${params.toString()}`);
      setError(null);
    } catch (err) {
      setError('Invalid date format');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
      <div>
        <label htmlFor="startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
          <CalendarIcon className="h-4 w-4" />
          <span>Start Date (YYYY-MM-DD)</span>
        </label>
        <input
          id="startDate"
          type="date"
          className="block rounded-md border border-gray-200 py-2 px-3 text-sm"
          value={formatDateForInput(start)}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      
      <div>
        <label htmlFor="endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
          <CalendarIcon className="h-4 w-4" />
          <span>End Date (YYYY-MM-DD)</span>
        </label>
        <input
          id="endDate"
          type="date"
          className="block rounded-md border border-gray-200 py-2 px-3 text-sm"
          value={formatDateForInput(end)}
          onChange={(e) => setEnd(e.target.value)}
        />
      </div>
      
      <button
        type="submit"
        className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
      >
        Apply Filter
      </button>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
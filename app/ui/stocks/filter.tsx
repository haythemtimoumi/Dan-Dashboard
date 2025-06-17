'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

export default function StockFilter() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get current filter values from URL
  const currentQuery = searchParams.get('query') || '';
  const currentSource = searchParams.get('source') || '';
  const currentMinSentiment = searchParams.get('minSentiment') || '';
  const currentMaxPE = searchParams.get('maxPE') || '';
  const currentStartDate = searchParams.get('startDate') || '';
  const currentEndDate = searchParams.get('endDate') || '';
  const currentSortBy = searchParams.get('sortBy') || 'sentiment_score';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  // Handle search input with debounce
  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    replace(`${pathname}?${params.toString()}`);
  };

  // Validate date range
  const isValidDateRange = () => {
    if (currentStartDate && currentEndDate) {
      const start = new Date(currentStartDate);
      const end = new Date(currentEndDate);
      return start <= end;
    }
    return true;
  };

  // Check if date range is invalid
  const dateRangeError = !isValidDateRange();

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (currentQuery) count++;
    if (currentSource) count++;
    if (currentMinSentiment) count++;
    if (currentMaxPE) count++;
    if (currentStartDate) count++;
    if (currentEndDate) count++;
    return count;
  };
  
  const activeFiltersCount = countActiveFilters();
  
  // Handle sort changes
  const handleSortChange = (field: string) => {
    const params = new URLSearchParams(searchParams);
    
    // If already sorting by this field, toggle order
    if (currentSortBy === field) {
      const newOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      params.set('sortOrder', newOrder);
    } else {
      // Default to descending for new sort field
      params.set('sortBy', field);
      params.set('sortOrder', 'desc');
    }
    
    replace(`${pathname}?${params.toString()}`);
  };

  // Reset all filters
  const resetFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    replace(`${pathname}?${params.toString()}`);
    setIsFilterOpen(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Search and filter toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex flex-1 flex-shrink-0">
          <input
            className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
            placeholder="Search stocks..."
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={currentQuery}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
        </div>
        
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={clsx(
            "flex items-center gap-1 rounded-md border px-3 py-2 text-sm transition-colors",
            isFilterOpen 
              ? "bg-blue-500 text-white border-blue-600" 
              : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
          )}
        >
          {isFilterOpen ? (
            <>
              <XMarkIcon className="h-4 w-4" />
              <span>Close</span>
            </>
          ) : (
            <>
              <FunnelIcon className="h-4 w-4" />
              <span>Filter</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => handleSortChange(currentSortBy)}
          className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          <span>{currentSortOrder === 'asc' ? '↑' : '↓'}</span>
        </button>
      </div>
      
      {/* Advanced filters panel */}
      {isFilterOpen && (
        <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <select
                id="source"
                className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                value={currentSource}
                onChange={(e) => handleFilterChange('source', e.target.value)}
              >
                <option value="">All Sources</option>
                <option value="Rule 1">Rule 1</option>
                <option value="Magic Formula">Magic Formula</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="minSentiment" className="block text-sm font-medium text-gray-700 mb-1">
                Min Sentiment Score
              </label>
              <input
                id="minSentiment"
                type="number"
                min="0"
                max="100"
                className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                value={currentMinSentiment}
                onChange={(e) => handleFilterChange('minSentiment', e.target.value)}
                placeholder="Min score"
              />
            </div>
            
            <div>
              <label htmlFor="maxPE" className="block text-sm font-medium text-gray-700 mb-1">
                Max P/E Ratio
              </label>
              <input
                id="maxPE"
                type="number"
                min="0"
                className="block w-full rounded-md border border-gray-200 py-2 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                value={currentMaxPE}
                onChange={(e) => handleFilterChange('maxPE', e.target.value)}
                placeholder="Max P/E"
              />
            </div>
          </div>
          
          {/* Date range filter */}
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Start Date</span>
              </label>
              <input
                id="startDate"
                type="date"
                className={clsx(
                  "block w-full rounded-md border py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/30",
                  dateRangeError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                )}
                value={currentStartDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                max={currentEndDate || undefined}
              />
            </div>
            
            <div>
              <label htmlFor="endDate" className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                <CalendarIcon className="h-4 w-4" />
                <span>End Date</span>
              </label>
              <input
                id="endDate"
                type="date"
                className={clsx(
                  "block w-full rounded-md border py-2 px-3 text-sm focus:ring-2 focus:ring-blue-500/30",
                  dateRangeError ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                )}
                value={currentEndDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={currentStartDate || undefined}
              />
            </div>
          </div>
          
          {dateRangeError && (
            <p className="mt-2 text-sm text-red-600">Start date cannot be after end date</p>
          )}
          
          <div className="mt-4 flex justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'sentiment_score', label: 'Sentiment' },
                  { id: 'signal_score', label: 'Signal' },
                  { id: 'pe', label: 'P/E' },
                  { id: 'buy_price', label: 'Buy Price' }
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSortChange(option.id)}
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      currentSortBy === option.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={resetFilters}
              className="self-end rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
            >
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
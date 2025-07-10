'use client';

import { useState, useEffect } from 'react';
import { Stock } from '@/app/lib/definitions';
import { formatCurrency, getSentimentColor, getSourceBadgeColor, formatDate } from '@/app/lib/utils';
import clsx from 'clsx';
import { CalendarIcon, XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { HighlightedStocksExternalSkeleton, Pagination } from './highlighted-stocks-external-part1';
import { HighlightedStocksExternalPart3 } from './highlighted-stocks-external-part3';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stockdashboard.ddnsfree.com/api';

// Items per page for pagination
const ITEMS_PER_PAGE = 5;

export default function HighlightedStocksExternal() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<number>(0);

  // Fetch highlighted stocks
  useEffect(() => {
    const fetchHighlightedStocks = async () => {
      try {
        setLoading(true);
        // Use the API URL from environment variable
        const response = await fetch(`${API_URL}/stocks/highlighted`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch highlighted stocks: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Set the stocks without any modification
        setStocks(data);
        setFilteredStocks(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching highlighted stocks:', err);
        setError('Failed to load highlighted stocks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHighlightedStocks();
  }, []);

  // Apply date filters when they change
  useEffect(() => {
    if (stocks.length === 0) return;
    
    // Validate date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setDateError('Start date cannot be after end date');
        return;
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
    
    let filtered = [...stocks];
    let filterCount = 0;
    
    // Filter by start date
    if (startDate) {
      filterCount++;
      const startDateTime = new Date(startDate).getTime();
      filtered = filtered.filter(stock => 
        new Date(stock.created_at).getTime() >= startDateTime
      );
    }
    
    // Filter by end date
    if (endDate) {
      filterCount++;
      // Add one day to include the end date fully
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      filtered = filtered.filter(stock => 
        new Date(stock.created_at).getTime() < endDateTime.getTime()
      );
    }
    
    setActiveFilters(filterCount);
    setFilteredStocks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [startDate, endDate, stocks]);

  // Handle date filter changes
  const handleDateFilterChange = (name: string, value: string) => {
    if (name === 'startDate') {
      setStartDate(value);
    } else if (name === 'endDate') {
      setEndDate(value);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredStocks(stocks);
    setCurrentPage(1);
    setDateError(null);
  };
  
  // Import and use the Part3 component to render the UI
  return (
    <HighlightedStocksExternalPart3
      loading={loading}
      error={error}
      filteredStocks={filteredStocks}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      startDate={startDate}
      setStartDate={setStartDate}
      endDate={endDate}
      setEndDate={setEndDate}
      isFilterOpen={isFilterOpen}
      setIsFilterOpen={setIsFilterOpen}
      dateError={dateError}
      activeFilters={activeFilters}
      resetFilters={resetFilters}
      handleDateFilterChange={handleDateFilterChange}
    />
  );
}
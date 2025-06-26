import { Stock } from './definitions';

export const formatCurrency = (amount: number) => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$0.00';
  }
  // Check if the amount is already in dollars (less than 10000)
  // This handles cases where the amount is stored directly as dollars
  const divisor = amount < 10000 ? 1 : 100;
  return (amount / divisor).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
};

export const formatDateToLocal = (
  dateStr: string,
  locale: string = 'en-US',
) => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  const formatter = new Intl.DateTimeFormat(locale, options);
  return formatter.format(date);
};

export const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

export const generatePagination = (currentPage: number, totalPages: number) => {
  // If the total number of pages is 7 or less,
  // display all pages without any ellipsis.
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // If the current page is among the first 3 pages,
  // show the first 3, an ellipsis, and the last 2 pages.
  if (currentPage <= 3) {
    return [1, 2, 3, '...', totalPages - 1, totalPages];
  }

  // If the current page is among the last 3 pages,
  // show the first 2, an ellipsis, and the last 3 pages.
  if (currentPage >= totalPages - 2) {
    return [1, 2, '...', totalPages - 2, totalPages - 1, totalPages];
  }

  // If the current page is somewhere in the middle,
  // show the first page, an ellipsis, the current page and its neighbors,
  // another ellipsis, and the last page.
  return [
    1,
    '...',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '...',
    totalPages,
  ];
};

export const getSentimentColor = (score: number): string => {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-green-500';
  if (score >= 25) return 'text-yellow-500';
  if (score >= 0) return 'text-yellow-600';
  if (score >= -25) return 'text-orange-500';
  if (score >= -50) return 'text-orange-600';
  if (score >= -75) return 'text-red-500';
  return 'text-red-600';
};

export const getSourceBadgeColor = (source: string): string => {
  return source === 'Rule 1' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
};

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format as MM/DD/YYYY
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const isValidDateRange = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return true;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start <= end;
};